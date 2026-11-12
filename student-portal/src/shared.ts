import type {Company} from './types';
import {esc, media} from './core';

/* Small pieces used by more than one page. */

/** Company logo uploaded by the admin, or a coloured initial when there is none. */
export const logo = (c: Company, cls = '') => c.lg
  ? `<span class="co logo ${cls}"><img src="${esc(media(c.lg))}" alt="" loading="lazy"></span>`
  : `<span class="co ${cls}" aria-hidden="true">${esc(c.n[0])}</span>`;

const IC: Record<string, string> = {
  bag: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4m8-4v4M3.5 10h17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  rupee: '<path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2.5 4-7 4l6 6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.500A2.5 2.5 0 0 0 4 20.500v-15Z"/><path d="M4 20.500A2.5 2.5 0 0 0 6.5 23H20"/>',
  cap: '<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/><path d="M6.5 12v4.500c0 1.4 2.5 2.8 5.5 2.800s5.5-1.4 5.5-2.800V12M21.5 9.500v6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 17.500l9 5 9-5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  filter: '<path d="M4 5h16l-6 7.500V19l-4 1.500v-8L4 5Z"/>',
  bookmark: '<path d="M6.5 4h11v17L12 17l-5.5 4V4Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.200L3 9.600l6.2-.900L12 3Z"/>',
  gem: '<path d="M6 4h12l3.5 5L12 21 2.5 9 6 4Z"/><path d="M2.5 9h19M9 4l-1.5 5L12 21l4.5-12L15 4"/>',
  bolt: '<path d="m13 3-8 11h6l-1 7 8-11h-6l1-7Z"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  send: '<path d="m21 3-9.5 18-2-7.500L2 11.5 21 3Z"/><path d="m21 3-11.5 10.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.500v.01"/>',
  code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4M13.5 6l-3 12"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  gift: '<rect x="3" y="8" width="18" height="4.5" rx="1"/><path d="M5 12.500V21h14v-8.500M12 8v13M12 8S10.5 3.5 8 4.5 8 8 12 8Zm0 0s1.5-4.5 4-3.500S16 8 12 8Z"/>',
  building: '<path d="M4 21V4.500A1.5 1.5 0 0 1 5.5 3h8A1.5 1.5 0 0 1 15 4.500V21M15 9h4.500A1.5 1.5 0 0 1 21 10.500V21M2.5 21h19M8 7.500h3M8 11.500h3M8 15.500h3"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.200A5 5 0 0 1 21 19"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z"/>',
  ext: '<path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  check: '<path d="m5 12.5 4.5 4.500L19 7"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4.500M12 17.500v.01"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4.500v1.500A3.5 3.5 0 0 0 8 11M16 6h3.500v1.500A3.5 3.5 0 0 1 16 11M12 13v4m-3.5 3h7M10 17h4"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.5-5.800M4 4v4.500h4.5"/>',
};
export const ico = (k: string, c = '') => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
/** Blue tick shown next to company names: every company is added by the placement cell. */
export const verified = '<svg class="vf" viewBox="0 0 24 24" role="img" aria-label="Verified by the placement cell"><title>Verified by the placement cell</title><path d="M12 2.500l2.5 1.8 3-.2 1.2 2.8 2.6 1.6-.8 3 .8 3-2.6 1.6-1.2 2.8-3-.2L12 21.500l-2.5-1.8-3 .2-1.2-2.800L2.7 15.500l.8-3-.8-3 2.6-1.6 1.2-2.8 3 .2L12 2.500Z" fill="currentColor"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Campus illustration for the welcome banner (drawn in code, so there is no image file to ship). */
export function campus() {
  let win = '';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) win += `<rect x="${134 + c * 22}" y="${62 + r * 23}" width="13" height="14" rx="2" fill="${(r * 3 + c * 5) % 7 === 0 ? '#ffe9a8' : '#a9bdfc'}"/>`;
  let wing = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) wing += `<rect x="${44 + c * 20}" y="${130 + r * 23}" width="12" height="13" rx="2" fill="#b9c8fd"/>`;
  return `<svg class="dx-campus" viewBox="0 0 380 210" aria-hidden="true"><defs><linearGradient id="dxb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e4eaff"/></linearGradient></defs>
<rect x="124" y="50" width="196" height="160" rx="6" fill="url(#dxb)" stroke="#c4d0f7"/><rect x="118" y="44" width="208" height="10" rx="4" fill="#9fb2f3"/>${win}
<rect x="34" y="118" width="80" height="92" rx="5" fill="url(#dxb)" stroke="#c4d0f7"/><rect x="30" y="113" width="88" height="8" rx="4" fill="#b4c3fa"/>${wing}
<rect x="206" y="176" width="32" height="34" rx="3" fill="#7b92ee"/>
<circle cx="344" cy="168" r="30" fill="#7fd1a3"/><circle cx="364" cy="184" r="22" fill="#5cbd88"/><rect x="341" y="184" width="6" height="26" fill="#8a6a4a"/>
<circle cx="18" cy="176" r="24" fill="#8ad8ad"/><rect x="15" y="186" width="6" height="24" fill="#8a6a4a"/>
<rect x="0" y="206" width="380" height="4" fill="#cfd9fb"/></svg>`;
}

