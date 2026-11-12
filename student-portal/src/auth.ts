import {$,S,api,ROLE,esc,LOGO} from './core';

const M=document.body.dataset.m||'login',ST=ROLE=='student',NX=new URLSearchParams(location.search).get('next')||'';
const IC:Record<string,string>={mail:'<path d="M3 6h18v12H3z"/><path d="m3 7 9 7 9-7"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',phone:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'};
const svg=(k:string)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const field=(label:string,name:string,type:string,icon:string,extra='')=>`<label class="fi"><span>${label}</span><div class="ip">${svg(icon)}<input name="${name}" type="${type}" ${extra} required>${type=='password'?`<button type="button" class="eye" aria-label="Show or hide password">${svg('eye')}</button>`:''}</div></label>`;
interface Copy{h:string;p:string;b:string;r:string;l:string[]}
const COPY:Record<string,Copy>={
login:ST?{h:'Welcome back',p:'Sign in to continue your placement journey.',b:'Sign in',r:'Your next opportunity is one login away.',l:['See jobs you are eligible for','Track every application','Get instant status updates']}:{h:'Admin sign in',p:'Manage students, companies, jobs and applications.',b:'Sign in',r:'Run the whole placement cell from one place.',l:['Post jobs with eligibility rules','Update application status in bulk','Live placement reports']},
register:{h:'Create your account',p:"It's free and takes a minute. You will set up your profile next.",b:'Create account',r:'Join CareerTrack. Start your journey towards a better career!',l:['Create your account in a minute','Set up your profile step by step','Get matched with jobs you qualify for']},
forgot:{h:'Reset your password',p:'Enter your email and we will send you a 6 digit code.',b:'Send reset code',r:"Locked out? We'll get you back in.",l:['Secure 6 digit reset code','Valid for 15 minutes','Back to your dashboard in seconds']}};
let stage=1;
function draw(extra:{email?:string;dev?:string}={}){const c=COPY[M],reset=M=='forgot'&&stage==2;
const lnk=M=='login'?(ST?`New here? <a href="register.html">Create an account</a>`:''):M=='register'?'Already have an account? <a href="login.html">Sign in</a>':'<a href="login.html">Back to sign in</a>';
$('#root').innerHTML=`<div class="au2"><section class="aL"><div class="aTop"><a class="logo" href="${ST?'index.html':'#'}">${LOGO.replace('#a995ff','#1b1650')}<span>Career<b>Track</b></span></a>${ST?'<a class="back" href="index.html">← Back to website</a>':'<span class="back">Admin panel</span>'}</div>
<div class="aC"><form id="af" class="afm" novalidate><h1>${reset?'Enter the code':c.h}</h1><p class="mu">${reset?'We sent a 6 digit code to your email.':c.p}</p>
${M=='register'?field('Full name','name','text','user','autocomplete="name" placeholder="e.g. Swara Narkar"'):''}
${field('Email address','email','email','mail',`autocomplete="email" placeholder="you@example.com" value="${esc(extra.email||'')}" ${reset?'readonly':''}`)}
${M=='register'?field('Mobile number','phone','tel','phone','inputmode="numeric" placeholder="98765 43210" autocomplete="tel"'):''}
${reset?field('6 digit code','code','text','key','inputmode="numeric" maxlength="6" placeholder="123456"'):''}
${M=='forgot'&&stage==1?'':field(reset?'New password':'Password','password','password','lock',`autocomplete="${M=='login'?'current-password':'new-password'}" placeholder="••••••••"`)}
${M!='login'&&!(M=='forgot'&&stage==1)?'<div class="meter"><i id="mi"></i></div><small class="mu pwd" id="ml">Use 8+ characters with a letter and a number.</small>':''}
${M=='register'?field('Confirm password','confirm','password','lock','autocomplete="new-password" placeholder="••••••••"'):''}
${M=='login'&&ST?'<div class="rw"><span></span><a href="forgot.html">Forgot password?</a></div>':''}
<button class="sub">${reset?'Reset password':c.b}</button><p class="em" id="em" role="alert" hidden></p>${extra.dev?`<p class="hint">Development mode: your code is <b>${extra.dev}</b> (also printed in the backend terminal).</p>`:''}
<p class="alt">${lnk}</p>${M=='login'?`<p class="hint">Demo login: <b>${ST?'swara@example.com / student123':'admin@careertrack.com / admin123'}</b></p>`:''}</form></div><p class="aF">© ${new Date().getFullYear()} CareerTrack</p></section>
<aside class="aR"><div class="mesh"></div><div class="aRi"><img src="assets/img/hero-jobs.svg" alt=""><h2>${c.r}</h2><ul>${c.l.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="hc c1">💼 Eligibility in one click</div><div class="hc c2">🔔 Instant status updates</div></aside></div>`;
const af:HTMLFormElement=$('#af'),er=(t:string)=>{const x=$('#em');x.textContent=t;x.hidden=!t};
af.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest('.eye');if(b){const i=b.previousElementSibling as HTMLInputElement;i.type=i.type=='password'?'text':'password'}});
const p=af.elements.namedItem('password') as HTMLInputElement|null;
if(p&&$('#mi'))p.oninput=()=>{const v=p.value,s=+(v.length>=8)+ +/[A-Z]/.test(v)+ +/\d/.test(v)+ +/[^A-Za-z0-9]/.test(v),i=$('#mi');i.style.width=(v?s*25:0)+'%';i.style.background=['#e5484d','#e5484d','#f5a524','#18b26b','#18b26b'][s];$('#ml').textContent=v?['Weak','Weak','Fair','Strong','Very strong'][s]+' password':'Use 8+ characters with a letter and a number.'};
af.onsubmit=async e=>{e.preventDefault();er('');const f:Record<string,string>=Object.fromEntries(new FormData(af)) as any;f.email=(f.email||'').trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(f.email))return er('Enter a valid email address.');
if(M=='register'){if((f.name||'').trim().length<2)return er('Enter your full name.');if(!/^[6-9]\d{9}$/.test(String(f.phone).replace(/\D/g,'').slice(-10)))return er('Enter a valid 10 digit mobile number.');if(f.password!=f.confirm)return er('Passwords do not match.')}
if(f.password!==undefined&&f.password.length<(M=='login'?1:8))return er('Password must be at least 8 characters.');
const btn:HTMLButtonElement=$('.sub');btn.disabled=true;
try{if(M=='login'){const r=await api('POST','/auth/login',{email:f.email,password:f.password,role:ROLE});S.set(ROLE+'tok',r.token);location.href=ST?(r.onboarded?(/^app\.html#\//.test(NX)?NX:'app.html#/dashboard'):'onboarding.html'):'app.html#/dashboard'}
else if(M=='register'){const r=await api('POST','/auth/register',{name:f.name.trim(),email:f.email,phone:f.phone,password:f.password});S.set('studenttok',r.token);location.href='onboarding.html#/2'}
else if(stage==1){const r=await api('POST','/auth/forgot',{email:f.email});stage=2;draw({email:f.email,dev:r.dev_code})}
else{await api('POST','/auth/reset',{email:f.email,code:f.code,password:f.password});location.href='login.html'}}
catch(x:any){er(x.error||'Something went wrong');btn.disabled=false}}}
draw();
