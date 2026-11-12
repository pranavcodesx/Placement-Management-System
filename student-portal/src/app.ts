import {$,S,esc,m,db,call,ok,co,job,fd,ago,badge,empty,pkmax,left,offer,elig,canApply,head,tbl,pgr,toast,modal,ask,V404,FV,ui,A,F,rr,start,DAY} from './core';
import {ME,chips,SEC} from './profile';
import {renderDashboard} from './dashboard';
import {renderProfile,renderPortfolioPage} from './myprofile';
import {renderJobs,renderJob} from './jobs';
import {renderCareerResources} from './resources';
import './types';
if(!S.get('studenttok')){location.replace('login.html');throw 0}
const mine=()=>db.apps.filter(a=>a.s==ME().id),has=(s,k)=>s.sk.some(x=>x.toLowerCase()==k.toLowerCase()),interviewsFor=a=>db.iv.filter(i=>i.a==a.id).sort((x,y)=>x.at-y.at),hasInterview=a=>interviewsFor(a).length>0;
const CK=s=>[['Personal information',s.sec.personal,'profile'],['Education details',s.sec.education,'education'],['Skills (3 or more technical)',s.sec.skills,'skills'],['Projects or certifications',s.sec.projects,'projects'],['Resume',s.sec.resume,'resume'],['Career preferences',s.sec.prefs,'prefs']];
const norm=x=>String(x).toLowerCase().replace(/[- ]/g,'');
const hit=(s,j)=>{const p=s.pref;return{loc:p.locs.some(l=>l.toLowerCase()==j.l.toLowerCase()),cat:p.cats.includes(j.cat),role:p.roles.some(r=>r.toLowerCase().split(' ').some(w=>w.length>3&&j.t.toLowerCase().includes(w))),sal:p.sal&&pkmax(j.pk)>=p.sal}};
const rank=(s,j)=>{const h=hit(s,j);return elig(s,j).m+(h.loc?10:0)+(h.cat?10:0)+(h.role?10:0)+(h.sal?5:0)};
const chk=(l,need,have,ok)=>`<div class="ck"><span>${ok?'✅':'❌'} ${l}</span><small>${need} · you: ${have}</small></div>`;
const dlt=j=>{const r=left(j.dl);return r<0?'<span class="b rejected">Closed</span>':r<=7?`<span class="b shortlisted">${r==0?'Last day':r+' day'+(r>1?'s':'')+' left'}</span>`:`<span>⏰ ${fd(j.dl)}</span>`};
const jc=(j,s)=>{const e=elig(s,j),a=db.apps.find(x=>x.s==s.id&&x.j==j.id),c=co(j.c),h=hit(s,j);return`<article class="card job"><div class="co">${esc(c.n[0])}</div><div><h4>${esc(j.t)}</h4><small>${esc(c.n)} · ${esc(j.l)}</small></div><div class="mr" style="--v:${e.m}" title="Skills match"><b>${e.m}%</b></div><div class="sk ro">${m(j.sk,k=>`<span class="${has(s,k)?'ok':'no'}">${esc(k)}</span>`)}</div><div class="jm"><span>💰 ${esc(j.pk)}</span>${dlt(j)}${h.loc||h.cat||h.role?'<span class="b applied">★ Matches your preferences</span>':''}</div><div class="jf">${a?badge(a.st):e.ok?'<span class="b selected">Eligible</span>':'<span class="b rejected">Not eligible</span>'}<a class="btn fill sm" href="#/job/${j.id}">View details</a></div></article>`};
const sec=k=>head(SEC[k].t,SEC[k].s)+`<section class="pn">${SEC[k].render(ME(),'full')}</section>`;
const V={
dashboard:()=>renderDashboard({CK,dlt}),
resources:renderCareerResources,
profile:a=>renderProfile(a),education:()=>renderProfile('academic'),skills:()=>renderProfile('skills'),projects:()=>renderPortfolioPage('projects'),certificates:()=>renderPortfolioPage('certificates'),resume:()=>renderProfile('docs'),prefs:()=>renderProfile('skills'),
jobs:()=>renderJobs({rank,has,hit}),job:id=>renderJob(id,{rank,has,hit}),
applications(){
const apps=mine(),tabs=[
{value:'',label:'All Applications',count:apps.length,icon:'▦'},
{value:'Applied',label:'Applied',count:apps.filter(a=>a.st=='Applied').length,icon:'➤'},
{value:'In Review',label:'In Review',count:apps.filter(a=>a.st=='In Review').length,icon:'◷'},
{value:'Shortlisted',label:'Shortlisted',count:apps.filter(a=>a.st=='Shortlisted').length,icon:'✓'},
{value:'Interview',label:'Interview',count:apps.filter(a=>a.st=='Interview'||hasInterview(a)).length,icon:'♟'},
{value:'Selected',label:'Selected',count:apps.filter(a=>a.st=='Selected').length,icon:'★'},
{value:'Rejected',label:'Rejected',count:apps.filter(a=>a.st=='Rejected').length,icon:'×'},
{value:'Closed',label:'Application closed',count:apps.filter(a=>a.st=='Closed').length,icon:'−'}
];
const status=a=>a.st=='Selected'?{label:'Selected',cls:'offer'}:a.st=='Rejected'?{label:'Rejected',cls:'rejected'}:a.st=='Closed'?{label:'Application closed',cls:'rejected'}:a.st=='Interview'||hasInterview(a)?{label:'Interview scheduled',cls:'interview'}:a.st=='In Review'?{label:'In review',cls:'review'}:a.st=='Shortlisted'?{label:'Shortlisted',cls:'review'}:{label:'Applied',cls:'review'};
ui.LF=()=>{
const period=FV.period===undefined?'6':FV.period,cutoff=period?Date.now()-Number(period)*30.4375*DAY:0;
const filtered=apps.filter(a=>{
const hasStatus=!FV.st||a.st==FV.st||(FV.st=='Interview'&&hasInterview(a));
const hasJob=!FV.appJob||String(a.j)==FV.appJob;
const hasDate=!cutoff||new Date(a.dt).getTime()>=cutoff;
return hasStatus&&hasJob&&hasDate;
}).sort((a,b)=>b.dt.localeCompare(a.dt));
if(!filtered.length)return `<div class="app-empty">${empty('No applications match these filters. Try changing your selection or browse available jobs.')}</div>`;
return `<div class="application-list">${m(filtered,a=>{
const j=job(a.j),company=co(j.c),last=a.h[a.h.length-1]||{dt:a.dt},state=status(a);
return `<article class="application-card">
<div class="application-company-mark" aria-hidden="true">${esc(company.n.slice(0,1).toUpperCase())}</div>
<div class="application-main"><div class="application-title-row"><div><h2>${esc(j.t)}</h2><p>${esc(company.n)} <span>·</span> ${esc(j.l)}</p></div><span class="application-state ${state.cls}"><i></i>${state.label}</span></div>
<div class="application-skills">${m(j.sk.slice(0,3),skill=>`<span>${esc(skill)}</span>`)}</div>
<div class="application-meta"><span><i>▣</i> Applied on ${fd(a.dt)}</span><span><i>↻</i> Updated ${fd(last.dt)}</span></div></div>
<div class="application-actions"><a class="btn sm" href="#/track/${a.id}">Track application</a><a class="application-job-link" href="#/job/${j.id}">View job details <span>↗</span></a>${a.st=='Applied'?`<button class="application-withdraw" data-a="wd" data-id="${a.id}">Withdraw</button>`:''}</div>
</article>`;
})}</div><p class="application-results" aria-live="polite">Showing ${filtered.length} of ${apps.length} applications</p>`;
};
const jobs=[...new Map(apps.map(a=>{const j=job(a.j);return[j.id,j.t]}).entries())];
const filterDropdown=(id,name,label,selected,options)=>`<div class="application-select app-filter-dropdown" id="${id}"><span class="sr-only">${label}</span><button type="button" class="application-select-trigger" data-app-filter-toggle aria-haspopup="listbox" aria-expanded="false" aria-label="${label}: ${esc(selected.label)}" aria-controls="${id}-options"><span class="application-select-icon">${id.endsWith('job')?'▣':'◷'}</span><span class="application-select-value">${esc(selected.label)}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="application-select-menu" id="${id}-options" role="listbox" aria-label="${label}" aria-hidden="true">${m(options,o=>`<button type="button" class="application-select-option" role="option" aria-selected="${o.value===selected.value}" tabindex="-1" data-app-filter-option data-name="${name}" data-value="${esc(o.value)}" data-label="${esc(o.label)}"><span>${esc(o.label)}</span><i aria-hidden="true">${o.value===selected.value?'✓':''}</i></button>`)}</div></div>`;
return `<div class="applications-page">${head('My Applications','Track and manage all your job applications in one place.','<button class="btn application-refresh" data-a="refreshApps"><span>↻</span> Refresh</button>')}
<nav class="application-tabs" aria-label="Filter applications by status">${m(tabs,t=>`<button class="application-tab fl ${(FV.st||'')==t.value?'on':''}" data-n="st" data-v="${t.value}" aria-pressed="${(FV.st||'')==t.value}"><span class="application-tab-icon">${t.icon}</span><span>${t.label}</span><b>${t.count}</b></button>`)}</nav>
<div class="application-filters">${filterDropdown('app-filter-job','appJob','Filter by job',{value:FV.appJob||'',label:FV.appJob?jobs.find(([id])=>String(id)===FV.appJob)?.[1]||'All jobs':'All jobs'},[{value:'',label:'All jobs'},...jobs.map(([id,title])=>({value:String(id),label:title}))])}
${filterDropdown('app-filter-date','period','Filter by date',{value:FV.period===undefined?'6':FV.period,label:(FV.period===undefined?'6':FV.period)==='6'?'Last 6 months':FV.period==='12'?'Last 12 months':'Any time'},[{value:'6',label:'Last 6 months'},{value:'12',label:'Last 12 months'},{value:'',label:'Any time'}])}
<span class="application-filter-note">Use the tabs above to filter by status</span></div><div id="lst">${ui.LF()}</div></div>`;
},
track(id){
const a=db.apps.find(x=>x.id==id&&x.s==ME().id);if(!a)return V404();
const j=job(a.j),history=a.h||[],rounds=interviewsFor(a),terminal=['Rejected','Closed'].includes(a.st),
stages=['Applied','In Review','Shortlisted','Interview','Selected'],
idx=terminal?Math.max(0,...history.map(h=>stages.indexOf(h.st)).filter(i=>i>=0)):Math.max(0,stages.indexOf(a.st)),
eventFor=key=>history.filter(h=>h.st==key).slice(-1)[0],
when=key=>{const h=eventFor(key);if(key=='Interview'&&rounds.length)return`Scheduled ${new Date(rounds[0].at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`;return h?fd(h.dt):'Completed'},
message=a.st=='Rejected'?'This application was rejected. Check the timeline for the last completed stage.':a.st=='Closed'?'This application has been closed by the placement team.':a.st=='Selected'?'Congratulations! You have been selected.':a.st=='Interview'?'An interview has been scheduled. Review the round details below.':a.st=='Shortlisted'?'Your application has been shortlisted.':a.st=='In Review'?'Your application is being reviewed.':'Your application has been received. We will update you here.',
outcome=a.st=='Closed'?'Application closed':a.st=='Rejected'?'Rejected':'';
return`<a class="mu" href="#/applications">← My applications</a><h1 class="ttl" style="margin-top:10px">Application Tracking</h1><p class="sub">${esc(j.t)} at ${esc(co(j.c).n)}</p><section class="pn"><ol class="tr">${m(stages,(stage,i)=>{const done=terminal?i<=idx:i<idx,active=i==idx&&!terminal,actual=stage=='Applied'?{dt:a.dt}:eventFor(stage);return`<li class="${done?'dc':active?'cur':''}"><i>${done?'✓':i+1}</i>${stage}<small>${actual?fd(actual.dt):stage=='Interview'&&rounds.length?when(stage):done?'Completed':'Pending'}</small></li>`})}${outcome?`<li class="bad cur"><i>${a.st=='Rejected'?'×':'−'}</i>${outcome}<small>${eventFor(a.st)?fd(eventFor(a.st).dt):'Updated by placement team'}</small></li>`:''}</ol><div class="res ${terminal?'no':'ok'}">${message}</div>${rounds.length?`<section class="application-interviews"><h3>Interview rounds</h3>${m(rounds,i=>`<div class="application-interview"><b>${esc(i.r)}</b><span>${new Date(i.at).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span><small>${esc(i.md)}${i.lc?' · '+esc(i.lc):''}</small></div>`)}</section>`:''}<div class="acts"><a class="btn" href="#/job/${j.id}">View job</a>${a.st=='Applied'?`<button class="btn dn" data-a="wd" data-id="${a.id}">Withdraw application</button>`:''}</div></section>`},
notifications(){const n=db.nt.slice().sort((a,b)=>b.tm-a.tm);return head('Notifications','Stay updated with latest activities','<button class="btn" data-a="readAll">Mark all as read</button>')+(m(n,x=>`<div class="pn row nt ${x.rd?'':'un'}"><div class="ic">🔔</div><div class="grow">${esc(x.t)}</div><small class="mu">${ago(x.tm)}</small></div>`)||empty('You are all caught up.'))},
settings(){const s=ME();return head('Settings','Manage your account')+`<section class="pn"><h3>Account</h3><p><b>${esc(s.n)}</b><br><span class="mu">${esc(s.e)} · ${esc(s.ph)}</span></p><p class="mu" style="margin-top:8px">To change your name or mobile number, edit your <a href="#/profile" style="color:var(--p)"><b>profile</b></a>.</p></section><section class="pn"><h3>Change password</h3><form data-f="pw" class="fg2"><label>Current password<input name="o" type="password" autocomplete="current-password" required></label><label>New password<input name="n" type="password" autocomplete="new-password" minlength="8" required></label><div class="full"><button class="btn fill">Update password</button></div></form></section>`}};
F.pw=async(d,f)=>{if(await call('POST','/student/password',{old:d.o,new:d.n},'Password updated',false))f.reset()};
A.readAll=()=>call('POST','/student/notifications/read',{},'All marked as read');
A.refreshApps=()=>call('GET','/student/bootstrap',undefined,'Applications refreshed');
A.apply=d=>{const s=ME(),j=job(d.id),c=canApply(s,j);if(!c.ok)return toast(c.m);modal('Submit application',`<p>You are applying for <b>${esc(j.t)}</b> at <b>${esc(co(j.c).n)}</b>.</p><p class="mu" style="margin-top:8px">Your profile and resume (${esc(s.rs)}) will be shared with the placement cell. You can withdraw until you are shortlisted.</p>`,async()=>ok(await call('POST','/student/applications',{job:j.id},'Application submitted')),'Submit application')};
A.wd=d=>ask('Withdraw this application? You can apply again before the deadline.',async()=>{if(await call('DELETE','/student/applications/'+d.id,undefined,'Application withdrawn',false)){location.hash=='#/applications'?rr():location.hash='#/applications'}});
start({role:'Student Portal',home:'index.html',guard:()=>{if(!ME().ob){location.replace('onboarding.html');return false}},nav:[['dashboard','▦','Dashboard'],['profile','👤','My Profile'],['projects','🧩','Projects'],['certificates','🏅','Certificates'],['jobs','💼','Job Opportunities'],['applications','📨','My Applications'],['notifications','🔔','Notifications'],['resources','📚','Career Resources'],['settings','⚙️','Settings']],al:{job:'jobs',track:'applications'},views:V,to:'login.html',sp:'Search jobs',sv:'jobs',pf:'profile',user:ME,unread:()=>db.nt.filter(x=>!x.rd).length});
