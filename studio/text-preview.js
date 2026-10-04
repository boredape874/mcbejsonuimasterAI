const colors=['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#ffaa00','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'];
export function textTokens(text,baseColor='#ffffff') {
  const tokens=[];let color=baseColor,bold=false,italic=false;
  for(let i=0;i<text.length;i++){
    if(text[i]==='§'&&i+1<text.length){const code=text[++i].toLowerCase(),index='0123456789abcdef'.indexOf(code);if(index>=0){color=colors[index];bold=false;italic=false;}else if(code==='l')bold=true;else if(code==='o')italic=true;else if(code==='r'){color=baseColor;bold=false;italic=false;}continue;}
    const point=text.codePointAt(i),char=String.fromCodePoint(point);if(point>65535)i++;
    tokens.push({char,color,bold,italic,codePoint:point});
  }
  return tokens;
}
const canvasFont=(token,size)=>`${token.italic?'italic ':''}${token.bold?'bold ':''}${size}px "StudioLatin", "StudioKorean", "Malgun Gothic", sans-serif`;
export function previewLines(ctx,text,width,size,pages,baseColor){
  const lines=[[]];let lineWidth=0;
  for(const token of textTokens(String(text??''),baseColor)){
    if(token.char==='\n'){lines.push([]);lineWidth=0;continue;}
    ctx.font=canvasFont(token,size);
    const page=pages.get(Math.floor(token.codePoint/256)),glyph=page?.glyphs[token.codePoint&255];
    const advance=glyph?.width?Math.min(size,(glyph.width/page.cell[0])*size)+size/8:ctx.measureText(token.char).width;
    if(lineWidth+advance>width&&lines.at(-1).length){lines.push([]);lineWidth=0;}
    lines.at(-1).push({...token,advance,page,glyph});lineWidth+=advance;
  }
  return lines;
}
export function drawPreviewText(ctx,n,r,pages){
  const size=8*Number(n.props.font_scale_factor??1),lineHeight=size*1.125;
  if (!(size>0)) return;
  const color=Array.isArray(n.props.color)?'#'+n.props.color.slice(0,3).map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join(''):'#ffffff';
  const lines=previewLines(ctx,n.props.text,r.w,size,pages,color),align=n.props.text_alignment||'left';
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  if(n.clip){ctx.beginPath();ctx.rect(r.x+n.clip.x-n.rect.x,r.y+n.clip.y-n.rect.y,n.clip.w,n.clip.h);ctx.clip();}
  ctx.globalAlpha=n.alpha??n.props.alpha??1;ctx.textBaseline='top';ctx.imageSmoothingEnabled=false;
  lines.forEach((line,index)=>{
    const width=line.reduce((sum,t)=>sum+t.advance,0),y=r.y+(r.h-lines.length*lineHeight)/2+index*lineHeight;
    let x=r.x+(align==='center'?(r.w-width)/2:align==='right'?r.w-width:0);
    for(const token of line){
      if(token.glyph?.width&&token.page.image){const {uv,width,left}=token.glyph;ctx.drawImage(token.page.image,uv[0]+left,uv[1],width,token.page.cell[1],x,y,width/token.page.cell[0]*size,size);}
      else {ctx.font=canvasFont(token,size);ctx.fillStyle=token.color;if(n.props.shadow){ctx.save();ctx.fillStyle='#000000';ctx.fillText(token.char,x+1,y+1);ctx.restore();}ctx.fillText(token.char,x,y);}
      x+=token.advance;
    }
  });ctx.restore();
}
