"use strict";
(() => {
  // src/core.ts
  var $ = (s, r = document) => r.querySelector(s);
  var $$ = (s, r = document) => [...r.querySelectorAll(s)];
  var S = { get(k, d) {
    try {
      const v = localStorage.getItem("ct_" + k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  }, set(k, v) {
    try {
      localStorage.setItem("ct_" + k, JSON.stringify(v));
    } catch {
    }
  }, del(k) {
    try {
      localStorage.removeItem("ct_" + k);
    } catch {
    }
  } };
  var esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var m = (a, f) => a.map(f).join("");
  var navIcon = (id) => {
    const paths = { dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', education: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6"/>', skills: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/>', projects: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>', certificates: '<path d="M7 3h8l4 4v5"/><path d="M15 3v5h5"/><path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M8 11h7m-7 3h4"/><circle cx="17" cy="16" r="3"/><path d="m14.5 18-1 4 3.5-2 3.5 2-1-4"/>', resume: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>', prefs: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m16 8 4-4"/>', jobs: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/>', applications: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6m-12 5 3 2 3-2"/>', notifications: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"/>' };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[id] || paths.dashboard}</svg>`;
  };
  var DEPTS = ["Computer Engineering", "IT", "Electronics", "Mechanical", "Civil"];
  var CATS = ["IT & Software", "Data Science", "Web Development", "Cloud & DevOps", "Embedded Systems", "Core Engineering"];
  var PAL = ["#6d4aff", "#18b26b", "#f5a524", "#e5484d", "#3b82f6"];
  var LOGO = '<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6bff"/><stop offset="1" stop-color="#4b2fd0"/></linearGradient></defs><path d="M20 3 1 12.5 20 22l15-7.5V26h3V13z" fill="#a995ff"/><circle cx="20" cy="29" r="5.5" fill="url(#lg)"/><path d="M7 39c3-9 23-9 26 0z" fill="url(#lg)"/></svg>';
  var ROLE = document.body.dataset.r || "student";
  var API = window.CT_API || (location.port == "8000" ? "/api" : "http://127.0.0.1:8000/api");
  var ORIGIN = API.replace(/\/api$/, "");
  var media = (u) => u ? /^https?:/.test(u) ? u : ORIGIN + u : "";
  var db = { st: [], jobs: [], cos: [], apps: [], nt: [], na: [], iv: [], sv: [], pl: 0, pol: { one: 1, dream: 1.5 }, resources: [], admin: { n: "Admin" } };
  async function api(method, path, body) {
    const h = {}, t = S.get(ROLE + "tok");
    if (t) h.Authorization = "Bearer " + t;
    let b;
    if (body instanceof FormData) b = body;
    else if (body !== void 0) {
      h["Content-Type"] = "application/json";
      b = JSON.stringify(body);
    }
    let r;
    try {
      r = await fetch(API + path, { method, headers: h, body: b });
    } catch {
      throw { error: "Cannot reach the server. Start the backend with: python manage.py runserver", net: 1 };
    }
    const j = await r.json().catch(() => ({}));
    if (r.status == 401 && t && !path.startsWith("/auth/")) {
      S.del(ROLE + "tok");
      location.replace("login.html");
      throw { error: "Session expired" };
    }
    if (!r.ok) throw { error: j.error || "Something went wrong", status: r.status };
    return j;
  }
  async function boot() {
    const d = await api("GET", "/" + ROLE + "/bootstrap");
    db = ROLE == "admin" ? { ...d, nt: [], iv: [], sv: [], pl: 0 } : { st: [d.me], jobs: d.jobs, cos: d.cos, apps: d.apps, nt: d.nt, iv: d.iv || [], sv: d.sv || [], pl: d.pl || 0, pol: d.pol, resources: d.resources || [], na: [] };
  }
  async function call(method, path, body, msg, re = true) {
    try {
      const r = await api(method, path, body);
      await boot();
      if (re) rr();
      if (msg) toast(msg);
      return r || {};
    } catch (e) {
      toast(e.error || "Something went wrong");
      return null;
    }
  }
  var ok = (r) => r ? void 0 : false;
  var DAY = 864e5;
  var ISO = (t) => new Date(t).toISOString().slice(0, 10);
  var co = (id) => db.cos.find((c) => c.id == id);
  var job = (id) => db.jobs.find((j) => j.id == id);
  var ini = (n) => String(n || "?").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  var fd = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  var ago = (t) => {
    const x = Math.round((Date.now() - t) / 6e4);
    return x < 1 ? "just now" : x < 60 ? x + " min ago" : x < 1440 ? Math.round(x / 60) + " hr ago" : Math.round(x / 1440) + " days ago";
  };
  var badge = (s) => `<span class="b ${s.toLowerCase()}">${s}</span>`;
  var empty = (t) => `<div class="emp">${t}</div>`;
  var pkn = (p) => (String(p).match(/[\d.]+/g) || [0]).map(Number);
  var pkmax = (p) => Math.max(...pkn(p));
  var left = (dl) => Math.ceil((+/* @__PURE__ */ new Date(dl + "T23:59:59") - Date.now()) / DAY);
  var offer = (sid) => Math.max(0, ...db.apps.filter((a) => a.s == sid && a.st == "Selected").map((a) => pkmax(job(a.j).pk)));
  function elig(s, j) {
    const has2 = (k) => s.sk.some((x) => x.toLowerCase() == k.toLowerCase()), miss = j.sk.filter((k) => !has2(k)), sm = j.sk.length ? Math.round((j.sk.length - miss.length) / j.sk.length * 100) : 100, c = { cr: j.d.includes(s.d), pc: s.pct >= j.min, p10: (s.p10 || 0) >= (j.m10 || 0), p12: (s.p12 || 0) >= (j.m12 || 0), bk: (s.bk || 0) <= (j.mb || 0), sk: sm >= 60 }, why = [];
    !c.cr && why.push("Your department is not eligible");
    !c.pc && why.push(`Needs ${j.min}% (you have ${s.pct}%)`);
    !c.p10 && why.push(`Needs ${j.m10}% in 10th`);
    !c.p12 && why.push(`Needs ${j.m12}% in 12th / diploma`);
    !c.bk && why.push(`Max ${j.mb || 0} backlog(s) allowed`);
    !c.sk && why.push("Skills match is below 60%");
    return { ok: !why.length, c, m: sm, miss, why };
  }
  function canApply(s, j) {
    const e = elig(s, j), o = offer(s.id);
    if (db.apps.some((a) => a.s == s.id && a.j == j.id)) return { ok: 0, m: "You have already applied." };
    if (left(j.dl) < 0) return { ok: 0, m: "The application deadline has passed." };
    if (!s.rs) return { ok: 0, m: "Upload your resume to apply." };
    if (!e.ok) return { ok: 0, m: e.why[0] + "." };
    if (db.pol.one && o && pkmax(j.pk) < o * db.pol.dream) return { ok: 0, m: `You are already placed (\u20B9${o} LPA). Only dream offers (${db.pol.dream}x or more) are open to you.` };
    return { ok: 1, m: "" };
  }
  var fld = (l, n, v = "", t = "text", x = "") => `<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
  var selp = (l, n, o, v, ph) => `<label>${l}<select name="${n}" required><option value="">${ph}</option>${m(o, (x) => `<option ${x == v ? "selected" : ""}>${esc(x)}</option>`)}</select></label>`;
  var head = (t, s, b = "") => `<div class="ph2"><div><h1 class="ttl">${t}</h1><p class="sub">${s}</p></div>${b}</div>`;
  var pgr = (arr, per = 8) => {
    const n = Math.max(1, Math.ceil(arr.length / per)), p = Math.min(Math.max(+FV.p || 1, 1), n);
    return { o: (p - 1) * per, rows: arr.slice((p - 1) * per, p * per), bar: `<nav class="pgr" aria-label="Pages"><span>${arr.length} result${arr.length == 1 ? "" : "s"}</span>${n > 1 ? m([...Array(n).keys()], (i) => `<button class="chip ${i + 1 == p ? "on" : ""}" data-a="pg" data-p="${i + 1}">${i + 1}</button>`) : ""}</nav>` };
  };
  function toast(t) {
    const e = document.createElement("div");
    e.className = "toast";
    e.setAttribute("role", "status");
    e.textContent = t;
    document.body.append(e);
    setTimeout(() => e.remove(), 3200);
  }
  function modal(title, body, on, okb = "Save", kind = "") {
    const w = document.createElement("div");
    w.className = `md ${kind}`.trim();
    w.innerHTML = `<form class="mc" novalidate role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mt"><h3>${title}</h3><button type="button" class="ib x" aria-label="Close">\u2715</button></div>${body}<div class="mf"><button type="button" class="btn x">Cancel</button><button class="btn fill">${okb}</button></div></form>`;
    if (kind === "portfolio-modal") {
      const h = $(".portfolio-modal-head", w), x = document.createElement("button");
      x.type = "button";
      x.className = "ib x";
      x.setAttribute("aria-label", "Close dialog");
      x.textContent = "\xD7";
      h && h.append(x);
    }
    const f = $("form", w), k = (e) => e.key == "Escape" && close(), close = () => {
      w.remove();
      document.removeEventListener("keydown", k);
    };
    document.addEventListener("keydown", k);
    w.onclick = (e) => {
      if (e.target == w || e.target.closest(".x")) close();
    };
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const r = await on(Object.fromEntries(new FormData(f)), f);
      if (r !== false) close();
    };
    document.body.append(w);
    const i = $("input:not([type=hidden]):not([type=file]),select,textarea", f);
    i && i.focus();
  }
  var ask = (t, fn) => modal("Are you sure?", `<p class="mu">${t}</p>`, async () => {
    await fn();
  }, "Confirm");
  var V404 = () => `<div class="e404"><b>404</b><h2>Page not found</h2><p class="mu">The page you are looking for does not exist.</p><a class="btn fill" href="#/${HOME}">Go back home</a></div>`;
  var HOME = "";
  var FV = {};
  var Q = new URLSearchParams();
  var ui = { LF: () => "" };
  var A = {};
  var F = {};
  var rr = () => dispatchEvent(new Event("hashchange"));
  A.pg = (d) => {
    FV.p = +d.p;
    $("#lst").innerHTML = ui.LF();
  };
  A.out = async (d) => {
    try {
      await api("POST", "/auth/logout");
    } catch {
    }
    S.del(ROLE + "tok");
    location.href = d.to;
  };
  var closeAppDropdown = (dropdown, restoreFocus = false) => {
    const trigger = $("[data-app-filter-toggle]", dropdown), menu = $(".application-select-menu", dropdown);
    dropdown.classList.remove("open");
    trigger?.setAttribute("aria-expanded", "false");
    menu?.setAttribute("aria-hidden", "true");
    $$(".application-select-option", dropdown).forEach((option) => option.tabIndex = -1);
    if (restoreFocus) trigger?.focus();
  };
  var openAppDropdown = (dropdown, focusOption = false) => {
    $$(".app-filter-dropdown.open").forEach((other) => {
      if (other !== dropdown) closeAppDropdown(other);
    });
    const trigger = $("[data-app-filter-toggle]", dropdown), menu = $(".application-select-menu", dropdown);
    dropdown.classList.add("open");
    trigger?.setAttribute("aria-expanded", "true");
    menu?.setAttribute("aria-hidden", "false");
    const options = $$(".application-select-option", dropdown);
    options.forEach((option) => option.tabIndex = 0);
    if (focusOption) (options.find((option) => option.getAttribute("aria-selected") === "true") || options[0])?.focus();
  };
  document.addEventListener("click", (e) => {
    const target = e.target, option = target.closest("[data-app-filter-option]"), toggle = target.closest("[data-app-filter-toggle]");
    if (option) {
      const dropdown = option.closest(".app-filter-dropdown"), name = option.dataset.name || "";
      FV[name] = option.dataset.value || "";
      FV.p = 1;
      $$(".application-select-option", dropdown).forEach((item2) => {
        const selected = item2 === option;
        item2.setAttribute("aria-selected", String(selected));
        $("i", item2).textContent = selected ? "\u2713" : "";
      });
      const trigger = $("[data-app-filter-toggle]", dropdown);
      $(".application-select-value", trigger).textContent = option.dataset.label || "";
      trigger.setAttribute("aria-label", `${dropdown.id.endsWith("job") ? "Filter by job" : "Filter by date"}: ${option.dataset.label || ""}`);
      closeAppDropdown(dropdown, true);
      $("#lst").innerHTML = ui.LF();
      charts();
      return;
    }
    if (toggle) {
      const dropdown = toggle.closest(".app-filter-dropdown");
      if (dropdown.classList.contains("open")) closeAppDropdown(dropdown);
      else openAppDropdown(dropdown);
      return;
    }
    if (!target.closest(".app-filter-dropdown")) $$(".app-filter-dropdown.open").forEach((dropdown) => closeAppDropdown(dropdown));
    const a = target.closest("[data-a]");
    if (a && A[a.dataset.a || ""]) {
      e.preventDefault();
      A[a.dataset.a || ""](a.dataset, a);
    }
    const t = target.closest("button.fl");
    if (t) {
      const n = t.dataset.n || "", v = t.dataset.v || "";
      FV[n] = FV[n] == v && v !== "" ? "" : v;
      FV.p = 1;
      $$('button.fl[data-n="' + n + '"]').forEach((b) => b.classList.toggle("on", (FV[n] || "") == b.dataset.v));
      $("#lst").innerHTML = ui.LF();
      charts();
    }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-f]");
    if (f && F[f.dataset.f]) {
      e.preventDefault();
      F[f.dataset.f](Object.fromEntries(new FormData(f)), f);
    }
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.classList.contains("fl") && $("#lst")) {
      FV[t.name] = t.value;
      FV.p = 1;
      $("#lst").innerHTML = ui.LF();
      charts();
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.classList.contains("fl") && $("#lst")) {
      FV[t.name] = t.value;
      FV.p = 1;
      $("#lst").innerHTML = ui.LF();
      charts();
    }
  });
  document.addEventListener("keydown", (e) => {
    const target = e.target, trigger = target.closest("[data-app-filter-toggle]"), option = target.closest("[data-app-filter-option]");
    if (trigger && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      const dropdown = trigger.closest(".app-filter-dropdown");
      if (!dropdown.classList.contains("open")) openAppDropdown(dropdown, true);
      else {
        const options = $$(".application-select-option", dropdown), index = options.findIndex((item2) => item2 === document.activeElement), next = e.key === "ArrowUp" ? options[Math.max(0, index - 1)] : options[Math.min(options.length - 1, Math.max(0, index + 1))];
        next?.focus();
      }
      return;
    }
    if (option) {
      const dropdown = option.closest(".app-filter-dropdown"), options = $$(".application-select-option", dropdown), index = options.indexOf(option);
      if (e.key === "Escape") {
        e.preventDefault();
        closeAppDropdown(dropdown, true);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        options[(index + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        options[e.key === "Home" ? 0 : options.length - 1]?.focus();
      }
      return;
    }
    if (e.key == "Escape") $$(".app-filter-dropdown.open").forEach((dropdown) => closeAppDropdown(dropdown));
    if (e.key == "/" && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) && $("#gs")) {
      e.preventDefault();
      $("#gs").focus();
    }
  });
  function charts() {
    if (!window.Chart) return;
    $$("canvas[data-ch]").forEach((c) => {
      const o = JSON.parse(c.dataset.ch), dn = o.t == "doughnut";
      new Chart(c, { type: o.t, data: { labels: o.l, datasets: o.d.map((d, i) => ({ label: d.n, data: d.v, borderColor: o.t == "line" ? PAL[i] : void 0, backgroundColor: dn ? PAL : o.t == "line" ? PAL[i] + "22" : PAL[i], fill: o.t == "line", tension: 0.4, borderRadius: 8, borderWidth: dn ? 0 : 2 })) }, options: { responsive: true, maintainAspectRatio: false, cutout: dn ? "68%" : void 0, plugins: { legend: { display: dn || o.d.length > 1, position: "bottom" } }, scales: dn ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } });
    });
  }
  var offline = (e) => $("#root").innerHTML = `<div class="ld err"><h2>Server not reachable</h2><p>${esc(e.error)}</p><button class="btn fill" onclick="location.reload()">Try again</button></div>`;
  async function start(c) {
    if (!S.get(ROLE + "tok")) {
      location.replace("login.html");
      return;
    }
    $("#root").innerHTML = '<div class="ld"><i></i>Loading\u2026</div>';
    try {
      await boot();
    } catch (e) {
      if (e.net) offline(e);
      return;
    }
    if (c.guard && c.guard() === false) return;
    app(c);
  }
  function app(c) {
    HOME = c.nav[0][0];
    $("#root").innerHTML = `<div class="app"><aside class="sb" id="sb"><a class="logo" href="#/${HOME}">${LOGO}<span>Career<b>Track</b></span></a><p class="role"><span></span>${c.role}</p><nav id="nv" aria-label="Main"><span class="ind" id="ind"></span>${m(c.nav, (n) => `<a href="#/${n[0]}" data-id="${n[0]}"><i aria-hidden="true">${navIcon(n[0])}</i><span>${n[2]}</span></a>`)}</nav><div class="sb-actions">${c.home ? `<a class="out website" href="${c.home}"><i aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg></i><span>Website</span><svg class="action-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a>` : ""}<a class="out logout" href="#" data-a="out" data-to="${c.to}"><i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg></i><span>Log out</span></a></div></aside><div class="mn"><header class="tb"><div class="tb-start"><button class="ib mb" id="mb" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="sb">\u2630</button><nav class="crumb" aria-label="Breadcrumb"><a href="#/${HOME}">Dashboard</a><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg><span id="crumb-current">Overview</span></nav></div><div class="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input class="gs" id="gs" type="search" placeholder="Search jobs, skills, or companies..." aria-label="Search jobs, skills, or companies"><kbd>/</kbd></div><div class="tb-actions"><a class="ib bell" href="#/notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/></svg><em id="bc"></em></a><a class="profile-chip" id="profile-chip" href="#/${c.pf}" aria-label="Open student profile"><span class="av" id="av" aria-hidden="true"></span><span class="profile-name" id="profile-name"></span><svg class="profile-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></a></div></header><main id="pg" class="pg"></main></div><button class="ov" id="ov" type="button" aria-label="Close navigation" tabindex="-1"></button></div>`;
    const sb = $("#sb"), ov = $("#ov"), mb = $("#mb"), tg2 = (o) => {
      sb.classList.toggle("open", o);
      ov.classList.toggle("on", o);
      document.body.classList.toggle("nav-open", o);
      mb.setAttribute("aria-expanded", String(o));
      mb.setAttribute("aria-label", o ? "Close navigation" : "Open navigation");
      mb.textContent = o ? "\xD7" : "\u2630";
    };
    mb.onclick = () => tg2(!sb.classList.contains("open"));
    ov.onclick = () => tg2(false);
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sb.classList.contains("open")) {
        tg2(false);
        mb.focus();
      }
    });
    addEventListener("resize", () => {
      if (innerWidth > 900) tg2(false);
    });
    const go = () => {
      const [p, q] = (location.hash.slice(2) || HOME).split("?"), [id, arg] = p.split("/");
      Q = new URLSearchParams(q || "");
      FV = { q: Q.get("q") || "", st: Q.get("st") || "" };
      ui.LF = () => "";
      const pg = $("#pg");
      pg.innerHTML = (Object.hasOwn(c.views, id) ? c.views[id] : V404)(arg);
      pg.style.animation = "none";
      pg.offsetWidth;
      pg.style.animation = "";
      $("#crumb-current").textContent = id === "dashboard" ? "Overview" : (c.nav.find((n2) => n2[0] === id) || c.nav.find((n2) => n2[0] === (c.al || {})[id]) || ["", "", id])[2];
      $("#gs").value = id === c.sv ? Q.get("q") || "" : "";
      $$("#nv a").forEach((a) => a.classList.toggle("on", a.dataset.id == id || (c.al || {})[id] == a.dataset.id));
      const on = $("#nv a.on"), ind = $("#ind");
      if (on && ind) {
        const side2 = $("#sb"), sideRect = side2.getBoundingClientRect(), linkRect = on.getBoundingClientRect();
        if (linkRect.top < sideRect.top || linkRect.bottom > sideRect.bottom) on.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        if (!ind.dataset.r) ind.style.transition = "none";
        ind.style.height = on.offsetHeight + "px";
        ind.style.transform = `translateY(${on.offsetTop}px)`;
        ind.style.opacity = "1";
        requestAnimationFrame(() => {
          ind.style.transition = "";
          ind.dataset.r = "1";
        });
      }
      const u = c.user();
      $("#av").innerHTML = u.photo ? `<img src="${esc(media(u.photo))}" alt="">` : ini(u.n);
      $("#profile-name").textContent = u.n.split(" ").slice(0, 2).map((part, i) => i === 1 ? part[0] + "." : part).join(" ");
      const n = c.unread();
      $("#bc").textContent = n;
      $("#bc").hidden = !n;
      tg2(false);
      scrollTo(0, 0);
      charts();
    };
    const searchInput = $("#gs");
    searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const query2 = searchInput.value.trim(), target = query2 ? `#/${c.sv}?q=${encodeURIComponent(query2)}` : `#/${c.sv}`;
      if (location.hash === target) go();
      else location.hash = target;
    });
    addEventListener("hashchange", go);
    go();
  }

  // src/profile.ts
  var ME = () => db.st[0];
  var YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Passed out"];
  var DEGREES = ["B.E.", "B.Tech", "B.Sc", "BCA", "M.Tech", "MCA", "Diploma"];
  var GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
  var ROLES = ["Software Developer", "Frontend Developer", "Backend Developer", "Data Analyst", "DevOps Engineer", "Embedded Engineer", "Design Engineer", "System Engineer"];
  var CITIES = ["Pune", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolhapur", "Nashik"];
  var SKC = [["tech", "Technical Skills", ["Git", "SQL", "Linux", "Docker", "Excel", "AutoCAD", "DSA"]], ["lang", "Programming Languages", ["Python", "Java", "JavaScript", "C++", "C"]], ["fw", "Frameworks & Libraries", ["React", "Django", "Node.js", "Spring", "Express"]], ["soft", "Soft Skills", ["Communication", "Teamwork", "Problem Solving", "Leadership"]]];
  var W = {};
  var initW = (s) => {
    SKC.forEach((c) => W[c[0]] = s.skills.filter((x) => x.c == c[0]).map((x) => x.n));
    W.roles = [...s.pref.roles];
    W.locs = [...s.pref.locs];
    W.types = [...s.pref.types];
    W.cats = [...s.pref.cats];
  };
  var chips = (k) => m(W[k], (x, i) => `<span>${esc(x)}<button type="button" data-a="ciDel" data-k="${k}" data-i="${i}" aria-label="Remove ${esc(x)}">\u2715</button></span>`) || '<small class="mu">Nothing added yet</small>';
  var ci = (k, ph, sug) => `<div class="ci" data-k="${k}"><div class="sk">${chips(k)}</div><div class="inl"><input class="sk-in" data-k="${k}" list="dl-${k}" placeholder="${ph}" maxlength="40"><datalist id="dl-${k}">${m(sug, (x) => `<option value="${esc(x)}">`)}</datalist><button type="button" class="btn sm" data-a="ciAdd" data-k="${k}">+ Add</button></div></div>`;
  var tg = (k, opts) => `<div class="chips">${m(opts, (o) => `<button type="button" class="chip ${W[k].includes(o) ? "on" : ""}" data-a="tg" data-k="${k}" data-v="${esc(o)}">${esc(o)}</button>`)}</div>`;
  A.ciAdd = (d) => {
    const i = $(`.sk-in[data-k="${d.k}"]`), v = i.value.trim();
    if (v && !W[d.k].some((x) => x.toLowerCase() == v.toLowerCase()) && W[d.k].length < 30) W[d.k].push(v);
    i.value = "";
    $(`.ci[data-k="${d.k}"] .sk`).innerHTML = chips(d.k);
    i.focus();
  };
  A.ciDel = (d) => {
    W[d.k].splice(+d.i, 1);
    $(`.ci[data-k="${d.k}"] .sk`).innerHTML = chips(d.k);
  };
  A.tg = (d, b) => {
    const a = W[d.k], i = a.indexOf(d.v);
    i < 0 ? a.push(d.v) : a.splice(i, 1);
    b.classList.toggle("on", i < 0);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && e.target.classList.contains("sk-in")) {
      e.preventDefault();
      A.ciAdd(e.target.dataset);
    }
  });
  var phw = (s) => `<div class="phw">${s.photo ? `<img class="bigav" src="${esc(media(s.photo))}" alt="Profile photo">` : `<div class="bigav">${ini(s.n)}</div>`}<div><button type="button" class="btn sm" data-a="photo">${s.photo ? "Change photo" : "Upload photo"}</button>${s.photo ? '<button type="button" class="btn sm dn" data-a="photoD">Remove</button>' : ""}<p class="mu" style="font-size:13px;margin-top:6px">JPG, PNG or WEBP \xB7 max 2 MB</p><input id="pf" type="file" accept="image/jpeg,image/png,image/webp" hidden></div></div>`;
  var full = (m2) => m2 == "full" || m2 == "card";
  var save = (m2) => full(m2) ? '<div class="full"><button class="btn fill">Save changes</button></div>' : "";
  var plist = () => ME().pr.map((x) => ({ ...x }));
  var clist = () => ME().ce.map((x) => ({ ...x }));
  var SEC = {
    personal: {
      t: "Personal Information",
      s: "Tell us about yourself",
      ic: "\u{1F464}",
      render(s, md) {
        return (md == "card" ? "" : phw(s)) + `<form id="secf" data-f="sec" data-k="personal" class="fg2">${full(md) ? fld("Full name", "name", s.n, "text", "required") + fld("Mobile number", "phone", s.ph, "tel", "required") : ""}${fld("Date of birth", "dob", s.dob, "date", `required max="${ISO(Date.now())}"`)}${selp("Gender", "gender", GENDERS, s.gn, "Select gender")}<div class="full">${fld("Current location", "loc", s.loc, "text", 'required placeholder="Pune, Maharashtra"')}</div><div class="full"><label>Address<textarea name="ad" rows="2" required>${esc(s.ad)}</textarea></label></div>${save(md)}</form>`;
      },
      get: (d) => ({ ...d.name !== void 0 ? { name: d.name.trim(), phone: d.phone } : {}, dob: d.dob, gender: d.gender, loc: d.loc.trim(), ad: d.ad.trim() }),
      chk: (p) => p.dob && p.gender && p.loc && p.ad ? "" : "Fill in all the fields."
    },
    education: {
      t: "Education Details",
      s: "Add your academic information",
      ic: "\u{1F393}",
      render(s, md) {
        const y = (/* @__PURE__ */ new Date()).getFullYear(), py = [...Array(8).keys()].map((i) => y - 1 + i);
        return `<form id="secf" data-f="sec" data-k="education" class="fg2"><div class="full">${fld("College name", "col", s.col, "text", "required")}</div>${selp("Degree / Course", "deg", DEGREES, s.deg, "Select degree")}${selp("Department", "d", DEPTS, s.col ? s.d : "", "Select department")}${selp("Current year", "yr", YEARS, s.yr, "Select year")}${selp("Passing year", "py", py, s.py, "Select year")}${fld("10th percentage", "p10", s.p10 || "", "number", "required min=0 max=100 step=0.01")}${fld("12th / Diploma percentage", "p12", s.p12 || "", "number", "required min=0 max=100 step=0.01")}<label>Graduation score type<select name="sty"><option ${s.sty == "CGPA" ? "selected" : ""}>CGPA</option><option ${s.sty == "Percentage" ? "selected" : ""}>Percentage</option></select></label><label>Graduation score<input name="sc" type="number" min="0" max="100" step="0.01" value="${s.sc || ""}" required><small class="mu" id="cv">${s.sty == "CGPA" && s.sc ? `\u2248 ${(s.sc * 9.5).toFixed(1)}% (CGPA \xD7 9.5)` : ""}</small></label>${fld("Active backlogs", "bk", s.bk || 0, "number", "required min=0 max=30")}${save(md)}</form>`;
      },
      get: (d) => ({ col: d.col.trim(), deg: d.deg, d: d.d, yr: d.yr, py: +d.py, p10: +d.p10, p12: +d.p12, sty: d.sty, sc: +d.sc, bk: +d.bk || 0 }),
      chk: (p) => p.sty == "CGPA" && p.sc > 10 ? "CGPA cannot be more than 10." : ""
    },
    skills: {
      t: "Skills & Technologies",
      s: "Add your skills and expertise",
      ic: "\u{1F4A1}",
      render(s, md) {
        initW(s);
        return `<form id="secf" data-f="sec" data-k="skills">${m(SKC, (c) => `<h4 class="skh">${c[1]}</h4>${ci(c[0], "Add a skill", c[2])}`)}<p class="mu" style="margin-top:16px">Add at least 3 technical skills. They are matched with each job's required skills.</p>${full(md) ? '<button class="btn fill" style="margin-top:12px">Save changes</button>' : ""}</form>`;
      },
      get: () => ({ skills: SKC.flatMap((c) => W[c[0]].map((n) => ({ n, c: c[0] }))) }),
      chk: (p) => p.skills.filter((x) => x.c != "soft").length < 3 ? "Add at least 3 technical skills (soft skills do not count)." : ""
    },
    projects: {
      t: "Projects & Certifications",
      s: "Showcase your work, skills, and achievements",
      ic: "\u{1F3C6}",
      opt: 1,
      render(s) {
        const projects = s.pr || [], certs = s.ce || [], icon = (kind) => kind == "project" ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m8 10-2 2 2 2m8-4 2 2-2 2m-4-5-2 6"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 3Z"/><path d="m8 17-1 4 5-2 5 2-1-4"/></svg>';
        return `<div class="portfolio">
<div class="portfolio-summary"><span class="portfolio-summary-mark" aria-hidden="true">\u2726</span><p><b>Your career story, at a glance.</b><small>Show recruiters what you\u2019ve built and what you\u2019ve learned.</small></p><div class="portfolio-totals"><span><b>${projects.length}</b> ${projects.length == 1 ? "project" : "projects"}</span><i></i><span><b>${certs.length}</b> ${certs.length == 1 ? "certificate" : "certificates"}</span></div></div>
<section class="portfolio-section" aria-labelledby="portfolio-projects"><div class="portfolio-heading"><div><span class="portfolio-eyebrow">BUILT BY YOU</span><h2 id="portfolio-projects">Projects</h2><p>Ideas and work you\u2019re proud to share.</p></div><button class="btn fill portfolio-add" data-a="pr"><span aria-hidden="true">\uFF0B</span> Add project</button></div>
${projects.length ? `<div class="portfolio-project-grid">${m(projects, (p, i) => `<article class="portfolio-project"><div class="portfolio-card-top"><span class="portfolio-icon project-icon">${icon("project")}</span><div class="portfolio-actions"><button class="portfolio-action" data-a="pr" data-i="${i}" aria-label="Edit ${esc(p.n)}">Edit</button><button class="portfolio-action remove" data-a="prD" data-i="${i}" aria-label="Remove ${esc(p.n)}">Remove</button></div></div><h3>${esc(p.n)}</h3><p class="portfolio-description">${esc(p.ds) || "Add a short description to tell recruiters about this project."}</p>${p.tk ? `<div class="portfolio-tags" aria-label="Technologies used">${m(String(p.tk).split(",").map((x) => x.trim()).filter(Boolean), (x) => `<span>${esc(x)}</span>`)}</div>` : ""}<div class="portfolio-card-footer">${p.lk ? `<a class="portfolio-link" href="${esc(p.lk)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m-11 5L20 4"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>View project</a>` : '<span class="portfolio-link muted">Project showcase</span>'}<span class="portfolio-card-index">${String(i + 1).padStart(2, "0")}</span></div></article>`)}</div>` : `<div class="portfolio-empty"><span class="portfolio-empty-icon">${icon("project")}</span><b>Your projects will shine here</b><p>Add a project to showcase your skills and hands-on experience.</p><button class="btn sm" data-a="pr">Add your first project</button></div>`}</section>
<section class="portfolio-section certification-section" aria-labelledby="portfolio-certifications"><div class="portfolio-heading"><div><span class="portfolio-eyebrow">RECOGNITION & LEARNING</span><h2 id="portfolio-certifications">Certifications</h2><p>Courses and credentials that move you forward.</p></div><button class="btn portfolio-add" data-a="ce"><span aria-hidden="true">\uFF0B</span> Add certification</button></div>
${certs.length ? `<div class="portfolio-cert-list">${m(certs, (c, i) => `<article class="portfolio-cert">${c.img ? `<a class="portfolio-cert-image" href="${esc(media(c.img))}" target="_blank" rel="noopener noreferrer" aria-label="View certificate image for ${esc(c.n)}"><img src="${esc(media(c.img))}" alt="Certificate: ${esc(c.n)}"></a>` : `<span class="portfolio-icon cert-icon">${icon("cert")}</span>`}<div class="portfolio-cert-copy"><h3>${esc(c.n)}</h3><p>${esc(c.o) || "Issuing organization"}${c.y ? `<span aria-hidden="true"> \xB7 </span>${esc(c.y)}` : ""}</p></div><span class="portfolio-verified"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg> Credential</span><div class="portfolio-actions"><button class="portfolio-action" data-a="ce" data-i="${i}" aria-label="Edit ${esc(c.n)}">Edit</button><button class="portfolio-action remove" data-a="ceD" data-i="${i}" aria-label="Remove ${esc(c.n)}">Remove</button></div></article>`)}</div>` : `<div class="portfolio-empty cert-empty"><span class="portfolio-empty-icon">${icon("cert")}</span><b>No certifications added yet</b><p>Share completed courses and credentials with recruiters.</p><button class="btn sm" data-a="ce">Add a certification</button></div>`}</section>
</div>`;
      }
    },
    resume: {
      t: "Resume Upload",
      s: "Upload your latest resume",
      ic: "\u{1F4C4}",
      opt: 1,
      render(s) {
        return `<label class="dz" for="rf"><span>\u2601\uFE0F</span><b>Drag &amp; drop your resume here</b><small class="mu">or click to browse \xB7 PDF, DOC, DOCX \xB7 max 5 MB</small><input id="rf" type="file" accept=".pdf,.doc,.docx" hidden></label>${s.rs ? `<div class="row"><div class="ic">\u{1F4C4}</div><div class="grow"><b>${esc(s.rs)}</b><br><small class="mu">Uploaded ${s.rsd ? fd(s.rsd) : ""}</small></div><a class="btn sm" href="${esc(media(s.rsu))}" target="_blank" rel="noopener">View</a><button class="btn sm dn" data-a="rsD">Remove</button></div>` : '<p class="mu">A resume is required before you can apply for jobs.</p>'}`;
      }
    },
    prefs: {
      t: "Career Preferences",
      s: "Help us find the best opportunities for you",
      ic: "\u{1F3AF}",
      opt: 1,
      render(s, md) {
        initW(s);
        return `<form id="secf" data-f="sec" data-k="prefs"><h4 class="skh">Preferred job roles</h4>${ci("roles", "e.g. Software Developer", ROLES)}<h4 class="skh">Preferred locations</h4>${ci("locs", "e.g. Pune", CITIES)}<h4 class="skh">Employment type</h4>${tg("types", ["Full-Time", "Internship"])}<div style="margin-top:16px">${fld("Expected salary (LPA)", "sal", s.pref.sal || "", "number", "min=0 max=200 step=0.5")}</div><h4 class="skh">Interested categories</h4>${tg("cats", CATS)}${full(md) ? '<button class="btn fill" style="margin-top:18px">Save changes</button>' : ""}</form>`;
      },
      get: (d) => ({ pref: { roles: W.roles, locs: W.locs, types: W.types, sal: +d.sal || 0, cats: W.cats } }),
      chk: (p) => (p.pref.roles.length || p.pref.cats.length) && p.pref.locs.length ? "" : "Add at least one role or category, and one location."
    }
  };
  function renderPortfolio(s, kind) {
    const projects = s.pr || [], certs = s.ce || [], projectView = kind == "projects", published = projects.filter((p) => p.st != "Draft").length, drafts = projects.length - published, linked = certs.filter((c) => c.vl).length, latest = certs.map((c) => c.idat).filter(Boolean).sort().pop();
    const projectCards = projects.length ? `<div class="portfolio-project-grid ${projects.length === 1 ? "single-project" : ""}">${m(projects, (p, i) => `<article class="portfolio-project"><div class="portfolio-project-image">${p.thumb ? `<img src="${esc(media(p.thumb))}" alt="${esc(p.n)} thumbnail">` : '<div class="portfolio-project-art" aria-hidden="true"><div class="project-art-window"><span></span><span></span><span></span><b>&lt;/&gt;</b><small>design \xB7 code \xB7 create</small></div><i></i></div>'}<span class="portfolio-status ${p.st == "Draft" ? "draft" : "published"}">${esc(p.st || "Published")}</span><div class="portfolio-actions"><button class="portfolio-action" data-a="pr" data-i="${i}">Edit</button><button class="portfolio-action remove" data-a="prD" data-i="${i}">Remove</button></div></div><div class="portfolio-project-copy"><h3>${esc(p.n)}</h3><p class="portfolio-description">${esc(p.ds) || "Add a short description to tell recruiters about this project."}</p>${p.tk ? `<div class="portfolio-tags">${m(String(p.tk).split(",").map((x) => x.trim()).filter(Boolean), (x) => `<span>${esc(x)}</span>`)}</div>` : ""}<div class="portfolio-card-footer">${p.lk ? `<a class="portfolio-link" href="${esc(p.lk)}" target="_blank" rel="noopener noreferrer">\u25C9 GitHub</a>` : ""}${p.demo ? `<a class="portfolio-link" href="${esc(p.demo)}" target="_blank" rel="noopener noreferrer">\u2197 Live demo</a>` : ""}</div></div></article>`)}</div>` : `<div class="portfolio-empty"><span class="portfolio-empty-icon">\u2318</span><b>Your projects will shine here</b><p>Add a project to showcase your skills and hands-on experience.</p><button class="btn sm" data-a="pr">Add your first project</button></div>`;
    const isPdf = (name) => String(name || "").toLowerCase().endsWith(".pdf");
    const certCards = certs.length ? `<div class="portfolio-cert-list">${m(certs, (c, i) => `<article class="portfolio-cert">${c.file ? `<a class="portfolio-cert-image ${isPdf(c.fn) ? "pdf" : ""}" href="${esc(media(c.file))}" target="_blank" rel="noopener noreferrer" aria-label="View ${esc(c.n)} certificate">${isPdf(c.fn) ? "<span>PDF</span>" : `<img src="${esc(media(c.file))}" alt="Certificate: ${esc(c.n)}">`}</a>` : c.img ? `<a class="portfolio-cert-image" href="${esc(media(c.img))}" target="_blank" rel="noopener noreferrer"><img src="${esc(media(c.img))}" alt="Certificate: ${esc(c.n)}"></a>` : '<div class="portfolio-cert-image portfolio-certificate-art" aria-hidden="true"><small>CAREERTRACK \xB7 CREDENTIAL</small><b>CERTIFICATE</b><span>OF COMPLETION</span><i>\u2605</i></div>'}<div class="portfolio-cert-copy"><div class="portfolio-cert-title"><h3>${esc(c.n)}</h3><span class="portfolio-status ${c.vl ? "published" : "draft"}">${c.vl ? "Linked" : "No link"}</span></div><p>${esc(c.o) || "Issuing organization"}${c.idat ? ` \xB7 Issued ${esc(fd(c.idat))}` : c.y ? ` \xB7 ${esc(c.y)}` : ""}</p>${c.cid ? `<small>Credential ID: ${esc(c.cid)}</small>` : ""}</div><div class="portfolio-cert-actions">${c.vl ? `<a class="btn sm" href="${esc(c.vl)}" target="_blank" rel="noopener noreferrer">Verify</a>` : ""}${c.file ? `<a class="btn sm" href="${esc(media(c.file))}" target="_blank" rel="noopener">View</a><a class="btn sm" href="${esc(media(c.file))}" download="${esc(c.fn)}">Download</a>` : c.img ? `<a class="btn sm" href="${esc(media(c.img))}" target="_blank" rel="noopener">View</a>` : ""}<button class="portfolio-action" data-a="ce" data-i="${i}">Edit</button><button class="portfolio-action remove" data-a="ceD" data-i="${i}">Delete</button></div></article>`)}</div>` : `<div class="portfolio-empty cert-empty"><span class="portfolio-empty-icon">\u2605</span><b>No certificates added yet</b><p>Share completed courses and credentials with recruiters.</p><button class="btn sm" data-a="ce">Upload your first certificate</button></div>`;
    const title = projectView ? "My Projects" : "My Certificates", subtitle = projectView ? "Showcase your amazing projects and skills." : "Manage and showcase your certifications.", add = projectView ? "Add New Project" : "Upload Certificate";
    return `<div class="portfolio-page ${projectView ? "projects-only" : "certificates-only"}"><header class="portfolio-page-heading"><span class="portfolio-page-icon">${projectView ? "\u2318" : "\u2605"}</span><div><h1>${title}</h1><p>${subtitle}</p></div><button class="btn fill portfolio-add" data-a="${projectView ? "pr" : "ce"}">${projectView ? "\uFF0B" : "\u21E7"} ${add}</button></header>${projectView ? `<div class="portfolio-stats"><div><span class="portfolio-stat-icon blue">\u2318</span><small>Total Projects</small><b>${projects.length}</b></div><div><span class="portfolio-stat-icon green">\u2713</span><small>Published</small><b>${published}</b></div><div><span class="portfolio-stat-icon orange">\u25A3</span><small>Draft</small><b>${drafts}</b></div></div><section class="portfolio-section">${projectCards}</section><div class="portfolio-banner"><span>\u{1F3C6}</span><div><b>Keep building amazing projects!</b><small>Your projects help showcase your skills to recruiters.</small></div></div>` : `<div class="portfolio-stats"><div><span class="portfolio-stat-icon purple">\u2605</span><small>Total Certificates</small><b>${certs.length}</b></div><div><span class="portfolio-stat-icon green">\u2713</span><small>With verification link</small><b>${linked}</b></div><div><span class="portfolio-stat-icon orange">\u25A6</span><small>Latest issue</small><b>${latest ? esc((/* @__PURE__ */ new Date(latest + "T00:00:00")).getFullYear()) : "\u2014"}</b></div></div><section class="portfolio-section certification-section">${certCards}</section><div class="portfolio-banner cert-banner"><span>\u{1F3C5}</span><div><b>Keep adding your certificates!</b><small>Certifications boost your profile and increase your chances of getting hired.</small></div></div>`}</div>`;
  }
  F.sec = async (d, f) => {
    const k = f.dataset.k, x = SEC[k], p = x.get(d, f), e = x.chk && x.chk(p);
    if (e) return toast(e);
    if (window.WZ) p.step = window.WZ.n(k);
    const y = scrollY, r = await call("PUT", "/student/profile", p, window.WZ ? "" : "Saved changes", !window.WZ);
    if (!window.WZ) scrollTo(0, y);
    if (r && window.WZ) window.WZ.after(k);
  };
  document.addEventListener("input", (e) => {
    const f = e.target.closest("form[data-k=education]");
    if (f) {
      const v = +f.elements.sc.value, h = $("#cv");
      if (h) h.textContent = f.elements.sty.value == "CGPA" && v ? `\u2248 ${(v * 9.5).toFixed(1)}% (CGPA \xD7 9.5)` : "";
    }
  });
  A.pr = (d) => {
    const s = ME(), p = s.pr[d.i] || {}, thumbnail = `<div class="portfolio-upload-box"><div class="portfolio-upload-preview" id="project-thumb-preview">${p.thumb ? `<img src="${esc(media(p.thumb))}" alt="Current project thumbnail">` : "<span>\u21E7</span>"}</div><b>Upload project thumbnail</b><small>PNG, JPG \xB7 Max 5 MB</small><label class="btn sm" for="project-thumb">Choose image</label><input id="project-thumb" name="thumbnail" type="file" accept=".png,.jpg,.jpeg" hidden>${p.thumb ? '<label class="portfolio-remove-file"><input type="checkbox" name="removeThumbnail" value="1"> Remove current thumbnail</label>' : ""}</div>`;
    const body = `<div class="portfolio-modal-head"><span class="portfolio-modal-mark">\u2318</span><div><h2>${d.i === void 0 ? "Add New Project" : "Edit Project"}</h2><p>Showcase your amazing projects and skills.</p></div></div><div class="portfolio-project-form"><div>${thumbnail}</div><div class="portfolio-modal-fields">${fld("Project Title *", "n", p.n, "text", 'required maxlength=120 placeholder="Enter project title..."')}<label>Project Description *<textarea name="ds" rows="3" maxlength="600" required placeholder="Describe your project in detail...">${esc(p.ds)}</textarea></label></div></div><div class="portfolio-modal-fields portfolio-project-links">${fld("Technologies Used", "tk", p.tk, "text", 'maxlength=200 placeholder="e.g. React, Node.js, MongoDB..."')}${fld("GitHub Link", "lk", p.lk, "url", 'placeholder="https://github.com/..."')}${fld("Live Demo Link", "demo", p.demo, "url", 'placeholder="https://..."')}</div><fieldset class="portfolio-status-field"><legend>Project Status</legend><label><input type="radio" name="st" value="Published" ${p.st != "Draft" ? "checked" : ""}> <span>\u2713 Published</span></label><label><input type="radio" name="st" value="Draft" ${p.st == "Draft" ? "checked" : ""}> <span>\u25F7 Draft</span></label></fieldset>`;
    modal(d.i === void 0 ? "Add New Project" : "Edit Project", body, async (v) => {
      const image = v.thumbnail instanceof File && v.thumbnail.size ? v.thumbnail : void 0, remove = v.removeThumbnail === "1";
      if (image && !/\.(png|jpe?g)$/i.test(image.name)) {
        toast("Project thumbnail must be PNG or JPG");
        return false;
      }
      if (image && image.size > 5 * 1048576) {
        toast("Project thumbnail must be under 5 MB");
        return false;
      }
      const record = { ...p, id: p.id, n: v.n.trim(), ds: v.ds.trim(), tk: v.tk.trim(), lk: v.lk.trim(), demo: v.demo.trim(), st: v.st || "Published", thumb: p.thumb || "" }, L = plist(), index = d.i === void 0 ? L.length : +d.i;
      d.i === void 0 ? L.push(record) : L[index] = record;
      const saved = await call("PUT", "/student/profile", { pr: L }, image || remove ? "" : "Project saved");
      if (!saved) return false;
      const project = saved.me.pr[index];
      if (image) {
        const fd2 = new FormData();
        fd2.append("file", image);
        return ok(await call("POST", `/student/projects/${project.id}/thumbnail`, fd2, "Project saved"));
      }
      if (remove && project?.id) return ok(await call("DELETE", `/student/projects/${project.id}/thumbnail`, void 0, "Project saved"));
    }, d.i === void 0 ? "Add Project \u2192" : "Save Changes", "portfolio-modal");
  };
  A.prD = (d) => ask("Remove this project?", () => call("PUT", "/student/profile", { pr: plist().filter((_, i) => i != d.i) }, "Project removed"));
  A.ce = (d) => {
    const s = ME(), c = s.ce[d.i] || {}, fileBody = `<div class="portfolio-cert-upload"><div class="portfolio-cert-file-preview" id="cert-file-preview">${c.file ? `<span>${String(c.fn || "").toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}</span><b>${esc(c.fn)}</b>` : c.img ? `<img src="${esc(media(c.img))}" alt="Current certificate">` : '<span class="portfolio-file-symbol">PDF</span><b>Upload Certificate File</b>'}</div><small>PDF, JPG, PNG \xB7 Max 5 MB</small><label class="btn sm" for="cert-file">\u21E7 Choose File</label><input id="cert-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden>${c.file ? '<label class="portfolio-remove-file"><input type="checkbox" name="removeFile" value="1"> Remove current file</label>' : ""}</div>`;
    const body = `<div class="portfolio-modal-head cert-modal-head"><span class="portfolio-modal-mark">\u2605</span><div><h2>${d.i === void 0 ? "Upload Certificate" : "Edit Certificate"}</h2><p>Add your certifications to build credibility.</p></div></div>${fileBody}<div class="portfolio-modal-fields cert-form-grid">${fld("Certificate Name *", "n", c.n, "text", 'required maxlength=160 placeholder="e.g. Google Data Analytics"')}${fld("Issuing Organization *", "o", c.o, "text", 'required maxlength=120 placeholder="e.g. Google"')}${fld("Issue Date *", "idat", c.idat || (c.y ? `${c.y}-01-01` : ""), "date", "required")}${fld("Credential ID", "cid", c.cid, "text", 'maxlength=120 placeholder="e.g. GDA-2024-12345"')}<div class="full">${fld("Verification Link (Optional)", "vl", c.vl, "url", 'maxlength=500 placeholder="https://verify.example.com"')}</div></div>`;
    modal(d.i === void 0 ? "Upload Certificate" : "Edit Certificate", body, async (v) => {
      const file = v.file instanceof File && v.file.size ? v.file : void 0, remove = v.removeFile === "1", ext = file?.name.toLowerCase().split(".").pop();
      if (file && !["pdf", "jpg", "jpeg", "png"].includes(ext || "")) {
        toast("Certificate must be PDF, JPG or PNG");
        return false;
      }
      if (file && file.size > 5 * 1048576) {
        toast("Certificate file must be under 5 MB");
        return false;
      }
      const record = { ...c, id: c.id, n: v.n.trim(), o: v.o.trim(), y: v.idat.slice(0, 4), idat: v.idat, cid: v.cid.trim(), vl: v.vl.trim() }, L = clist(), index = d.i === void 0 ? L.length : +d.i;
      d.i === void 0 ? L.push(record) : L[index] = { ...L[index], ...record };
      const saved = await call("PUT", "/student/profile", { ce: L }, file || remove ? "" : "Certificate saved");
      if (!saved) return false;
      const cert = saved.me.ce[index];
      if (file) {
        const fd2 = new FormData();
        fd2.append("file", file);
        return ok(await call("POST", `/student/certifications/${cert.id}/file`, fd2, "Certificate saved"));
      }
      if (remove && cert?.id) return ok(await call("DELETE", `/student/certifications/${cert.id}/file`, void 0, "Certificate saved"));
    }, d.i === void 0 ? "Upload Certificate" : "Save Changes", "portfolio-modal");
  };
  A.ceD = (d) => ask("Remove this certification?", () => call("PUT", "/student/profile", { ce: clist().filter((_, i) => i != d.i) }, "Certification removed"));
  A.photo = () => $("#pf").click();
  A.photoD = () => call("DELETE", "/student/photo", void 0, "Photo removed");
  A.rsD = () => call("DELETE", "/student/resume", void 0, "Resume removed");
  var pick = async (f, re, max, label, path, msg, after) => {
    if (!f) return;
    if (!re.test(f.name)) return toast(label + " must be " + (label == "Photo" ? "JPG, PNG or WEBP" : "PDF, DOC or DOCX"));
    if (f.size > max * 1048576) return toast(label + " must be under " + max + " MB");
    const fd2 = new FormData();
    fd2.append("file", f);
    const r = await call("POST", path, fd2, msg, !after);
    if (r && after) after();
  };
  var upPhoto = (f) => pick(f, /\.(jpe?g|png|webp)$/i, 2, "Photo", "/student/photo", "Photo updated", () => {
    const w = $(".phw");
    w && (w.outerHTML = phw(ME()));
    if (!window.WZ) rr();
  });
  var upResume = (f) => pick(f, /\.(pdf|docx?)$/i, 5, "Resume", "/student/resume", "Resume uploaded");
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id == "pf") upPhoto(t.files[0]);
    if (t.id == "rf") upResume(t.files[0]);
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "ce-image" && t.files?.[0]) {
      const f = t.files[0], preview = $("#ce-preview"), placeholder = $("#ce-image-placeholder");
      if (!/\.(jpe?g|png|webp)$/i.test(f.name)) {
        toast("Certificate image must be JPG, PNG or WEBP");
        t.value = "";
        return;
      }
      if (f.size > 3 * 1048576) {
        toast("Certificate image must be under 3 MB");
        t.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        preview.src = String(reader.result);
        preview.hidden = false;
        if (placeholder) placeholder.hidden = true;
      };
      reader.readAsDataURL(f);
      const remove = $("input[name=removeImage]");
      if (remove) remove.checked = false;
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t.files?.[0] || !["project-thumb", "cert-file"].includes(t.id)) return;
    const f = t.files[0], project = t.id === "project-thumb", preview = $(project ? "#project-thumb-preview" : "#cert-file-preview"), ext = f.name.toLowerCase().split(".").pop(), allowed = project ? ["png", "jpg", "jpeg"].includes(ext || "") : ["pdf", "jpg", "jpeg", "png"].includes(ext || "");
    if (!allowed) {
      toast(project ? "Project thumbnail must be PNG or JPG" : "Certificate must be PDF, JPG or PNG");
      t.value = "";
      return;
    }
    if (f.size > 5 * 1048576) {
      toast("File must be under 5 MB");
      t.value = "";
      return;
    }
    if (project || ext != "pdf") {
      const reader = new FileReader();
      reader.onload = () => preview.innerHTML = `<img src="${String(reader.result)}" alt="${project ? "Project thumbnail" : "Certificate"} preview">`;
      reader.readAsDataURL(f);
    } else preview.innerHTML = `<span>PDF</span><b>${esc(f.name)}</b>`;
    const remove = $(`input[name="${project ? "removeThumbnail" : "removeFile"}"]`);
    if (remove) remove.checked = false;
  });
  document.addEventListener("dragover", (e) => e.target.closest(".dz") && e.preventDefault());
  document.addEventListener("drop", (e) => {
    if (e.target.closest(".dz")) {
      e.preventDefault();
      upResume(e.dataTransfer.files[0]);
    }
  });

  // src/shared.ts
  var logo = (c, cls = "") => c.lg ? `<span class="co logo ${cls}"><img src="${esc(media(c.lg))}" alt="" loading="lazy"></span>` : `<span class="co ${cls}" aria-hidden="true">${esc(c.n[0])}</span>`;
  var IC = {
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
    reset: '<path d="M4 12a8 8 0 1 0 2.5-5.800M4 4v4.500h4.5"/>'
  };
  var ico = (k, c = "") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
  var verified = '<svg class="vf" viewBox="0 0 24 24" role="img" aria-label="Verified by the placement cell"><title>Verified by the placement cell</title><path d="M12 2.500l2.5 1.8 3-.2 1.2 2.8 2.6 1.6-.8 3 .8 3-2.6 1.6-1.2 2.8-3-.2L12 21.500l-2.5-1.8-3 .2-1.2-2.800L2.7 15.500l.8-3-.8-3 2.6-1.6 1.2-2.8 3 .2L12 2.500Z" fill="currentColor"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function campus() {
    let win = "";
    for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) win += `<rect x="${134 + c * 22}" y="${62 + r * 23}" width="13" height="14" rx="2" fill="${(r * 3 + c * 5) % 7 === 0 ? "#ffe9a8" : "#a9bdfc"}"/>`;
    let wing = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) wing += `<rect x="${44 + c * 20}" y="${130 + r * 23}" width="12" height="13" rx="2" fill="#b9c8fd"/>`;
    return `<svg class="dx-campus" viewBox="0 0 380 210" aria-hidden="true"><defs><linearGradient id="dxb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e4eaff"/></linearGradient></defs>
<rect x="124" y="50" width="196" height="160" rx="6" fill="url(#dxb)" stroke="#c4d0f7"/><rect x="118" y="44" width="208" height="10" rx="4" fill="#9fb2f3"/>${win}
<rect x="34" y="118" width="80" height="92" rx="5" fill="url(#dxb)" stroke="#c4d0f7"/><rect x="30" y="113" width="88" height="8" rx="4" fill="#b4c3fa"/>${wing}
<rect x="206" y="176" width="32" height="34" rx="3" fill="#7b92ee"/>
<circle cx="344" cy="168" r="30" fill="#7fd1a3"/><circle cx="364" cy="184" r="22" fill="#5cbd88"/><rect x="341" y="184" width="6" height="26" fill="#8a6a4a"/>
<circle cx="18" cy="176" r="24" fill="#8ad8ad"/><rect x="15" y="186" width="6" height="24" fill="#8a6a4a"/>
<rect x="0" y="206" width="380" height="4" fill="#cfd9fb"/></svg>`;
  }

  // src/dashboard.ts
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var pad = (n) => String(n).padStart(2, "0");
  var dayKey = (t) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  function monthKeys(n, ahead = 0) {
    const now = /* @__PURE__ */ new Date(), out = [];
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(now.getFullYear(), now.getMonth() + ahead - i, 1);
      out.push({ k: `${x.getFullYear()}-${pad(x.getMonth() + 1)}`, l: MON[x.getMonth()] });
    }
    return out;
  }
  var perMonth = (dates, keys) => keys.map((k) => dates.filter((d) => d.slice(0, 7) === k.k).length);
  var IC2 = {
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
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>'
  };
  var ico2 = (k, c = "") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC2[k]}</svg>`;
  var skillGapRequest = 0;
  async function loadSkillGap() {
    const request = ++skillGapRequest, panel = $("#dx-skill-gap");
    if (!panel) return;
    panel.setAttribute("aria-busy", "true");
    panel.innerHTML = '<div class="dx-skill-loading" role="status">Finding skills that can improve your job matches\u2026</div>';
    try {
      const result = await api("GET", "/student/skill-gap");
      if (request !== skillGapRequest || !$("#dx-skill-gap")) return;
      panel.setAttribute("aria-busy", "false");
      panel.innerHTML = result.skills.length ? `<ul class="dx-skill-list">${m(result.skills, (item2) => `<li class="dx-skill-item"><div class="dx-skill-copy"><b>${esc(item2.skill)}</b><small>${item2.job_count} open ${item2.job_count === 1 ? "job" : "jobs"} \xB7 ${esc(item2.job_titles.join(", "))}</small>${item2.more_jobs ? `<small class="dx-skill-benefit">Learning this could meet the skills threshold for ${item2.more_jobs} more ${item2.more_jobs === 1 ? "job" : "jobs"}.</small>` : ""}</div><span class="dx-skill-count" aria-label="Required by ${item2.job_count} open ${item2.job_count === 1 ? "job" : "jobs"}">${item2.job_count}</span><a class="btn sm" href="#/skills">Add this skill</a></li>`)}</ul>` : '<div class="dx-skill-empty">No missing skills found for open jobs in your department.</div>';
    } catch (error) {
      if (request !== skillGapRequest || !$("#dx-skill-gap")) return;
      const message = error?.error || "Skill gap recommendations could not be loaded.";
      panel.setAttribute("aria-busy", "false");
      panel.innerHTML = `<div class="dx-skill-error" role="alert">${esc(message)} <button class="btn sm" type="button" data-dx-skill-retry>Try again</button></div>`;
    }
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-dx-skill-retry]")) loadSkillGap();
  });
  function spark(v, id) {
    const mx = Math.max(1, ...v), pts = v.map((x, i) => [i / (v.length - 1) * 120, 33 - x / mx * 26]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return `<svg class="dx-spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".3"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d} L120,40 L0,40 Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function bars(n) {
    const ks = monthKeys(n), v = perMonth(db.apps.filter((a) => a.s == ME().id).map((a) => a.dt), ks), mx = Math.max(1, ...v);
    return `<div class="dx-bars" style="--n:${n}" role="img" aria-label="Applications per month: ${ks.map((k, i) => k.l + " " + v[i]).join(", ")}">${m(ks, (k, i) => `<div class="dx-bar"><b>${v[i]}</b><i style="height:${v[i] ? Math.max(v[i] / mx * 100, 9) : 3}%"></i><span>${k.l}</span></div>`)}</div>${v.some(Boolean) ? "" : '<p class="dx-note">No applications in this period yet.</p>'}`;
  }
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "dx-range") $("#dx-bars").innerHTML = bars(+t.value);
  });
  function donut(parts, pct) {
    const R = 52, C = 2 * Math.PI * R, tot = parts.reduce((a, p) => a + p.n, 0);
    let off = 0;
    const arcs = tot ? parts.filter((p) => p.n).map((p) => {
      const len = p.n / tot * C, gap = parts.filter((x) => x.n).length > 1 ? 3 : 0, el = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${p.c}" stroke-width="16" stroke-dasharray="${Math.max(len - gap, 0.5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
      off += len;
      return el;
    }).join("") : "";
    return `<div class="dx-donut" title="Share of your applications that reached the shortlist or an offer"><svg viewBox="0 0 140 140" role="img" aria-label="Application status: ${parts.map((p) => p.l + " " + p.n).join(", ")}"><circle cx="70" cy="70" r="${R}" fill="none" stroke="#eeeafc" stroke-width="16"/>${arcs}</svg><div><b>${pct}%</b><small>Overall progress</small></div></div>`;
  }
  function renderDashboard(d) {
    const s = ME(), ap = db.apps.filter((a) => a.s == s.id), now = Date.now(), first = s.n.split(" ")[0];
    const byStatus = (k) => ap.filter((a) => a.st == k).length;
    const ups = db.iv.filter((i) => i.at >= now && db.apps.some((a) => a.id == i.a && a.s == s.id)).sort((a, b) => a.at - b.at);
    const o = offer(s.id), checks = d.CK(s), done = checks.filter((c) => c[1]).length;
    const open2 = db.jobs.filter((j) => left(j.dl) >= 0), soon = open2.filter((j) => left(j.dl) <= 7 && !ap.some((a) => a.j == j.id) && elig(s, j).ok);
    const latest = open2.slice().sort((a, b) => b.id - a.id).slice(0, 3);
    const cut = dayKey(now - 30 * 864e5), k6 = monthKeys(6), k6n = monthKeys(6, 1);
    const dApplied = ap.map((a) => a.dt), dShort = ap.flatMap((a) => a.h.filter((h) => h.st == "Shortlisted").map((h) => h.dt)), dSel = ap.flatMap((a) => a.h.filter((h) => h.st == "Selected").map((h) => h.dt)), dIv = db.iv.map((i) => dayKey(i.at));
    const week = ups.filter((i) => i.at <= now + 7 * 864e5).length;
    const stats = [
      { c: "blue", ic: "people", n: ap.length, l: "Applied jobs", up: dApplied.filter((x) => x >= cut).length, tip: "new in the last 30 days", sp: perMonth(dApplied, k6), href: "#/applications" },
      { c: "violet", ic: "bag", n: dShort.length, l: "Shortlisted", up: dShort.filter((x) => x >= cut).length, tip: "new in the last 30 days", sp: perMonth(dShort, k6), href: "#/applications?st=Shortlisted" },
      { c: "green", ic: "check", n: ups.length, l: "Upcoming interviews", up: week, tip: "in the next 7 days", sp: perMonth(dIv, k6n), href: "" },
      { c: "orange", ic: "trophy", n: byStatus("Selected"), l: "Selected", up: dSel.filter((x) => x >= cut).length, tip: "new in the last 30 days", sp: perMonth(dSel, k6), href: "#/applications?st=Selected" }
    ];
    const statCard = (x, i) => {
      const body = `<span class="dx-stat-ic">${ico2(x.ic)}</span><span class="dx-stat-tx"><b>${x.n}</b><small>${x.l}</small></span><span class="dx-delta${x.up ? "" : " zero"}" title="${x.up} ${x.tip}">${x.up ? "\u2191" : ""} +${x.up}</span>${spark(x.sp, "dxs" + i)}`;
      return x.href ? `<a class="dx-stat ${x.c}" href="${x.href}">${body}</a>` : `<div class="dx-stat ${x.c}">${body}</div>`;
    };
    const parts = [
      { l: "Applied", n: byStatus("Applied"), c: "#3b6cff" },
      { l: "Shortlisted", n: byStatus("Shortlisted"), c: "#14b8a6" },
      { l: "Rejected", n: byStatus("Rejected"), c: "#f59e0b" },
      { l: "Selected", n: byStatus("Selected"), c: "#8b5cf6" }
    ];
    const pct = ap.length ? Math.round((byStatus("Shortlisted") + byStatus("Selected")) / ap.length * 100) : 0;
    const ivRow = (i) => {
      const a = db.apps.find((x) => x.id == i.a), j = db.jobs.find((x) => x.id == a.j), c = co(j.c), dt = new Date(i.at);
      return `<article class="dx-iv">${logo(c)}<div class="dx-iv-tx"><h3>${esc(c.n)}</h3><p>${esc(j.t)} \xB7 ${esc(i.r)}</p><div class="dx-iv-meta"><span>${ico2("cal")}${dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span><span>${ico2("clock")}${dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}</span><span>${ico2("pin")}${esc(i.md)}${i.lc ? " \xB7 " + esc(i.lc) : ""}</span></div></div><a class="btn fill sm" href="#/track/${a.id}">View details</a></article>`;
    };
    const jobRow = (j) => {
      const c = co(j.c), a = db.apps.find((x) => x.s == s.id && x.j == j.id), e = elig(s, j), ca = canApply(s, j);
      const act = a ? badge(a.st) : ca.ok ? `<button class="btn fill sm" data-a="apply" data-id="${j.id}">Apply now</button>` : `<a class="btn sm" href="#/job/${j.id}" title="${esc(ca.m)}">View details</a>`;
      return `<article class="dx-job">${logo(c)}<div class="dx-job-tx"><h3><a href="#/job/${j.id}">${esc(j.t)}</a></h3><p>${esc(c.n)}</p><div class="dx-iv-meta"><span>${ico2("pin")}${esc(j.l)}</span><span>Min ${j.min}%</span><span>\u20B9 ${esc(j.pk)}</span>${d.dlt(j)}</div></div>${e.ok ? `<span class="dx-match" title="How many of the required skills you have">${e.m}% match</span>` : ""}<div class="dx-job-act">${act}</div></article>`;
    };
    const quick = [
      ["violet", "doc", "Update resume", "#/resume"],
      ["green", "search", "Browse jobs", "#/jobs"],
      ["blue", "track", "Track applications", "#/applications"],
      ["orange", "user", "Edit profile", "#/profile"]
    ];
    const inProgress = byStatus("Applied") + byStatus("Shortlisted");
    const lead = ap.length ? `${inProgress} ${inProgress == 1 ? "application is" : "applications are"} in progress${ups.length ? ` and ${ups.length} ${ups.length == 1 ? "interview is" : "interviews are"} coming up` : ""}. Keep it going!` : "Your career journey starts with one application. Browse jobs and apply to the ones that fit.";
    queueMicrotask(loadSkillGap);
    return `<div class="dashboard dx">
<header class="dx-hero"><div class="dx-hero-tx"><h1>Welcome back, <em>${esc(first)}</em>! <span aria-hidden="true">\u{1F44B}</span></h1><p>${lead}</p>
<div class="dx-pc"><span>Profile completion</span><div class="pbar" role="progressbar" aria-label="Profile completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.pp}"><i style="width:${s.pp}%"></i></div><b>${s.pp}%</b></div></div>
<div class="dx-hero-art" aria-hidden="true"><span class="dx-tag">Dream big\u2026<br>Get placed!</span>${campus()}</div></header>
${o ? `<div class="ban dash-offer"><span class="dash-offer-icon" aria-hidden="true">\u2726</span><span><b>Congratulations on your offer!</b><small>You\u2019re placed with an offer up to \u20B9${o} LPA. You can now apply to dream offers of ${db.pol.dream}x or more.</small></span></div>` : ""}
<section class="dx-stats" aria-label="Career overview">${m(stats, statCard)}</section>
<div class="dx-row">
<section class="dx-panel"><div class="dx-ph"><h2>${ico2("chart")}Application statistics</h2><select id="dx-range" class="dx-select" aria-label="Chart period"><option value="6">Last 6 months</option><option value="3">Last 3 months</option><option value="12">Last 12 months</option></select></div>
<div class="dx-stat-body"><div class="dx-donut-wrap">${donut(parts, pct)}<ul class="dx-legend">${m(parts, (p) => `<li><i style="background:${p.c}"></i><span>${p.l}</span><b>${p.n}</b></li>`)}</ul></div><div id="dx-bars" class="dx-bars-wrap">${bars(6)}</div></div></section>
<section class="dx-panel"><div class="dx-ph"><h2>${ico2("cal")}Upcoming interviews</h2><a class="dx-link" href="#/applications">My applications ${ico2("arrow")}</a></div>
${ups.length ? `<div class="dx-list">${m(ups.slice(0, 3), ivRow)}</div>` : `<div class="dx-empty">${ico2("cal")}<b>No interviews scheduled yet</b><small>When the placement cell schedules one for you, it will show up here with the date, time and place.</small></div>`}</section>
</div>
<div class="dx-row">
<section class="dx-panel"><div class="dx-ph"><h2>${ico2("bag")}Latest job opportunities</h2><a class="dx-link" href="#/jobs">Browse all jobs ${ico2("arrow")}</a></div>
${latest.length ? `<div class="dx-list flat">${m(latest, jobRow)}</div>` : empty("No open jobs right now. New openings will appear here.")}</section>
<section class="dx-panel"><div class="dx-ph"><h2>${ico2("bolt")}Quick actions</h2></div><div class="dx-quick">${m(quick, (q) => `<a class="dx-q ${q[0]}" href="${q[3]}"><span>${ico2(q[1])}</span>${q[2]}</a>`)}</div></section>
</div>
<section class="dx-panel dx-skill-panel" aria-labelledby="dx-skill-title"><div class="dx-ph"><div><h2 id="dx-skill-title">${ico2("bolt")}Skill gap</h2><p class="dx-skill-intro">Skills in demand across open jobs that match your department.</p></div><a class="dx-link" href="#/skills">Manage skills ${ico2("arrow")}</a></div><div id="dx-skill-gap" aria-live="polite" aria-busy="true"><div class="dx-skill-loading" role="status">Finding skills that can improve your job matches\u2026</div></div></section>
${done < checks.length || soon.length ? `<div class="dx-duo${done < checks.length && soon.length ? "" : " one"}">
${done < checks.length ? `<section class="pn dash-panel dash-profile"><div class="dash-panel-head"><div><h2>Finish your profile</h2><p>A complete profile helps recruiters and your job matches.</p></div><span class="dash-percent">${done}/${checks.length}</span></div><ul class="cl dash-checklist">${m(checks, (c) => `<li>${c[1] ? '<span class="y dash-check" aria-label="Complete">\u2713</span>' : '<span class="n dash-check" aria-label="Incomplete">\u25CB</span>'}<span class="grow">${c[0]}</span>${c[1] ? '<span class="dash-done">Done</span>' : `<a class="btn sm" href="#/${c[2]}">Complete</a>`}</li>`)}</ul></section>` : ""}
${soon.length ? `<section class="pn dash-panel dash-closing"><div class="dash-section-head"><div><h2>Closing soon</h2><p>Eligible roles with deadlines this week.</p></div></div><ul class="cl dash-closing-list">${m(soon, (j) => `<li><span class="dash-deadline-icon" aria-hidden="true">${ico2("clock")}</span><span class="grow"><b>${esc(j.t)}</b><small>${esc(co(j.c).n)} \xB7 ${esc(j.l)}</small></span>${d.dlt(j)}<a class="btn sm" href="#/job/${j.id}">View role</a></li>`)}</ul></section>` : ""}</div>` : ""}
</div>`;
  }

  // src/myprofile.ts
  var TABS = [
    { id: "personal", label: "Personal info", ic: "user", secs: ["personal"] },
    { id: "academic", label: "Academic details", ic: "cap", secs: ["education"] },
    { id: "skills", label: "Skills & interests", ic: "star", secs: ["skills", "prefs"] },
    { id: "docs", label: "Resume", ic: "doc", secs: ["resume"] }
  ];
  var NEXT_ROUTE = {
    personal: "#/profile/personal",
    education: "#/profile/academic",
    skills: "#/profile/skills",
    prefs: "#/profile/skills",
    projects: "#/projects",
    resume: "#/profile/docs"
  };
  var NEXT = {
    personal: "your personal details",
    education: "your academic details",
    skills: "at least 3 technical skills",
    prefs: "your career interests",
    projects: "a project or certification",
    resume: "your resume"
  };
  var META = {
    personal: { t: "Personal information", s: "Your basic personal details", ic: "user" },
    education: { t: "Academic information", s: "Your educational background", ic: "cap" },
    skills: { t: "Skills", s: "Technical and soft skills that are matched with jobs", ic: "star" },
    prefs: { t: "Career interests", s: "Roles, places and fields you want to work in", ic: "target" }
  };
  var IC3 = {
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
    trash: '<path d="M4 7h16M10 3h4M6 7l1 13h10l1-13"/>'
  };
  var ico3 = (k, c = "") => `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC3[k]}</svg>`;
  var val = (v) => v === "" || v == null || v === 0 ? '<span class="pf-na">Not added</span>' : esc(v);
  var item = (ic, label, v, wide = false) => `<div class="pf-it${wide ? " wide" : ""}"><span class="pf-ico">${ico3(ic)}</span><div><small>${label}</small><b>${v}</b></div></div>`;
  var chips2 = (a) => a.length ? `<div class="pf-chips">${m([...new Set(a)], (x) => `<span class="pf-chip">${esc(x)}</span>`)}</div>` : '<span class="pf-na">Not added</span>';
  var VIEW = {
    personal: (s) => `<div class="pf-items">${item("user", "Full name", val(s.n))}${item("user", "Gender", val(s.gn))}${item("mail", "Email address", val(s.e))}${item("cal", "Date of birth", s.dob ? esc(fd(s.dob)) : val(""))}${item("phone", "Mobile number", val(s.ph))}${item("pin", "Current location", val(s.loc))}${item("home", "Address", val(s.ad), true)}</div>`,
    education: (s) => `<div class="pf-items">${item("cap", "Degree / program", val(s.deg))}${item("percent", s.sty == "CGPA" ? "Graduation CGPA" : "Graduation percentage", s.sc ? esc(s.sc) + (s.sty == "CGPA" ? ` <em>(\u2248 ${s.pct}%)</em>` : "%") : val(""))}${item("book", "Branch / department", s.col ? val(s.d) : val(""))}${item("home", "College", val(s.col))}${item("cal", "Current year", val(s.yr))}${item("cal", "Expected graduation", val(s.py))}${item("percent", "10th percentage", s.p10 ? esc(s.p10) + "%" : val(""))}${item("percent", "12th / diploma percentage", s.p12 ? esc(s.p12) + "%" : val(""))}${item("alert", "Active backlogs", s.col ? esc(s.bk || 0) : val(""))}</div>`,
    skills: (s) => {
      const tech = s.skills.filter((x) => x.c != "soft").length, groups = SKC.map((c) => [c[1], s.skills.filter((x) => x.c == c[0]).map((x) => x.n)]).filter((g) => g[1].length);
      return (groups.length ? m(groups, (g) => `<div class="pf-grp"><h3>${g[0]}</h3>${chips2(g[1])}</div>`) : '<p class="pf-na pf-blank">No skills added yet.</p>') + (tech < 3 ? `<p class="pf-warn">${ico3("alert")}Add at least 3 technical skills (${tech} so far). Soft skills do not count. Skills are matched with each job\u2019s requirements.</p>` : "");
    },
    prefs: (s) => `<div class="pf-grp"><h3>Preferred job roles</h3>${chips2(s.pref.roles)}</div><div class="pf-grp"><h3>Preferred locations</h3>${chips2(s.pref.locs)}</div><div class="pf-grp"><h3>Employment type</h3>${chips2(s.pref.types)}</div><div class="pf-grp"><h3>Expected salary</h3>${s.pref.sal ? `<b class="pf-sal">\u20B9 ${esc(s.pref.sal)} LPA</b>` : '<span class="pf-na">Not added</span>'}</div><div class="pf-grp"><h3>Fields you are interested in</h3>${chips2(s.pref.cats)}</div>`
  };
  var open = "";
  var inner = (k, ed) => {
    const M = META[k];
    return `<div class="pf-ch"><span class="pf-cic">${ico3(M.ic)}</span><div><h2>${M.t}</h2><p>${M.s}</p></div>${ed ? `<button type="button" class="pf-btn" data-a="pfCancel" data-k="${k}">Cancel</button>` : `<button type="button" class="pf-btn" data-a="pfEdit" data-k="${k}">${ico3("edit")}Edit</button>`}</div>${ed ? `<div class="pf-form">${SEC[k].render(ME(), "card")}</div>` : VIEW[k](ME())}`;
  };
  var card = (k) => `<section class="pf-card" data-card="${k}">${inner(k, false)}</section>`;
  var draw = (k, ed) => {
    const el = $(`[data-card="${k}"]`);
    if (!el) return;
    el.innerHTML = inner(k, ed);
    el.classList.toggle("ed", ed);
  };
  A.pfEdit = (d) => {
    if (open && open !== d.k) draw(open, false);
    open = d.k;
    draw(d.k, true);
    const f = document.querySelector(`[data-card="${d.k}"] input:not([type=hidden]), [data-card="${d.k}"] select`);
    f && f.focus();
  };
  A.pfCancel = (d) => {
    draw(d.k, false);
    open = "";
  };
  A.rfPick = () => $("#rf").click();
  function resumeCard(s) {
    const ext = (s.rs.split(".").pop() || "pdf").toUpperCase().slice(0, 4);
    return `<section class="pf-card" data-card="resume"><div class="pf-ch"><span class="pf-cic">${ico3("doc")}</span><div><h2>Resume</h2><p>Recruiters see this when you apply. PDF, DOC or DOCX, up to 5 MB.</p></div></div>
${s.rs ? `<div class="pf-file"><span class="pf-ext">${esc(ext)}</span><div class="pf-file-tx"><b>${esc(s.rs)}</b><small>${s.rsd ? "Uploaded on " + esc(fd(s.rsd)) : "Uploaded"}</small></div><div class="pf-file-act"><a class="pf-btn" href="${esc(media(s.rsu))}" target="_blank" rel="noopener">View</a><a class="pf-btn" href="${esc(media(s.rsu))}" download="${esc(s.rs)}">${ico3("download")}Download</a><button type="button" class="pf-btn" data-a="rfPick">${ico3("upload")}Replace</button><button type="button" class="pf-btn danger" data-a="rsD">${ico3("trash")}Remove</button></div></div>` : `<label class="dz" for="rf"><span>\u2601\uFE0F</span><b>Drag &amp; drop your resume here</b><small class="mu">or click to browse \xB7 PDF, DOC, DOCX \xB7 max 5 MB</small></label><p class="pf-warn">${ico3("alert")}A resume is required before you can apply for jobs.</p>`}
<input id="rf" type="file" accept=".pdf,.doc,.docx" hidden></section>`;
  }
  function side(s) {
    const miss = ["personal", "education", "skills", "prefs", "projects", "resume"].find((k) => !s.sec[k]), R = 36, C = 2 * Math.PI * R;
    const head2 = [s.deg, s.col ? s.d : ""].filter(Boolean).join(" \xB7 ");
    return `<aside class="pf-side"><div class="pf-cover"></div>
<div class="pf-av">${s.photo ? `<img src="${esc(media(s.photo))}" alt="Profile photo">` : `<span>${esc(s.n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase())}</span>`}<button type="button" class="pf-cam" data-a="photo" aria-label="${s.photo ? "Change" : "Upload"} profile photo">${ico3("camera")}</button><input id="pf" type="file" accept="image/jpeg,image/png,image/webp" hidden></div>
${s.photo ? '<button type="button" class="pf-rm" data-a="photoD">Remove photo</button>' : '<small class="pf-hint">JPG, PNG or WEBP \xB7 max 2 MB</small>'}
<h2 class="pf-name">${esc(s.n)}</h2>${head2 ? `<p class="pf-sub">${esc(head2)}</p>` : ""}${s.col ? `<p class="pf-sub2">${esc(s.col)}</p>` : ""}
<span class="pf-pill${s.pp >= 100 ? "" : " warn"}">${ico3(s.pp >= 100 ? "check" : "alert")}Profile ${s.pp}% complete</span>
<div class="pf-ring"><svg viewBox="0 0 84 84" role="img" aria-label="Profile ${s.pp}% complete"><circle cx="42" cy="42" r="${R}" fill="none" stroke="#e9ecfb" stroke-width="9"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="${s.pp >= 100 ? "#12a566" : "#3f5cf0"}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C * s.pp / 100} ${C}" transform="rotate(-90 42 42)"/></svg><b>${s.pp}%</b>
<div><h3>${s.pp >= 100 ? "Profile complete" : "Keep going"}</h3><p>${miss ? `Next: add ${NEXT[miss]}. <a href="${NEXT_ROUTE[miss]}">Go there</a>` : "Great! Your profile is fully up to date."}</p></div></div>
<ul class="pf-contact"><li>${ico3("mail")}<span>${esc(s.e)}</span></li><li>${ico3("phone")}<span>${val(s.ph)}</span></li><li>${ico3("pin")}<span>${val(s.loc)}</span></li>${s.jn ? `<li>${ico3("cal")}<span>Joined on ${esc(fd(s.jn))}</span></li>` : ""}</ul>
${s.rs ? `<a class="btn fill full pf-dl" href="${esc(media(s.rsu))}" download="${esc(s.rs)}">${ico3("download")}Download resume</a>` : '<a class="btn fill full pf-dl" href="#/profile/docs">' + ico3("upload") + "Upload resume</a>"}</aside>`;
  }
  function renderProfile(arg) {
    const s = ME(), tab = (TABS.find((t) => t.id == arg) || TABS[0]).id, T = TABS.find((t) => t.id == tab);
    open = "";
    const body = tab == "personal" ? card("personal") : tab == "academic" ? card("education") : tab == "skills" ? card("skills") + card("prefs") : resumeCard(s);
    const first = T.secs[0], action2 = tab == "docs" ? `<button type="button" class="btn fill pf-top" data-a="rfPick">${ico3("upload")}${s.rs ? "Replace resume" : "Upload resume"}</button>` : `<button type="button" class="btn fill pf-top" data-a="pfEdit" data-k="${first}">${ico3("edit")}Edit profile</button>`;
    setTimeout(() => {
      const l = $(".pf-tabs"), t = $(".pf-tab.on");
      if (l && t) l.scrollLeft = t.offsetLeft - (l.clientWidth - t.offsetWidth) / 2;
    }, 0);
    return `<div class="dx pf"><header class="pf-head"><span class="pf-hic">${ico3("user")}</span><div><h1>My Profile</h1><p>Manage your profile information and keep it up to date.</p></div>${action2}</header>
<div class="pf-grid">${side(s)}<div class="pf-main"><nav class="pf-tabs" aria-label="Profile sections">${m(TABS, (t) => {
      const bad = t.secs.some((k) => !s.sec[k]);
      return `<a class="pf-tab${t.id == tab ? " on" : ""}" href="#/profile/${t.id}" ${t.id == tab ? 'aria-current="page"' : ""}>${ico3(t.ic)}<span>${t.label}</span>${bad ? '<i class="pf-dot" title="Something is missing in this tab"></i>' : ""}</a>`;
    })}</nav><div class="pf-panel">${body}</div></div></div></div>`;
  }
  function renderPortfolioPage(kind) {
    return renderPortfolio(ME(), kind);
  }

  // src/jobs.ts
  var TYPES = ["Full Time", "Internship", "Part Time"];
  var TAB_LABEL = { all: "All jobs", "Internship": "Internships", "Full Time": "Full time", "Part Time": "Part time", saved: "Saved" };
  var TAB_ICON = { all: "bag", "Internship": "cap", "Full Time": "bag", "Part Time": "clock", saved: "bookmark" };
  var PKG = [[0, "Any package"], [3, "3+ LPA"], [5, "5+ LPA"], [8, "8+ LPA"], [10, "10+ LPA"], [15, "15+ LPA"]];
  var SORTS = [["n", "Newest first"], ["m", "Best match"], ["d", "Closing soon"], ["p", "Highest package"]];
  var fresh = () => ({ q: "", c: "", ty: [], l: "", pm: 0, so: "n", el: false, cl: false, sv: false });
  var JF = fresh();
  var D;
  var selectId = 0;
  var calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  var isNew = (j) => Date.now() - new Date(j.cr).getTime() < 7 * 864e5;
  var due = (j) => {
    const r = left(j.dl);
    return r < 0 ? "Closed" : r == 0 ? "Last day" : r <= 7 ? `${r} day${r > 1 ? "s" : ""} left` : "Apply by " + fd(j.dl);
  };
  function flag(j) {
    if (left(j.dl) < 0) return ["gray", "alert", "Closed"];
    if (j.hl == "Top Hiring") return ["green", "star", "Top hiring"];
    if (j.hl == "Featured") return ["violet", "gem", "Featured"];
    if (j.hl == "Popular") return ["orange", "flame", "Popular"];
    return isNew(j) ? ["blue", "bolt", "New"] : null;
  }
  var flagHTML = (j) => {
    const f = flag(j);
    return f ? `<span class="jx-flag ${f[0]}">${ico(f[1])}${f[2]}</span>` : "";
  };
  var customSelect = (name, ariaLabel, options) => {
    const id = `jx-select-${++selectId}`;
    return `<div class="jx-selectbox" data-jx-select><input type="hidden" data-jx name="${name}" value="" aria-hidden="true"><button type="button" class="jx-select-trigger" aria-label="${esc(ariaLabel)}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"><span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="jx-select-menu" id="${id}" role="listbox" aria-label="${esc(ariaLabel)}">${m(options, (o) => `<button type="button" class="jx-select-option" role="option" aria-selected="false" data-value="${esc(o.value)}">${esc(o.label)}</button>`)}</div></div>`;
  };
  function pass(s, j, skipTabs = false) {
    const c = co(j.c);
    if (JF.q) {
      const t = `${j.t} ${c.n} ${j.sk.join(" ")} ${j.l} ${j.cat}`.toLowerCase();
      if (!JF.q.toLowerCase().split(/\s+/).every((w) => t.includes(w))) return false;
    }
    if (JF.c && j.c != +JF.c) return false;
    if (JF.l && j.l != JF.l) return false;
    if (JF.pm && pkmax(j.pk) < JF.pm) return false;
    if (JF.el && !elig(s, j).ok) return false;
    if (!JF.cl && left(j.dl) < 0) return false;
    if (!skipTabs) {
      if (JF.sv && !db.sv.includes(j.id)) return false;
      if (JF.ty.length && !JF.ty.includes(j.ty)) return false;
    }
    return true;
  }
  function rows() {
    const s = ME(), r = db.jobs.filter((j) => pass(s, j));
    r.sort((a, b) => JF.so == "d" ? left(a.dl) - left(b.dl) : JF.so == "p" ? pkmax(b.pk) - pkmax(a.pk) : JF.so == "m" ? D.rank(s, b) - D.rank(s, a) : b.cr > a.cr ? 1 : b.cr < a.cr ? -1 : b.id - a.id);
    return r;
  }
  var saveIcon = (id) => `<button type="button" class="jx-bm${db.sv.includes(id) ? " on" : ""}" data-a="jsave" data-id="${id}" aria-pressed="${db.sv.includes(id)}" aria-label="Save this job" title="Save job">${ico("bookmark")}</button>`;
  function action(s, j) {
    const a = db.apps.find((x) => x.s == s.id && x.j == j.id), ca = canApply(s, j);
    if (a) return `<a class="btn jx-st" href="#/track/${a.id}">${badge(a.st)}<span>View status</span></a>`;
    if (left(j.dl) < 0) return '<button type="button" class="btn" disabled>Closed</button>';
    if (ca.ok) return `<button type="button" class="btn fill" data-a="apply" data-id="${j.id}">Apply now ${ico("arrow")}</button>`;
    return `<a class="btn" href="#/job/${j.id}">View details</a><small class="jx-why">${esc(ca.m)}</small>`;
  }
  function row(s, j) {
    const c = co(j.c), e = elig(s, j), h = D.hit(s, j), pref = h.loc || h.cat || h.role, shown = j.sk.slice(0, 4);
    return `<article class="jx-job">${logo(c, "jx-logo")}
<div class="jx-info"><h3><a href="#/job/${j.id}">${esc(c.n)}</a>${verified}</h3><p class="jx-role">${esc(j.t)}</p>
<div class="jx-meta"><span>${ico("bag")}${esc(j.ty)}</span><span>${ico("pin")}${esc(j.l)}</span><span>${ico("rupee")}${esc(j.pk)}</span><span class="${left(j.dl) >= 0 && left(j.dl) <= 7 ? "soon" : ""}">${ico("cal")}${due(j)}</span></div>
<div class="jx-sk">${m(shown, (k) => `<span class="${D.has(s, k) ? "ok" : ""}">${D.has(s, k) ? "\u2713 " : ""}${esc(k)}</span>`)}${j.sk.length > 4 ? `<span class="more">+${j.sk.length - 4}</span>` : ""}</div></div>
<div class="jx-mid">${flagHTML(j)}<span class="jx-match ${e.m >= 80 ? "hi" : e.m >= 50 ? "mid" : "lo"}" title="How many of the required skills you have">${e.m}% match</span>${pref ? '<span class="jx-pref">\u2605 Fits your preferences</span>' : ""}</div>
<div class="jx-act">${action(s, j)}</div>${saveIcon(j.id)}</article>`;
  }
  function listHTML() {
    const r = rows(), p = pgr(r, 6);
    if (r.length) return `<div class="jx-list">${m(p.rows, (j) => row(ME(), j))}</div>${p.bar}`;
    return `<div class="jx-none">${ico(JF.sv ? "bookmark" : "search")}<b>${JF.sv ? "No saved jobs yet" : "No jobs match your filters"}</b><small>${JF.sv ? "Tap the bookmark on a job to keep it here for later." : "Try a different search, or clear the filters to see everything that is open."}</small>${JF.sv ? "" : '<button type="button" class="btn" data-a="jreset">Reset all filters</button>'}</div>`;
  }
  function tabsHTML() {
    const s = ME(), base = db.jobs.filter((j) => pass(s, j, true)), n = { all: base.length, saved: base.filter((j) => db.sv.includes(j.id)).length };
    TYPES.forEach((t) => n[t] = base.filter((j) => j.ty == t).length);
    const on = JF.sv ? "saved" : JF.ty.length == 0 ? "all" : JF.ty.length == 1 ? JF.ty[0] : "";
    return m(["all", "Internship", "Full Time", "Part Time", "saved"], (k) => `<button type="button" role="tab" class="jx-tab${k == on ? " on" : ""}" aria-selected="${k == on}" data-a="jtab" data-v="${k}">${ico(TAB_ICON[k])}${TAB_LABEL[k]} <i>${n[k]}</i></button>`);
  }
  function sync() {
    document.querySelectorAll("[data-jx]").forEach((e) => {
      const n = e.name;
      if (n == "q") {
        if (document.activeElement !== e) e.value = JF.q;
      } else if (n == "c") e.value = JF.c;
      else if (n == "l") e.value = JF.l;
      else if (n == "pm") e.value = String(JF.pm);
      else if (n == "so") e.value = JF.so;
      else if (n == "ty1") e.value = JF.ty.length > 1 ? "*" : JF.ty[0] || "";
      else if (n == "ty") e.checked = JF.ty.includes(e.value);
      else if (n == "el") e.checked = JF.el;
      else if (n == "cl") e.checked = JF.cl;
      if (e.type == "hidden") {
        const root = e.closest("[data-jx-select]");
        if (!root) return;
        const value = e.value, options = [...root.querySelectorAll(".jx-select-option")];
        const selected = options.find((o) => o.dataset.value == value) || options[0];
        root.querySelector(".jx-select-trigger span").textContent = selected.textContent;
        options.forEach((o) => o.setAttribute("aria-selected", String(o === selected)));
      }
    });
  }
  function paint() {
    if (!$("#lst")) return;
    $("#jx-tabs").innerHTML = tabsHTML();
    $("#lst").innerHTML = listHTML();
    sync();
  }
  function renderJobs(deps) {
    D = deps;
    if (FV.q && FV.q !== JF.q) JF = { ...fresh(), q: FV.q };
    const s = ME(), open2 = db.jobs.filter((j) => left(j.dl) >= 0), locs = [...new Set(db.jobs.map((j) => j.l))].sort(), cos = db.cos.filter((c) => db.jobs.some((j) => j.c == c.id));
    ui.LF = listHTML;
    const companyOptions = [{ value: "", label: "All companies" }, ...cos.map((c) => ({ value: String(c.id), label: c.n }))], locationOptions = [{ value: "", label: "All locations" }, ...locs.map((l) => ({ value: l, label: l }))], packageOptions = PKG.map((p) => ({ value: String(p[0]), label: p[0] ? "Min " + p[1] : "Min package" })), typeOptions = [{ value: "", label: "All job types" }, ...TYPES.map((t) => ({ value: t, label: t })), { value: "*", label: "Several types" }], sortOptions = SORTS.map((o) => ({ value: o[0], label: o[1] }));
    const stat = (ic, n, l) => `<div class="jx-stat">${ico(ic)}<div><b>${n}</b><small>${l}</small></div></div>`;
    setTimeout(sync, 0);
    return `<div class="dx jx">
<header class="jx-head"><span class="pf-hic">${ico("bag")}</span><div><h1>Job opportunities</h1><p>Discover the best placement opportunities from top companies.</p></div>
<div class="jx-stats">${stat("bag", open2.length, "Open jobs")}${stat("building", new Set(open2.map((j) => j.c)).size, "Companies hiring")}${stat("trophy", db.pl, "Students placed")}</div></header>
<section class="jx-hero"><div class="jx-hero-tx"><h2>Your career, <em>our priority</em></h2><p>Explore top job opportunities and take the next step towards your dream career.</p><button type="button" class="btn jx-explore" data-a="jexplore">Explore jobs ${ico("arrow")}</button></div>
<div class="jx-hero-art" aria-hidden="true"><span>Dream big\u2026<br>Get placed!</span>${campus()}</div></section>
<form class="jx-bar" role="search" data-jxform><label class="jx-search">${ico("search")}<input data-jx name="q" type="search" placeholder="Search jobs by title, company or skill\u2026" aria-label="Search jobs" autocomplete="off"></label>
${customSelect("c", "Company", companyOptions)}${customSelect("ty1", "Job type", typeOptions)}${customSelect("l", "Location", locationOptions)}${customSelect("pm", "Minimum package", packageOptions)}
<button type="submit" class="btn fill">${ico("search")}Search</button></form>
<div class="jx-grid" id="jx-top"><div class="jx-main"><div class="jx-row"><div id="jx-tabs" class="jx-tabs" role="tablist" aria-label="Job type">${tabsHTML()}</div>
<div class="jx-ctl"><button type="button" class="btn jx-ftog" data-a="jfilters">${ico("filter")}Filters</button><label class="jx-sort">Sort by${customSelect("so", "Sort jobs", sortOptions)}</label></div></div>
<div id="lst">${listHTML()}</div></div>
<button type="button" class="jx-filter-backdrop" data-a="jfiltersClose" aria-label="Close filters"></button>
<aside class="jx-filters" id="jx-filters" aria-label="Filters" role="region"><div class="jx-fh"><span class="jx-sheet-handle" aria-hidden="true"></span><div class="jx-fh-title"><h2>${ico("filter")}Filters</h2><div class="jx-fh-actions"><button type="button" class="jx-reset" data-a="jreset">Reset all${ico("reset")}</button><button type="button" class="jx-fclose" data-a="jfiltersClose" aria-label="Close filters">\xD7</button></div></div></div>
<fieldset><legend>Job type</legend>${m(TYPES, (t) => `<label class="jx-ck"><input data-jx type="checkbox" name="ty" value="${t}"><span>${t}</span></label>`)}</fieldset>
<label>Location${customSelect("l", "Location", locationOptions)}</label>
<label>Salary package${customSelect("pm", "Salary package", packageOptions)}</label>
<label>Company${customSelect("c", "Company", companyOptions)}</label>
<fieldset><legend>Show</legend><label class="jx-ck"><input data-jx type="checkbox" name="el"><span>Only jobs I am eligible for</span></label><label class="jx-ck"><input data-jx type="checkbox" name="cl"><span>Include closed jobs</span></label></fieldset>
<button type="button" class="btn fill full" data-a="jsearch">${ico("filter")}Apply filters</button></aside></div></div>`;
  }
  var field = (e) => e;
  document.addEventListener("input", (e) => {
    const t = field(e.target);
    if (t && t.matches && t.matches("[data-jx]") && t.name == "q") {
      clearTimeout(t._d);
      t._d = setTimeout(() => ctl(t), 160);
    }
  });
  document.addEventListener("change", (e) => {
    const t = field(e.target);
    if (t && t.matches && t.matches("[data-jx]") && t.name != "q") ctl(t);
  });
  document.addEventListener("click", (e) => {
    const target = e.target, trigger = target.closest(".jx-select-trigger"), option = target.closest(".jx-select-option");
    if ($("#jx-filters.open") && !target.closest(".jx-filters") && !target.closest(".jx-ftog")) {
      closeFilters();
      e.preventDefault();
      return;
    }
    if (target.closest(".jx-filter-backdrop")) {
      closeFilters();
      return;
    }
    if (trigger) {
      const root = trigger.closest("[data-jx-select]");
      if (!root) return;
      const opening = !root.classList.contains("open");
      document.querySelectorAll(".jx-selectbox.open").forEach((item2) => {
        item2.classList.remove("open");
        item2.querySelector(".jx-select-trigger").setAttribute("aria-expanded", "false");
      });
      if (opening) {
        root.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if (option) {
      const root = option.closest("[data-jx-select]");
      if (!root) return;
      const input = root.querySelector("[data-jx]"), triggerButton = root.querySelector(".jx-select-trigger");
      if (!input || !triggerButton) return;
      input.value = option.dataset.value || "";
      root.classList.remove("open");
      triggerButton.setAttribute("aria-expanded", "false");
      input.dispatchEvent(new Event("change", { bubbles: true }));
      triggerButton.focus();
      return;
    }
    if (!target.closest("[data-jx-select]")) document.querySelectorAll(".jx-selectbox.open").forEach((item2) => {
      item2.classList.remove("open");
      item2.querySelector(".jx-select-trigger").setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", (e) => {
    const target = e.target, trigger = target.closest(".jx-select-trigger"), option = target.closest(".jx-select-option");
    if (e.key == "Escape" && $("#jx-filters.open") && !option) {
      closeFilters();
      return;
    }
    if (trigger && (e.key == "ArrowDown" || e.key == "ArrowUp")) {
      e.preventDefault();
      const root = trigger.closest("[data-jx-select]");
      if (!root) return;
      document.querySelectorAll(".jx-selectbox.open").forEach((item2) => {
        item2.classList.remove("open");
        item2.querySelector(".jx-select-trigger").setAttribute("aria-expanded", "false");
      });
      root.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      const options = [...root.querySelectorAll(".jx-select-option")], selected = options.findIndex((item2) => item2.getAttribute("aria-selected") == "true");
      options[e.key == "ArrowDown" ? (selected + 1 + options.length) % options.length : selected > 0 ? selected - 1 : options.length - 1].focus();
    } else if (option) {
      const root = option.closest("[data-jx-select]");
      if (!root) return;
      const options = [...root.querySelectorAll(".jx-select-option")], index = options.indexOf(option);
      let next = -1;
      if (e.key == "ArrowDown") next = (index + 1) % options.length;
      else if (e.key == "ArrowUp") next = (index - 1 + options.length) % options.length;
      else if (e.key == "Home") next = 0;
      else if (e.key == "End") next = options.length - 1;
      else if (e.key == "Escape") {
        e.preventDefault();
        root.classList.remove("open");
        root.querySelector(".jx-select-trigger").setAttribute("aria-expanded", "false");
        root.querySelector(".jx-select-trigger").focus();
      } else if (e.key == "Tab") {
        root.classList.remove("open");
        root.querySelector(".jx-select-trigger").setAttribute("aria-expanded", "false");
      }
      if (next >= 0) {
        e.preventDefault();
        options[next].focus();
      }
    }
  });
  var dragStartY = 0;
  var dragStartTime = 0;
  var draggingFilters = false;
  document.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".jx-sheet-handle"), filters = $("#jx-filters.open");
    if (!handle || !filters || !matchMedia("(max-width: 640px)").matches) return;
    draggingFilters = true;
    dragStartY = e.clientY;
    dragStartTime = Date.now();
    filters.classList.add("dragging");
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  document.addEventListener("pointermove", (e) => {
    if (!draggingFilters) return;
    const distance = Math.max(0, e.clientY - dragStartY);
    $("#jx-filters")?.style.setProperty("--jx-drag-y", `${distance}px`);
  });
  var finishFilterDrag = (e) => {
    if (!draggingFilters) return;
    draggingFilters = false;
    const distance = Math.max(0, e.clientY - dragStartY), elapsed = Math.max(1, Date.now() - dragStartTime);
    const filters = $("#jx-filters");
    filters?.classList.remove("dragging");
    if (distance > 90 || distance > 35 && distance / elapsed > 0.45) closeFilters();
    else filters?.style.removeProperty("--jx-drag-y");
  };
  document.addEventListener("pointerup", finishFilterDrag);
  document.addEventListener("pointercancel", finishFilterDrag);
  document.addEventListener("submit", (e) => {
    if (field(e.target).matches && field(e.target).matches("[data-jxform]")) {
      e.preventDefault();
      A.jsearch();
    }
  });
  function ctl(t) {
    const n = t.name, v = t.value, before = JSON.stringify(JF);
    if (n == "q") JF.q = v.trim();
    else if (n == "c") JF.c = v;
    else if (n == "l") JF.l = v;
    else if (n == "pm") JF.pm = +v;
    else if (n == "so") JF.so = v;
    else if (n == "ty1") {
      JF.ty = v && v != "*" ? [v] : [];
      JF.sv = false;
    } else if (n == "ty") {
      JF.ty = [...document.querySelectorAll("[data-jx][name=ty]")].filter((x) => x.checked).map((x) => x.value);
      JF.sv = false;
    } else if (n == "el") JF.el = t.checked;
    else if (n == "cl") JF.cl = t.checked;
    if (JSON.stringify(JF) === before) return;
    FV.p = 1;
    paint();
  }
  A.jtab = (d) => {
    JF.sv = d.v == "saved";
    JF.ty = d.v == "all" || d.v == "saved" ? [] : [d.v];
    FV.p = 1;
    paint();
  };
  A.jreset = () => {
    JF = fresh();
    FV.p = 1;
    paint();
  };
  A.jsearch = () => {
    FV.p = 1;
    paint();
    closeFilters();
    const t = $("#jx-top");
    t && t.scrollIntoView({ behavior: calm(), block: "start" });
  };
  A.jexplore = () => {
    const i = document.querySelector(".jx-search input");
    i && i.scrollIntoView({ behavior: calm(), block: "center" });
    i && i.focus({ preventScroll: true });
  };
  var filterScrollY = 0;
  function closeFilters() {
    const filters = $("#jx-filters");
    filters?.classList.remove("open");
    filters?.classList.remove("dragging");
    filters?.style.removeProperty("--jx-drag-y");
    filters?.setAttribute("role", "region");
    filters?.removeAttribute("aria-modal");
    document.querySelector(".jx")?.classList.remove("jx-filters-open");
    const wasLocked = document.body.classList.contains("jx-modal-open");
    document.body.classList.remove("jx-modal-open");
    document.documentElement.style.removeProperty("--jx-scroll-lock-top");
    if (wasLocked) window.scrollTo(0, filterScrollY);
    $(".jx-ftog")?.focus({ preventScroll: true });
  }
  A.jfilters = () => {
    const filters = $("#jx-filters"), opening = !filters.classList.contains("open");
    filters.classList.toggle("open", opening);
    $(".jx")?.classList.toggle("jx-filters-open", opening);
    const mobile = opening && matchMedia("(max-width: 640px)").matches;
    if (mobile) {
      filterScrollY = window.scrollY;
      document.documentElement.style.setProperty("--jx-scroll-lock-top", `-${filterScrollY}px`);
    }
    document.body.classList.toggle("jx-modal-open", mobile);
    filters.setAttribute("role", mobile ? "dialog" : "region");
    if (mobile) {
      filters.setAttribute("aria-modal", "true");
      $(".jx-fclose")?.focus();
    } else filters.removeAttribute("aria-modal");
  };
  A.jfiltersClose = closeFilters;
  function paintSaves() {
    document.querySelectorAll("[data-a=jsave]").forEach((b) => {
      const on = db.sv.includes(+b.dataset.id), lab = b.querySelector(".lab");
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      if (lab) lab.textContent = on ? "Saved" : "Save job";
    });
  }
  A.jsave = async (d) => {
    const id = +d.id, on = !db.sv.includes(id);
    db.sv = on ? [...db.sv, id] : db.sv.filter((x) => x != id);
    paintSaves();
    const r = await call("POST", "/student/saved", { job: id, on }, on ? "Job saved" : "Removed from saved jobs", false);
    if (!r) {
      db.sv = on ? db.sv.filter((x) => x != id) : [...db.sv, id];
      paintSaves();
    }
    paint();
  };
  var lock = 0;
  var mark = (id) => document.querySelectorAll(".jd-tab").forEach((b) => b.classList.toggle("on", b.dataset.t == id));
  function follow() {
    if (Date.now() < lock) return;
    const tabs = [...document.querySelectorAll(".jd-tab")].map((b) => b.dataset.t);
    if (!tabs.length) return;
    let cur = tabs[0];
    document.querySelectorAll(".jd-main .jd-sec").forEach((x) => {
      if (tabs.includes(x.id) && x.getBoundingClientRect().top <= 180) cur = x.id;
    });
    mark(cur);
  }
  var ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        follow();
      });
    }
  }, { passive: true });
  A.jgo = (d) => {
    const t = document.getElementById(d.t);
    if (!t) return;
    lock = Date.now() + 1e3;
    mark(d.t);
    t.scrollIntoView({ behavior: calm(), block: "start" });
  };
  A.jmore = (_d, b) => {
    const w = b.closest(".jd-skills"), all = w.classList.toggle("all");
    b.textContent = all ? "Show less" : b.dataset.label;
  };
  function renderJob(id, deps) {
    D = deps;
    const s = ME(), j = job(id);
    if (!j) return V404();
    const c = co(j.c), e = elig(s, j), a = db.apps.find((x) => x.s == s.id && x.j == j.id), ca = canApply(s, j), closed = left(j.dl) < 0;
    const points = j.ds.split("\n").map((x) => x.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean), open2 = db.jobs.filter((x) => x.c == c.id && left(x.dl) >= 0).length;
    const skills = j.sk, show = 6, crit = (ok2, l, need, have) => `<li class="${ok2 ? "ok" : "no"}"><span class="jd-tick">${ico(ok2 ? "check" : "x")}</span><b>${l}</b><span>${need}</span><em>You: ${have}</em></li>`;
    const tabs = [["jd-overview", "info", "Overview"], ["jd-eligibility", "check", "Eligibility"], ["jd-description", "list", "Job description"]];
    if (j.bn.length) tabs.push(["jd-benefits", "gift", "Benefits"]);
    tabs.push(["jd-about", "building", "About company"]);
    const status = a ? `<a class="btn jd-go" href="#/track/${a.id}">${badge(a.st)}<span>View application status</span></a>` : closed ? '<button type="button" class="btn jd-go" disabled>Applications closed</button>' : `<button type="button" class="btn fill jd-go" data-a="apply" data-id="${j.id}" ${ca.ok ? "" : "disabled"}>${ico("send")}Apply now</button>`;
    const stat = (ic, v, l) => v ? `<div>${ico(ic)}<b>${esc(v)}</b><small>${l}</small></div>` : "";
    return `<div class="dx jd"><a class="jd-back" href="#/jobs">${ico("back")}Back to jobs</a>
<header class="jd-hero"><div class="jd-art" aria-hidden="true">${campus()}</div>${logo(c, "jd-logo")}
<div class="jd-ht"><h1>${esc(j.t)}${verified}</h1><p class="jd-co">${esc(c.n)}</p><div class="jd-chips"><span>${ico("bag")}${esc(j.ty)}</span><span>${ico("pin")}${esc(j.l)}</span><span>${ico("rupee")}${esc(j.pk)}</span></div></div>
<div class="jd-flags">${flagHTML(j)}<span class="jd-due${!closed && left(j.dl) <= 7 ? " soon" : ""}">${ico("clock")}${due(j)}</span></div></header>
<nav class="jd-tabs" aria-label="Job sections">${m(tabs, (t, i) => `<button type="button" class="jd-tab${i ? "" : " on"}" data-a="jgo" data-t="${t[0]}">${ico(t[1])}${t[2]}</button>`)}</nav>
<div class="jd-grid"><div class="jd-main">
<section class="jd-sec" id="jd-overview"><h2>${ico("info")}Job overview</h2><p>${esc(c.n)} is hiring ${/^[aeiou]/i.test(j.t) ? "an" : "a"} ${esc(j.t)} for its ${esc(j.l)} office. This is a ${esc(j.ty.toLowerCase())} role open to students from ${esc(j.d.join(", "))} who meet the eligibility criteria below.</p>
<div class="jd-tiles"><div>${ico("layers")}<small>Experience</small><b>${esc(j.ex || "Freshers")}</b></div><div>${ico("cap")}<small>Qualification</small><b>${esc(j.ql || j.d.join(", "))}</b></div><div>${ico("rupee")}<small>Salary package</small><b>${esc(j.pk)}</b></div><div>${ico("pin")}<small>Location</small><b>${esc(j.l)}</b></div></div>
<h3>${ico("code")}Key skills required</h3><div class="jd-skills">${m(skills, (k, i) => `<span class="${D.has(s, k) ? "ok" : ""}${i >= show ? " x" : ""}">${D.has(s, k) ? "\u2713 " : ""}${esc(k)}</span>`)}${skills.length > show ? `<button type="button" class="jd-more" data-a="jmore" data-label="+${skills.length - show} more">+${skills.length - show} more</button>` : ""}</div></section>
<section class="jd-sec" id="jd-eligibility"><h2>${ico("check")}Eligibility</h2><div class="res ${e.ok ? "ok" : "no"}">${e.ok ? "\u2714 You are eligible for this job" : "\u2716 Not eligible yet: " + esc(e.why.join(" \xB7 "))}</div>
<ul class="jd-crit">${crit(e.c.cr, "Department", esc(j.d.join(", ")), esc(s.d))}${crit(e.c.pc, "Graduation %", "Min " + j.min + "%", s.pct + "%")}${j.m10 ? crit(e.c.p10, "10th %", "Min " + j.m10 + "%", (s.p10 || 0) + "%") : ""}${j.m12 ? crit(e.c.p12, "12th / diploma %", "Min " + j.m12 + "%", (s.p12 || 0) + "%") : ""}${crit(e.c.bk, "Backlogs", "Max " + (j.mb || 0), String(s.bk || 0))}${crit(e.c.sk, "Skills match", "At least 60%", e.m + "%")}</ul>
${e.miss.length ? `<p class="jd-miss">Missing skills: ${esc(e.miss.join(", "))}. <a href="#/skills"><b>Add skills to your profile</b></a></p>` : ""}</section>
<section class="jd-sec" id="jd-description"><h2>${ico("list")}Job description</h2>${points.length > 1 ? `<ul class="jd-points">${m(points, (p) => `<li>${esc(p)}</li>`)}</ul>` : `<p>${esc(points[0] || "The company has not added a description yet.")}</p>`}</section>
${j.bn.length ? `<section class="jd-sec" id="jd-benefits"><h2>${ico("gift")}Benefits</h2><ul class="jd-ben">${m(j.bn, (b) => `<li>${ico("check")}${esc(b)}</li>`)}</ul></section>` : ""}
<section class="jd-sec" id="jd-dates"><h2>${ico("cal")}Important dates</h2><div class="jd-dates"><div class="g"><small>Application start date</small><b>${fd(j.sd)}</b></div><div class="r"><small>Last date to apply</small><b>${fd(j.dl)}</b></div><div class="b"><small>Interview date</small><b>${j.ivd ? fd(j.ivd) : "To be announced"}</b></div></div></section></div>
<aside class="jd-aside"><section class="jd-about jd-sec" id="jd-about"><h2>${ico("building")}About ${esc(c.n)}</h2><div class="jd-ab"><div class="jd-abh">${logo(c, "jd-ablogo")}<div><h3>${esc(c.n)}${verified}</h3>${c.tg ? `<p>${esc(c.tg)}</p>` : ""}</div></div>${c.ab ? `<p class="jd-abt">${esc(c.ab)}</p>` : ""}
<div class="jd-cs">${stat("users", c.em, "Employees")}${stat("globe", c.ct, "Countries")}${stat("bag", String(open2), "Open jobs")}</div>
${c.w ? `<a class="btn full" href="${esc(c.w)}" target="_blank" rel="noopener noreferrer">Visit company website ${ico("ext")}</a>` : ""}</div></section>
<section class="jd-apply"><h2>${ico("send")}Ready to apply?</h2><p>Don\u2019t miss this opportunity to kickstart your career with ${esc(c.n)}!</p>${status}
<button type="button" class="btn jd-savebtn${db.sv.includes(j.id) ? " on" : ""}" data-a="jsave" data-id="${j.id}" aria-pressed="${db.sv.includes(j.id)}">${ico("bookmark")}<span class="lab">${db.sv.includes(j.id) ? "Saved" : "Save job"}</span></button>
${!a && !closed && !ca.ok ? `<p class="jd-why">${esc(ca.m)} ${s.rs ? "" : '<a href="#/resume"><b>Go to resume</b></a>'}</p>` : ""}</section></aside></div></div>`;
  }

  // src/resources.ts
  var TYPES2 = ["All resources", "Guides", "Courses", "Templates", "Tools", "Articles"];
  var ICONS = { Guide: "\u25A3", Course: "\u25A4", Template: "\u25A7", Tool: "\u2318", Article: "\u2726", "Study Material": "\u25A5", Video: "\u25B6" };
  var activeType = "All resources";
  var activeCategory = "All categories";
  var query = "";
  var resources = () => db.resources || [];
  var typeMatch = (r) => activeType === "All resources" || (activeType === "Guides" ? ["Guide", "Study Material"].includes(r.ty) : r.ty === activeType.slice(0, -1) || r.ty === activeType);
  function cards(rows2) {
    if (!rows2.length) return '<div class="cr-empty"><span>\u2315</span><h3>No resources found</h3><p>Try a different search or category.</p></div>';
    return m(rows2, (r) => `<article class="cr-card"><div class="cr-card-art ${r.ty.toLowerCase().replace(/\s/g, "-")}"><span>${ICONS[r.ty] || "\u25A4"}</span><small>${esc(r.ty)}</small></div><div class="cr-card-content"><div class="cr-card-meta"><span>${esc(r.cat)}</span><span class="cr-kind">${esc(r.ty)}</span></div><h3>${esc(r.t)}</h3><p>${esc(r.ds || "Explore this resource to build your career skills.")}</p>${r.tags?.length ? `<div class="cr-tags">${m(r.tags.slice(0, 3), (t) => `<span>${esc(t)}</span>`)}</div>` : ""}<div class="cr-card-foot"><span>${r.file ? `\u25A7 ${esc((r.fn || "File").split(".").pop()?.toUpperCase() || "FILE")}` : "\u2197 External link"}${r.dl ? ` \xB7 ${new Intl.NumberFormat("en-IN").format(r.dl)} opens` : ""}</span><button class="btn fill sm" data-a="resourceOpen" data-id="${r.id}">${r.ty === "Tool" ? "Open tool" : "Explore"} <b>\u2192</b></button></div></div></article>`);
  }
  function renderCards() {
    const all = resources().filter((r) => typeMatch(r) && (!activeCategory || activeCategory === "All categories" || r.cat === activeCategory) && (!query || `${r.t} ${r.ds} ${r.cat} ${r.ty} ${(r.tags || []).join(" ")}`.toLowerCase().includes(query)));
    const grid = $("#cr-grid");
    if (grid) grid.innerHTML = cards(all);
    const count = $("#cr-count");
    if (count) count.textContent = `${all.length} resource${all.length === 1 ? "" : "s"}`;
  }
  function renderCareerResources() {
    activeType = "All resources";
    activeCategory = "All categories";
    query = "";
    const cats = [...new Set(resources().map((r) => r.cat))];
    const featured = resources().slice().sort((a, b) => (b.dl || 0) - (a.dl || 0))[0];
    return `<div class="cr-page"><section class="cr-hero"><div class="cr-hero-copy"><span class="cr-eyebrow"><i></i> YOUR CAREER, YOUR NEXT STEP</span><h1>Resources to help<br>you <em>move forward.</em></h1><p>Explore hand-picked guides, courses, templates and tools to help you learn, prepare and get hired.</p><div class="cr-hero-stats"><span><b>${resources().length}</b> useful resources</span><i></i><span><b>${cats.length}</b> categories</span></div></div><div class="cr-hero-art" aria-hidden="true"><div class="cr-orbit cr-orbit-one"></div><div class="cr-orbit cr-orbit-two"></div><div class="cr-hero-book">\u2727<small>LEARN<br>GROW<br>THRIVE</small></div><span class="cr-float cr-float-one">\u2197</span><span class="cr-float cr-float-two">\u2726</span><span class="cr-float cr-float-three">\u2318</span></div><div class="cr-hero-bottom"><span>\u2726 &nbsp;Curated for your career journey</span><span>Find your next opportunity to grow &nbsp;\u2192</span></div></section>
<div class="cr-explore"><div class="cr-main"><div class="cr-heading"><div><span class="cr-kicker">LEARN SOMETHING NEW</span><h2>Explore career resources</h2><p>Everything you need to feel ready for what's next.</p></div><label class="cr-search"><span>\u2315</span><input id="cr-search" type="search" placeholder="Search resources..." aria-label="Search resources"><kbd>Search</kbd></label></div>
<section class="cr-categories"><div class="cr-label-row"><h3>Browse by category</h3><span>${cats.length} categories</span></div><div class="cr-category-list"><button class="cr-category on" data-category="All categories"><span>\u2726</span>All resources</button>${m(cats, (c) => `<button class="cr-category" data-category="${esc(c)}"><span>${c === "Courses" ? "\u25A4" : c === "Tools" ? "\u2318" : c === "Articles" ? "\u2727" : "\u25A3"}</span>${esc(c)}</button>`)}</div></section>
<div class="cr-tabs" role="tablist" aria-label="Resource types">${m(TYPES2, (t) => `<button role="tab" aria-selected="${t === "All resources"}" class="${t === "All resources" ? "on" : ""}" data-type="${esc(t)}">${esc(t)}</button>`)}</div>
<div class="cr-result-head"><h3>Learning library</h3><span id="cr-count">${resources().length} resource${resources().length === 1 ? "" : "s"}</span></div><div class="cr-grid" id="cr-grid">${cards(resources())}</div></div>
<aside class="cr-side"><section class="cr-side-card cr-featured"><span class="cr-side-kicker">FEATURED RESOURCE</span>${featured ? `<div class="cr-feature-icon">${ICONS[featured.ty] || "\u25A4"}</div><span class="cr-feature-cat">${esc(featured.cat)}</span><h3>${esc(featured.t)}</h3><p>${esc(featured.ds || "A hand-picked resource to support your next career step.")}</p><button class="cr-text-link" data-a="resourceOpen" data-id="${featured.id}">Explore resource <b>\u2192</b></button>` : "<h3>Coming soon</h3><p>New learning resources will appear here.</p>"}</section><section class="cr-side-card cr-tip"><div class="cr-tip-icon">\u2726</div><div><h3>Make it count</h3><p>Set aside 20 minutes to explore one new resource today. Small steps add up.</p></div></section><a class="cr-help" href="#/profile">Ready to apply? Make sure your resume is up to date <b>\u2192</b></a></aside></div></div>`;
  }
  A.resourceOpen = async (data) => {
    const resource = resources().find((r) => r.id === +data.id);
    if (!resource) return toast("This resource is no longer available.");
    const tab = window.open("about:blank", "_blank");
    const result = await call("POST", `/student/resources/${resource.id}/open`, {}, void 0, false);
    if (!result) {
      tab?.close();
      return;
    }
    const url = media(result.url);
    if (!url) {
      tab?.close();
      return toast("This resource is not available.");
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else location.href = url;
    const updated = resources().find((r) => r.id === resource.id);
    if (updated) updated.dl = result.downloads;
    renderCards();
  };
  document.addEventListener("input", (e) => {
    const target = e.target;
    if (target.id === "cr-search") {
      query = target.value.trim().toLowerCase();
      renderCards();
    }
  });
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-type],[data-category]");
    if (!target) return;
    if (target.dataset.type) {
      activeType = target.dataset.type;
      document.querySelectorAll("[data-type]").forEach((x) => {
        x.classList.toggle("on", x.dataset.type === activeType);
        x.setAttribute("aria-selected", String(x.dataset.type === activeType));
      });
    }
    if (target.dataset.category) {
      activeCategory = target.dataset.category;
      document.querySelectorAll("[data-category]").forEach((x) => x.classList.toggle("on", x.dataset.category === activeCategory));
    }
    renderCards();
  });

  // src/app.ts
  if (!S.get("studenttok")) {
    location.replace("login.html");
    throw 0;
  }
  var mine = () => db.apps.filter((a) => a.s == ME().id);
  var has = (s, k) => s.sk.some((x) => x.toLowerCase() == k.toLowerCase());
  var interviewsFor = (a) => db.iv.filter((i) => i.a == a.id).sort((x, y) => x.at - y.at);
  var hasInterview = (a) => interviewsFor(a).length > 0;
  var CK = (s) => [["Personal information", s.sec.personal, "profile"], ["Education details", s.sec.education, "education"], ["Skills (3 or more technical)", s.sec.skills, "skills"], ["Projects or certifications", s.sec.projects, "projects"], ["Resume", s.sec.resume, "resume"], ["Career preferences", s.sec.prefs, "prefs"]];
  var hit = (s, j) => {
    const p = s.pref;
    return { loc: p.locs.some((l) => l.toLowerCase() == j.l.toLowerCase()), cat: p.cats.includes(j.cat), role: p.roles.some((r) => r.toLowerCase().split(" ").some((w) => w.length > 3 && j.t.toLowerCase().includes(w))), sal: p.sal && pkmax(j.pk) >= p.sal };
  };
  var rank = (s, j) => {
    const h = hit(s, j);
    return elig(s, j).m + (h.loc ? 10 : 0) + (h.cat ? 10 : 0) + (h.role ? 10 : 0) + (h.sal ? 5 : 0);
  };
  var dlt = (j) => {
    const r = left(j.dl);
    return r < 0 ? '<span class="b rejected">Closed</span>' : r <= 7 ? `<span class="b shortlisted">${r == 0 ? "Last day" : r + " day" + (r > 1 ? "s" : "") + " left"}</span>` : `<span>\u23F0 ${fd(j.dl)}</span>`;
  };
  var V = {
    dashboard: () => renderDashboard({ CK, dlt }),
    resources: renderCareerResources,
    profile: (a) => renderProfile(a),
    education: () => renderProfile("academic"),
    skills: () => renderProfile("skills"),
    projects: () => renderPortfolioPage("projects"),
    certificates: () => renderPortfolioPage("certificates"),
    resume: () => renderProfile("docs"),
    prefs: () => renderProfile("skills"),
    jobs: () => renderJobs({ rank, has, hit }),
    job: (id) => renderJob(id, { rank, has, hit }),
    applications() {
      const apps = mine(), tabs = [
        { value: "", label: "All Applications", count: apps.length, icon: "\u25A6" },
        { value: "Applied", label: "Applied", count: apps.filter((a) => a.st == "Applied").length, icon: "\u27A4" },
        { value: "In Review", label: "In Review", count: apps.filter((a) => a.st == "In Review").length, icon: "\u25F7" },
        { value: "Shortlisted", label: "Shortlisted", count: apps.filter((a) => a.st == "Shortlisted").length, icon: "\u2713" },
        { value: "Interview", label: "Interview", count: apps.filter((a) => a.st == "Interview" || hasInterview(a)).length, icon: "\u265F" },
        { value: "Selected", label: "Selected", count: apps.filter((a) => a.st == "Selected").length, icon: "\u2605" },
        { value: "Rejected", label: "Rejected", count: apps.filter((a) => a.st == "Rejected").length, icon: "\xD7" },
        { value: "Closed", label: "Application closed", count: apps.filter((a) => a.st == "Closed").length, icon: "\u2212" }
      ];
      const status = (a) => a.st == "Selected" ? { label: "Selected", cls: "offer" } : a.st == "Rejected" ? { label: "Rejected", cls: "rejected" } : a.st == "Closed" ? { label: "Application closed", cls: "rejected" } : a.st == "Interview" || hasInterview(a) ? { label: "Interview scheduled", cls: "interview" } : a.st == "In Review" ? { label: "In review", cls: "review" } : a.st == "Shortlisted" ? { label: "Shortlisted", cls: "review" } : { label: "Applied", cls: "review" };
      ui.LF = () => {
        const period = FV.period === void 0 ? "6" : FV.period, cutoff = period ? Date.now() - Number(period) * 30.4375 * DAY : 0;
        const filtered = apps.filter((a) => {
          const hasStatus = !FV.st || a.st == FV.st || FV.st == "Interview" && hasInterview(a);
          const hasJob = !FV.appJob || String(a.j) == FV.appJob;
          const hasDate = !cutoff || new Date(a.dt).getTime() >= cutoff;
          return hasStatus && hasJob && hasDate;
        }).sort((a, b) => b.dt.localeCompare(a.dt));
        if (!filtered.length) return `<div class="app-empty">${empty("No applications match these filters. Try changing your selection or browse available jobs.")}</div>`;
        return `<div class="application-list">${m(filtered, (a) => {
          const j = job(a.j), company = co(j.c), last = a.h[a.h.length - 1] || { dt: a.dt }, state = status(a);
          return `<article class="application-card">
<div class="application-company-mark" aria-hidden="true">${esc(company.n.slice(0, 1).toUpperCase())}</div>
<div class="application-main"><div class="application-title-row"><div><h2>${esc(j.t)}</h2><p>${esc(company.n)} <span>\xB7</span> ${esc(j.l)}</p></div><span class="application-state ${state.cls}"><i></i>${state.label}</span></div>
<div class="application-skills">${m(j.sk.slice(0, 3), (skill) => `<span>${esc(skill)}</span>`)}</div>
<div class="application-meta"><span><i>\u25A3</i> Applied on ${fd(a.dt)}</span><span><i>\u21BB</i> Updated ${fd(last.dt)}</span></div></div>
<div class="application-actions"><a class="btn sm" href="#/track/${a.id}">Track application</a><a class="application-job-link" href="#/job/${j.id}">View job details <span>\u2197</span></a>${a.st == "Applied" ? `<button class="application-withdraw" data-a="wd" data-id="${a.id}">Withdraw</button>` : ""}</div>
</article>`;
        })}</div><p class="application-results" aria-live="polite">Showing ${filtered.length} of ${apps.length} applications</p>`;
      };
      const jobs = [...new Map(apps.map((a) => {
        const j = job(a.j);
        return [j.id, j.t];
      }).entries())];
      const filterDropdown = (id, name, label, selected, options) => `<div class="application-select app-filter-dropdown" id="${id}"><span class="sr-only">${label}</span><button type="button" class="application-select-trigger" data-app-filter-toggle aria-haspopup="listbox" aria-expanded="false" aria-label="${label}: ${esc(selected.label)}" aria-controls="${id}-options"><span class="application-select-icon">${id.endsWith("job") ? "\u25A3" : "\u25F7"}</span><span class="application-select-value">${esc(selected.label)}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="application-select-menu" id="${id}-options" role="listbox" aria-label="${label}" aria-hidden="true">${m(options, (o) => `<button type="button" class="application-select-option" role="option" aria-selected="${o.value === selected.value}" tabindex="-1" data-app-filter-option data-name="${name}" data-value="${esc(o.value)}" data-label="${esc(o.label)}"><span>${esc(o.label)}</span><i aria-hidden="true">${o.value === selected.value ? "\u2713" : ""}</i></button>`)}</div></div>`;
      return `<div class="applications-page">${head("My Applications", "Track and manage all your job applications in one place.", '<button class="btn application-refresh" data-a="refreshApps"><span>\u21BB</span> Refresh</button>')}
<nav class="application-tabs" aria-label="Filter applications by status">${m(tabs, (t) => `<button class="application-tab fl ${(FV.st || "") == t.value ? "on" : ""}" data-n="st" data-v="${t.value}" aria-pressed="${(FV.st || "") == t.value}"><span class="application-tab-icon">${t.icon}</span><span>${t.label}</span><b>${t.count}</b></button>`)}</nav>
<div class="application-filters">${filterDropdown("app-filter-job", "appJob", "Filter by job", { value: FV.appJob || "", label: FV.appJob ? jobs.find(([id]) => String(id) === FV.appJob)?.[1] || "All jobs" : "All jobs" }, [{ value: "", label: "All jobs" }, ...jobs.map(([id, title]) => ({ value: String(id), label: title }))])}
${filterDropdown("app-filter-date", "period", "Filter by date", { value: FV.period === void 0 ? "6" : FV.period, label: (FV.period === void 0 ? "6" : FV.period) === "6" ? "Last 6 months" : FV.period === "12" ? "Last 12 months" : "Any time" }, [{ value: "6", label: "Last 6 months" }, { value: "12", label: "Last 12 months" }, { value: "", label: "Any time" }])}
<span class="application-filter-note">Use the tabs above to filter by status</span></div><div id="lst">${ui.LF()}</div></div>`;
    },
    track(id) {
      const a = db.apps.find((x) => x.id == id && x.s == ME().id);
      if (!a) return V404();
      const j = job(a.j), history = a.h || [], rounds = interviewsFor(a), terminal = ["Rejected", "Closed"].includes(a.st), stages = ["Applied", "In Review", "Shortlisted", "Interview", "Selected"], idx = terminal ? Math.max(0, ...history.map((h) => stages.indexOf(h.st)).filter((i) => i >= 0)) : Math.max(0, stages.indexOf(a.st)), eventFor = (key) => history.filter((h) => h.st == key).slice(-1)[0], when = (key) => {
        const h = eventFor(key);
        if (key == "Interview" && rounds.length) return `Scheduled ${new Date(rounds[0].at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
        return h ? fd(h.dt) : "Completed";
      }, message = a.st == "Rejected" ? "This application was rejected. Check the timeline for the last completed stage." : a.st == "Closed" ? "This application has been closed by the placement team." : a.st == "Selected" ? "Congratulations! You have been selected." : a.st == "Interview" ? "An interview has been scheduled. Review the round details below." : a.st == "Shortlisted" ? "Your application has been shortlisted." : a.st == "In Review" ? "Your application is being reviewed." : "Your application has been received. We will update you here.", outcome = a.st == "Closed" ? "Application closed" : a.st == "Rejected" ? "Rejected" : "";
      return `<a class="mu" href="#/applications">\u2190 My applications</a><h1 class="ttl" style="margin-top:10px">Application Tracking</h1><p class="sub">${esc(j.t)} at ${esc(co(j.c).n)}</p><section class="pn"><ol class="tr">${m(stages, (stage, i) => {
        const done = terminal ? i <= idx : i < idx, active = i == idx && !terminal, actual = stage == "Applied" ? { dt: a.dt } : eventFor(stage);
        return `<li class="${done ? "dc" : active ? "cur" : ""}"><i>${done ? "\u2713" : i + 1}</i>${stage}<small>${actual ? fd(actual.dt) : stage == "Interview" && rounds.length ? when(stage) : done ? "Completed" : "Pending"}</small></li>`;
      })}${outcome ? `<li class="bad cur"><i>${a.st == "Rejected" ? "\xD7" : "\u2212"}</i>${outcome}<small>${eventFor(a.st) ? fd(eventFor(a.st).dt) : "Updated by placement team"}</small></li>` : ""}</ol><div class="res ${terminal ? "no" : "ok"}">${message}</div>${rounds.length ? `<section class="application-interviews"><h3>Interview rounds</h3>${m(rounds, (i) => `<div class="application-interview"><b>${esc(i.r)}</b><span>${new Date(i.at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span><small>${esc(i.md)}${i.lc ? " \xB7 " + esc(i.lc) : ""}</small></div>`)}</section>` : ""}<div class="acts"><a class="btn" href="#/job/${j.id}">View job</a>${a.st == "Applied" ? `<button class="btn dn" data-a="wd" data-id="${a.id}">Withdraw application</button>` : ""}</div></section>`;
    },
    notifications() {
      const n = db.nt.slice().sort((a, b) => b.tm - a.tm);
      return head("Notifications", "Stay updated with latest activities", '<button class="btn" data-a="readAll">Mark all as read</button>') + (m(n, (x) => `<div class="pn row nt ${x.rd ? "" : "un"}"><div class="ic">\u{1F514}</div><div class="grow">${esc(x.t)}</div><small class="mu">${ago(x.tm)}</small></div>`) || empty("You are all caught up."));
    },
    settings() {
      const s = ME();
      return head("Settings", "Manage your account") + `<section class="pn"><h3>Account</h3><p><b>${esc(s.n)}</b><br><span class="mu">${esc(s.e)} \xB7 ${esc(s.ph)}</span></p><p class="mu" style="margin-top:8px">To change your name or mobile number, edit your <a href="#/profile" style="color:var(--p)"><b>profile</b></a>.</p></section><section class="pn"><h3>Change password</h3><form data-f="pw" class="fg2"><label>Current password<input name="o" type="password" autocomplete="current-password" required></label><label>New password<input name="n" type="password" autocomplete="new-password" minlength="8" required></label><div class="full"><button class="btn fill">Update password</button></div></form></section>`;
    }
  };
  F.pw = async (d, f) => {
    if (await call("POST", "/student/password", { old: d.o, new: d.n }, "Password updated", false)) f.reset();
  };
  A.readAll = () => call("POST", "/student/notifications/read", {}, "All marked as read");
  A.refreshApps = () => call("GET", "/student/bootstrap", void 0, "Applications refreshed");
  A.apply = (d) => {
    const s = ME(), j = job(d.id), c = canApply(s, j);
    if (!c.ok) return toast(c.m);
    modal("Submit application", `<p>You are applying for <b>${esc(j.t)}</b> at <b>${esc(co(j.c).n)}</b>.</p><p class="mu" style="margin-top:8px">Your profile and resume (${esc(s.rs)}) will be shared with the placement cell. You can withdraw until you are shortlisted.</p>`, async () => ok(await call("POST", "/student/applications", { job: j.id }, "Application submitted")), "Submit application");
  };
  A.wd = (d) => ask("Withdraw this application? You can apply again before the deadline.", async () => {
    if (await call("DELETE", "/student/applications/" + d.id, void 0, "Application withdrawn", false)) {
      location.hash == "#/applications" ? rr() : location.hash = "#/applications";
    }
  });
  start({ role: "Student Portal", home: "index.html", guard: () => {
    if (!ME().ob) {
      location.replace("onboarding.html");
      return false;
    }
  }, nav: [["dashboard", "\u25A6", "Dashboard"], ["profile", "\u{1F464}", "My Profile"], ["projects", "\u{1F9E9}", "Projects"], ["certificates", "\u{1F3C5}", "Certificates"], ["jobs", "\u{1F4BC}", "Job Opportunities"], ["applications", "\u{1F4E8}", "My Applications"], ["notifications", "\u{1F514}", "Notifications"], ["resources", "\u{1F4DA}", "Career Resources"], ["settings", "\u2699\uFE0F", "Settings"]], al: { job: "jobs", track: "applications" }, views: V, to: "login.html", sp: "Search jobs", sv: "jobs", pf: "profile", user: ME, unread: () => db.nt.filter((x) => !x.rd).length });
})();
