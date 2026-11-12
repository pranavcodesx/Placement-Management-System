import type {Student} from './types';
import {$, $$, esc, m, media, fd, A} from './core';
import {ME, SEC, SKC, renderPortfolio} from './profile';

/* My Profile page. Four tabs, each holding the sections that belong to it:
     Personal info        -> personal
     Academic details     -> education
     Skills & interests   -> skills + career preferences
     Resume               -> resume
   Every card shows the saved data and has an Edit button that swaps the card for the SAME form the sign-up
   wizard uses (profile.ts), so what is collected at sign-up is exactly what is editable here. */

type Tab = 'personal' | 'academic' | 'skills' | 'docs';
const TABS: {id: Tab; label: string; ic: string; secs: string[]}[] = [
  {id: 'personal', label: 'Personal info', ic: 'user', secs: ['personal']},
  {id: 'academic', label: 'Academic details', ic: 'cap', secs: ['education']},
  {id: 'skills', label: 'Skills & interests', ic: 'star', secs: ['skills', 'prefs']},
  {id: 'docs', label: 'Resume', ic: 'doc', secs: ['resume']},
];
const NEXT_ROUTE: Record<string, string> = {personal: '#/profile/personal', education: '#/profile/academic', skills: '#/profile/skills',
  prefs: '#/profile/skills', projects: '#/projects', resume: '#/profile/docs'};
const NEXT: Record<string, string> = {personal: 'your personal details', education: 'your academic details', skills: 'at least 3 technical skills',
  prefs: 'your career interests', projects: 'a project or certification', resume: 'your resume'};
const META: Record<string, {t: string; s: string; ic: string}> = {
  personal: {t: 'Personal information', s: 'Your basic personal details', ic: 'user'},
  education: {t: 'Academic information', s: 'Your educational background', ic: 'cap'},
  skills: {t: 'Skills', s: 'Technical and soft skills that are matched with jobs', ic: 'star'},
  prefs: {t: 'Career interests', s: 'Roles, places and fields you want to work in', ic: 'target'},
};

const IC: Record<string, string> = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  cap: '<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/><path d="M6.5 12v4.5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.800V12M21.5 9.500v6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.200L3 9.600l6.2-.900L12 3Z"/>',
  doc: '<path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v4h4M10 12h5m-5 3.500h5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4m8-4v4M3.5 10h17"/>',
  gender: '<circle cx="10" cy="14" r="4.5"/><path d="m13.5 10.5 6-6m0 0h-4.500m4.5 0v4.5"/>',
  edit: '<path d="m4 20 1-4L16.5 4.500a2.1 2.1 0 0 1 3 3L8 19l-4 1Z"/><path d="m14.5 6.5 3 3"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3.5"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  upload: '<path d="M12 16V5m0 0-4 4m4-4 4 4M5 20h14"/>',
  check: '<path d="m5 12.5 4.5 4.500L19 7"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z"/>',
  book: '<path d="M4 5.500A2.5 2.5 0 0 1 6.5 3H20v15H6.500A2.5 2.5 0 0 0 4 20.500v-15Z"/><path d="M4 20.500A2.5 2.5 0 0 0 6.5 23H20"/>',
  percent: '<path d="m19 5-14 14"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4.500M12 17.500v.01"/>',
  trash: '<path d="M4 7h16M10 3h4M6 7l1 13h10l1-13"/>',
};
const ico = (k: string, c = '') => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const val = (v: any) => (v === '' || v == null || v === 0 ? '<span class="pf-na">Not added</span>' : esc(v));
const item = (ic: string, label: string, v: string, wide = false) =>
  `<div class="pf-it${wide ? ' wide' : ''}"><span class="pf-ico">${ico(ic)}</span><div><small>${label}</small><b>${v}</b></div></div>`;
const chips = (a: string[]) => a.length ? `<div class="pf-chips">${m([...new Set(a)], x => `<span class="pf-chip">${esc(x)}</span>`)}</div>` : '<span class="pf-na">Not added</span>';

/* ---- read-only views of each card ---- */
const VIEW: Record<string, (s: Student) => string> = {
  personal: s => `<div class="pf-items">${item('user', 'Full name', val(s.n))}${item('user', 'Gender', val(s.gn))}${item('mail', 'Email address', val(s.e))}${item('cal', 'Date of birth', s.dob ? esc(fd(s.dob)) : val(''))}${item('phone', 'Mobile number', val(s.ph))}${item('pin', 'Current location', val(s.loc))}${item('home', 'Address', val(s.ad), true)}</div>`,
  education: s => `<div class="pf-items">${item('cap', 'Degree / program', val(s.deg))}${item('percent', s.sty == 'CGPA' ? 'Graduation CGPA' : 'Graduation percentage', s.sc ? esc(s.sc) + (s.sty == 'CGPA' ? ` <em>(≈ ${s.pct}%)</em>` : '%') : val(''))}${item('book', 'Branch / department', s.col ? val(s.d) : val(''))}${item('home', 'College', val(s.col))}${item('cal', 'Current year', val(s.yr))}${item('cal', 'Expected graduation', val(s.py))}${item('percent', '10th percentage', s.p10 ? esc(s.p10) + '%' : val(''))}${item('percent', '12th / diploma percentage', s.p12 ? esc(s.p12) + '%' : val(''))}${item('alert', 'Active backlogs', s.col ? esc(s.bk || 0) : val(''))}</div>`,
  skills: s => {
    const tech = s.skills.filter(x => x.c != 'soft').length, groups = SKC.map(c => [c[1], s.skills.filter(x => x.c == c[0]).map(x => x.n)] as [string, string[]]).filter(g => g[1].length);
    return (groups.length ? m(groups, g => `<div class="pf-grp"><h3>${g[0]}</h3>${chips(g[1])}</div>`) : '<p class="pf-na pf-blank">No skills added yet.</p>')
      + (tech < 3 ? `<p class="pf-warn">${ico('alert')}Add at least 3 technical skills (${tech} so far). Soft skills do not count. Skills are matched with each job’s requirements.</p>` : '');
  },
  prefs: s => `<div class="pf-grp"><h3>Preferred job roles</h3>${chips(s.pref.roles)}</div><div class="pf-grp"><h3>Preferred locations</h3>${chips(s.pref.locs)}</div><div class="pf-grp"><h3>Employment type</h3>${chips(s.pref.types)}</div><div class="pf-grp"><h3>Expected salary</h3>${s.pref.sal ? `<b class="pf-sal">₹ ${esc(s.pref.sal)} LPA</b>` : '<span class="pf-na">Not added</span>'}</div><div class="pf-grp"><h3>Fields you are interested in</h3>${chips(s.pref.cats)}</div>`,
};

let open = '';        // the card that is currently being edited (only one at a time)
const inner = (k: string, ed: boolean) => {
  const M = META[k];
  return `<div class="pf-ch"><span class="pf-cic">${ico(M.ic)}</span><div><h2>${M.t}</h2><p>${M.s}</p></div>${ed ? `<button type="button" class="pf-btn" data-a="pfCancel" data-k="${k}">Cancel</button>` : `<button type="button" class="pf-btn" data-a="pfEdit" data-k="${k}">${ico('edit')}Edit</button>`}</div>${ed ? `<div class="pf-form">${SEC[k].render(ME(), 'card')}</div>` : VIEW[k](ME())}`;
};
const card = (k: string) => `<section class="pf-card" data-card="${k}">${inner(k, false)}</section>`;
const draw = (k: string, ed: boolean) => { const el = $(`[data-card="${k}"]`); if (!el) return; el.innerHTML = inner(k, ed); el.classList.toggle('ed', ed); };

A.pfEdit = d => {
  if (open && open !== d.k) draw(open, false);
  open = d.k; draw(d.k, true);
  const f: HTMLElement | null = document.querySelector(`[data-card="${d.k}"] input:not([type=hidden]), [data-card="${d.k}"] select`); f && f.focus();
};
A.pfCancel = d => { draw(d.k, false); open = ''; };
A.rfPick = () => $('#rf').click();

/* ---- resume ---- */
function resumeCard(s: Student) {
  const ext = (s.rs.split('.').pop() || 'pdf').toUpperCase().slice(0, 4);
  return `<section class="pf-card" data-card="resume"><div class="pf-ch"><span class="pf-cic">${ico('doc')}</span><div><h2>Resume</h2><p>Recruiters see this when you apply. PDF, DOC or DOCX, up to 5 MB.</p></div></div>
${s.rs ? `<div class="pf-file"><span class="pf-ext">${esc(ext)}</span><div class="pf-file-tx"><b>${esc(s.rs)}</b><small>${s.rsd ? 'Uploaded on ' + esc(fd(s.rsd)) : 'Uploaded'}</small></div><div class="pf-file-act"><a class="pf-btn" href="${esc(media(s.rsu))}" target="_blank" rel="noopener">View</a><a class="pf-btn" href="${esc(media(s.rsu))}" download="${esc(s.rs)}">${ico('download')}Download</a><button type="button" class="pf-btn" data-a="rfPick">${ico('upload')}Replace</button><button type="button" class="pf-btn danger" data-a="rsD">${ico('trash')}Remove</button></div></div>`
  : `<label class="dz" for="rf"><span>☁️</span><b>Drag &amp; drop your resume here</b><small class="mu">or click to browse · PDF, DOC, DOCX · max 5 MB</small></label><p class="pf-warn">${ico('alert')}A resume is required before you can apply for jobs.</p>`}
<input id="rf" type="file" accept=".pdf,.doc,.docx" hidden></section>`;
}

/* ---- left profile card ---- */
function side(s: Student) {
  const miss = ['personal', 'education', 'skills', 'prefs', 'projects', 'resume'].find(k => !s.sec[k]), R = 36, C = 2 * Math.PI * R;
  const head = [s.deg, s.col ? s.d : ''].filter(Boolean).join(' · ');
  return `<aside class="pf-side"><div class="pf-cover"></div>
<div class="pf-av">${s.photo ? `<img src="${esc(media(s.photo))}" alt="Profile photo">` : `<span>${esc(s.n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase())}</span>`}<button type="button" class="pf-cam" data-a="photo" aria-label="${s.photo ? 'Change' : 'Upload'} profile photo">${ico('camera')}</button><input id="pf" type="file" accept="image/jpeg,image/png,image/webp" hidden></div>
${s.photo ? '<button type="button" class="pf-rm" data-a="photoD">Remove photo</button>' : '<small class="pf-hint">JPG, PNG or WEBP · max 2 MB</small>'}
<h2 class="pf-name">${esc(s.n)}</h2>${head ? `<p class="pf-sub">${esc(head)}</p>` : ''}${s.col ? `<p class="pf-sub2">${esc(s.col)}</p>` : ''}
<span class="pf-pill${s.pp >= 100 ? '' : ' warn'}">${ico(s.pp >= 100 ? 'check' : 'alert')}Profile ${s.pp}% complete</span>
<div class="pf-ring"><svg viewBox="0 0 84 84" role="img" aria-label="Profile ${s.pp}% complete"><circle cx="42" cy="42" r="${R}" fill="none" stroke="#e9ecfb" stroke-width="9"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="${s.pp >= 100 ? '#12a566' : '#3f5cf0'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C * s.pp / 100} ${C}" transform="rotate(-90 42 42)"/></svg><b>${s.pp}%</b>
<div><h3>${s.pp >= 100 ? 'Profile complete' : 'Keep going'}</h3><p>${miss ? `Next: add ${NEXT[miss]}. <a href="${NEXT_ROUTE[miss]}">Go there</a>` : 'Great! Your profile is fully up to date.'}</p></div></div>
<ul class="pf-contact"><li>${ico('mail')}<span>${esc(s.e)}</span></li><li>${ico('phone')}<span>${val(s.ph)}</span></li><li>${ico('pin')}<span>${val(s.loc)}</span></li>${s.jn ? `<li>${ico('cal')}<span>Joined on ${esc(fd(s.jn))}</span></li>` : ''}</ul>
${s.rs ? `<a class="btn fill full pf-dl" href="${esc(media(s.rsu))}" download="${esc(s.rs)}">${ico('download')}Download resume</a>` : '<a class="btn fill full pf-dl" href="#/profile/docs">' + ico('upload') + 'Upload resume</a>'}</aside>`;
}

export function renderProfile(arg?: string) {
  const s = ME(), tab: Tab = (TABS.find(t => t.id == arg) || TABS[0]).id, T = TABS.find(t => t.id == tab)!;
  open = '';
  const body = tab == 'personal' ? card('personal') : tab == 'academic' ? card('education')
    : tab == 'skills' ? card('skills') + card('prefs') : resumeCard(s);
  const first = T.secs[0], action = tab == 'docs'
    ? `<button type="button" class="btn fill pf-top" data-a="rfPick">${ico('upload')}${s.rs ? 'Replace resume' : 'Upload resume'}</button>`
    : `<button type="button" class="btn fill pf-top" data-a="pfEdit" data-k="${first}">${ico('edit')}Edit profile</button>`;
  setTimeout(() => { const l: HTMLElement | null = $('.pf-tabs'), t: HTMLElement | null = $('.pf-tab.on'); if (l && t) l.scrollLeft = t.offsetLeft - (l.clientWidth - t.offsetWidth) / 2; }, 0);
  return `<div class="dx pf"><header class="pf-head"><span class="pf-hic">${ico('user')}</span><div><h1>My Profile</h1><p>Manage your profile information and keep it up to date.</p></div>${action}</header>
<div class="pf-grid">${side(s)}<div class="pf-main"><nav class="pf-tabs" aria-label="Profile sections">${m(TABS, t => {
    const bad = t.secs.some(k => !s.sec[k]);
    return `<a class="pf-tab${t.id == tab ? ' on' : ''}" href="#/profile/${t.id}" ${t.id == tab ? 'aria-current="page"' : ''}>${ico(t.ic)}<span>${t.label}</span>${bad ? '<i class="pf-dot" title="Something is missing in this tab"></i>' : ''}</a>`;
  })}</nav><div class="pf-panel">${body}</div></div></div></div>`;
}

export function renderPortfolioPage(kind: 'projects' | 'certificates') {
  return renderPortfolio(ME(), kind);
}
