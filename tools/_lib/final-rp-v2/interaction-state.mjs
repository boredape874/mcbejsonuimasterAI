const TYPE_STATES = {
  button:["default","hover","pressed","locked","focused"],
  toggle:["unchecked","unchecked_hover","checked","checked_hover","locked"],
  edit_box:["unfocused","hover","focused_empty","focused_text","clear","disabled"],
  input_panel:["unfocused","hover","focused_empty","focused_text","clear","disabled"],
  tab:["unselected","hover","selected","focused","disabled"]
};

export function deriveInteractionState(node, fixture = {}, { requestedState = "default", index = null } = {}) {
  const props=node.props||{}, type=normalizeType(props.type), item=node.collectionItem;
  const locked=props.enabled===false||item?.locked===true||fixture.lockedIndices?.includes(index);
  const hovered=index!=null?fixture.hoveredIndex===index:requestedState==="hover";
  const pressed=index!=null?fixture.pressedIndex===index:requestedState==="pressed";
  const focused=index!=null?fixture.focusedIndex===index:["focus","focused","editing"].includes(requestedState);
  const selected=Boolean(item?.selected||fixture.selectedIndices?.includes(index)||fixture.toggleStates?.[props.toggle_name||node.id]||requestedState==="selected"||requestedState==="checked");
  const text=String(fixture.textInputs?.[node.id]??fixture.searchText??props.text??"");
  let state="default";
  if(type==="toggle") state=locked?"locked":selected?(hovered?"checked_hover":"checked"):(hovered?"unchecked_hover":"unchecked");
  else if(type==="edit_box"||type==="input_panel") state=locked?"disabled":requestedState==="clear"?"clear":focused?(text?"focused_text":"focused_empty"):hovered?"hover":"unfocused";
  else if(type==="tab") state=locked?"disabled":selected?"selected":focused?"focused":hovered?"hover":"unselected";
  else state=locked?"locked":pressed?"pressed":hovered?"hover":selected?"selected":focused?"focused":"default";
  return { type, state, allowedStates:TYPE_STATES[type]||TYPE_STATES.button, stateSource:index!=null?"fixture-index":"requested-state", focusable:["button","toggle","edit_box","input_panel","tab"].includes(type), focusScope:props.focus_identifier||props.focus_change_down||props.focus_change_right||node.qualified||node.id, event:props.button_mappings||props.mapping||props.event||null, selected, locked, hovered, pressed, focused, textLength:text.length };
}

export function contentIdentity(node) {
  const props=node.props||{}, bindings=(props.bindings||[]).map(binding=>({type:binding.binding_type,source:binding.binding_name||binding.source_property_name,target:binding.binding_name_override||binding.target_property_name,control:binding.source_control_name||null,collection:binding.binding_collection_name||null}));
  return { role:props.type||null, semanticId:props.semantic_id||props.id||node.id||null, text:props.text??null, texture:props.texture??null, collectionIndex:node.collectionIndex??null, bindings };
}

export function validateStateContentPersistence(host) {
  const issues=[], targets=stateChildren(host);
  if(targets.length<2)return issues;
  const signatures=targets.map(child=>({state:child.id,content:flattenContent(child)}));
  const base=signatures[0];
  for(const current of signatures.slice(1)) if(JSON.stringify(contentSemantics(base.content))!==JSON.stringify(contentSemantics(current.content))) issues.push({kind:"STATE_CONTENT_LOSS",impact:"blocking",control:host.qualified||host.id,baseState:base.state,state:current.state,baseContent:base.content,stateContent:current.content});
  return issues;
}
export function projectTooltipVisibility({ hovered=false, focused=false, pressed=false, inputMode="mouse", touchFallback="focus-or-press" }={}) {
  if(inputMode!=="touch")return{visible:hovered,reason:hovered?"owner-hover":"default-hidden",verifiedFallback:true};
  const visible=touchFallback==="always"||touchFallback==="focus-or-press"&&(focused||pressed);
  return{visible,reason:visible?`touch-${touchFallback}`:"touch-fallback-hidden",verifiedFallback:["always","focus-or-press"].includes(touchFallback)};
}
function flattenContent(node){const out=[];(function walk(value){if(["label","image"].includes(value.props?.type))out.push(contentIdentity(value));for(const child of value.controls||[])walk(child)})(node);return out.sort((a,b)=>String(a.semanticId).localeCompare(String(b.semanticId)));}
function contentSemantics(content){return content.map(item=>({role:item.role,semanticId:item.semanticId,text:item.role==="label"?item.text:null,collectionIndex:item.collectionIndex,bindings:item.bindings}));}
function stateChildren(node){return(node.controls||[]).filter(child=>/(default|hover|press|lock|checked|unchecked|selected|unselected|focus)/i.test(child.id||""));}
function normalizeType(type){return type==="input_panel"?"input_panel":TYPE_STATES[type]?type:"button";}
