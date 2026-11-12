import type {Student, Job} from './types';
import {$, esc, m, db, api, co, badge, empty, left, offer, elig, canApply} from './core';
import {ME} from './profile';
import {campus, logo} from './shared';

/* Student dashboard. Everything on it is calculated from the student's own data (applications, status history,
   interviews, jobs, profile), so nothing is hard-coded. app.ts passes in two helpers it already owns. */

interface Deps {
  CK: (s: Student) => any[][];          // profile checklist rows: [label, done, route]
  dlt: (j: Job) => string;              // "x days left" badge
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

/** n calendar months ending `ahead` months after the current one. */
function monthKeys(n: number, ahead = 0) {
  const now = new Date(), out: {k: string; l: string}[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(now.getFullYear(), now.getMonth() + ahead - i, 1);
    out.push({k: `${x.getFullYear()}-${pad(x.getMonth() + 1)}`, l: MON[x.getMonth()]});
  }
  return out;
}
const perMonth = (dates: string[], keys: {k: string}[]) => keys.map(k => dates.filter(d => d.slice(0, 7) === k.k).length);

const IC: Record<string, string> = {
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2A5 5 0 0 1 21 19"/>',
  bag: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.7 2.7L16 9.6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4m-3.5 3h7M10 17h4"/>',
  chart: '<path d="M5 20V11m7 9V4m7 16v-6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4m8-4v4M3.5 10h17"/>',
  bolt: '<path d="m13 3-8 11h6l-1 7 8-11h-6l1-7Z"/>',
  doc: '<path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v4h4M10 12h5m-5 3.5h5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  track: '<path d="M4 6h16M4 12h10M4 18h6"/><circle cx="18" cy="16" r="3"/><path d="m20.2 18.2 1.8 1.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
};
const ico = (k: string, c = '') => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
interface SkillGapItem {skill: string; job_count: number; job_titles: string[]; more_jobs: number}
let skillGapRequest = 0;

async function loadSkillGap() {
  const request = ++skillGapRequest, panel = $('#dx-skill-gap') as HTMLElement | null;
  if (!panel) return;
  panel.setAttribute('aria-busy', 'true');
  panel.innerHTML = '<div class="dx-skill-loading" role="status">Finding skills that can improve your job matches…</div>';
  try {
    const result = await api('GET', '/student/skill-gap') as {skills: SkillGapItem[]};
    if (request !== skillGapRequest || !$('#dx-skill-gap')) return;
    panel.setAttribute('aria-busy', 'false');
    panel.innerHTML = result.skills.length ? `<ul class="dx-skill-list">${m(result.skills, item => `<li class="dx-skill-item"><div class="dx-skill-copy"><b>${esc(item.skill)}</b><small>${item.job_count} open ${item.job_count === 1 ? 'job' : 'jobs'} · ${esc(item.job_titles.join(', '))}</small>${item.more_jobs ? `<small class="dx-skill-benefit">Learning this could meet the skills threshold for ${item.more_jobs} more ${item.more_jobs === 1 ? 'job' : 'jobs'}.</small>` : ''}</div><span class="dx-skill-count" aria-label="Required by ${item.job_count} open ${item.job_count === 1 ? 'job' : 'jobs'}">${item.job_count}</span><a class="btn sm" href="#/skills">Add this skill</a></li>`)}</ul>` : '<div class="dx-skill-empty">No missing skills found for open jobs in your department.</div>';
  } catch (error) {
    if (request !== skillGapRequest || !$('#dx-skill-gap')) return;
    const message = (error as {error?: string})?.error || 'Skill gap recommendations could not be loaded.';
    panel.setAttribute('aria-busy', 'false');
    panel.innerHTML = `<div class="dx-skill-error" role="alert">${esc(message)} <button class="btn sm" type="button" data-dx-skill-retry>Try again</button></div>`;
  }
}

document.addEventListener('click', event => {
  if ((event.target as HTMLElement).closest('[data-dx-skill-retry]')) loadSkillGap();
});

/** Small trend line for a stat card. */
function spark(v: number[], id: string) {
  const mx = Math.max(1, ...v), pts = v.map((x, i) => [i / (v.length - 1) * 120, 33 - x / mx * 26]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  return `<svg class="dx-spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".3"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d} L120,40 L0,40 Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/** Applications per month (the bar chart). */
function bars(n: number) {
  const ks = monthKeys(n), v = perMonth(db.apps.filter(a => a.s == ME().id).map(a => a.dt), ks), mx = Math.max(1, ...v);
  return `<div class="dx-bars" style="--n:${n}" role="img" aria-label="Applications per month: ${ks.map((k, i) => k.l + ' ' + v[i]).join(', ')}">${m(ks, (k, i) => `<div class="dx-bar"><b>${v[i]}</b><i style="height:${v[i] ? Math.max(v[i] / mx * 100, 9) : 3}%"></i><span>${k.l}</span></div>`)}</div>${v.some(Boolean) ? '' : '<p class="dx-note">No applications in this period yet.</p>'}`;
}

document.addEventListener('change', e => {
  const t = e.target as HTMLSelectElement;
  if (t.id === 'dx-range') $('#dx-bars').innerHTML = bars(+t.value);
});

function donut(parts: {l: string; n: number; c: string}[], pct: number) {
  const R = 52, C = 2 * Math.PI * R, tot = parts.reduce((a, p) => a + p.n, 0);
  let off = 0;
  const arcs = tot ? parts.filter(p => p.n).map(p => {
    const len = p.n / tot * C, gap = parts.filter(x => x.n).length > 1 ? 3 : 0, el = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${p.c}" stroke-width="16" stroke-dasharray="${Math.max(len - gap, 0.5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off += len; return el;
  }).join('') : '';
  return `<div class="dx-donut" title="Share of your applications that reached the shortlist or an offer"><svg viewBox="0 0 140 140" role="img" aria-label="Application status: ${parts.map(p => p.l + ' ' + p.n).join(', ')}"><circle cx="70" cy="70" r="${R}" fill="none" stroke="#eeeafc" stroke-width="16"/>${arcs}</svg><div><b>${pct}%</b><small>Overall progress</small></div></div>`;
}

export function renderDashboard(d: Deps): string {
  const s = ME(), ap = db.apps.filter(a => a.s == s.id), now = Date.now(), first = s.n.split(' ')[0];
  const byStatus = (k: string) => ap.filter(a => a.st == k).length;
  const ups = db.iv.filter(i => i.at >= now && db.apps.some(a => a.id == i.a && a.s == s.id)).sort((a, b) => a.at - b.at);
  const o = offer(s.id), checks = d.CK(s), done = checks.filter(c => c[1]).length;
  const open = db.jobs.filter(j => left(j.dl) >= 0), soon = open.filter(j => left(j.dl) <= 7 && !ap.some(a => a.j == j.id) && elig(s, j).ok);
  const latest = open.slice().sort((a, b) => b.id - a.id).slice(0, 3);

  /* stat cards: number, change over the last 30 days and a 6-month trend, all from real dates */
  const cut = dayKey(now - 30 * 864e5), k6 = monthKeys(6), k6n = monthKeys(6, 1);
  const dApplied = ap.map(a => a.dt), dShort = ap.flatMap(a => a.h.filter(h => h.st == 'Shortlisted').map(h => h.dt)),
        dSel = ap.flatMap(a => a.h.filter(h => h.st == 'Selected').map(h => h.dt)), dIv = db.iv.map(i => dayKey(i.at));
  const week = ups.filter(i => i.at <= now + 7 * 864e5).length;
  const stats = [
    {c: 'blue', ic: 'people', n: ap.length, l: 'Applied jobs', up: dApplied.filter(x => x >= cut).length, tip: 'new in the last 30 days', sp: perMonth(dApplied, k6), href: '#/applications'},
    {c: 'violet', ic: 'bag', n: dShort.length, l: 'Shortlisted', up: dShort.filter(x => x >= cut).length, tip: 'new in the last 30 days', sp: perMonth(dShort, k6), href: '#/applications?st=Shortlisted'},
    {c: 'green', ic: 'check', n: ups.length, l: 'Upcoming interviews', up: week, tip: 'in the next 7 days', sp: perMonth(dIv, k6n), href: ''},
    {c: 'orange', ic: 'trophy', n: byStatus('Selected'), l: 'Selected', up: dSel.filter(x => x >= cut).length, tip: 'new in the last 30 days', sp: perMonth(dSel, k6), href: '#/applications?st=Selected'},
  ];
  const statCard = (x: typeof stats[0], i: number) => {
    const body = `<span class="dx-stat-ic">${ico(x.ic)}</span><span class="dx-stat-tx"><b>${x.n}</b><small>${x.l}</small></span><span class="dx-delta${x.up ? '' : ' zero'}" title="${x.up} ${x.tip}">${x.up ? '↑' : ''} +${x.up}</span>${spark(x.sp, 'dxs' + i)}`;
    return x.href ? `<a class="dx-stat ${x.c}" href="${x.href}">${body}</a>` : `<div class="dx-stat ${x.c}">${body}</div>`;
  };

  /* status donut */
  const parts = [{l: 'Applied', n: byStatus('Applied'), c: '#3b6cff'}, {l: 'Shortlisted', n: byStatus('Shortlisted'), c: '#14b8a6'},
                 {l: 'Rejected', n: byStatus('Rejected'), c: '#f59e0b'}, {l: 'Selected', n: byStatus('Selected'), c: '#8b5cf6'}];
  const pct = ap.length ? Math.round((byStatus('Shortlisted') + byStatus('Selected')) / ap.length * 100) : 0;

  /* upcoming interviews */
  const ivRow = i => {
    const a = db.apps.find(x => x.id == i.a)!, j = db.jobs.find(x => x.id == a.j)!, c = co(j.c), dt = new Date(i.at);
    return `<article class="dx-iv">${logo(c)}<div class="dx-iv-tx"><h3>${esc(c.n)}</h3><p>${esc(j.t)} · ${esc(i.r)}</p><div class="dx-iv-meta"><span>${ico('cal')}${dt.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</span><span>${ico('clock')}${dt.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true}).toUpperCase()}</span><span>${ico('pin')}${esc(i.md)}${i.lc ? ' · ' + esc(i.lc) : ''}</span></div></div><a class="btn fill sm" href="#/track/${a.id}">View details</a></article>`;
  };

  /* latest jobs */
  const jobRow = (j: Job) => {
    const c = co(j.c), a = db.apps.find(x => x.s == s.id && x.j == j.id), e = elig(s, j), ca = canApply(s, j);
    const act = a ? badge(a.st) : ca.ok ? `<button class="btn fill sm" data-a="apply" data-id="${j.id}">Apply now</button>` : `<a class="btn sm" href="#/job/${j.id}" title="${esc(ca.m)}">View details</a>`;
    return `<article class="dx-job">${logo(c)}<div class="dx-job-tx"><h3><a href="#/job/${j.id}">${esc(j.t)}</a></h3><p>${esc(c.n)}</p><div class="dx-iv-meta"><span>${ico('pin')}${esc(j.l)}</span><span>Min ${j.min}%</span><span>₹ ${esc(j.pk)}</span>${d.dlt(j)}</div></div>${e.ok ? `<span class="dx-match" title="How many of the required skills you have">${e.m}% match</span>` : ''}<div class="dx-job-act">${act}</div></article>`;
  };

  const quick = [['violet', 'doc', 'Update resume', '#/resume'], ['green', 'search', 'Browse jobs', '#/jobs'],
                 ['blue', 'track', 'Track applications', '#/applications'], ['orange', 'user', 'Edit profile', '#/profile']];
  const inProgress = byStatus('Applied') + byStatus('Shortlisted');
  const lead = ap.length ? `${inProgress} ${inProgress == 1 ? 'application is' : 'applications are'} in progress${ups.length ? ` and ${ups.length} ${ups.length == 1 ? 'interview is' : 'interviews are'} coming up` : ''}. Keep it going!`
                         : 'Your career journey starts with one application. Browse jobs and apply to the ones that fit.';

  queueMicrotask(loadSkillGap);
  return `<div class="dashboard dx">
<header class="dx-hero"><div class="dx-hero-tx"><h1>Welcome back, <em>${esc(first)}</em>! <span aria-hidden="true">👋</span></h1><p>${lead}</p>
<div class="dx-pc"><span>Profile completion</span><div class="pbar" role="progressbar" aria-label="Profile completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.pp}"><i style="width:${s.pp}%"></i></div><b>${s.pp}%</b></div></div>
<div class="dx-hero-art" aria-hidden="true"><span class="dx-tag">Dream big…<br>Get placed!</span>${campus()}</div></header>
${o ? `<div class="ban dash-offer"><span class="dash-offer-icon" aria-hidden="true">✦</span><span><b>Congratulations on your offer!</b><small>You’re placed with an offer up to ₹${o} LPA. You can now apply to dream offers of ${db.pol.dream}x or more.</small></span></div>` : ''}
<section class="dx-stats" aria-label="Career overview">${m(stats, statCard)}</section>
<div class="dx-row">
<section class="dx-panel"><div class="dx-ph"><h2>${ico('chart')}Application statistics</h2><select id="dx-range" class="dx-select" aria-label="Chart period"><option value="6">Last 6 months</option><option value="3">Last 3 months</option><option value="12">Last 12 months</option></select></div>
<div class="dx-stat-body"><div class="dx-donut-wrap">${donut(parts, pct)}<ul class="dx-legend">${m(parts, p => `<li><i style="background:${p.c}"></i><span>${p.l}</span><b>${p.n}</b></li>`)}</ul></div><div id="dx-bars" class="dx-bars-wrap">${bars(6)}</div></div></section>
<section class="dx-panel"><div class="dx-ph"><h2>${ico('cal')}Upcoming interviews</h2><a class="dx-link" href="#/applications">My applications ${ico('arrow')}</a></div>
${ups.length ? `<div class="dx-list">${m(ups.slice(0, 3), ivRow)}</div>` : `<div class="dx-empty">${ico('cal')}<b>No interviews scheduled yet</b><small>When the placement cell schedules one for you, it will show up here with the date, time and place.</small></div>`}</section>
</div>
<div class="dx-row">
<section class="dx-panel"><div class="dx-ph"><h2>${ico('bag')}Latest job opportunities</h2><a class="dx-link" href="#/jobs">Browse all jobs ${ico('arrow')}</a></div>
${latest.length ? `<div class="dx-list flat">${m(latest, jobRow)}</div>` : empty('No open jobs right now. New openings will appear here.')}</section>
<section class="dx-panel"><div class="dx-ph"><h2>${ico('bolt')}Quick actions</h2></div><div class="dx-quick">${m(quick, q => `<a class="dx-q ${q[0]}" href="${q[3]}"><span>${ico(q[1])}</span>${q[2]}</a>`)}</div></section>
</div>
<section class="dx-panel dx-skill-panel" aria-labelledby="dx-skill-title"><div class="dx-ph"><div><h2 id="dx-skill-title">${ico('bolt')}Skill gap</h2><p class="dx-skill-intro">Skills in demand across open jobs that match your department.</p></div><a class="dx-link" href="#/skills">Manage skills ${ico('arrow')}</a></div><div id="dx-skill-gap" aria-live="polite" aria-busy="true"><div class="dx-skill-loading" role="status">Finding skills that can improve your job matches…</div></div></section>
${done < checks.length || soon.length ? `<div class="dx-duo${done < checks.length && soon.length ? '' : ' one'}">
${done < checks.length ? `<section class="pn dash-panel dash-profile"><div class="dash-panel-head"><div><h2>Finish your profile</h2><p>A complete profile helps recruiters and your job matches.</p></div><span class="dash-percent">${done}/${checks.length}</span></div><ul class="cl dash-checklist">${m(checks, c => `<li>${c[1] ? '<span class="y dash-check" aria-label="Complete">✓</span>' : '<span class="n dash-check" aria-label="Incomplete">○</span>'}<span class="grow">${c[0]}</span>${c[1] ? '<span class="dash-done">Done</span>' : `<a class="btn sm" href="#/${c[2]}">Complete</a>`}</li>`)}</ul></section>` : ''}
${soon.length ? `<section class="pn dash-panel dash-closing"><div class="dash-section-head"><div><h2>Closing soon</h2><p>Eligible roles with deadlines this week.</p></div></div><ul class="cl dash-closing-list">${m(soon, j => `<li><span class="dash-deadline-icon" aria-hidden="true">${ico('clock')}</span><span class="grow"><b>${esc(j.t)}</b><small>${esc(co(j.c).n)} · ${esc(j.l)}</small></span>${d.dlt(j)}<a class="btn sm" href="#/job/${j.id}">View role</a></li>`)}</ul></section>` : ''}</div>` : ''}
</div>`;
}
