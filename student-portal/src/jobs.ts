import type {Job, Student} from './types';
import {$, esc, m, db, co, job, fd, left, elig, canApply, badge, pkmax, pgr, FV, ui, A, call, V404} from './core';
import {ME} from './profile';
import {campus, ico, logo, verified} from './shared';

/* Job Opportunities (list) and Job details. Everything shown here comes from what the admin entered for the
   company and the job (logo, tagline, about, benefits, dates, badge...), plus the student's own data. */

interface Deps {
  rank: (s: Student, j: Job) => number;
  has: (s: Student, k: string) => boolean;
  hit: (s: Student, j: Job) => {loc: boolean; cat: boolean; role: boolean; sal: any};
}

const TYPES = ['Full Time', 'Internship', 'Part Time'];
const TAB_LABEL: Record<string, string> = {all: 'All jobs', 'Internship': 'Internships', 'Full Time': 'Full time', 'Part Time': 'Part time', saved: 'Saved'};
const TAB_ICON: Record<string, string> = {all: 'bag', 'Internship': 'cap', 'Full Time': 'bag', 'Part Time': 'clock', saved: 'bookmark'};
const PKG: [number, string][] = [[0, 'Any package'], [3, '3+ LPA'], [5, '5+ LPA'], [8, '8+ LPA'], [10, '10+ LPA'], [15, '15+ LPA']];
const SORTS: [string, string][] = [['n', 'Newest first'], ['m', 'Best match'], ['d', 'Closing soon'], ['p', 'Highest package']];

const fresh = () => ({q: '', c: '', ty: [] as string[], l: '', pm: 0, so: 'n', el: false, cl: false, sv: false});
let JF = fresh();                                    // the filters stay while you open a job and come back
let D: Deps;
let selectId = 0;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const isNew = (j: Job) => Date.now() - new Date(j.cr).getTime() < 7 * 864e5;
const due = (j: Job) => { const r = left(j.dl); return r < 0 ? 'Closed' : r == 0 ? 'Last day' : r <= 7 ? `${r} day${r > 1 ? 's' : ''} left` : 'Apply by ' + fd(j.dl); };

/** The small badge on a job: a closed job, an admin-chosen highlight, or "New" for jobs posted this week. */
function flag(j: Job) {
  if (left(j.dl) < 0) return ['gray', 'alert', 'Closed'];
  if (j.hl == 'Top Hiring') return ['green', 'star', 'Top hiring'];
  if (j.hl == 'Featured') return ['violet', 'gem', 'Featured'];
  if (j.hl == 'Popular') return ['orange', 'flame', 'Popular'];
  return isNew(j) ? ['blue', 'bolt', 'New'] : null;
}
const flagHTML = (j: Job) => { const f = flag(j); return f ? `<span class="jx-flag ${f[0]}">${ico(f[1])}${f[2]}</span>` : ''; };
const customSelect = (name: string, ariaLabel: string, options: {value: string; label: string}[]) => {
  const id = `jx-select-${++selectId}`;
  return `<div class="jx-selectbox" data-jx-select><input type="hidden" data-jx name="${name}" value="" aria-hidden="true"><button type="button" class="jx-select-trigger" aria-label="${esc(ariaLabel)}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"><span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="jx-select-menu" id="${id}" role="listbox" aria-label="${esc(ariaLabel)}">${m(options, o => `<button type="button" class="jx-select-option" role="option" aria-selected="false" data-value="${esc(o.value)}">${esc(o.label)}</button>`)}</div></div>`;
};

/* ---------------------------------------------------------------- filtering */
function pass(s: Student, j: Job, skipTabs = false) {
  const c = co(j.c);
  if (JF.q) { const t = `${j.t} ${c.n} ${j.sk.join(' ')} ${j.l} ${j.cat}`.toLowerCase(); if (!JF.q.toLowerCase().split(/\s+/).every(w => t.includes(w))) return false; }
  if (JF.c && j.c != +JF.c) return false;
  if (JF.l && j.l != JF.l) return false;
  if (JF.pm && pkmax(j.pk) < JF.pm) return false;
  if (JF.el && !elig(s, j).ok) return false;
  if (!JF.cl && left(j.dl) < 0) return false;
  if (!skipTabs) { if (JF.sv && !db.sv.includes(j.id)) return false; if (JF.ty.length && !JF.ty.includes(j.ty)) return false; }
  return true;
}
function rows() {
  const s = ME(), r = db.jobs.filter(j => pass(s, j));
  r.sort((a, b) => JF.so == 'd' ? left(a.dl) - left(b.dl) : JF.so == 'p' ? pkmax(b.pk) - pkmax(a.pk) : JF.so == 'm' ? D.rank(s, b) - D.rank(s, a) : (b.cr > a.cr ? 1 : b.cr < a.cr ? -1 : b.id - a.id));
  return r;
}

/* ---------------------------------------------------------------- pieces */
const saveIcon = (id: number) => `<button type="button" class="jx-bm${db.sv.includes(id) ? ' on' : ''}" data-a="jsave" data-id="${id}" aria-pressed="${db.sv.includes(id)}" aria-label="Save this job" title="Save job">${ico('bookmark')}</button>`;

function action(s: Student, j: Job) {
  const a = db.apps.find(x => x.s == s.id && x.j == j.id), ca = canApply(s, j);
  if (a) return `<a class="btn jx-st" href="#/track/${a.id}">${badge(a.st)}<span>View status</span></a>`;
  if (left(j.dl) < 0) return '<button type="button" class="btn" disabled>Closed</button>';
  if (ca.ok) return `<button type="button" class="btn fill" data-a="apply" data-id="${j.id}">Apply now ${ico('arrow')}</button>`;
  return `<a class="btn" href="#/job/${j.id}">View details</a><small class="jx-why">${esc(ca.m)}</small>`;
}

function row(s: Student, j: Job) {
  const c = co(j.c), e = elig(s, j), h = D.hit(s, j), pref = h.loc || h.cat || h.role, shown = j.sk.slice(0, 4);
  return `<article class="jx-job">${logo(c, 'jx-logo')}
<div class="jx-info"><h3><a href="#/job/${j.id}">${esc(c.n)}</a>${verified}</h3><p class="jx-role">${esc(j.t)}</p>
<div class="jx-meta"><span>${ico('bag')}${esc(j.ty)}</span><span>${ico('pin')}${esc(j.l)}</span><span>${ico('rupee')}${esc(j.pk)}</span><span class="${left(j.dl) >= 0 && left(j.dl) <= 7 ? 'soon' : ''}">${ico('cal')}${due(j)}</span></div>
<div class="jx-sk">${m(shown, k => `<span class="${D.has(s, k) ? 'ok' : ''}">${D.has(s, k) ? '✓ ' : ''}${esc(k)}</span>`)}${j.sk.length > 4 ? `<span class="more">+${j.sk.length - 4}</span>` : ''}</div></div>
<div class="jx-mid">${flagHTML(j)}<span class="jx-match ${e.m >= 80 ? 'hi' : e.m >= 50 ? 'mid' : 'lo'}" title="How many of the required skills you have">${e.m}% match</span>${pref ? '<span class="jx-pref">★ Fits your preferences</span>' : ''}</div>
<div class="jx-act">${action(s, j)}</div>${saveIcon(j.id)}</article>`;
}

function listHTML() {
  const r = rows(), p = pgr(r, 6);
  if (r.length) return `<div class="jx-list">${m(p.rows, j => row(ME(), j))}</div>${p.bar}`;
  return `<div class="jx-none">${ico(JF.sv ? 'bookmark' : 'search')}<b>${JF.sv ? 'No saved jobs yet' : 'No jobs match your filters'}</b><small>${JF.sv ? 'Tap the bookmark on a job to keep it here for later.' : 'Try a different search, or clear the filters to see everything that is open.'}</small>${JF.sv ? '' : '<button type="button" class="btn" data-a="jreset">Reset all filters</button>'}</div>`;
}

function tabsHTML() {
  const s = ME(), base = db.jobs.filter(j => pass(s, j, true)), n: Record<string, number> = {all: base.length, saved: base.filter(j => db.sv.includes(j.id)).length};
  TYPES.forEach(t => n[t] = base.filter(j => j.ty == t).length);
  const on = JF.sv ? 'saved' : JF.ty.length == 0 ? 'all' : JF.ty.length == 1 ? JF.ty[0] : '';
  return m(['all', 'Internship', 'Full Time', 'Part Time', 'saved'], k => `<button type="button" role="tab" class="jx-tab${k == on ? ' on' : ''}" aria-selected="${k == on}" data-a="jtab" data-v="${k}">${ico(TAB_ICON[k])}${TAB_LABEL[k]} <i>${n[k]}</i></button>`);
}

/** Put every filter control (top bar and side panel) in line with the current state. */
function sync() {
  document.querySelectorAll<any>('[data-jx]').forEach(e => {
    const n = e.name;
    if (n == 'q') { if (document.activeElement !== e) e.value = JF.q; }
    else if (n == 'c') e.value = JF.c; else if (n == 'l') e.value = JF.l; else if (n == 'pm') e.value = String(JF.pm); else if (n == 'so') e.value = JF.so;
    else if (n == 'ty1') e.value = JF.ty.length > 1 ? '*' : JF.ty[0] || '';
    else if (n == 'ty') e.checked = JF.ty.includes(e.value);
    else if (n == 'el') e.checked = JF.el; else if (n == 'cl') e.checked = JF.cl;
    if (e.type == 'hidden') {
      const root: HTMLElement | null = e.closest('[data-jx-select]');
      if (!root) return;
      const value = e.value, options = [...root.querySelectorAll('.jx-select-option')] as HTMLElement[];
      const selected = options.find(o => o.dataset.value == value) || options[0];
      root.querySelector('.jx-select-trigger span')!.textContent = selected.textContent;
      options.forEach(o => o.setAttribute('aria-selected', String(o === selected)));
    }
  });
}
function paint() {
  if (!$('#lst')) return;
  $('#jx-tabs').innerHTML = tabsHTML(); $('#lst').innerHTML = listHTML(); sync();
}

/* ---------------------------------------------------------------- list page */
export function renderJobs(deps: Deps) {
  D = deps;
  if (FV.q && FV.q !== JF.q) JF = {...fresh(), q: FV.q};       // came from the search box at the top
  const s = ME(), open = db.jobs.filter(j => left(j.dl) >= 0), locs = [...new Set(db.jobs.map(j => j.l))].sort(), cos = db.cos.filter(c => db.jobs.some(j => j.c == c.id));
  ui.LF = listHTML;
  const companyOptions = [{value: '', label: 'All companies'}, ...cos.map(c => ({value: String(c.id), label: c.n}))],
        locationOptions = [{value: '', label: 'All locations'}, ...locs.map(l => ({value: l, label: l}))],
        packageOptions = PKG.map(p => ({value: String(p[0]), label: p[0] ? 'Min ' + p[1] : 'Min package'})),
        typeOptions = [{value: '', label: 'All job types'}, ...TYPES.map(t => ({value: t, label: t})), {value: '*', label: 'Several types'}],
        sortOptions = SORTS.map(o => ({value: o[0], label: o[1]}));
  const stat = (ic: string, n: number | string, l: string) => `<div class="jx-stat">${ico(ic)}<div><b>${n}</b><small>${l}</small></div></div>`;
  setTimeout(sync, 0);
  return `<div class="dx jx">
<header class="jx-head"><span class="pf-hic">${ico('bag')}</span><div><h1>Job opportunities</h1><p>Discover the best placement opportunities from top companies.</p></div>
<div class="jx-stats">${stat('bag', open.length, 'Open jobs')}${stat('building', new Set(open.map(j => j.c)).size, 'Companies hiring')}${stat('trophy', db.pl, 'Students placed')}</div></header>
<section class="jx-hero"><div class="jx-hero-tx"><h2>Your career, <em>our priority</em></h2><p>Explore top job opportunities and take the next step towards your dream career.</p><button type="button" class="btn jx-explore" data-a="jexplore">Explore jobs ${ico('arrow')}</button></div>
<div class="jx-hero-art" aria-hidden="true"><span>Dream big…<br>Get placed!</span>${campus()}</div></section>
<form class="jx-bar" role="search" data-jxform><label class="jx-search">${ico('search')}<input data-jx name="q" type="search" placeholder="Search jobs by title, company or skill…" aria-label="Search jobs" autocomplete="off"></label>
${customSelect('c', 'Company', companyOptions)}${customSelect('ty1', 'Job type', typeOptions)}${customSelect('l', 'Location', locationOptions)}${customSelect('pm', 'Minimum package', packageOptions)}
<button type="submit" class="btn fill">${ico('search')}Search</button></form>
<div class="jx-grid" id="jx-top"><div class="jx-main"><div class="jx-row"><div id="jx-tabs" class="jx-tabs" role="tablist" aria-label="Job type">${tabsHTML()}</div>
<div class="jx-ctl"><button type="button" class="btn jx-ftog" data-a="jfilters">${ico('filter')}Filters</button><label class="jx-sort">Sort by${customSelect('so', 'Sort jobs', sortOptions)}</label></div></div>
<div id="lst">${listHTML()}</div></div>
<button type="button" class="jx-filter-backdrop" data-a="jfiltersClose" aria-label="Close filters"></button>
<aside class="jx-filters" id="jx-filters" aria-label="Filters" role="region"><div class="jx-fh"><span class="jx-sheet-handle" aria-hidden="true"></span><div class="jx-fh-title"><h2>${ico('filter')}Filters</h2><div class="jx-fh-actions"><button type="button" class="jx-reset" data-a="jreset">Reset all${ico('reset')}</button><button type="button" class="jx-fclose" data-a="jfiltersClose" aria-label="Close filters">×</button></div></div></div>
<fieldset><legend>Job type</legend>${m(TYPES, t => `<label class="jx-ck"><input data-jx type="checkbox" name="ty" value="${t}"><span>${t}</span></label>`)}</fieldset>
<label>Location${customSelect('l', 'Location', locationOptions)}</label>
<label>Salary package${customSelect('pm', 'Salary package', packageOptions)}</label>
<label>Company${customSelect('c', 'Company', companyOptions)}</label>
<fieldset><legend>Show</legend><label class="jx-ck"><input data-jx type="checkbox" name="el"><span>Only jobs I am eligible for</span></label><label class="jx-ck"><input data-jx type="checkbox" name="cl"><span>Include closed jobs</span></label></fieldset>
<button type="button" class="btn fill full" data-a="jsearch">${ico('filter')}Apply filters</button></aside></div></div>`;
}

const field = (e: EventTarget | null) => e as any;
document.addEventListener('input', e => { const t = field(e.target); if (t && t.matches && t.matches('[data-jx]') && t.name == 'q') { clearTimeout((t as any)._d); (t as any)._d = setTimeout(() => ctl(t), 160); } });
document.addEventListener('change', e => { const t = field(e.target); if (t && t.matches && t.matches('[data-jx]') && t.name != 'q') ctl(t); });   // the search box already updates while typing
document.addEventListener('click', e => {
  const target = e.target as HTMLElement, trigger = target.closest<HTMLButtonElement>('.jx-select-trigger'), option = target.closest<HTMLButtonElement>('.jx-select-option');
  if ($('#jx-filters.open') && !target.closest('.jx-filters') && !target.closest('.jx-ftog')) {
    closeFilters();
    e.preventDefault();
    return;
  }
  if (target.closest('.jx-filter-backdrop')) { closeFilters(); return; }
  if (trigger) {
    const root = trigger.closest<HTMLElement>('[data-jx-select]');
    if (!root) return;
    const opening = !root.classList.contains('open');
    document.querySelectorAll<HTMLElement>('.jx-selectbox.open').forEach(item => { item.classList.remove('open'); item.querySelector('.jx-select-trigger')!.setAttribute('aria-expanded', 'false'); });
    if (opening) { root.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
    return;
  }
  if (option) {
    const root = option.closest<HTMLElement>('[data-jx-select]');
    if (!root) return;
    const input = root.querySelector<HTMLInputElement>('[data-jx]'), triggerButton = root.querySelector<HTMLButtonElement>('.jx-select-trigger');
    if (!input || !triggerButton) return;
    input.value = option.dataset.value || ''; root.classList.remove('open'); triggerButton.setAttribute('aria-expanded', 'false');
    input.dispatchEvent(new Event('change', {bubbles: true})); triggerButton.focus();
    return;
  }
  if (!target.closest('[data-jx-select]')) document.querySelectorAll<HTMLElement>('.jx-selectbox.open').forEach(item => { item.classList.remove('open'); item.querySelector('.jx-select-trigger')!.setAttribute('aria-expanded', 'false'); });
});
document.addEventListener('keydown', e => {
  const target = e.target as HTMLElement, trigger = target.closest<HTMLButtonElement>('.jx-select-trigger'), option = target.closest<HTMLButtonElement>('.jx-select-option');
  if (e.key == 'Escape' && $('#jx-filters.open') && !option) { closeFilters(); return; }
  if (trigger && (e.key == 'ArrowDown' || e.key == 'ArrowUp')) {
    e.preventDefault(); const root = trigger.closest<HTMLElement>('[data-jx-select]');
    if (!root) return;
    document.querySelectorAll<HTMLElement>('.jx-selectbox.open').forEach(item => { item.classList.remove('open'); item.querySelector('.jx-select-trigger')!.setAttribute('aria-expanded', 'false'); });
    root.classList.add('open'); trigger.setAttribute('aria-expanded', 'true');
    const options = [...root.querySelectorAll<HTMLButtonElement>('.jx-select-option')], selected = options.findIndex(item => item.getAttribute('aria-selected') == 'true');
    options[e.key == 'ArrowDown' ? (selected + 1 + options.length) % options.length : (selected > 0 ? selected - 1 : options.length - 1)].focus();
  } else if (option) {
    const root = option.closest<HTMLElement>('[data-jx-select]');
    if (!root) return;
    const options = [...root.querySelectorAll<HTMLButtonElement>('.jx-select-option')], index = options.indexOf(option);
    let next = -1;
    if (e.key == 'ArrowDown') next = (index + 1) % options.length;
    else if (e.key == 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (e.key == 'Home') next = 0;
    else if (e.key == 'End') next = options.length - 1;
    else if (e.key == 'Escape') { e.preventDefault(); root.classList.remove('open'); root.querySelector('.jx-select-trigger')!.setAttribute('aria-expanded', 'false'); root.querySelector<HTMLButtonElement>('.jx-select-trigger')!.focus(); }
    else if (e.key == 'Tab') { root.classList.remove('open'); root.querySelector('.jx-select-trigger')!.setAttribute('aria-expanded', 'false'); }
    if (next >= 0) { e.preventDefault(); options[next].focus(); }
  }
});
let dragStartY = 0, dragStartTime = 0, draggingFilters = false;
document.addEventListener('pointerdown', e => {
  const handle = (e.target as HTMLElement).closest<HTMLElement>('.jx-sheet-handle'), filters = $('#jx-filters.open');
  if (!handle || !filters || !matchMedia('(max-width: 640px)').matches) return;
  draggingFilters = true; dragStartY = e.clientY; dragStartTime = Date.now(); filters.classList.add('dragging');
  handle.setPointerCapture(e.pointerId);
  e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if (!draggingFilters) return;
  const distance = Math.max(0, e.clientY - dragStartY);
  $('#jx-filters')?.style.setProperty('--jx-drag-y', `${distance}px`);
});
const finishFilterDrag = (e: PointerEvent) => {
  if (!draggingFilters) return;
  draggingFilters = false;
  const distance = Math.max(0, e.clientY - dragStartY), elapsed = Math.max(1, Date.now() - dragStartTime);
  const filters = $('#jx-filters');
  filters?.classList.remove('dragging');
  if (distance > 90 || (distance > 35 && distance / elapsed > .45)) closeFilters();
  else filters?.style.removeProperty('--jx-drag-y');
};
document.addEventListener('pointerup', finishFilterDrag);
document.addEventListener('pointercancel', finishFilterDrag);
document.addEventListener('submit', e => { if (field(e.target).matches && field(e.target).matches('[data-jxform]')) { e.preventDefault(); A.jsearch(); } });
function ctl(t: any) {
  const n = t.name, v = t.value, before = JSON.stringify(JF);
  if (n == 'q') JF.q = v.trim(); else if (n == 'c') JF.c = v; else if (n == 'l') JF.l = v; else if (n == 'pm') JF.pm = +v; else if (n == 'so') JF.so = v;
  else if (n == 'ty1') { JF.ty = v && v != '*' ? [v] : []; JF.sv = false; }
  else if (n == 'ty') { JF.ty = [...document.querySelectorAll<any>('[data-jx][name=ty]')].filter(x => x.checked).map(x => x.value); JF.sv = false; }
  else if (n == 'el') JF.el = t.checked; else if (n == 'cl') JF.cl = t.checked;
  if (JSON.stringify(JF) === before) return;      // nothing changed: do not redraw the list under the user's mouse
  FV.p = 1; paint();
}
A.jtab = d => { JF.sv = d.v == 'saved'; JF.ty = d.v == 'all' || d.v == 'saved' ? [] : [d.v]; FV.p = 1; paint(); };
A.jreset = () => { JF = fresh(); FV.p = 1; paint(); };
A.jsearch = () => { FV.p = 1; paint(); closeFilters(); const t = $('#jx-top'); t && t.scrollIntoView({behavior: calm(), block: 'start'}); };
A.jexplore = () => { const i: HTMLElement | null = document.querySelector('.jx-search input'); i && i.scrollIntoView({behavior: calm(), block: 'center'}); i && i.focus({preventScroll: true}); };
let filterScrollY = 0;
function closeFilters() {
  const filters = $('#jx-filters');
  filters?.classList.remove('open');
  filters?.classList.remove('dragging');
  filters?.style.removeProperty('--jx-drag-y');
  filters?.setAttribute('role', 'region');
  filters?.removeAttribute('aria-modal');
  document.querySelector('.jx')?.classList.remove('jx-filters-open');
  const wasLocked = document.body.classList.contains('jx-modal-open');
  document.body.classList.remove('jx-modal-open');
  document.documentElement.style.removeProperty('--jx-scroll-lock-top');
  if (wasLocked) window.scrollTo(0, filterScrollY);
  $('.jx-ftog')?.focus({preventScroll: true});
}
A.jfilters = () => {
  const filters = $('#jx-filters'), opening = !filters.classList.contains('open');
  filters.classList.toggle('open', opening);
  $('.jx')?.classList.toggle('jx-filters-open', opening);
  const mobile = opening && matchMedia('(max-width: 640px)').matches;
  if (mobile) {
    filterScrollY = window.scrollY;
    document.documentElement.style.setProperty('--jx-scroll-lock-top', `-${filterScrollY}px`);
  }
  document.body.classList.toggle('jx-modal-open', mobile);
  filters.setAttribute('role', mobile ? 'dialog' : 'region');
  if (mobile) {
    filters.setAttribute('aria-modal', 'true');
    $('.jx-fclose')?.focus();
  } else filters.removeAttribute('aria-modal');
};
A.jfiltersClose = closeFilters;

function paintSaves() {
  document.querySelectorAll<HTMLElement>('[data-a=jsave]').forEach(b => {
    const on = db.sv.includes(+b.dataset.id!), lab = b.querySelector('.lab');
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    if (lab) lab.textContent = on ? 'Saved' : 'Save job';
  });
}
A.jsave = async d => {
  const id = +d.id, on = !db.sv.includes(id);
  db.sv = on ? [...db.sv, id] : db.sv.filter(x => x != id); paintSaves();
  const r = await call('POST', '/student/saved', {job: id, on}, on ? 'Job saved' : 'Removed from saved jobs', false);
  if (!r) { db.sv = on ? db.sv.filter(x => x != id) : [...db.sv, id]; paintSaves(); }
  paint();
};

/* ---------------------------------------------------------------- job details */
let lock = 0;                                       // after a tab click, do not let scrolling change the highlight for a moment
const mark = (id: string) => document.querySelectorAll<HTMLElement>('.jd-tab').forEach(b => b.classList.toggle('on', b.dataset.t == id));
function follow() {
  if (Date.now() < lock) return;
  const tabs = [...document.querySelectorAll<HTMLElement>('.jd-tab')].map(b => b.dataset.t!);
  if (!tabs.length) return;
  let cur = tabs[0];
  document.querySelectorAll<HTMLElement>('.jd-main .jd-sec').forEach(x => { if (tabs.includes(x.id) && x.getBoundingClientRect().top <= 180) cur = x.id; });
  mark(cur);
}
let ticking = false;
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; follow(); }); } }, {passive: true});
A.jgo = d => { const t = document.getElementById(d.t); if (!t) return; lock = Date.now() + 1000; mark(d.t); t.scrollIntoView({behavior: calm(), block: 'start'}); };
A.jmore = (_d: any, b: HTMLElement) => { const w = b.closest('.jd-skills')!, all = w.classList.toggle('all'); b.textContent = all ? 'Show less' : b.dataset.label!; };

export function renderJob(id: string, deps: Deps) {
  D = deps;
  const s = ME(), j = job(id as any);
  if (!j) return V404();
  const c = co(j.c), e = elig(s, j), a = db.apps.find(x => x.s == s.id && x.j == j.id), ca = canApply(s, j), closed = left(j.dl) < 0;
  const points = j.ds.split('\n').map(x => x.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean), open = db.jobs.filter(x => x.c == c.id && left(x.dl) >= 0).length;
  const skills = j.sk, show = 6, crit = (ok: boolean, l: string, need: string, have: string) => `<li class="${ok ? 'ok' : 'no'}"><span class="jd-tick">${ico(ok ? 'check' : 'x')}</span><b>${l}</b><span>${need}</span><em>You: ${have}</em></li>`;
  const tabs: [string, string, string][] = [['jd-overview', 'info', 'Overview'], ['jd-eligibility', 'check', 'Eligibility'], ['jd-description', 'list', 'Job description']];
  if (j.bn.length) tabs.push(['jd-benefits', 'gift', 'Benefits']);
  tabs.push(['jd-about', 'building', 'About company']);
  const status = a ? `<a class="btn jd-go" href="#/track/${a.id}">${badge(a.st)}<span>View application status</span></a>`
    : closed ? '<button type="button" class="btn jd-go" disabled>Applications closed</button>'
    : `<button type="button" class="btn fill jd-go" data-a="apply" data-id="${j.id}" ${ca.ok ? '' : 'disabled'}>${ico('send')}Apply now</button>`;
  const stat = (ic: string, v: string, l: string) => v ? `<div>${ico(ic)}<b>${esc(v)}</b><small>${l}</small></div>` : '';
  return `<div class="dx jd"><a class="jd-back" href="#/jobs">${ico('back')}Back to jobs</a>
<header class="jd-hero"><div class="jd-art" aria-hidden="true">${campus()}</div>${logo(c, 'jd-logo')}
<div class="jd-ht"><h1>${esc(j.t)}${verified}</h1><p class="jd-co">${esc(c.n)}</p><div class="jd-chips"><span>${ico('bag')}${esc(j.ty)}</span><span>${ico('pin')}${esc(j.l)}</span><span>${ico('rupee')}${esc(j.pk)}</span></div></div>
<div class="jd-flags">${flagHTML(j)}<span class="jd-due${!closed && left(j.dl) <= 7 ? ' soon' : ''}">${ico('clock')}${due(j)}</span></div></header>
<nav class="jd-tabs" aria-label="Job sections">${m(tabs, (t, i) => `<button type="button" class="jd-tab${i ? '' : ' on'}" data-a="jgo" data-t="${t[0]}">${ico(t[1])}${t[2]}</button>`)}</nav>
<div class="jd-grid"><div class="jd-main">
<section class="jd-sec" id="jd-overview"><h2>${ico('info')}Job overview</h2><p>${esc(c.n)} is hiring ${/^[aeiou]/i.test(j.t) ? 'an' : 'a'} ${esc(j.t)} for its ${esc(j.l)} office. This is a ${esc(j.ty.toLowerCase())} role open to students from ${esc(j.d.join(', '))} who meet the eligibility criteria below.</p>
<div class="jd-tiles"><div>${ico('layers')}<small>Experience</small><b>${esc(j.ex || 'Freshers')}</b></div><div>${ico('cap')}<small>Qualification</small><b>${esc(j.ql || j.d.join(', '))}</b></div><div>${ico('rupee')}<small>Salary package</small><b>${esc(j.pk)}</b></div><div>${ico('pin')}<small>Location</small><b>${esc(j.l)}</b></div></div>
<h3>${ico('code')}Key skills required</h3><div class="jd-skills">${m(skills, (k, i) => `<span class="${D.has(s, k) ? 'ok' : ''}${i >= show ? ' x' : ''}">${D.has(s, k) ? '✓ ' : ''}${esc(k)}</span>`)}${skills.length > show ? `<button type="button" class="jd-more" data-a="jmore" data-label="+${skills.length - show} more">+${skills.length - show} more</button>` : ''}</div></section>
<section class="jd-sec" id="jd-eligibility"><h2>${ico('check')}Eligibility</h2><div class="res ${e.ok ? 'ok' : 'no'}">${e.ok ? '✔ You are eligible for this job' : '✖ Not eligible yet: ' + esc(e.why.join(' · '))}</div>
<ul class="jd-crit">${crit(e.c.cr, 'Department', esc(j.d.join(', ')), esc(s.d))}${crit(e.c.pc, 'Graduation %', 'Min ' + j.min + '%', s.pct + '%')}${j.m10 ? crit(e.c.p10, '10th %', 'Min ' + j.m10 + '%', (s.p10 || 0) + '%') : ''}${j.m12 ? crit(e.c.p12, '12th / diploma %', 'Min ' + j.m12 + '%', (s.p12 || 0) + '%') : ''}${crit(e.c.bk, 'Backlogs', 'Max ' + (j.mb || 0), String(s.bk || 0))}${crit(e.c.sk, 'Skills match', 'At least 60%', e.m + '%')}</ul>
${e.miss.length ? `<p class="jd-miss">Missing skills: ${esc(e.miss.join(', '))}. <a href="#/skills"><b>Add skills to your profile</b></a></p>` : ''}</section>
<section class="jd-sec" id="jd-description"><h2>${ico('list')}Job description</h2>${points.length > 1 ? `<ul class="jd-points">${m(points, p => `<li>${esc(p)}</li>`)}</ul>` : `<p>${esc(points[0] || 'The company has not added a description yet.')}</p>`}</section>
${j.bn.length ? `<section class="jd-sec" id="jd-benefits"><h2>${ico('gift')}Benefits</h2><ul class="jd-ben">${m(j.bn, b => `<li>${ico('check')}${esc(b)}</li>`)}</ul></section>` : ''}
<section class="jd-sec" id="jd-dates"><h2>${ico('cal')}Important dates</h2><div class="jd-dates"><div class="g"><small>Application start date</small><b>${fd(j.sd)}</b></div><div class="r"><small>Last date to apply</small><b>${fd(j.dl)}</b></div><div class="b"><small>Interview date</small><b>${j.ivd ? fd(j.ivd) : 'To be announced'}</b></div></div></section></div>
<aside class="jd-aside"><section class="jd-about jd-sec" id="jd-about"><h2>${ico('building')}About ${esc(c.n)}</h2><div class="jd-ab"><div class="jd-abh">${logo(c, 'jd-ablogo')}<div><h3>${esc(c.n)}${verified}</h3>${c.tg ? `<p>${esc(c.tg)}</p>` : ''}</div></div>${c.ab ? `<p class="jd-abt">${esc(c.ab)}</p>` : ''}
<div class="jd-cs">${stat('users', c.em, 'Employees')}${stat('globe', c.ct, 'Countries')}${stat('bag', String(open), 'Open jobs')}</div>
${c.w ? `<a class="btn full" href="${esc(c.w)}" target="_blank" rel="noopener noreferrer">Visit company website ${ico('ext')}</a>` : ''}</div></section>
<section class="jd-apply"><h2>${ico('send')}Ready to apply?</h2><p>Don’t miss this opportunity to kickstart your career with ${esc(c.n)}!</p>${status}
<button type="button" class="btn jd-savebtn${db.sv.includes(j.id) ? ' on' : ''}" data-a="jsave" data-id="${j.id}" aria-pressed="${db.sv.includes(j.id)}">${ico('bookmark')}<span class="lab">${db.sv.includes(j.id) ? 'Saved' : 'Save job'}</span></button>
${!a && !closed && !ca.ok ? `<p class="jd-why">${esc(ca.m)} ${s.rs ? '' : '<a href="#/resume"><b>Go to resume</b></a>'}</p>` : ''}</section></aside></div></div>`;
}
