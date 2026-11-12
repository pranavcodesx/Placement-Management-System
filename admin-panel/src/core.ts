import type {DB,Student,Job,Company,AppConfig} from './types';
const $=(s:string,r:ParentNode=document):any=>r.querySelector(s),$$=(s:string,r:ParentNode=document):any[]=>[...r.querySelectorAll(s)];
const S={get(k:string,d?:any){try{const v=localStorage.getItem('ct_'+k);return v?JSON.parse(v):d}catch{return d}},set(k:string,v:any){try{localStorage.setItem('ct_'+k,JSON.stringify(v))}catch{}},del(k:string){try{localStorage.removeItem('ct_'+k)}catch{}}};
const esc=s=>String(s??'').replace(/[&<>"]/g,(c:string)=>(({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}) as Record<string,string>)[c]),m=(a,f)=>a.map(f).join('');
const navIcon=(id:string)=>{const paths:Record<string,string>={dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',students:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0m1-13a4 4 0 0 1 0 7m2 2a6 6 0 0 1 3 5"/>',companies:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12M7 7h1m8 0h1m-10 4h1m8 0h1"/>',jobs:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/>',applications:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6m-12 5 3 2 3-2"/>',reports:'<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/><path d="M17 6h4v4"/>',notifications:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>',resources:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20M8 7h8m-8 4h8"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"/>',website:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',logout:'<path d="m10 17 5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>'};return`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[id]||paths.dashboard}</svg>`};
const DEPTS=['Computer Engineering','IT','Electronics','Mechanical','Civil'],CATS=['IT & Software','Data Science','Web Development','Cloud & DevOps','Embedded Systems','Core Engineering'],PAL=['#6d4aff','#18b26b','#f5a524','#e5484d','#3b82f6'];
const LOGO='<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6bff"/><stop offset="1" stop-color="#4b2fd0"/></linearGradient></defs><path d="M20 3 1 12.5 20 22l15-7.5V26h3V13z" fill="#a995ff"/><circle cx="20" cy="29" r="5.5" fill="url(#lg)"/><path d="M7 39c3-9 23-9 26 0z" fill="url(#lg)"/></svg>';
/* ---- backend connection. Change CT_API only if the backend runs on another address. ---- */
const ROLE=document.body.dataset.r||'student',API=window.CT_API||(location.port=='8000'?'/api':'http://127.0.0.1:8000/api'),ORIGIN=API.replace(/\/api$/,'');
const media=u=>u?(/^https?:/.test(u)?u:ORIGIN+u):'';
let db:DB={st:[],jobs:[],cos:[],apps:[],iv:[],nt:[],na:[],pol:{one:1,dream:1.5},resources:[],admin:{n:'Admin'}};
async function api(method:string,path:string,body?:any):Promise<any>{const h:Record<string,string>={},t=S.get(ROLE+'tok');if(t)h.Authorization='Bearer '+t;let b;if(body instanceof FormData)b=body;else if(body!==undefined){h['Content-Type']='application/json';b=JSON.stringify(body)}
let r;try{r=await fetch(API+path,{method,headers:h,body:b})}catch{throw{error:'Cannot reach the server. Start the backend with: python manage.py runserver',net:1}}
const j=await r.json().catch(()=>({}));if(r.status==401&&t&&!path.startsWith('/auth/')){S.del(ROLE+'tok');location.replace('login.html');throw{error:'Session expired'}}
if(!r.ok)throw{error:j.error||'Something went wrong',status:r.status};return j}
async function boot(){const d=await api('GET','/'+ROLE+'/bootstrap');db=ROLE=='admin'?{...d,nt:[]}:{st:[d.me],jobs:d.jobs,cos:d.cos,apps:d.apps,nt:d.nt,pol:d.pol,na:[]}}
async function call(method:string,path:string,body?:any,msg?:string,re=true):Promise<any>{try{const r=await api(method,path,body);await boot();if(re)rr();if(msg)toast(msg);return r||{}}catch(e){toast(e.error||'Something went wrong');return null}}
const ok=r=>r?undefined:false;
const DAY=864e5,ISO=t=>new Date(t).toISOString().slice(0,10);
const co=(id:any)=>db.cos.find(c=>c.id==id) as Company,job=(id:any)=>db.jobs.find(j=>j.id==id) as Job,stu=(id:any)=>db.st.find(s=>s.id==id) as Student;
const ini=n=>String(n||'?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),fd=d=>new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
const avatar=(u:{n:string;photo?:string},c='')=>u.photo?`<img class="av ${c}" src="${esc(media(u.photo))}" alt="">`:`<span class="av ${c}">${ini(u.n)}</span>`;
const ago=t=>{const x=Math.round((Date.now()-t)/6e4);return x<1?'just now':x<60?x+' min ago':x<1440?Math.round(x/60)+' hr ago':Math.round(x/1440)+' days ago'};
const badge=s=>`<span class="b ${s.toLowerCase()}">${s}</span>`,empty=t=>`<div class="emp">${t}</div>`;
const pkn=p=>(String(p).match(/[\d.]+/g)||[0]).map(Number),pkmax=p=>Math.max(...pkn(p)),left=(dl:string)=>Math.ceil((+new Date(dl+'T23:59:59')-Date.now())/DAY);
const offer=(sid:number)=>Math.max(0,...db.apps.filter(a=>a.s==sid&&a.st=='Selected').map(a=>pkmax(job(a.j).pk)));
/* ---- eligibility rules (the server applies the same rules and is the final authority) ---- */
function elig(s:Student,j:Job){const has=k=>s.sk.some(x=>x.toLowerCase()==k.toLowerCase()),miss=j.sk.filter(k=>!has(k)),sm=j.sk.length?Math.round((j.sk.length-miss.length)/j.sk.length*100):100,c={cr:j.d.includes(s.d),pc:s.pct>=j.min,p10:(s.p10||0)>=(j.m10||0),p12:(s.p12||0)>=(j.m12||0),bk:(s.bk||0)<=(j.mb||0),sk:sm>=60},why:string[]=[];
!c.cr&&why.push('Your department is not eligible');!c.pc&&why.push(`Needs ${j.min}% (you have ${s.pct}%)`);!c.p10&&why.push(`Needs ${j.m10}% in 10th`);!c.p12&&why.push(`Needs ${j.m12}% in 12th / diploma`);!c.bk&&why.push(`Max ${j.mb||0} backlog(s) allowed`);!c.sk&&why.push('Skills match is below 60%');return{ok:!why.length,c,m:sm,miss,why}}
function canApply(s:Student,j:Job){const e=elig(s,j),o=offer(s.id);if(db.apps.some(a=>a.s==s.id&&a.j==j.id))return{ok:0,m:'You have already applied.'};if(left(j.dl)<0)return{ok:0,m:'The application deadline has passed.'};if(!s.rs)return{ok:0,m:'Upload your resume to apply.'};if(!e.ok)return{ok:0,m:e.why[0]+'.'};
if(db.pol.one&&o&&pkmax(j.pk)<o*db.pol.dream)return{ok:0,m:`You are already placed (₹${o} LPA). Only dream offers (${db.pol.dream}x or more) are open to you.`};return{ok:1,m:''}}
const fld=(l:string,n:string,v:any='',t='text',x='')=>`<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
const sel=(l,n,o,v)=>`<label>${l}<select name="${n}">${m(o,x=>`<option ${x==v?'selected':''}>${esc(x)}</option>`)}</select></label>`;
const selp=(l,n,o,v,ph)=>`<label>${l}<select name="${n}" required><option value="">${ph}</option>${m(o,x=>`<option ${x==v?'selected':''}>${esc(x)}</option>`)}</select></label>`;
const head=(t,s,b='')=>`<div class="ph2"><div><h1 class="ttl">${t}</h1><p class="sub">${s}</p></div>${b}</div>`,tbl=(h,r)=>`<div class="tw"><table><thead><tr>${m(h,x=>`<th>${x}</th>`)}</tr></thead><tbody>${r}</tbody></table></div>`;
const pgr=(arr,per=8)=>{const n=Math.max(1,Math.ceil(arr.length/per)),p=Math.min(Math.max(+FV.p||1,1),n);return{o:(p-1)*per,rows:arr.slice((p-1)*per,p*per),bar:`<nav class="pgr" aria-label="Pages"><span>${arr.length} result${arr.length==1?'':'s'}</span>${n>1?m([...Array(n).keys()],i=>`<button class="chip ${i+1==p?'on':''}" data-a="pg" data-p="${i+1}">${i+1}</button>`):''}</nav>`}};
function toast(t:string){const e=document.createElement('div');e.className='toast';e.setAttribute('role','status');e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),3200)}
let selectId=0;
const closeSelects=(except?:HTMLElement)=>{
  $$('.ad-select-trigger[aria-expanded="true"]').forEach(trigger=>{
    if(trigger===except)return;
    trigger.setAttribute('aria-expanded','false');
    const menu=$('#'+CSS.escape(trigger.getAttribute('aria-controls')||''));
    if(menu){menu.classList.remove('open','above');menu.setAttribute('aria-hidden','true')}
  });
};
function enhanceSelect(select:HTMLSelectElement){
  if(select.dataset.customReady)return;
  select.dataset.customReady='1';
  const id=select.id||'admin-select-'+(++selectId),label=select.getAttribute('aria-label')||Array.from(select.closest('label')?.childNodes||[]).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').trim()||select.name||'Choose an option';
  select.id=select.id||id;
  const wrap=document.createElement('span');
  wrap.className='ad-select';
  select.parentNode?.insertBefore(wrap,select);
  wrap.append(select);
  select.classList.add('ad-select-native');
  select.tabIndex=-1;
  select.setAttribute('aria-hidden','true');
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='ad-select-trigger';trigger.setAttribute('aria-label',label);
  trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls',id+'-menu');trigger.dataset.sid=select.id;
  const value=document.createElement('span');value.className='ad-select-value';
  const arrow=document.createElement('i');arrow.setAttribute('aria-hidden','true');arrow.textContent='';
  trigger.append(value,arrow);
  wrap.append(trigger);
  const menu=document.createElement('div');
  menu.id=id+'-menu';menu.className='ad-select-menu';menu.setAttribute('role','listbox');
  menu.setAttribute('aria-label',label);menu.setAttribute('aria-hidden','true');menu.dataset.owner=select.id;
  document.body.append(menu);
  const sync=()=>{
    const selected=select.options[select.selectedIndex];
    value.textContent=selected?.textContent?.trim()||'Choose an option';
    trigger.classList.toggle('placeholder',!selected||selected.value==='');
    menu.querySelectorAll<HTMLElement>('[role=option]').forEach(option=>{
      const active=option.dataset.value===select.value;
      option.setAttribute('aria-selected',String(active));option.classList.toggle('selected',active);
    });
  };
  const buildOptions=()=>{
    menu.replaceChildren();
    Array.from(select.options).forEach((option,index)=>{
      const item=document.createElement('button');
      item.type='button';item.className='ad-select-option';item.id=id+'-option-'+index;
      item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));
      item.disabled=option.disabled;item.textContent=option.textContent?.trim()||'';
      item.dataset.value=option.value;item.dataset.index=String(index);
      menu.append(item);
    });
    sync();
  };
  const open=(focus=true)=>{
    closeSelects(trigger);
    buildOptions();
    const rect=trigger.getBoundingClientRect();
    menu.style.left=Math.max(12,Math.min(rect.left,innerWidth-Math.max(rect.width,180)-12))+'px';
    menu.style.width=Math.min(Math.max(rect.width,180),innerWidth-24)+'px';
    menu.style.maxHeight=Math.min(260,innerHeight-24)+'px';
    menu.classList.add('open');menu.setAttribute('aria-hidden','false');
    trigger.setAttribute('aria-expanded','true');
    const height=Math.min(menu.scrollHeight,Math.min(260,innerHeight-24));
    const above=rect.bottom+8+height>innerHeight-8;
    menu.classList.toggle('above',above);
    menu.style.top=(above?Math.max(8,rect.top-height-8):Math.min(innerHeight-height-8,rect.bottom+7))+'px';
    if(focus){
      const options=$$('[role=option]:not(:disabled)',menu) as HTMLElement[];
      (options.find(o=>o.getAttribute('aria-selected')==='true')||options[0])?.focus();
    }
  };
  trigger.addEventListener('click',()=>trigger.getAttribute('aria-expanded')==='true'?closeSelects():open());
  trigger.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();open()}
    if(event.key==='Escape')closeSelects();
  });
  menu.addEventListener('click',event=>{
    const item=(event.target as HTMLElement).closest<HTMLElement>('[role=option]');
    if(!item||item.getAttribute('aria-disabled')==='true')return;
    select.value=item.dataset.value||'';
    sync();closeSelects();trigger.focus();
    select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  menu.addEventListener('keydown',event=>{
    const current=(event.target as HTMLElement).closest<HTMLElement>('[role=option]');
    if(event.key==='Escape'){event.preventDefault();closeSelects();trigger.focus();return}
    if(event.key==='Tab'){closeSelects();return}
    const options=$$('[role=option]:not(:disabled)',menu) as HTMLElement[];
    let index=options.indexOf(current!);
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();index=(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;options[index]?.focus();
    }else if(event.key==='Home'||event.key==='End'){
      event.preventDefault();options[event.key==='Home'?0:options.length-1]?.focus();
    }
  });
  select.addEventListener('change',sync);
  sync();
}
function enhanceSelects(){
  $$('select:not([data-custom-ready])').forEach(select=>enhanceSelect(select as HTMLSelectElement));
  $$('.ad-select-menu').forEach(menu=>{if(!document.getElementById((menu as HTMLElement).dataset.owner||''))menu.remove()});
}
document.addEventListener('click',event=>{
  if(!(event.target as HTMLElement).closest('.ad-select-trigger,.ad-select-menu'))closeSelects();
});
window.addEventListener('scroll',()=>closeSelects(),true);
window.addEventListener('resize',()=>closeSelects());
document.addEventListener('change',event=>{
  const select=event.target as HTMLSelectElement;
  if(select.matches('select.fl')&&$('#lst')){
    FV[select.name]=select.value;FV.p=1;$('#lst').innerHTML=ui.LF();charts();
  }
});
new MutationObserver(enhanceSelects).observe(document.documentElement,{childList:true,subtree:true});
enhanceSelects();
function modal(title:string,body:string,on:(d:any,f:HTMLFormElement)=>any,okb='Save',kind=''){const w=document.createElement('div');w.className='md'+(kind?' '+kind:'');w.innerHTML=`<form class="mc" novalidate role="dialog" aria-label="${esc(title)}"><div class="mt"><h3>${title}</h3><button type="button" class="ib x" aria-label="Close">✕</button></div>${body}<div class="mf"><button type="button" class="btn x">Cancel</button><button class="btn fill">${okb}</button></div></form>`;
const f=$('form',w),k=e=>e.key=='Escape'&&close(),close=()=>{w.remove();document.removeEventListener('keydown',k)};document.addEventListener('keydown',k);
w.onclick=e=>{if((e.target as any)==w||(e.target as any).closest('.x'))close()};
f.onsubmit=async e=>{e.preventDefault();let bad=0;$$('[required]',f).forEach(i=>{const b=!i.value.trim();i.classList.toggle('err',b);bad+=+b});if(bad)return;const r=await on((Object.fromEntries(new FormData(f)) as any),f);if(r!==false)close()};
document.body.append(w);const i=$('input,select,textarea',f);i&&i.focus()}
const ask=(t:string,fn:()=>any)=>modal('Are you sure?',`<p class="mu">${t}</p>`,async()=>{await fn()},'Confirm');
const V404=()=>`<div class="e404"><b>404</b><h2>Page not found</h2><p class="mu">The page you are looking for does not exist.</p><a class="btn fill" href="#/${HOME}">Go back home</a></div>`;
let HOME='',FV:Record<string,any>={},Q=new URLSearchParams();const ui={LF:(()=>'') as ()=>string},A:Record<string,any>={},F:Record<string,any>={},rr=()=>dispatchEvent(new Event('hashchange'));
A.pg=d=>{FV.p=+d.p;$('#lst').innerHTML=ui.LF()};
A.out=async d=>{try{await api('POST','/auth/logout')}catch{}S.del(ROLE+'tok');location.href=d.to};
document.addEventListener('click',e=>{const a=(e.target as any).closest('[data-a]');if(a&&A[a.dataset.a]){e.preventDefault();A[a.dataset.a](a.dataset,a)}const t=(e.target as any).closest('button.fl');if(t){const n=t.dataset.n,v=t.dataset.v;FV[n]=FV[n]==v&&v!==''?'':v;FV.p=1;$$('button.fl[data-n="'+n+'"]').forEach(b=>b.classList.toggle('on',(FV[n]||'')==b.dataset.v));$('#lst').innerHTML=ui.LF();charts()}});
document.addEventListener('submit',e=>{const f=(e.target as any).closest('form[data-f]');if(f&&F[f.dataset.f]){e.preventDefault();F[f.dataset.f]((Object.fromEntries(new FormData(f)) as any),f)}});
document.addEventListener('input',e=>{const t=(e.target as any);if(t.classList.contains('fl')&&$('#lst')){FV[t.name]=t.value;FV.p=1;$('#lst').innerHTML=ui.LF();charts()}});
document.addEventListener('keydown',e=>{if(e.key=='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement!.tagName)&&$('#gs')){e.preventDefault();$('#gs').focus()}});
function charts(){if(!window.Chart)return;$$('canvas[data-ch]').forEach(c=>{const o=JSON.parse(c.dataset.ch),dn=o.t=='doughnut';new Chart(c,{type:o.t,data:{labels:o.l,datasets:o.d.map((d,i)=>{const color=d.c||PAL[i];return{label:d.n,data:d.v,borderColor:o.t=='line'?color:undefined,backgroundColor:dn?PAL:o.t=='line'?color+'22':color,fill:o.t=='line',tension:.4,borderRadius:8,borderWidth:dn?0:2}})},options:{responsive:true,maintainAspectRatio:false,cutout:dn?'68%':undefined,plugins:{legend:{display:o.leg===undefined?dn||o.d.length>1:o.leg,position:'bottom'}},scales:dn?{}:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}})})}
const offline=e=>$('#root').innerHTML=`<div class="ld err"><h2>Server not reachable</h2><p>${esc(e.error)}</p><button class="btn fill" onclick="location.reload()">Try again</button></div>`;
async function start(c:AppConfig){if(!S.get(ROLE+'tok')){location.replace('login.html');return}$('#root').innerHTML='<div class="ld"><i></i>Loading…</div>';try{await boot()}catch(e){if(e.net)offline(e);return}if(c.guard&&c.guard()===false)return;app(c)}
function app(c:AppConfig){HOME=c.nav[0][0];
$('#root').innerHTML=`<div class="app"><aside class="sb" id="sb"><a class="logo" href="#/${HOME}">${LOGO}<span>Career<b>Track</b></span></a><p class="role">${c.role}</p><nav id="nv" aria-label="Main"><span class="ind" id="ind"></span>${m(c.nav,n=>`<a href="#/${n[0]}" data-id="${n[0]}"><i>${navIcon(n[0])}</i>${n[2]}</a>`)}</nav>${c.home?`<a class="out" href="${c.home}"><i>${navIcon('website')}</i>Website</a>`:''}<a class="out" href="#" data-a="out" data-to="${c.to}"><i>${navIcon('logout')}</i>Logout</a></aside><div class="mn"><header class="tb"><button class="ib mb" id="mb" aria-label="Open menu">☰</button><input class="gs" id="gs" type="search" placeholder="${c.sp}  ( / )" aria-label="Search"><span class="sp"></span><a class="ib bell" href="#/notifications" aria-label="Notifications">${navIcon('bell')}<em id="bc"></em></a><a class="av" id="av" href="#/${c.pf}" aria-label="Profile"></a></header><main id="pg" class="pg"></main></div><div class="ov" id="ov"></div></div>`;
const sb=$('#sb'),ov=$('#ov'),tg=o=>{sb.classList.toggle('open',o);ov.classList.toggle('on',o)};
$('#mb').onclick=()=>tg(1);ov.onclick=()=>tg(0);$('#gs').onkeydown=e=>e.key=='Enter'&&(location.hash=`#/${c.sv}?q=${encodeURIComponent((e.target as any).value)}`);
const go=()=>{const[p,q]=(location.hash.slice(2)||HOME).split('?'),[id,arg]=p.split('/');Q=new URLSearchParams(q||'');FV={q:Q.get('q')||'',st:Q.get('st')||''};ui.LF=()=>'';
const pg=$('#pg');pg.innerHTML=(Object.hasOwn(c.views,id)?c.views[id]:V404)(arg);pg.style.animation='none';pg.offsetWidth;pg.style.animation='';
$$('#nv a').forEach(a=>a.classList.toggle('on',a.dataset.id==id||(c.al||{})[id]==a.dataset.id));
const on=$('#nv a.on'),ind=$('#ind');if(on&&ind){if(!ind.dataset.r)ind.style.transition='none';ind.style.height=on.offsetHeight+'px';ind.style.transform=`translateY(${on.offsetTop}px)`;ind.style.opacity='1';requestAnimationFrame(()=>{ind.style.transition='';ind.dataset.r='1'})}const u=c.user();$('#av').innerHTML=u.photo?`<img src="${esc(media(u.photo))}" alt="">`:ini(u.n);const n=c.unread();$('#bc').textContent=n;$('#bc').hidden=!n;tg(0);scrollTo(0,0);charts()};
addEventListener('hashchange',go);go()}

export {$,$$,S,esc,m,DEPTS,CATS,PAL,LOGO,ROLE,API,ORIGIN,media,db,api,boot,call,ok,DAY,ISO,co,job,stu,ini,fd,avatar,ago,badge,empty,pkn,pkmax,left,offer,elig,canApply,fld,sel,selp,head,tbl,pgr,toast,modal,ask,V404,HOME,FV,Q,ui,A,F,rr,charts,offline,start,app};
