export const FONT_UNAVAILABLE = "FONT_UNAVAILABLE";
export const GLYPH_RUN_UNAVAILABLE = "GLYPH_RUN_UNAVAILABLE";

function stableId(node, index, used) { const base=String(node.commandId??node.qualified??node.id??node.pointer??`command:${index}`);let id=base,suffix=1;while(used.has(id))id=`${base}~${suffix++}`;used.add(id);return id; }
function common(node,id){const props=node.props||{};return{id,control:node.qualified||node.id||id,pointer:node.pointer??null,source:node.source??null,rect:{...node.rect},clipRects:node.clip?[{...node.clip}]:[],alpha:node.alpha,layer:node.layer,state:node.state??null,color:props.color,collisionGroups:props.collisionGroups||props.collision_groups||node.collisionGroups||[],allowOverlap:props.allowOverlap===true||props.allow_overlap===true||node.allowOverlap===true,provenance:node.provenance};}

export function buildDisplayList(layout) {
  const unresolved=[...(layout.unresolved||[])],commands=[],used=new Set();
  for(const[index,node]of(layout.nodes||[]).entries()){
    if(node.visible===false||node.alpha<=0||node.rect.w<=0||node.rect.h<=0)continue;
    const props=node.props||{},type=props.type||"panel",id=stableId(node,index,used),base=common(node,id);
    if(type==="image")commands.push({
      ...base,
      op:"image",
      type:"image",
      texture:props.texture,
      textureFileSystem:props.texture_file_system,
      uv:props.uv,
      uv_size:props.uv_size,
      nineSlice:props.nineSlice,
      nineslice_size:props.nineslice_size,
      base_size:props.base_size,
      keep_ratio:props.keep_ratio,
      fill:props.fill,
      tiled:props.tiled,
      tiled_scale:props.tiled_scale,
      clip_direction:props.clip_direction,
      clip_ratio:props.clip_ratio,
      clip_pixelperfect:props.clip_pixelperfect,
      bilinear:props.bilinear,
      pixel_perfect:props.pixel_perfect,
      grayscale:props.grayscale,
      rotation:props.rotation,
    });
    else if(type==="label"){
      const run=node.glyphRun||props.glyph_run||props.glyphRun;
      if(!run||!Array.isArray(run.glyphs)){unresolved.push({kind:props.font_status===FONT_UNAVAILABLE?FONT_UNAVAILABLE:GLYPH_RUN_UNAVAILABLE,control:base.control,pointer:node.pointer,text:props.text});continue;}
      commands.push({...base,op:"glyphRun",type:"glyphRun",glyphs:run.glyphs.map(glyph=>structuredClone(glyph)),baseline:run.baseline,textRect:run.rect||base.rect,font:run.font||null});
    }else if(["panel","button","toggle","custom","stack_panel","grid","collection_panel","input_panel","scroll_view","scroll_track","scrollbar_box","edit_box"].includes(type))commands.push({...base,op:"group",type:"group"});
    else unresolved.push({kind:"unresolved_display_type",control:base.control,type,pointer:node.pointer});
  }
  return{schemaVersion:1,viewport:layout.viewport?[...layout.viewport]:null,commands,unresolved};
}
