import type {CareerResource} from './types';
import {$,esc,m,media,db,call,toast,ui,A} from './core';

const TYPES=['All resources','Guides','Courses','Templates','Tools','Articles'];
const ICONS:Record<string,string>={Guide:'▣',Course:'▤',Template:'▧',Tool:'⌘',Article:'✦','Study Material':'▥',Video:'▶'};
let activeType='All resources',activeCategory='All categories',query='';
const resources=():CareerResource[]=>db.resources||[];
const typeMatch=(r:CareerResource)=>activeType==='All resources'||(activeType==='Guides'?['Guide','Study Material'].includes(r.ty):r.ty===activeType.slice(0,-1)||r.ty===activeType);

function cards(rows:CareerResource[]) {
  if(!rows.length)return '<div class="cr-empty"><span>⌕</span><h3>No resources found</h3><p>Try a different search or category.</p></div>';
  return m(rows,r=>`<article class="cr-card"><div class="cr-card-art ${r.ty.toLowerCase().replace(/\s/g,'-')}"><span>${ICONS[r.ty]||'▤'}</span><small>${esc(r.ty)}</small></div><div class="cr-card-content"><div class="cr-card-meta"><span>${esc(r.cat)}</span><span class="cr-kind">${esc(r.ty)}</span></div><h3>${esc(r.t)}</h3><p>${esc(r.ds||'Explore this resource to build your career skills.')}</p>${r.tags?.length?`<div class="cr-tags">${m(r.tags.slice(0,3),t=>`<span>${esc(t)}</span>`)}</div>`:''}<div class="cr-card-foot"><span>${r.file?`▧ ${esc((r.fn||'File').split('.').pop()?.toUpperCase()||'FILE')}`:'↗ External link'}${r.dl?` · ${new Intl.NumberFormat('en-IN').format(r.dl)} opens`:''}</span><button class="btn fill sm" data-a="resourceOpen" data-id="${r.id}">${r.ty==='Tool'?'Open tool':'Explore'} <b>→</b></button></div></div></article>`);
}

function renderCards() {
  const all=resources().filter(r=>typeMatch(r)&&(!activeCategory||activeCategory==='All categories'||r.cat===activeCategory)&&(!query||`${r.t} ${r.ds} ${r.cat} ${r.ty} ${(r.tags||[]).join(' ')}`.toLowerCase().includes(query)));
  const grid=$('#cr-grid');if(grid)grid.innerHTML=cards(all);
  const count=$('#cr-count');if(count)count.textContent=`${all.length} resource${all.length===1?'':'s'}`;
}

export function renderCareerResources() {
  activeType='All resources';activeCategory='All categories';query='';
  const cats=[...new Set(resources().map(r=>r.cat))];
  const featured=resources().slice().sort((a,b)=>(b.dl||0)-(a.dl||0))[0];
  return `<div class="cr-page"><section class="cr-hero"><div class="cr-hero-copy"><span class="cr-eyebrow"><i></i> YOUR CAREER, YOUR NEXT STEP</span><h1>Resources to help<br>you <em>move forward.</em></h1><p>Explore hand-picked guides, courses, templates and tools to help you learn, prepare and get hired.</p><div class="cr-hero-stats"><span><b>${resources().length}</b> useful resources</span><i></i><span><b>${cats.length}</b> categories</span></div></div><div class="cr-hero-art" aria-hidden="true"><div class="cr-orbit cr-orbit-one"></div><div class="cr-orbit cr-orbit-two"></div><div class="cr-hero-book">✧<small>LEARN<br>GROW<br>THRIVE</small></div><span class="cr-float cr-float-one">↗</span><span class="cr-float cr-float-two">✦</span><span class="cr-float cr-float-three">⌘</span></div><div class="cr-hero-bottom"><span>✦ &nbsp;Curated for your career journey</span><span>Find your next opportunity to grow &nbsp;→</span></div></section>
<div class="cr-explore"><div class="cr-main"><div class="cr-heading"><div><span class="cr-kicker">LEARN SOMETHING NEW</span><h2>Explore career resources</h2><p>Everything you need to feel ready for what's next.</p></div><label class="cr-search"><span>⌕</span><input id="cr-search" type="search" placeholder="Search resources..." aria-label="Search resources"><kbd>Search</kbd></label></div>
<section class="cr-categories"><div class="cr-label-row"><h3>Browse by category</h3><span>${cats.length} categories</span></div><div class="cr-category-list"><button class="cr-category on" data-category="All categories"><span>✦</span>All resources</button>${m(cats,c=>`<button class="cr-category" data-category="${esc(c)}"><span>${c==='Courses'?'▤':c==='Tools'?'⌘':c==='Articles'?'✧':'▣'}</span>${esc(c)}</button>`)}</div></section>
<div class="cr-tabs" role="tablist" aria-label="Resource types">${m(TYPES,t=>`<button role="tab" aria-selected="${t==='All resources'}" class="${t==='All resources'?'on':''}" data-type="${esc(t)}">${esc(t)}</button>`)}</div>
<div class="cr-result-head"><h3>Learning library</h3><span id="cr-count">${resources().length} resource${resources().length===1?'':'s'}</span></div><div class="cr-grid" id="cr-grid">${cards(resources())}</div></div>
<aside class="cr-side"><section class="cr-side-card cr-featured"><span class="cr-side-kicker">FEATURED RESOURCE</span>${featured?`<div class="cr-feature-icon">${ICONS[featured.ty]||'▤'}</div><span class="cr-feature-cat">${esc(featured.cat)}</span><h3>${esc(featured.t)}</h3><p>${esc(featured.ds||'A hand-picked resource to support your next career step.')}</p><button class="cr-text-link" data-a="resourceOpen" data-id="${featured.id}">Explore resource <b>→</b></button>`:'<h3>Coming soon</h3><p>New learning resources will appear here.</p>'}</section><section class="cr-side-card cr-tip"><div class="cr-tip-icon">✦</div><div><h3>Make it count</h3><p>Set aside 20 minutes to explore one new resource today. Small steps add up.</p></div></section><a class="cr-help" href="#/profile">Ready to apply? Make sure your resume is up to date <b>→</b></a></aside></div></div>`;
}

A.resourceOpen=async data=>{
  const resource=resources().find(r=>r.id===+data.id);
  if(!resource)return toast('This resource is no longer available.');
  const tab=window.open('about:blank','_blank');
  const result=await call('POST',`/student/resources/${resource.id}/open`,{},undefined,false);
  if(!result){tab?.close();return}
  const url=media(result.url);
  if(!url){tab?.close();return toast('This resource is not available.')}
  if(tab){tab.opener=null;tab.location.href=url}else location.href=url;
  const updated=resources().find(r=>r.id===resource.id);
  if(updated)updated.dl=result.downloads;
  renderCards();
};

document.addEventListener('input',e=>{
  const target=e.target as HTMLInputElement;
  if(target.id==='cr-search'){query=target.value.trim().toLowerCase();renderCards()}
});
document.addEventListener('click',e=>{
  const target=(e.target as HTMLElement).closest('[data-type],[data-category]') as HTMLElement|null;
  if(!target)return;
  if(target.dataset.type){activeType=target.dataset.type;document.querySelectorAll('[data-type]').forEach(x=>{x.classList.toggle('on',(x as HTMLElement).dataset.type===activeType);x.setAttribute('aria-selected',String((x as HTMLElement).dataset.type===activeType))})}
  if(target.dataset.category){activeCategory=target.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('on',(x as HTMLElement).dataset.category===activeCategory))}
  renderCards();
});
