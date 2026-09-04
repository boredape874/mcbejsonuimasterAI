import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function canvasModule() {
  try { return await import("@napi-rs/canvas"); }
  catch { throw new Error("@napi-rs/canvas is required for local screenshot measurement"); }
}

function normalizeRect(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value) && value.length === 4) return { x: +value[0], y: +value[1], w: +value[2], h: +value[3] };
  const rect = value.rect ? normalizeRect(value.rect) : value;
  if (![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite)) throw new Error("rect must contain finite x, y, w and h values");
  return { x: +rect.x, y: +rect.y, w: +rect.w, h: +rect.h };
}

function intersect(a, b) {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y), right = Math.min(a.x + a.w, b.x + b.w), bottom = Math.min(a.y + a.h, b.y + b.h);
  return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
}

function bbox(data, width, height, searchRect, maskData = null) {
  const bounds = intersect(normalizeRect(searchRect, { x: 0, y: 0, w: width, h: height }), { x: 0, y: 0, w: width, h: height });
  if (!bounds) return null;
  const x0 = Math.floor(bounds.x), y0 = Math.floor(bounds.y), x1 = Math.ceil(bounds.x + bounds.w), y1 = Math.ceil(bounds.y + bounds.h);
  let minX = x1, minY = y1, maxX = -1, maxY = -1;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * width + x) * 4;
    if (maskData && maskData[i + 3] > 0) continue;
    if (data[i + 3] <= 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function contentBbox(data, width, height, searchRect, maskData = null, threshold = 24) {
  const bounds = intersect(normalizeRect(searchRect, { x: 0, y: 0, w: width, h: height }), { x: 0, y: 0, w: width, h: height });
  if (!bounds) return null;
  const x0=Math.floor(bounds.x),y0=Math.floor(bounds.y),x1=Math.ceil(bounds.x+bounds.w),y1=Math.ceil(bounds.y+bounds.h);
  let hasTransparency=false;
  for(let y=y0;y<y1&&!hasTransparency;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;if(data[i+3]===0){hasTransparency=true;break;}}
  if(hasTransparency)return bbox(data,width,height,bounds,maskData);
  const samples=[[x0,y0],[x1-1,y0],[x0,y1-1],[x1-1,y1-1]].map(([x,y])=>{const i=(y*width+x)*4;return[data[i],data[i+1],data[i+2]]});
  let minX=x1,minY=y1,maxX=-1,maxY=-1;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;if(maskData&&maskData[i+3]>0)continue;const distance=Math.min(...samples.map(c=>Math.hypot(data[i]-c[0],data[i+1]-c[1],data[i+2]-c[2])));if(distance<=threshold)continue;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  return maxX<0?null:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
}

function iou(a, b) {
  if (!a || !b) return 0;
  const overlap = intersect(a, b), intersection = overlap ? overlap.w * overlap.h : 0, union = a.w * a.h + b.w * b.h - intersection;
  return union ? intersection / union : 0;
}

async function pixels(imagePath) {
  const { createCanvas, loadImage } = await canvasModule(), image = await loadImage(resolve(imagePath)), canvas = createCanvas(image.width, image.height), context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data };
}

function toUi(rect, root, viewport) {
  return { x: (rect.x - root.x) * viewport.w / root.w, y: (rect.y - root.y) * viewport.h / root.h, w: rect.w * viewport.w / root.w, h: rect.h * viewport.h / root.h };
}

function toPixels(rect, root, viewport) {
  return { x: root.x + rect.x * root.w / viewport.w, y: root.y + rect.y * root.h / viewport.h, w: rect.w * root.w / viewport.w, h: rect.h * root.h / viewport.h };
}

async function optionalMask(maskPath, expected) {
  if (!maskPath) return null;
  const mask = await pixels(maskPath);
  if (mask.width !== expected.width || mask.height !== expected.height) throw new Error("maskPath dimensions must match the measured image");
  return mask.data;
}

export async function measureReference({ imagePath, regions = [], rootRect, maskPath }) {
  const image = await pixels(imagePath), root = normalizeRect(rootRect, { x: 0, y: 0, w: image.width, h: image.height }), mask = await optionalMask(maskPath, image);
  const measured = regions.map((region, index) => {
    const rect = normalizeRect(region), alphaBBox = bbox(image.data, image.width, image.height, rect, mask), contentBBox=contentBbox(image.data,image.width,image.height,rect,mask);
    return { id: region.id ?? region.name ?? `region-${index}`, rect, alphaBBox, contentBBox, relativeToRoot: contentBBox ? { x: (contentBBox.x-root.x)/root.w, y: (contentBBox.y-root.y)/root.h, w: contentBBox.w/root.w, h: contentBBox.h/root.h } : null };
  });
  return { ok: true, imagePath: resolve(imagePath), width: image.width, height: image.height, rootRect: root, alphaBBox: bbox(image.data, image.width, image.height, root, mask), contentBBox: contentBbox(image.data,image.width,image.height,root,mask), regions: measured };
}

async function readRenderReport(renderPath) {
  const candidates = [renderPath.replace(/\.png$/i, ".report.json"), `${renderPath}.report.json`];
  for (const path of candidates) if (existsSync(path)) { const report = JSON.parse(await readFile(path, "utf8")); return normalizeRenderReport(report, path); }
  return { path: null, alphaBoxes: {}, viewport: null };
}

function normalizeRenderReport(report, path = null) {
  const controls = report.controls ?? report.render?.controls ?? report.result?.controls;
  const v2Boxes = controls ? Object.fromEntries(Object.entries(controls).filter(([, value]) => value?.alphaBBox).map(([id, value]) => [id, value.alphaBBox])) : null;
  return { path, alphaBoxes: v2Boxes ?? report.render?.alphaBoxes ?? report.alphaBoxes ?? {}, viewport: report.viewport ?? report.render?.viewport ?? report.result?.viewport ?? null };
}

function featurePoints(render, maxPoints = 96) {
  const columns = 16, rows = 10, cells = new Array(columns * rows).fill(null);
  for (let y = 0; y < render.height; y++) for (let x = 0; x < render.width; x++) {
    const i=(y*render.width+x)*4,a=render.data[i+3]; if(a<224)continue;
    const neighborAlpha=(nx,ny)=>nx<0||ny<0||nx>=render.width||ny>=render.height?0:render.data[(ny*render.width+nx)*4+3],neighbors=[[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy])=>({dx,dy,alpha:neighborAlpha(x+dx,y+dy)})),edgeNeighbor=neighbors.sort((a,b)=>a.alpha-b.alpha)[0];
    const edge=Math.abs(a-edgeNeighbor.alpha);
    const chroma=Math.max(render.data[i],render.data[i+1],render.data[i+2])-Math.min(render.data[i],render.data[i+1],render.data[i+2]);
    const score=edge*4+chroma+a, cx=Math.min(columns-1,Math.floor(x*columns/render.width)),cy=Math.min(rows-1,Math.floor(y*rows/render.height)),slot=cy*columns+cx;
    if(!cells[slot]||score>cells[slot].score)cells[slot]={x,y,r:render.data[i],g:render.data[i+1],b:render.data[i+2],score,edgeDx:edge>64?edgeNeighbor.dx:0,edgeDy:edge>64?edgeNeighbor.dy:0};
  }
  const ranked=cells.filter(Boolean).sort((a,b)=>(b.score-a.score)||(a.y-b.y)||(a.x-b.x));
  return ranked.slice(0,maxPoints).sort((a,b)=>(a.y-b.y)||(a.x-b.x));
}

function rootScore(points,screenshot,mask,scale,tx,ty) {
  let score=0,used=0;
  for(const point of points){const x=Math.round(tx+(point.x+.5)*scale-.5),y=Math.round(ty+(point.y+.5)*scale-.5);if(x<0||y<0||x>=screenshot.width||y>=screenshot.height)return -1;const i=(y*screenshot.width+x)*4;if(mask&&mask[i+3]>0)continue;const distance=Math.hypot(screenshot.data[i]-point.r,screenshot.data[i+1]-point.g,screenshot.data[i+2]-point.b),colorScore=Math.max(0,1-distance/441.673);let boundaryScore=colorScore;if(point.edgeDx||point.edgeDy){const ox=Math.round(tx+(point.x+point.edgeDx+.5)*scale-.5),oy=Math.round(ty+(point.y+point.edgeDy+.5)*scale-.5);if(ox>=0&&oy>=0&&ox<screenshot.width&&oy<screenshot.height){const oi=(oy*screenshot.width+ox)*4,contrast=Math.hypot(screenshot.data[i]-screenshot.data[oi],screenshot.data[i+1]-screenshot.data[oi+1],screenshot.data[i+2]-screenshot.data[oi+2]);boundaryScore=Math.min(1,contrast/96);}}score+=colorScore*.7+boundaryScore*.3;used++;}
  return used>=Math.min(4,points.length)?score/used:-1;
}

function simplerScale(scale) { return Math.abs(scale * 4 - Math.round(scale * 4)); }

export function detectRootRect(render,screenshot,{mask=null}={}) {
  const points=featurePoints(render);if(points.length<4)return{method:"static-pixel-insufficient",score:0,rootRect:null,samples:points.length};
  const maxScale=Math.min(screenshot.width/render.width,screenshot.height/render.height);if(!(maxScale>0))return{method:"static-pixel-invalid",score:0,rootRect:null,samples:points.length};
  const minScale=Math.min(maxScale,Math.max(.25,maxScale/8)),scaleCount=24,positionStep=Math.max(3,Math.ceil(Math.min(screenshot.width,screenshot.height)/90)),coarseStride=Math.max(1,Math.ceil(points.length/32)),coarsePoints=points.filter((_,index)=>index%coarseStride===0).slice(0,32),coarseBests=[];let best={score:-1,scale:minScale,x:0,y:0};
  const scales=Array.from({length:scaleCount},(_,i)=>scaleCount===1?maxScale:minScale+(maxScale-minScale)*i/(scaleCount-1));
  for(const scale of scales){const width=render.width*scale,height=render.height*scale,maxX=Math.max(0,screenshot.width-width),maxY=Math.max(0,screenshot.height-height);let scaleBest={score:-1,scale,x:0,y:0};for(let y=0;y<=maxY+.001;y+=positionStep)for(let x=0;x<=maxX+.001;x+=positionStep){const value=rootScore(coarsePoints,screenshot,mask,scale,Math.min(x,maxX),Math.min(y,maxY));if(value>scaleBest.score)scaleBest={score:value,scale,x:Math.min(x,maxX),y:Math.min(y,maxY)};}coarseBests.push(scaleBest);if(scaleBest.score>best.score)best=scaleBest;}
  const coarseScaleStep=scaleCount>1?(maxScale-minScale)/(scaleCount-1):maxScale/10,fineScaleStep=Math.max(.001,coarseScaleStep/24);let refined={...best,score:-1};
  for(const seed of coarseBests)for(let scale=Math.max(.05,seed.scale-coarseScaleStep/2);scale<=Math.min(maxScale,seed.scale+coarseScaleStep/2)+1e-9;scale+=fineScaleStep){const width=render.width*scale,height=render.height*scale,maxX=screenshot.width-width,maxY=screenshot.height-height;if(maxX<0||maxY<0)continue;for(let y=Math.max(0,Math.floor(seed.y-positionStep));y<=Math.min(maxY,Math.ceil(seed.y+positionStep));y++)for(let x=Math.max(0,Math.floor(seed.x-positionStep));x<=Math.min(maxX,Math.ceil(seed.x+positionStep));x++){const value=rootScore(points,screenshot,mask,scale,x,y),tie=Math.abs(value-refined.score)<1e-12;if(value>refined.score+1e-12||(tie&&simplerScale(scale)<simplerScale(refined.scale)))refined={score:value,scale,x,y};}}
  return{method:"static-pixel-coarse-to-fine",score:Math.max(0,refined.score),rootRect:{x:refined.x,y:refined.y,w:render.width*refined.scale,h:render.height*refined.scale},samples:points.length,coarse:{positionStep,scaleCount}};
}

export async function compareScreenshot({ renderPath, screenshotPath, rootRect, maskPath, regions, renderReport }) {
  const render = await pixels(renderPath), screenshot = await pixels(screenshotPath), mask = await optionalMask(maskPath, screenshot);
  const rootDetection=rootRect?{method:"provided",score:1,rootRect:normalizeRect(rootRect),samples:0}:detectRootRect(render,screenshot,{mask});
  const root = rootDetection.rootRect ?? { x: 0, y: 0, w: screenshot.width, h: screenshot.height }, viewport = { w: render.width, h: render.height };
  const sidecar = renderReport ? normalizeRenderReport(renderReport) : await readRenderReport(renderPath), boxes = sidecar.alphaBoxes ?? {};
  const supplied = new Map((regions ?? []).map((region, i) => [region.id ?? region.name ?? `region-${i}`, normalizeRect(region)]));
  const elements = [];
  for (const [control, rawExpected] of Object.entries(boxes)) {
    const expectedUi = normalizeRect(rawExpected), expectedPixels = toPixels(expectedUi, root, viewport);
    const explicit = supplied.get(control), search = explicit ?? { x: expectedPixels.x - 4, y: expectedPixels.y - 4, w: expectedPixels.w + 8, h: expectedPixels.h + 8 };
    const actualPixels = explicit ?? contentBbox(screenshot.data, screenshot.width, screenshot.height, search, mask), actualUi = actualPixels ? toUi(actualPixels, root, viewport) : null;
    const delta = actualUi ? { dx: actualUi.x-expectedUi.x, dy: actualUi.y-expectedUi.y, dw: actualUi.w-expectedUi.w, dh: actualUi.h-expectedUi.h } : null;
    elements.push({ control, expectedUi, expectedPixels, actualPixels, actualUi, delta, alphaOverlap: actualUi ? iou(expectedUi, actualUi) : 0 });
  }
  const renderBBox = bbox(render.data, render.width, render.height, null), screenshotBBox = bbox(screenshot.data, screenshot.width, screenshot.height, root, mask);
  return { ok: rootDetection.rootRect!==null&&elements.every(item => item.actualUi !== null), deterministic: true, renderPath: resolve(renderPath), screenshotPath: resolve(screenshotPath), rootRect: root, rootDetection, viewport: [viewport.w, viewport.h], renderAlphaBBox: renderBBox, screenshotAlphaBBox: screenshotBBox, reportPath: sidecar.path ?? null, elements };
}
