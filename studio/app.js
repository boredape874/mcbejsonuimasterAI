const $=id=>document.getElementById(id), token=window.STUDIO_TOKEN;
let state={}, editor={nodes:[],screens:[]}, selected=null, editingNode=null, source=null, dirty=false, scale=1, displayedRevision=null, view='preview', drag=null, stream=null, frameTimer=null;
let toastTimer, imageLoadedRevision=null, sharingFrame=null;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
async function api(name,args={}){const r=await fetch('/api/'+name,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args)});const value=await r.json();if(!r.ok)throw Error(value.error);return value;}
const on=(id,event,fn)=>$(id).addEventListener(event,e=>{Promise.resolve(fn(e)).catch(error=>toast(error.message));});
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const anchors=['top_left','top_middle','top_right','left_middle','center','right_middle','bottom_left','bottom_middle','bottom_right'];
for(const id of ['propFrom','propTo'])for(const a of anchors)$(id).append(new Option(a,a));
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>button.closest('dialog').close();
$('rpPath').value=localStorage.getItem('studio-rp')||'';$('vanillaPath').value=localStorage.getItem('studio-vanilla')||'';

function fit(){
  const [w,h]=state.project?.viewport||[480,270], area=$('canvasViewport');
  scale=Math.max(.25,Math.min(3,(area.clientWidth-72)/w,(area.clientHeight-72)/h));
  $('artboard').style.width=w*scale+'px';$('artboard').style.height=h*scale+'px';drawSelection();drawApproximateFonts();
}
function drawApproximateFonts(){
  const layer=$('fontApproximation');layer.replaceChildren();
  const missing=(state.report?.diagnostics||[]).filter(d=>d.kind==='FONT_UNAVAILABLE');
  $('previewKind').textContent=missing.length?'대체 글꼴로 위치 표시 · 게임 글꼴 검증 전':'정적 렌더링 · 게임 검증 전';
  const canvas=document.createElement('canvas'),[w,h]=state.project?.viewport||[480,270];canvas.width=w;canvas.height=h;
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',imageRendering:'pixelated'});layer.append(canvas);
  const ctx=canvas.getContext('2d');
  for(const n of editor.nodes||[])if(n.visible&&n.type==='label'&&missing.some(d=>d.pointer===n.key||d.control===n.id)){
    const r=n.rect, font=8*Number(n.props.font_scale_factor||1),lineHeight=font*1.3;
    ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.font=`${font}px Consolas, "Malgun Gothic", monospace`;ctx.fillStyle=toHex(n.props.color);ctx.globalAlpha=n.props.alpha??1;ctx.textBaseline='middle';ctx.textAlign=n.props.text_alignment||'left';
    const lines=[];for(const paragraph of String(n.props.text||'').replace(/§./g,'').split('\n')){let current='';for(const char of paragraph){if(current&&ctx.measureText(current+char).width>r.w){lines.push(current);current='';}current+=char;}lines.push(current);}
    const x=ctx.textAlign==='center'?r.x+r.w/2:ctx.textAlign==='right'?r.x+r.w:r.x;
    lines.forEach((line,i)=>ctx.fillText(line,x,r.y+r.h/2+(i-(lines.length-1)/2)*lineHeight));ctx.restore();
  }
}
async function shareBrowserPreview(){
  if(imageLoadedRevision!==state.renderedRevision||state.stale||state.studioRevision!==state.renderedRevision)return;
  const [w,h]=state.project.viewport,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage($('preview'),0,0,w,h);
  const text=$('fontApproximation').querySelector('canvas');if(text)ctx.drawImage(text,0,0);
  await api('browser_frame',{revision:state.renderedRevision,data:canvas.toDataURL('image/png'),fontMode:(state.report?.diagnostics||[]).some(d=>d.kind==='FONT_UNAVAILABLE')?'approximate':'minecraft'});
}
$('preview').onload=()=>{imageLoadedRevision=Number(new URL($('preview').src).searchParams.get('revision'));drawApproximateFonts();shareBrowserPreview().catch(()=>{});};
new ResizeObserver(fit).observe($('canvasViewport'));
function drawSelection(rect=selected?.rect){
  const box=$('selectionBox');box.hidden=!rect || view!=='preview' || state.stale;
  if(!rect)return;Object.assign(box.style,{left:rect.x*scale+'px',top:rect.y*scale+'px',width:Math.max(0,rect.w*scale)+'px',height:Math.max(0,rect.h*scale)+'px'});
  box.firstElementChild.textContent=`${selected?.id||''} · ${Math.round(rect.w)} × ${Math.round(rect.h)}`;
}
function updateView(){
  $('previewTab').classList.toggle('active',view==='preview');$('gameTab').classList.toggle('active',view==='game');
  $('emptyCanvas').hidden=!!state.project || view!=='preview';$('artboard').hidden=!state.report?.outputPath || view!=='preview';
  $('gameVideo').hidden=view!=='game'||!stream;$('remoteGame').hidden=view!=='game'||!!stream||!state.gameFrame;
  $('gameEmpty').hidden=view!=='game'||!!stream||!!state.gameFrame;drawSelection();
}
async function refreshStudio(force=false){
  const value=await api('studio');state=value;editor=value.editor;renderScreens();renderLayers();
  selected=editor.nodes.find(n=>n.key===value.selection)||null;
  if(state.project)$('viewport').value=state.project.viewport.join(',');
  if(!dirty||force)renderProperties();renderDiagnostics();renderCodex(value.codex);fit();updateView();shareBrowserPreview().catch(()=>{});
}
function renderScreens(){
  const list=$('screens'), query=$('screenSearch').value.toLowerCase();list.replaceChildren();
  const matches=editor.screens.filter(s=>(s.control+' '+s.path).toLowerCase().includes(query));$('screenCount').textContent=editor.screens.length;
  for(const s of matches){
    const row=el('button',undefined,'screen-row'+(s.control===state.project?.control?' active':''));row.title=s.path+(s.registered?'':' · _ui_defs.json 미등록 / 바닐라 override 여부 확인');
    row.append(el('span',s.control.split('.').slice(1).join('.')),el('small',s.type,s.registered?'':'unregistered'));
    row.onclick=()=>api('open',{...state.project,control:s.control}).then(()=>refreshStudio(true)).catch(e=>toast(e.message));list.append(row);
  }
  if(!matches.length)list.append(el('div','검색 결과가 없습니다.','empty small'));
}
function renderLayers(){
  const list=$('layers');list.replaceChildren();$('layerCount').textContent=editor.nodes.length;
  const nodes=[...editor.nodes].sort((a,b)=>a.index-b.index);
  for(const node of nodes){
    const row=el('button',undefined,'layer-row'+(node.key===state.selection?' active':''));row.style.paddingLeft=8+Math.min(node.depth,10)*12+'px';
    row.append(el('i',node.type==='label'?'T':node.type==='image'?'▧':'▱','layer-icon'),el('span',node.id));
    if(!node.source)row.append(el('small','↗'));if(!node.visible)row.style.opacity='.5';
    row.title=`${node.type} · ${node.source?.path||'상속/생성 요소'}`;row.onclick=()=>choose(node.key).catch(e=>toast(e.message));list.append(row);
  }
}
async function choose(key){dirty=false;await api('select',{key});state.selection=key;selected=editor.nodes.find(n=>n.key===key);renderLayers();renderProperties();drawSelection();}
function toHex(color=[1,1,1]){return '#'+color.slice(0,3).map(n=>Math.round(Math.min(1,Math.max(0,Number(n)))*255).toString(16).padStart(2,'0')).join('');}
function renderProperties(){
  editingNode=selected;dirty=false;$('noSelection').hidden=!!selected;$('propertiesForm').hidden=!selected;if(!selected)return;
  const p=selected.props;$('elementId').textContent=selected.id;$('elementType').textContent=selected.type;
  $('sourceInfo').textContent=selected.source?`${selected.source.path} · ${selected.source.pointer}`:'상속/생성 요소 · 원본 선언 또는 Codex로 수정';
  $('propertyFields').disabled=!selected.source;
  $('propText').value=typeof p.text==='string'?p.text:'';$('propText').disabled=selected.type!=='label';
  $('propX').value=p.offset?.[0]??0;$('propY').value=p.offset?.[1]??0;
  $('propW').value=p.size?.[0]??'100%';$('propH').value=p.size?.[1]??'100%';
  $('propFont').value=p.font_scale_factor??1;$('propFont').disabled=selected.type!=='label';
  $('propLayer').value=p.layer??0;$('propColor').value=toHex(p.color);$('propAlpha').value=p.alpha??1;
  $('propFrom').value=p.anchor_from??'center';$('propTo').value=p.anchor_to??'center';
  $('propTexture').value=typeof p.texture==='string'?p.texture:'';$('propTexture').disabled=selected.type!=='image';$('propVisible').checked=p.visible!==false;
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
  if(!node?.source)throw Error('이 요소는 원본 선언을 찾거나 Codex로 수정하세요.');
  if(!Object.keys(patch).length)return;
  const result=await api('edit',{key:node.key,expectedRevision:state.studioRevision,expectedHash:node.source.sha256,patch});dirty=false;await refreshStudio(true);return result;
}
on('propertiesForm','input',()=>{dirty=true;});
on('propertiesForm','submit',async e=>{e.preventDefault();await applyPatch(editingNode,fieldPatch());toast('저장하고 미리보기를 갱신했습니다.');});

function point(e){const rect=$('artboard').getBoundingClientRect();return{x:(e.clientX-rect.left)/scale,y:(e.clientY-rect.top)/scale};}
$('artboard').addEventListener('pointerdown',async e=>{
  if(e.button!==0||state.stale)return;
  try{
    const start=point(e), resize=e.target.id==='resizeHandle';
    let node=selected;
    if(!resize){node=[...editor.nodes].sort((a,b)=>b.layer-a.layer||b.depth-a.depth||b.index-a.index).find(n=>n.visible&&start.x>=n.rect.x&&start.y>=n.rect.y&&start.x<=n.rect.x+n.rect.w&&start.y<=n.rect.y+n.rect.h);if(!node)return;}
    // Capture before awaiting selection; otherwise a fast drag can lose pointerup.
    $('artboard').setPointerCapture(e.pointerId);drag={node,start,resize,pointer:e.pointerId,dx:0,dy:0};
    await choose(node.key);
  }catch(error){drag=null;toast(error.message);}
});
$('artboard').addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;const p=point(e),snap=$('snap').checked?1:.1;
  drag.dx=Math.round((p.x-drag.start.x)/snap)*snap;drag.dy=Math.round((p.y-drag.start.y)/snap)*snap;
  const r=drag.node.rect;drawSelection(drag.resize?{...r,w:Math.max(1,r.w+drag.dx),h:Math.max(1,r.h+drag.dy)}:{...r,x:r.x+drag.dx,y:r.y+drag.dy});
});
async function finishDrag(e){
  if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;
  if(Math.abs(d.dx)+Math.abs(d.dy)<.5){drawSelection();return;}
  try{
    if(d.resize)await applyPatch(d.node,{size:[Math.max(1,d.node.rect.w+d.dx),Math.max(1,d.node.rect.h+d.dy)]});
    else {
      const off=d.node.props.offset||[0,0];if(off.some(n=>!Number.isFinite(n)))throw Error('동적 offset은 Codex나 원본에서 수정하세요.');
      await applyPatch(d.node,{offset:[off[0]+d.dx,off[1]+d.dy]});
    }
  }catch(error){toast(error.message);drawSelection();}
}
$('artboard').addEventListener('pointerup',finishDrag);$('artboard').addEventListener('pointercancel',()=>{drag=null;drawSelection();});

function renderDiagnostics(){
  const rows=[...(editor.issues||[]).map(message=>({kind:'PACK',message})),...(state.report?.diagnostics||[]),...(editor.unresolved||[])];
  const seen=new Set(), list=$('diagnostics');list.replaceChildren();
  for(const issue of rows){const code=issue.kind||issue.code||'INFO', message=issue.message||issue.reason||JSON.stringify(issue);const k=code+message;if(seen.has(k))continue;seen.add(k);const row=el('div',undefined,'issue');row.append(el('span',code,'issue-code'),el('p',message));list.append(row);if(seen.size>=40)break;}
  if(state.error)list.prepend(el('div',state.error,'issue'));
  if(state.editorError)list.prepend(el('div',state.editorError,'issue'));
  if(!rows.length)list.append(el('div','현재 정적 검사에서 보고된 문제가 없습니다. 게임에서 표시·클릭·닫기를 확인하세요.','muted'));
  $('issueCount').textContent=seen.size+'개';
}
async function nativeHealth(){try{const r=await api('review',{limit:0});$('nativeStatus').textContent=r.connected?'Minecraft 브리지 연결됨 · 게임 화면은 별도 공유':'Minecraft 브리지 미연결';}catch{$('nativeStatus').textContent='Minecraft 브리지 확인 불가';}}
function renderCodex(ai){
  if(!ai)return;$('codexStatus').textContent=ai.busy?'작업 중':ai.state==='connected'?'연결됨':ai.error?'연결 오류':'연결 전';
  $('codexConnect').disabled=ai.state==='connecting';$('chatSend').disabled=ai.busy&&!ai.turnId;$('chatSend').textContent=ai.busy?'피드백 ↑':'보내기 ↑';$('codexStop').hidden=!ai.busy;
  const list=$('chatMessages');if(ai.messages?.length){const atBottom=list.scrollHeight-list.scrollTop-list.clientHeight<80;list.replaceChildren();for(const m of ai.messages){const block=el('div',undefined,'message '+m.role);block.append(el('small',m.role==='user'?'YOU':'CODEX'),el('span',m.text));list.append(block);}if(atBottom)list.scrollTop=list.scrollHeight;}
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

on('openPack','click',()=>$('openDialog').showModal());
on('openForm','submit',async e=>{e.preventDefault();await api('open',{rpRoot:$('rpPath').value.trim(),...($('vanillaPath').value.trim()?{vanillaRoot:$('vanillaPath').value.trim()}:{})});localStorage.setItem('studio-rp',$('rpPath').value.trim());localStorage.setItem('studio-vanilla',$('vanillaPath').value.trim());$('openDialog').close();await refreshStudio(true);});
async function newProject(){await api('new_project');await refreshStudio(true);toast('workspace에 새 프로젝트를 만들었습니다.');}
on('newProject','click',newProject);on('welcomeNew','click',newProject);
on('screenSearch','input',renderScreens);
for(const [id,direction]of [['undo','undo'],['redo','redo']])on(id,'click',async()=>{await api('history',{direction});await refreshStudio(true);});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();api('history',{direction:e.shiftKey?'redo':'undo'}).then(()=>refreshStudio(true)).catch(error=>toast(error.message));}});
on('viewport','change',async()=>{if(!state.project)return;await api('open',{...state.project,viewport:$('viewport').value.split(',').map(Number)});await refreshStudio(true);});
on('interaction','change',async()=>{await api('render',{interactionState:$('interaction').value});await refreshStudio(true);});
on('refresh','click',async()=>{await api('render');await refreshStudio(true);await nativeHealth();});
on('previewTab','click',()=>{view='preview';updateView();});on('gameTab','click',()=>{view='game';updateView();});
async function readSelected(){const path=selected?.source?.path||editor.screens.find(s=>s.control===state.project?.control)?.path;if(!path)throw Error('팩과 원본 요소를 먼저 선택하세요.');source=await api('read_source',{path});$('sourceTitle').textContent=source.path;$('sourceText').value=source.text;$('sourceDialog').showModal();}
on('readSelection','click',readSelected);on('sourceButton','click',readSelected);
on('saveSource','click',async()=>{await api('write_source',{path:source.path,text:$('sourceText').value,expectedHash:source.sha256});$('sourceDialog').close();await api('render');await refreshStudio(true);toast('원본을 저장했습니다.');});
on('fixtureButton','click',()=>{$('fixtureText').value=JSON.stringify(state.project?.fixture||{},null,2);$('fixtureDialog').showModal();});
on('saveFixture','click',async()=>{const fixture=JSON.parse($('fixtureText').value);if(!fixture||Array.isArray(fixture)||typeof fixture!=='object')throw Error('fixture는 JSON object여야 합니다.');await api('render',{fixture});$('fixtureDialog').close();await refreshStudio(true);});
function parentNode(){let node=selected;while(node&&!['panel','screen','stack_panel','grid'].includes(node.type))node=editor.nodes.find(n=>n.key===node.parent);return node||editor.nodes[0];}
async function add(type,texture){const node=parentNode();if(!node?.source)throw Error('편집 가능한 부모 패널을 선택하세요.');await api('add',{key:node.key,expectedRevision:state.studioRevision,expectedHash:node.source.sha256,type,...(texture?{texture}:{})});await refreshStudio(true);}
on('addLabel','click',()=>add('label'));on('addPanel','click',()=>add('panel'));on('addImage','click',()=>{if(!state.project)throw Error('팩을 먼저 여세요.');$('imageFile').click();});
on('imageFile','change',async()=>{const file=$('imageFile').files[0];if(!file)return;const data=await new Promise((accept,reject)=>{const r=new FileReader();r.onload=()=>accept(r.result);r.onerror=reject;r.readAsDataURL(file);});const result=await api('import_image',{name:file.name,data});await api('render');await refreshStudio(true);await add('image',result.texture);$('imageFile').value='';toast('RP에 이미지를 추가했습니다.');});
on('codexConnect','click',async()=>{renderCodex(await api('codex_connect'));toast('Codex 연결을 확인했습니다.');});
on('chatForm','submit',async e=>{e.preventDefault();const text=$('chatInput').value.trim();if(!text)return;if($('includePreview').checked)await shareBrowserPreview();renderCodex(await api('codex_message',{text,includePreview:$('includePreview').checked,includeGame:$('includeGame').checked}));$('chatInput').value='';});
on('codexStop','click',async()=>renderCodex(await api('codex_interrupt')));

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
const events=new EventSource('/events?token='+token);
let refreshPending=false, wantedRevision=null;
events.onmessage=async e=>{
  const next=JSON.parse(e.data);state={...state,...next};
  $('saveStatus').textContent=next.status==='rendering'?'렌더링 중':next.status==='ready'?'저장됨':next.status==='error'?'확인 필요':'대기';
  $('projectName').textContent=next.project?next.project.rpRoot.split(/[\\/]/).at(-1)+' / '+next.project.control:'리소스팩을 열어 시작하세요';
  $('undo').disabled=!next.history?.undo;$('redo').disabled=!next.history?.redo;
  if(next.renderedRevision!==displayedRevision&&next.report?.outputPath&&!next.stale){displayedRevision=next.renderedRevision;$('preview').src='/image?token='+token+'&revision='+next.renderedRevision;}
  if(next.studioRevision!==wantedRevision && next.studioRevision){wantedRevision=next.studioRevision;if(!refreshPending){refreshPending=true;try{await refreshStudio();}catch(error){toast(error.message);}finally{refreshPending=false;}}}
  drawSelection();updateView();
};
events.addEventListener('codex',e=>renderCodex(JSON.parse(e.data)));
events.addEventListener('game',e=>{state.gameFrame=JSON.parse(e.data);if(state.gameFrame)$('remoteGame').src='/game-image?token='+token+'&t='+state.gameFrame.capturedAt;else $('remoteGame').removeAttribute('src');updateView();});
events.onerror=()=>{$('saveStatus').textContent='서버 연결 확인 중';};
await refreshStudio();await nativeHealth();setInterval(nativeHealth,10000);
