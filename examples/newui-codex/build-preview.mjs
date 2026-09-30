// Design illustration from solved rectangles. It does not emulate actor_portrait_renderer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
const root=path.dirname(fileURLToPath(import.meta.url));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
const {rects}=JSON.parse(fs.readFileSync(path.join(root,'layout/solved.json'),'utf8'));
const preview=path.join(root,'preview');fs.mkdirSync(preview,{recursive:true});
const ar=path.join(root,'RP/textures/newui');
const icons=Object.fromEntries(await Promise.all(catalog.entries.map(async e=>[e.id,await loadImage(path.join(ar,'icons',e.id+'.png'))])));
const atlas=await loadImage(path.join(ar,'book_atlas.png'));
const buttons=Object.fromEntries(await Promise.all(['default','hover','pressed','selected'].map(async s=>[s,await loadImage(path.join(ar,`ui/button_${s}.png`))])));
const box=id=>{const r=rects[id];return {x:r.x-rects.__root__.x,y:r.y-rects.__root__.y,w:r.w,h:r.h};};
function nine(ctx,img,x,y,w,h){const n=3,S=24;for(let j=0;j<3;j++)for(let i=0;i<3;i++){const sx=[0,n,S-n][i],sy=[0,n,S-n][j],sw=[n,S-2*n,n][i],sh=[n,S-2*n,n][j],dx=[x,x+n,x+w-n][i],dy=[y,y+n,y+h-n][j],dw=[n,w-2*n,n][i],dh=[n,h-2*n,n][j];ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);}}
function label(ctx,text,b,size=8,align='center',color='#383E34',wrap=false){ctx.font=`${size}px "Malgun Gothic", "Arial", sans-serif`;ctx.fillStyle=color;ctx.textBaseline='middle';ctx.textAlign=align;if(!wrap){ctx.fillText(text,align==='center'?b.x+b.w/2:b.x,b.y+b.h/2);return;}const words=[...text],lines=[];let line='';for(const ch of words){if(ch==='\n'){lines.push(line);line='';}else if(ctx.measureText(line+ch).width>b.w){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);ctx.textAlign='left';lines.forEach((s,i)=>ctx.fillText(s,b.x,b.y+5+i*10));}
function screen(category,selected){
  const canvas=createCanvas(960,630),ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#27332E';ctx.fillRect(0,0,320,210);
  ctx.fillStyle='#1C2721';ctx.fillRect(4,31,312,157);ctx.drawImage(atlas,0,26,320,159);
  for(let i=0;i<3;i++){const b=box(`tab${i}`);nine(ctx,buttons[i===category?'selected':'default'],b.x,b.y,b.w,b.h);label(ctx,catalog.categories[i].name,b,9);}
  label(ctx,catalog.title,box('heading'),8);
  for(let i=0;i<4;i++){const b=box(`card${i}`),entry=catalog.entries[category*4+i];nine(ctx,buttons[entry.id===selected?'selected':'default'],b.x,b.y,b.w,b.h);ctx.drawImage(icons[entry.id],b.x+10,b.y+2,32,32);label(ctx,entry.name,{x:b.x+2,y:b.y+35,w:b.w-4,h:11},7.5);}
  label(ctx,`생물 ${String(category*4+1).padStart(2,'0')}–${String(category*4+4).padStart(2,'0')} / 12`,box('page_info'),7);
  const entry=catalog.entries.find(e=>e.id===selected),im=box('detail_icon');ctx.drawImage(icons[selected],im.x,im.y,im.w,im.h);
  label(ctx,entry.name,box('detail_name'),10);label(ctx,entry.habitat,box('detail_habitat'),7.5,'center','#68734D');label(ctx,entry.description,box('detail_body'),8,'left','#534D3F',true);
  for(const [id,text] of [['prev','< 이전'],['close','닫기'],['next','다음 >']]){const b=box(id);nine(ctx,buttons.default,b.x,b.y,b.w,b.h);label(ctx,text,b,8);}
  return canvas;
}
for(let i=0;i<3;i++){const id=catalog.entries[i*4].id;fs.writeFileSync(path.join(preview,`${catalog.categories[i].id}.png`),screen(i,id).toBuffer('image/png'));}
const sheet=createCanvas(960,280),ctx=sheet.getContext('2d');ctx.fillStyle='#F5EACD';ctx.fillRect(0,0,960,280);ctx.imageSmoothingEnabled=false;
catalog.entries.forEach((e,i)=>{const x=(i%6)*160,y=Math.floor(i/6)*140;ctx.drawImage(icons[e.id],x+32,y+8,96,96);label(ctx,e.name,{x,y:y+110,w:160,h:20},14);});
fs.writeFileSync(path.join(preview,'icons.png'),sheet.toBuffer('image/png'));
fs.writeFileSync(path.join(preview,'report.json'),JSON.stringify({kind:'design-illustration',geometry:'layout/solved.json',font:'system font, not calibrated Minecraft glyphs',portrait:'flat atlas stand-in only; model projection not simulated',runtimeVerified:false,images:['forest.png','meadow.png','cave.png','icons.png']},null,2)+'\n');
console.log(JSON.stringify({images:4,kind:'design-illustration',runtimeVerified:false}));
