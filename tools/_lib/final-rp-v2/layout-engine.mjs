const ANCHORS = { top_left:[0,0],top_middle:[.5,0],top_right:[1,0],left_middle:[0,.5],center:[.5,.5],right_middle:[1,.5],bottom_left:[0,1],bottom_middle:[.5,1],bottom_right:[1,1] };

export function resolveDimension(value, axis, context, unresolved, pointer) {
  if (Number.isFinite(value)) return value;
  if (value === "fill") return axis.parent;
  if (value === "default") return axis.default ?? 0;
  if (typeof value !== "string") return fail(value);
  const pixels = value.trim().match(/^(-?\d+(?:\.\d+)?)px$/);
  if (pixels) return Number(pixels[1]);
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)%(cm|sm|c)?(?:\s*([+-])\s*(\d+(?:\.\d+)?)(?:px)?)?$/);
  if (match) {
    const basis = match[2] === "c" ? (axis.content ?? axis.parent) : match[2] === "cm" ? (axis.contentMax ?? axis.content ?? axis.parent) : match[2] === "sm" ? (axis.siblingMax ?? 0) : axis.parent;
    return basis * Number(match[1]) / 100 + (match[3] === "-" ? -1 : 1) * Number(match[4] || 0);
  }
  const arithmetic = value.trim().match(/^(-?\d+(?:\.\d+)?)(?:px)?\s*([+-])\s*(\d+(?:\.\d+)?)(?:px)?$/);
  if (arithmetic) return Number(arithmetic[1]) + (arithmetic[2] === "-" ? -1 : 1) * Number(arithmetic[3]);
  return fail(value);
  function fail(raw) { unresolved.push({ kind: "unresolved_dimension", pointer, value: raw, ...context }); return 0; }
}

import { analyzeHitRegions } from "./hit-test.mjs";

export function layoutTree(tree, options = {}) {
  const viewport = options.viewport || [480, 270], unresolved = [], nodes = [];
  const intrinsicCache = new WeakMap();
  function gridCellSize(children) {
    const measured = children.map(intrinsicSize);
    return [
      Math.max(0, ...measured.map(item => Number(item[0] || 0))),
      Math.max(0, ...measured.map(item => Number(item[1] || 0))),
    ];
  }
  function intrinsicSize(node) {
    if (!node || typeof node !== "object") return [0, 0];
    if (intrinsicCache.has(node)) return intrinsicCache.get(node);
    const props=node.props||{}, children=(node.controls||[]).filter(child=>child.visible!==false&&child.props?.visible!==false&&child.props?.ignored!==true), size=Array.isArray(props.size)?props.size:[0,0];
    let width=intrinsicNumber(size[0]),height=intrinsicNumber(size[1]);
    if(props.type==="stack_panel"){
      const measured=children.map(intrinsicSize),spacing=Math.max(0,children.length-1)*Number(props.spacing||0);
      if(props.orientation==="horizontal") { width=measured.reduce((sum,item)=>sum+item[0],0)+spacing; height=Math.max(height,0,...measured.map(item=>item[1])); }
      else { width=Math.max(width,0,...measured.map(item=>item[0])); height=measured.reduce((sum,item)=>sum+item[1],0)+spacing; }
    } else if(props.type==="grid") {
      const columns=Math.max(1,Number(props.grid_dimensions?.[0]||props.max_columns||1)),cell=gridCellSize(children),count=children.length;
      width=Math.max(width,columns*Number(cell[0]||0)); height=Math.max(height,Math.ceil(count/columns)*Number(cell[1]||0));
    }
    const result=[width,height]; intrinsicCache.set(node,result); return result;
  }
  function walk(node, parent, pointer, flow = null, siblingMax = [0,0]) {
    const p = node.props || {}, children=node.controls||[], measuredChildren=children.map(intrinsicSize), childMax=[Math.max(0,...measuredChildren.map(item=>item[0])),Math.max(0,...measuredChildren.map(item=>item[1]))], padding = normalizeBox(p.padding), contentParent = { x: parent.x + padding[3], y: parent.y + padding[0], w: Math.max(0,parent.w-padding[1]-padding[3]), h: Math.max(0,parent.h-padding[0]-padding[2]) };
    const size = Array.isArray(p.size) ? p.size : ["100%", "100%"];
    const intrinsic=intrinsicSize(node);
    const basisX = { parent: parent.w, content: intrinsic[0]||options.content?.[0], contentMax: childMax[0]||options.contentMax?.[0], siblingMax:siblingMax[0], default: options.defaults?.[0] }, basisY = { parent: parent.h, content: intrinsic[1]||options.content?.[1], contentMax: childMax[1]||options.contentMax?.[1], siblingMax:siblingMax[1], default: options.defaults?.[1] };
    const w = resolveDimension(size[0], basisX, { control: node.qualified || node.id }, unresolved, `${pointer}/size/0`), h = resolveDimension(size[1], basisY, { control: node.qualified || node.id }, unresolved, `${pointer}/size/1`);
    const from = ANCHORS[p.anchor_from] || ANCHORS.center, to = ANCHORS[p.anchor_to] || ANCHORS.center, offset = p.offset || [0,0];
    let x = parent.x + parent.w*to[0] - w*from[0] + Number(offset[0]||0), y = parent.y + parent.h*to[1] - h*from[1] + Number(offset[1]||0);
    if (flow) { x = flow.x + Number(offset[0]||0); y = flow.y + Number(offset[1]||0); }
    const clipsChildren = p.clips_children === true || p.clip_children === true;
    const rect={x,y,w,h}, clip = clipsChildren ? intersect(parent.clip || parent, rect) : parent.clip || null, alpha=(parent.alpha ?? 1)*Number(p.alpha ?? 1);
    const layer=(parent.layer ?? 0)+Number(p.layer??0);
    const out={...node,pointer,rect,contentBox:{x:x+padding[3],y:y+padding[0],w:Math.max(0,w-padding[1]-padding[3]),h:Math.max(0,h-padding[0]-padding[2]),clip,alpha,layer},clip,alpha,stackingContext:p.layer!=null||clipsChildren||Number(p.alpha??1)<1,layer};
    nodes.push(out);
    const kind=p.type;
    let cursorX=out.contentBox.x,cursorY=out.contentBox.y;
    const gridCell = kind === "grid" ? gridCellSize(children) : null;
    children.forEach((child,index)=>{let childFlow=null;if(kind==="stack_panel"){childFlow={x:cursorX,y:cursorY};} else if(kind==="grid"){const columns=Math.max(1,Number(p.grid_dimensions?.[0]||p.max_columns||1)),cell=gridCell;childFlow={x:cursorX+(index%columns)*Number(cell[0]||0),y:cursorY+Math.floor(index/columns)*Number(cell[1]||0)};}const siblings=measuredChildren.filter((_,at)=>at!==index),siblingBasis=[Math.max(0,...siblings.map(item=>item[0])),Math.max(0,...siblings.map(item=>item[1]))],laid=walk(child,out.contentBox,`${pointer}/controls/${index}`,childFlow,siblingBasis);if(kind==="stack_panel"&&laid.visible!==false&&laid.props?.ignored!==true){if(p.orientation==="horizontal")cursorX+=laid.rect.w+Number(p.spacing||0);else cursorY+=laid.rect.h+Number(p.spacing||0);}});
    return out;
  }
  const root=walk(tree,{x:0,y:0,w:viewport[0],h:viewport[1],alpha:1,clip:null,layer:0},"");
  const result={root,nodes:nodes.sort((a,b)=>a.layer-b.layer),viewport,unresolved};
  result.hitAnalysis=analyzeHitRegions(result,options.hitTest);
  result.unresolved.push(...result.hitAnalysis.diagnostics);
  return result;
}
function intrinsicNumber(value){if(Number.isFinite(value))return Number(value);const match=typeof value==="string"&&value.trim().match(/^(-?\d+(?:\.\d+)?)px$/);return match?Number(match[1]):0}
function normalizeBox(value){if(Number.isFinite(value))return[value,value,value,value];if(!Array.isArray(value))return[0,0,0,0];if(value.length===2)return[value[1],value[0],value[1],value[0]].map(Number);return[value[0]||0,value[1]||0,value[2]||0,value[3]||0].map(Number)}
function intersect(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.x+a.w,b.x+b.w),bottom=Math.min(a.y+a.h,b.y+b.h);return{x,y,w:Math.max(0,right-x),h:Math.max(0,bottom-y)}}
