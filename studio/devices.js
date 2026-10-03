// Output specifications are evidence; logical sizes and safe margins are editable test cases.
export const DEVICE_PRESETS = [
  {id:'pc-fhd',name:'PC · Full HD',family:'PC',physicalSize:[1920,1080],viewport:[480,270],input:'마우스·키보드',safeInsets:[0,0,0,0],source:'https://learn.microsoft.com/en-us/windows/win32/dxtecharts/introduction-to-the-10-foot-experience-for-windows-game-developers'},
  {id:'pc-hd',name:'PC · HD 창',family:'PC',physicalSize:[1280,720],viewport:[427,240],input:'마우스·키보드',safeInsets:[0,0,0,0],source:'https://learn.microsoft.com/en-us/windows/win32/dxtecharts/introduction-to-the-10-foot-experience-for-windows-game-developers'},
  {id:'pc-qhd',name:'PC · QHD 비교용',family:'PC',physicalSize:[2560,1440],viewport:[640,360],input:'마우스·키보드',safeInsets:[0,0,0,0],source:null},
  {id:'tablet-ipad',name:'태블릿 · iPad 9세대',family:'태블릿',physicalSize:[2160,1620],viewport:[480,360],input:'터치',safeInsets:[0,0,0,0],source:'https://support.apple.com/en-us/111898'},
  {id:'tablet-galaxy',name:'태블릿 · Galaxy Tab S9',family:'태블릿',physicalSize:[2560,1600],viewport:[480,300],input:'터치',safeInsets:[0,0,0,0],source:'https://www.samsung.com/in/tablets/galaxy-tab-s/galaxy-tab-s9-wi-fi-beige-128gb-sm-x710nzeainu/'},
  {id:'console-fhd',name:'콘솔 · TV 1080p',family:'콘솔',physicalSize:[1920,1080],viewport:[480,270],input:'컨트롤러',safeInsets:[5,5,5,5],source:'https://learn.microsoft.com/en-us/windows/win32/dxtecharts/introduction-to-the-10-foot-experience-for-windows-game-developers'},
  {id:'console-hd',name:'콘솔 · TV 720p',family:'콘솔',physicalSize:[1280,720],viewport:[427,240],input:'컨트롤러',safeInsets:[5,5,5,5],source:'https://learn.microsoft.com/en-us/windows/win32/dxtecharts/introduction-to-the-10-foot-experience-for-windows-game-developers'},
  {id:'console-uhd',name:'콘솔 · TV 4K 비교용',family:'콘솔',physicalSize:[3840,2160],viewport:[640,360],input:'컨트롤러',safeInsets:[5,5,5,5],source:null},
  {id:'mobile-iphone',name:'모바일 · iPhone 13 가로',family:'모바일',physicalSize:[2532,1170],viewport:[584,270],input:'터치',safeInsets:[0,0,0,0],source:'https://support.apple.com/en-us/111872'},
  {id:'mobile-wide',name:'모바일 · 20:9 비교용',family:'모바일',physicalSize:[2400,1080],viewport:[600,270],input:'터치',safeInsets:[0,0,0,0],source:null},
];
export function validateViewport(viewport){
  if(!Array.isArray(viewport)||viewport.length!==2||viewport.some(v=>!Number.isInteger(v)||v<16||v>2048))throw Error('작업 크기는 16~2048 사이의 정수 두 개를 입력하세요.');
  return [...viewport];
}
export function normalizeDevice(value,viewport){
  validateViewport(viewport);
  if(!value)return null;
  const preset=DEVICE_PRESETS.find(p=>p.id===value.presetId),physicalSize=value.physicalSize??preset?.physicalSize;
  if(!Array.isArray(physicalSize)||physicalSize.length!==2||physicalSize.some(v=>!Number.isInteger(v)||v<128||v>16384))throw Error('출력 해상도는 128~16384 사이의 정수 두 개를 입력하세요.');
  const safeInsets=value.safeInsets??preset?.safeInsets??[0,0,0,0];
  if(!Array.isArray(safeInsets)||safeInsets.length!==4||safeInsets.some(v=>!Number.isFinite(v)||v<0||v>25))throw Error('안전 여백은 각 변의 0~25%를 입력하세요.');
  const physicalSpecMatches=!!preset?.source&&preset.physicalSize.every((v,i)=>v===physicalSize[i]);
  return {presetId:preset?.id??'custom',name:preset?.name??'직접 설정',physicalSize:[...physicalSize],safeInsets:[...safeInsets],input:preset?.input??'직접 설정',source:physicalSpecMatches?preset.source:null,physicalSpecMatches,evidence:'editable-test-profile',runtimeVerified:false};
}
export function safeRect(viewport,device){
  const [w,h]=viewport,[l,t,r,b]=device?.safeInsets??[0,0,0,0];
  return {x:w*l/100,y:h*t/100,w:w*(1-(l+r)/100),h:h*(1-(t+b)/100)};
}
export function layoutIssues(nodes,viewport,device){
  const [w,h]=viewport,safe=safeRect(viewport,device),issues=[];
  for(const n of nodes){
    if(!n.visible||n.key==='/'||n.rect.w<=0||n.rect.h<=0)continue;
    const r=n.rect;
    if(r.w>=w&&r.h>=h&&n.type!=='label'&&n.type!=='button')continue;
    if(r.x<-.5||r.y<-.5||r.x+r.w>w+.5||r.y+r.h>h+.5)issues.push({kind:'PREVIEW_BOUNDS',pointer:n.key,message:`${n.id}: 현재 작업 영역 밖으로 나갑니다.`});
    else if(device?.safeInsets.some(v=>v>0)&&(r.x<safe.x-.5||r.y<safe.y-.5||r.x+r.w>safe.x+safe.w+.5||r.y+r.h>safe.y+safe.h+.5))issues.push({kind:'SAFE_AREA',pointer:n.key,message:`${n.id}: 설정한 안전 여백과 겹칩니다.`});
  }
  return issues;
}
