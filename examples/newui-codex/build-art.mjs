// Original raster assets. Integer coordinates, no sampled or copied source artwork.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'RP/textures/newui');
fs.mkdirSync(out, { recursive: true });
const colors = { ink: '#383E34', paper: '#F5EACD', shade: '#D8C9A3', light: '#FFF6DF', leaf: '#54704C', gold: '#CDA554' };
const rgba = hex => [...hex.slice(1).match(/../g).map(x => parseInt(x, 16)), 255];
function canvas(w, h) {
  const png = new PNG({ width: w, height: h });
  const pixel = (x, y, c) => { if (x < 0 || x >= w || y < 0 || y >= h) return; png.data.set(rgba(c), (y * w + x) * 4); };
  const rect = (x, y, rw, rh, c) => { for (let j=y; j<y+rh; j++) for (let i=x; i<x+rw; i++) pixel(i,j,c); };
  const ellipse = (cx, cy, rx, ry, c) => { for(let y=Math.floor(cy-ry);y<=cy+ry;y++) for(let x=Math.floor(cx-rx);x<=cx+rx;x++) if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1) pixel(x,y,c); };
  const poly = (pts,c) => { for(let y=0;y<h;y++)for(let x=0;x<w;x++){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y+.5)!==(b[1]>y+.5)&&x+.5<(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)pixel(x,y,c);} };
  return {png,pixel,rect,ellipse,poly,save(rel){ const p=path.join(out,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,PNG.sync.write(png)); }};
}
function icon(id) {
  const c=canvas(32,32), {rect:r,ellipse:e,poly:p}=c;
  const ink=colors.ink, cream=colors.light;
  const eyes=(y=16,x1=11,x2=21)=>{r(x1,y,2,3,ink);r(x2,y,2,3,ink);r(x1,y,1,1,cream);r(x2,y,1,1,cream);};
  if(id==='fox'||id==='wolf') {
    const main=id==='fox'?'#CF783D':'#899590', light=id==='fox'?'#EDA65C':'#BAC5BD';
    p([[5,4],[13,9],[21,9],[27,4],[26,22],[17,29],[6,22]],ink);
    p([[7,6],[14,11],[20,11],[25,6],[24,21],[17,27],[8,21]],main);
    p([[8,8],[12,11],[9,15]],'#C89182');p([[23,8],[20,11],[24,15]],'#C89182');
    r(11,12,11,5,light);p([[7,18],[14,20],[17,26],[10,23]],cream);p([[26,18],[20,20],[17,26],[24,23]],cream);
    eyes(16,11,21);r(14,22,6,3,ink);r(16,25,2,2,ink);
  } else if(id==='bee') {
    e(10,9,6,5,ink);e(10,8,5,4,'#CEE8D9');e(23,9,6,5,ink);e(23,8,5,4,'#CEE8D9');
    e(16,19,11,9,ink);e(16,18,10,8,'#E6BB50');r(7,19,19,4,'#936537');r(10,26,3,3,ink);r(21,26,3,3,ink);
    r(10,5,2,5,ink);r(21,5,2,5,ink);eyes(14,10,21);r(15,19,3,1,cream);
  } else if(id==='frog') {
    e(16,21,13,8,ink);e(16,20,12,7,'#719653');e(9,11,6,6,ink);e(23,11,6,6,ink);
    e(9,11,5,5,'#A4B96B');e(23,11,5,5,'#A4B96B');e(16,19,10,6,'#A4B96B');
    eyes(10,8,22);r(9,22,15,1,ink);r(5,27,6,2,'#54704C');r(21,27,6,2,'#54704C');
  } else if(id==='cow') {
    r(5,4,4,8,ink);r(24,4,4,8,ink);r(6,4,2,7,'#D8C9A3');r(25,4,2,7,'#D8C9A3');
    r(2,12,7,6,ink);r(25,12,5,6,ink);e(16,18,11,12,ink);e(16,17,10,11,'#996C4C');
    p([[11,8],[16,7],[19,14],[15,18],[10,16]],cream);eyes();r(8,21,17,6,'#D7A996');r(10,23,2,2,ink);r(21,23,2,2,ink);
  } else if(id==='sheep') {
    for(const [x,y] of [[8,10],[16,7],[24,10],[7,18],[25,18],[10,25],[22,25]]) {e(x,y,6,6,ink);e(x,y-1,5,5,cream);}
    r(10,11,13,17,ink);r(11,12,11,14,'#A9917C');eyes(16,12,20);r(15,23,4,2,ink);
  } else if(id==='pig') {
    r(5,5,7,9,ink);r(21,5,7,9,ink);r(6,6,5,7,'#D48891');r(22,6,5,7,'#D48891');
    e(16,19,12,11,ink);e(16,18,11,10,'#ECA4A9');eyes(14,10,21);r(9,20,16,6,'#C66E83');r(12,22,3,2,ink);r(19,22,3,2,ink);
  } else if(id==='chicken') {
    r(13,2,4,8,ink);r(17,4,5,6,ink);r(14,3,2,6,'#C86C53');r(18,5,3,4,'#C86C53');
    e(16,19,11,11,ink);e(16,18,10,10,cream);r(11,12,12,10,'#EFE3C4');eyes(14,10,21);
    r(13,20,7,4,'#DDA94D');r(15,24,4,4,'#C86C53');r(8,29,5,2,'#DDA94D');r(21,29,5,2,'#DDA94D');
  } else if(id==='bat') {
    p([[1,9],[8,13],[13,11],[19,11],[25,13],[31,9],[29,24],[23,20],[20,28],[12,28],[9,20],[3,24]],ink);
    p([[3,12],[9,16],[12,14],[12,23],[8,18],[4,20]],'#816F99');p([[29,12],[23,16],[20,14],[20,23],[24,18],[28,20]],'#816F99');
    p([[11,6],[16,11],[21,6],[22,23],[16,28],[10,23]],'#64576F');eyes(15,12,19);r(14,22,1,3,cream);r(18,22,1,3,cream);
  } else if(id==='axolotl') {
    for(const x of [3,25]) {r(x,7,4,18,ink);r(x+1,8,2,16,'#CB7997');r(x-2,9,8,2,'#CB7997');r(x-2,16,8,2,'#CB7997');r(x-2,22,8,2,'#CB7997');}
    e(16,19,11,9,ink);e(16,18,10,8,'#EDB3BD');eyes(16,10,21);r(14,23,5,1,ink);r(8,28,5,2,'#CB7997');r(20,28,5,2,'#CB7997');
  } else if(id==='glow_squid') {
    for(let i=0;i<4;i++){r(6+i*6,21,3,8-(i%2)*2,ink);r(7+i*6,21,2,7-(i%2)*2,'#83CFC0');}
    e(16,14,11,11,ink);e(16,13,10,10,'#397F7A');r(9,7,3,7,'#70BFB0');r(12,5,8,2,'#70BFB0');
    r(9,16,4,4,'#CFF0C5');r(20,16,4,4,'#CFF0C5');r(10,17,2,2,ink);r(21,17,2,2,ink);r(26,5,2,2,'#CFF0C5');r(3,9,2,2,'#CFF0C5');
  } else if(id==='spider') {
    for(let i=0;i<4;i++){r(2,8+i*5,10,2,ink);r(22,8+i*5,8,2,ink);r(2,8+i*5,2,4,ink);r(28,8+i*5,2,4,ink);}
    e(16,12,7,8,ink);e(16,11,6,7,'#6D625D');e(16,22,9,7,ink);e(16,21,8,6,'#575652');
    r(10,21,3,3,'#D87866');r(15,20,3,3,'#D87866');r(20,21,3,3,'#D87866');r(12,26,2,2,cream);r(19,26,2,2,cream);
  }
  c.save(`icons/${id}.png`);
}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
catalog.entries.forEach(e=>icon(e.id));
const book=canvas(256,128);
book.rect(0,0,256,128,colors.leaf);book.rect(2,2,252,122,colors.ink);book.rect(3,3,250,119,colors.shade);book.rect(5,4,246,114,colors.paper);
book.rect(6,5,120,2,colors.light);book.rect(131,5,119,2,colors.light);
book.rect(123,4,2,114,'#DFD0AE');book.rect(125,4,2,117,'#BCA77E');book.rect(127,1,2,124,'#79694C');book.rect(129,4,2,117,'#BCA77E');book.rect(131,4,2,114,'#DFD0AE');
for(const y of [120,123,126])book.rect(5,y,246,1,'#A59473');
for(const x of [10,236]) {book.rect(x,11,10,1,colors.gold);book.rect(x,11,1,9,colors.gold);book.rect(x,107,10,1,colors.gold);book.rect(x+9,99,1,9,colors.gold);}
// A sparse leaf motif remains in the margin, outside text and card content.
for(const x of [14,242]) {book.pixel(x,14,colors.leaf);book.pixel(x-1,15,colors.leaf);book.pixel(x+1,15,colors.leaf);book.pixel(x,16,colors.leaf);}
book.save('book_atlas.png');
const cover=canvas(32,32);cover.rect(1,1,30,30,colors.ink);cover.rect(2,2,28,27,colors.leaf);cover.rect(5,4,23,23,colors.gold);cover.rect(6,5,21,21,colors.leaf);cover.rect(2,29,28,2,colors.shade);cover.rect(3,3,2,25,'#384F3B');
cover.poly([[17,8],[24,11],[21,17],[17,21],[12,18],[11,13]],colors.gold);cover.rect(16,13,1,12,colors.light);cover.poly([[16,18],[12,15],[11,12],[16,15]],colors.light);cover.save('cover.png');cover.save('field_guide.png');
fs.writeFileSync(path.join(root,'RP/textures/item_texture.json'),JSON.stringify({resource_pack_name:'NewUI',texture_name:'atlas.items',texture_data:{'newui:field_guide':{textures:'textures/newui/field_guide'}}},null,2)+'\n');
for(const [state,fill,edge] of [['default','#EFE3C4','#A18C67'],['hover','#FFF6DF','#65845A'],['pressed','#D6DEB7','#466241'],['selected','#E0E7C4','#54704C']]){
  const c=canvas(24,24);c.rect(1,0,22,24,colors.ink);c.rect(0,1,24,22,colors.ink);c.rect(1,1,22,22,edge);c.rect(2,2,20,20,fill);c.rect(3,2,18,1,colors.light);c.rect(2,21,20,1,edge);c.save(`ui/button_${state}.png`);
  fs.writeFileSync(path.join(out,`ui/button_${state}.json`),JSON.stringify({nineslice_size:3,base_size:[24,24]},null,2)+'\n');
}
const transparent=canvas(1,1);transparent.save('transparent.png');
const shade=canvas(1,1);shade.rect(0,0,1,1,'#17251E');shade.save('ui/shade.png');
const badge=canvas(128,128);badge.rect(0,0,128,128,'#27332E');badge.rect(18,16,90,100,colors.ink);badge.rect(22,16,82,96,colors.leaf);badge.rect(29,24,67,77,colors.gold);badge.rect(32,27,61,71,colors.leaf);badge.rect(18,107,90,8,colors.shade);badge.rect(22,19,5,85,'#384F3B');badge.poly([[62,35],[84,47],[74,66],[62,80],[43,67],[42,49]],colors.gold);badge.rect(61,51,3,43,colors.light);badge.poly([[62,69],[47,58],[44,48],[62,59]],colors.light);
for(const kind of ['BP','RP']){fs.mkdirSync(path.join(root,kind),{recursive:true});fs.writeFileSync(path.join(root,kind,'pack_icon.png'),PNG.sync.write(badge.png));}
console.log(JSON.stringify({original:true,icons:catalog.entries.length,atlas:[256,128],alpha:'RGBA, transparent icon background',runtimeVerified:false}));
