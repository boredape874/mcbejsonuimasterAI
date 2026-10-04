import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { PNG } from 'pngjs';
import { discoverMinecraftUwp } from '../_lib/final-rp-v2/vanilla-profile.mjs';
export async function previewFonts(rpRoot) {
  const root=await realpath(rpRoot),pages=[],files=new Map(),faces=new Map();
  for(const entry of (await readdir(join(root,'font'),{withFileTypes:true}).catch(()=>[])).slice(0,512)) {
    const match=entry.name.match(/^glyph_([0-9a-f]{2})\.png$/i);if(!match||!entry.isFile()||pages.length>=32)continue;
    const file=await realpath(join(root,'font',entry.name)),rel=relative(root,file);if(rel.startsWith('..')||isAbsolute(rel))continue;
    if((await stat(file)).size>1024*1024)continue;
    const png=PNG.sync.read(await readFile(file));if(png.width%16||png.height%16)continue;
    const page=parseInt(match[1],16),cw=png.width/16,ch=png.height/16,glyphs=[];
    for(let index=0;index<256;index++){
      const ox=(index%16)*cw,oy=Math.floor(index/16)*ch;let left=cw,right=-1;
      for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(png.data[((oy+y)*png.width+ox+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);}
      glyphs.push({uv:[ox,oy],width:right<0?0:right-left+1,left:right<0?0:left});
    }
    pages.push({page,width:png.width,height:png.height,cell:[cw,ch],glyphs});files.set(page,file);
  }
  const installed=await discoverMinecraftUwp(),fontDir=installed.packageRoot&&join(installed.packageRoot,'data/gui/dist/hbui/fonts');
  const fonts=fontDir?await readdir(fontDir).catch(()=>[]):[];
  for(const [kind,pattern] of [['latin',/^Minecraft-Seven-v4-.*\.ttf$/],['korean',/^NotoSansKR-Regular-.*\.otf$/]]){
    const name=fonts.find(name=>pattern.test(name));if(name)faces.set(kind,join(fontDir,name));
  }
  return {pages,files,faces,summary:{pages,faces:[...faces.keys()],installedVersion:installed.version,evidence:'approximate-browser-preview'}};
}
