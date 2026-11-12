import type {CareerResource} from './types';
import {$,esc,m,media,db,call,ok,fd,fld,pgr,ui,A,modal,ask,toast,FV} from './core';

const CATEGORIES=['Study Material','Career Guides','Interview Prep','Resume Templates','Placement Tips','Soft Skills','Courses','Tools','Articles','Others'];
const TYPES=['Guide','Course','Template','Tool','Article','Study Material','Video'];
const list=():CareerResource[]=>db.resources||[];
const fmt=n=>new Intl.NumberFormat('en-IN').format(n);
const typeIcon=(r:CareerResource)=>{const ext=(r.fn||'').split('.').pop()?.toUpperCase();return ext|| (r.url?'LINK':r.ty.toUpperCase())};

function tableRows(rows:CareerResource[]) {
  const page=pgr(rows,8);
  return rows.length?`<div class="tw rm-table"><table><thead><tr><th>#</th><th>Title</th><th>Category</th><th>Type</th><th>Downloads</th><th>Uploaded on</th><th>Status</th><th>Actions</th></tr></thead><tbody>${m(page.rows,(r,i)=>`<tr><td>${page.o+i+1}</td><td><span class="rm-title"><i class="rm-file ${r.file?'has-file':'has-link'}">${esc(typeIcon(r))}</i><span><b>${esc(r.t)}</b>${r.tags?.length?`<small>${esc(r.tags.slice(0,3).join(' · '))}</small>`:''}</span></span></td><td>${esc(r.cat)}</td><td>${esc(r.ty)}</td><td>${fmt(r.dl||0)}</td><td>${r.up?fd(r.up):'—'}</td><td><span class="rm-status ${r.st.toLowerCase()}">${esc(r.st)}</span></td><td><div class="rm-actions">${r.file||r.url?`<a class="ib" href="${esc(media(r.file)||r.url)}" target="_blank" rel="noopener noreferrer" aria-label="Preview ${esc(r.t)}">◉</a>`:''}<button class="ib" data-a="resourceEdit" data-id="${r.id}" aria-label="Edit ${esc(r.t)}">✏️</button><button class="ib dn" data-a="resourceDelete" data-id="${r.id}" aria-label="Delete ${esc(r.t)}">🗑</button></div></td></tr>`)}</tbody></table></div>${page.bar}`:'<div class="emp rm-empty">No resources match these filters. Add a resource or adjust your search.</div>';
}

export function renderResourceManagement() {
  const resources=list(),downloads=resources.reduce((sum,r)=>sum+(r.dl||0),0),published=resources.filter(r=>r.st==='Published').length,
    popular=resources.filter(r=>(r.dl||0)>0).length;
  const counts=CATEGORIES.map(category=>({category,count:resources.filter(r=>r.cat===category).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count);
  const stat=(icon,label,value,tone)=>`<div class="rm-stat ${tone}"><span>${icon}</span><small>${label}</small><b>${fmt(value)}</b></div>`;
  ui.LF=()=>{
    const q=String(FV.q||'').toLowerCase(),rows=resources.filter(r=>(!q||`${r.t} ${r.ds} ${r.cat} ${r.ty} ${(r.tags||[]).join(' ')}`.toLowerCase().includes(q))&&(!FV.rc||r.cat===FV.rc)&&(!FV.rt||r.ty===FV.rt)&&(!FV.rs||r.st===FV.rs));
    return tableRows(rows);
  };
  return `<div class="rm-page"><header class="rm-heading"><span class="rm-heading-icon">▣</span><div><h1>Resource Management</h1><p>Manage career resources, learning materials, guides and more.</p></div><button class="btn fill" data-a="resourceEdit">＋ Add Resource</button></header>
<section class="rm-stats">${stat('▤','Total resources',resources.length,'blue')}${stat('⬇','Total downloads',downloads,'green')}${stat('★','Popular resources',popular,'purple')}${stat('▰','Categories',new Set(resources.map(r=>r.cat)).size,'orange')}</section>
<div class="rm-workspace"><aside class="rm-categories"><div class="rm-section-title"><h2>Resource categories</h2><span>${counts.length}</span></div>${counts.length?m(counts,x=>`<button class="rm-category fl${FV.rc===x.category?' on':''}" data-n="rc" data-v="${esc(x.category)}"><span>▣</span><b>${esc(x.category)}</b><i>${x.count}</i></button>`):'<p class="rm-muted">Categories appear here when resources are added.</p>'}<button class="rm-category rm-all fl${!FV.rc?' on':''}" data-n="rc" data-v=""><span>⌕</span><b>View all resources</b><i>${resources.length}</i></button></aside>
<section class="rm-list-panel"><div class="rm-list-head"><div><h2>All resources</h2><p>Published resources are available in the student portal.</p></div></div>${`<div class="flt rm-filters"><input class="fl" name="q" type="search" placeholder="Search resources..." value="${esc(FV.q||'')}" aria-label="Search resources"><select class="fl" name="rc" aria-label="Filter by category"><option value="">All categories</option>${m(CATEGORIES,c=>`<option value="${esc(c)}" ${FV.rc===c?'selected':''}>${esc(c)}</option>`)}</select><select class="fl" name="rt" aria-label="Filter by type"><option value="">All types</option>${m(TYPES,t=>`<option ${FV.rt===t?'selected':''}>${t}</option>`)}</select><select class="fl" name="rs" aria-label="Filter by status"><option value="">All statuses</option>${m(['Published','Draft'],s=>`<option ${FV.rs===s?'selected':''}>${s}</option>`)}</select></div>`}<div id="lst">${ui.LF()}</div></section></div></div>`;
}

function resourceForm(resource?:CareerResource) {
  const r=resource||({} as CareerResource);
  const fileInfo=r.file?`<div class="rm-current-file"><span class="rm-file has-file">${esc(typeIcon(r))}</span><span><b>${esc(r.fn)}</b><small>Current resource file</small></span><a href="${esc(media(r.file))}" target="_blank" rel="noopener noreferrer">Preview</a></div>`:'';
  const body=`<div class="rm-modal-head"><span>▤</span><p>Share useful learning content with students.</p></div>
<div class="rm-form-grid">${fld('Resource title *','t',r.t||'','text','required maxlength="160" placeholder="e.g. Resume Writing Guide"')}<label>Category *<select name="cat" required>${m(CATEGORIES,c=>`<option ${r.cat===c?'selected':''}>${esc(c)}</option>`)}</select></label>
<label>Resource type *<select name="ty" required>${m(TYPES,t=>`<option ${r.ty===t?'selected':''}>${esc(t)}</option>`)}</select></label><label>Publication status *<select name="st"><option ${!r.st||r.st==='Draft'?'selected':''}>Draft</option><option ${r.st==='Published'?'selected':''}>Published</option></select></label>
<label class="full">Description<textarea name="ds" rows="3" maxlength="2000" placeholder="What will students learn from this resource?">${esc(r.ds||'')}</textarea></label>
<label class="full">Tags <input name="tags" type="text" value="${esc((r.tags||[]).join(', '))}" maxlength="320" placeholder="Resume, Interview, Career"></label>
<label class="full">Resource link <input name="url" type="url" value="${esc(r.url||'')}" maxlength="500" placeholder="https://..."><small>Use a link for courses, tools or articles hosted elsewhere.</small></label>
<div class="full rm-upload">${fileInfo}<label>Upload file <input name="file" type="file" accept=".pdf,.doc,.docx,.zip,.mp4"><small>PDF, DOC, DOCX, ZIP or MP4 · up to 50 MB. Upload a file or provide a link.</small></label>${r.file?`<label class="rm-remove-file"><input type="checkbox" name="removeFile" value="1"> Remove current file (add a link first)</label>`:''}</div></div>`;
  modal(resource?'Edit resource':'Add resource',body,async(values,form)=>{
    const fields=['t','ds','cat','ty','tags','url','st'];
    const file=values.file instanceof File&&values.file.size?values.file:undefined;
    let data:Record<string,string>|FormData=Object.fromEntries(fields.map(key=>[key,values[key]||'']));
    if(file){const formData=new FormData();fields.forEach(key=>formData.append(key,values[key]||''));formData.append('file',file);data=formData}
    if(values.removeFile==='1'&&!(data instanceof FormData))data.removeFile='1';
    return ok(await call(resource?'PUT':'POST',`/admin/resources${resource?'/'+resource.id:''}`,data,resource?'Resource updated':'Resource added'));
  },resource?'Save changes':'Add resource','resource-modal');
}

A.resourceEdit=d=>resourceForm(d.id?list().find(r=>r.id==+d.id):undefined);
A.resourceDelete=d=>ask('Delete this resource? Students will no longer be able to access it.',()=>call('DELETE',`/admin/resources/${d.id}`,undefined,'Resource deleted'));

document.addEventListener('change',e=>{
  const target=e.target as HTMLInputElement;
  if(target.matches('.rm-upload input[type=file]')&&target.files?.[0]){
    const file=target.files[0],ext=file.name.toLowerCase().split('.').pop()||'';
    if(!['pdf','doc','docx','zip','mp4'].includes(ext)){toast('Choose a PDF, DOC, DOCX, ZIP or MP4 file.');target.value='';return}
    if(file.size>50*1024*1024){toast('Resource file must be under 50 MB.');target.value='';}
    else {const url=$('input[name=url]');if(url)url.value='';}
  }
});
