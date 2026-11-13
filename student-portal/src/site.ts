import {$,$$,S,esc,fd,left,pkmax,API,LOGO,media} from './core';
import type {Job,Company} from './types';

interface Stats{jobs:number;cos:number;students:number;offers:number;placed:number;rate:number;hi:number;avg:number}
interface Overview{jobs:Job[];cos:Company[];stats:Stats}

const NAV:[string,string,string][]=[['home','index','Home'],['about','about','About'],['features','features','Features'],['placements','placements','Placements'],['contact','contact','Contact']];
const page=document.body.dataset.page||'home',loggedIn=!!S.get('studenttok'),logo=LOGO.replace('#a995ff','#1b1650');
const links=NAV.map(l=>`<a href="${l[1]}.html" class="${l[0]==page?'on':''}">${l[2]}</a>`).join('');
$('#hdr').innerHTML=`<div class="ann"><div class="wrap" id="ann"><span class="msg on">🎓 Campus placement season is live <a href="placements.html">See all openings</a></span></div></div>
<header class="nav"><div class="wrap"><a class="logo" href="index.html" aria-label="CareerTrack home">${logo}<span>Career<b>Track</b></span></a>
<nav class="links" id="lk" aria-label="Main"><span class="ind" id="ind"></span>${links}<a class="mm" href="${loggedIn?'app.html#/dashboard':'login.html'}">${loggedIn?'My dashboard':'Login / Register'}</a></nav>
<div class="auth">${loggedIn?'<a class="btn fill hm" href="app.html#/dashboard">My dashboard</a>':'<a class="btn hm" href="login.html">Login</a><a class="btn fill hm" href="register.html">Get started</a>'}<button class="burger" id="bg" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="lk">☰</button></div></div></header><button class="menu-backdrop" type="button" aria-label="Close menu" tabindex="-1"></button>`;
$('#ftr').innerHTML=`<div class="wrap"><div class="fg"><div><a class="logo" href="index.html">${LOGO}<span>Career<b>Track</b></span></a><p>Student Career &amp; Placement Management System. Plan, apply and grow.</p></div><div><h5>Explore</h5>${links}</div><div><h5>Student portal</h5><a href="login.html">Login</a><a href="register.html">Create account</a><a href="forgot.html">Forgot password</a></div><div><h5>Contact</h5><a href="mailto:support@careertrack.com">support@careertrack.com</a><a href="tel:+919876543210">+91 98765 43210</a><a href="contact.html">Pune, Maharashtra</a></div></div><div class="cp"><span>© ${new Date().getFullYear()} CareerTrack. All rights reserved.</span><span>Plan · Apply · Grow</span></div></div>`;

/* ---- header: stays fixed, shrinks on scroll, mobile menu ---- */
const hdr:HTMLElement=$('#hdr'),lk:HTMLElement=$('#lk'),bg:HTMLElement=$('#bg');
const onScroll=()=>hdr.classList.toggle('sc',scrollY>24);addEventListener('scroll',onScroll,{passive:true});onScroll();
const setMenu=(open:boolean)=>{hdr.classList.toggle('menu-open',open);lk.classList.toggle('open',open);bg.setAttribute('aria-expanded',String(open));bg.setAttribute('aria-label',open?'Close menu':'Open menu');bg.textContent=open?'✕':'☰'};
bg.onclick=()=>setMenu(bg.getAttribute('aria-expanded')!=='true');
$('.menu-backdrop',hdr).addEventListener('click',()=>setMenu(false));
lk.addEventListener('click',event=>{if((event.target as HTMLElement).closest('a'))setMenu(false)});
addEventListener('keydown',event=>{if(event.key==='Escape'&&lk.classList.contains('open')){setMenu(false);bg.focus()}});
addEventListener('resize',()=>{if(matchMedia('(min-width: 901px)').matches)setMenu(false)});

/* ---- sliding active indicator: starts where the previous page left it, then glides to the new tab ---- */
const ind:HTMLElement=$('#ind');
const place=(smooth:boolean)=>{const on:HTMLElement=$('#lk a.on');if(!on)return;if(!smooth)ind.style.transition='none';ind.style.width=on.offsetWidth+'px';ind.style.transform=`translateX(${on.offsetLeft}px)`;if(!smooth){ind.getBoundingClientRect();ind.style.transition=''}};
const prev=sessionStorage.getItem('ctInd');
if(prev){try{const p=JSON.parse(prev);ind.style.transition='none';ind.style.width=p.w+'px';ind.style.transform=`translateX(${p.x}px)`;ind.getBoundingClientRect();ind.style.transition=''}catch{}}
requestAnimationFrame(()=>requestAnimationFrame(()=>place(!!prev)));
const remember=()=>{const on:HTMLElement=$('#lk a.on');if(on)sessionStorage.setItem('ctInd',JSON.stringify({x:on.offsetLeft,w:on.offsetWidth}))};
lk.addEventListener('click',e=>{const a=(e.target as HTMLElement).closest('a');if(a&&a.classList.contains('mm')===false&&a.getAttribute('href')&&!a.classList.contains('on')){/* glide to the clicked tab right away */ind.style.width=a.offsetWidth+'px';ind.style.transform=`translateX(${a.offsetLeft}px)`;sessionStorage.setItem('ctInd',JSON.stringify({x:a.offsetLeft,w:a.offsetWidth}))}});
addEventListener('pagehide',remember);addEventListener('resize',()=>place(false));

/* ---- FAQ accordion: animate the clipped answer panel and keep one open per group ---- */
const faqItems:HTMLElement[]=$$('.faq-item');
const setFaqOpen=(item:HTMLElement,expanded:boolean)=>{
const button:HTMLButtonElement=$('.faq-question',item);
const panel:HTMLElement=$('.faq-answer',item),inner:HTMLElement=$('.faq-answer-inner',item);
panel.style.height=`${panel.getBoundingClientRect().height}px`;
panel.getBoundingClientRect();
item.classList.toggle('open',expanded);
button.setAttribute('aria-expanded',String(expanded));
panel.setAttribute('aria-hidden',String(!expanded));
if(matchMedia('(prefers-reduced-motion: reduce)').matches){panel.style.height=expanded?'auto':'0px';return}
panel.style.height=expanded?`${inner.scrollHeight}px`:'0px';
};
faqItems.forEach((item:HTMLElement)=>{
const panel:HTMLElement=$('.faq-answer',item),button:HTMLButtonElement=$('.faq-question',item);
panel.setAttribute('aria-hidden','true');
panel.addEventListener('transitionend',event=>{if(event.target===panel&&(event as TransitionEvent).propertyName==='height'&&item.classList.contains('open'))panel.style.height='auto'});
button.addEventListener('click',()=>{
const expanded=button.getAttribute('aria-expanded')!=='true';
if(expanded)faqItems.filter((other:HTMLElement)=>other!==item&&other.parentElement===item.parentElement&&other.classList.contains('open')).forEach((other:HTMLElement)=>setFaqOpen(other,false));
setFaqOpen(item,expanded);
});
});

/* ---- generic sliding segmented control (features tabs) ---- */
$$('.seg').forEach((seg:HTMLElement)=>{const si:HTMLElement=$('.sgi',seg),buttons:HTMLButtonElement[]=$$('button[role="tab"]',seg),set=(b:HTMLElement,smooth=true)=>{if(!smooth)si.style.transition='none';si.style.width=b.offsetWidth+'px';si.style.transform=`translateX(${b.offsetLeft-5}px)`;if(!smooth){si.getBoundingClientRect();si.style.transition=''}};
const activate=(b:HTMLButtonElement)=>{buttons.forEach(x=>{const active=x===b;x.classList.toggle('on',active);x.setAttribute('aria-selected',String(active));x.tabIndex=active?0:-1});set(b);$$('.tabp[role="tabpanel"]').forEach((p:HTMLElement)=>p.hidden=p.id!==b.getAttribute('aria-controls'));reveal()};
const first:HTMLButtonElement=$('button[role="tab"].on',seg);requestAnimationFrame(()=>set(first,false));
seg.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest('button[role="tab"]') as HTMLButtonElement|null;if(b)activate(b)});
seg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const current=buttons.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(current+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();activate(buttons[next])});
});

/* ---- scroll reveal + count-up ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
function reveal(){$$('[data-stag]').forEach((c:HTMLElement)=>{if(c.dataset.done)return;c.dataset.done='1';[...c.children].forEach((k,i)=>{k.setAttribute('data-rv','');(k as HTMLElement).style.setProperty('--d',i*.09+'s')})});$$('[data-rv]:not(.in)').forEach((e:Element)=>io.observe(e))}
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){count(e.target as HTMLElement);cio.unobserve(e.target)}}),{threshold:.4});
function count(e:HTMLElement){const n=+(e.dataset.n||0);let t0=0;const f=(t:number)=>{t0=t0||t;const k=Math.min((t-t0)/1500,1);e.textContent=String(Math.round(n*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)}
reveal();

/* ---- live data from the backend ---- */
let O:Overview={jobs:[],cos:[],stats:{jobs:0,cos:0,students:0,offers:0,placed:0,rate:0,hi:0,avg:0}};
const plural=(n:number,w:string)=>n+' '+w+(n==1?'':'s');
const companyMark=(c?:Company)=>{const domain=c?.w.match(/^https?:\/\/([^/?#]+)/i)?.[1],src=c?.lg?media(c.lg):domain?`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`:'';return`<span class="rc-logo"><i aria-hidden="true">${esc(c?.n.trim()[0]||'?')}</i>${src?`<img src="${esc(src)}" alt="" width="36" height="36" decoding="async">`:''}</span>`};
const loadCompanyMarks=(root:ParentNode=document)=>{$$('.rc-logo img',root).forEach((img:HTMLImageElement)=>{const mark=img.parentElement;if(img.complete){if(img.naturalWidth)mark?.classList.add('loaded')}else{img.addEventListener('load',()=>mark?.classList.add('loaded'),{once:true})}})};
const wj=(j:Job)=>{const c=O.cos.find(x=>x.id==j.c),r=left(j.dl),href=loggedIn?`app.html#/job/${j.id}`:`login.html?next=${encodeURIComponent('app.html#/job/'+j.id)}`;
return`<article class="job card" data-rv><div class="co">${companyMark(c)}</div><div><h4>${esc(j.t)}</h4><small>${esc(c?c.n:'')} · ${esc(j.l)}</small></div><span class="dlp ${r>7?'ok':''}">${r<=0?'Last day':r<=7?plural(r,'day')+' left':'Closes '+fd(j.dl)}</span><div class="sk2">${j.sk.map(k=>`<span>${esc(k)}</span>`).join('')}</div><p class="meta">💰 ${esc(j.pk)} &nbsp;·&nbsp; 🏷 ${esc(j.cat)}</p><a class="btn fill sm" href="${href}">${loggedIn?'View and apply':'Login to apply'}</a></article>`};
const open=()=>O.jobs.filter(j=>left(j.dl)>=0).sort((a,b)=>left(a.dl)-left(b.dl));
function apply(o:Overview){O=o;const s=o.stats,K:Record<string,number>={jobs:s.jobs,cos:s.cos,offers:s.offers,studs:s.students,placed:s.placed},T:Record<string,string>={rate:s.rate+'%',hi:s.hi?'₹'+s.hi+' LPA':'—',avg:s.avg?'₹'+s.avg+' LPA':'—'};
$$('[data-k]').forEach((e:HTMLElement)=>{e.dataset.n=String(K[e.dataset.k!]||0);cio.observe(e)});$$('[data-t]').forEach((e:HTMLElement)=>e.textContent=T[e.dataset.t!]??String(K[e.dataset.t!]??'—'));
const el=(id:string)=>document.getElementById(id);
if(el('latest')){el('latest')!.innerHTML=o.jobs.slice(0,3).map(wj).join('');loadCompanyMarks(el('latest')!)}
if(el('mq')){const b=o.cos.map(c=>`<span class="rc">${companyMark(c)}${esc(c.n)}</span>`).join('');el('mq')!.innerHTML=b+b+b+b;loadCompanyMarks(el('mq')!)}
const soon=open();
if(el('ud')){el('ud')!.innerHTML=soon.slice(0,4).map(j=>{const c=o.cos.find(x=>x.id==j.c),r=left(j.dl);return`<a class="dli" href="placements.html?q=${encodeURIComponent(j.t)}"><div class="co">${companyMark(c)}</div><div class="g"><b>${esc(j.t)}</b><small>${esc(c?c.n:'')} · ${esc(j.l)} · ${esc(j.pk)}</small></div><span class="dlp ${r>7?'ok':''}">${r<=0?'Last day':plural(r,'day')+' left'}</span></a>`}).join('')||'<div class="emp">No open deadlines right now.</div>';loadCompanyMarks(el('ud')!)}
/* announcement bar + countdown */
const msgs=[`🎓 Campus placement season is live <a href="placements.html">See all openings</a>`];
if(s.hi)msgs.push(`💰 Highest package this season: ₹${s.hi} LPA <a href="placements.html">Explore jobs</a>`);
const nj=soon[0];if(nj){const c=o.cos.find(x=>x.id==nj.c);msgs.push(`⏰ ${esc(nj.t)} at ${esc(c?c.n:'')} closes in ${plural(Math.max(0,left(nj.dl)),'day')} <a href="placements.html?q=${encodeURIComponent(nj.t)}">Apply now</a>`)}
msgs.push(`✨ Free to join — build your profile in 7 simple steps <a href="register.html">Get started</a>`);
const ann=el('ann')!;ann.innerHTML=msgs.map((t,i)=>`<span class="msg ${i?'':'on'}">${t}</span>`).join('');let mi=0;if(msgs.length>1)setInterval(()=>{const a=ann.children;a[mi].classList.remove('on');mi=(mi+1)%a.length;a[mi].classList.add('on')},4200);
if(el('cd')&&nj){const end=+new Date(nj.dl+'T23:59:59'),c=o.cos.find(x=>x.id==nj.c);el('cd-j')!.textContent=`${nj.t} · ${c?c.n:''}`;const tick=()=>{let d=Math.max(0,end-Date.now());const p=(n:number)=>String(n).padStart(2,'0');el('cd-d')!.textContent=p(Math.floor(d/864e5));el('cd-h')!.textContent=p(Math.floor(d/36e5)%24);el('cd-m')!.textContent=p(Math.floor(d/6e4)%60);el('cd-s')!.textContent=p(Math.floor(d/1e3)%60)};tick();setInterval(tick,1000)}
if(el('pj'))placements();
reveal()}
function placements(){
const q:HTMLInputElement=$('#pq');
q.value=new URLSearchParams(location.search).get('q')||'';
const createDropdown=(id:string,label:string,options:{value:string;label:string}[],onChange:()=>void)=>{
const root:HTMLElement=$('#'+id),listId=id+'-options';
root.innerHTML=`<button class="filter-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${listId}"><span>${label}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg></button><div class="filter-options" id="${listId}" role="listbox" aria-label="${label}"></div>`;
const trigger:HTMLButtonElement=$('.filter-trigger',root),list:HTMLElement=$('.filter-options',root);
let value=options[0].value;
const close=()=>{root.classList.remove('open');trigger.setAttribute('aria-expanded','false')};
const select=(option:HTMLElement)=>{value=option.dataset.value||'';$('.filter-trigger span',root).textContent=option.textContent;$$('[role="option"]',list).forEach((item:HTMLElement)=>item.setAttribute('aria-selected',String(item===option)));close();onChange()};
list.innerHTML=options.map((option,i)=>`<button class="filter-option" type="button" role="option" aria-selected="${i===0}" data-value="${esc(option.value)}">${esc(option.label)}</button>`).join('');
trigger.addEventListener('click',()=>{const opening=!root.classList.contains('open');$$('.filter-dropdown.open').forEach((item:HTMLElement)=>{item.classList.remove('open');$('.filter-trigger',item).setAttribute('aria-expanded','false')});root.classList.toggle('open',opening);trigger.setAttribute('aria-expanded',String(opening))});
list.addEventListener('click',event=>{const option=(event.target as HTMLElement).closest('[role="option"]') as HTMLElement|null;if(option)select(option)});
trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();root.classList.add('open');trigger.setAttribute('aria-expanded','true');const opts:HTMLElement[]=$$('[role="option"]',list);(event.key==='ArrowDown'?opts[0]:opts[opts.length-1]).focus()}});
list.addEventListener('keydown',event=>{const opts:HTMLElement[]=$$('[role="option"]',list),current=opts.indexOf(document.activeElement as HTMLElement);let next=-1;if(event.key==='ArrowDown')next=(current+1)%opts.length;else if(event.key==='ArrowUp')next=(current-1+opts.length)%opts.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=opts.length-1;else if(event.key==='Escape'){event.preventDefault();close();trigger.focus()}if(next>=0){event.preventDefault();opts[next].focus()}});
document.addEventListener('click',event=>{if(!root.contains(event.target as Node))close()});
return{get value(){return value}};
};
let companyValue='',sortValue='d';
const company=createDropdown('company-filter','All companies',[{value:'',label:'All companies'},...O.cos.map(x=>({value:String(x.id),label:x.n}))],()=>{companyValue=company.value;draw()});
const sort=createDropdown('sort-filter','Closing soon',[{value:'d',label:'Closing soon'},{value:'p',label:'Highest package'}],()=>{sortValue=sort.value;draw()});
const draw=()=>{const t=q.value.toLowerCase(),r=open().filter(j=>(!t||(j.t+(O.cos.find(x=>x.id==j.c)||{n:''}).n+j.sk.join(' ')+j.l+j.cat).toLowerCase().includes(t))&&(!companyValue||String(j.c)==companyValue));if(sortValue==='p')r.sort((a,b)=>pkmax(b.pk)-pkmax(a.pk));
$('#pj').innerHTML=r.map(wj).join('')||'<div class="emp">No openings match your search. Try another keyword.</div>';loadCompanyMarks($('#pj'));$('#pn').textContent=plural(r.length,'open position');reveal()};
q.addEventListener('input',draw);companyValue=company.value;sortValue=sort.value;draw()
}
fetch(API+'/public/overview').then(r=>r.json()).then(apply).catch(()=>{const t=document.getElementById('latest')||document.getElementById('pj');if(t)t.innerHTML='<div class="emp">Cannot reach the server. Start the backend with: python manage.py runserver</div>'});

/* ---- contact form ---- */
const contactForm:HTMLFormElement=$('form.contact-form');
if(contactForm){
const fields:{[key:string]:HTMLInputElement|HTMLTextAreaElement}={name:$('#n',contactForm),email:$('#e',contactForm),message:$('#m',contactForm)};
const messages:{[key:string]:HTMLElement}={name:$('#n-error',contactForm),email:$('#e-error',contactForm),message:$('#m-error',contactForm)};
const status:HTMLElement=$('#contact-status',contactForm),submit:HTMLButtonElement=$('button[type="submit"]',contactForm);
const errorFor=(key:string)=>{
const field=fields[key],value=field.value.trim();
if(!value)return key==='name'?'Please enter your name.':key==='email'?'Please enter your email address.':'Please enter a message.';
if(key==='name'&&value.length>80)return'Name must be 80 characters or fewer.';
if(key==='email'&&(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)||!field.validity.valid))return'Enter a valid email address.';
if(key==='message'&&value.length>2000)return'Message must be 2000 characters or fewer.';
return'';
};
const validate=(key:string)=>{
const error=errorFor(key),field=fields[key],message=messages[key];
field.classList.toggle('err',!!error);field.setAttribute('aria-invalid',String(!!error));
message.textContent=error;message.hidden=!error;
return!error;
};
Object.keys(fields).forEach(key=>{fields[key].addEventListener('blur',()=>validate(key));fields[key].addEventListener('input',()=>{if(fields[key].getAttribute('aria-invalid')==='true')validate(key);status.hidden=true})});
contactForm.addEventListener('submit',async event=>{
event.preventDefault();status.hidden=true;status.className='form-status';
const valid=Object.keys(fields).map(validate).every(Boolean);
if(!valid){fields[Object.keys(fields).find(key=>fields[key].getAttribute('aria-invalid')==='true')!].focus();return}
submit.disabled=true;submit.textContent='Sending...';
const payload={name:fields.name.value.trim(),email:fields.email.value.trim(),message:fields.message.value.trim()};
try{
const response=await fetch(API+'/public/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
const result=await response.json();
if(!response.ok){status.textContent=result.error||'We could not send your message. Please check your details and try again.';status.classList.add('error');status.setAttribute('role','alert');status.hidden=false;return}
contactForm.reset();Object.keys(fields).forEach(key=>{fields[key].classList.remove('err');fields[key].setAttribute('aria-invalid','false');messages[key].hidden=true});
status.innerHTML='<span class="success-mark" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="m15 27 7 7 15-16"/></svg></span><span class="success-copy"><strong>Message sent!</strong><span>Thanks for reaching out. We’ll reply by email within one working day.</span></span><span class="success-spark" aria-hidden="true">✦</span>';
status.classList.add('success');status.setAttribute('role','status');status.hidden=false;
}catch{status.textContent='Unable to reach the server. Please check your connection and try again.';status.classList.add('error');status.setAttribute('role','alert');status.hidden=false}
finally{submit.disabled=false;submit.innerHTML='Send message <span aria-hidden="true">→</span>'}
});
}
