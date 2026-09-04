import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { findTexture } from "./final-rp-resolver.mjs";

function normalizeInsets(value) {
  if (Number.isFinite(value)) return [value, value, value, value];
  if (Array.isArray(value) && value.length === 2) return [value[0], value[1], value[0], value[1]];
  return Array.isArray(value) && value.length === 4 ? value : null;
}
async function sidecar(path) { try { return normalizeInsets(JSON.parse(await readFile(path.replace(/\.[^.]+$/, ".json"), "utf8")).nineslice_size); } catch { return null; } }
function drawNine(ctx, image, rect, inset) {
  const [l,t,r,b] = inset, sx=[0,l,image.width-r,image.width], sy=[0,t,image.height-b,image.height], dx=[rect.x,rect.x+l,rect.x+rect.w-r,rect.x+rect.w], dy=[rect.y,rect.y+t,rect.y+rect.h-b,rect.y+rect.h];
  for(let y=0;y<3;y++) for(let x=0;x<3;x++){const sw=sx[x+1]-sx[x],sh=sy[y+1]-sy[y],dw=dx[x+1]-dx[x],dh=dy[y+1]-dy[y]; if(sw>0&&sh>0&&dw>0&&dh>0)ctx.drawImage(image,sx[x],sy[y],sw,sh,dx[x],dy[y],dw,dh);}
}
function rgba(color=[1,1,1], alpha=1) { return `rgba(${color.slice(0,3).map(v=>Math.round(Number(v)*255)).join(",")},${(color[3]??1)*alpha})`; }
function activeStateNode(node, state, interaction) {
  if (!node.props || !node.controls?.length) return null;
  const hovered = interaction.hoveredIndex === node.collectionIndex, pressed = interaction.pressedIndex === node.collectionIndex;
  const wanted = pressed ? node.props.pressed_control : hovered ? node.props.hover_control : node.props.enabled === false ? node.props.locked_control : node.props.default_control;
  if (!wanted) return null;
  const id = String(wanted).split("@")[0].split(".").pop();
  return node.controls.find(child => child.id === id) || null;
}

export async function renderResolvedTree({ canvasMod, project, layout, outputPath, interaction = {}, background = [0,0,0,0], fontFamily = null, overlays = false }) {
  const { createCanvas, loadImage } = canvasMod, canvas = createCanvas(...layout.viewport), ctx = canvas.getContext("2d"), diagnostics = [], alphaBoxes = {};
  ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle=rgba(background); ctx.fillRect(0,0,canvas.width,canvas.height);
  const ordered = layout.nodes.filter(node=>node.visible).sort((a,b)=>Number(a.props.layer??a.props.z_order??0)-Number(b.props.layer??b.props.z_order??0));
  const hiddenStatePaths = new Set();
  for (const node of ordered) if ((node.props.type === "button" || node.qualified?.endsWith("underline_button")) && node.controls.length) {
    const active=activeStateNode(node,"default",interaction); for(const child of node.controls) if(child!==active && [node.props.default_control,node.props.hover_control,node.props.pressed_control,node.props.locked_control].some(v=>String(v||"").split("@")[0]===child.id)) hiddenStatePaths.add(`${node.path}/${child.id}`);
  }
  for (const node of ordered) {
    if ([...hiddenStatePaths].some(path=>node.path===path||node.path.startsWith(`${path}/`))) continue;
    const p=node.props,r=node.rect,type=p.type||"panel"; ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,Number(p.alpha??1)));
    if (type === "image") {
      const builtin = p.texture === "textures/ui/Black" ? [0,0,0] : p.texture === "textures/ui/White" ? [1,1,1] : null;
      const texture = builtin ? null : await findTexture(project.rpRoot, p.texture, project.vanillaRoot ? [project.vanillaRoot] : []);
      if (builtin) { ctx.fillStyle=rgba(p.color||builtin);ctx.fillRect(r.x,r.y,r.w,r.h);alphaBoxes[node.path]={x:r.x,y:r.y,w:r.w,h:r.h,builtin:p.texture}; }
      else if (!texture) diagnostics.push({kind:"unresolved_texture",control:node.path,value:p.texture});
      else try { const image=await loadImage(texture), inset=normalizeInsets(p.nineslice_size)||await sidecar(texture), target=p.color?createCanvas(canvas.width,canvas.height).getContext("2d"):ctx; if(inset) drawNine(target,image,r,inset); else { if(p.keep_ratio){const scale=Math.min(r.w/image.width,r.h/image.height),w=image.width*scale,h=image.height*scale;target.drawImage(image,r.x+(r.w-w)/2,r.y+(r.h-h)/2,w,h);}else target.drawImage(image,r.x,r.y,r.w,r.h); } if(p.color){target.globalCompositeOperation="source-atop";target.fillStyle=rgba(p.color);target.fillRect(r.x,r.y,r.w,r.h);ctx.drawImage(target.canvas,0,0);} alphaBoxes[node.path]={x:r.x,y:r.y,w:r.w,h:r.h,texture,source:[image.width,image.height]}; } catch(error){ diagnostics.push({kind:"texture_decode",control:node.path,value:texture,message:error.message}); }
    } else if (type === "label") {
      if (!fontFamily) diagnostics.push({kind:"font_fallback",control:node.path,message:"Minecraft font asset was not supplied; system font used explicitly."});
      const base=p.font_size==="large"?12:p.font_size==="small"?8:10, px=Math.max(1,base*Number(p.font_scale_factor??1)); ctx.font=`${px}px ${fontFamily||"sans-serif"}`;ctx.textBaseline="middle";ctx.textAlign=p.text_alignment==="center"?"center":p.text_alignment==="right"?"right":"left";ctx.fillStyle=rgba(p.color||[1,1,1]); const text=String(p.text??""); const x=ctx.textAlign==="center"?r.x+r.w/2:ctx.textAlign==="right"?r.x+r.w:r.x; const metrics=ctx.measureText(text), y=r.y+r.h/2; ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.fillText(text,x,y,r.w);ctx.restore(); const glyph={x:x-(ctx.textAlign==="center"?metrics.width/2:ctx.textAlign==="right"?metrics.width:0),y:y-(metrics.actualBoundingBoxAscent||px/2),w:metrics.width,h:(metrics.actualBoundingBoxAscent||px/2)+(metrics.actualBoundingBoxDescent||px/2)}; alphaBoxes[node.path]=glyph; if(glyph.w>r.w+0.01||glyph.h>r.h+0.01)diagnostics.push({kind:"label_clipping",control:node.path,rect:r,glyph,text});
    }
    if(overlays){ctx.strokeStyle="rgba(0,220,255,.55)";ctx.lineWidth=0.5;ctx.strokeRect(r.x+.25,r.y+.25,r.w-.5,r.h-.5);} ctx.restore();
  }
  await writeFile(outputPath,await canvas.encode("png"));
  return { outputPath, diagnostics, alphaBoxes, hash: await sha256(await canvas.encode("png")) };
}
async function sha256(buffer){const {createHash}=await import("node:crypto");return createHash("sha256").update(buffer).digest("hex");}

export async function loadCanvas() { try { return await import("@napi-rs/canvas"); } catch (error) { throw new Error(`@napi-rs/canvas is required for final RP rendering: ${error.message}`); } }
