let state = { pages:[], currentPageId:null, history:[] };
let tx = { x:-4700, y:-4700, scale:1 };
let dragging=null, dragOX=0, dragOY=0;
let isPanning=false, panSX=0, panSY=0, panSTX=0, panSTY=0;
let kbPan=false;
let connectMode=false, connectingFrom=null;
let selectedId=null;
let ctxTarget=null, ctxPos={x:0,y:0};
let bubId=1, connId=1, delTarget=null;
let tapCount=0, tapTimer=null, touchPan=false, touchPanSX=0, touchPanSY=0, touchMoved=false, pinchDist=null;
let expandedPages=new Set();

const CV = document.getElementById('canvas');
const CW = document.getElementById('canvas-wrap');
const SV = document.getElementById('connections-svg');
const TL = document.getElementById('temp-line');
const ZI = document.getElementById('zoom-ind');
const CM = document.getElementById('ctx-menu');
const FB = document.getElementById('fmt-toolbar');

// ═══════ IN-PAGE CONFIRM / ALERT (replaces native browser confirm()/alert() popups) ═══════
const _cfm = document.getElementById('confirm-modal');
const _cfmTitle = document.getElementById('confirm-modal-title');
const _cfmMsg = document.getElementById('confirm-modal-msg');
const _cfmOk = document.getElementById('confirm-modal-ok');
const _cfmCancel = document.getElementById('confirm-modal-cancel');

function appConfirm(message, opts={}){
  return new Promise(resolve=>{
    _cfmTitle.textContent = opts.title || 'Confirm';
    _cfmMsg.textContent = message;
    _cfmOk.textContent = opts.okText || 'OK';
    _cfmCancel.style.display = 'inline-block';
    _cfmCancel.textContent = opts.cancelText || 'Cancel';
    _cfm.style.display='flex';
    function cleanup(result){
      _cfm.style.display='none';
      _cfmOk.removeEventListener('click', onOk);
      _cfmCancel.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk(){ cleanup(true); }
    function onCancel(){ cleanup(false); }
    _cfmOk.addEventListener('click', onOk);
    _cfmCancel.addEventListener('click', onCancel);
  });
}

function appAlert(message, opts={}){
  return new Promise(resolve=>{
    _cfmTitle.textContent = opts.title || 'Notice';
    _cfmMsg.textContent = message;
    _cfmOk.textContent = opts.okText || 'OK';
    _cfmCancel.style.display = 'none';
    _cfm.style.display='flex';
    function cleanup(){
      _cfm.style.display='none';
      _cfmOk.removeEventListener('click', onOk);
      resolve(true);
    }
    function onOk(){ cleanup(); }
    _cfmOk.addEventListener('click', onOk);
  });
}

// ═══════ PERSIST ═══════
// The host passes an account-scoped key. Keep the original key as a fallback for standalone use.
const storageKey = new URLSearchParams(window.location.search).get('storageKey') || 'cn4';
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(e){}}
function load(){
  try{
    const d=localStorage.getItem(storageKey);
    if(d) state=JSON.parse(d);
    state.history=state.history||[];
    state.pages.forEach(p=>{
      p.bubbles.forEach(b=>{if(b.id>=bubId)bubId=b.id+1;});
      p.connections.forEach(c=>{if(c.id>=connId)connId=c.id+1;});
    });
  }catch(e){state={pages:[],currentPageId:null,history:[]};}
}

// ═══════ EXPORT / IMPORT ═══════
function exportData(){
  const jsonState = JSON.stringify(state);
  // Base64-encode the entire state — guaranteed no HTML-special chars
  const b64 = btoa(unescape(encodeURIComponent(jsonState)));

  const date = new Date();
  const stamp = date.getFullYear() + '-' +
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0');

  // The doImport logic is written as a plain string, then base64-encoded too,
  // so it lives entirely inside a data-attribute — zero script tags in the file.
  const importFn =
    'var m=document.getElementById("nd");' +
    'var b=m.getAttribute("data-s");' +
    'var j=decodeURIComponent(escape(atob(b)));' +
    'var s=document.getElementById("st");' +
    'try{' +
      'localStorage.setItem(' + JSON.stringify(storageKey) + ',j);' +
      's.textContent="Restored! Opening neither.canvas...";' +
      's.style.color="#d9a5a0";' +
      'setTimeout(function(){window.location="index.html?storageKey="+encodeURIComponent(' + JSON.stringify(storageKey) + ')},900);' +
    '}catch(e){' +
      's.textContent="Error: "+e.message;' +
      's.style.color="#e0726a";' +
    '}';

  // Compose HTML with NO <script> tags at all
  // The import code runs via onclick= attribute (inline handler, parsed differently)
  const lines = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>neither.canvas backup ' + stamp + '</title>',
    '<style>',
    'html,body{height:100%;margin:0;padding:0}',
    'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#151113;color:#ede2de;display:flex;align-items:center;justify-content:center;padding:20px}',
    '.w{background:#1f1820;border:1px solid #2a222a;border-radius:20px;padding:40px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.8)}',
    '.logo{font-size:24px;font-weight:800;color:#d9a5a0;letter-spacing:0.04em;margin-bottom:4px}',
    '.logo b{color:#6b5a64;font-weight:400}',
    '.ds{font-size:10px;color:#4f4250;font-family:monospace;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:24px}',
    'p{color:#a3919b;font-size:13px;line-height:1.8;margin-bottom:26px}',
    'p strong{color:#cdb6bc}',
    '.btn{background:#d9a5a0;color:#151113;border:none;border-radius:10px;padding:13px 36px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:0.02em}',
    '.btn:hover{opacity:0.88}',
    '.note{font-size:11px;color:#4f4250;margin-top:12px;line-height:1.6}',
    '#st{font-size:12px;margin-top:18px;min-height:20px;font-weight:600}',
    '</style>',
    '</head>',
    '<body>',
    '<span id="nd" data-s="' + b64 + '" style="display:none"></span>',
    '<div class="w">',
    '  <div class="logo">neither<b>.canvas</b></div>',
    '  <div class="ds">backup &mdash; ' + stamp + '</div>',
    '  <p>Your canvas data is stored in this file.<br>Click below to restore it — or open <strong>canvas-notes.html</strong> and use <strong>Import</strong> in the sidebar.</p>',
    '  <button class="btn" onclick="' + importFn.replace(/"/g, '&quot;') + '">Restore to neither.canvas</button>',
    '  <div class="note">Keep this file in the same folder as canvas-notes.html.</div>',
    '  <div id="st"></div>',
    '</div>',
    '</body>',
    '</html>'
  ];

  const blob = new Blob([lines.join('\n')], {type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = 'neither-backup-' + stamp + '.html';
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 3000);
}

let _pendingImportState = null;

function triggerImport(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const text = e.target.result;
      let importedState = null;

      // Format 1: pure JSON export
      if(text.trim().startsWith('{')){
        const parsed = JSON.parse(text);
        importedState = parsed.__neither ? parsed.state : parsed;
      }
      // Format 2: new backup HTML — state stored as base64 in <meta name="neither-data">
      else if(text.includes('neither-data')){
        const metaMatch = text.match(/meta[^>]+neither-data[^>]+content="([^"]+)"/);
        if(!metaMatch) throw new Error('Could not find data in backup file');
        const json = decodeURIComponent(escape(atob(metaMatch[1])));
        importedState = JSON.parse(json);
      }
      // Format 3: old backup HTML with var NDATA= or const DATA =
      else {
        const match = text.match(/var NDATA=(\{[\s\S]*?\});[\s\n]*function doImport/) ||
                      text.match(/const DATA = (\{[\s\S]*?\});[\s\n]*function doImport/);
        if(!match) throw new Error('Unrecognised file format');
        const parsed = JSON.parse(match[1]);
        importedState = parsed.__neither ? parsed.state : parsed;
      }

      if(!importedState || !Array.isArray(importedState.pages)) throw new Error('Invalid data — pages list missing');

      _pendingImportState = importedState;
      const count = importedState.pages.length;
      document.getElementById('import-modal-desc').textContent =
        `Found ${count} canvas${count!==1?'es':''} in this file. How would you like to import?`;
      document.getElementById('import-modal').style.display = 'flex';
    } catch(err){
      appAlert('Could not read file: ' + err.message + '. Make sure it\'s a valid neither.canvas backup.',{title:'Import failed'});
    }
  };
  reader.readAsText(file);
}

function applyImport(merge){
  if(!_pendingImportState) return;
  if(merge){
    // Merge: add pages from file, avoid ID collisions
    const offset = Date.now();
    _pendingImportState.pages.forEach((p,i)=>{
      const newId = offset + i;
      // remap bubble/connection IDs to avoid clashes
      state.pages.push({...p, id:newId, name:p.name+' (imported)', createdAt:newId});
    });
    if(_pendingImportState.history) state.history.push(..._pendingImportState.history);
  } else {
    // Replace
    state = _pendingImportState;
    state.history = state.history || [];
  }
  // Recalculate ID counters
  bubId=1; connId=1;
  state.pages.forEach(p=>{
    p.bubbles.forEach(b=>{if(b.id>=bubId)bubId=b.id+1;});
    p.connections.forEach(c=>{if(c.id>=connId)connId=c.id+1;});
  });
  save(); renderSidebar();
  if(state.pages.length) openPage(state.pages[0].id);
  else renderCanvas();
  _pendingImportState = null;
  document.getElementById('import-modal').style.display = 'none';
}

document.getElementById('export-btn').addEventListener('click', exportData);
document.getElementById('import-file').addEventListener('change', e=>{
  triggerImport(e.target.files[0]);
  e.target.value=''; // reset so same file can be re-imported
});
document.getElementById('import-merge-btn').addEventListener('click', ()=>applyImport(true));
document.getElementById('import-replace-btn').addEventListener('click', ()=>applyImport(false));
document.getElementById('import-cancel-btn').addEventListener('click', ()=>{
  _pendingImportState=null;
  document.getElementById('import-modal').style.display='none';
});

// ═══════ PAGES ═══════
function pg(){return state.pages.find(p=>p.id===state.currentPageId)||null;}

function createPage(name,parentId=null){
  const id=Date.now();
  state.pages.push({id,name:name||'Untitled',bubbles:[],connections:[],createdAt:id,parentId});
  if(parentId) expandedPages.add(parentId);
  save();renderSidebar();openPage(id);
}
function createSubPage(parentId){
  createPage('Untitled',parentId);
}
function openPage(id){
  state.currentPageId=id;tx={x:-4700,y:-4700,scale:1};
  applyTx();save();renderSidebar();renderCanvas();updateDateBadge();updateCanvasBg();
}
function deletePage(id){
  const p=state.pages.find(x=>x.id===id);
  if(!p)return;
  // Cascade: also move any sub-pages of this page into history
  const children=state.pages.filter(x=>x.parentId===id);
  children.forEach(c=>state.history.unshift({...c,deletedAt:Date.now()}));
  state.history.unshift({...p,deletedAt:Date.now()});
  if(state.history.length>40) state.history=state.history.slice(0,40);
  const idsToRemove=new Set([id,...children.map(c=>c.id)]);
  state.pages=state.pages.filter(x=>!idsToRemove.has(x.id));
  if(idsToRemove.has(state.currentPageId)) state.currentPageId=state.pages[0]?.id||null;
  save();renderSidebar();renderCanvas();
}
function restorePage(da){
  const i=state.history.findIndex(h=>h.deletedAt===da);
  if(i<0)return;
  const p={...state.history[i]};delete p.deletedAt;
  // If this was a sub-page but its parent no longer exists (parent wasn't restored), promote it to top-level
  if(p.parentId && !state.pages.find(x=>x.id===p.parentId)) p.parentId=null;
  state.history.splice(i,1);state.pages.push(p);
  save();renderSidebar();openPage(p.id);
}

async function permanentlyDeletePage(da){
  const i=state.history.findIndex(h=>h.deletedAt===da);
  if(i<0)return;
  const h=state.history[i];
  const ok = await appConfirm(`Permanently delete "${h.name}"? This cannot be undone.`,{title:'Delete permanently',okText:'Delete forever'});
  if(!ok)return;
  state.history.splice(i,1);
  save();renderSidebar();
}

async function clearAllHistory(){
  if(!state.history.length)return;
  const ok = await appConfirm(`Permanently delete all ${state.history.length} canvas${state.history.length!==1?'es':''} in History? This cannot be undone.`,{title:'Clear History',okText:'Delete all'});
  if(!ok)return;
  state.history=[];
  save();renderSidebar();
}

function startRename(pid,nameEl){
  const p=state.pages.find(x=>x.id===pid);if(!p)return;
  const inp=document.createElement('input');
  inp.className='page-name-input';inp.value=p.name;
  nameEl.replaceWith(inp);inp.focus();inp.select();
  function done(){
    p.name=inp.value.trim()||'Untitled';
    save();renderSidebar();
    if(p.id===state.currentPageId) setTitleDisplay(p.name);
  }
  inp.addEventListener('blur',done);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur();e.stopPropagation();});
}

function setTitleDisplay(name){
  const el=document.getElementById('page-title-display');
  if(el) el.textContent=name;
}

function renderPageItem(p,isSub){
  const item=document.createElement('div');
  item.className='page-item'+(p.id===state.currentPageId?' active':'');
  item.dataset.pageId=p.id;
  const children=state.pages.filter(x=>x.parentId===p.id);
  const hasChildren=children.length>0;
  const isExpanded=expandedPages.has(p.id);
  const arrowHtml = !isSub
    ? (hasChildren
        ? `<button class="page-expand-arrow${isExpanded?' expanded':''}" data-act="expand"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg></button>`
        : `<span class="page-expand-spacer"></span>`)
    : '';
  item.innerHTML=`${arrowHtml}<span class="page-icon">${isSub?'📄':'📋'}</span><span class="page-name">${esc(p.name)}</span>
    <div class="page-acts">
      ${!isSub?'<button class="page-act add-sub" data-act="addsub" title="Add sub-page">➕</button>':''}
      <button class="page-act" data-act="rename" title="Rename">✏️</button>
      <button class="page-act danger" data-act="del" title="Delete">✕</button>
    </div>`;
  item.querySelector('[data-act="rename"]').addEventListener('click',e=>{e.stopPropagation();startRename(p.id,item.querySelector('.page-name'));});
  item.querySelector('[data-act="del"]').addEventListener('click',async e=>{e.stopPropagation();e.preventDefault();const msg=hasChildren?`Delete "${p.name}" and its ${children.length} sub-page${children.length!==1?'s':''}? They go to History.`:'Delete "'+p.name+'"? It goes to History.';if(await appConfirm(msg,{title:'Delete canvas',okText:'Delete'}))deletePage(p.id);});
  item.querySelector('.page-name').addEventListener('dblclick',e=>{e.stopPropagation();startRename(p.id,item.querySelector('.page-name'));});
  const addSubBtn=item.querySelector('[data-act="addsub"]');
  if(addSubBtn) addSubBtn.addEventListener('click',e=>{e.stopPropagation();createSubPage(p.id);});
  const expandBtn=item.querySelector('[data-act="expand"]');
  if(expandBtn) expandBtn.addEventListener('click',e=>{
    e.stopPropagation();
    if(expandedPages.has(p.id)) expandedPages.delete(p.id); else expandedPages.add(p.id);
    renderSidebar();
  });
  item.addEventListener('click',()=>openPage(p.id));
  item.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();showPageCtxMenu(e,p.id);});
  return item;
}

function renderSidebar(){
  const pl=document.getElementById('pages-list');
  const hl=document.getElementById('history-list');
  pl.innerHTML='';hl.innerHTML='';
  const topLevel=state.pages.filter(p=>!p.parentId);
  topLevel.forEach(p=>{
    pl.appendChild(renderPageItem(p,false));
    const children=state.pages.filter(x=>x.parentId===p.id);
    if(children.length){
      const subList=document.createElement('div');
      subList.className='subpage-list'+(expandedPages.has(p.id)?' open':'');
      children.forEach(c=>subList.appendChild(renderPageItem(c,true)));
      pl.appendChild(subList);
    }
  });
  if(!state.history.length){
    hl.innerHTML='<div class="history-empty">No deleted canvases yet</div>';
  } else {
    const clearRow=document.createElement('div');clearRow.className='history-clear-row';
    clearRow.innerHTML=`<button class="history-clear-btn">🗑 Clear all history</button>`;
    clearRow.querySelector('.history-clear-btn').addEventListener('click',clearAllHistory);
    hl.appendChild(clearRow);
    state.history.forEach(h=>{
      const item=document.createElement('div');item.className='history-item';
      item.innerHTML=`<span>🗂</span><span class="hi-name">${esc(h.name)}</span><button class="hi-restore">Restore</button><button class="hi-del-forever" title="Delete permanently">✕</button>`;
      item.querySelector('.hi-restore').addEventListener('click',()=>restorePage(h.deletedAt));
      item.querySelector('.hi-del-forever').addEventListener('click',e=>{e.stopPropagation();permanentlyDeletePage(h.deletedAt);});
      hl.appendChild(item);
    });
  }
  setTitleDisplay(pg()?.name||'');
}

document.querySelectorAll('.sidebar-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.sidebar-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.pages-list,.history-list').forEach(l=>l.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab==='pages'?'pages-list':'history-list').classList.add('active');
  });
});

// ═══════ SIDEBAR RESIZE ═══════
(function(){
  const r=document.getElementById('sidebar-resizer');
  const s=document.getElementById('sidebar');
  let on=false,sx=0,sw=0;
  r.addEventListener('mousedown',e=>{on=true;sx=e.clientX;sw=s.offsetWidth;document.body.style.cursor='col-resize';document.body.style.userSelect='none';e.preventDefault();});
  document.addEventListener('mousemove',e=>{if(!on)return;s.style.width=Math.min(500,Math.max(160,sw+(e.clientX-sx)))+'px';});
  document.addEventListener('mouseup',()=>{if(!on)return;on=false;document.body.style.cursor='';document.body.style.userSelect='';});
})();

// ═══════ TRANSFORM ═══════
function applyTx(){
  CV.style.transform=`translate(${tx.x}px,${tx.y}px) scale(${tx.scale})`;
  const CBG=document.getElementById('canvas-bg');
  if(CBG && !CBG.classList.contains('bg-is-preset')) CBG.style.transform=`translate(${tx.x}px,${tx.y}px) scale(${tx.scale})`;
  ZI.textContent=Math.round(tx.scale*100)+'%';
  drawGrid();
}
function s2c(sx,sy){
  const r=CW.getBoundingClientRect();
  return{x:(sx-r.left-tx.x)/tx.scale,y:(sy-r.top-tx.y)/tx.scale};
}

// ═══════ ADAPTIVE GRID ═══════
const GC = document.getElementById('grid-canvas');
const GX = GC.getContext('2d');

function drawGrid(){
  const W=CW.offsetWidth||window.innerWidth, H=CW.offsetHeight||window.innerHeight;
  if(GC.width!==W||GC.height!==H){GC.width=W;GC.height=H;}
  GX.clearRect(0,0,W,H);

  const BASE=40; // base grid spacing in canvas coords
  const step=BASE*tx.scale;

  // Adapt: if step too small, jump up; if too big, scale down
  let gs=step;
  while(gs<18) gs*=2;
  while(gs>80) gs/=2;

  // Only the larger grid is drawn — every 5 cells — at a faint, low-contrast stroke
  const maj=gs*5;
  const mox=((tx.x % maj)+maj) % maj;
  const moy=((tx.y % maj)+maj) % maj;
  GX.beginPath();
  GX.strokeStyle='rgba(217,165,160,0.045)';
  GX.lineWidth=1;
  for(let x=mox-maj;x<W+maj;x+=maj){GX.moveTo(x,0);GX.lineTo(x,H);}
  for(let y=moy-maj;y<H+maj;y+=maj){GX.moveTo(0,y);GX.lineTo(W,y);}
  GX.stroke();
}

// Redraw grid when window resizes
window.addEventListener('resize',()=>{drawGrid();});

// ═══════ CLOCK & DATE ═══════
function updateClock(){
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=String(now.getMinutes()).padStart(2,'0');
  const ss=String(now.getSeconds()).padStart(2,'0');
  document.getElementById('clock-time').textContent=`${hh}:${mm}:${ss}`;
  const days=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  document.getElementById('clock-date').textContent=
    `${days[now.getDay()]}  ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock,1000);
updateClock();

// ═══════ CANVAS DATE BADGE ═══════
function updateDateBadge(){
  const p=pg(); const badge=document.getElementById('canvas-date-badge');
  if(!p){badge.style.display='none';return;}
  const ts=p.createdAt||p.id;
  const d=new Date(ts);
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  badge.textContent=`Created ${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  badge.style.display='inline-block';
}

// ═══════ ADD BUBBLE ═══════
function addBubble(type,cx,cy){
  const page=pg();if(!page)return;
  const id=bubId++;
  const b={id,type:type||'text',x:cx-90,y:cy-40,color:'',content:'',todos:[],imgSrc:'',subCanvas:null,subCanvasName:'',codeLang:'javascript',codeContent:''};
  if(type==='subcanvas'){ b.subCanvas={bubbles:[],connections:[]}; b.subCanvasName='Inner canvas'; }
  if(type==='todo') b.todos=[{id:'t1',text:'',done:false,pri:0}];
  page.bubbles.push(b);save();
  const el=renderBubble(b);
  setTimeout(()=>{
    if(type==='code'){ el.querySelector('.code-textarea')?.focus(); return; }
    const c=el.querySelector('.bubble-content,.todo-txt');if(c){c.focus();if(type==='text')pce(c);}
  },60);
  updateEmpty();return el;
}

// ═══════ RENDER BUBBLE ═══════
function renderBubble(b){
  const el=document.createElement('div');
  el.className=`bubble type-${b.type}`+(b.color?` color-${b.color}`:'');
  el.dataset.id=b.id;
  el.style.left=b.x+'px';el.style.top=b.y+'px';
  if(b.w) el.style.width=b.w+'px';
  if(b.h) el.style.height=b.h+'px';
  el.innerHTML=`<div class="connect-dots">
    <div class="connect-dot top" data-side="top"></div><div class="connect-dot bottom" data-side="bottom"></div>
    <div class="connect-dot left" data-side="left"></div><div class="connect-dot right" data-side="right"></div>
  </div>
  <div class="bubble-toolbar">
    <button class="bub-tool" data-act="connect">🔗</button>
    <button class="bub-tool" data-act="color">🎨</button>
    <button class="bub-tool danger" data-act="delete">✕</button>
  </div>
  <div class="bubble-inner"></div>
  <div class="resize-edge-r" data-resize="r"></div>
  <div class="resize-edge-b" data-resize="b"></div>
  <div class="resize-handle" data-resize="both"></div>`;
  const inner = el.querySelector('.bubble-inner');

  if(b.type==='text'){
    const c=document.createElement('div');
    c.className='bubble-content';c.contentEditable='true';c.dataset.placeholder='Type anything…';
    c.innerHTML=b.content||'';
    // Linkify existing content on load
    if(b.content) setTimeout(()=>linkifyContent(c),80);
    c.addEventListener('input',()=>{b.content=c.innerHTML;save();});
    c.addEventListener('mousedown',e=>e.stopPropagation());
    c.addEventListener('keydown',e=>e.stopPropagation());
    c.addEventListener('mouseup',()=>showFmtBar(c));
    c.addEventListener('keyup',()=>showFmtBar(c));
    // Linkify on blur
    c.addEventListener('blur',()=>{ linkifyContent(c); b.content=c.innerHTML; save(); });
    // Intercept link clicks inside editable div
    c.addEventListener('click',e=>{
      const link=e.target.closest('a[data-href]');
      if(link){ e.preventDefault(); e.stopPropagation(); window.open(link.dataset.href,'_blank','noopener'); }
    });
    inner.appendChild(c);
  } else if(b.type==='code'){
    const w=document.createElement('div'); w.className='code-bubble-wrap';
    renderCodeBubble(w, b);
    inner.appendChild(w);
  } else if(b.type==='subcanvas'){
    renderSubcanvasBubble(b, inner);
  } else if(b.type==='todo'){
    const w=document.createElement('div');w.className='todo-wrap';
    renderTodos(w,b);inner.appendChild(w);
  } else if(b.type==='image'){
    const w=document.createElement('div');
    if(b.imgSrc){
      const img=document.createElement('img');img.src=b.imgSrc;img.className='bubble-img';img.draggable=false;w.appendChild(img);
    } else {
      const lbl=document.createElement('label');lbl.className='img-upload-lbl';lbl.innerHTML='🖼 Click to add image';
      const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.style.display='none';
      inp.addEventListener('change',()=>{
        const f=inp.files[0];if(!f)return;
        const rdr=new FileReader();rdr.onload=ev=>{b.imgSrc=ev.target.result;save();const ex=CV.querySelector(`[data-id="${b.id}"]`);if(ex)ex.remove();CV.appendChild(renderBubble(b));renderConns();};
        rdr.readAsDataURL(f);
      });
      lbl.appendChild(inp);w.appendChild(lbl);
    }
    w.addEventListener('mousedown',e=>e.stopPropagation());inner.appendChild(w);
  }

  el.addEventListener('mousedown',onBubbleMD);
  el.addEventListener('contextmenu',onBubbleRC);
  el.addEventListener('click',e=>{
    if(e.target.closest('.connect-dot,.bubble-toolbar'))return;
    e.stopPropagation();
    if(handleConnectClick(b.id,el))return;
    selectBubble(b.id);
  });
  el.querySelectorAll('.connect-dot').forEach(d=>d.addEventListener('mousedown',e=>{e.stopPropagation();startConn(b.id,d.dataset.side,e);}));
  el.querySelector('[data-act="delete"]').addEventListener('click',e=>{e.stopPropagation();initiateDelete(b.id);});
  el.querySelector('[data-act="connect"]').addEventListener('click',e=>{
    e.stopPropagation();
    setConnectMode(true);
    handleConnectClick(b.id,el);
  });
  el.querySelector('[data-act="color"]').addEventListener('click',e=>{e.stopPropagation();cycleColor(b,el);});
  el.querySelectorAll('[data-resize]').forEach(h=>h.addEventListener('mousedown',onBubbleResize));
  CV.appendChild(el);return el;
}

// ═══════ LINKIFY TEXT CONTENT ═══════
function linkifyContent(el){
  // Walk text nodes, wrap URLs in anchor tags
  const urlRe = /https?:\/\/[^\s<>"']+/g;
  // Only process if there are raw text URLs (not already wrapped)
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n; while(n=walker.nextNode()) nodes.push(n);
  nodes.forEach(node=>{
    if(node.parentElement.tagName==='A') return; // already a link
    const text = node.textContent;
    if(!urlRe.test(text)) return;
    urlRe.lastIndex=0;
    const frag = document.createDocumentFragment();
    let last=0, m;
    while((m=urlRe.exec(text))!==null){
      if(m.index>last) frag.appendChild(document.createTextNode(text.slice(last,m.index)));
      const a=document.createElement('a');
      a.href='#'; a.dataset.href=m[0]; a.textContent=m[0];
      // Determine favicon/icon
      try{ const u=new URL(m[0]); a.title=u.hostname; }catch(e){}
      frag.appendChild(a);
      last=m.index+m[0].length;
    }
    if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

// ═══════ CODE BUBBLE ═══════
const CODE_LANGS = [
  ['javascript','JavaScript'],['typescript','TypeScript'],['python','Python'],
  ['html','HTML'],['css','CSS'],['bash','Bash/Shell'],['json','JSON'],
  ['rust','Rust'],['go','Go'],['java','Java'],['c','C'],['cpp','C++'],['sql','SQL'],['text','Plain text']
];

function renderCodeBubble(wrap, b){
  wrap.innerHTML='';
  b.codeLang = b.codeLang || 'javascript';
  b.codeContent = b.codeContent || '';
  let isEditing = !b.codeContent; // start in edit mode if empty

  // Top bar
  const topbar = document.createElement('div');
  topbar.className='code-bubble-topbar';

  // Dot decorations (like a terminal)
  const dots = document.createElement('div');
  dots.style.cssText='display:flex;gap:5px;align-items:center;';
  ['#f74c6a','#f7c948','#6af77c'].forEach(col=>{
    const d=document.createElement('div');
    d.style.cssText=`width:9px;height:9px;border-radius:50%;background:${col};opacity:0.8;flex-shrink:0;`;
    dots.appendChild(d);
  });
  topbar.appendChild(dots);

  // Lang selector
  const langSel = document.createElement('select');
  langSel.className='code-lang-sel';
  CODE_LANGS.forEach(([v,l])=>{
    const o=document.createElement('option');o.value=v;o.textContent=l;
    if(v===b.codeLang)o.selected=true;
    langSel.appendChild(o);
  });
  langSel.addEventListener('mousedown',e=>e.stopPropagation());
  langSel.addEventListener('change',()=>{ b.codeLang=langSel.value; save(); refreshHighlight(); });
  topbar.appendChild(langSel);

  // Line count
  const lineCount = document.createElement('span');
  lineCount.className='code-line-count';
  lineCount.textContent = b.codeContent ? (b.codeContent.split('\n').length+' lines') : '';
  topbar.appendChild(lineCount);

  // Right buttons
  const right = document.createElement('div');
  right.className='code-bubble-topbar-right';

  const editBtn = document.createElement('button');
  editBtn.className='code-edit-btn'+(isEditing?' active':'');
  editBtn.textContent = isEditing ? '✓ Done' : '✏ Edit';
  editBtn.addEventListener('mousedown',e=>e.stopPropagation());

  const copyBtn = document.createElement('button');
  copyBtn.className='code-copy-btn';
  copyBtn.textContent='⎘ Copy';
  copyBtn.addEventListener('mousedown',e=>e.stopPropagation());
  copyBtn.addEventListener('click',e=>{
    e.stopPropagation();
    navigator.clipboard?.writeText(b.codeContent||'').then(()=>{
      copyBtn.textContent='✓ Copied'; copyBtn.classList.add('copied');
      setTimeout(()=>{copyBtn.textContent='⎘ Copy'; copyBtn.classList.remove('copied');},1500);
    });
  });

  right.appendChild(editBtn); right.appendChild(copyBtn);
  topbar.appendChild(right);
  wrap.appendChild(topbar);

  // Code display (highlighted)
  const displayWrap = document.createElement('pre');
  displayWrap.className='code-display';
  displayWrap.style.display = isEditing ? 'none':'block';
  const displayCode = document.createElement('code');
  displayCode.className = `language-${b.codeLang}`;
  displayCode.textContent = b.codeContent;
  displayWrap.appendChild(displayCode);
  displayWrap.addEventListener('mousedown',e=>e.stopPropagation());

  // Textarea for editing
  const textarea = document.createElement('textarea');
  textarea.className='code-textarea';
  textarea.value = b.codeContent;
  textarea.placeholder='// Paste or type your code here…\n// Tab inserts spaces';
  textarea.spellcheck=false;
  textarea.style.display = isEditing ? 'block':'none';
  textarea.addEventListener('mousedown',e=>e.stopPropagation());
  textarea.addEventListener('keydown',e=>{
    e.stopPropagation();
    // Tab = 2 spaces
    if(e.key==='Tab'){
      e.preventDefault();
      const s=textarea.selectionStart, en=textarea.selectionEnd;
      textarea.value=textarea.value.substring(0,s)+'  '+textarea.value.substring(en);
      textarea.selectionStart=textarea.selectionEnd=s+2;
    }
  });
  textarea.addEventListener('input',()=>{
    b.codeContent=textarea.value;
    lineCount.textContent=textarea.value ? (textarea.value.split('\n').length+' lines'):'';
    save();
  });

  function refreshHighlight(){
    displayCode.className=`language-${b.codeLang}`;
    displayCode.textContent=b.codeContent;
    if(window.Prism) Prism.highlightElement(displayCode);
  }

  function switchToView(){
    isEditing=false;
    textarea.style.display='none';
    displayWrap.style.display='block';
    editBtn.textContent='✏ Edit'; editBtn.classList.remove('active');
    refreshHighlight();
  }
  function switchToEdit(){
    isEditing=true;
    textarea.value=b.codeContent;
    displayWrap.style.display='none';
    textarea.style.display='block';
    editBtn.textContent='✓ Done'; editBtn.classList.add('active');
    setTimeout(()=>textarea.focus(),30);
  }

  editBtn.addEventListener('click',e=>{ e.stopPropagation(); isEditing ? switchToView() : switchToEdit(); });

  wrap.appendChild(displayWrap);
  wrap.appendChild(textarea);
  wrap.addEventListener('mousedown',e=>e.stopPropagation());

  // Initial highlight if we have content
  if(b.codeContent && window.Prism) setTimeout(()=>Prism.highlightElement(displayCode),50);
}

// ═══════ SUB-CANVAS BUBBLE ═══════
function renderSubcanvasBubble(b, el) {
  const wrap = document.createElement('div');
  wrap.className = 'subcanvas-preview';
  wrap.innerHTML = `<div class="subcanvas-mini-dots"></div>`;

  // count label
  const cnt = document.createElement('div');
  cnt.className = 'subcanvas-bubble-count';
  const numBubbles = (b.subCanvas?.bubbles?.length) || 0;
  cnt.textContent = numBubbles + ' bubble' + (numBubbles!==1?'s':'');
  wrap.appendChild(cnt);

  // bottom label + open button
  const lbl = document.createElement('div');
  lbl.className = 'subcanvas-preview-label';
  const name = document.createElement('span');
  name.textContent = b.subCanvasName || 'Inner canvas';
  name.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  const openBtn = document.createElement('button');
  openBtn.className = 'sc-open-btn';
  openBtn.textContent = '⤢ Open';
  openBtn.addEventListener('mousedown', e => e.stopPropagation());
  openBtn.addEventListener('click', e => { e.stopPropagation(); openSubCanvas(b, el, wrap); });
  lbl.appendChild(name); lbl.appendChild(openBtn);
  wrap.appendChild(lbl);

  wrap.addEventListener('mousedown', e => e.stopPropagation());
  wrap.addEventListener('dblclick', e => { e.stopPropagation(); openSubCanvas(b, el, wrap); });
  el.appendChild(wrap);
}

// ─── SUB-CANVAS MODAL ENGINE ───
let scTx = {x:-2700,y:-2700,scale:1};
let scBubId = 1, scConnId = 1;
let scActiveBubble = null;
let scParentEl = null;
let scDragging = null, scDragOX=0, scDragOY=0;
let scPanning=false, scPanSX=0, scPanSY=0, scPanSTX=0, scPanSTY=0;
let scConnectingFrom=null;
let scConnectMode=false, scConnectSource=null;
let scSelectedId=null;

const SCM = document.getElementById('subcanvas-modal');
const SCCW = document.getElementById('sc-canvas-wrap');
const SCC = document.getElementById('sc-canvas');
const SCSVG = document.getElementById('sc-svg');
const SCTL = document.getElementById('sc-temp-line');
const SCZI = document.getElementById('sc-zoom');

function openSubCanvas(b, bubbleEl, previewWrap) {
  scActiveBubble = b;
  scParentEl = previewWrap;
  b.subCanvas = b.subCanvas || {bubbles:[], connections:[]};
  b.subCanvasName = b.subCanvasName || 'Inner canvas';
  scTx = {x:-2700, y:-2700, scale:1};
  scConnectMode=false; scConnectSource=null; scConnectingFrom=null;
  document.getElementById('sc-connect-toggle').classList.remove('active');
  document.getElementById('sc-connect-banner').style.display='none';
  document.getElementById('sc-modal-title').value = b.subCanvasName;
  SCM.classList.add('show');
  scApplyTx();
  scRenderAll();
}

function closeSubCanvas() {
  SCM.classList.remove('show');
  if(scParentEl && scActiveBubble) {
    const cnt = scParentEl.querySelector('.subcanvas-bubble-count');
    if(cnt) cnt.textContent = (scActiveBubble.subCanvas?.bubbles?.length||0) + ' bubble' + ((scActiveBubble.subCanvas?.bubbles?.length||0)!==1?'s':'');
    const nameEl = scParentEl.querySelector('.subcanvas-preview-label span');
    if(nameEl) nameEl.textContent = scActiveBubble.subCanvasName || 'Inner canvas';
  }
  save();
  scActiveBubble = null; scParentEl = null;
}

document.getElementById('sc-modal-close').addEventListener('click', closeSubCanvas);
document.getElementById('sc-modal-title').addEventListener('input', function(){
  if(scActiveBubble) scActiveBubble.subCanvasName = this.value;
});
document.getElementById('sc-modal-title').addEventListener('keydown', e => e.stopPropagation());
SCM.addEventListener('click', e => { if(e.target===SCM) closeSubCanvas(); });

// SC connect mode
document.getElementById('sc-connect-toggle').addEventListener('click', ()=>{
  scConnectMode=!scConnectMode;
  document.getElementById('sc-connect-toggle').classList.toggle('active',scConnectMode);
  const banner=document.getElementById('sc-connect-banner');
  if(scConnectMode){ banner.style.display='block'; banner.textContent='🔗 Click source bubble'; scConnectSource=null; }
  else { banner.style.display='none'; scConnectSource=null; scConnectingFrom=null; SCTL.style.opacity='0';
    SCC.querySelectorAll('[data-scid]').forEach(el=>el.classList.remove('connecting-source','connecting-target-hover','connect-pickable'));
  }
});

function scSetConnMode(on){
  scConnectMode=on;
  document.getElementById('sc-connect-toggle').classList.toggle('active',on);
  const banner=document.getElementById('sc-connect-banner');
  if(on){ banner.style.display='block'; banner.textContent='🔗 Click source bubble'; scConnectSource=null; }
  else { banner.style.display='none'; scConnectSource=null; scConnectingFrom=null; SCTL.style.opacity='0';
    SCC.querySelectorAll('[data-scid]').forEach(el=>el.classList.remove('connecting-source','connecting-target-hover','connect-pickable'));
  }
}

function scHandleConnectClick(id, el){
  if(!scConnectMode) return false;
  const banner=document.getElementById('sc-connect-banner');
  if(!scConnectSource){
    scConnectSource={id};
    SCC.querySelectorAll('[data-scid]').forEach(e=>e.classList.remove('connecting-source'));
    el.classList.add('connecting-source');
    banner.textContent='🔗 Source selected — click target bubble(s) · ESC to exit';
    const p=scBubbleSidePoint(id,'right'); if(p){SCTL.setAttribute('x1',p.x);SCTL.setAttribute('y1',p.y);SCTL.setAttribute('x2',p.x);SCTL.setAttribute('y2',p.y);SCTL.style.opacity='1';}
  } else {
    if(id===scConnectSource.id) return true;
    const srcEl=SCC.querySelector(`[data-scid="${scConnectSource.id}"]`);
    const tgtEl=SCC.querySelector(`[data-scid="${id}"]`);
    let fs='right',ts='left';
    if(srcEl&&tgtEl){
      const sx2=parseFloat(srcEl.style.left)+srcEl.offsetWidth/2, sy2=parseFloat(srcEl.style.top)+srcEl.offsetHeight/2;
      const tx2=parseFloat(tgtEl.style.left)+tgtEl.offsetWidth/2, ty2=parseFloat(tgtEl.style.top)+tgtEl.offsetHeight/2;
      const adx=Math.abs(tx2-sx2),ady=Math.abs(ty2-sy2);
      if(adx>=ady){fs=tx2>sx2?'right':'left';ts=tx2>sx2?'left':'right';}
      else{fs=ty2>sy2?'bottom':'top';ts=ty2>sy2?'top':'bottom';}
    }
    const sc=scActiveBubble?.subCanvas;
    if(sc&&!sc.connections.find(c=>c.from===scConnectSource.id&&c.to===id)){
      sc.connections.push({id:scConnId++,from:scConnectSource.id,fromSide:fs,to:id,toSide:ts,mx:0,my:0});
      save(); scRenderConns();
    }
    el.classList.add('connecting-target-hover');
    setTimeout(()=>el.classList.remove('connecting-target-hover'),600);
    banner.textContent='🔗 Connected! Click more targets · ESC to exit';
  }
  return true;
}

function scApplyTx(){
  SCC.style.transform = `translate(${scTx.x}px,${scTx.y}px) scale(${scTx.scale})`;
  SCZI.textContent = Math.round(scTx.scale*100)+'%';
}
function sc2c(sx,sy){
  const r=SCCW.getBoundingClientRect();
  return{x:(sx-r.left-scTx.x)/scTx.scale, y:(sy-r.top-scTx.y)/scTx.scale};
}

function scRenderAll(){
  Array.from(SCC.children).forEach(el=>{if(el!==SCSVG)el.remove();});
  SCSVG.querySelectorAll('.sc-conn-path').forEach(e=>e.remove());
  SCCW.querySelectorAll('.sc-mid-handle').forEach(e=>e.remove());
  const sc = scActiveBubble?.subCanvas; if(!sc) return;
  sc.bubbles.forEach(b => scRenderBubble(b));
  scRenderConns();
  document.getElementById('sc-empty').style.display = sc.bubbles.length===0 ? 'block':'none';
}

function scAddBubble(type, cx, cy){
  const sc = scActiveBubble?.subCanvas; if(!sc) return;
  const id = scBubId++;
  const b = {id, x:cx-90, y:cy-40, color:'', content:'', type:type||'text',
    todos:[], imgSrc:'', subCanvas:null, subCanvasName:'', codeLang:'javascript', codeContent:''};
  if(type==='subcanvas'){ b.subCanvas={bubbles:[],connections:[]}; b.subCanvasName='Inner canvas'; }
  if(type==='todo') b.todos=[{id:'t1',text:'',done:false,pri:0}];
  sc.bubbles.push(b); save();
  const el = scRenderBubble(b);
  document.getElementById('sc-empty').style.display = 'none';
  setTimeout(()=>{
    if(type==='code'){ el.querySelector('.code-textarea')?.focus(); return; }
    const c=el.querySelector('.bubble-content,.todo-txt');if(c){c.focus();if(type==='text')scPlaceCursorEnd(c);}
  },60);
  return el;
}

function scRenderBubble(b){
  const el = document.createElement('div');
  el.className = 'bubble type-'+b.type+(b.color ? ` color-${b.color}` : '');
  el.dataset.scid = b.id;
  el.style.left = b.x+'px'; el.style.top = b.y+'px';
  el.innerHTML = `
    <div class="connect-dots">
      <div class="connect-dot top" data-side="top"></div>
      <div class="connect-dot bottom" data-side="bottom"></div>
      <div class="connect-dot left" data-side="left"></div>
      <div class="connect-dot right" data-side="right"></div>
    </div>
    <div class="bubble-toolbar">
      <button class="bub-tool" data-sca="connect">🔗</button>
      <button class="bub-tool" data-sca="color">🎨</button>
      <button class="bub-tool danger" data-sca="delete">✕</button>
    </div>`;

  // Render content by type (reuse main renderers)
  if(b.type==='text'){
    const c=document.createElement('div');
    c.className='bubble-content sc-bc'; c.contentEditable='true';
    c.dataset.placeholder='Type…'; c.innerHTML=b.content||'';
    c.addEventListener('input',()=>{b.content=c.innerHTML;save();});
    c.addEventListener('mousedown',e=>e.stopPropagation());
    c.addEventListener('keydown',e=>e.stopPropagation());
    c.addEventListener('blur',()=>{linkifyContent(c);b.content=c.innerHTML;save();});
    c.addEventListener('click',e=>{const lnk=e.target.closest('a[data-href]');if(lnk){e.preventDefault();e.stopPropagation();window.open(lnk.dataset.href,'_blank','noopener');}});
    el.appendChild(c);
  } else if(b.type==='code'){
    const w=document.createElement('div'); w.className='code-bubble-wrap';
    renderCodeBubble(w, b); el.appendChild(w);
  } else if(b.type==='subcanvas'){
    renderSubcanvasBubble(b, el);
  } else if(b.type==='todo'){
    const w=document.createElement('div');w.className='todo-wrap';
    renderTodos(w,b);el.appendChild(w);
  } else if(b.type==='image'){
    const w=document.createElement('div');
    if(b.imgSrc){const img=document.createElement('img');img.src=b.imgSrc;img.className='bubble-img';img.draggable=false;w.appendChild(img);}
    else{const lbl=document.createElement('label');lbl.className='img-upload-lbl';lbl.innerHTML='🖼 Click to add image';
      const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.style.display='none';
      inp.addEventListener('change',()=>{const f=inp.files[0];if(!f)return;const rdr=new FileReader();rdr.onload=ev=>{b.imgSrc=ev.target.result;save();const ex=SCC.querySelector(`[data-scid="${b.id}"]`);if(ex)ex.remove();SCC.appendChild(scRenderBubble(b));scRenderConns();};rdr.readAsDataURL(f);});
      lbl.appendChild(inp);w.appendChild(lbl);}
    w.addEventListener('mousedown',e=>e.stopPropagation());el.appendChild(w);
  }

  el.addEventListener('mousedown', scBubbleMD);
  el.addEventListener('contextmenu', scBubbleRC);
  el.addEventListener('click', e=>{
    if(e.target.closest('.connect-dot,.bubble-toolbar'))return;
    e.stopPropagation();
    if(scHandleConnectClick(b.id, el)) return;
    scSelectBubble(b.id);
  });
  el.querySelectorAll('.connect-dot').forEach(d=>d.addEventListener('mousedown',e=>{e.stopPropagation();scStartConn(b.id,d.dataset.side);}));
  el.querySelector('[data-sca="delete"]').addEventListener('click',e=>{e.stopPropagation();scDeleteBubble(b.id);});
  el.querySelector('[data-sca="connect"]').addEventListener('click',e=>{
    e.stopPropagation(); scSetConnMode(true); scHandleConnectClick(b.id,el);
  });
  el.querySelector('[data-sca="color"]').addEventListener('click',e=>{
    e.stopPropagation();
    const cols=['yellow','orange','red','green','blue',''];
    b.color=cols[(cols.indexOf(b.color)+1)%cols.length];
    el.className='bubble type-'+b.type+(b.color?` color-${b.color}`:'');save();
  });

  SCC.appendChild(el); return el;
}

function scSelectBubble(id){
  SCC.querySelectorAll('[data-scid]').forEach(el=>el.classList.remove('selected'));
  scSelectedId=id; if(id){const el=SCC.querySelector(`[data-scid="${id}"]`);if(el)el.classList.add('selected');}
}

function scDeleteBubble(id){
  const sc=scActiveBubble?.subCanvas;if(!sc)return;
  sc.bubbles=sc.bubbles.filter(b=>b.id!==id);
  sc.connections=sc.connections.filter(c=>c.from!==id&&c.to!==id);
  SCC.querySelector(`[data-scid="${id}"]`)?.remove();
  save(); scRenderConns();
  document.getElementById('sc-empty').style.display = sc.bubbles.length===0?'block':'none';
}

function scBubbleMD(e){
  if(e.button!==0)return;
  if(e.target.closest('.connect-dot,.bubble-toolbar,.bubble-content,input,label,button,select'))return;
  e.stopPropagation();
  const el=e.currentTarget, bId=parseInt(el.dataset.scid);
  scSelectBubble(bId);
  const r=SCCW.getBoundingClientRect();
  const cx=(e.clientX-r.left-scTx.x)/scTx.scale, cy=(e.clientY-r.top-scTx.y)/scTx.scale;
  scDragOX=cx-parseFloat(el.style.left); scDragOY=cy-parseFloat(el.style.top);
  scDragging={el,bId};
  const sc=scActiveBubble?.subCanvas; const b=sc?.bubbles.find(x=>x.id===bId);
  function mv(me){
    if(!scDragging)return;
    const nx=(me.clientX-r.left-scTx.x)/scTx.scale-scDragOX;
    const ny=(me.clientY-r.top-scTx.y)/scTx.scale-scDragOY;
    el.style.left=nx+'px'; el.style.top=ny+'px';
    if(b){b.x=nx;b.y=ny;} scRenderConns();
  }
  function up(){scDragging=null;save();document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
  document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
}

// SC pan
SCCW.addEventListener('mousedown',e=>{
  if(e.button===2)return;
  if(e.target.closest('.bubble'))return;
  e.preventDefault();
  scPanning=true; scPanSX=e.clientX; scPanSY=e.clientY; scPanSTX=scTx.x; scPanSTY=scTx.y;
  SCCW.classList.add('grabbing');
});
document.addEventListener('mousemove',e=>{
  if(scPanning){ scTx.x=scPanSTX+(e.clientX-scPanSX); scTx.y=scPanSTY+(e.clientY-scPanSY); scApplyTx(); }
  if(scConnectingFrom&&!scConnectMode){
    const r=SCCW.getBoundingClientRect();
    const cx=(e.clientX-r.left-scTx.x)/scTx.scale, cy=(e.clientY-r.top-scTx.y)/scTx.scale;
    SCTL.setAttribute('x2',cx); SCTL.setAttribute('y2',cy);
    SCC.querySelectorAll('[data-scid]').forEach(bel=>{
      bel.classList.remove('connecting-target-hover');
      if(parseInt(bel.dataset.scid)===scConnectingFrom.id)return;
      const bx=parseFloat(bel.style.left),by=parseFloat(bel.style.top),bw=bel.offsetWidth,bh=bel.offsetHeight;
      if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh) bel.classList.add('connecting-target-hover');
    });
  }
  if(scConnectMode&&scConnectSource){
    const r=SCCW.getBoundingClientRect();
    const cx=(e.clientX-r.left-scTx.x)/scTx.scale, cy=(e.clientY-r.top-scTx.y)/scTx.scale;
    SCTL.setAttribute('x2',cx); SCTL.setAttribute('y2',cy);
  }
});
document.addEventListener('mouseup',e=>{
  if(scPanning){scPanning=false;SCCW.classList.remove('grabbing');}
  if(scConnectingFrom&&!scConnectMode){
    const r=SCCW.getBoundingClientRect();
    const cx=(e.clientX-r.left-scTx.x)/scTx.scale,cy=(e.clientY-r.top-scTx.y)/scTx.scale;
    let tid=null,ts='left';
    SCC.querySelectorAll('[data-scid]').forEach(bel=>{
      const bid=parseInt(bel.dataset.scid);if(bid===scConnectingFrom.id)return;
      const bx=parseFloat(bel.style.left),by=parseFloat(bel.style.top),bw=bel.offsetWidth,bh=bel.offsetHeight;
      if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh){
        tid=bid;
        const sides=[{s:'top',d:Math.abs(cy-by)},{s:'bottom',d:Math.abs(cy-(by+bh))},{s:'left',d:Math.abs(cx-bx)},{s:'right',d:Math.abs(cx-(bx+bw))}];
        ts=sides.sort((a,b)=>a.d-b.d)[0].s;
      }
    });
    scStopConn(tid,ts);
  }
});

SCCW.addEventListener('wheel',e=>{
  const innerEl = e.target.closest('.bubble-inner');
  if(innerEl){
    const canScrollY = innerEl.scrollHeight > innerEl.clientHeight;
    const canScrollX = innerEl.scrollWidth > innerEl.clientWidth;
    if(canScrollY || canScrollX){
      const atTop = innerEl.scrollTop <= 0;
      const atBottom = innerEl.scrollTop + innerEl.clientHeight >= innerEl.scrollHeight - 1;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;
      if((scrollingDown && !atBottom) || (scrollingUp && !atTop) || canScrollX){
        return;
      }
    }
  }
  e.preventDefault();
  const zf=e.deltaY<0?1.08:0.93, r=SCCW.getBoundingClientRect();
  const mx=e.clientX-r.left, my=e.clientY-r.top;
  const ns=Math.min(3,Math.max(0.2,scTx.scale*zf));
  scTx.x=mx-(mx-scTx.x)*(ns/scTx.scale); scTx.y=my-(my-scTx.y)*(ns/scTx.scale); scTx.scale=ns; scApplyTx();
},{passive:false});

SCCW.addEventListener('dblclick',e=>{
  if(e.target.closest('.bubble'))return;
  const pos=sc2c(e.clientX,e.clientY); scAddBubble('text',pos.x,pos.y);
});

// SC right-click menu
let scCtxPos={x:0,y:0}, scCtxTarget=null;
const SCCM=document.getElementById('sc-ctx-menu');

function showScCtx(x,y,isBub){
  SCCM.style.left=x+'px'; SCCM.style.top=y+'px'; SCCM.style.display='block';
  document.getElementById('sc-ctx-bub-sec').style.display=isBub?'block':'none';
  document.getElementById('sc-ctx-bub-sep').style.display=isBub?'block':'none';
  const mw=SCCM.offsetWidth,mh=SCCM.offsetHeight;
  if(x+mw>window.innerWidth) SCCM.style.left=(x-mw)+'px';
  if(y+mh>window.innerHeight) SCCM.style.top=(y-mh)+'px';
}
function hideScCtx(){ SCCM.style.display='none'; }
document.addEventListener('click',e=>{if(!SCCM.contains(e.target))hideScCtx();});

SCCW.addEventListener('contextmenu',e=>{
  e.preventDefault(); e.stopPropagation();
  scCtxTarget = e.target.closest('[data-scid]') || null;
  scCtxPos = sc2c(e.clientX,e.clientY);
  showScCtx(e.clientX,e.clientY,!!scCtxTarget);
});

function scBubbleRC(e){
  e.preventDefault(); e.stopPropagation();
  scCtxTarget=e.currentTarget; scCtxPos=sc2c(e.clientX,e.clientY);
  showScCtx(e.clientX,e.clientY,true);
}

SCCM.querySelectorAll('.ctx-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const a=item.dataset.sca;
    if(a==='add-text')    scAddBubble('text',    scCtxPos.x,scCtxPos.y);
    if(a==='add-code')    scAddBubble('code',    scCtxPos.x,scCtxPos.y);
    if(a==='add-subcanvas') scAddBubble('subcanvas',scCtxPos.x,scCtxPos.y);
    if(a==='add-todo')    scAddBubble('todo',    scCtxPos.x,scCtxPos.y);
    if(a==='add-image')   scAddBubble('image',   scCtxPos.x,scCtxPos.y);
    if(a==='connect'&&scCtxTarget){ scSetConnMode(true); scHandleConnectClick(parseInt(scCtxTarget.dataset.scid),scCtxTarget); }
    if(a==='delete-bubble'&&scCtxTarget) scDeleteBubble(parseInt(scCtxTarget.dataset.scid));
    hideScCtx();
  });
});
SCCM.querySelectorAll('.cswatch').forEach(sw=>{
  sw.addEventListener('click',()=>{
    if(!scCtxTarget)return;
    const bid=parseInt(scCtxTarget.dataset.scid);
    const sc=scActiveBubble?.subCanvas; const b=sc?.bubbles.find(x=>x.id===bid);
    if(b){b.color=sw.dataset.sc;scCtxTarget.className='bubble type-'+b.type+(b.color?` color-${b.color}`:'');save();}
    hideScCtx();
  });
});

// SC key handling within modal
SCM.addEventListener('keydown',e=>{
  if(e.code==='Escape'){ scSetConnMode(false); e.stopPropagation(); }
});

// SC connections with midpoint handles
function scBubbleSidePoint(id,side){
  const el=SCC.querySelector(`[data-scid="${id}"]`); if(!el)return null;
  const x=parseFloat(el.style.left),y=parseFloat(el.style.top),w=el.offsetWidth,h=el.offsetHeight;
  if(side==='top')return{x:x+w/2,y};if(side==='bottom')return{x:x+w/2,y:y+h};
  if(side==='left')return{x,y:y+h/2};if(side==='right')return{x:x+w,y:y+h/2};
  return{x:x+w/2,y:y+h/2};
}

function scRenderConns(){
  const sc=scActiveBubble?.subCanvas;
  SCSVG.querySelectorAll('.sc-conn-path,.sc-conn-path-vis').forEach(e=>e.remove());
  SCCW.querySelectorAll('.sc-mid-handle').forEach(e=>e.remove());
  if(!sc)return;
  sc.connections.forEach(c=>{
    const p1=scBubbleSidePoint(c.from,c.fromSide),p2=scBubbleSidePoint(c.to,c.toSide);if(!p1||!p2)return;
    const d=bzp(p1,p2,c.fromSide,c.toSide,c.mx,c.my);

    const hitPath=document.createElementNS('http://www.w3.org/2000/svg','path');
    hitPath.classList.add('sc-conn-path');
    hitPath.setAttribute('d',d);
    hitPath.setAttribute('fill','none');
    hitPath.setAttribute('stroke','transparent');
    hitPath.setAttribute('stroke-width','18');
    hitPath.style.pointerEvents='stroke';
    hitPath.style.cursor='grab';

    const visPath=document.createElementNS('http://www.w3.org/2000/svg','path');
    visPath.classList.add('sc-conn-path-vis');
    visPath.setAttribute('d',d);
    visPath.setAttribute('fill','none');
    visPath.setAttribute('stroke','#4a3a45');
    visPath.setAttribute('stroke-width','2');
    visPath.setAttribute('marker-end','url(#sc-arrow)');
    visPath.style.pointerEvents='none';
    visPath.style.transition='stroke 0.15s';

    hitPath.addEventListener('mouseenter',()=>{ visPath.setAttribute('stroke','rgba(217,165,160,0.6)'); });
    hitPath.addEventListener('mouseleave',()=>{ if(!hitPath._dragging) visPath.setAttribute('stroke','#4a3a45'); });

    hitPath.addEventListener('contextmenu',async e=>{
      e.preventDefault(); e.stopPropagation();
      if(await appConfirm('Remove connection?',{title:'Remove connection',okText:'Remove'})){sc.connections=sc.connections.filter(x=>x.id!==c.id);save();scRenderConns();}
    });

    hitPath.addEventListener('mousedown',e=>{
      if(e.button!==0)return;
      e.stopPropagation(); e.preventDefault();
      hitPath._dragging=true;
      hitPath.style.cursor='grabbing';
      visPath.setAttribute('stroke','rgba(217,165,160,0.8)');
      const startX=e.clientX, startY=e.clientY;
      const startMX=c.mx||0, startMY=c.my||0;
      function mv(me){
        c.mx=startMX+(me.clientX-startX)/scTx.scale;
        c.my=startMY+(me.clientY-startY)/scTx.scale;
        const nd=bzp(p1,p2,c.fromSide,c.toSide,c.mx,c.my);
        hitPath.setAttribute('d',nd); visPath.setAttribute('d',nd);
      }
      function up(){
        hitPath._dragging=false; hitPath.style.cursor='grab';
        visPath.setAttribute('stroke','#4a3a45');
        save(); scRenderConns();
        document.removeEventListener('mousemove',mv);
        document.removeEventListener('mouseup',up);
      }
      document.addEventListener('mousemove',mv);
      document.addEventListener('mouseup',up);
    });

    SCSVG.insertBefore(hitPath,SCTL);
    SCSVG.insertBefore(visPath,SCTL);
  });
}

function scStartConn(id,side){
  if(scConnectMode) return;
  scConnectingFrom={id,side};
  const bel=SCC.querySelector(`[data-scid="${id}"]`); if(bel)bel.classList.add('connecting-source');
  SCTL.style.opacity='1';
  const p=scBubbleSidePoint(id,side); if(p){SCTL.setAttribute('x1',p.x);SCTL.setAttribute('y1',p.y);}
}
function scStopConn(tid,ts){
  if(scConnectingFrom&&tid&&tid!==scConnectingFrom.id){
    const sc=scActiveBubble?.subCanvas;
    if(sc&&!sc.connections.find(c=>c.from===scConnectingFrom.id&&c.to===tid)){
      sc.connections.push({id:scConnId++,from:scConnectingFrom.id,fromSide:scConnectingFrom.side,to:tid,toSide:ts,mx:0,my:0});
      save(); scRenderConns();
    }
  }
  SCC.querySelectorAll('[data-scid]').forEach(el=>el.classList.remove('connecting-source','connecting-target-hover'));
  SCTL.style.opacity='0'; scConnectingFrom=null;
}

function scPlaceCursorEnd(el){ const r=document.createRange();r.selectNodeContents(el);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r); }


// ═══════ TODOS ═══════
function renderTodos(wrap,b){
  wrap.innerHTML='';
  b.todos=b.todos||[];
  const done=b.todos.filter(t=>t.done).length,tot=b.todos.length,pct=tot?Math.round(done/tot*100):0;
  const hdr=document.createElement('div');hdr.className='todo-hdr';
  hdr.innerHTML=`<span>TASKS</span><span class="todo-hdr-count">${done}/${tot}</span>`;
  wrap.appendChild(hdr);
  const bar=document.createElement('div');bar.className='todo-progress-bar';
  const fill=document.createElement('div');fill.className='todo-progress-fill';fill.style.width=pct+'%';
  bar.appendChild(fill);wrap.appendChild(bar);

  const priCols=['p0','p1','p2','p3'];
  const priLabels=['·','!!!','!!','!'];

  b.todos.forEach((todo,i)=>{
    const row=document.createElement('div');row.className='todo-item'+(todo.done?' done':'');
    const cbw=document.createElement('div');cbw.className='todo-cb-wrap';
    const cb=document.createElement('input');cb.type='checkbox';cb.className='todo-cb';cb.checked=todo.done;
    const cbc=document.createElement('div');cbc.className='todo-cb-custom';
    cb.addEventListener('change',()=>{todo.done=cb.checked;save();renderTodos(wrap,b);});
    cb.addEventListener('mousedown',e=>e.stopPropagation());
    cbw.appendChild(cb);cbw.appendChild(cbc);
    const txt=document.createElement('input');txt.className='todo-txt';txt.value=todo.text;txt.placeholder='Task…';
    txt.addEventListener('input',()=>{todo.text=txt.value;save();});
    txt.addEventListener('mousedown',e=>e.stopPropagation());
    txt.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Enter'){b.todos.splice(i+1,0,{id:'t'+Date.now(),text:'',done:false,pri:0});save();renderTodos(wrap,b);setTimeout(()=>{const ins=wrap.querySelectorAll('.todo-txt');if(ins[i+1])ins[i+1].focus();},30);}
      if(e.key==='Backspace'&&txt.value===''&&b.todos.length>1){b.todos.splice(i,1);save();renderTodos(wrap,b);setTimeout(()=>{const ins=wrap.querySelectorAll('.todo-txt');ins[Math.max(0,i-1)]?.focus();},30);e.preventDefault();}
    });
    const pri=document.createElement('div');pri.className='todo-pri '+(priCols[todo.pri||0]);pri.textContent=priLabels[todo.pri||0];pri.title='Click to change priority';
    pri.addEventListener('click',e=>{e.stopPropagation();todo.pri=((todo.pri||0)+1)%4;save();renderTodos(wrap,b);});
    pri.addEventListener('mousedown',e=>e.stopPropagation());
    const del=document.createElement('button');del.className='todo-del';del.textContent='✕';
    del.addEventListener('mousedown',e=>e.stopPropagation());
    del.addEventListener('click',e=>{e.stopPropagation();if(b.todos.length>1){b.todos.splice(i,1);save();renderTodos(wrap,b);}});
    row.appendChild(cbw);row.appendChild(txt);row.appendChild(pri);row.appendChild(del);wrap.appendChild(row);
  });
  const ar=document.createElement('div');ar.className='todo-add-row';
  const ai=document.createElement('input');ai.className='todo-add-inp';ai.placeholder='New task…';
  ai.addEventListener('mousedown',e=>e.stopPropagation());
  ai.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&ai.value.trim()){b.todos.push({id:'t'+Date.now(),text:ai.value.trim(),done:false,pri:0});ai.value='';save();renderTodos(wrap,b);setTimeout(()=>{ar.querySelector('.todo-add-inp')?.focus();},30);}});
  const ab=document.createElement('button');ab.className='todo-add-sub';ab.textContent='Add';
  ab.addEventListener('mousedown',e=>e.stopPropagation());
  ab.addEventListener('click',e=>{e.stopPropagation();if(ai.value.trim()){b.todos.push({id:'t'+Date.now(),text:ai.value.trim(),done:false,pri:0});ai.value='';save();renderTodos(wrap,b);}});
  ar.appendChild(ai);ar.appendChild(ab);wrap.appendChild(ar);
}

// ═══════ FORMAT BAR ═══════
function showFmtBar(el){
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed||!sel.toString().trim()){FB.classList.remove('show');return;}
  const range=sel.getRangeAt(0),rect=range.getBoundingClientRect();
  FB.style.left=Math.max(8,rect.left+rect.width/2-(FB.offsetWidth||180)/2)+'px';
  FB.style.top=(rect.top-48)+'px';
  FB.classList.add('show');
  ['bold','italic','underline','strikeThrough','subscript','superscript','insertUnorderedList','insertOrderedList'].forEach(cmd=>{
    const btn=FB.querySelector(`[data-cmd="${cmd}"]`);
    if(btn) btn.classList.toggle('on',document.queryCommandState(cmd));
  });
}

FB.querySelectorAll('.fmt-btn[data-cmd]').forEach(btn=>{
  btn.addEventListener('mousedown',e=>{
    e.preventDefault();document.execCommand(btn.dataset.cmd,false,null);
    saveFocusedContent();
    ['bold','italic','underline','strikeThrough','subscript','superscript','insertUnorderedList','insertOrderedList'].forEach(cmd=>{
      const b2=FB.querySelector(`[data-cmd="${cmd}"]`);if(b2)b2.classList.toggle('on',document.queryCommandState(cmd));
    });
  });
});

FB.querySelectorAll('.fmt-btn[data-align]').forEach(btn=>{
  btn.addEventListener('mousedown',e=>{
    e.preventDefault();
    const cmdMap={left:'justifyLeft',center:'justifyCenter',right:'justifyRight',justify:'justifyFull'};
    document.execCommand(cmdMap[btn.dataset.align],false,null);
    saveFocusedContent();
    FB.querySelectorAll('.fmt-btn[data-align]').forEach(b2=>b2.classList.remove('on'));
    btn.classList.add('on');
  });
});

document.getElementById('fmt-clear').addEventListener('mousedown',e=>{
  e.preventDefault();
  document.execCommand('removeFormat',false,null);
  document.execCommand('foreColor',false,'inherit');
  saveFocusedContent();
});

document.getElementById('fmt-size').addEventListener('change',function(){
  const v=this.value;
  if(v==='h1') document.execCommand('fontSize',false,'7');
  else if(v==='h2') document.execCommand('fontSize',false,'5');
  else if(v==='h3') document.execCommand('fontSize',false,'4');
  else if(v==='sm') document.execCommand('fontSize',false,'2');
  else document.execCommand('removeFormat',false,null);
  this.value='';saveFocusedContent();
});
document.getElementById('fmt-font').addEventListener('change',function(){
  document.execCommand('fontName',false,this.value);saveFocusedContent();
});
FB.querySelectorAll('.fmt-color').forEach(c=>{
  c.addEventListener('mousedown',e=>{e.preventDefault();document.execCommand('foreColor',false,c.dataset.col);saveFocusedContent();});
});
FB.querySelectorAll('.fmt-hl').forEach(c=>{
  c.addEventListener('mousedown',e=>{
    e.preventDefault();
    document.execCommand('hiliteColor',false,c.dataset.col);
    saveFocusedContent();
  });
});

function saveFocusedContent(){
  const fc=document.activeElement?.closest('.bubble-content');
  if(fc){const bId=parseInt(fc.closest('.bubble')?.dataset.id);const p=pg();const b=p?.bubbles.find(x=>x.id===bId);if(b){b.content=fc.innerHTML;save();}}
}

document.addEventListener('click',e=>{if(!FB.contains(e.target)&&!e.target.closest('.bubble-content'))FB.classList.remove('show');});
document.addEventListener('selectionchange',()=>{const s=window.getSelection();if(!s||s.isCollapsed)FB.classList.remove('show');});

// ═══════ DELETE SYSTEM ═══════
function connectedIds(id){
  const p=pg();if(!p)return[];
  const s=new Set();
  p.connections.forEach(c=>{if(c.from===id)s.add(c.to);if(c.to===id)s.add(c.from);});
  return[...s];
}
function initiateDelete(id){
  if(connectedIds(id).length>0){delTarget=id;document.getElementById('del-modal').classList.add('show');}
  else deleteBubble(id);
}
document.getElementById('del-cancel').addEventListener('click',()=>{document.getElementById('del-modal').classList.remove('show');delTarget=null;});
document.getElementById('del-bubble-only').addEventListener('click',()=>{if(delTarget)deleteBubble(delTarget);document.getElementById('del-modal').classList.remove('show');delTarget=null;});
document.getElementById('del-system').addEventListener('click',()=>{if(delTarget){connectedIds(delTarget).forEach(id=>deleteBubble(id));deleteBubble(delTarget);}document.getElementById('del-modal').classList.remove('show');delTarget=null;});

function deleteBubble(id){
  const p=pg();if(!p)return;
  p.bubbles=p.bubbles.filter(b=>b.id!==id);
  p.connections=p.connections.filter(c=>c.from!==id&&c.to!==id);
  const el=CV.querySelector(`[data-id="${id}"]`);if(el)el.remove();
  if(selectedId===id)selectedId=null;
  save();renderConns();updateEmpty();
}
function cycleColor(b,el){
  const cols=['yellow','orange','red','green','blue',''];
  b.color=cols[(cols.indexOf(b.color)+1)%cols.length];
  el.className=`bubble type-${b.type}`+(b.color?` color-${b.color}`:'');save();
}
function selectBubble(id){
  CV.querySelectorAll('.bubble').forEach(el=>el.classList.remove('selected'));
  selectedId=id;if(id){const el=CV.querySelector(`[data-id="${id}"]`);if(el)el.classList.add('selected');}
}

// ═══════ CONNECTIONS ═══════
function bsp(id,side){
  const el=CV.querySelector(`[data-id="${id}"]`);if(!el)return null;
  const x=parseFloat(el.style.left),y=parseFloat(el.style.top),w=el.offsetWidth,h=el.offsetHeight;
  if(side==='top')return{x:x+w/2,y};if(side==='bottom')return{x:x+w/2,y:y+h};
  if(side==='left')return{x,y:y+h/2};if(side==='right')return{x:x+w,y:y+h/2};
  return{x:x+w/2,y:y+h/2};
}

// Build bezier path, optionally passing through a midpoint offset (mx,my relative to midpoint of p1-p2)
function bzp(p1,p2,s1,s2,mx,my){
  const midX=(p1.x+p2.x)/2, midY=(p1.y+p2.y)/2;
  const dx=Math.abs(p2.x-p1.x)*0.5+40, dy=Math.abs(p2.y-p1.y)*0.5+40;
  let c1x=p1.x,c1y=p1.y,c2x=p2.x,c2y=p2.y;
  if(s1==='right')c1x+=dx;else if(s1==='left')c1x-=dx;else if(s1==='bottom')c1y+=dy;else if(s1==='top')c1y-=dy;else c1x+=dx;
  if(s2==='left')c2x-=dx;else if(s2==='right')c2x+=dx;else if(s2==='top')c2y-=dy;else if(s2==='bottom')c2y+=dy;else c2x-=dx;
  // If midpoint offset provided, bend the curve through it using a cubic that passes near that point
  if(mx!==undefined&&my!==undefined){
    const pm={x:midX+(mx||0),y:midY+(my||0)};
    // Adjust control points to pull curve through pm (De Casteljau approximation)
    c1x=(pm.x*2-p1.x*0.5-p2.x*0.5+c1x)*0.5; c1y=(pm.y*2-p1.y*0.5-p2.y*0.5+c1y)*0.5;
    c2x=(pm.x*2-p1.x*0.5-p2.x*0.5+c2x)*0.5; c2y=(pm.y*2-p1.y*0.5-p2.y*0.5+c2y)*0.5;
  }
  return`M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

// Midpoint handle layer — rendered as absolutely positioned divs over canvas-wrap
function renderConns(){
  const p=pg();
  SV.querySelectorAll('.conn-path,.conn-path-vis').forEach(e=>e.remove());
  CW.querySelectorAll('.conn-mid-handle').forEach(e=>e.remove());
  if(!p)return;
  p.connections.forEach(c=>{
    const p1=bsp(c.from,c.fromSide),p2=bsp(c.to,c.toSide);if(!p1||!p2)return;
    const d=bzp(p1,p2,c.fromSide,c.toSide,c.mx,c.my);

    // Wide invisible drag-target path (pointer-events:stroke on wide stroke)
    const hitPath=document.createElementNS('http://www.w3.org/2000/svg','path');
    hitPath.classList.add('conn-path');
    hitPath.setAttribute('d',d);
    hitPath.setAttribute('fill','none');
    hitPath.setAttribute('stroke','transparent');
    hitPath.setAttribute('stroke-width','18');
    hitPath.style.pointerEvents='stroke';
    hitPath.style.cursor='grab';

    // Thin visible path on top (no pointer events)
    const visPath=document.createElementNS('http://www.w3.org/2000/svg','path');
    visPath.classList.add('conn-path-vis');
    visPath.setAttribute('d',d);
    visPath.setAttribute('fill','none');
    visPath.setAttribute('stroke','#4a3a45');
    visPath.setAttribute('stroke-width','2');
    visPath.setAttribute('marker-end','url(#arrowhead)');
    visPath.style.pointerEvents='none';
    visPath.style.transition='stroke 0.15s';

    // Hover: highlight the visible path
    hitPath.addEventListener('mouseenter',()=>{ visPath.setAttribute('stroke','rgba(217,165,160,0.6)'); hitPath.style.cursor='grab'; });
    hitPath.addEventListener('mouseleave',()=>{ if(!hitPath._dragging) visPath.setAttribute('stroke','#4a3a45'); });

    // Right-click to delete
    hitPath.addEventListener('contextmenu',async e=>{
      e.preventDefault(); e.stopPropagation();
      if(await appConfirm('Remove this connection?',{title:'Remove connection',okText:'Remove'})){p.connections=p.connections.filter(x=>x.id!==c.id);save();renderConns();}
    });

    // Drag the line directly
    hitPath.addEventListener('mousedown',e=>{
      if(e.button!==0)return;
      e.stopPropagation(); e.preventDefault();
      hitPath._dragging=true;
      hitPath.style.cursor='grabbing';
      visPath.setAttribute('stroke','rgba(217,165,160,0.8)');
      const startX=e.clientX, startY=e.clientY;
      const startMX=c.mx||0, startMY=c.my||0;
      function mv(me){
        const dx=(me.clientX-startX)/tx.scale;
        const dy=(me.clientY-startY)/tx.scale;
        c.mx=startMX+dx; c.my=startMY+dy;
        const nd=bzp(p1,p2,c.fromSide,c.toSide,c.mx,c.my);
        hitPath.setAttribute('d',nd);
        visPath.setAttribute('d',nd);
      }
      function up(){
        hitPath._dragging=false;
        hitPath.style.cursor='grab';
        visPath.setAttribute('stroke','#4a3a45');
        save(); renderConns();
        document.removeEventListener('mousemove',mv);
        document.removeEventListener('mouseup',up);
      }
      document.addEventListener('mousemove',mv);
      document.addEventListener('mouseup',up);
    });

    SV.insertBefore(hitPath,TL);
    SV.insertBefore(visPath,TL);
  });
}

function addConn(fi,fs,ti,ts){
  const p=pg();if(!p)return;
  if(p.connections.find(c=>c.from===fi&&c.to===ti))return;
  p.connections.push({id:connId++,from:fi,fromSide:fs||'right',to:ti,toSide:ts||'left',mx:0,my:0});
  save();renderConns();
}

// ─── CONNECT MODE STATE ───
// connectMode = false|'idle'|'source-selected'
// connectSource = {bubbleId, side}
let connectSource = null;

function setConnectMode(on){
  connectMode=on;
  const btn=document.getElementById('connect-toggle');
  const banner=document.getElementById('connect-banner');
  if(on){
    btn.classList.add('active');
    banner.classList.add('show');
    banner.textContent='🔗 Click a source bubble first · ESC to exit';
    connectSource=null;
    // highlight all bubbles as clickable targets
    CV.querySelectorAll('.bubble').forEach(el=>el.classList.add('connect-pickable'));
  } else {
    btn.classList.remove('active');
    banner.classList.remove('show');
    connectSource=null;
    connectingFrom=null;
    TL.style.opacity='0';
    CV.querySelectorAll('.bubble').forEach(el=>el.classList.remove('connect-pickable','connecting-source','connecting-target-hover'));
  }
}

function handleConnectClick(bId,el){
  if(!connectMode) return false;
  if(!connectSource){
    // Phase 1: pick source
    connectSource={bubbleId:bId};
    connectingFrom={bubbleId:bId,side:'right'};
    CV.querySelectorAll('.bubble').forEach(e=>e.classList.remove('connecting-source'));
    el.classList.add('connecting-source');
    const banner=document.getElementById('connect-banner');
    banner.textContent='🔗 Source: "'+(pg()?.bubbles.find(b=>b.id===bId)?.content?.replace(/<[^>]+>/g,'').substring(0,20)||'bubble')+'" — now click target bubble(s) · ESC to exit';
    // show temp line from center of source bubble
    const p=bsp(bId,'right')||bsp(bId,'bottom');
    if(p){TL.setAttribute('x1',p.x);TL.setAttribute('y1',p.y);TL.setAttribute('x2',p.x);TL.setAttribute('y2',p.y);TL.style.opacity='1';}
  } else {
    // Phase 2: pick target (can keep picking more targets)
    if(bId===connectSource.bubbleId) return true; // can't self-connect
    // auto-pick best sides
    const srcEl=CV.querySelector(`[data-id="${connectSource.bubbleId}"]`);
    const tgtEl=CV.querySelector(`[data-id="${bId}"]`);
    let fs='right',ts='left';
    if(srcEl&&tgtEl){
      const sx=parseFloat(srcEl.style.left)+srcEl.offsetWidth/2;
      const sy=parseFloat(srcEl.style.top)+srcEl.offsetHeight/2;
      const tx2=parseFloat(tgtEl.style.left)+tgtEl.offsetWidth/2;
      const ty2=parseFloat(tgtEl.style.top)+tgtEl.offsetHeight/2;
      const adx=Math.abs(tx2-sx),ady=Math.abs(ty2-sy);
      if(adx>=ady){ fs=tx2>sx?'right':'left'; ts=tx2>sx?'left':'right'; }
      else { fs=ty2>sy?'bottom':'top'; ts=ty2>sy?'top':'bottom'; }
    }
    addConn(connectSource.bubbleId,fs,bId,ts);
    // flash the target
    el.classList.add('connecting-target-hover');
    setTimeout(()=>el.classList.remove('connecting-target-hover'),600);
    const banner=document.getElementById('connect-banner');
    banner.textContent='🔗 Connected! Click more targets or click source again to pick new source · ESC to exit';
  }
  return true;
}

function startConn(bid,side,e){
  if(connectMode) return; // in connect mode, handled by click
  connectingFrom={bubbleId:bid,side};
  const bel=CV.querySelector(`[data-id="${bid}"]`);if(bel)bel.classList.add('connecting-source');
  TL.style.opacity='1';
  const p=bsp(bid,side);if(p){TL.setAttribute('x1',p.x);TL.setAttribute('y1',p.y);}
}
function stopConn(tid,ts){
  if(connectingFrom&&tid&&tid!==connectingFrom.bubbleId) addConn(connectingFrom.bubbleId,connectingFrom.side,tid,ts||'left');
  CV.querySelectorAll('.bubble').forEach(el=>el.classList.remove('connecting-source','connecting-target-hover'));
  TL.style.opacity='0';connectingFrom=null;
}

// ═══════ DRAG BUBBLE ═══════
function onBubbleMD(e){
  if(e.button!==0)return;
  if(e.target.closest('.connect-dot,.bubble-toolbar,.bubble-content,input,label,button,select,[data-resize]'))return;
  e.stopPropagation();
  const el=e.currentTarget,bId=parseInt(el.dataset.id);
  selectBubble(bId);
  const r=CW.getBoundingClientRect();
  const cx=(e.clientX-r.left-tx.x)/tx.scale,cy=(e.clientY-r.top-tx.y)/tx.scale;
  dragOX=cx-parseFloat(el.style.left);dragOY=cy-parseFloat(el.style.top);
  dragging={el,bId};
  const p=pg();const b=p?.bubbles.find(x=>x.id===bId);
  function mv(me){if(!dragging)return;const nx=(me.clientX-r.left-tx.x)/tx.scale-dragOX,ny=(me.clientY-r.top-tx.y)/tx.scale-dragOY;el.style.left=nx+'px';el.style.top=ny+'px';if(b){b.x=nx;b.y=ny;}renderConns();}
  function up(){dragging=null;save();document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
  document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
}

// ═══════ BUBBLE RESIZE ═══════
function onBubbleResize(e){
  e.stopPropagation(); e.preventDefault();
  const handle=e.currentTarget;
  const mode=handle.dataset.resize; // 'r', 'b', or 'both'
  const el=handle.closest('.bubble');
  const bId=parseInt(el.dataset.id);
  const p=pg(); const b=p?.bubbles.find(x=>x.id===bId);
  if(!b) return;
  el.classList.add('resizing');
  const startW=el.offsetWidth, startH=el.offsetHeight;
  const startX=e.clientX, startY=e.clientY;
  const MINW=140, MINH=44;
  function mv(me){
    const dx=(me.clientX-startX)/tx.scale;
    const dy=(me.clientY-startY)/tx.scale;
    if(mode==='r'||mode==='both'){
      const nw=Math.max(MINW,startW+dx);
      el.style.width=nw+'px'; b.w=nw;
    }
    if(mode==='b'||mode==='both'){
      const nh=Math.max(MINH,startH+dy);
      el.style.height=nh+'px'; b.h=nh;
    }
    renderConns();
  }
  function up(){
    el.classList.remove('resizing');
    save();
    document.removeEventListener('mousemove',mv);
    document.removeEventListener('mouseup',up);
  }
  document.addEventListener('mousemove',mv);
  document.addEventListener('mouseup',up);
}

// ═══════ MOUSE PAN & ZOOM ═══════
// Left-click drag on empty canvas = pan. Bubble drag is handled separately in onBubbleMD.
CW.addEventListener('mousedown',e=>{
  if(e.button===2) return; // right click = context menu
  // Only pan when clicking directly on canvas background (not on a bubble)
  const onBubble = e.target.closest('.bubble');
  const startPan = !onBubble && (e.button===1 || e.button===0);
  if(startPan){
    e.preventDefault();
    isPanning=true;panSX=e.clientX;panSY=e.clientY;panSTX=tx.x;panSTY=tx.y;
    CW.classList.add('pan-cur-active');
    // Floating menus don't track canvas position — close them rather than leave them stranded mid-pan
    hideCtx();
    FB.classList.remove('show');
  }
});
document.addEventListener('mousemove',e=>{
  if(isPanning){
    tx.x=panSTX+(e.clientX-panSX);
    tx.y=panSTY+(e.clientY-panSY);
    applyTx();
    // Keep closing them through the drag too, in case either reopened mid-pan
    if(CM.classList.contains('show')) hideCtx();
    if(FB.classList.contains('show')) FB.classList.remove('show');
  }
  if(connectingFrom){
    const r=CW.getBoundingClientRect();
    const cx=(e.clientX-r.left-tx.x)/tx.scale,cy=(e.clientY-r.top-tx.y)/tx.scale;
    TL.setAttribute('x2',cx);TL.setAttribute('y2',cy);
    CV.querySelectorAll('.bubble').forEach(bel=>{
      bel.classList.remove('connecting-target-hover');
      if(parseInt(bel.dataset.id)===connectingFrom.bubbleId)return;
      const bx=parseFloat(bel.style.left),by=parseFloat(bel.style.top),bw=bel.offsetWidth,bh=bel.offsetHeight;
      if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh)bel.classList.add('connecting-target-hover');
    });
  }
});
document.addEventListener('mouseup',e=>{
  if(isPanning){
    isPanning=false;
    CW.classList.remove('pan-cur-active');
  }
  if(connectingFrom){
    const r=CW.getBoundingClientRect();
    const cx=(e.clientX-r.left-tx.x)/tx.scale,cy=(e.clientY-r.top-tx.y)/tx.scale;
    let lid=null,ls='left';
    CV.querySelectorAll('.bubble').forEach(bel=>{
      const bid=parseInt(bel.dataset.id);if(bid===connectingFrom.bubbleId)return;
      const bx=parseFloat(bel.style.left),by=parseFloat(bel.style.top),bw=bel.offsetWidth,bh=bel.offsetHeight;
      if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh){
        lid=bid;
        const sides=[{s:'top',d:Math.abs(cy-by)},{s:'bottom',d:Math.abs(cy-(by+bh))},{s:'left',d:Math.abs(cx-bx)},{s:'right',d:Math.abs(cx-(bx+bw))}];
        ls=sides.sort((a,b)=>a.d-b.d)[0].s;
      }
    });
    stopConn(lid,ls);
  }
});

CW.addEventListener('wheel',e=>{
  // If the cursor is over a bubble's scrollable inner area AND that area actually
  // has overflow to scroll, let the browser scroll the bubble natively instead of
  // zooming the whole canvas.
  const innerEl = e.target.closest('.bubble-inner');
  if(innerEl){
    const canScrollY = innerEl.scrollHeight > innerEl.clientHeight;
    const canScrollX = innerEl.scrollWidth > innerEl.clientWidth;
    if(canScrollY || canScrollX){
      // Only let it scroll if there's still room to scroll in the direction of travel
      const atTop = innerEl.scrollTop <= 0;
      const atBottom = innerEl.scrollTop + innerEl.clientHeight >= innerEl.scrollHeight - 1;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;
      if((scrollingDown && !atBottom) || (scrollingUp && !atTop) || canScrollX){
        return; // let native scroll happen, don't zoom canvas
      }
    }
  }
  e.preventDefault();
  const zf=e.deltaY<0?1.08:0.93,r=CW.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  const ns=Math.min(3,Math.max(0.15,tx.scale*zf));
  tx.x=mx-(mx-tx.x)*(ns/tx.scale);tx.y=my-(my-tx.y)*(ns/tx.scale);tx.scale=ns;applyTx();
},{passive:false});

// keyboard
document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&!e.target.closest('[contenteditable]')&&!e.target.closest('input')){
    e.preventDefault();kbPan=true;CW.classList.add('pan-cur');
  }
  if(e.code==='Escape'){
    setConnectMode(false);
    selectBubble(null);hideCtx();FB.classList.remove('show');
  }
  if((e.key==='Delete'||e.key==='Backspace')&&selectedId&&!e.target.closest('[contenteditable]')&&!e.target.closest('input'))initiateDelete(selectedId);
});
document.addEventListener('keyup',e=>{
  if(e.code==='Space'){kbPan=false;if(!isPanning)CW.classList.remove('pan-cur');}
});

// ═══════ TOUCH ═══════
// Single finger drag = pan freely. Double-tap = place bubble. Pinch = zoom.
let touchStartT=0, touchStartX2=0, touchStartY2=0, touchLastX=0, touchLastY=0;
CW.addEventListener('touchstart',e=>{
  if(e.touches.length===2){
    pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    touchPan=false; return;
  }
  if(e.touches.length===1){
    const t=e.touches[0];
    touchMoved=false;
    touchLastX=t.clientX; touchLastY=t.clientY;
    touchStartX2=t.clientX; touchStartY2=t.clientY;
    const now=Date.now();
    if(now-touchStartT<320 && Math.abs(t.clientX-touchStartX2)<20 && Math.abs(t.clientY-touchStartY2)<20){
      tapCount=2;
    } else {
      tapCount=1;
    }
    touchStartT=now;
    // always start pan tracking
    touchPan=true; panSTX=tx.x; panSTY=tx.y; touchPanSX=t.clientX; touchPanSY=t.clientY;
  }
},{passive:true});

CW.addEventListener('touchmove',e=>{
  if(e.touches.length===2&&pinchDist!==null){
    e.preventDefault();
    const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    const zf=d/pinchDist,r=CW.getBoundingClientRect();
    const mx=(e.touches[0].clientX+e.touches[1].clientX)/2-r.left;
    const my=(e.touches[0].clientY+e.touches[1].clientY)/2-r.top;
    const ns=Math.min(3,Math.max(0.15,tx.scale*zf));
    tx.x=mx-(mx-tx.x)*(ns/tx.scale);tx.y=my-(my-tx.y)*(ns/tx.scale);tx.scale=ns;pinchDist=d;applyTx();
    return;
  }
  if(e.touches.length===1&&touchPan){
    e.preventDefault();
    const t=e.touches[0];
    const dx=t.clientX-touchLastX, dy=t.clientY-touchLastY;
    tx.x+=dx; tx.y+=dy;
    touchLastX=t.clientX; touchLastY=t.clientY;
    applyTx();
    if(Math.abs(t.clientX-touchStartX2)>6||Math.abs(t.clientY-touchStartY2)>6) touchMoved=true;
  }
},{passive:false});

CW.addEventListener('touchend',e=>{
  pinchDist=null;
  if(e.touches.length>0) return;
  if(!touchMoved && tapCount===2 && e.changedTouches.length===1){
    // double-tap = place bubble
    const t=e.changedTouches[0];
    const tgt=document.elementFromPoint(t.clientX,t.clientY);
    if(!tgt?.closest('.bubble')&&pg()){
      const pos=s2c(t.clientX,t.clientY);
      addBubble('text',pos.x,pos.y);
    }
  }
  touchPan=false;
},{passive:true});

// ═══════ CLICK CANVAS = deselect only. Bubbles spawned via right-click or double-click only ═══════
CW.addEventListener('click',e=>{
  if(e.target===CW||e.target===CV) selectBubble(null);
});

// Double-click on empty canvas = spawn text bubble
CW.addEventListener('dblclick',e=>{
  if(e.target!==CW&&e.target!==CV&&!e.target.closest('#connections-svg'))return;
  if(!pg())return;
  const pos=s2c(e.clientX,e.clientY);
  addBubble('text',pos.x,pos.y);
  selectBubble(null);
});

CW.addEventListener('mousedown',e=>{if(e.target===CW||e.target===CV)selectBubble(null);});

// ═══════ CONTEXT MENU ═══════
function onBubbleRC(e){
  e.preventDefault();e.stopPropagation();
  ctxTarget=e.currentTarget;ctxPos=s2c(e.clientX,e.clientY);
  showCtx(e.clientX,e.clientY,true);
}
CW.addEventListener('contextmenu',e=>{e.preventDefault();ctxTarget=null;ctxPos=s2c(e.clientX,e.clientY);showCtx(e.clientX,e.clientY,false);});
function showCtx(x,y,isBub){
  CM.style.left=x+'px';CM.style.top=y+'px';CM.classList.add('show');
  document.getElementById('ctx-bubble-sec').style.display=isBub?'block':'none';
  const mw=CM.offsetWidth,mh=CM.offsetHeight;
  if(x+mw>window.innerWidth)CM.style.left=(x-mw)+'px';
  if(y+mh>window.innerHeight)CM.style.top=(y-mh)+'px';
}
function hideCtx(){CM.classList.remove('show');}
document.addEventListener('click',e=>{if(!CM.contains(e.target))hideCtx();});

CM.querySelectorAll('.ctx-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const a=item.dataset.a;
    CM.classList.remove('sc-ctx');

    if(a==='add-text')       addBubble('text',       ctxPos.x,ctxPos.y);
    if(a==='add-code')       addBubble('code',       ctxPos.x,ctxPos.y);
    if(a==='add-subcanvas')  addBubble('subcanvas',  ctxPos.x,ctxPos.y);
    if(a==='add-todo')       addBubble('todo',       ctxPos.x,ctxPos.y);
    if(a==='add-image')      addBubble('image',      ctxPos.x,ctxPos.y);
    if(a==='connect'&&ctxTarget){
      const bid=parseInt(ctxTarget.dataset.id);
      setConnectMode(true);
      handleConnectClick(bid,ctxTarget);
    }
    if(a==='delete-bubble'&&ctxTarget)initiateDelete(parseInt(ctxTarget.dataset.id));
    hideCtx();
  });
});
CM.querySelectorAll('.cswatch').forEach(sw=>{
  sw.addEventListener('click',()=>{
    if(!ctxTarget)return;
    const bid=parseInt(ctxTarget.dataset.id),p=pg(),b=p?.bubbles.find(x=>x.id===bid);
    if(b){b.color=sw.dataset.c;ctxTarget.className=`bubble type-${b.type}`+(b.color?` color-${b.color}`:'');save();}
    hideCtx();
  });
});

// ═══════ TOOLBAR ═══════
document.getElementById('connect-toggle').addEventListener('click',()=>{
  setConnectMode(!connectMode);
});
document.getElementById('reset-view-btn').addEventListener('click',()=>{
  tx={x:-4700,y:-4700,scale:1};applyTx();
});

// ═══════ PAGE TITLE RENAME (topbar click) ═══════
document.getElementById('page-title-display').addEventListener('click',()=>{
  const p=pg();if(!p)return;
  const disp=document.getElementById('page-title-display');
  const inp=document.createElement('input');inp.className='page-title-input';inp.value=p.name;
  disp.replaceWith(inp);inp.focus();inp.select();
  function done(){
    p.name=inp.value.trim()||'Untitled';save();renderSidebar();
    const nd=document.createElement('span');nd.id='page-title-display';nd.className='page-title-display';nd.textContent=p.name;
    inp.replaceWith(nd);nd.addEventListener('click',arguments.callee);
  }
  inp.addEventListener('blur',done);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur();e.stopPropagation();});
});

// ═══════ SIDEBAR TOGGLE ═══════
document.getElementById('sidebar-close-btn').addEventListener('click',()=>{document.getElementById('sidebar').classList.add('collapsed');document.body.classList.add('sidebar-hidden');});
document.getElementById('sidebar-open-btn').addEventListener('click',()=>{document.getElementById('sidebar').classList.remove('collapsed');document.body.classList.remove('sidebar-hidden');});
document.getElementById('new-page-btn').addEventListener('click',()=>createPage('Untitled'));
document.getElementById('no-page-btn').addEventListener('click',()=>createPage('My first canvas'));

// ═══════ SIDEBAR RIGHT-CLICK MENU (background) ═══════
const SBCM = document.getElementById('sidebar-ctx-menu');
function showSidebarCtx(x,y){
  SBCM.style.left=x+'px';SBCM.style.top=y+'px';SBCM.classList.add('show');
  const mw=SBCM.offsetWidth,mh=SBCM.offsetHeight;
  if(x+mw>window.innerWidth)SBCM.style.left=(x-mw)+'px';
  if(y+mh>window.innerHeight)SBCM.style.top=(y-mh)+'px';
}
function hideSidebarCtx(){SBCM.classList.remove('show');}

document.getElementById('sidebar').addEventListener('contextmenu',e=>{
  // Only show this menu when right-clicking empty sidebar chrome, not a page item (that has its own menu)
  if(e.target.closest('.page-item'))return;
  e.preventDefault();
  showSidebarCtx(e.clientX,e.clientY);
});

SBCM.querySelectorAll('.ctx-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const a=item.dataset.sba;
    if(a==='hide'){document.getElementById('sidebar').classList.add('collapsed');document.body.classList.add('sidebar-hidden');}
    else if(a==='expand-all'){state.pages.forEach(p=>{if(!p.parentId)expandedPages.add(p.id);});renderSidebar();}
    else if(a==='collapse-all'){expandedPages.clear();renderSidebar();}
    else if(a==='reset-width'){document.getElementById('sidebar').style.width='240px';}
    else if(a==='background'){openBgModal();}
    else if(a==='export'){exportData();}
    else if(a==='import'){document.getElementById('import-file').click();}
    hideSidebarCtx();
  });
});

// ═══════ PAGE ITEM RIGHT-CLICK MENU ═══════
const PGCM = document.getElementById('page-ctx-menu');
let pgCtxTarget=null;
function showPageCtxMenu(e,pageId){
  pgCtxTarget=pageId;
  const p=state.pages.find(x=>x.id===pageId);
  document.getElementById('page-ctx-promote').style.display = (p&&p.parentId)?'flex':'none';
  PGCM.style.left=e.clientX+'px';PGCM.style.top=e.clientY+'px';PGCM.classList.add('show');
  const mw=PGCM.offsetWidth,mh=PGCM.offsetHeight;
  if(e.clientX+mw>window.innerWidth)PGCM.style.left=(e.clientX-mw)+'px';
  if(e.clientY+mh>window.innerHeight)PGCM.style.top=(e.clientY-mh)+'px';
}
function hidePageCtxMenu(){PGCM.classList.remove('show');pgCtxTarget=null;}

PGCM.querySelectorAll('.ctx-item').forEach(item=>{
  item.addEventListener('click',async()=>{
    const a=item.dataset.pa;
    const p=state.pages.find(x=>x.id===pgCtxTarget);
    if(!p){hidePageCtxMenu();return;}
    if(a==='open') openPage(p.id);
    else if(a==='rename'){
      const el=document.querySelector(`.page-item[data-page-id="${p.id}"]`);
      if(el) startRename(p.id, el.querySelector('.page-name'));
    }
    else if(a==='addsub') createSubPage(p.id);
    else if(a==='promote'){ p.parentId=null; save(); renderSidebar(); }
    else if(a==='del'){
      const children=state.pages.filter(x=>x.parentId===p.id);
      const msg=children.length?`Delete "${p.name}" and its ${children.length} sub-page${children.length!==1?'s':''}? They go to History.`:'Delete "'+p.name+'"? It goes to History.';
      if(await appConfirm(msg,{title:'Delete canvas',okText:'Delete'})) deletePage(p.id);
    }
    hidePageCtxMenu();
  });
});

document.addEventListener('click',e=>{
  if(!SBCM.contains(e.target)) hideSidebarCtx();
  if(!PGCM.contains(e.target)) hidePageCtxMenu();
});

// ═══════ RENDER ═══════
function renderCanvas(){
  Array.from(CV.children).forEach(el=>{if(el!==SV)el.remove();});
  SV.querySelectorAll('.conn-path,.conn-path-vis').forEach(e=>e.remove());
  TL.style.opacity='0';
  const p=pg();
  document.getElementById('no-page').style.display=p?'none':'flex';
  if(!p){setTitleDisplay('');return;}
  p.bubbles.forEach(b=>renderBubble(b));renderConns();updateEmpty();updateDateBadge();updateCanvasBg();
}

// ═══════ CANVAS BACKGROUND ═══════
// Lofi preset definitions — calm, low-contrast gradients, no external images
const BG_PRESETS = {
  hills: { label:'Moonlit hills', img:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgODAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBzbGljZSI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InNreSIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWIxMzE4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iNjAlIiBzdG9wLWNvbG9yPSIjMjAxNjIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE1MTExMyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0ibW9vbmdsb3ciIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjUwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlOGQ0YzgiIHN0b3Atb3BhY2l0eT0iMC4zNSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlOGQ0YzgiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iaGlsbEZhciIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMmEyMDI2Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzI0MWMyMiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iaGlsbE5lYXIiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFlMTYxYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxOTEyMTciLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiBmaWxsPSJ1cmwoI3NreSkiLz4KICA8Y2lyY2xlIGN4PSI2MDAiIGN5PSIxNjAiIHI9IjEzMCIgZmlsbD0idXJsKCNtb29uZ2xvdykiLz4KICA8Y2lyY2xlIGN4PSI2MDAiIGN5PSIxNjAiIHI9IjQ2IiBmaWxsPSIjY2RiNmJjIiBvcGFjaXR5PSIwLjUiLz4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSI5MCIgcj0iMiIgZmlsbD0iI2VkZTJkZSIgb3BhY2l0eT0iMC4zIi8+CiAgPGNpcmNsZSBjeD0iMjIwIiBjeT0iMTQwIiByPSIxLjUiIGZpbGw9IiNlZGUyZGUiIG9wYWNpdHk9IjAuMjUiLz4KICA8Y2lyY2xlIGN4PSIzNDAiIGN5PSI3MCIgcj0iMiIgZmlsbD0iI2VkZTJkZSIgb3BhY2l0eT0iMC4yIi8+CiAgPGNpcmNsZSBjeD0iNDcwIiBjeT0iMTEwIiByPSIxLjUiIGZpbGw9IiNlZGUyZGUiIG9wYWNpdHk9IjAuMyIvPgogIDxjaXJjbGUgY3g9IjczMCIgY3k9IjgwIiByPSIyIiBmaWxsPSIjZWRlMmRlIiBvcGFjaXR5PSIwLjI1Ii8+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSIyMjAiIHI9IjEuNSIgZmlsbD0iI2VkZTJkZSIgb3BhY2l0eT0iMC4yIi8+CiAgPGNpcmNsZSBjeD0iNzgwIiBjeT0iMjQwIiByPSIxLjUiIGZpbGw9IiNlZGUyZGUiIG9wYWNpdHk9IjAuMiIvPgogIDxwYXRoIGQ9Ik0wLDQyMCBDMTUwLDM2MCAyODAsNDAwIDQwMCwzNzAgQzUyMCwzNDAgNjUwLDQwMCA4MDAsMzYwIEw4MDAsODAwIEwwLDgwMCBaIiBmaWxsPSJ1cmwoI2hpbGxGYXIpIi8+CiAgPHBhdGggZD0iTTAsNTIwIEMxODAsNDcwIDMwMCw1MjAgNDMwLDQ5MCBDNTYwLDQ2MCA2ODAsNTEwIDgwMCw0ODAgTDgwMCw4MDAgTDAsODAwIFoiIGZpbGw9InVybCgjaGlsbE5lYXIpIi8+Cjwvc3ZnPgo=', base:'#1b1318' },
  rain: { label:'Rain window', img:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgODAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBzbGljZSI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InJhaW5Ta3kiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzE3MTMxOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNDExMWEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImxhbXBHbG93IiBjeD0iNTAlIiBjeT0iNTAlIiByPSI1MCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZTJhOThmIiBzdG9wLW9wYWNpdHk9IjAuMjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTJhOThmIiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiBmaWxsPSJ1cmwoI3JhaW5Ta3kpIi8+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjQwIiByPSIxODAiIGZpbGw9InVybCgjbGFtcEdsb3cpIi8+CiAgPGNpcmNsZSBjeD0iNTYwIiBjeT0iNTIwIiByPSIxNDAiIGZpbGw9InVybCgjbGFtcEdsb3cpIiBvcGFjaXR5PSIwLjYiLz4KICA8ZyBzdHJva2U9IiNjZGI2YmMiIHN0cm9rZS1vcGFjaXR5PSIwLjEwIiBzdHJva2Utd2lkdGg9IjEuNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj4KICAgIDxsaW5lIHgxPSI0MCIgeTE9IjAiIHgyPSIxMCIgeTI9IjEyMCIvPgogICAgPGxpbmUgeDE9IjExMCIgeTE9IjIwIiB4Mj0iODAiIHkyPSIxNTAiLz4KICAgIDxsaW5lIHgxPSIxODAiIHkxPSIwIiB4Mj0iMTUwIiB5Mj0iMTMwIi8+CiAgICA8bGluZSB4MT0iMjYwIiB5MT0iNDAiIHgyPSIyMjUiIHkyPSIxNzAiLz4KICAgIDxsaW5lIHgxPSIzMzAiIHkxPSIxMCIgeDI9IjMwMCIgeTI9IjE0MCIvPgogICAgPGxpbmUgeDE9IjQxMCIgeTE9IjYwIiB4Mj0iMzc4IiB5Mj0iMTkwIi8+CiAgICA8bGluZSB4MT0iNDgwIiB5MT0iMCIgeDI9IjQ1MCIgeTI9IjEzMCIvPgogICAgPGxpbmUgeDE9IjU2MCIgeTE9IjMwIiB4Mj0iNTI4IiB5Mj0iMTYwIi8+CiAgICA8bGluZSB4MT0iNjMwIiB5MT0iMCIgeDI9IjYwMCIgeTI9IjEyMCIvPgogICAgPGxpbmUgeDE9IjcwMCIgeTE9IjUwIiB4Mj0iNjY4IiB5Mj0iMTgwIi8+CiAgICA8bGluZSB4MT0iNzcwIiB5MT0iMTAiIHgyPSI3NDAiIHkyPSIxNDAiLz4KICAgIDxsaW5lIHgxPSI2MCIgeTE9IjI2MCIgeDI9IjI4IiB5Mj0iMzkwIi8+CiAgICA8bGluZSB4MT0iMTUwIiB5MT0iMjkwIiB4Mj0iMTE4IiB5Mj0iNDIwIi8+CiAgICA8bGluZSB4MT0iMjQwIiB5MT0iMjUwIiB4Mj0iMjA4IiB5Mj0iMzgwIi8+CiAgICA8bGluZSB4MT0iMzMwIiB5MT0iMzAwIiB4Mj0iMjk4IiB5Mj0iNDMwIi8+CiAgICA8bGluZSB4MT0iNDIwIiB5MT0iMjcwIiB4Mj0iMzg4IiB5Mj0iNDAwIi8+CiAgICA8bGluZSB4MT0iNTEwIiB5MT0iMzEwIiB4Mj0iNDc4IiB5Mj0iNDQwIi8+CiAgICA8bGluZSB4MT0iNjAwIiB5MT0iMjYwIiB4Mj0iNTY4IiB5Mj0iMzkwIi8+CiAgICA8bGluZSB4MT0iNjkwIiB5MT0iMzAwIiB4Mj0iNjU4IiB5Mj0iNDMwIi8+CiAgICA8bGluZSB4MT0iNzcwIiB5MT0iMjcwIiB4Mj0iNzQwIiB5Mj0iNDAwIi8+CiAgICA8bGluZSB4MT0iODAiIHkxPSI1MDAiIHgyPSI0OCIgeTI9IjYzMCIvPgogICAgPGxpbmUgeDE9IjE4MCIgeTE9IjU0MCIgeDI9IjE0OCIgeTI9IjY3MCIvPgogICAgPGxpbmUgeDE9IjI4MCIgeTE9IjUxMCIgeDI9IjI0OCIgeTI9IjY0MCIvPgogICAgPGxpbmUgeDE9IjM4MCIgeTE9IjU1MCIgeDI9IjM0OCIgeTI9IjY4MCIvPgogICAgPGxpbmUgeDE9IjQ4MCIgeTE9IjUyMCIgeDI9IjQ0OCIgeTI9IjY1MCIvPgogICAgPGxpbmUgeDE9IjU4MCIgeTE9IjU2MCIgeDI9IjU0OCIgeTI9IjY5MCIvPgogICAgPGxpbmUgeDE9IjY4MCIgeTE9IjUzMCIgeDI9IjY0OCIgeTI9IjY2MCIvPgogICAgPGxpbmUgeDE9IjQwIiB5MT0iNzAwIiB4Mj0iMTAiIHkyPSI4MDAiLz4KICAgIDxsaW5lIHgxPSIxNjAiIHkxPSI3MzAiIHgyPSIxMzAiIHkyPSI4MDAiLz4KICAgIDxsaW5lIHgxPSIyOTAiIHkxPSI3MTAiIHgyPSIyNjAiIHkyPSI4MDAiLz4KICAgIDxsaW5lIHgxPSI0MjAiIHkxPSI3NDAiIHgyPSIzOTIiIHkyPSI4MDAiLz4KICAgIDxsaW5lIHgxPSI1NTAiIHkxPSI3MjAiIHgyPSI1MjIiIHkyPSI4MDAiLz4KICAgIDxsaW5lIHgxPSI2ODAiIHkxPSI3NTAiIHgyPSI2NTIiIHkyPSI4MDAiLz4KICA8L2c+CiAgPHJlY3QgeD0iMCIgeT0iNzgwIiB3aWR0aD0iODAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMGUwYTBkIiBvcGFjaXR5PSIwLjYiLz4KPC9zdmc+Cg==', base:'#171318' },
  plant: { label:'Quiet plant', img:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgODAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBzbGljZSI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBsYW50QmciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFhMTQxOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNTExMWEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9InNvZnRMaWdodCIgY3g9IjMwJSIgY3k9IjIwJSIgcj0iNjAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2NkYjZiYyIgc3RvcC1vcGFjaXR5PSIwLjEwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2NkYjZiYyIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0idXJsKCNwbGFudEJnKSIvPgogIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiBmaWxsPSJ1cmwoI3NvZnRMaWdodCkiLz4KICA8ZyBmaWxsPSJub25lIiBzdHJva2U9IiMzYTJlMzgiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjU1Ij4KICAgIDxwYXRoIGQ9Ik00MDAsODAwIEMzOTYsNjUwIDQxMCw1MjAgMzkyLDQyMCIvPgogICAgPHBhdGggZD0iTTM5Miw0MjAgQzM2MCw0MDAgMzIwLDM4MCAyOTAsMzMwIi8+CiAgICA8cGF0aCBkPSJNMzkyLDQyMCBDNDMwLDM5NSA0NzAsMzg1IDUwNSwzNDUiLz4KICAgIDxwYXRoIGQ9Ik0zOTgsNTYwIEMzNjUsNTQ1IDMzNSw1MzUgMzA1LDUwMCIvPgogICAgPHBhdGggZD0iTTM5OCw1NjAgQzQzNSw1NDggNDY1LDU0NSA0OTUsNTEwIi8+CiAgICA8cGF0aCBkPSJNMzk0LDY5MCBDMzY4LDY3OCAzNDUsNjcwIDMyMCw2NDgiLz4KICAgIDxwYXRoIGQ9Ik0zOTQsNjkwIEM0MjIsNjgwIDQ0OCw2NzggNDcyLDY1NiIvPgogIDwvZz4KICA8ZyBmaWxsPSIjMzMyNzJmIiBvcGFjaXR5PSIwLjYiPgogICAgPGVsbGlwc2UgY3g9IjI5MCIgY3k9IjMzMCIgcng9IjQ2IiByeT0iMjIiIHRyYW5zZm9ybT0icm90YXRlKC0zMCAyOTAgMzMwKSIvPgogICAgPGVsbGlwc2UgY3g9IjUwNSIgY3k9IjM0NSIgcng9IjQ2IiByeT0iMjIiIHRyYW5zZm9ybT0icm90YXRlKDI4IDUwNSAzNDUpIi8+CiAgICA8ZWxsaXBzZSBjeD0iMzA1IiBjeT0iNTAwIiByeD0iNDIiIHJ5PSIyMCIgdHJhbnNmb3JtPSJyb3RhdGUoLTIyIDMwNSA1MDApIi8+CiAgICA8ZWxsaXBzZSBjeD0iNDk1IiBjeT0iNTEwIiByeD0iNDIiIHJ5PSIyMCIgdHJhbnNmb3JtPSJyb3RhdGUoMjQgNDk1IDUxMCkiLz4KICAgIDxlbGxpcHNlIGN4PSIzMjAiIGN5PSI2NDgiIHJ4PSIzOCIgcnk9IjE4IiB0cmFuc2Zvcm09InJvdGF0ZSgtMjAgMzIwIDY0OCkiLz4KICAgIDxlbGxpcHNlIGN4PSI0NzIiIGN5PSI2NTYiIHJ4PSIzOCIgcnk9IjE4IiB0cmFuc2Zvcm09InJvdGF0ZSgyMCA0NzIgNjU2KSIvPgogIDwvZz4KICA8Y2lyY2xlIGN4PSI2NDAiIGN5PSIxMjAiIHI9IjIiIGZpbGw9IiNlZGUyZGUiIG9wYWNpdHk9IjAuMTgiLz4KICA8Y2lyY2xlIGN4PSI3MDAiIGN5PSIxOTAiIHI9IjEuNSIgZmlsbD0iI2VkZTJkZSIgb3BhY2l0eT0iMC4xNCIvPgogIDxjaXJjbGUgY3g9IjEyMCIgY3k9IjkwIiByPSIxLjUiIGZpbGw9IiNlZGUyZGUiIG9wYWNpdHk9IjAuMTUiLz4KPC9zdmc+Cg==', base:'#1a1418' },
  dunes: { label:'Soft dunes', img:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgODAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBzbGljZSI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImR1bmVTa3kiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFjMTQxNiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjU1JSIgc3RvcC1jb2xvcj0iIzIyMWExYyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNzExMTMiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9InN1bkdsb3ciIGN4PSI1MCUiIGN5PSI0MCUiIHI9IjU1JSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNjZjlhOGQiIHN0b3Atb3BhY2l0eT0iMC4yMiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjZjlhOGQiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZHVuZUJhY2siIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzJjMjAyMiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyNDFiMWQiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImR1bmVNaWQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzIyMWExYyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxYzE1MTciLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImR1bmVGcm9udCIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMTgxMjE0Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzEzMTAxMiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9InVybCgjZHVuZVNreSkiLz4KICA8Y2lyY2xlIGN4PSI0MDAiIGN5PSIyODAiIHI9IjIyMCIgZmlsbD0idXJsKCNzdW5HbG93KSIvPgogIDxwYXRoIGQ9Ik0wLDQ0MCBRMjAwLDM4MCA0MDAsNDMwIFQ4MDAsNDAwIEw4MDAsODAwIEwwLDgwMCBaIiBmaWxsPSJ1cmwoI2R1bmVCYWNrKSIvPgogIDxwYXRoIGQ9Ik0wLDU2MCBRMjIwLDUwMCA0MjAsNTQ1IFQ4MDAsNTIwIEw4MDAsODAwIEwwLDgwMCBaIiBmaWxsPSJ1cmwoI2R1bmVNaWQpIi8+CiAgPHBhdGggZD0iTTAsNjgwIFEyNTAsNjMwIDQ2MCw2NjUgVDgwMCw2NDUgTDgwMCw4MDAgTDAsODAwIFoiIGZpbGw9InVybCgjZHVuZUZyb250KSIvPgo8L3N2Zz4K', base:'#1c1416' },
};

function updateCanvasBg(){
  const p=pg();
  const CBG=document.getElementById('canvas-bg');
  if(!CBG)return;
  if(!p||!p.bg||(!p.bg.src&&!p.bg.preset)){
    CBG.style.display='none';
    CBG.style.backgroundImage='';
    CBG.style.backgroundColor='';
    CBG.classList.remove('bg-is-preset');
    return;
  }
  CBG.style.display='block';
  const op=(p.bg.opacity!=null?p.bg.opacity:60)/100;
  CBG.classList.remove('fit-contain','fit-repeat');
  if(p.bg.preset){
    // Preset illustrations cover the canvas as a calm, ambient backdrop with a faint grain overlay
    const preset = BG_PRESETS[p.bg.preset] || BG_PRESETS.hills;
    CBG.classList.add('bg-is-preset');
    CBG.style.backgroundColor = preset.base;
    CBG.style.backgroundImage = `url("${preset.img}")`;
    CBG.style.opacity = op;
  } else {
    CBG.classList.remove('bg-is-preset');
    CBG.style.backgroundColor = '';
    CBG.style.backgroundImage=`url("${p.bg.src}")`;
    CBG.style.opacity = op;
    if(p.bg.fit==='contain') CBG.classList.add('fit-contain');
    else if(p.bg.fit==='repeat') CBG.classList.add('fit-repeat');
  }
}

function openBgModal(){
  const p=pg();
  if(!p){ appAlert('Open or create a canvas first.',{title:'No canvas open'}); return; }
  const modal=document.getElementById('bg-modal');
  const hasImg = p.bg && p.bg.src && !p.bg.preset;
  const hasBg = p.bg && (p.bg.src || p.bg.preset);
  document.getElementById('bg-preview-wrap').style.display = hasImg?'block':'none';
  document.getElementById('bg-opacity-row').style.display = hasBg?'block':'none';
  document.getElementById('bg-fit-row').style.display = hasImg?'block':'none';
  document.getElementById('bg-url-row').style.display = 'none';
  document.querySelectorAll('.bg-preset-swatch').forEach(s=>s.classList.toggle('active', !!(p.bg&&p.bg.preset===s.dataset.preset)));
  if(hasImg){
    document.getElementById('bg-preview-img').src = p.bg.src;
    document.querySelectorAll('.bg-fit-opt').forEach(b=>b.classList.toggle('active', b.dataset.fit===(p.bg.fit||'cover')));
  }
  if(hasBg){
    const op = p.bg.opacity!=null?p.bg.opacity:60;
    document.getElementById('bg-opacity-slider').value = op;
    document.getElementById('bg-opacity-val').textContent = op+'%';
  }
  modal.style.display='flex';
}

function setBg(src){
  const p=pg(); if(!p) return;
  p.bg = { src, opacity: (p.bg&&p.bg.opacity!=null)?p.bg.opacity:60, fit: (p.bg&&p.bg.fit)||'cover' };
  save(); updateCanvasBg(); openBgModal();
}

function setBgPreset(name){
  const p=pg(); if(!p) return;
  p.bg = { preset:name, opacity:(p.bg&&p.bg.opacity!=null)?p.bg.opacity:55 };
  save(); updateCanvasBg(); openBgModal();
}

document.getElementById('bg-toggle').addEventListener('click', openBgModal);
document.getElementById('bg-close-btn').addEventListener('click', ()=>{ document.getElementById('bg-modal').style.display='none'; });
document.getElementById('bg-modal').addEventListener('click', e=>{ if(e.target.id==='bg-modal') document.getElementById('bg-modal').style.display='none'; });

document.querySelectorAll('.bg-preset-swatch').forEach(btn=>{
  const preset = BG_PRESETS[btn.dataset.preset];
  if(preset){
    const fill = btn.querySelector('.bg-preset-fill');
    fill.style.backgroundColor = preset.base;
    fill.style.backgroundImage = `url("${preset.img}")`;
    fill.style.backgroundSize = 'cover';
    fill.style.backgroundPosition = 'center';
  }
  btn.addEventListener('click', ()=>setBgPreset(btn.dataset.preset));
});

document.getElementById('bg-file-input').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=ev=>setBg(ev.target.result);
  reader.readAsDataURL(f);
  e.target.value='';
});

document.getElementById('bg-url-btn').addEventListener('click', ()=>{
  const row=document.getElementById('bg-url-row');
  row.style.display = row.style.display==='none' ? 'flex' : 'none';
  if(row.style.display==='flex') document.getElementById('bg-url-input').focus();
});
document.getElementById('bg-url-apply').addEventListener('click', ()=>{
  const url=document.getElementById('bg-url-input').value.trim();
  if(!url) return;
  setBg(url);
  document.getElementById('bg-url-input').value='';
});
document.getElementById('bg-url-input').addEventListener('keydown', e=>{
  if(e.key==='Enter') document.getElementById('bg-url-apply').click();
});

document.getElementById('bg-opacity-slider').addEventListener('input', e=>{
  const p=pg(); if(!p||!p.bg) return;
  p.bg.opacity = parseInt(e.target.value);
  document.getElementById('bg-opacity-val').textContent = p.bg.opacity+'%';
  save(); updateCanvasBg();
});

document.querySelectorAll('.bg-fit-opt').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const p=pg(); if(!p||!p.bg) return;
    p.bg.fit = btn.dataset.fit;
    document.querySelectorAll('.bg-fit-opt').forEach(b=>b.classList.toggle('active', b===btn));
    save(); updateCanvasBg();
  });
});

document.getElementById('bg-remove-btn').addEventListener('click', ()=>{
  const p=pg(); if(!p) return;
  delete p.bg;
  save(); updateCanvasBg();
  document.getElementById('bg-modal').style.display='none';
});
function updateEmpty(){const p=pg();document.getElementById('empty-state').style.display=(p&&p.bubbles.length===0)?'block':'none';}

// ═══════ UTILS ═══════
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function pce(el){const r=document.createRange();r.selectNodeContents(el);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);}

// ═══════ INIT ═══════
load();
if(state.currentPageId&&!state.pages.find(p=>p.id===state.currentPageId))state.currentPageId=state.pages[0]?.id||null;
applyTx();renderSidebar();renderCanvas();updateDateBadge();
setTimeout(()=>{document.getElementById('hint').style.opacity='0';},6000);
