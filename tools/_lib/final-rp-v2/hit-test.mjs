const INTERACTIVE = new Set(["button","toggle","edit_box","input_panel","tab"]);
export function analyzeHitRegions(layout, options = {}) {
  const viewport=layout.viewport||[0,0], nodes=(layout.nodes||[]).map((node,order)=>decorate(node,order)).filter(Boolean), diagnostics=[];
  for(const node of nodes){node.occludedBy=nodes.filter(other=>other.order>node.order&&other.layer>=node.layer&&overlap(node.hitRect,other.hitRect)&&other.consumesInput).map(other=>other.id);if(node.occludedBy.length)diagnostics.push({kind:"INTERACTION_OCCLUDED",impact:"blocking",control:node.id,occludedBy:node.occludedBy});const ratio=area(node.hitRect)/Math.max(1,viewport[0]*viewport[1]);node.coverageRatio=ratio;if(ratio>= (options.excessiveRatio??.8))diagnostics.push({kind:"EXCESSIVE_HIT_AREA",impact:"blocking",control:node.id,coverageRatio:ratio});}
  const sweep=pointerSweep(nodes,viewport,options);
  diagnostics.push(...sweep.diagnostics);
  return { schema:"mcbe-jsonui-ai-kit/hit-analysis@1",viewport,nodes,focusGraph:nodes.filter(n=>n.focusable).map(n=>({control:n.id,scope:n.focusScope})),pointerSweep:sweep,diagnostics,ok:!diagnostics.some(d=>d.impact==="blocking") };
}
export function pointerSweep(nodes, viewport, options={}) {
  const step=Math.max(1,options.step??Math.ceil(Math.max(...viewport)/20)), points=[];
  for(let y=0;y<viewport[1];y+=step)for(let x=0;x<viewport[0];x+=step)points.push([x+.5,y+.5]);
  for(const node of nodes){const r=node.hitRect;points.push([r.x+r.w/2,r.y+r.h/2],[r.x+.5,r.y+.5],[r.x+r.w-.5,r.y+r.h-.5]);}
  const unique=[...new Map(points.filter(([x,y])=>x>=0&&y>=0&&x<viewport[0]&&y<viewport[1]).map(p=>[p.join(","),p])).values()], samples=[],counts=new Map();
  for(const point of unique){const hits=nodes.filter(n=>contains(n.hitRect,point)).sort((a,b)=>b.layer-a.layer||b.order-a.order),target=hits[0]||null;samples.push({point,target:target?.id??null,hits:hits.map(n=>n.id)});if(target)counts.set(target.id,(counts.get(target.id)||0)+1);}
  const diagnostics=[];for(const [control,count]of counts){const ratio=count/Math.max(1,samples.length);if(ratio>= (options.excessiveSweepRatio??.8))diagnostics.push({kind:"POINTER_SWEEP_SCREENWIDE",impact:"blocking",control,coverageRatio:ratio});}
  return {step,sampleCount:samples.length,samples,coverage:Object.fromEntries([...counts].map(([id,count])=>[id,count/samples.length])),heatmap:{width:Math.ceil(viewport[0]/step),height:Math.ceil(viewport[1]/step)},diagnostics};
}
function decorate(node,order){const p=node.props||{},type=p.type;if(!INTERACTIVE.has(type)||node.visible===false||p.visible===false||p.ignored===true||p.enabled===false||node.alpha<=0)return null;const visualRect={...node.rect},hitRect=intersect(node.clip||node.rect,node.rect);if(hitRect.w<=0||hitRect.h<=0)return null;return{id:node.qualified||node.id||node.pointer,control:node.qualified||node.id,pointer:node.pointer,type,visualRect,hitRect,focusable:true,focusScope:p.focus_identifier||node.qualified||node.id,layer:node.layer||0,order,consumesInput:true};}
function intersect(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),r=Math.min(a.x+a.w,b.x+b.w),d=Math.min(a.y+a.h,b.y+b.h);return{x,y,w:Math.max(0,r-x),h:Math.max(0,d-y)}}
function contains(r,[x,y]){return x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h}function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}function area(r){return Math.max(0,r.w)*Math.max(0,r.h)}
