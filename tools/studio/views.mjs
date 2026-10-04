import { evaluateExpression } from '../_lib/final-rp-v2/expression.mjs';

const qualify = (name, namespace) => {
  if (typeof name !== 'string' || name.includes('$')) return null;
  name = name.replace(/^@/, '');
  return name.includes('.') ? name : `${namespace}.${name}`;
};
const visit = (value, fn) => {
  if (!value || typeof value !== 'object') return;
  fn(value);
  for (const child of Object.values(value)) visit(child, fn);
};

export function matchesView(view, fixture = {}) {
  if (!view.titleConditions?.length) return true;
  return view.titleConditions.every(expression => {
    const result = evaluateExpression(expression, { ...fixture.bindings, '#title_text': fixture.title ?? '' });
    return result.ok && result.value === true;
  });
}

export function buildViewCatalog(screens, documents) {
  const records = new Map();
  for (const screen of screens) {
    const doc = documents.get(screen.path);
    records.set(screen.control, { ...screen, value: doc?.[screen.declaration] });
  }
  const forms = [], used = new Set(), seen = new Set();
  for (const host of records.values()) {
    visit(host.value, node => {
      const ids = node.factory?.control_ids ?? (node.type === 'factory' ? node.control_ids : null);
      if (!ids) return;
      for (const [kind, reference] of Object.entries(ids)) {
        if (!['long_form', 'custom_form'].includes(kind)) continue;
        const root = records.get(qualify(reference, host.control.split('.')[0]));
        if (!root) continue;
        used.add(root.control); used.add(host.control);
        const routes = [];
        const traverse = (value, namespace, visited) => {
          if (!value || typeof value !== 'object') return;
          for (const [name, body] of Object.entries(value)) {
            if (name.includes('@') && body && typeof body === 'object') {
              const control = qualify(name.slice(name.indexOf('@') + 1), namespace);
              const conditions = (body.bindings || []).filter(binding => binding.target_property_name === '#visible' && typeof binding.source_property_name === 'string' && binding.source_property_name.includes('#title_text')).map(binding => binding.source_property_name);
              if (control && conditions.length) routes.push({ control, conditions });
              else if (control && records.has(control) && !visited.has(control)) {
                const next = new Set(visited); next.add(control);
                traverse(records.get(control).value, control.split('.')[0], next);
              }
            }
            if (body && typeof body === 'object') traverse(body, namespace, visited);
          }
        };
        traverse(root.value, root.control.split('.')[0], new Set([root.control]));
        for (const route of routes.length ? routes : [{ control: root.control, conditions: [] }]) {
          const id = `form:${root.control}:${route.control}:${kind}:${route.conditions.join('&')}`;
          if (seen.has(id)) continue;
          seen.add(id); used.add(route.control);
          const source = records.get(route.control) ?? root;
          const view = { id, kind: 'form', formType: kind === 'long_form' ? 'ActionForm' : 'ModalForm', control: route.control, renderControl: root.control, path: source.path, registered: source.registered, titleConditions: route.conditions, titleHint: null };
          const literals = route.conditions.flatMap(expression => [...expression.matchAll(/'([^'\\]*)'/g)].map(match => match[1])).filter(Boolean);
          view.titleHint = [...new Set(literals)].find(title => matchesView(view, { title })) ?? null;
          forms.push(view);
        }
      }
    });
  }
  const hud = [], other = [], components = [];
  for (const screen of screens) {
    const entry = { ...screen, id: `control:${screen.control}`, renderControl: screen.control };
    if (screen.control === 'hud.root_panel' || screen.control === 'hud.hud_screen') {
      const inputs=new Map(),markers=new Set(),visited=new Set(),readers=new Map();
      const inspect=control=>{
        if(visited.has(control))return;visited.add(control);
        const record=records.get(control);if(!record)return;
        visit(record.value,node=>{
          for(const binding of node.bindings||[]){
            if(typeof binding.binding_name==='string'&&binding.binding_name.startsWith('#')&&!['collection','collection_details'].includes(binding.binding_type))inputs.set(binding.binding_name,{name:binding.binding_name,path:record.path});
            if(binding.source_control_name&&typeof binding.source_property_name==='string'&&/^#[\w.-]+$/.test(binding.source_property_name))readers.set(binding.source_control_name+'|'+binding.source_property_name,{control:binding.source_control_name,name:binding.source_property_name,path:record.path});
            if(typeof binding.source_property_name==='string')for(const match of binding.source_property_name.matchAll(/'([^'\\]{2,80})'/g))markers.add(match[1]);
          }
          for(const key of Object.keys(node))if(key.includes('@')){const ref=qualify(key.slice(key.indexOf('@')+1),record.control.split('.')[0]);if(ref)inspect(ref);}
        });
      };
      inspect(screen.control);
      const bindings=[...inputs.values()].sort((a,b)=>a.name.localeCompare(b.name));
      hud.push({ ...entry, kind: 'hud',bindingInputs:bindings,controlInputs:[...readers.values()],protocolHints:[...markers].slice(0,24) });
    }
    else if (screen.type === 'screen') other.push({ ...entry, kind: 'screen' });
    else if (!used.has(screen.control)) components.push({ ...entry, kind: 'component' });
  }
  return { views: [...forms, ...hud, ...other, ...components], forms, hud, components };
}

export function prepareViewFixture(view, fixture = {}) {
  if (view.kind !== 'form' || matchesView(view, fixture)) return { fixture: structuredClone(fixture), matched: true };
  const next = { ...structuredClone(fixture), title: view.titleHint ?? '' };
  return { fixture: next, matched: matchesView(view, next) };
}

export function titleTextureRules(value) {
  const rules = [];
  visit(value, node => {
    if (node.target_property_name !== '#texture' || typeof node.source_property_name !== 'string') return;
    const match = node.source_property_name.match(/^\(\s*'([^']+)'\s*\+\s*\(\s*#title_text\s*-\s*'([^']+)'\s*\)\s*\)$/);
    if (match) rules.push({ texturePrefix: match[1], titlePrefix: match[2] });
  });
  return rules;
}
