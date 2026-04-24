(() => {
'use strict';

// ===== State =====
let jsonData = null;
let elements = [];       // flat list of {path, name, type, props, children}
let selectedPath = null;
let zoomLevel = 100;
let nudgeStep = 1;

// ===== DOM refs =====
const $ = s => document.querySelector(s);
const inputSection = $('#input-section');
const editorSection = $('#editor-section');
const jsonInput = $('#json-input');
const parseError = $('#parse-error');
const elementTree = $('#element-tree');
const propsContainer = $('#props-container');
const propsTitle = $('#props-title');
const previewScreen = $('#preview-screen');
const exportModal = $('#export-modal');
const jsonOutput = $('#json-output');

// ===== Example JSON =====
const EXAMPLE_JSON = {
  "namespace": "scoreboard",
  "scoreboard_sidebar_score": { "visible": false },
  "shimmer_sweep": {
    "anim_type": "offset", "easing": "linear", "duration": 3.5,
    "from": ["-20px", 0], "to": ["200px", 0],
    "next": "@scoreboard.shimmer_sweep"
  },
  "scoreboard_sidebar": {
    "type": "panel", "size": ["100%", "100%"],
    "controls": [{
      "default": {
        "type": "stack_panel", "size": ["100%cm", "100%c"],
        "offset": [-1, 0], "anchor_from": "right_middle", "anchor_to": "right_middle",
        "controls": [{
          "lines": {
            "type": "image", "texture": "#texture", "alpha": 0.35,
            "size": ["100%cm+3px", "100%c+5px"],
            "controls": [
              {
                "logo": {
                  "type": "panel", "size": [64, 10], "offset": [0, 3],
                  "anchor_from": "top_middle", "anchor_to": "top_middle", "layer": 1,
                  "controls": [
                    { "logo_image": { "type": "image", "texture": "textures/ui/scoreboard/logo_scoreboard", "size": ["100%", "100%"], "uv_size": [306, 66], "layer": 1 } },
                    { "shimmer_clip": {
                      "type": "panel", "size": [54, 10], "offset": [0, 0], "clips_children": true, "layer": 2,
                      "controls": [{ "shimmer": { "type": "image", "texture": "textures/ui/scoreboard/shimmer", "size": [18, 14], "uv_size": [80, 66], "anims": ["@scoreboard.shimmer_sweep"] } }]
                    }}
                  ]
                }
              },
              {
                "lists": {
                  "type": "panel", "anchor_from": "bottom_left", "anchor_to": "bottom_left",
                  "offset": [4, -3], "size": ["100%cm", "100%c"], "min_size": [90, "100%c"],
                  "controls": [{
                    "players": {
                      "type": "stack_panel", "anchor_from": "top_left", "anchor_to": "top_left",
                      "size": ["100%cm", "100%c"], "orientation": "vertical",
                      "collection_name": "scoreboard_players"
                    }
                  }]
                }
              }
            ]
          }
        }]
      }
    }]
  }
};

// ===== Anchor values =====
const ANCHORS = [
  'top_left', 'top_middle', 'top_right',
  'left_middle', 'center', 'right_middle',
  'bottom_left', 'bottom_middle', 'bottom_right'
];

// ===== Init =====
function init() {
  $('#btn-parse').addEventListener('click', parseJSON);
  $('#btn-load-example').addEventListener('click', loadExample);
  $('#btn-back').addEventListener('click', goBack);
  $('#btn-export').addEventListener('click', showExport);
  $('#btn-close-modal').addEventListener('click', () => exportModal.classList.remove('visible'));
  $('#btn-copy').addEventListener('click', copyJSON);
  $('#btn-download').addEventListener('click', downloadJSON);
  $('#btn-zoom-in').addEventListener('click', () => setZoom(zoomLevel + 25));
  $('#btn-zoom-out').addEventListener('click', () => setZoom(zoomLevel - 25));
  $('#tree-search').addEventListener('input', filterTree);

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Close modal on overlay click
  exportModal.addEventListener('click', e => {
    if (e.target === exportModal) exportModal.classList.remove('visible');
  });

  // Keyboard: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && exportModal.classList.contains('visible')) exportModal.classList.remove('visible');
  });

  // Auto-activate first tab panel on mobile
  switchTab('tree');
}

// ===== Tab switching =====
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.panel[data-panel]').forEach(p => p.classList.toggle('active-panel', p.dataset.panel === tab));
}

// ===== Parse JSON =====
function parseJSON() {
  const raw = jsonInput.value.trim();
  if (!raw) { showError('Please paste JSON UI code first.'); return; }

  try {
    jsonData = JSON.parse(raw);
  } catch (e) {
    showError('Invalid JSON: ' + e.message);
    return;
  }

  parseError.hidden = true;
  elements = [];
  flattenElements(jsonData, '');
  inputSection.hidden = true;
  editorSection.hidden = false;
  renderTree();
  renderPreview();
}

function showError(msg) {
  parseError.textContent = msg;
  parseError.hidden = false;
}

function loadExample() {
  jsonInput.value = JSON.stringify(EXAMPLE_JSON, null, 2);
}

function goBack() {
  editorSection.hidden = true;
  inputSection.hidden = false;
  // Update textarea with current state
  if (jsonData) jsonInput.value = JSON.stringify(jsonData, null, 2);
}

// ===== Flatten JSON UI into element list =====
function flattenElements(obj, parentPath) {
  if (!obj || typeof obj !== 'object') return;

  for (const [key, val] of Object.entries(obj)) {
    if (key === 'namespace') continue;
    if (typeof val !== 'object' || val === null) continue;

    // Array items in controls
    if (Array.isArray(val)) continue;

    const path = parentPath ? `${parentPath}.${key}` : key;
    const type = detectType(val);

    elements.push({ path, name: key, type, obj: val });

    // Recurse into controls array
    if (Array.isArray(val.controls)) {
      val.controls.forEach((ctrl, i) => {
        if (typeof ctrl === 'object' && ctrl !== null) {
          for (const [cName, cVal] of Object.entries(ctrl)) {
            if (typeof cVal === 'object' && cVal !== null) {
              const cPath = `${path}.controls[${i}].${cName}`;
              const cType = detectType(cVal);
              elements.push({ path: cPath, name: cName, type: cType, obj: cVal });
              // Recurse deeper
              if (Array.isArray(cVal.controls)) {
                flattenControlsRecursive(cVal.controls, cPath);
              }
            }
          }
        }
      });
    }
  }
}

function flattenControlsRecursive(controls, parentPath) {
  controls.forEach((ctrl, i) => {
    if (typeof ctrl === 'object' && ctrl !== null) {
      for (const [cName, cVal] of Object.entries(ctrl)) {
        if (typeof cVal === 'object' && cVal !== null) {
          const cPath = `${parentPath}.controls[${i}].${cName}`;
          const cType = detectType(cVal);
          elements.push({ path: cPath, name: cName, type: cType, obj: cVal });
          if (Array.isArray(cVal.controls)) {
            flattenControlsRecursive(cVal.controls, cPath);
          }
        }
      }
    }
  });
}

function detectType(obj) {
  if (obj.type) return obj.type;
  if (obj.anim_type) return 'animation';
  return 'other';
}

// ===== Build nested tree structure =====
function buildTree(obj, parentPath) {
  const nodes = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'namespace') continue;
    if (typeof val !== 'object' || val === null || Array.isArray(val)) continue;

    const path = parentPath ? `${parentPath}.${key}` : key;
    const type = detectType(val);
    const children = [];

    if (Array.isArray(val.controls)) {
      val.controls.forEach((ctrl, i) => {
        if (typeof ctrl === 'object' && ctrl !== null) {
          for (const [cName, cVal] of Object.entries(ctrl)) {
            if (typeof cVal === 'object' && cVal !== null) {
              const cPath = `${path}.controls[${i}].${cName}`;
              const cType = detectType(cVal);
              const grandChildren = [];
              if (Array.isArray(cVal.controls)) {
                grandChildren.push(...buildControlsTree(cVal.controls, cPath));
              }
              children.push({ path: cPath, name: cName, type: cType, obj: cVal, children: grandChildren });
            }
          }
        }
      });
    }

    nodes.push({ path, name: key, type, obj: val, children });
  }
  return nodes;
}

function buildControlsTree(controls, parentPath) {
  const nodes = [];
  controls.forEach((ctrl, i) => {
    if (typeof ctrl === 'object' && ctrl !== null) {
      for (const [cName, cVal] of Object.entries(ctrl)) {
        if (typeof cVal === 'object' && cVal !== null) {
          const cPath = `${parentPath}.controls[${i}].${cName}`;
          const cType = detectType(cVal);
          const children = [];
          if (Array.isArray(cVal.controls)) {
            children.push(...buildControlsTree(cVal.controls, cPath));
          }
          nodes.push({ path: cPath, name: cName, type: cType, obj: cVal, children });
        }
      }
    }
  });
  return nodes;
}

// ===== Render Tree =====
function renderTree() {
  const tree = buildTree(jsonData, '');
  elementTree.innerHTML = '';
  tree.forEach(node => elementTree.appendChild(createTreeNode(node, 0)));
}

function createTreeNode(node, depth) {
  const el = document.createElement('div');
  el.className = 'tree-node';
  el.dataset.path = node.path;
  el.dataset.name = node.name.toLowerCase();

  const hasChildren = node.children && node.children.length > 0;

  const label = document.createElement('div');
  label.className = 'tree-label';
  if (selectedPath === node.path) label.classList.add('selected');

  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle' + (hasChildren ? '' : ' empty');
  toggle.textContent = '\u25B6';
  if (hasChildren && depth < 1) toggle.classList.add('open');

  const typeBadge = document.createElement('span');
  const tClass = getTypeClass(node.type);
  typeBadge.className = 'tree-type ' + tClass;
  typeBadge.textContent = shortType(node.type);

  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = node.name;

  label.append(toggle, typeBadge, name);

  label.addEventListener('click', (e) => {
    // Toggle expand
    if (hasChildren && (e.target === toggle || e.target === label)) {
      const childDiv = el.querySelector(':scope > .tree-children');
      if (childDiv) {
        childDiv.classList.toggle('collapsed');
        toggle.classList.toggle('open');
      }
    }
    selectElement(node.path, node.obj, node.name, node.type);
  });

  el.appendChild(label);

  if (hasChildren) {
    const childContainer = document.createElement('div');
    childContainer.className = 'tree-children' + (depth >= 1 ? ' collapsed' : '');
    node.children.forEach(child => childContainer.appendChild(createTreeNode(child, depth + 1)));
    el.appendChild(childContainer);
  }

  return el;
}

function getTypeClass(type) {
  const map = {
    'panel': 't-panel', 'label': 't-label', 'image': 't-image',
    'button': 't-button', 'stack_panel': 't-stack', 'grid': 't-grid',
    'custom': 't-custom', 'screen': 't-screen', 'factory': 't-factory',
    'animation': 't-anim'
  };
  return map[type] || 't-other';
}

function shortType(type) {
  const map = {
    'stack_panel': 'stack', 'animation': 'anim'
  };
  return map[type] || type;
}

// ===== Filter Tree =====
function filterTree(e) {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('.tree-node').forEach(node => {
    const name = node.dataset.name;
    const match = !q || name.includes(q);
    node.querySelector(':scope > .tree-label').classList.toggle('hidden-by-search', !match);
    // Expand parents if child matches
    if (match && q) {
      let parent = node.parentElement;
      while (parent) {
        if (parent.classList.contains('tree-children')) {
          parent.classList.remove('collapsed');
          const tog = parent.previousElementSibling?.querySelector('.tree-toggle');
          if (tog) tog.classList.add('open');
        }
        parent = parent.parentElement;
      }
    }
  });
}

// ===== Select Element =====
function selectElement(path, obj, name, type) {
  selectedPath = path;

  // Update tree selection
  document.querySelectorAll('.tree-label.selected').forEach(l => l.classList.remove('selected'));
  const treeNode = document.querySelector(`.tree-node[data-path="${CSS.escape(path)}"] > .tree-label`);
  if (treeNode) treeNode.classList.add('selected');

  // Update preview
  document.querySelectorAll('.preview-el.active').forEach(p => p.classList.remove('active'));
  const prevEl = document.querySelector(`.preview-el[data-path="${CSS.escape(path)}"]`);
  if (prevEl) prevEl.classList.add('active');

  propsTitle.textContent = name;
  renderProps(obj, name, type);

  // Switch to props tab on mobile
  if (window.innerWidth <= 768) switchTab('props');
}

// ===== Render Properties =====
function renderProps(obj, name, type) {
  propsContainer.innerHTML = '';

  // Type info
  if (obj.type || obj.anim_type) {
    const info = createPropGroup('Element Info');
    if (obj.type) info.appendChild(createReadonly('type', obj.type));
    if (obj.anim_type) info.appendChild(createReadonly('anim_type', obj.anim_type));
    if (obj.texture) info.appendChild(createReadonly('texture', obj.texture));
    propsContainer.appendChild(info);
  }

  // Position
  const hasPosition = obj.offset || obj.anchor_from || obj.anchor_to;
  if (hasPosition || obj.type) {
    const posGroup = createPropGroup('Position');

    // Offset with nudge
    if (obj.offset || obj.type) {
      const offset = obj.offset || [0, 0];
      posGroup.appendChild(createOffsetEditor(obj, offset));
    }

    // Anchors
    if (obj.anchor_from !== undefined || obj.type) {
      posGroup.appendChild(createAnchorSelect('anchor_from', obj.anchor_from || 'center', obj));
    }
    if (obj.anchor_to !== undefined || obj.type) {
      posGroup.appendChild(createAnchorSelect('anchor_to', obj.anchor_to || 'center', obj));
    }

    propsContainer.appendChild(posGroup);
  }

  // Size
  if (obj.size || obj.type) {
    const sizeGroup = createPropGroup('Size');
    const size = obj.size || ['100%', '100%'];
    sizeGroup.appendChild(createSizeEditor(obj, size));
    if (obj.min_size) {
      sizeGroup.appendChild(createArrayInput('min_size', obj.min_size, obj));
    }
    if (obj.max_size) {
      sizeGroup.appendChild(createArrayInput('max_size', obj.max_size, obj));
    }
    if (obj.uv_size) {
      sizeGroup.appendChild(createArrayInput('uv_size', obj.uv_size, obj));
    }
    propsContainer.appendChild(sizeGroup);
  }

  // Appearance
  const hasAppearance = obj.alpha !== undefined || obj.layer !== undefined || obj.visible !== undefined || obj.color !== undefined;
  if (hasAppearance) {
    const appGroup = createPropGroup('Appearance');
    if (obj.alpha !== undefined) {
      appGroup.appendChild(createNumberInput('alpha', obj.alpha, obj, 0, 1, 0.05));
    }
    if (obj.layer !== undefined) {
      appGroup.appendChild(createNumberInput('layer', obj.layer, obj, -100, 100, 1));
    }
    if (obj.visible !== undefined) {
      appGroup.appendChild(createBoolInput('visible', obj.visible, obj));
    }
    if (obj.enabled !== undefined) {
      appGroup.appendChild(createBoolInput('enabled', obj.enabled, obj));
    }
    if (obj.color !== undefined) {
      appGroup.appendChild(createReadonly('color', JSON.stringify(obj.color)));
    }
    propsContainer.appendChild(appGroup);
  }

  // Animation
  if (obj.anim_type) {
    const animGroup = createPropGroup('Animation');
    if (obj.easing) animGroup.appendChild(createTextInput('easing', obj.easing, obj));
    if (obj.duration !== undefined) animGroup.appendChild(createNumberInput('duration', obj.duration, obj, 0, 60, 0.1));
    if (obj.from) animGroup.appendChild(createArrayInput('from', obj.from, obj));
    if (obj.to) animGroup.appendChild(createArrayInput('to', obj.to, obj));
    if (obj.next) animGroup.appendChild(createReadonly('next', obj.next));
    propsContainer.appendChild(animGroup);
  }

  // Text
  if (obj.type === 'label') {
    const textGroup = createPropGroup('Text');
    if (obj.text !== undefined) textGroup.appendChild(createTextInput('text', obj.text, obj));
    if (obj.text_alignment) textGroup.appendChild(createTextInput('text_alignment', obj.text_alignment, obj));
    if (obj.shadow !== undefined) textGroup.appendChild(createBoolInput('shadow', obj.shadow, obj));
    propsContainer.appendChild(textGroup);
  }

  // Clips
  if (obj.clips_children !== undefined) {
    const miscGroup = createPropGroup('Misc');
    miscGroup.appendChild(createBoolInput('clips_children', obj.clips_children, obj));
    propsContainer.appendChild(miscGroup);
  }

  // Other raw properties
  const knownKeys = new Set([
    'type', 'anim_type', 'texture', 'offset', 'anchor_from', 'anchor_to',
    'size', 'min_size', 'max_size', 'uv_size', 'alpha', 'layer', 'visible',
    'enabled', 'color', 'easing', 'duration', 'from', 'to', 'next',
    'text', 'text_alignment', 'shadow', 'clips_children', 'controls',
    'bindings', 'anims', 'factory', 'collection_name', 'orientation',
    'propagate_alpha', '$prefix', 'content_alignment', 'spacing'
  ]);

  const otherKeys = Object.keys(obj).filter(k => !knownKeys.has(k) && !k.startsWith('$'));
  if (otherKeys.length > 0) {
    const otherGroup = createPropGroup('Other Properties');
    otherKeys.forEach(key => {
      const val = obj[key];
      if (typeof val === 'string' || typeof val === 'number') {
        otherGroup.appendChild(createTextInput(key, String(val), obj));
      } else if (typeof val === 'boolean') {
        otherGroup.appendChild(createBoolInput(key, val, obj));
      } else {
        otherGroup.appendChild(createReadonly(key, JSON.stringify(val)));
      }
    });
    propsContainer.appendChild(otherGroup);
  }

  // Variables ($prefix etc)
  const varKeys = Object.keys(obj).filter(k => k.startsWith('$'));
  if (varKeys.length > 0) {
    const varGroup = createPropGroup('Variables');
    varKeys.forEach(key => {
      const val = obj[key];
      if (typeof val === 'string' || typeof val === 'number') {
        varGroup.appendChild(createTextInput(key, String(val), obj));
      } else {
        varGroup.appendChild(createReadonly(key, JSON.stringify(val)));
      }
    });
    propsContainer.appendChild(varGroup);
  }
}

// ===== Property Editors =====

function createPropGroup(title) {
  const div = document.createElement('div');
  div.className = 'prop-group';
  const h = document.createElement('div');
  h.className = 'prop-group-title';
  h.textContent = title;
  div.appendChild(h);
  return div;
}

function createReadonly(label, value) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${esc(label)}</span><span class="prop-input" style="background:transparent;border:none;color:var(--text-dim)">${esc(String(value))}</span>`;
  return row;
}

function createOffsetEditor(obj, offset) {
  const wrap = document.createElement('div');

  // Step selector
  const stepRow = document.createElement('div');
  stepRow.className = 'prop-step';
  stepRow.innerHTML = `<label>Step:</label>`;
  const stepSel = document.createElement('select');
  stepSel.className = 'step-select';
  [0.5, 1, 2, 5, 10, 20].forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v + 'px';
    if (v === nudgeStep) o.selected = true;
    stepSel.appendChild(o);
  });
  stepSel.addEventListener('change', () => { nudgeStep = parseFloat(stepSel.value); });
  stepRow.appendChild(stepSel);
  wrap.appendChild(stepRow);

  const parseVal = v => {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return isNaN(n) ? 0 : n;
  };

  const getSuffix = v => {
    if (typeof v === 'number') return '';
    const m = String(v).match(/[a-z%]+$/i);
    return m ? m[0] : '';
  };

  let xVal = parseVal(offset[0]);
  let yVal = parseVal(offset[1]);
  let xSuffix = getSuffix(offset[0]);
  let ySuffix = getSuffix(offset[1]);

  const update = () => {
    obj.offset = [
      xSuffix ? xVal + xSuffix : xVal,
      ySuffix ? yVal + ySuffix : yVal
    ];
    xDisp.textContent = formatVal(xVal, xSuffix);
    yDisp.textContent = formatVal(yVal, ySuffix);
    renderPreview();
  };

  const formatVal = (v, s) => (Number.isInteger(v) ? v : v.toFixed(1)) + s;

  // X row
  const xRow = document.createElement('div');
  xRow.className = 'prop-row';
  xRow.innerHTML = '<span class="prop-label">offset X</span>';
  const xNudge = document.createElement('div');
  xNudge.className = 'nudge-row';
  xNudge.style.flex = '1';
  xNudge.style.display = 'flex';
  xNudge.style.alignItems = 'center';
  xNudge.style.gap = '0.3rem';

  const xMinus = createNudgeBtn('\u25C0', () => { xVal -= nudgeStep; update(); });
  const xDisp = document.createElement('span');
  xDisp.className = 'nudge-val';
  xDisp.textContent = formatVal(xVal, xSuffix);
  xDisp.addEventListener('click', () => {
    const input = prompt('Offset X:', obj.offset[0]);
    if (input !== null) {
      const parsed = parseFloat(input);
      if (!isNaN(parsed)) { xVal = parsed; xSuffix = getSuffix(input); update(); }
    }
  });
  const xPlus = createNudgeBtn('\u25B6', () => { xVal += nudgeStep; update(); });
  xNudge.append(xMinus, xDisp, xPlus);
  xRow.appendChild(xNudge);
  wrap.appendChild(xRow);

  // Y row
  const yRow = document.createElement('div');
  yRow.className = 'prop-row';
  yRow.innerHTML = '<span class="prop-label">offset Y</span>';
  const yNudge = document.createElement('div');
  yNudge.style.flex = '1';
  yNudge.style.display = 'flex';
  yNudge.style.alignItems = 'center';
  yNudge.style.gap = '0.3rem';

  const yMinus = createNudgeBtn('\u25B2', () => { yVal -= nudgeStep; update(); });
  const yDisp = document.createElement('span');
  yDisp.className = 'nudge-val';
  yDisp.textContent = formatVal(yVal, ySuffix);
  yDisp.addEventListener('click', () => {
    const input = prompt('Offset Y:', obj.offset[1]);
    if (input !== null) {
      const parsed = parseFloat(input);
      if (!isNaN(parsed)) { yVal = parsed; ySuffix = getSuffix(input); update(); }
    }
  });
  const yPlus = createNudgeBtn('\u25BC', () => { yVal += nudgeStep; update(); });
  yNudge.append(yMinus, yDisp, yPlus);
  yRow.appendChild(yNudge);
  wrap.appendChild(yRow);

  return wrap;
}

function createNudgeBtn(text, handler) {
  const btn = document.createElement('button');
  btn.className = 'nudge-btn';
  btn.textContent = text;
  btn.addEventListener('click', handler);
  // Long press for continuous nudge
  let interval;
  btn.addEventListener('pointerdown', () => {
    interval = setInterval(handler, 120);
  });
  btn.addEventListener('pointerup', () => clearInterval(interval));
  btn.addEventListener('pointerleave', () => clearInterval(interval));
  btn.addEventListener('pointercancel', () => clearInterval(interval));
  return btn;
}

function createSizeEditor(obj, size) {
  const wrap = document.createElement('div');

  const createSizeDim = (label, idx) => {
    const row = document.createElement('div');
    row.className = 'prop-row';
    row.innerHTML = `<span class="prop-label">${label}</span>`;
    const input = document.createElement('input');
    input.className = 'prop-input';
    input.type = 'text';
    input.value = String(size[idx]);
    input.addEventListener('change', () => {
      const v = input.value.trim();
      const n = parseFloat(v);
      if (!obj.size) obj.size = [...size];
      obj.size[idx] = (!isNaN(n) && v === String(n)) ? n : v;
      renderPreview();
    });
    row.appendChild(input);
    return row;
  };

  wrap.appendChild(createSizeDim('width', 0));
  wrap.appendChild(createSizeDim('height', 1));
  return wrap;
}

function createAnchorSelect(prop, value, obj) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${esc(prop)}</span>`;
  const sel = document.createElement('select');
  sel.className = 'prop-select';
  ANCHORS.forEach(a => {
    const o = document.createElement('option');
    o.value = a; o.textContent = a.replace(/_/g, ' ');
    if (a === value) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    obj[prop] = sel.value;
    renderPreview();
  });
  row.appendChild(sel);
  return row;
}

function createNumberInput(prop, value, obj, min, max, step) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${esc(prop)}</span>`;
  const input = document.createElement('input');
  input.className = 'prop-input';
  input.type = 'number';
  input.min = min; input.max = max; input.step = step;
  input.value = value;
  input.addEventListener('change', () => {
    obj[prop] = parseFloat(input.value);
    renderPreview();
  });
  row.appendChild(input);
  return row;
}

function createBoolInput(prop, value, obj) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${esc(prop)}</span>`;
  const wrap = document.createElement('div');
  wrap.className = 'prop-checkbox-wrap';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'prop-checkbox';
  cb.checked = value;
  const label = document.createElement('span');
  label.textContent = value ? 'true' : 'false';
  label.style.fontSize = '0.82rem';
  label.style.fontFamily = 'var(--mono)';
  cb.addEventListener('change', () => {
    obj[prop] = cb.checked;
    label.textContent = cb.checked ? 'true' : 'false';
    renderPreview();
  });
  wrap.append(cb, label);
  row.appendChild(wrap);
  return row;
}

function createTextInput(prop, value, obj) {
  const row = document.createElement('div');
  row.className = 'prop-row';
  row.innerHTML = `<span class="prop-label">${esc(prop)}</span>`;
  const input = document.createElement('input');
  input.className = 'prop-input';
  input.type = 'text';
  input.value = value;
  input.addEventListener('change', () => {
    const v = input.value;
    const n = parseFloat(v);
    obj[prop] = (!isNaN(n) && v === String(n)) ? n : v;
  });
  row.appendChild(input);
  return row;
}

function createArrayInput(prop, arr, obj) {
  const wrap = document.createElement('div');
  arr.forEach((val, idx) => {
    const row = document.createElement('div');
    row.className = 'prop-row';
    row.innerHTML = `<span class="prop-label">${esc(prop)}[${idx}]</span>`;
    const input = document.createElement('input');
    input.className = 'prop-input';
    input.type = 'text';
    input.value = String(val);
    input.addEventListener('change', () => {
      const v = input.value.trim();
      const n = parseFloat(v);
      obj[prop][idx] = (!isNaN(n) && v === String(n)) ? n : v;
      renderPreview();
    });
    row.appendChild(input);
    wrap.appendChild(row);
  });
  return wrap;
}

// ===== Preview =====
function renderPreview() {
  previewScreen.innerHTML = '';
  const screenW = previewScreen.clientWidth || 320;
  const screenH = previewScreen.clientHeight || 180;

  elements.forEach(el => {
    if (!el.obj.type || el.obj.visible === false) return;

    const pos = computePosition(el.obj, screenW, screenH);
    if (!pos) return;

    const div = document.createElement('div');
    div.className = 'preview-el';
    if (el.obj.type) div.classList.add('type-' + el.obj.type.replace('stack_panel', 'panel'));
    div.dataset.path = el.path;
    div.textContent = el.name;
    div.style.left = pos.x + 'px';
    div.style.top = pos.y + 'px';
    div.style.width = pos.w + 'px';
    div.style.height = pos.h + 'px';
    if (el.obj.alpha !== undefined) div.style.opacity = el.obj.alpha;
    if (selectedPath === el.path) div.classList.add('active');

    div.addEventListener('click', () => selectElement(el.path, el.obj, el.name, el.type));

    previewScreen.appendChild(div);
  });
}

function computePosition(obj, screenW, screenH) {
  const parseSize = (v, parentDim) => {
    if (typeof v === 'number') return v;
    const s = String(v);
    if (s.includes('%')) {
      const n = parseFloat(s);
      return isNaN(n) ? 20 : (n / 100) * parentDim;
    }
    if (s === 'default' || s === 'wrap_content' || s === '100%c' || s === '100%cm') return 30;
    const n = parseFloat(s);
    return isNaN(n) ? 20 : n;
  };

  const size = obj.size || [30, 15];
  let w = parseSize(size[0], screenW);
  let h = parseSize(size[1], screenH);
  w = Math.max(8, Math.min(w, screenW));
  h = Math.max(6, Math.min(h, screenH));

  // Anchor position
  const anchorFrom = obj.anchor_from || 'center';
  let ax = 0.5, ay = 0.5;
  if (anchorFrom.includes('left')) ax = 0;
  if (anchorFrom.includes('right')) ax = 1;
  if (anchorFrom.includes('top')) ay = 0;
  if (anchorFrom.includes('bottom')) ay = 1;

  const anchorTo = obj.anchor_to || anchorFrom;
  let bx = 0.5, by = 0.5;
  if (anchorTo.includes('left')) bx = 0;
  if (anchorTo.includes('right')) bx = 1;
  if (anchorTo.includes('top')) by = 0;
  if (anchorTo.includes('bottom')) by = 1;

  // Offset
  const offset = obj.offset || [0, 0];
  const ox = typeof offset[0] === 'number' ? offset[0] : parseFloat(offset[0]) || 0;
  const oy = typeof offset[1] === 'number' ? offset[1] : parseFloat(offset[1]) || 0;

  let x = ax * screenW - bx * w + ox;
  let y = ay * screenH - by * h + oy;

  // Clamp to viewport
  x = Math.max(-w + 4, Math.min(x, screenW - 4));
  y = Math.max(-h + 4, Math.min(y, screenH - 4));

  return { x, y, w, h };
}

function setZoom(level) {
  zoomLevel = Math.max(50, Math.min(200, level));
  $('#zoom-level').textContent = zoomLevel + '%';
  previewScreen.style.transform = `scale(${zoomLevel / 100})`;
}

// ===== Export =====
function showExport() {
  if (!jsonData) return;
  try {
    const output = JSON.stringify(jsonData, null, 2);
    exportModal.classList.add('visible');
    // Set value after modal is visible so textarea can render
    requestAnimationFrame(() => {
      jsonOutput.value = output;
      jsonOutput.scrollTop = 0;
    });
  } catch (e) {
    exportModal.classList.add('visible');
    jsonOutput.value = '// Error serializing JSON: ' + e.message;
  }
}

function copyJSON() {
  navigator.clipboard.writeText(jsonOutput.value).then(() => showToast('Copied to clipboard!'));
}

function downloadJSON() {
  const ns = jsonData.namespace || 'ui';
  const blob = new Blob([jsonOutput.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ns + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded ' + ns + '.json');
}

// ===== Toast =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== Util =====
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ===== Start =====
init();
})();
