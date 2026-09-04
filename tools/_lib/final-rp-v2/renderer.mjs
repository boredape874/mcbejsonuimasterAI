import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { computeNineSliceInsets, drawNineSlice, normalizeInsets, parseSidecarMetadata, scanAlpha, TextureEngine } from "./texture-engine.mjs";

const sharedTextureEngines=new Map();let sharedCanvasCaches=new WeakMap();
function sharedTextureEngine(canvasMod,targetRoot,vanillaRoot){const key=`${targetRoot}\0${vanillaRoot||""}`,cached=sharedTextureEngines.get(key);if(cached?.canvasMod===canvasMod)return cached.engine;let canvasCaches=sharedCanvasCaches.get(canvasMod);if(!canvasCaches){canvasCaches={decodeCache:new Map()};sharedCanvasCaches.set(canvasMod,canvasCaches);}const engine=new TextureEngine({canvasMod,targetRoot,vanillaRoot,decodeCache:canvasCaches.decodeCache});sharedTextureEngines.set(key,{canvasMod,engine});return engine;}
export function clearRendererCaches(){sharedTextureEngines.clear();sharedCanvasCaches=new WeakMap();}

const NAMED_COLORS={black:[0,0,0],white:[1,1,1],gray:[.5,.5,.5],grey:[.5,.5,.5],light_gray:[.75,.75,.75],dark_gray:[.25,.25,.25],red:[1,0,0],green:[0,1,0],blue:[0,0,1],yellow:[1,1,0]};
function colorArray(color,fallback=[1,1,1,1]){if(Array.isArray(color))return color;const named=NAMED_COLORS[String(color??"").toLowerCase()];return named?[...named,1]:fallback;}
function rgba(color = [1, 1, 1], alpha = 1) { const value=colorArray(color);return `rgba(${value.slice(0, 3).map(entry => Math.round(Number(entry) * 255)).join(",")},${(value[3] ?? 1) * alpha})`; }
function intersect(a, b) { const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.x+a.w,b.x+b.w),bottom=Math.min(a.y+a.h,b.y+b.h);return right<=x||bottom<=y?null:{x,y,w:right-x,h:bottom-y}; }
function effectiveClip(command, viewport) { let clip={x:0,y:0,w:viewport[0],h:viewport[1]};for(const item of command.clipRects||command.clipChain||[]){clip=intersect(clip,item);if(!clip)return null;}return clip; }
function effectiveAlpha(command) { return [command.inheritedAlpha ?? 1, ...(command.alphaChain || []), command.alpha ?? 1].reduce((a,b)=>a*Number(b),1); }
function fitRect(source, destination, keepRatio) { if(!keepRatio)return{...destination};const scale=Math.min(destination.w/source.w,destination.h/source.h),w=source.w*scale,h=source.h*scale;return{x:destination.x+(destination.w-w)/2,y:destination.y+(destination.h-h)/2,w,h}; }
function alphaSignature(imageData, scan) { if(!scan.bbox)return null;const hash=createHash("sha256"),{x,y,w,h}=scan.bbox;for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)hash.update(Uint8Array.of(imageData.data[(row*imageData.width+col)*4+3]));return hash.digest("hex"); }
function transformPixels(ctx, rect, { color = null, grayscale = false } = {}) { const x=Math.max(0,Math.floor(rect.x)),y=Math.max(0,Math.floor(rect.y)),right=Math.min(ctx.canvas.width,Math.ceil(rect.x+rect.w)),bottom=Math.min(ctx.canvas.height,Math.ceil(rect.y+rect.h)),w=Math.max(0,right-x),h=Math.max(0,bottom-y);if(!w||!h)return;const image=ctx.getImageData(x,y,w,h),rgb=color?colorArray(color).slice(0,3).map(Number):[1,1,1];for(let i=0;i<image.data.length;i+=4){let red=image.data[i]*rgb[0],green=image.data[i+1]*rgb[1],blue=image.data[i+2]*rgb[2];if(grayscale){const gray=Math.round(red*.2126+green*.7152+blue*.0722);red=green=blue=gray;}image.data[i]=Math.round(red);image.data[i+1]=Math.round(green);image.data[i+2]=Math.round(blue);}ctx.putImageData(image,x,y); }
function validVector(value){return Array.isArray(value)&&value.length===2&&value.every(item=>Number.isFinite(Number(item)));}
function clipForRatio(rect, ratio, direction="left") { const value=Math.max(0,Math.min(1,Number(ratio)));if(!Number.isFinite(value)||value>=1)return null;if(direction==="right")return{x:rect.x+rect.w*(1-value),y:rect.y,w:rect.w*value,h:rect.h};if(direction==="up")return{x:rect.x,y:rect.y,w:rect.w,h:rect.h*value};if(direction==="down")return{x:rect.x,y:rect.y+rect.h*(1-value),w:rect.w,h:rect.h*value};if(direction==="center")return{x:rect.x+rect.w*(1-value)/2,y:rect.y+rect.h*(1-value)/2,w:rect.w*value,h:rect.h*value};return{x:rect.x,y:rect.y,w:rect.w*value,h:rect.h}; }
function drawTiled(ctx,image,sourceRect,destinationRect,tiled,tiledScale){const tileX=tiled===true||tiled==="x",tileY=tiled===true||tiled==="y",scale=validVector(tiledScale)?tiledScale.map(Number):[1,1],tileW=tileX?Math.max(.001,sourceRect.w*scale[0]):destinationRect.w,tileH=tileY?Math.max(.001,sourceRect.h*scale[1]):destinationRect.h;for(let y=destinationRect.y;y<destinationRect.y+destinationRect.h-.0001;y+=tileH){const dh=Math.min(tileH,destinationRect.y+destinationRect.h-y),sh=sourceRect.h*(dh/tileH);for(let x=destinationRect.x;x<destinationRect.x+destinationRect.w-.0001;x+=tileW){const dw=Math.min(tileW,destinationRect.x+destinationRect.w-x),sw=sourceRect.w*(dw/tileW);ctx.drawImage(image,sourceRect.x,sourceRect.y,sw,sh,x,y,dw,dh);}}}
async function safeDecode(engine, texture, diagnostics, control) { try { return await engine.decode(texture); } catch(error) { diagnostics.push({kind:"texture_decode_error",control,texture,message:error.message}); return null; } }
function normalizeDisplayList(input) {
  const rawCommands=input?.commands||[], used=new Set();
  const commands=rawCommands.map((raw,index)=>{let id=String(raw.id??raw.control??raw.pointer??`command:${index}`);if(used.has(id))id=`${id}~${index}`;used.add(id);const type=raw.type||(raw.op==="image"?"image":raw.op==="text"?"blockedText":raw.op==="glyphRun"?"glyphRun":raw.op==="group"?"group":raw.op);return{...raw,id,type,clipRects:raw.clipRects||raw.clipChain||(raw.clip?[raw.clip]:[])};});
  const inferred=commands.reduce((size,command)=>[Math.max(size[0],Number(command.rect?.x||0)+Number(command.rect?.w||0)),Math.max(size[1],Number(command.rect?.y||0)+Number(command.rect?.h||0))],[1,1]);
  return{viewport:input?.viewport||input?.logicalViewport||inferred,commands,unresolved:input?.unresolved||[]};
}

export async function renderDisplayList({ canvasMod, displayList, targetRoot, vanillaRoot = null, outputPath = null, textureEngine = null, analyzeControls = true }) {
  const normalized=normalizeDisplayList(displayList),viewport=normalized.viewport,engine=textureEngine||sharedTextureEngine(canvasMod,targetRoot,vanillaRoot),canvas=canvasMod.createCanvas(...viewport),ctx=canvas.getContext("2d"),diagnostics=[...normalized.unresolved],controls={},textureEvidence=new Map();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,...viewport);
  const commands=normalized.commands.map((command,index)=>({command,index})).sort((a,b)=>(Number(a.command.layer??0)-Number(b.command.layer??0))||(a.index-b.index)).map(item=>item.command);
  for(const command of commands){
    const useLayer=analyzeControls||Boolean(command.color)||command.grayscale===true;
    const layer=useLayer?canvasMod.createCanvas(...viewport):null,lc=useLayer?layer.getContext("2d"):ctx,clip=effectiveClip(command,viewport),alpha=effectiveAlpha(command);
    let sourceAlpha=null,sourceRect=null,drawRect=null,hasNineSlice=false;
    if(alpha<=0||!clip)continue;
    lc.imageSmoothingEnabled=command.bilinear===true;
    lc.save();
    lc.beginPath();lc.rect(clip.x,clip.y,clip.w,clip.h);lc.clip();
    const ratioClip=command.clip_ratio==null?null:clipForRatio(command.rect,command.clip_ratio,command.clip_direction);
    if(ratioClip){lc.beginPath();lc.rect(ratioClip.x,ratioClip.y,ratioClip.w,ratioClip.h);lc.clip();}
    lc.globalAlpha=Math.max(0,Math.min(1,alpha));
    const rotation=Number(command.rotation??0);
    if(Number.isFinite(rotation)&&rotation!==0){const centerX=command.rect.x+command.rect.w/2,centerY=command.rect.y+command.rect.h/2;lc.translate(centerX,centerY);lc.rotate(rotation*Math.PI/180);lc.translate(-centerX,-centerY);}
    if(command.type==="image"){
      const decoded=await safeDecode(engine,command.texture,diagnostics,command.id);
      if(decoded?.kind==="rejected"){diagnostics.push({kind:"rejected_texture_path",control:command.id,texture:command.texture,reason:decoded.reason});lc.restore();continue;}
      if(!decoded){if(!diagnostics.some(item=>item.control===command.id&&item.kind==="texture_decode_error"))diagnostics.push({kind:"unresolved_texture",control:command.id,texture:command.texture});lc.restore();continue;}
      textureEvidence.set(`${command.texture}\0${decoded.path??decoded.id??decoded.kind}`,{reference:command.texture,sourceRoot:decoded.sourceRoot??decoded.kind,path:decoded.path??null});
      if(decoded.kind==="builtin"){
        lc.fillStyle=rgba(command.color||(decoded.id.endsWith("Black")?[0,0,0]:[1,1,1]));
        lc.fillRect(command.rect.x,command.rect.y,command.rect.w,command.rect.h);
      }else{
        if(command.uv!=null&&!validVector(command.uv)){diagnostics.push({kind:"unsupported_dynamic_uv",control:command.id,uv:command.uv});lc.restore();continue;}
        if(command.uv_size!=null&&!validVector(command.uv_size)){diagnostics.push({kind:"unsupported_dynamic_uv_size",control:command.id,uvSize:command.uv_size});lc.restore();continue;}
        const requestedUv=command.uv||[0,0],requestedSize=command.uv_size||[decoded.width-requestedUv[0],decoded.height-requestedUv[1]];
        if(requestedUv[0]<0||requestedUv[1]<0||requestedSize[0]<0||requestedSize[1]<0||requestedUv[0]+requestedSize[0]>decoded.width||requestedUv[1]+requestedSize[1]>decoded.height)diagnostics.push({kind:"uv_out_of_range",control:command.id,uv:requestedUv,uvSize:requestedSize,sourceSize:[decoded.width,decoded.height]});
        sourceRect=engine.sourceRect(decoded,command.uv,command.uv_size);
        const explicit=normalizeInsets(command.nineSlice||command.nineslice_size),sidecar=explicit?parseSidecarMetadata({nineslice_size:explicit,base_size:command.base_size||[decoded.width,decoded.height]}):await engine.sidecar(command.texture);
        hasNineSlice=sidecar?.ok===true;
        const keepRatio=!hasNineSlice&&command.tiled!==true&&command.tiled!=="x"&&command.tiled!=="y"&&command.fill!==true&&command.keep_ratio!==false;
        drawRect=fitRect(sourceRect,command.rect,keepRatio);
        sourceAlpha=analyzeControls?engine.alphaForSource(decoded,sourceRect):null;
        lc.globalAlpha=Math.max(0,Math.min(1,alpha*Number(colorArray(command.color)[3]??1)));
        if(hasNineSlice){
          if(command.tiled)diagnostics.push({kind:"unsupported_tiled_nineslice",control:command.id,tiled:command.tiled});
          if(command.uv||command.uv_size)diagnostics.push({kind:"uv_nineslice_static_approximation",control:command.id});
          const slices=computeNineSliceInsets(decoded,sourceRect,sidecar,drawRect);
          if(slices.ok)drawNineSlice(lc,decoded.image,sourceRect,drawRect,slices.sourceInsets,slices.destinationInsets);
          else{diagnostics.push({kind:"unsupported_nineslice_geometry",control:command.id,reason:slices.reason});lc.drawImage(decoded.image,sourceRect.x,sourceRect.y,sourceRect.w,sourceRect.h,drawRect.x,drawRect.y,drawRect.w,drawRect.h);}
        }else if(command.tiled===true||command.tiled==="x"||command.tiled==="y")drawTiled(lc,decoded.image,sourceRect,drawRect,command.tiled,command.tiled_scale);
        else lc.drawImage(decoded.image,sourceRect.x,sourceRect.y,sourceRect.w,sourceRect.h,drawRect.x,drawRect.y,drawRect.w,drawRect.h);
        if(command.color||command.grayscale===true)transformPixels(lc,drawRect,{color:command.color,grayscale:command.grayscale===true});
      }
    }else if(command.type==="glyphRun"){
      if(!Array.isArray(command.glyphs)){diagnostics.push({kind:"GLYPH_RUN_UNAVAILABLE",control:command.id});lc.restore();continue;}
      lc.globalAlpha=Math.max(0,Math.min(1,alpha*Number(colorArray(command.color)[3]??1)));
      for(const glyph of command.glyphs){const decoded=await safeDecode(engine,glyph.texture,diagnostics,command.id);if(!decoded||decoded.kind==="builtin"||decoded.kind==="rejected"){diagnostics.push({kind:decoded?.kind==="rejected"?"rejected_texture_path":"unresolved_glyph",control:command.id,glyph:glyph.id,reason:decoded?.reason});continue;}const source=engine.sourceRect(decoded,glyph.uv,glyph.uv_size),rect=glyph.rect;lc.drawImage(decoded.image,source.x,source.y,source.w,source.h,rect.x,rect.y,rect.w,rect.h);}
      if(command.color||command.grayscale===true)transformPixels(lc,command.rect,{color:command.color,grayscale:command.grayscale===true});
    }else if(command.type==="blockedText") diagnostics.push({kind:"GLYPH_RUN_UNAVAILABLE",control:command.id});
    else if(command.type!=="group") diagnostics.push({kind:"unsupported_display_command",control:command.id,type:command.type});
    lc.restore();
    if(analyzeControls){const imageData=lc.getImageData(0,0,...viewport),scan=scanAlpha(imageData),mask=scan.bbox?{origin:{x:scan.bbox.x,y:scan.bbox.y},width:scan.bbox.w,height:scan.bbox.h,data:extractMask(imageData,scan.bbox)}:null;controls[command.id]={id:command.id,control:command.control??null,pointer:command.pointer??null,source:command.source??null,provenance:command.provenance??null,type:command.type,rect:command.rect,sourceRect,drawRect,keepRatio:command.keep_ratio!==false,hasNineSlice,sourceAlphaBBox:sourceAlpha?.bbox||null,sourceVisualCentroid:sourceAlpha?.centroid||null,alphaBBox:scan.bbox,visualCentroid:scan.centroid,alphaPixels:scan.pixels,alphaWeight:scan.alphaWeight,silhouetteHash:alphaSignature(imageData,scan),baseline:command.baseline??null,groups:command.groups||[],collisionGroups:command.collisionGroups||[],allowOverlap:command.allowOverlap===true,mask};}
    if(useLayer)ctx.drawImage(layer,0,0);
  }
  const outputScan=scanAlpha(ctx.getImageData(0,0,...viewport)),outputAlpha={bbox:outputScan.bbox,pixels:outputScan.pixels,alphaWeight:outputScan.alphaWeight},renderedTextures=[...textureEvidence.values()];const png=await canvas.encode("png"),hash=createHash("sha256").update(png).digest("hex");if(outputPath)await writeFile(outputPath,png);return{viewport,hash,outputPath,controls,diagnostics,outputAlpha,renderedTextures,png,evidenceLevel:"final-pack-static-visual",runtimeVerified:false};
}
function extractMask(imageData,bbox){const data=new Uint8Array(bbox.w*bbox.h);for(let y=0;y<bbox.h;y++)for(let x=0;x<bbox.w;x++)data[y*bbox.w+x]=imageData.data[((bbox.y+y)*imageData.width+bbox.x+x)*4+3];return data;}
