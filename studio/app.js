import { selectionBounds, offsetPatch, alignSelection, distributeSelection, gridSelection, matchSelectionSize, snapMove } from './geometry.js';
import { DEVICE_PRESETS, normalizeDevice, safeRect, layoutIssues } from './devices.js';
const $=id=>document.getElementById(id), token=window.STUDIO_TOKEN;
let state={}, editor={nodes:[],screens:[]}, selected=null, editingNode=null, source=null, dirty=false, scale=1, displayedRevision=null, view='preview', drag=null, stream=null, frameTimer=null;
let toastTimer, imageLoadedRevision=null, sharingFrame=null, saving=false, optimistic=null;
let picked=new Set(),locked=new Set(),collapsed=new Set(),layerScope='';
let pan=null,spaceHeld=false;
let sourceDirty=false;
let clipboard=null,clipboardSynced=null,copyScope=null,lastPasteParent=null,lastAi=null,pasteEventSerial=0;
try{clipboard=JSON.parse(localStorage.getItem('studio-clipboard'));}catch{}
const pickedNodes=()=>editor.nodes.filter(n=>picked.has(n.key));
const isLocked=key=>[...locked].some(k=>key===k||key?.startsWith(k==='/'?'/controls/':k+'/controls/'));
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
async function api(name,args={}){const r=await fetch('/api/'+name,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args)});const value=await r.json();if(!r.ok)throw Error(value.error);return value;}
const on=(id,event,fn)=>$(id).addEventListener(event,async e=>{try{await fn(e);}catch(error){toast(error.message);}});
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const anchors=['top_left','top_middle','top_right','left_middle','center','right_middle','bottom_left','bottom_middle','bottom_right'];
const anchorNames=['왼쪽 위','가운데 위','오른쪽 위','왼쪽 중앙','정중앙','오른쪽 중앙','왼쪽 아래','가운데 아래','오른쪽 아래'];
for(const id of ['propFrom','propTo'])anchors.forEach((a,i)=>$(id).append(new Option(anchorNames[i],a)));
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>button.closest('dialog').close();
for(const id of ['viewport','devicePreset']){
  $(id).append(new Option('현재 크기 · 직접 설정','custom'));
  for(const family of ['PC','태블릿','콘솔','모바일']){const group=el('optgroup');group.label=family;for(const p of DEVICE_PRESETS.filter(p=>p.family===family))group.append(new Option(p.name,p.id));$(id).append(group);}
}
$('rpPath').value=localStorage.getItem('studio-rp')||'';$('vanillaPath').value=localStorage.getItem('studio-vanilla')||'';

function fit(){
  const [w,h]=state.project?.viewport||[480,270], area=$('canvasViewport');
  const available=Math.min((area.clientWidth-32)/w,(area.clientHeight-32)/h);
  const selection=pickedNodes().length?selectionBounds(pickedNodes()):null;
  scale=$('zoom').value==='selection'&&selection?Math.max(.1,Math.min(3,(area.clientWidth-64)/Math.max(1,selection.w),(area.clientHeight-64)/Math.max(1,selection.h))):['fit','selection'].includes($('zoom').value)?Math.max(.1,Math.min(3,Math.floor(available*100)/100)):Number($('zoom').value);
  $('zoomInfo').textContent=Math.round(scale*100)+'% · '+w+' × '+h;
  $('artboard').style.width=w*scale+'px';$('artboard').style.height=h*scale+'px';drawSelection();drawApproximateFonts();updateGrid();drawSafeArea();
  if($('zoom').value==='selection'&&selection)requestAnimationFrame(()=>{area.scrollLeft=$('artboard').offsetLeft+(selection.x+selection.w/2)*scale-area.clientWidth/2;area.scrollTop=$('artboard').offsetTop+(selection.y+selection.h/2)*scale-area.clientHeight/2;});
}
function drawApproximateFonts(){
  const layer=$('fontApproximation');layer.replaceChildren();
  const missing=(state.report?.diagnostics||[]).filter(d=>d.kind==='FONT_UNAVAILABLE');
  $('previewKind').textContent=missing.length?'대체 글꼴 · 게임 글꼴 확인 필요':'정적 미리보기 · 게임 검증 전';
  const sprites=(editor.layers||[]).map((sprite,index)=>({...sprite,index,node:editor.nodes.find(n=>n.key===(sprite.pointer||'/'))}));
  const labels=(editor.nodes||[]).filter(n=>n.visible&&n.rect.w>0&&n.rect.h>0&&n.type==='label'&&missing.some(d=>d.pointer===n.key||d.control===n.id||d.control===n.qualified)).map(n=>({node:n,layer:n.layer,index:n.index,text:true}));
  const entries=[...sprites,...labels].sort((a,b)=>(a.layer-b.layer)||((a.node?.index??a.index)-(b.node?.index??b.index)));
  for(const entry of entries){
    const n=entry.node,r=entry.text?n.rect:entry.bounds,item=document.createElement(entry.text?'canvas':'img');
    item.dataset.key=n?.key||entry.pointer;item.dataset.rect=JSON.stringify(r);
    Object.assign(item.style,{position:'absolute',left:r.x*scale+'px',top:r.y*scale+'px',width:r.w*scale+'px',height:r.h*scale+'px',pointerEvents:'none'});
    if(entry.text){
      const density=scale*(window.devicePixelRatio||1);item.width=Math.ceil(r.w*density);item.height=Math.ceil(r.h*density);
      const ctx=item.getContext('2d');ctx.scale(density,density);paintText(ctx,n,{x:0,y:0,w:r.w,h:r.h});
    }else {item.src=entry.data;item.draggable=false;item.style.imageRendering='pixelated';}
    layer.append(item);
  }
  $('preview').style.visibility=Array.isArray(editor.layers)?'hidden':'visible';
  if(optimistic)moveScene(optimistic);
}
function paintText(ctx,n,r){
  const font=8*Number(n.props.font_scale_factor||1),lineHeight=font*1.35;
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  if(n.clip){ctx.beginPath();ctx.rect(r.x+n.clip.x-n.rect.x,r.y+n.clip.y-n.rect.y,n.clip.w,n.clip.h);ctx.clip();}
  ctx.font=`${font}px "Malgun Gothic", "Segoe UI", sans-serif`;ctx.fillStyle=toHex(n.props.color);ctx.globalAlpha=n.alpha??n.props.alpha??1;ctx.textBaseline='middle';ctx.textAlign=n.props.text_alignment||'left';
  const lines=[];for(const paragraph of String(n.props.text||'').replace(/§./g,'').split('\n')){let current='';for(const char of paragraph){if(current&&ctx.measureText(current+char).width>r.w){lines.push(current);current='';}current+=char;}lines.push(current);}
  const x=ctx.textAlign==='center'?r.x+r.w/2:ctx.textAlign==='right'?r.x+r.w:r.x;
  lines.forEach((line,i)=>ctx.fillText(line,x,r.y+r.h/2+(i-(lines.length-1)/2)*lineHeight));ctx.restore();
}
function moveScene(d){
  const sx=d.resize?Math.max(1,d.node.rect.w+d.dx)/Math.max(1,d.node.rect.w):1,sy=d.resize?Math.max(1,d.node.rect.h+d.dy)/Math.max(1,d.node.rect.h):1;
  for(const item of $('fontApproximation').children){
    const key=item.dataset.key;if(!(d.nodes||[d.node]).some(n=>key===n.key||key?.startsWith(n.key==='/'?'/controls/':n.key+'/controls/')))continue;
    if(d.resize){const r=JSON.parse(item.dataset.rect);item.style.transformOrigin='0 0';item.style.transform=`translate(${(r.x-d.node.rect.x)*(sx-1)*scale}px,${(r.y-d.node.rect.y)*(sy-1)*scale}px) scale(${sx},${sy})`;}
    else item.style.transform=`translate(${d.dx*scale}px,${d.dy*scale}px)`;
  }
}
async function capturePreview(){
  if(imageLoadedRevision!==state.renderedRevision||state.stale||state.studioRevision!==state.renderedRevision||optimistic||drag)return;
  const [w,h]=state.project.viewport,captureScale=Math.min(2,Math.floor(4096/Math.max(w,h))),canvas=document.createElement('canvas');canvas.width=w*captureScale;canvas.height=h*captureScale;const ctx=canvas.getContext('2d');ctx.scale(captureScale,captureScale);ctx.imageSmoothingEnabled=false;
  if(!Array.isArray(editor.layers))ctx.drawImage($('preview'),0,0,w,h);
  for(const item of $('fontApproximation').children){if(item.tagName==='IMG'&&!item.complete)await item.decode();const r=JSON.parse(item.dataset.rect);if(item.tagName==='CANVAS'){const node=editor.nodes.find(n=>n.key===item.dataset.key);paintText(ctx,node,r);}else ctx.drawImage(item,r.x,r.y,r.w,r.h);}
  return {canvas,captureScale};
}
async function shareBrowserPreview(){
  const capture=await capturePreview();if(!capture)return;
  await api('browser_frame',{revision:state.renderedRevision,captureScale:capture.captureScale,data:capture.canvas.toDataURL('image/png'),fontMode:(state.report?.diagnostics||[]).some(d=>d.kind==='FONT_UNAVAILABLE')?'approximate':'minecraft'});
}
$('preview').onload=()=>{imageLoadedRevision=Number(new URL($('preview').src).searchParams.get('revision'));drawApproximateFonts();shareBrowserPreview().catch(()=>{});};
new ResizeObserver(fit).observe($('canvasViewport'));
function drawSelection(rect=selected?.rect){
  if(optimistic&&!drag){const d=optimistic,r=d.node.rect;rect=d.resize?{...r,w:Math.max(1,r.w+d.dx),h:Math.max(1,r.h+d.dy)}:{...r,x:r.x+d.dx,y:r.y+d.dy};}
  const box=$('selectionBox');box.hidden=!rect || view!=='preview';
  if(!rect){$('multiSelection').replaceChildren();updateArrange();return;}Object.assign(box.style,{left:rect.x*scale+'px',top:rect.y*scale+'px',width:Math.max(0,rect.w*scale)+'px',height:Math.max(0,rect.h*scale)+'px'});
  box.firstElementChild.textContent=`${selected?.id||''} · ${Math.round(rect.w)} × ${Math.round(rect.h)}`;
  $('resizeHandle').hidden=picked.size>1;
  const extras=$('multiSelection');extras.replaceChildren();
  for(const n of pickedNodes())if(n.key!==selected?.key){const b=el('div',undefined,'multi-box');b.dataset.key=n.key;Object.assign(b.style,{left:n.rect.x*scale+'px',top:n.rect.y*scale+'px',width:n.rect.w*scale+'px',height:n.rect.h*scale+'px'});extras.append(b);}
  if(optimistic)for(const b of extras.children)b.style.transform=`translate(${optimistic.dx*scale}px,${optimistic.dy*scale}px)`;
  if(picked.size>1)box.firstElementChild.textContent=picked.size+'개 선택';
  updateArrange();
}
function updateGrid(){
  const size=Number($('gridSize').value)*scale;
  $('pixelGrid').style.backgroundSize=size+'px '+size+'px';$('pixelGrid').hidden=$('gridToggle').getAttribute('aria-pressed')!=='true';
  $('pixelGrid').style.opacity=size<5?0:.2;
}
function drawGuides(guides=[]){
  const svg=$('guides');svg.replaceChildren();const [w,h]=state.project?.viewport||[480,270];svg.setAttribute('viewBox',`0 0 ${w*scale} ${h*scale}`);
  for(const g of guides){
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    const attr=g.gap!==undefined?(g.axis==='x'?{x1:g.from*scale,x2:g.to*scale,y1:(g.start-4)*scale,y2:(g.start-4)*scale}:{y1:g.from*scale,y2:g.to*scale,x1:(g.start-4)*scale,x2:(g.start-4)*scale}):g.axis==='x'?{x1:g.value*scale,x2:g.value*scale,y1:g.start*scale,y2:g.end*scale}:{y1:g.value*scale,y2:g.value*scale,x1:g.start*scale,x2:g.end*scale};
    for(const [k,v]of Object.entries(attr))line.setAttribute(k,v);line.dataset.kind=g.gap!==undefined?'spacing':'alignment';svg.append(line);
    if(g.gap!==undefined){const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x',g.axis==='x'?g.value*scale+6:g.start*scale);text.setAttribute('y',g.axis==='x'?g.start*scale-8:g.value*scale-8);text.textContent=Math.round(g.gap*10)/10+' px · 같은 간격';svg.append(text);}
  }
}
function updateArrange(){
  $('selectionCount').textContent='선택 '+picked.size;
  const nodes=pickedNodes(),ready=nodes.length&&!state.stale&&!saving&&nodes.every(n=>n.source&&!isLocked(n.key));
  for(const b of document.querySelectorAll('[data-align]'))b.disabled=!ready;
  $('distributeX').disabled=$('distributeY').disabled=!ready||nodes.length<3;
  $('arrangeGrid').disabled=!ready||nodes.length<2;$('duplicate').disabled=!ready||nodes.length!==1||selected?.key==='/';
  $('sameSize').disabled=!ready||nodes.length<2;$('arrangeButton').disabled=!ready;$('selectionZoom').disabled=!nodes.length;
  const inline=nodes.length&&nodes.every(n=>n.source?.pointer?.match(/\/controls\/\d+\/[^/]+$/));
  $('copyElements').disabled=!inline||state.stale||saving;$('cutElements').disabled=$('deleteElements').disabled=!inline||!ready;
  $('pasteElements').disabled=!clipboard||!state.project||state.stale||saving||!parentNode()?.source;
}
function updateView(){
  for(const [id,mode]of [['previewTab','preview'],['jsonTab','json'],['gameTab','game']]){$(id).classList.toggle('active',view===mode);$(id).setAttribute('aria-selected',String(view===mode));}
  $('sourceEditor').hidden=view!=='json';$('canvasViewport').hidden=view==='json';
  document.querySelector('.arrange-toolbar').hidden=view!=='preview';document.querySelector('.canvas-toolbar').hidden=view==='json';document.querySelector('.preview-summary').hidden=view==='json';
  $('emptyCanvas').hidden=!!state.project || view!=='preview';$('artboard').hidden=!state.report?.outputPath || view!=='preview';
  $('gameVideo').hidden=view!=='game'||!stream;$('remoteGame').hidden=view!=='game'||!!stream||!state.gameFrame;
  $('gameEmpty').hidden=view!=='game'||!!stream||!!state.gameFrame;drawSelection();
}
async function refreshStudio(force=false){
  const value=await api('studio'),scope=value.project?.rpRoot+'|'+value.project?.control;if(scope!==layerScope){locked.clear();collapsed.clear();lastPasteParent=null;layerScope=scope;if(!sourceDirty){source=null;if(view==='json')view='preview';}}state=value;editor=value.editor;
  picked=new Set(value.selectionKeys||[value.selection].filter(Boolean));
  renderScreens();renderLayers();
  selected=editor.nodes.find(n=>n.key===value.selection)||null;
  if(state.project)$('viewport').value=state.project.previewDevice?.presetId??'custom';
  updateDeviceSummary();
  updateWorkbench();
  if(!dirty||force)renderProperties();renderDiagnostics();renderCodex(value.codex);fit();updateView();shareBrowserPreview().catch(()=>{});
}
function renderScreens(){
  const list=$('screens'), query=$('screenSearch').value.toLowerCase();list.replaceChildren();
  const matches=editor.screens.filter(s=>(s.control+' '+s.path).toLowerCase().includes(query));$('screenCount').textContent=editor.screens.length;
  for(const s of matches){
    const row=el('button',undefined,'screen-row'+(s.control===state.project?.control?' active':''));row.title=s.path+(s.registered?'':' · _ui_defs.json 미등록 / 바닐라 override 여부 확인');
    row.append(el('span',s.control),el('small',typeName(s.type),s.registered?'':'unregistered'));
    row.onclick=()=>{try{guardSourceBuffer();api('open',{...state.project,control:s.control}).then(()=>refreshStudio(true)).catch(e=>toast(e.message));}catch(e){toast(e.message);}};list.append(row);
  }
  if(!matches.length)list.append(el('div','검색 결과가 없습니다.','empty small'));
}
function renderLayers(){
  const list=$('layers');list.replaceChildren();$('layerCount').textContent=editor.nodes.length;
  const nodes=[...editor.nodes].sort((a,b)=>a.index-b.index);
  const query=$('layerSearch').value.toLowerCase();
  for(const node of nodes){
    if(query&&!node.id.toLowerCase().includes(query))continue;
    if(!query&&[...collapsed].some(k=>node.key!==k&&node.key.startsWith(k==='/'?'/controls/':k+'/controls/')))continue;
    const row=el('div',undefined,'layer-row'+(picked.has(node.key)?' active':''));row.style.paddingLeft=6+Math.min(node.depth,10)*12+'px';
    const hasChildren=nodes.some(n=>n.parent===node.key),fold=el('button',hasChildren?(collapsed.has(node.key)?'▸':'▾'):'·','layer-fold');fold.disabled=!hasChildren;fold.title='하위 요소 접기 / 펼치기';fold.onclick=()=>{collapsed.has(node.key)?collapsed.delete(node.key):collapsed.add(node.key);renderLayers();};
    const select=el('button',undefined,'layer-select');select.append(el('i',node.type==='label'?'T':node.type==='image'?'▧':'▱','layer-icon'),el('span',node.id));select.setAttribute('aria-pressed',String(picked.has(node.key)));select.title=`${node.type} · ${node.source?.path||'상속/생성 요소'}`;select.onclick=e=>choose(node.key,e.ctrlKey||e.shiftKey||e.metaKey).catch(err=>toast(err.message));
    const lock=el('button',locked.has(node.key)?'●':'○','layer-lock');lock.title=locked.has(node.key)?'편집 잠금 해제':'실수 방지: 이 요소 편집 잠금';lock.setAttribute('aria-label',lock.title);lock.setAttribute('aria-pressed',String(locked.has(node.key)));lock.onclick=()=>{locked.has(node.key)?locked.delete(node.key):locked.add(node.key);renderLayers();renderProperties();updateArrange();};
    if(!node.visible)row.style.opacity='.5';row.append(fold,select,lock);list.append(row);
  }
}
async function choose(key,extend=false){
  lastPasteParent=null;
  dirty=false;if(key===null)picked=new Set();else if(!extend)picked=new Set([key]);else if(picked.has(key))picked.delete(key);else {
    for(const old of picked)if(old==='/'||key==='/'||old.startsWith(key+'/controls/')||key.startsWith(old+'/controls/'))picked.delete(old);
    picked.add(key);
  }
  const primary=picked.has(key)?key:[...picked].at(-1);state.selection=primary;selected=editor.nodes.find(n=>n.key===primary)||null;
  renderLayers();renderProperties();drawSelection();drawGuides();
  await api('select',{key:primary||null,keys:[...picked]});
}
function toHex(color=[1,1,1]){return '#'+color.slice(0,3).map(n=>Math.round(Math.min(1,Math.max(0,Number(n)))*255).toString(16).padStart(2,'0')).join('');}
function typeName(type){return {label:'텍스트',image:'이미지',panel:'패널',screen:'화면',button:'버튼',stack_panel:'자동 배치',grid:'격자',inherited:'상속'}[type]||type;}
function renderProperties(){
  editingNode=selected;dirty=false;$('noSelection').hidden=!!selected;$('propertiesForm').hidden=!selected;if(!selected)return;
  const p=selected.props;$('elementId').textContent=selected.id;$('elementType').textContent=typeName(selected.type);
  $('sourceInfo').textContent=selected.source?selected.source.path:'상속 요소 · 원본에서 수정';$('sourceInfo').title=selected.source?.pointer??'';
  $('propertyFields').disabled=!selected.source||isLocked(selected.key);
  $('propText').value=typeof p.text==='string'?p.text:'';$('propText').disabled=selected.type!=='label';
  $('propX').value=p.offset?.[0]??0;$('propY').value=p.offset?.[1]??0;
  $('propW').value=p.size?.[0]??'100%';$('propH').value=p.size?.[1]??'100%';
  $('propFont').value=p.font_scale_factor??1;$('propFont').disabled=selected.type!=='label';
  $('propLayer').value=p.layer??0;$('propColor').value=toHex(p.color);$('propAlpha').value=p.alpha??1;
  $('propFrom').value=p.anchor_from??'center';$('propTo').value=p.anchor_to??'center';
  $('propTexture').value=typeof p.texture==='string'?p.texture:'';$('propTexture').disabled=selected.type!=='image';$('propVisible').checked=p.visible!==false;
  $('propText').closest('label').hidden=selected.type!=='label';$('propFont').closest('label').hidden=selected.type!=='label';$('propTexture').closest('label').hidden=selected.type!=='image';
  $('selectedInfo').textContent=`${selected.id} · x ${Math.round(selected.rect.x)}, y ${Math.round(selected.rect.y)} · ${selected.rect.w} × ${selected.rect.h}`;
}
function dimension(value){const n=Number(value);return value.trim()!==''&&Number.isFinite(n)?n:value.trim();}
function fieldPatch(){
  const p=editingNode.props, patch={}, candidates={offset:[dimension($('propX').value),dimension($('propY').value)],size:[dimension($('propW').value),dimension($('propH').value)],font_scale_factor:Number($('propFont').value),layer:Number($('propLayer').value),color:$('propColor').value.slice(1).match(/../g).map(s=>parseInt(s,16)/255),alpha:Number($('propAlpha').value),anchor_from:$('propFrom').value,anchor_to:$('propTo').value,visible:$('propVisible').checked};
  const defaults={offset:[0,0],size:['100%','100%'],font_scale_factor:1,layer:0,color:[1,1,1],alpha:1,anchor_from:'center',anchor_to:'center',visible:true};
  if(editingNode.type==='label')candidates.text=$('propText').value;
  if(editingNode.type==='image')candidates.texture=$('propTexture').value;
  for(const [key,val]of Object.entries(candidates)){
    const before=p[key]??defaults[key];
    // Avoid quantizing an untouched floating-point color to 8-bit RGB.
    if(key==='color'&&toHex(before)===$('propColor').value)continue;
    if(JSON.stringify(val)!==JSON.stringify(before))patch[key]=val;
  }
  return patch;
}
async function applyPatch(node,patch){
  if(isLocked(node?.key))throw Error('요소 목록에서 편집 잠금을 먼저 풀어 주세요.');
  if(!node?.source)throw Error('이 요소는 원본 선언을 찾거나 Codex로 수정하세요.');
  if(!Object.keys(patch).length)return;
  if(saving)throw Error('앞선 변경을 저장 중입니다.');
  saving=true;$('saveStatus').textContent='저장 중';
  try {const result=await api('edit',{key:node.key,expectedRevision:state.studioRevision,expectedHash:node.source.sha256,patch});dirty=false;optimistic=null;await refreshStudio(true);return result;}
  finally {saving=false;optimistic=null;drawApproximateFonts();drawSelection();}
}
on('propertiesForm','input',()=>{dirty=true;});
on('propertiesForm','submit',async e=>{e.preventDefault();await applyPatch(editingNode,fieldPatch());toast('저장하고 미리보기를 갱신했습니다.');});

function point(e){const rect=$('artboard').getBoundingClientRect();return{x:(e.clientX-rect.left)/scale,y:(e.clientY-rect.top)/scale};}
$('artboard').addEventListener('pointerdown',async e=>{
  if(e.button!==0||state.stale||saving)return;
  try{
    const start=point(e), resize=e.target.id==='resizeHandle';
    let node=selected;
    if(!resize){node=[...editor.nodes].sort((a,b)=>b.layer-a.layer||b.depth-a.depth||b.index-a.index).find(n=>n.visible&&!locked.has(n.key)&&!editor.nodes.some(p=>locked.has(p.key)&&n.key.startsWith(p.key==='/'?'/controls/':p.key+'/controls/'))&&start.x>=n.rect.x&&start.y>=n.rect.y&&start.x<=n.rect.x+n.rect.w&&start.y<=n.rect.y+n.rect.h);if(!node)return;}
    if(e.ctrlKey||e.metaKey){await choose(node.key,true);return;}
    const toggleOnClick=e.shiftKey&&picked.has(node.key);
    const selectionRequest=!picked.has(node.key)?choose(node.key,e.shiftKey):Promise.resolve();
    // Capture before awaiting selection; otherwise a fast drag can lose pointerup.
    $('artboard').setPointerCapture(e.pointerId);const nodes=pickedNodes();drag={node:selected||node,nodes,rect:selectionBounds(nodes),start,resize,pointer:e.pointerId,dx:0,dy:0,toggleOnClick,toggleKey:node.key};
    await selectionRequest;
  }catch(error){drag=null;toast(error.message);}
});
$('artboard').addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;const p=point(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
  const parent=editor.nodes.find(n=>n.key===drag.node.parent)?.rect||{x:0,y:0,w:state.project.viewport[0],h:state.project.viewport[1]};
  const peers=editor.nodes.filter(n=>n.visible&&n.parent===drag.node.parent&&!picked.has(n.key));
  const result=drag.resize?{dx:Math.round(dx),dy:Math.round(dy),guides:[]}:snapMove(drag.rect,dx,dy,{peers,parent,grid:!e.altKey&&$('snap').checked?Number($('gridSize').value):0,smart:!e.altKey&&$('smartSnap').checked,threshold:6/scale,axis:e.shiftKey?(Math.abs(dx)>=Math.abs(dy)?'x':'y'):null});
  drag.dx=result.dx;drag.dy=result.dy;
  const r=drag.node.rect;drawSelection(drag.resize?{...r,w:Math.max(1,r.w+drag.dx),h:Math.max(1,r.h+drag.dy)}:{...r,x:r.x+drag.dx,y:r.y+drag.dy});
  if(drag.nodes.every(n=>n.source&&!locked.has(n.key)))moveScene(drag);
  for(const b of $('multiSelection').children)b.style.transform=`translate(${drag.dx*scale}px,${drag.dy*scale}px)`;
  drawGuides(result.guides);
});
async function finishDrag(e){
  if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;drawGuides();
  if(Math.abs(d.dx)+Math.abs(d.dy)<.5){if(d.toggleOnClick)await choose(d.toggleKey,true);drawSelection();return;}
  optimistic=d;
  try{
    if(d.resize)await applyPatch(d.node,{size:[Math.max(1,d.node.rect.w+d.dx),Math.max(1,d.node.rect.h+d.dy)]});
    else {
      if(d.nodes.length>1)await applyBatch(d.nodes.map(node=>({node,patch:offsetPatch(node,d.dx,d.dy)})),'여러 요소 이동');
      else await applyPatch(d.node,offsetPatch(d.node,d.dx,d.dy));
    }
  }catch(error){optimistic=null;toast(error.message);drawApproximateFonts();drawSelection();}
}
$('artboard').addEventListener('pointerup',finishDrag);
function cancelDrag(){drag=null;optimistic=null;drawApproximateFonts();drawSelection();drawGuides();}
$('artboard').addEventListener('pointercancel',cancelDrag);
on('zoom','change',()=>{fit();localStorage.setItem('studio-zoom',$('zoom').value);});
$('zoom').value=localStorage.getItem('studio-zoom')||'fit';
on('gridToggle','click',()=>{$('gridToggle').setAttribute('aria-pressed',String($('gridToggle').getAttribute('aria-pressed')!=='true'));updateGrid();});
on('diagnosticToggle','click',()=>{$('diagnostics').hidden=!$('diagnostics').hidden;document.querySelector('.workspace').classList.toggle('diagnostics-collapsed',$('diagnostics').hidden);$('diagnosticToggle').textContent=$('diagnostics').hidden?'펼치기':'접기';});
on('sidebarMode','change',()=>setSidebar($('sidebarMode').value));
async function applyBatch(items,label){
  if(!items.length)return;if(saving)throw Error('앞선 변경을 저장 중입니다.');
  if(items.some(({node})=>!node.source||isLocked(node.key)))throw Error('수정 가능한 요소를 선택하고 편집 잠금을 풀어 주세요.');
  saving=true;updateArrange();$('saveStatus').textContent='저장 중';
  try {await api('batch_edit',{expectedRevision:state.studioRevision,label,edits:items.map(({node,patch})=>({key:node.key,expectedHash:node.source.sha256,patch}))});optimistic=null;await refreshStudio(true);}
  finally {saving=false;optimistic=null;drawApproximateFonts();drawSelection();}
}
function arrangeNodes(){const nodes=pickedNodes();if(new Set(nodes.map(n=>n.parent)).size>1)throw Error('같은 부모 안의 요소를 선택하세요.');return nodes;}
for(const button of document.querySelectorAll('[data-align]'))button.onclick=()=>{
  try{const nodes=arrangeNodes(),parent=editor.nodes.find(n=>n.key===nodes[0]?.parent)?.rect||{x:0,y:0,w:state.project?.viewport[0]||480,h:state.project?.viewport[1]||270};applyBatch(alignSelection(nodes,button.dataset.align,parent),'요소 정렬').catch(e=>toast(e.message));}catch(e){toast(e.message);}
};
for(const [id,axis]of [['distributeX','x'],['distributeY','y']])on(id,'click',()=>applyBatch(distributeSelection(arrangeNodes(),axis),'간격 같게'));
on('arrangeButton','click',()=>$('arrangeDialog').showModal());
on('sameSize','click',()=>applyBatch(matchSelectionSize(arrangeNodes()),'크기 같게'));
on('arrangeGrid','click',()=>{arrangeNodes();$('arrangeDialog').close();$('gridDialog').showModal();});
on('gridForm','submit',async e=>{e.preventDefault();await applyBatch(gridSelection(arrangeNodes(),Number($('gridColumns').value),Number($('arrangeGap').value)),'그리드 배치');$('gridDialog').close();});
async function duplicateSelected(){
  if(saving||picked.size!==1||!selected?.source||isLocked(selected.key))throw Error('수정 가능한 요소 하나를 선택하세요.');
  saving=true;try{const result=await api('duplicate',{key:selected.key,expectedRevision:state.studioRevision,expectedHash:selected.source.sha256});await refreshStudio(true);const node=editor.nodes.find(n=>n.id===result.id);if(node)await choose(node.key);toast('하위 구조와 함께 복제했습니다.');}finally{saving=false;updateArrange();}
}
on('duplicate','click',duplicateSelected);
function closeEditMenu(){document.querySelector('.edit-menu').open=false;}
for(const menu of document.querySelectorAll('.toolbar-menu'))menu.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});
function canvasClipboardTarget(e){return view==='preview'&&!document.querySelector('dialog[open]')&&!e.target.closest('input,textarea,select,[contenteditable=true]');}
async function copyElements(cut=false){
  if(saving||state.stale||!picked.size)throw Error('요소를 선택하고 미리보기 갱신을 기다리세요.');
  const nodes=pickedNodes();if(cut&&nodes.some(n=>isLocked(n.key)))throw Error('요소 잠금을 먼저 풀어 주세요.');
  const request={keys:[...picked],expectedRevision:state.studioRevision,cut};copyScope={scope:layerScope,keys:[...picked],parent:nodes[0].parent};
  saving=true;try{clipboard=await api('copy',request);localStorage.setItem('studio-clipboard',JSON.stringify(clipboard));if(cut)await refreshStudio(true);
    let system=false;try{await navigator.clipboard.writeText(JSON.stringify(clipboard));system=true;}catch{}clipboardSynced=system;
    toast(`${clipboard.count}개 ${cut?'잘라냈습니다':'복사했습니다'}. ${system?'Ctrl+V로 붙여넣으세요.':'편집기 안에서 Ctrl+V로 붙여넣을 수 있습니다.'}`);
  }finally{saving=false;closeEditMenu();updateArrange();}
}
async function pasteElements(payload=clipboard){
  if(!payload||payload.format!=='json-ui-studio/clipboard@1')throw Error('이 편집기에서 요소를 먼저 복사하세요.');
  if(saving||state.stale)throw Error('앞선 편집이 끝날 때까지 기다리세요.');
  let parent=lastPasteParent&&editor.nodes.find(n=>n.key===lastPasteParent);
  if(!parent&&copyScope?.scope===layerScope&&[...picked].every(k=>copyScope.keys.includes(k)))parent=editor.nodes.find(n=>n.key===copyScope.parent);
  parent=parent||parentNode();if(!parent?.source||isLocked(parent.key))throw Error('편집 가능한 부모 패널을 선택하세요.');
  saving=true;try{const result=await api('paste',{clipId:payload.clipId,sessionId:payload.sessionId,key:parent.key,expectedRevision:state.studioRevision,expectedHash:parent.source.sha256});await refreshStudio(true);
    const nodes=editor.nodes.filter(n=>result.ids.includes(n.id));for(let i=0;i<nodes.length;i++)await choose(nodes[i].key,i>0);lastPasteParent=parent.key;
    clipboard=payload;localStorage.setItem('studio-clipboard',JSON.stringify(payload));toast(result.ids.length+'개를 붙여넣었습니다. Ctrl+Z로 되돌릴 수 있습니다.');
  }finally{saving=false;closeEditMenu();updateArrange();}
}
async function deleteElements(){
  if(saving||state.stale||!picked.size)throw Error('편집 가능한 요소를 선택하세요.');if(pickedNodes().some(n=>isLocked(n.key)))throw Error('요소 잠금을 먼저 풀어 주세요.');
  saving=true;try{await api('remove',{keys:[...picked],expectedRevision:state.studioRevision});await refreshStudio(true);toast('요소를 삭제했습니다. Ctrl+Z로 되돌릴 수 있습니다.');}finally{saving=false;closeEditMenu();updateArrange();}
}
on('copyElements','click',()=>copyElements());on('cutElements','click',()=>copyElements(true));on('pasteElements','click',()=>pasteElements());on('deleteElements','click',deleteElements);
document.addEventListener('paste',e=>{if(!canvasClipboardTarget(e))return;pasteEventSerial++;e.preventDefault();let payload;try{payload=JSON.parse(e.clipboardData.getData('text/plain'));}catch{}pasteElements(payload||(clipboardSynced===false?clipboard:{})).catch(err=>toast(err.message));});
on('layerSearch','input',renderLayers);
on('helpButton','click',()=>$('helpDialog').showModal());on('editorSettings','click',()=>{$('viewDialog').close();$('settingsDialog').showModal();});
for(const id of ['gridSize','snap','smartSnap'])on(id,'change',()=>{updateGrid();localStorage.setItem('studio-grid',JSON.stringify({size:$('gridSize').value,snap:$('snap').checked,smart:$('smartSnap').checked}));});
try{const settings=JSON.parse(localStorage.getItem('studio-grid'));if(settings){if(['1','4','8','16'].includes(settings.size))$('gridSize').value=settings.size;$('snap').checked=settings.snap!==false;$('smartSnap').checked=settings.smart!==false;}}catch{}
document.addEventListener('keydown',e=>{
  if(view!=='preview'||e.target.isContentEditable||e.target.closest('.panel-resize')||document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  const ctrl=e.ctrlKey||e.metaKey;
  if(ctrl&&e.key.toLowerCase()==='s'){e.preventDefault();if(editingNode)applyPatch(editingNode,fieldPatch()).catch(err=>toast(err.message));}
  else if(ctrl&&['c','x'].includes(e.key.toLowerCase())){e.preventDefault();copyElements(e.key.toLowerCase()==='x').catch(err=>toast(err.message));}
  else if(ctrl&&e.key.toLowerCase()==='v'){const serial=pasteEventSerial;setTimeout(()=>{if(serial===pasteEventSerial&&canvasClipboardTarget(e))pasteElements().catch(err=>toast(err.message));},100);}
  else if(ctrl&&e.key.toLowerCase()==='a'){e.preventDefault();const parent=selected?.parent??selected?.key,nodes=editor.nodes.filter(n=>n.parent===parent&&n.source&&n.visible).slice(0,64);if(nodes.length){picked=new Set(nodes.map(n=>n.key));const key=nodes.at(-1).key;state.selection=key;selected=nodes.at(-1);lastPasteParent=null;renderLayers();renderProperties();drawSelection();api('select',{key,keys:[...picked]}).catch(err=>toast(err.message));}}
  else if(e.key==='Delete'){e.preventDefault();deleteElements().catch(err=>toast(err.message));}
  else if(ctrl&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected().catch(err=>toast(err.message));}
  else if(e.key==='Escape'){e.preventDefault();if(drag)cancelDrag();else {picked.clear();selected=null;choose(null).catch(err=>toast(err.message));}}
  else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&picked.size){
    e.preventDefault();if(saving||e.repeat)return;const step=e.shiftKey?10:1;
    try{applyBatch(pickedNodes().map(node=>({node,patch:offsetPatch(node,e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)})),'키보드 이동').catch(err=>toast(err.message));}catch(err){toast(err.message);}
  }else if(e.key.toLowerCase()==='f'&&!ctrl&&picked.size){e.preventDefault();$('zoom').value='selection';fit();}
  else if(['0','+','=','-'].includes(e.key)&&!ctrl){const steps=[.5,.75,1,1.5,2,3];$('zoom').value=e.key==='0'?'fit':String(e.key==='-'?steps.filter(v=>v<scale).at(-1)||.5:steps.find(v=>v>scale)||3);fit();}
});
document.addEventListener('keydown',e=>{if(view!=='json'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&e.target.closest('#propertiesForm')){e.preventDefault();applyPatch(editingNode,fieldPatch()).catch(err=>toast(err.message));}});

function renderDiagnostics(){
  const rows=[...(editor.issues||[]).map(message=>({kind:'PACK',message})),...(state.project?layoutIssues(editor.nodes,state.project.viewport,state.project.previewDevice):[]),...(state.report?.diagnostics||[]),...(state.report?.warnings||[]),...(editor.unresolved||[])];
  const seen=new Set(), list=$('diagnostics');list.replaceChildren();
  for(const issue of rows){
    const code=issue.kind||issue.code||'INFO';
    const message=code==='FONT_UNAVAILABLE'?'Minecraft 글꼴을 읽지 못해 대체 글꼴로 표시합니다. 게임과 글자 폭·줄바꿈이 다를 수 있습니다.':issue.message||issue.reason||JSON.stringify(issue);
    const k=code+message;if(seen.has(k))continue;seen.add(k);
    const row=el('div',undefined,'issue');row.append(el('span',code,'issue-code'),el('p',message));
    if(issue.pointer&&editor.nodes.some(n=>n.key===issue.pointer)){const find=el('button','찾기');find.onclick=()=>choose(issue.pointer).catch(e=>toast(e.message));row.append(find);}
    list.append(row);if(seen.size>=40)break;
  }
  if(state.error)list.prepend(el('div',state.error,'issue'));
  if(state.editorError)list.prepend(el('div',state.editorError,'issue'));
  if(state.restoreError)list.prepend(el('div','이전 팩을 다시 열지 못했습니다: '+state.restoreError,'issue'));
  if(!rows.length)list.append(el('div','현재 정적 검사에서 보고된 문제가 없습니다. 게임에서 표시·클릭·닫기를 확인하세요.','muted'));
  $('issueCount').textContent=seen.size?'확인 '+seen.size:'오류 0';$('issueCount').classList.toggle('warning',seen.size>0);
}
async function nativeHealth(){try{const r=await api('review',{limit:0});$('nativeStatus').textContent=r.connected?'Minecraft 브리지 연결됨 · 게임 화면은 별도 공유':'Minecraft 브리지 미연결';}catch{$('nativeStatus').textContent='Minecraft 브리지 확인 불가';}}
function renderCodex(ai){
  if(!ai)return;lastAi=ai;const waiting=ai.requests?.length,status=waiting?'답변·승인 대기':ai.busy?'작업 중':ai.state==='connecting'?'연결 중':ai.error?'오류 확인':ai.state==='connected'?'연결됨':'연결 전';$('codexStatus').textContent=status;
  $('codexSessionChip').textContent='Codex · '+status;$('codexSessionButton').dataset.state=waiting?'waiting':ai.busy?'busy':ai.state;$('codexSessionButton').title=(ai.sessionTitle||'Studio 대화')+(ai.threadId?' · '+ai.threadId:' · 메시지를 보내면 새 세션을 시작합니다.');
  $('codexSessionTitle').textContent=ai.sessionTitle||'Studio 대화 · 시작 전';$('codexSessionMeta').textContent=ai.threadId?`${status} · 메시지 ${ai.messageCount??ai.messages?.length??0}개${waiting?' · 확인 요청 '+waiting+'개':''}`:'메시지를 보내면 대화 세션이 만들어집니다.';
  $('codexThreadId').textContent=ai.threadId||'아직 없음';$('codexTurnId').textContent=ai.turnId||'대기';$('codexAccount').textContent=ai.account||'확인 전';$('copyCodexSession').disabled=!ai.threadId;
  $('codexStartedAt').textContent=ai.sessionStartedAt?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(ai.sessionStartedAt):'아직 없음';
  $('codexConnect').disabled=ai.state==='connecting';$('chatSend').disabled=ai.busy&&!ai.turnId;$('chatSend').textContent=ai.busy?'피드백 ↑':'보내기 ↑';$('codexStop').hidden=!ai.busy;
  const list=$('chatMessages');if(ai.messages?.length){const atBottom=list.scrollHeight-list.scrollTop-list.clientHeight<80;list.replaceChildren();for(const m of ai.messages){const block=el('div',undefined,'message '+m.role);block.append(el('small',m.role==='user'?'YOU':'CODEX'),el('span',m.text));list.append(block);}if(atBottom)list.scrollTop=list.scrollHeight;}else list.replaceChildren(el('div','요소를 선택하고 “이 버튼 간격을 맞춰줘”처럼 요청하세요.','chat-placeholder'));
  const requests=$('codexRequests');requests.replaceChildren();
  for(const request of ai.requests||[]){
    const box=el('div',undefined,'request');box.append(el('strong',request.method.endsWith('requestUserInput')?'Codex 질문':'Codex 실행 승인'),el('pre',JSON.stringify(request.params,null,2)));
    if(request.method==='mcpServer/elicitation/request'){
      const fields=[];
      for(const [name,schema]of Object.entries(request.params.requestedSchema?.properties||{})){
        const label=el('label',schema.title||name);let input;
        if(schema.enum){input=el('select');for(const value of schema.enum)input.append(new Option(String(value),String(value)));}
        else {input=el('input');input.type=schema.type==='boolean'?'checkbox':schema.type==='number'||schema.type==='integer'?'number':'text';if(schema.default!==undefined){if(input.type==='checkbox')input.checked=schema.default===true;else input.value=String(schema.default);}}
        label.append(input);box.append(label);fields.push([name,schema,input]);
      }
      for(const [decision,label]of [['accept','요청 허용'],['decline','거절']]){const b=el('button',label);b.onclick=()=>api('codex_reply',{id:request.id,decision,content:Object.fromEntries(fields.map(([name,schema,input])=>[name,schema.type==='boolean'?input.checked:schema.type==='number'||schema.type==='integer'?Number(input.value):input.value]))}).catch(e=>toast(e.message));box.append(b);}
    }else if(request.method.endsWith('requestUserInput')){
      const fields=[];for(const q of request.params.questions||[]){const label=el('label',q.question);const field=el('input');label.append(field);box.append(label);fields.push([q.id,field]);}
      const reply=el('button','답변 보내기');reply.onclick=()=>api('codex_reply',{id:request.id,answers:Object.fromEntries(fields.map(([id,f])=>[id,{answers:[f.value]}]))}).catch(e=>toast(e.message));box.append(reply);
    }else for(const [decision,label]of [['accept','이번 실행 허용'],['decline','거절']]){const b=el('button',label);b.onclick=()=>api('codex_reply',{id:request.id,decision}).catch(e=>toast(e.message));box.append(b);}
    requests.append(box);
  }
  if(ai.error)$('codexStatus').title=ai.error;
}

function openPackDialog(){guardSourceBuffer();$('openDialog').showModal();document.querySelector('.main-menu').open=false;}
on('openPack','click',openPackDialog);on('explorerOpen','click',openPackDialog);
on('openForm','submit',async e=>{e.preventDefault();guardSourceBuffer();await api('open',{rpRoot:$('rpPath').value.trim(),...($('vanillaPath').value.trim()?{vanillaRoot:$('vanillaPath').value.trim()}:{})});source=null;view='preview';localStorage.setItem('studio-rp',$('rpPath').value.trim());localStorage.setItem('studio-vanilla',$('vanillaPath').value.trim());$('openDialog').close();await refreshStudio(true);});
async function newProject(){guardSourceBuffer();await api('new_project');source=null;view='preview';document.querySelector('.main-menu').open=false;await refreshStudio(true);toast('workspace에 새 프로젝트를 만들었습니다.');}
on('newProject','click',newProject);on('welcomeNew','click',newProject);
on('screenSearch','input',renderScreens);
for(const [id,direction]of [['undo','undo'],['redo','redo']])on(id,'click',async()=>{await api('history',{direction});await refreshStudio(true);});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!document.querySelector('dialog[open]')&&!e.target.isContentEditable&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();if(saving)return;api('history',{direction:e.shiftKey?'redo':'undo'}).then(()=>refreshStudio(true)).catch(error=>toast(error.message));}});
on('viewport','change',async()=>{if(!state.project)return;if($('viewport').value==='custom'){openDeviceDialog();return;}await useDevice($('viewport').value);});
on('interaction','change',async()=>{await api('render',{interactionState:$('interaction').value});await refreshStudio(true);});
on('refresh','click',async()=>{await api('render');await refreshStudio(true);await nativeHealth();});
on('previewTab','click',()=>{view='preview';updateView();});on('gameTab','click',()=>{view='game';updateView();});
function guardSourceBuffer(){if(sourceDirty)throw Error('JSON 탭에 저장하지 않은 변경이 있습니다. 저장하거나 ‘변경 버리기’를 눌러 주세요.');}
function updateSourceLines(){$('sourceLines').textContent=Array.from({length:$('sourceText').value.split('\n').length},(_,i)=>i+1).join('\n');$('sourceDirtyBadge').hidden=!sourceDirty;$('jsonTab').textContent='{ } JSON'+(sourceDirty?' ●':'');$('discardSource').disabled=!sourceDirty;}
async function readSelected(){if(!sourceDirty){const path=selected?.source?.path||editor.screens.find(s=>s.control===state.project?.control)?.path;if(!path)throw Error('팩과 원본 요소를 먼저 선택하세요.');source={...await api('read_source',{path}),rpRoot:state.project.rpRoot};$('sourceTitle').textContent=source.path;$('sourceText').value=source.text;updateSourceLines();}view='json';updateView();$('sourceText').focus();}
on('readSelection','click',readSelected);on('sourceButton','click',readSelected);
on('jsonTab','click',readSelected);
on('sourceText','input',()=>{sourceDirty=$('sourceText').value!==source?.text;updateSourceLines();});
on('sourceText','scroll',()=>{$('sourceLines').scrollTop=$('sourceText').scrollTop;});
on('discardSource','click',()=>{$('sourceText').value=source?.text??'';sourceDirty=false;updateSourceLines();});
async function saveSource(){if(!source||source.rpRoot!==state.project?.rpRoot)throw Error('원본 팩이 바뀌었습니다. 변경 내용을 보관하고 원본을 다시 여세요.');await api('write_source',{path:source.path,text:$('sourceText').value,expectedHash:source.sha256});sourceDirty=false;source={...await api('read_source',{path:source.path}),rpRoot:state.project.rpRoot};$('sourceText').value=source.text;updateSourceLines();await api('render');await refreshStudio(true);toast('원본을 저장했습니다.');}
on('saveSource','click',saveSource);
window.addEventListener('beforeunload',e=>{if(sourceDirty){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&view==='json'){e.preventDefault();saveSource().catch(err=>toast(err.message));}});
on('fixtureButton','click',()=>{$('viewDialog').close();$('fixtureText').value=JSON.stringify(state.project?.fixture||{},null,2);$('fixtureDialog').showModal();});
on('saveFixture','click',async()=>{const fixture=JSON.parse($('fixtureText').value);if(!fixture||Array.isArray(fixture)||typeof fixture!=='object')throw Error('fixture는 JSON object여야 합니다.');await api('render',{fixture});$('fixtureDialog').close();await refreshStudio(true);});
function parentNode(){let node=selected;while(node&&!['panel','screen','stack_panel','grid'].includes(node.type))node=editor.nodes.find(n=>n.key===node.parent);return node||editor.nodes[0];}
async function add(type,texture){const node=parentNode();if(!node?.source)throw Error('편집 가능한 부모 패널을 선택하세요.');await api('add',{key:node.key,expectedRevision:state.studioRevision,expectedHash:node.source.sha256,type,...(texture?{texture}:{})});await refreshStudio(true);}
on('addLabel','click',()=>add('label'));on('addPanel','click',()=>add('panel'));on('addImage','click',()=>{if(!state.project)throw Error('팩을 먼저 여세요.');$('imageFile').click();});
on('imageFile','change',async()=>{const file=$('imageFile').files[0];if(!file)return;const data=await new Promise((accept,reject)=>{const r=new FileReader();r.onload=()=>accept(r.result);r.onerror=reject;r.readAsDataURL(file);});const result=await api('import_image',{name:file.name,data});await api('render');await refreshStudio(true);await add('image',result.texture);$('imageFile').value='';toast('RP에 이미지를 추가했습니다.');});
on('codexConnect','click',async()=>{renderCodex(await api('codex_connect'));toast('Codex 연결을 확인했습니다.');});
on('chatForm','submit',async e=>{e.preventDefault();const text=$('chatInput').value.trim();if(!text)return;if($('includePreview').checked)await shareBrowserPreview();renderCodex(await api('codex_message',{text,includePreview:$('includePreview').checked,includeGame:$('includeGame').checked}));$('chatInput').value='';});
on('codexStop','click',async()=>renderCodex(await api('codex_interrupt')));
on('codexSessionButton','click',()=>setSidebar('chat'));
on('copyCodexSession','click',async()=>{if(!lastAi?.threadId)return;try{await navigator.clipboard.writeText(lastAi.threadId);toast('Codex 세션 ID를 복사했습니다.');}catch{toast('브라우저가 클립보드 쓰기를 막았습니다. 세션 ID를 직접 선택해 복사하세요.');}});
on('viewOptions','click',()=>$('viewDialog').showModal());

async function stopShare(){clearInterval(frameTimer);for(const track of stream?.getTracks()||[])track.stop();stream=null;$('gameVideo').srcObject=null;$('gameShare').textContent='▣ Minecraft 창 연결';await sharingFrame?.catch(()=>{});await api('game_stop');state.gameFrame=null;updateView();}
on('gameShare','click',async()=>{
  if(stream){await stopShare();return;}
  if(!navigator.mediaDevices?.getDisplayMedia)throw Error('이 브라우저에서 창 공유를 지원하지 않습니다. Chrome 또는 Edge로 열어 주세요.');
  stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:5},audio:false});$('gameVideo').srcObject=stream;await $('gameVideo').play();
  $('gameShare').textContent='■ 창 공유 중단';view='game';updateView();
  stream.getVideoTracks()[0].onended=stopShare;
  const canvas=document.createElement('canvas');let pending=false;
  const frame=async()=>{if(pending||!stream||!$('gameVideo').videoWidth)return;pending=true;try{const v=$('gameVideo'),ratio=Math.min(1,1280/v.videoWidth);canvas.width=Math.round(v.videoWidth*ratio);canvas.height=Math.round(v.videoHeight*ratio);canvas.getContext('2d').drawImage(v,0,0,canvas.width,canvas.height);sharingFrame=api('game_frame',{data:canvas.toDataURL('image/png'),source:stream.getVideoTracks()[0].label});await sharingFrame;}catch(e){toast(e.message);}finally{pending=false;}};
  await frame();frameTimer=setInterval(frame,2000);
});
function updateDeviceSummary(){
  const p=state.project,d=p?.previewDevice;
  $('deviceSummary').textContent=p?`${d?.name||'직접 설정'}${d?' · 출력 '+d.physicalSize.join(' × ')+'px':''} · 작업 ${p.viewport.join(' × ')} UI`:'팩을 열면 화면 크기를 설정할 수 있습니다.';
  $('deviceEvidence').textContent=d?'기기 비교용 시험값':'현재 작업 크기';
}
function drawSafeArea(){
  const svg=$('safeArea');svg.replaceChildren();svg.hidden=$('safeToggle').getAttribute('aria-pressed')!=='true';
  if(!state.project||!state.project.previewDevice?.safeInsets.some(v=>v>0))return;
  const [w,h]=state.project.viewport,r=safeRect(state.project.viewport,state.project.previewDevice);
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const outside=document.createElementNS('http://www.w3.org/2000/svg','path');outside.setAttribute('fill-rule','evenodd');outside.setAttribute('d',`M0 0H${w}V${h}H0Z M${r.x} ${r.y}H${r.x+r.w}V${r.y+r.h}H${r.x}Z`);svg.append(outside);
  const box=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v]of Object.entries({x:r.x,y:r.y,width:r.w,height:r.h}))box.setAttribute(k,v);svg.append(box);
}
async function useDevice(id){
  const preset=DEVICE_PRESETS.find(p=>p.id===id);if(!preset)throw Error('기기를 선택하세요.');
  if(saving||drag)throw Error('현재 편집을 마친 뒤 기기를 바꿔 주세요.');
  try{await api('configure_viewport',{viewport:preset.viewport,previewDevice:{presetId:id}});$('zoom').value='fit';await refreshStudio(true);}catch(e){$('viewport').value=state.project?.previewDevice?.presetId??'custom';throw e;}
}
function populateDeviceForm(preset){
  const p=preset||{viewport:state.project?.viewport||[480,270],physicalSize:state.project?.previewDevice?.physicalSize||[1920,1080],safeInsets:state.project?.previewDevice?.safeInsets||[0,0,0,0]};
  $('physicalW').value=p.physicalSize[0];$('physicalH').value=p.physicalSize[1];$('logicalW').value=p.viewport[0];$('logicalH').value=p.viewport[1];
  ['safeLeft','safeTop','safeRight','safeBottom'].forEach((id,i)=>$(id).value=p.safeInsets[i]);$('densityPreset').value='custom';updateDeviceCalculation();
}
function updateDeviceCalculation(){
  const pw=Number($('physicalW').value),ph=Number($('physicalH').value),w=Number($('logicalW').value),h=Number($('logicalH').value);
  const mismatch=Math.abs(pw/ph-w/h)/(pw/ph)>.005;
  $('deviceCalculation').textContent=w>0&&h>0?`작업 1단위 ≈ 가로 ${(pw/w).toFixed(2)} / 세로 ${(ph/h).toFixed(2)} 출력 픽셀${mismatch?' · 가로세로 비율이 다릅니다. 출력 비율 맞추기를 사용하세요.':''}`:'작업 크기를 입력하세요.';
  const source=DEVICE_PRESETS.find(p=>p.id===$('devicePreset').value)?.source;$('deviceSource').hidden=!source;if(source)$('deviceSource').href=source;
}
function openDeviceDialog(){
  $('viewDialog').close();
  $('devicePreset').value=state.project?.previewDevice?.presetId??'custom';populateDeviceForm();$('deviceDialog').showModal();
}
on('deviceSettings','click',openDeviceDialog);
on('devicePreset','change',()=>populateDeviceForm(DEVICE_PRESETS.find(p=>p.id===$('devicePreset').value)));
on('deviceForm','input',updateDeviceCalculation);
on('matchAspect','click',()=>{$('logicalW').value=Math.round(Number($('logicalH').value)*Number($('physicalW').value)/Number($('physicalH').value));updateDeviceCalculation();});
on('densityPreset','change',()=>{if($('densityPreset').value!=='custom'){$('logicalH').value=$('densityPreset').value;$('logicalW').value=Math.round(Number($('logicalH').value)*Number($('physicalW').value)/Number($('physicalH').value));updateDeviceCalculation();}});
on('rotateDevice','click',()=>{for(const [a,b]of [['physicalW','physicalH'],['logicalW','logicalH']]){const value=$(a).value;$(a).value=$(b).value;$(b).value=value;}const margins=['safeLeft','safeTop','safeRight','safeBottom'].map(id=>$(id).value);['safeLeft','safeTop','safeRight','safeBottom'].forEach((id,i)=>$(id).value=margins[(i+3)%4]);updateDeviceCalculation();});
on('deviceForm','submit',async e=>{
  e.preventDefault();if(saving||drag)throw Error('앞선 편집을 마친 뒤 크기를 바꿔 주세요.');
  const viewport=[Number($('logicalW').value),Number($('logicalH').value)],previewDevice=normalizeDevice({presetId:$('devicePreset').value,physicalSize:[Number($('physicalW').value),Number($('physicalH').value)],safeInsets:['safeLeft','safeTop','safeRight','safeBottom'].map(id=>Number($(id).value))},viewport);
  await api('configure_viewport',{viewport,previewDevice});$('deviceDialog').close();$('zoom').value='fit';await refreshStudio(true);
});
on('readScreenshotSize','click',()=>$('screenshotSizeFile').click());
on('screenshotSizeFile','change',async()=>{const file=$('screenshotSizeFile').files[0];if(!file)return;try{const img=await createImageBitmap(file);$('physicalW').value=img.width;$('physicalH').value=img.height;img.close();$('devicePreset').value='custom';updateDeviceCalculation();}finally{$('screenshotSizeFile').value='';}});
on('safeToggle','click',()=>{$('safeToggle').setAttribute('aria-pressed',String($('safeToggle').getAttribute('aria-pressed')!=='true'));drawSafeArea();});
on('selectionZoom','click',()=>{$('zoom').value='selection';fit();});
function setFocusMode(active){$('focusMode').setAttribute('aria-pressed',String(active));$('focusMode').textContent=active?'패널 복원':'집중 모드';document.querySelector('.workspace').classList.toggle('focus-mode',active);fit();}
on('focusMode','click',()=>{$('viewDialog').close();setFocusMode($('focusMode').getAttribute('aria-pressed')!=='true');});
function setSidebar(mode){setFocusMode(false);$('sidebarMode').value=mode;document.querySelector('.right').dataset.mode=mode;$('propertiesTab').classList.toggle('active',mode!=='chat');$('codexTab').classList.toggle('active',mode!=='properties');fit();}
on('propertiesTab','click',()=>setSidebar('properties'));on('codexTab','click',()=>setSidebar('chat'));
on('activityCodex','click',()=>{setSidebar('chat');$('chatInput').focus();});
function setExplorer(visible){setFocusMode(false);document.querySelector('.workspace').classList.toggle('explorer-hidden',!visible);$('activityExplorer').classList.toggle('active',visible);$('activityExplorer').setAttribute('aria-pressed',String(visible));fit();}
on('activityExplorer','click',()=>setExplorer($('activityExplorer').getAttribute('aria-pressed')!=='true'));
on('activitySearch','click',()=>{setExplorer(true);$('screenSearch').focus();});
on('activitySettings','click',()=>$('settingsDialog').showModal());
on('activityProblems','click',()=>{document.querySelector('.workspace').classList.remove('diagnostics-collapsed');$('diagnostics').hidden=false;$('diagnosticToggle').textContent='접기';fit();});
function updateWorkbench(){const current=editor.screens.find(s=>s.control===state.project?.control);$('packLabel').textContent=editor.packName||'리소스팩';$('projectName').textContent=editor.packName||'팩을 열어 시작하세요';$('fileTabName').textContent=current?.path?.split('/').at(-1)||'UI 화면';$('fileBreadcrumb').textContent=current?current.path+'  ›  '+state.project.control:'ui / 화면을 선택하세요';}
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('studio-theme',theme);const label=theme==='dark'?'밝은 테마로 전환':'어두운 테마로 전환';$('themeToggle').title=label;$('themeToggle').setAttribute('aria-label',label);}
setTheme(localStorage.getItem('studio-theme')==='light'?'light':'dark');on('themeToggle','click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||document.querySelector('dialog[open]'))return;if(e.key.toLowerCase()==='p'){e.preventDefault();setExplorer(true);$('screenSearch').focus();}if(e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();setExplorer($('activityExplorer').getAttribute('aria-pressed')!=='true');}});
for(const [id,property,min,max,direction]of [['leftResize','--explorer-width',180,380,1],['rightResize','--inspector-width',280,460,-1]]){
  const handle=$(id),panel=handle.parentElement;let resizing=null;
  const width=value=>{const remaining=window.innerWidth-(id==='leftResize'?document.querySelector('.right').clientWidth:document.querySelector('.left').clientWidth)-52-300;const n=Math.round(Math.max(min,Math.min(max,remaining,value)));document.querySelector('.workspace').style.setProperty(property,n+'px');handle.setAttribute('aria-valuenow',n);localStorage.setItem('studio-panel-'+id,n);};
  const stored=Number(localStorage.getItem('studio-panel-'+id));if(stored>=min&&stored<=max)width(stored);
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;resizing={x:e.clientX,w:panel.clientWidth};handle.setPointerCapture(e.pointerId);});
  handle.addEventListener('pointermove',e=>{if(resizing)width(resizing.w+(e.clientX-resizing.x)*direction);});
  const finish=()=>{resizing=null;};handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);handle.addEventListener('lostpointercapture',finish);
  handle.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();width(e.key==='Home'?min:e.key==='End'?max:panel.clientWidth+(e.key==='ArrowRight'?10:-10)*direction);}});
}
function constrainPanels(){
  if(innerWidth<=900)return;const workspace=document.querySelector('.workspace'),style=getComputedStyle(workspace);
  let left=parseFloat(style.getPropertyValue('--explorer-width')),right=parseFloat(style.getPropertyValue('--inspector-width'));
  const excess=Math.max(0,left+right+52+280-innerWidth);left=Math.max(180,left-excess);right=Math.max(280,Math.min(right,innerWidth-52-280-left));
  workspace.style.setProperty('--explorer-width',left+'px');workspace.style.setProperty('--inspector-width',right+'px');
  $('leftResize').setAttribute('aria-valuenow',Math.round(left));$('rightResize').setAttribute('aria-valuenow',Math.round(right));
}
window.addEventListener('resize',constrainPanels);constrainPanels();
on('checkLayout','click',()=>{renderDiagnostics();$('diagnostics').hidden=false;document.querySelector('.workspace').classList.remove('diagnostics-collapsed');$('diagnosticToggle').textContent='접기';});
on('exportPng','click',async()=>{const capture=await capturePreview();if(!capture)throw Error('미리보기 갱신이 끝난 뒤 저장하세요.');const a=el('a');a.download=(state.project.control.replace(/[^a-zA-Z0-9_.-]/g,'_'))+'.png';a.href=capture.canvas.toDataURL('image/png');a.click();toast('안내선 없이 편집 화면을 PNG로 저장했습니다.');});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!document.querySelector('dialog[open]')&&!e.target.closest('input,textarea,select,button,summary,a')){e.preventDefault();spaceHeld=true;$('canvasViewport').classList.add('pan-ready');}});
document.addEventListener('keyup',e=>{if(e.code==='Space'){spaceHeld=false;$('canvasViewport').classList.remove('pan-ready');}});
window.addEventListener('blur',()=>{spaceHeld=false;pan=null;$('canvasViewport').classList.remove('pan-ready');});
$('canvasViewport').addEventListener('pointerdown',e=>{if(!(spaceHeld||e.button===1)||view!=='preview')return;e.preventDefault();e.stopPropagation();const area=$('canvasViewport');pan={x:e.clientX,y:e.clientY,left:area.scrollLeft,top:area.scrollTop,pointer:e.pointerId};area.setPointerCapture(e.pointerId);},true);
$('canvasViewport').addEventListener('pointermove',e=>{if(!pan||pan.pointer!==e.pointerId)return;$('canvasViewport').scrollLeft=pan.left+pan.x-e.clientX;$('canvasViewport').scrollTop=pan.top+pan.y-e.clientY;});
for(const name of ['pointerup','pointercancel'])$('canvasViewport').addEventListener(name,()=>{pan=null;});
async function comparisonCanvas(profile){
  const canvas=document.createElement('canvas'),[w,h]=profile.viewport;canvas.width=w*2;canvas.height=h*2;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
  const missing=profile.diagnostics.filter(d=>d.kind==='FONT_UNAVAILABLE'),nodes=profile.nodes;
  const entries=[...profile.layers.map((s,index)=>({...s,index,node:nodes.find(n=>n.key===(s.pointer||'/'))})),...nodes.filter(n=>n.visible&&n.type==='label'&&missing.some(d=>d.pointer===n.key||d.control===n.id||d.control===n.qualified)).map(node=>({node,index:node.index,layer:node.layer,text:true}))].sort((a,b)=>(a.layer-b.layer)||((a.node?.index??a.index)-(b.node?.index??b.index)));
  for(const entry of entries){if(entry.text)paintText(ctx,entry.node,entry.node.rect);else{const image=new Image();image.src=entry.data;await image.decode();const r=entry.bounds;ctx.drawImage(image,r.x,r.y,r.w,r.h);}}
  const preset=DEVICE_PRESETS.find(p=>p.id===profile.id);
  if(preset?.safeInsets.some(v=>v>0)){const r=safeRect(profile.viewport,preset);ctx.fillStyle='#f59e0b18';ctx.fillRect(0,0,w,r.y);ctx.fillRect(0,r.y,r.x,r.h);ctx.fillRect(r.x+r.w,r.y,w-r.x-r.w,r.h);ctx.fillRect(0,r.y+r.h,w,h-r.y-r.h);ctx.strokeStyle='#d99a24';ctx.setLineDash([4,3]);ctx.strokeRect(r.x,r.y,r.w,r.h);}
  return canvas;
}
on('compareDevices','click',async()=>{
  $('viewDialog').close();
  if(!state.project||state.stale||saving||drag)throw Error('미리보기 갱신을 마친 뒤 비교하세요.');
  const revision=state.studioRevision,grid=$('comparisonGrid');grid.replaceChildren(el('div','같은 원본으로 4개 기기를 계산 중입니다…','empty'));$('compareDialog').showModal();
  try{const result=await api('compare_viewports',{expectedRevision:revision,presetIds:['pc-fhd','tablet-ipad','console-fhd','mobile-iphone']});if(result.revision!==state.studioRevision||state.stale)throw Error('비교 중 화면이 바뀌었습니다. 다시 비교하세요.');grid.replaceChildren();
    for(const profile of result.profiles){const preset=DEVICE_PRESETS.find(p=>p.id===profile.id),card=el('section',undefined,'comparison-card'),image=el('img');image.alt=preset.name+' 미리보기';image.src=(await comparisonCanvas(profile)).toDataURL('image/png');const issues=layoutIssues(profile.nodes,profile.viewport,preset),button=el('button','이 크기로 편집');button.onclick=()=>useDevice(preset.id).then(()=>$('compareDialog').close()).catch(e=>toast(e.message));card.append(el('h3',preset.name),image,el('p',`출력 ${preset.physicalSize.join(' × ')}px · 작업 ${profile.viewport.join(' × ')} UI`),el('p',`배치 확인 ${issues.length}개 · ${profile.diagnostics.some(d=>d.kind==='FONT_UNAVAILABLE')?'대체 글꼴':'정적 렌더'} · 시험값`),button);grid.append(card);}
  }catch(e){grid.replaceChildren(el('div',e.message,'empty'));}
});
const events=new EventSource('/events?token='+token);
let refreshPending=false, wantedRevision=null, refreshAgain=false;
async function queueRefresh(){
  refreshAgain=true;if(refreshPending)return;
  refreshPending=true;
  try {while(refreshAgain){refreshAgain=false;await refreshStudio();}}
  catch(error){toast(error.message);}
  finally {refreshPending=false;}
}
events.onmessage=async e=>{
  const next=JSON.parse(e.data);state={...state,...next};
  $('saveStatus').textContent=next.status==='rendering'?'렌더링 중':next.status==='ready'?'저장됨':next.status==='error'?'확인 필요':'대기';
  updateWorkbench();
  $('undo').disabled=!next.history?.undo;$('redo').disabled=!next.history?.redo;
  if(next.renderedRevision!==displayedRevision&&next.report?.outputPath&&!next.stale){displayedRevision=next.renderedRevision;$('preview').src='/image?token='+token+'&revision='+next.renderedRevision;}
  if(next.studioRevision!==wantedRevision && next.studioRevision){wantedRevision=next.studioRevision;await queueRefresh();}
  if(!drag&&!saving&&next.studioRevision===state.studioRevision&&JSON.stringify([...picked])!==JSON.stringify(next.selectionKeys||[])){
    picked=new Set(next.selectionKeys||[]);selected=editor.nodes.find(n=>n.key===next.selection)||null;renderLayers();renderProperties();
  }
  drawSelection();updateView();
};
events.addEventListener('codex',e=>renderCodex(JSON.parse(e.data)));
events.addEventListener('game',e=>{state.gameFrame=JSON.parse(e.data);if(state.gameFrame)$('remoteGame').src='/game-image?token='+token+'&t='+state.gameFrame.capturedAt;else $('remoteGame').removeAttribute('src');updateView();});
events.onerror=()=>{$('saveStatus').textContent='서버 연결 확인 중';};
await refreshStudio();await nativeHealth();setInterval(nativeHealth,10000);
