// Pure logical-pixel calculations, shared by the editor and regression tests.
export function selectionBounds(nodes) {
  if (!nodes.length) return null;
  const x=Math.min(...nodes.map(n=>n.rect.x)),y=Math.min(...nodes.map(n=>n.rect.y));
  return {x,y,w:Math.max(...nodes.map(n=>n.rect.x+n.rect.w))-x,h:Math.max(...nodes.map(n=>n.rect.y+n.rect.h))-y};
}
export function offsetPatch(node,dx,dy) {
  const offset=node.props.offset??[0,0];
  if(!Array.isArray(offset)||offset.length!==2||offset.some(v=>!Number.isFinite(v)))throw Error('동적 위치는 원본이나 Codex에서 수정하세요.');
  return {offset:offset.map((v,i)=>Math.round((v+(i?dy:dx))*1000)/1000)};
}
export function alignSelection(nodes,action,reference) {
  const box=nodes.length===1?reference:selectionBounds(nodes);
  if(!box)throw Error('정렬 기준이 없습니다.');
  return nodes.map(node=>{
    const r=node.rect;
    const dx=action==='left'?box.x-r.x:action==='centerX'?box.x+box.w/2-r.x-r.w/2:action==='right'?box.x+box.w-r.x-r.w:0;
    const dy=action==='top'?box.y-r.y:action==='centerY'?box.y+box.h/2-r.y-r.h/2:action==='bottom'?box.y+box.h-r.y-r.h:0;
    if(!['left','centerX','right','top','centerY','bottom'].includes(action))throw Error('Unknown alignment');
    return {node,patch:offsetPatch(node,dx,dy)};
  });
}
export function distributeSelection(nodes,axis) {
  if(nodes.length<3)throw Error('같은 부모의 요소를 3개 이상 선택하세요.');
  if(!['x','y'].includes(axis))throw Error('Unknown axis');
  const dim=axis==='x'?'w':'h', sorted=[...nodes].sort((a,b)=>a.rect[axis]-b.rect[axis]),first=sorted[0].rect,last=sorted.at(-1).rect;
  const gap=(last[axis]+last[dim]-first[axis]-sorted.reduce((sum,n)=>sum+n.rect[dim],0))/(sorted.length-1);
  if(gap<0)throw Error('요소가 겹칩니다. 양 끝 요소를 먼저 벌려 주세요.');
  let cursor=first[axis];
  return sorted.map(node=>{const delta=cursor-node.rect[axis];cursor+=node.rect[dim]+gap;return {node,patch:offsetPatch(node,axis==='x'?delta:0,axis==='y'?delta:0)};});
}
export function gridSelection(nodes,columns,gap) {
  if(nodes.length<2)throw Error('요소를 2개 이상 선택하세요.');
  if(!Number.isInteger(columns)||columns<1||columns>16||!Number.isFinite(gap)||gap<0||gap>512)throw Error('열 수 1~16, 간격 0~512를 입력하세요.');
  const box=selectionBounds(nodes),width=Math.max(...nodes.map(n=>n.rect.w)),height=Math.max(...nodes.map(n=>n.rect.h));
  return [...nodes].sort((a,b)=>a.index-b.index).map((node,i)=>({node,patch:offsetPatch(node,box.x+(i%columns)*(width+gap)-node.rect.x,box.y+Math.floor(i/columns)*(height+gap)-node.rect.y)}));
}
export function matchSelectionSize(nodes){
  if(nodes.length<2)throw Error('요소를 2개 이상 선택하세요.');
  const w=Math.max(...nodes.map(n=>n.rect.w)),h=Math.max(...nodes.map(n=>n.rect.h));
  return nodes.map(node=>({node,patch:{size:[w,h]}}));
}
export function snapMove(rect,dx,dy,{peers=[],parent,grid=1,smart=true,threshold=4,axis=null}={}) {
  const rawX=dx,rawY=dy;
  if(grid>0){dx=Math.round((rect.x+dx)/grid)*grid-rect.x;dy=Math.round((rect.y+dy)/grid)*grid-rect.y;}
  if(axis==='x')dy=0;if(axis==='y')dx=0;
  const moving={...rect,x:rect.x+(axis==='y'?0:rawX),y:rect.y+(axis==='x'?0:rawY)},guides=[];
  if(!smart)return {dx,dy,guides};
  for(const a of ['x','y']){
    if(axis&&axis!==a)continue;
    const dim=a==='x'?'w':'h',cross=a==='x'?'y':'x',crossDim=a==='x'?'h':'w';
    const edges=r=>[r[a],r[a]+r[dim]/2,r[a]+r[dim]];
    let best=null;
    for(const target of [parent,...peers.map(n=>n.rect)].filter(Boolean))for(const [oi,ti]of [[0,0],[1,1],[2,2],[0,2],[2,0]]){
      const own=edges(moving)[oi],value=edges(target)[ti];
      const delta=value-own;
      if(Math.abs(delta)<=threshold&&(!best||Math.abs(delta)<Math.abs(best.delta)))best={delta,axis:a,value,start:Math.min(moving[cross],target[cross]),end:Math.max(moving[cross]+moving[crossDim],target[cross]+target[crossDim])};
    }
    // Only adjacent objects that share a row/column establish equal spacing.
    const row=peers.filter(n=>Math.abs(n.rect[cross]+n.rect[crossDim]/2-moving[cross]-moving[crossDim]/2)<=threshold).sort((p,q)=>p.rect[a]-q.rect[a]);
    for(let i=1;i<row.length;i++){
      const before=row[i-1].rect,after=row[i].rect,gap=after[a]-before[a]-before[dim];
      if(gap<0)continue;
      for(const value of [after[a]+after[dim]+gap,before[a]-gap-moving[dim]]){
        const delta=value-moving[a];
        if(Math.abs(delta)<=threshold&&(!best||Math.abs(delta)<Math.abs(best.delta)||(Math.abs(delta)===Math.abs(best.delta)&&best.gap===undefined)))best={delta,axis:a,value,start:moving[cross],end:moving[cross]+moving[crossDim],gap,from:value>after[a]?after[a]+after[dim]:value+moving[dim],to:value>after[a]?value:before[a]};
      }
    }
    if(best){moving[a]+=best.delta;if(a==='x')dx=moving.x-rect.x;else dy=moving.y-rect.y;guides.push(best);}
  }
  return {dx,dy,guides};
}
