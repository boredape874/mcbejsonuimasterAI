// Locate JSONC value spans so a visual edit keeps comments and unrelated bytes.
export function jsonSpans(text) {
  let at = 0;
  const skip = () => {
    for (;;) {
      while (/\s|\uFEFF/.test(text[at] || '') && at < text.length) at++;
      if (text.slice(at, at + 2) === '//') { at = text.indexOf('\n', at); if (at < 0) at = text.length; }
      else if (text.slice(at, at + 2) === '/*') { const end = text.indexOf('*/', at + 2); if (end < 0) throw Error('Unclosed comment'); at = end + 2; }
      else break;
    }
  };
  function string() {
    const start = at++;
    while (at < text.length) { const c = text[at++]; if (c === '\\') at++; else if (c === '"') return JSON.parse(text.slice(start, at)); }
    throw Error('Unclosed string');
  }
  function value(depth = 0) {
    if (depth > 128) throw Error('JSON nesting exceeds editor limit');
    skip(); const start = at, kind = text[at], members = new Map(); let trailingComma = false;
    if (kind === '{' || kind === '[') {
      at++; skip(); let index = 0;
      const closing = kind === '{' ? '}' : ']';
      while (text[at] !== closing) {
        if (at >= text.length) throw Error('Unclosed object/array');
        let key = String(index++);
        if (kind === '{') { if (text[at] !== '"') throw Error('Expected quoted key'); key = string(); skip(); if (text[at++] !== ':') throw Error('Expected colon'); }
        if (members.has(key)) throw Error(`Ambiguous duplicate JSON key: ${key}`);
        members.set(key, value(depth + 1)); skip();
        trailingComma = false;
        if (text[at] === ',') { at++; skip(); trailingComma = text[at] === closing; } else if (text[at] !== closing) throw Error('Expected comma');
      }
      at++;
    } else if (kind === '"') string();
    else { const m = text.slice(at).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/); if (!m) throw Error('Invalid JSON value'); at += m[0].length; }
    return { start, end: at, kind, members, trailingComma };
  }
  const tree = value(); skip(); if (at !== text.length) throw Error('Unexpected JSON suffix'); return tree;
}
export function spanAt(tree, pointer) {
  let node = tree;
  if (pointer && !pointer.startsWith('/')) throw Error('Invalid JSON pointer');
  for (const key of pointer ? pointer.slice(1).split('/').map(k => k.replaceAll('~1', '/').replaceAll('~0', '~')) : []) {
    node = node?.members.get(key); if (!node) throw Error(`Missing source pointer: ${pointer}`);
  }
  return node;
}
export function editObject(text, pointer, patch) {
  for (const [key, val] of Object.entries(patch)) {
    const node = spanAt(jsonSpans(text), pointer); if (node.kind !== '{') throw Error('Edit target must be an object');
    const member = node.members.get(key), encoded = JSON.stringify(val);
    if (encoded === undefined) throw Error('Invalid property value');
    if (member) text = text.slice(0, member.start) + encoded + text.slice(member.end);
    else {
      const last = [...node.members.values()].at(-1);
      const hasComma = node.trailingComma;
      if (last && !hasComma) text = text.slice(0, last.end) + ',' + text.slice(last.end);
      const updated = spanAt(jsonSpans(text), pointer);
      const newline = text.includes('\r\n') ? '\r\n' : '\n';
      const indent = text.slice(0, node.start).split(/\r?\n/).at(-1).match(/^\s*/)[0];
      text = text.slice(0, updated.end - 1) + `${newline}${indent}  ${JSON.stringify(key)}: ${encoded}${newline}${indent}` + text.slice(updated.end - 1);
    }
  }
  return text;
}

export function removeArrayItems(text,pointer,indices){
  const triviaEnd=at=>{for(;;){while(/\s/.test(text[at]||'')&&at<text.length)at++;if(text.slice(at,at+2)==='//'){const end=text.indexOf('\n',at);at=end<0?text.length:end;}else if(text.slice(at,at+2)==='/*'){const end=text.indexOf('*/',at+2);if(end<0)throw Error('Unclosed comment');at=end+2;}else return at;}};
  for(const index of [...new Set(indices)].sort((a,b)=>b-a)){
    const array=spanAt(jsonSpans(text),pointer),item=array.members.get(String(index));if(array.kind!=='['||!item)throw Error('Missing array item');
    const after=triviaEnd(item.end),previous=array.members.get(String(index-1));
    const comma=text[after]===','?after:previous?triviaEnd(previous.end):null;
    const ranges=[[item.start,item.end],...(comma!==null?[[comma,comma+1]]:[])].sort((a,b)=>b[0]-a[0]);
    for(const [start,end]of ranges)text=text.slice(0,start)+text.slice(end);
  }
  jsonSpans(text);return text;
}

export function appendControlBodies(text,pointer,entries){
  let target=spanAt(jsonSpans(text),pointer),controls=target.members.get('controls');
  if(!controls){text=editObject(text,pointer,{controls:[]});controls=spanAt(jsonSpans(text),pointer+'/controls');}
  if(controls.kind!=='[')throw Error('controls must be an array');
  const last=[...controls.members.values()].at(-1);if(last&&!controls.trailingComma)text=text.slice(0,last.end)+','+text.slice(last.end);
  const current=spanAt(jsonSpans(text),pointer+'/controls'),newline=text.includes('\r\n')?'\r\n':'\n';
  return text.slice(0,current.end-1)+newline+entries.map(({declaration,body})=>'{'+JSON.stringify(declaration)+':'+body+'}').join(','+newline)+newline+text.slice(current.end-1);
}
