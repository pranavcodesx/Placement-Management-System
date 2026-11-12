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
    const paths = { dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', students: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0m1-13a4 4 0 0 1 0 7m2 2a6 6 0 0 1 3 5"/>', companies: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12M7 7h1m8 0h1m-10 4h1m8 0h1"/>', jobs: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/>', applications: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6m-12 5 3 2 3-2"/>', reports: '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/><path d="M17 6h4v4"/>', notifications: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>', resources: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20M8 7h8m-8 4h8"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"/>', website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>', logout: '<path d="m10 17 5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>', bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>' };
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
  var db = { st: [], jobs: [], cos: [], apps: [], iv: [], nt: [], na: [], pol: { one: 1, dream: 1.5 }, resources: [], admin: { n: "Admin" } };
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
    db = ROLE == "admin" ? { ...d, nt: [] } : { st: [d.me], jobs: d.jobs, cos: d.cos, apps: d.apps, nt: d.nt, pol: d.pol, na: [] };
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
  var co = (id) => db.cos.find((c) => c.id == id);
  var job = (id) => db.jobs.find((j) => j.id == id);
  var stu = (id) => db.st.find((s) => s.id == id);
  var ini = (n) => String(n || "?").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  var fd = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  var avatar = (u, c = "") => u.photo ? `<img class="av ${c}" src="${esc(media(u.photo))}" alt="">` : `<span class="av ${c}">${ini(u.n)}</span>`;
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
    const has = (k) => s.sk.some((x) => x.toLowerCase() == k.toLowerCase()), miss = j.sk.filter((k) => !has(k)), sm = j.sk.length ? Math.round((j.sk.length - miss.length) / j.sk.length * 100) : 100, c = { cr: j.d.includes(s.d), pc: s.pct >= j.min, p10: (s.p10 || 0) >= (j.m10 || 0), p12: (s.p12 || 0) >= (j.m12 || 0), bk: (s.bk || 0) <= (j.mb || 0), sk: sm >= 60 }, why = [];
    !c.cr && why.push("Your department is not eligible");
    !c.pc && why.push(`Needs ${j.min}% (you have ${s.pct}%)`);
    !c.p10 && why.push(`Needs ${j.m10}% in 10th`);
    !c.p12 && why.push(`Needs ${j.m12}% in 12th / diploma`);
    !c.bk && why.push(`Max ${j.mb || 0} backlog(s) allowed`);
    !c.sk && why.push("Skills match is below 60%");
    return { ok: !why.length, c, m: sm, miss, why };
  }
  var fld = (l, n, v = "", t = "text", x = "") => `<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
  var sel = (l, n, o, v) => `<label>${l}<select name="${n}">${m(o, (x) => `<option ${x == v ? "selected" : ""}>${esc(x)}</option>`)}</select></label>`;
  var head = (t, s, b = "") => `<div class="ph2"><div><h1 class="ttl">${t}</h1><p class="sub">${s}</p></div>${b}</div>`;
  var tbl = (h, r) => `<div class="tw"><table><thead><tr>${m(h, (x) => `<th>${x}</th>`)}</tr></thead><tbody>${r}</tbody></table></div>`;
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
  var selectId = 0;
  var closeSelects = (except) => {
    $$('.ad-select-trigger[aria-expanded="true"]').forEach((trigger) => {
      if (trigger === except) return;
      trigger.setAttribute("aria-expanded", "false");
      const menu = $("#" + CSS.escape(trigger.getAttribute("aria-controls") || ""));
      if (menu) {
        menu.classList.remove("open", "above");
        menu.setAttribute("aria-hidden", "true");
      }
    });
  };
  function enhanceSelect(select) {
    if (select.dataset.customReady) return;
    select.dataset.customReady = "1";
    const id = select.id || "admin-select-" + ++selectId, label = select.getAttribute("aria-label") || Array.from(select.closest("label")?.childNodes || []).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(" ").trim() || select.name || "Choose an option";
    select.id = select.id || id;
    const wrap = document.createElement("span");
    wrap.className = "ad-select";
    select.parentNode?.insertBefore(wrap, select);
    wrap.append(select);
    select.classList.add("ad-select-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "ad-select-trigger";
    trigger.setAttribute("aria-label", label);
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", id + "-menu");
    trigger.dataset.sid = select.id;
    const value = document.createElement("span");
    value.className = "ad-select-value";
    const arrow = document.createElement("i");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "";
    trigger.append(value, arrow);
    wrap.append(trigger);
    const menu = document.createElement("div");
    menu.id = id + "-menu";
    menu.className = "ad-select-menu";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", label);
    menu.setAttribute("aria-hidden", "true");
    menu.dataset.owner = select.id;
    document.body.append(menu);
    const sync = () => {
      const selected = select.options[select.selectedIndex];
      value.textContent = selected?.textContent?.trim() || "Choose an option";
      trigger.classList.toggle("placeholder", !selected || selected.value === "");
      menu.querySelectorAll("[role=option]").forEach((option) => {
        const active = option.dataset.value === select.value;
        option.setAttribute("aria-selected", String(active));
        option.classList.toggle("selected", active);
      });
    };
    const buildOptions = () => {
      menu.replaceChildren();
      Array.from(select.options).forEach((option, index) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "ad-select-option";
        item.id = id + "-option-" + index;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(option.selected));
        item.disabled = option.disabled;
        item.textContent = option.textContent?.trim() || "";
        item.dataset.value = option.value;
        item.dataset.index = String(index);
        menu.append(item);
      });
      sync();
    };
    const open = (focus = true) => {
      closeSelects(trigger);
      buildOptions();
      const rect = trigger.getBoundingClientRect();
      menu.style.left = Math.max(12, Math.min(rect.left, innerWidth - Math.max(rect.width, 180) - 12)) + "px";
      menu.style.width = Math.min(Math.max(rect.width, 180), innerWidth - 24) + "px";
      menu.style.maxHeight = Math.min(260, innerHeight - 24) + "px";
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      trigger.setAttribute("aria-expanded", "true");
      const height = Math.min(menu.scrollHeight, Math.min(260, innerHeight - 24));
      const above = rect.bottom + 8 + height > innerHeight - 8;
      menu.classList.toggle("above", above);
      menu.style.top = (above ? Math.max(8, rect.top - height - 8) : Math.min(innerHeight - height - 8, rect.bottom + 7)) + "px";
      if (focus) {
        const options = $$("[role=option]:not(:disabled)", menu);
        (options.find((o) => o.getAttribute("aria-selected") === "true") || options[0])?.focus();
      }
    };
    trigger.addEventListener("click", () => trigger.getAttribute("aria-expanded") === "true" ? closeSelects() : open());
    trigger.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        open();
      }
      if (event.key === "Escape") closeSelects();
    });
    menu.addEventListener("click", (event) => {
      const item = event.target.closest("[role=option]");
      if (!item || item.getAttribute("aria-disabled") === "true") return;
      select.value = item.dataset.value || "";
      sync();
      closeSelects();
      trigger.focus();
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    menu.addEventListener("keydown", (event) => {
      const current = event.target.closest("[role=option]");
      if (event.key === "Escape") {
        event.preventDefault();
        closeSelects();
        trigger.focus();
        return;
      }
      if (event.key === "Tab") {
        closeSelects();
        return;
      }
      const options = $$("[role=option]:not(:disabled)", menu);
      let index = options.indexOf(current);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        index = (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options[index]?.focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        options[event.key === "Home" ? 0 : options.length - 1]?.focus();
      }
    });
    select.addEventListener("change", sync);
    sync();
  }
  function enhanceSelects() {
    $$("select:not([data-custom-ready])").forEach((select) => enhanceSelect(select));
    $$(".ad-select-menu").forEach((menu) => {
      if (!document.getElementById(menu.dataset.owner || "")) menu.remove();
    });
  }
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".ad-select-trigger,.ad-select-menu")) closeSelects();
  });
  window.addEventListener("scroll", () => closeSelects(), true);
  window.addEventListener("resize", () => closeSelects());
  document.addEventListener("change", (event) => {
    const select = event.target;
    if (select.matches("select.fl") && $("#lst")) {
      FV[select.name] = select.value;
      FV.p = 1;
      $("#lst").innerHTML = ui.LF();
      charts();
    }
  });
  new MutationObserver(enhanceSelects).observe(document.documentElement, { childList: true, subtree: true });
  enhanceSelects();
  function modal(title, body, on, okb = "Save", kind = "") {
    const w = document.createElement("div");
    w.className = "md" + (kind ? " " + kind : "");
    w.innerHTML = `<form class="mc" novalidate role="dialog" aria-label="${esc(title)}"><div class="mt"><h3>${title}</h3><button type="button" class="ib x" aria-label="Close">\u2715</button></div>${body}<div class="mf"><button type="button" class="btn x">Cancel</button><button class="btn fill">${okb}</button></div></form>`;
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
      let bad = 0;
      $$("[required]", f).forEach((i2) => {
        const b = !i2.value.trim();
        i2.classList.toggle("err", b);
        bad += +b;
      });
      if (bad) return;
      const r = await on(Object.fromEntries(new FormData(f)), f);
      if (r !== false) close();
    };
    document.body.append(w);
    const i = $("input,select,textarea", f);
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
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]");
    if (a && A[a.dataset.a]) {
      e.preventDefault();
      A[a.dataset.a](a.dataset, a);
    }
    const t = e.target.closest("button.fl");
    if (t) {
      const n = t.dataset.n, v = t.dataset.v;
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
  document.addEventListener("keydown", (e) => {
    if (e.key == "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $("#gs")) {
      e.preventDefault();
      $("#gs").focus();
    }
  });
  function charts() {
    if (!window.Chart) return;
    $$("canvas[data-ch]").forEach((c) => {
      const o = JSON.parse(c.dataset.ch), dn = o.t == "doughnut";
      new Chart(c, { type: o.t, data: { labels: o.l, datasets: o.d.map((d, i) => {
        const color = d.c || PAL[i];
        return { label: d.n, data: d.v, borderColor: o.t == "line" ? color : void 0, backgroundColor: dn ? PAL : o.t == "line" ? color + "22" : color, fill: o.t == "line", tension: 0.4, borderRadius: 8, borderWidth: dn ? 0 : 2 };
      }) }, options: { responsive: true, maintainAspectRatio: false, cutout: dn ? "68%" : void 0, plugins: { legend: { display: o.leg === void 0 ? dn || o.d.length > 1 : o.leg, position: "bottom" } }, scales: dn ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } } });
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
    $("#root").innerHTML = `<div class="app"><aside class="sb" id="sb"><a class="logo" href="#/${HOME}">${LOGO}<span>Career<b>Track</b></span></a><p class="role">${c.role}</p><nav id="nv" aria-label="Main"><span class="ind" id="ind"></span>${m(c.nav, (n) => `<a href="#/${n[0]}" data-id="${n[0]}"><i>${navIcon(n[0])}</i>${n[2]}</a>`)}</nav>${c.home ? `<a class="out" href="${c.home}"><i>${navIcon("website")}</i>Website</a>` : ""}<a class="out" href="#" data-a="out" data-to="${c.to}"><i>${navIcon("logout")}</i>Logout</a></aside><div class="mn"><header class="tb"><button class="ib mb" id="mb" aria-label="Open menu">\u2630</button><input class="gs" id="gs" type="search" placeholder="${c.sp}  ( / )" aria-label="Search"><span class="sp"></span><a class="ib bell" href="#/notifications" aria-label="Notifications">${navIcon("bell")}<em id="bc"></em></a><a class="av" id="av" href="#/${c.pf}" aria-label="Profile"></a></header><main id="pg" class="pg"></main></div><div class="ov" id="ov"></div></div>`;
    const sb = $("#sb"), ov = $("#ov"), tg = (o) => {
      sb.classList.toggle("open", o);
      ov.classList.toggle("on", o);
    };
    $("#mb").onclick = () => tg(1);
    ov.onclick = () => tg(0);
    $("#gs").onkeydown = (e) => e.key == "Enter" && (location.hash = `#/${c.sv}?q=${encodeURIComponent(e.target.value)}`);
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
      $$("#nv a").forEach((a) => a.classList.toggle("on", a.dataset.id == id || (c.al || {})[id] == a.dataset.id));
      const on = $("#nv a.on"), ind = $("#ind");
      if (on && ind) {
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
      const n = c.unread();
      $("#bc").textContent = n;
      $("#bc").hidden = !n;
      tg(0);
      scrollTo(0, 0);
      charts();
    };
    addEventListener("hashchange", go);
    go();
  }

  // src/resources.ts
  var CATEGORIES = ["Study Material", "Career Guides", "Interview Prep", "Resume Templates", "Placement Tips", "Soft Skills", "Courses", "Tools", "Articles", "Others"];
  var TYPES = ["Guide", "Course", "Template", "Tool", "Article", "Study Material", "Video"];
  var list = () => db.resources || [];
  var fmt = (n) => new Intl.NumberFormat("en-IN").format(n);
  var typeIcon = (r) => {
    const ext = (r.fn || "").split(".").pop()?.toUpperCase();
    return ext || (r.url ? "LINK" : r.ty.toUpperCase());
  };
  function tableRows(rows) {
    const page = pgr(rows, 8);
    return rows.length ? `<div class="tw rm-table"><table><thead><tr><th>#</th><th>Title</th><th>Category</th><th>Type</th><th>Downloads</th><th>Uploaded on</th><th>Status</th><th>Actions</th></tr></thead><tbody>${m(page.rows, (r, i) => `<tr><td>${page.o + i + 1}</td><td><span class="rm-title"><i class="rm-file ${r.file ? "has-file" : "has-link"}">${esc(typeIcon(r))}</i><span><b>${esc(r.t)}</b>${r.tags?.length ? `<small>${esc(r.tags.slice(0, 3).join(" \xB7 "))}</small>` : ""}</span></span></td><td>${esc(r.cat)}</td><td>${esc(r.ty)}</td><td>${fmt(r.dl || 0)}</td><td>${r.up ? fd(r.up) : "\u2014"}</td><td><span class="rm-status ${r.st.toLowerCase()}">${esc(r.st)}</span></td><td><div class="rm-actions">${r.file || r.url ? `<a class="ib" href="${esc(media(r.file) || r.url)}" target="_blank" rel="noopener noreferrer" aria-label="Preview ${esc(r.t)}">\u25C9</a>` : ""}<button class="ib" data-a="resourceEdit" data-id="${r.id}" aria-label="Edit ${esc(r.t)}">\u270F\uFE0F</button><button class="ib dn" data-a="resourceDelete" data-id="${r.id}" aria-label="Delete ${esc(r.t)}">\u{1F5D1}</button></div></td></tr>`)}</tbody></table></div>${page.bar}` : '<div class="emp rm-empty">No resources match these filters. Add a resource or adjust your search.</div>';
  }
  function renderResourceManagement() {
    const resources = list(), downloads = resources.reduce((sum, r) => sum + (r.dl || 0), 0), published = resources.filter((r) => r.st === "Published").length, popular = resources.filter((r) => (r.dl || 0) > 0).length;
    const counts = CATEGORIES.map((category) => ({ category, count: resources.filter((r) => r.cat === category).length })).filter((x) => x.count).sort((a, b) => b.count - a.count);
    const stat = (icon, label, value, tone) => `<div class="rm-stat ${tone}"><span>${icon}</span><small>${label}</small><b>${fmt(value)}</b></div>`;
    ui.LF = () => {
      const q = String(FV.q || "").toLowerCase(), rows = resources.filter((r) => (!q || `${r.t} ${r.ds} ${r.cat} ${r.ty} ${(r.tags || []).join(" ")}`.toLowerCase().includes(q)) && (!FV.rc || r.cat === FV.rc) && (!FV.rt || r.ty === FV.rt) && (!FV.rs || r.st === FV.rs));
      return tableRows(rows);
    };
    return `<div class="rm-page"><header class="rm-heading"><span class="rm-heading-icon">\u25A3</span><div><h1>Resource Management</h1><p>Manage career resources, learning materials, guides and more.</p></div><button class="btn fill" data-a="resourceEdit">\uFF0B Add Resource</button></header>
<section class="rm-stats">${stat("\u25A4", "Total resources", resources.length, "blue")}${stat("\u2B07", "Total downloads", downloads, "green")}${stat("\u2605", "Popular resources", popular, "purple")}${stat("\u25B0", "Categories", new Set(resources.map((r) => r.cat)).size, "orange")}</section>
<div class="rm-workspace"><aside class="rm-categories"><div class="rm-section-title"><h2>Resource categories</h2><span>${counts.length}</span></div>${counts.length ? m(counts, (x) => `<button class="rm-category fl${FV.rc === x.category ? " on" : ""}" data-n="rc" data-v="${esc(x.category)}"><span>\u25A3</span><b>${esc(x.category)}</b><i>${x.count}</i></button>`) : '<p class="rm-muted">Categories appear here when resources are added.</p>'}<button class="rm-category rm-all fl${!FV.rc ? " on" : ""}" data-n="rc" data-v=""><span>\u2315</span><b>View all resources</b><i>${resources.length}</i></button></aside>
<section class="rm-list-panel"><div class="rm-list-head"><div><h2>All resources</h2><p>Published resources are available in the student portal.</p></div></div>${`<div class="flt rm-filters"><input class="fl" name="q" type="search" placeholder="Search resources..." value="${esc(FV.q || "")}" aria-label="Search resources"><select class="fl" name="rc" aria-label="Filter by category"><option value="">All categories</option>${m(CATEGORIES, (c) => `<option value="${esc(c)}" ${FV.rc === c ? "selected" : ""}>${esc(c)}</option>`)}</select><select class="fl" name="rt" aria-label="Filter by type"><option value="">All types</option>${m(TYPES, (t) => `<option ${FV.rt === t ? "selected" : ""}>${t}</option>`)}</select><select class="fl" name="rs" aria-label="Filter by status"><option value="">All statuses</option>${m(["Published", "Draft"], (s) => `<option ${FV.rs === s ? "selected" : ""}>${s}</option>`)}</select></div>`}<div id="lst">${ui.LF()}</div></section></div></div>`;
  }
  function resourceForm(resource) {
    const r = resource || {};
    const fileInfo = r.file ? `<div class="rm-current-file"><span class="rm-file has-file">${esc(typeIcon(r))}</span><span><b>${esc(r.fn)}</b><small>Current resource file</small></span><a href="${esc(media(r.file))}" target="_blank" rel="noopener noreferrer">Preview</a></div>` : "";
    const body = `<div class="rm-modal-head"><span>\u25A4</span><p>Share useful learning content with students.</p></div>
<div class="rm-form-grid">${fld("Resource title *", "t", r.t || "", "text", 'required maxlength="160" placeholder="e.g. Resume Writing Guide"')}<label>Category *<select name="cat" required>${m(CATEGORIES, (c) => `<option ${r.cat === c ? "selected" : ""}>${esc(c)}</option>`)}</select></label>
<label>Resource type *<select name="ty" required>${m(TYPES, (t) => `<option ${r.ty === t ? "selected" : ""}>${esc(t)}</option>`)}</select></label><label>Publication status *<select name="st"><option ${!r.st || r.st === "Draft" ? "selected" : ""}>Draft</option><option ${r.st === "Published" ? "selected" : ""}>Published</option></select></label>
<label class="full">Description<textarea name="ds" rows="3" maxlength="2000" placeholder="What will students learn from this resource?">${esc(r.ds || "")}</textarea></label>
<label class="full">Tags <input name="tags" type="text" value="${esc((r.tags || []).join(", "))}" maxlength="320" placeholder="Resume, Interview, Career"></label>
<label class="full">Resource link <input name="url" type="url" value="${esc(r.url || "")}" maxlength="500" placeholder="https://..."><small>Use a link for courses, tools or articles hosted elsewhere.</small></label>
<div class="full rm-upload">${fileInfo}<label>Upload file <input name="file" type="file" accept=".pdf,.doc,.docx,.zip,.mp4"><small>PDF, DOC, DOCX, ZIP or MP4 \xB7 up to 50 MB. Upload a file or provide a link.</small></label>${r.file ? `<label class="rm-remove-file"><input type="checkbox" name="removeFile" value="1"> Remove current file (add a link first)</label>` : ""}</div></div>`;
    modal(resource ? "Edit resource" : "Add resource", body, async (values, form) => {
      const fields = ["t", "ds", "cat", "ty", "tags", "url", "st"];
      const file = values.file instanceof File && values.file.size ? values.file : void 0;
      let data = Object.fromEntries(fields.map((key) => [key, values[key] || ""]));
      if (file) {
        const formData = new FormData();
        fields.forEach((key) => formData.append(key, values[key] || ""));
        formData.append("file", file);
        data = formData;
      }
      if (values.removeFile === "1" && !(data instanceof FormData)) data.removeFile = "1";
      return ok(await call(resource ? "PUT" : "POST", `/admin/resources${resource ? "/" + resource.id : ""}`, data, resource ? "Resource updated" : "Resource added"));
    }, resource ? "Save changes" : "Add resource", "resource-modal");
  }
  A.resourceEdit = (d) => resourceForm(d.id ? list().find((r) => r.id == +d.id) : void 0);
  A.resourceDelete = (d) => ask("Delete this resource? Students will no longer be able to access it.", () => call("DELETE", `/admin/resources/${d.id}`, void 0, "Resource deleted"));
  document.addEventListener("change", (e) => {
    const target = e.target;
    if (target.matches(".rm-upload input[type=file]") && target.files?.[0]) {
      const file = target.files[0], ext = file.name.toLowerCase().split(".").pop() || "";
      if (!["pdf", "doc", "docx", "zip", "mp4"].includes(ext)) {
        toast("Choose a PDF, DOC, DOCX, ZIP or MP4 file.");
        target.value = "";
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast("Resource file must be under 50 MB.");
        target.value = "";
      } else {
        const url = $("input[name=url]");
        if (url) url.value = "";
      }
    }
  });

  // src/app.ts
  if (!S.get("admintok")) {
    location.replace("login.html");
    throw 0;
  }
  var SS = ["Applied", "In Review", "Shortlisted", "Selected", "Rejected", "Closed"];
  var placed = () => new Set(db.apps.filter((a) => a.st == "Selected").map((a) => a.s));
  var eligList = (j) => db.st.filter((s) => s.s == "Active" && s.ob && elig(s, j).ok);
  var pend = (a) => ["Applied", "In Review"].includes(a.st) && (Date.now() - +new Date(a.dt)) / DAY > 7;
  var isNewApplication = (a) => {
    const age = Date.now() - new Date(a.dt).getTime();
    return a.st == "Applied" && age >= 0 && age <= 7 * DAY;
  };
  var bar = (ph, x = "") => `<div class="flt"><input class="fl" name="q" type="search" placeholder="${ph}" value="${esc(FV.q)}" aria-label="${ph}">${x}</div>`;
  var acts = (k, id) => `<td class="ac"><button class="ib" data-a="${k}E" data-id="${id}" aria-label="Edit">\u270F\uFE0F</button><button class="ib dn" data-a="${k}D" data-id="${id}" aria-label="Delete">\u{1F5D1}</button></td>`;
  var cl = (j) => {
    const r = left(j.dl);
    return r < 0 ? '<span class="b inactive">Closed</span>' : r <= 7 ? `<span class="b shortlisted">${r} day${r == 1 ? "" : "s"} left</span>` : fd(j.dl);
  };
  var sSel = (a) => `<select class="stsel" data-id="${a.id}" aria-label="Status">${m(SS, (x) => `<option value="${x}" ${x == a.st ? "selected" : ""}>${x == "Closed" ? "Application closed" : x}</option>`)}</select>`;
  var interviewInfo = (a) => {
    const rounds = db.iv.filter((i) => i.a == a.id).sort((x, y) => x.at - y.at);
    return `${rounds.length ? `<small>${rounds.map((i) => `${esc(i.r)} \xB7 ${new Date(i.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`).join("<br>")}</small>` : '<small class="mu">Not scheduled</small>'}<button class="btn sm" data-a="ivE" data-id="${a.id}">${rounds.length ? "Add round" : "Schedule interview"}</button>`;
  };
  var who = (s) => `<a class="who" href="#/student/${s.id}">${avatar(s, "sm")}${esc(s.n)}</a>`;
  var applicantRankings = {};
  var rankingBreakdown = (r) => `Skills ${r.breakdown.skills}/50 \xB7 Graduation ${r.breakdown.graduation}/25 \xB7 10th/12th ${r.breakdown.school}/10 \xB7 Backlogs ${r.breakdown.backlogs}/10 \xB7 Projects/certifications ${r.breakdown.portfolio}/5`;
  async function loadApplicantRanking(jobId) {
    if (location.hash !== `#/jobd/${jobId}`) return;
    let panel = $("#job-ranking");
    if (!panel) {
      const heading = $$("h3").find((item) => item.textContent?.trim() === "Applicants");
      if (!heading) return;
      heading.insertAdjacentHTML("beforebegin", `<section class="pn rank-panel"><div class="row rank-heading"><div><h2>Ranked applicants</h2><p class="mu">Weighted score from skills, academics, backlogs and portfolio.</p></div></div><div id="job-ranking" data-job="${jobId}" aria-live="polite" aria-busy="true"><div class="mu">Loading applicant rankings\u2026</div></div></section>`);
      panel = $("#job-ranking");
    }
    panel.setAttribute("aria-busy", "true");
    try {
      const result = await api("GET", `/admin/jobs/${jobId}/ranking`);
      if (!$("#job-ranking") || location.hash !== `#/jobd/${jobId}`) return;
      applicantRankings[jobId] = result.rankings;
      const applied = result.rankings.filter((row) => row.status == "Applied").length;
      panel.setAttribute("aria-busy", "false");
      panel.innerHTML = result.rankings.length ? `${applied ? `<button class="btn fill sm" data-a="shortlistTop" data-id="${jobId}">Shortlist top ${Math.min(5, applied)} applicants</button>` : ""}${tbl(["Rank", "Student", "Score", "Status"], m(result.rankings, (row, index) => `<tr class="${index < 5 ? "rank-top" : ""}"><td>${index + 1}</td><td><a class="who" href="#/student/${row.student_id}">${esc(row.student_name)}</a><small class="rank-dept">${esc(row.department)}</small></td><td><span class="rank-score" title="${esc(rankingBreakdown(row))}"><b>${row.score}</b><span class="rank-track"><i style="width:${row.score}%"></i></span><small>${esc(rankingBreakdown(row))}</small></span></td><td>${badge(row.status)}</td></tr>`))}` : '<div class="emp">No applicants to rank yet.</div>';
    } catch (error) {
      if (!$("#job-ranking") || location.hash !== `#/jobd/${jobId}`) return;
      panel.setAttribute("aria-busy", "false");
      panel.innerHTML = `<div class="mu rank-error" role="alert">${esc(error.error || "Could not load applicant rankings.")} <button class="btn sm" data-a="rankRetry" data-id="${jobId}">Try again</button></div>`;
    }
  }
  var csv = (n, r) => {
    const l = document.createElement("a");
    l.href = URL.createObjectURL(new Blob([r.map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    l.download = n;
    l.click();
  };
  var V = {
    resources: renderResourceManagement,
    dashboard() {
      const slc = db.apps.filter((a) => a.st == "Selected"), pl = placed().size, open = db.jobs.filter((j) => left(j.dl) >= 0), students = db.st.length, companies = db.cos.length;
      const months = [...Array(9).keys()].map((i) => {
        const d = /* @__PURE__ */ new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        d.setMonth(d.getMonth() - 8 + i);
        return d;
      });
      const inMonth = (date2, month) => {
        const d = new Date(date2);
        return !Number.isNaN(d.getTime()) && d.getMonth() == month.getMonth() && d.getFullYear() == month.getFullYear();
      };
      const applications = months.map((month) => db.apps.filter((a) => inMonth(a.dt, month)).length);
      const offers = months.map((month) => db.apps.filter((a) => a.st == "Selected" && inMonth(a.h.find((h) => h.st == "Selected")?.dt || a.dt, month)).length);
      const overdue = db.apps.filter(pend).length, closing = open.filter((j) => left(j.dl) <= 7).length;
      const top = db.cos.map((c) => ({ company: c, jobs: db.jobs.filter((j) => j.c == c.id).length, apps: db.apps.filter((a) => job(a.j)?.c == c.id).length })).sort((a, b) => b.apps - a.apps || b.jobs - a.jobs).slice(0, 4);
      const deadlines = open.slice().sort((a, b) => a.dl.localeCompare(b.dl)).slice(0, 4);
      const activities = db.na.slice().sort((a, b) => b.tm - a.tm).slice(0, 4);
      const hour = (/* @__PURE__ */ new Date()).getHours(), greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      const stat = (href, icon2, label, value, tone, note) => `<a class="ad-stat ${tone}" href="${href}"><span class="ad-stat-icon">${icon2}</span><span class="ad-stat-copy"><small>${label}</small><b>${value.toLocaleString("en-IN")}</b><em>${note}</em></span><svg class="ad-stat-wave" viewBox="0 0 160 42" preserveAspectRatio="none" aria-hidden="true"><path d="M1 34 C24 31 27 23 48 26 S77 19 96 24 126 7 159 11"/></svg></a>`;
      const icon = (name) => ({ students: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>', companies: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12M7 7h1m8 0h1m-10 4h1m8 0h1"/></svg>', jobs: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/></svg>', placed: '<svg viewBox="0 0 24 24"><path d="M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>' })[name];
      const activityIcon = (text) => /student|profile|register/i.test(text) ? icon("students") : /company/i.test(text) ? icon("companies") : /job|drive/i.test(text) ? icon("jobs") : /select|shortlist|placement/i.test(text) ? icon("placed") : '<svg viewBox="0 0 24 24"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>';
      const chart = esc(JSON.stringify({ t: "line", leg: false, l: months.map((d) => d.toLocaleString("en", { month: "short" })), d: [{ n: "Applications", v: applications, c: "#4778e8" }, { n: "Offers", v: offers, c: "#925de0" }] }));
      return `<div class="ad-dashboard">
<section class="ad-hero"><div class="ad-hero-copy"><span class="ad-eyebrow"><i></i> CAREERTRACK OVERVIEW</span><h1>${greeting}, ${esc(db.admin.n || "Admin")}!</h1><p>Here\u2019s what\u2019s happening across your placement portal today.</p><a class="ad-hero-link" href="#/reports">Explore placement insights <span>\u2192</span></a></div>
<div class="ad-hero-art" aria-hidden="true"><div class="ad-orbit ad-orbit-one"></div><div class="ad-orbit ad-orbit-two"></div><div class="ad-art-card"><span class="ad-art-top"><i></i><i></i><i></i></span><span class="ad-art-avatar"></span><span class="ad-art-lines"><i></i><i></i><i></i></span><span class="ad-art-chart"><i></i><i></i><i></i><i></i><i></i></span></div><span class="ad-art-cap">\u2726</span><span class="ad-art-spark">\u2197</span></div>
<span class="ad-date"><i>\u25A3</i>${date}</span></section>
${overdue || closing ? `<div class="ad-alert">${overdue ? `<a href="#/applications?st=Applied"><span>!</span>${overdue} application${overdue == 1 ? " is" : "s are"} waiting for review over a week <b>Review \u2192</b></a>` : ""}${closing ? `<a href="#/jobs"><span>\u25F7</span>${closing} job${closing == 1 ? " closes" : "s close"} within 7 days <b>View jobs \u2192</b></a>` : ""}</div>` : ""}
<section class="ad-stats" aria-label="Placement overview metrics">
${stat("#/students", icon("students"), "Total students", students, "blue", `${db.st.filter((s) => s.s == "Active").length.toLocaleString("en-IN")} active student${db.st.filter((s) => s.s == "Active").length == 1 ? "" : "s"}`)}
${stat("#/companies", icon("companies"), "Registered companies", companies, "violet", `${db.jobs.length.toLocaleString("en-IN")} job posting${db.jobs.length == 1 ? "" : "s"} total`)}
${stat("#/jobs", icon("jobs"), "Open opportunities", open.length, "green", "Accepting applications now")}
${stat("#/students", icon("placed"), "Students placed", pl, "orange", `${students ? Math.round(pl / students * 100) : 0}% of registered students`)}
</section>
<div class="ad-main-grid">
<section class="ad-panel ad-overview"><header class="ad-panel-head"><div><span class="ad-kicker">PLACEMENT PERFORMANCE</span><h2>Applications &amp; offers</h2><p>Monthly application activity and successful placements</p></div><a href="#/reports" class="ad-view-link">View reports <span>\u2192</span></a></header><div class="ad-chart-legend"><span><i class="blue"></i>Applications</span><span><i class="violet"></i>Offers</span></div><div class="ad-chart"><canvas data-ch="${chart}" aria-label="Monthly applications and offers chart"></canvas></div><div class="ad-chart-foot"><span><i></i>${db.apps.length.toLocaleString("en-IN")} total applications</span><span><i></i>${slc.length.toLocaleString("en-IN")} offers accepted</span></div></section>
<section class="ad-panel ad-deadlines"><header class="ad-panel-head"><div><span class="ad-kicker">DON\u2019T MISS OUT</span><h2>Upcoming deadlines</h2><p>Open jobs closing soon</p></div><a href="#/jobs" class="ad-view-link">View all <span>\u2192</span></a></header>
${deadlines.length ? `<div class="ad-deadline-list">${m(deadlines, (j) => {
        const days = left(j.dl), company = co(j.c);
        return `<a class="ad-deadline" href="#/jobd/${j.id}"><span class="ad-deadline-date"><b>${(/* @__PURE__ */ new Date(j.dl + "T00:00:00")).getDate()}</b><small>${(/* @__PURE__ */ new Date(j.dl + "T00:00:00")).toLocaleString("en", { month: "short" })}</small></span><span class="ad-deadline-copy"><b>${esc(j.t)}</b><small>${esc(company?.n || "Company")} \xB7 ${esc(j.l)}</small></span><span class="ad-deadline-left ${days <= 3 ? "urgent" : ""}">${days === 0 ? "Today" : `${days}d left`}</span></a>`;
      })}</div>` : '<div class="ad-empty"><span>\u2713</span><b>You\u2019re all caught up</b><small>No upcoming job deadlines right now.</small></div>'}
</section></div>
<div class="ad-bottom-grid">
<section class="ad-panel ad-activity"><header class="ad-panel-head"><div><span class="ad-kicker">LATEST UPDATES</span><h2>Recent activity</h2></div><a href="#/notifications" class="ad-view-link">View all <span>\u2192</span></a></header>
${activities.length ? `<div class="ad-activity-list">${m(activities, (a) => `<div class="ad-activity-row"><span class="ad-activity-icon">${activityIcon(a.t)}</span><span class="ad-activity-text">${esc(a.t)}</span><small>${ago(a.tm)}</small></div>`)}</div>` : '<div class="ad-empty compact"><small>New updates will appear here.</small></div>'}
</section>
<section class="ad-panel ad-companies"><header class="ad-panel-head"><div><span class="ad-kicker">HIRING PARTNERS</span><h2>Top companies</h2></div><a href="#/companies" class="ad-view-link">View all <span>\u2192</span></a></header>
${top.length ? `<div class="ad-company-list">${m(top, (c) => `<a class="ad-company" href="#/companies"><span class="ad-company-mark">${c.company.lg ? `<img src="${esc(media(c.company.lg))}" alt="">` : esc((c.company.n || "?").slice(0, 1).toUpperCase())}</span><b>${esc(c.company.n)}</b><small>${c.apps} application${c.apps == 1 ? "" : "s"}</small></a>`)}</div>` : '<div class="ad-empty compact"><small>Add companies to see your hiring partners here.</small></div>'}
</section>
<section class="ad-panel ad-quick"><header class="ad-panel-head"><div><span class="ad-kicker">SHORTCUTS</span><h2>Quick actions</h2></div></header><div class="ad-quick-grid"><a href="#/companies" class="ad-quick-action"><i>${icon("companies")}</i><span><b>Add company</b><small>Manage hiring partners</small></span><em>\u2197</em></a><a href="#/jobs" class="ad-quick-action"><i>${icon("jobs")}</i><span><b>Post a job</b><small>Create an opportunity</small></span><em>\u2197</em></a><a href="#/applications" class="ad-quick-action"><i>${icon("placed")}</i><span><b>Review applications</b><small>${db.apps.filter((a) => a.st == "Applied").length} awaiting review</small></span><em>\u2197</em></a><a href="#/reports" class="ad-quick-action"><i>\u25A5</i><span><b>View reports</b><small>Explore placement data</small></span><em>\u2197</em></a></div></section>
</div></div>`;
    },
    students() {
      ui.LF = () => {
        const q = (FV.q || "").toLowerCase(), r = db.st.filter((s) => (!q || (s.n + s.e).toLowerCase().includes(q)) && (!FV.d || s.d == FV.d) && (!FV.s || s.s == FV.s) && (!FV.pl || (FV.pl == "p" ? offer(s.id) > 0 : offer(s.id) == 0))), p = pgr(r);
        return r.length ? tbl(["#", "Student", "Department", "%", "Backlogs", "Applied", "Placement", "Status", "Actions"], m(p.rows, (s, i) => {
          const o = offer(s.id);
          return `<tr><td>${p.o + i + 1}</td><td>${who(s)}</td><td>${esc(s.d)}</td><td>${s.pct}%</td><td>${s.bk || 0}</td><td>${db.apps.filter((a) => a.s == s.id).length}</td><td>${o ? `<span class="b selected">Placed \xB7 \u20B9${o} LPA</span>` : '<span class="b applied">Unplaced</span>'}</td><td>${badge(s.s)}</td><td class="ac"><a class="ib" href="#/student/${s.id}" aria-label="View">\u{1F441}</a><button class="ib dn" data-a="stD" data-id="${s.id}" aria-label="Delete">\u{1F5D1}</button></td></tr>`;
        })) + p.bar : empty("No students found.");
      };
      return head("Manage Students", "View and manage all registered students", '<button class="btn" data-a="csvS">Export CSV</button>') + bar("Search students", `<select class="fl" name="d" aria-label="Department"><option value="">All departments</option>${m(DEPTS, (d) => `<option>${d}</option>`)}</select><select class="fl" name="pl" aria-label="Placement"><option value="">All placement</option><option value="p">Placed</option><option value="u">Unplaced</option></select><select class="fl" name="s" aria-label="Status"><option value="">All status</option><option>Active</option><option>Inactive</option></select>`) + `<div id="lst">${ui.LF()}</div>`;
    },
    student(id) {
      const s = stu(id);
      if (!s) return V404();
      const ap = db.apps.filter((a) => a.s == s.id), o = offer(s.id);
      return `<a class="mu" href="#/students">\u2190 Back to students</a><section class="pn pf" style="margin-top:14px;align-items:center">${s.photo ? `<img class="bigav" src="${esc(media(s.photo))}" alt="">` : `<div class="bigav">${ini(s.n)}</div>`}<div class="grow"><h1 class="ttl sm">${esc(s.n)}</h1><p class="mu">${esc(s.d)} \xB7 Batch ${esc(s.b || "\u2014")} \xB7 ${s.pct}% \xB7 ${s.bk || 0} backlog(s)</p>${badge(s.s)} ${o ? `<span class="b selected">Placed \xB7 \u20B9${o} LPA</span>` : ""}</div></section><div class="g2"><section class="pn"><h3>Contact</h3><p>${esc(s.e)}<br>${esc(s.ph || "\u2014")}<br>${esc(s.loc || "")}</p><h3>Personal</h3><p class="mu">${s.dob ? fd(s.dob) + " \xB7 " : ""}${esc(s.gn || "")}<br>${esc(s.ad || "")}</p><h3>Skills</h3><div class="sk ro">${m(s.sk, (k) => `<span>${esc(k)}</span>`) || '<span class="mu">No skills added</span>'}</div><h3>Resume</h3><p>${s.rs ? `<a href="${esc(media(s.rsu))}" target="_blank" rel="noopener" style="color:var(--p)">${esc(s.rs)}</a>` : "Not uploaded"}</p></section><section class="pn"><h3>Education</h3><p><b>${esc(s.deg || "\u2014")}</b> \xB7 ${esc(s.d)}<br><small class="mu">${esc(s.col || "Not added")} \xB7 ${esc(s.yr || "")} \xB7 passing ${esc(s.py || "\u2014")}<br>10th ${s.p10 || "\u2014"}% \xB7 12th ${s.p12 || "\u2014"}% \xB7 ${esc(s.sty)} ${s.sc || "\u2014"} (\u2248 ${s.pct}%)</small></p><h3>Preferences</h3><p class="mu">${esc([...s.pref.roles, ...s.pref.cats].join(", ") || "Not set")}<br>${esc(s.pref.locs.join(", "))}</p><h3>Projects</h3>${m(s.pr, (p) => `<p><b>${esc(p.n)}</b><br><small class="mu">${esc(p.tk)}</small></p>`) || '<p class="mu">None added</p>'}</section></div><h3 style="margin-bottom:12px">Applications</h3>${ap.length ? tbl(["Job", "Company", "Applied on", "History", "Status"], m(ap, (a) => `<tr><td><a href="#/jobd/${a.j}">${esc(job(a.j).t)}</a></td><td>${esc(co(job(a.j).c).n)}</td><td>${fd(a.dt)}</td><td>${a.h.map((h) => h.st).join(" \u2192 ")}</td><td>${badge(a.st)}</td></tr>`)) : empty("No applications yet.")}`;
    },
    companies() {
      ui.LF = () => {
        const q = (FV.q || "").toLowerCase(), r = db.cos.filter((c) => !q || c.n.toLowerCase().includes(q));
        return r.length ? tbl(["#", "Company", "Website", "Contact", "Jobs", "Status", "Actions"], m(r, (c, i) => `<tr><td>${i + 1}</td><td><span class="cn">${c.lg ? `<img class="clg" src="${esc(media(c.lg))}" alt="">` : `<span class="clg" aria-hidden="true">${esc(c.n[0])}</span>`}<span><b>${esc(c.n)}</b>${c.tg ? `<small class="mu">${esc(c.tg)}</small>` : ""}</span></span></td><td><a href="${esc(c.w)}" target="_blank" rel="noopener" style="color:var(--p)">${esc(c.w)}</a></td><td>${esc(c.p)}</td><td>${db.jobs.filter((j) => j.c == c.id).length}</td><td>${badge(c.s)}</td>${acts("co", c.id)}</tr>`)) : empty("No companies found.");
      };
      return head("Manage Companies", "View and manage company details", '<button class="btn fill" data-a="coE">+ Add company</button>') + bar("Search companies") + `<div id="lst">${ui.LF()}</div>`;
    },
    jobs() {
      ui.LF = () => {
        const q = (FV.q || "").toLowerCase(), r = db.jobs.filter((j) => (!q || (j.t + co(j.c).n).toLowerCase().includes(q)) && (!FV.c || j.c == FV.c)), p = pgr(r);
        return r.length ? tbl(["#", "Job title", "Company", "Location", "Package", "Min %", "Eligible", "Applicants", "Closes", "Actions"], m(p.rows, (j, i) => `<tr><td>${p.o + i + 1}</td><td><a class="who" href="#/jobd/${j.id}"><b>${esc(j.t)}</b></a></td><td>${esc(co(j.c).n)}</td><td>${esc(j.l)}</td><td>${esc(j.pk)}</td><td>${j.min}%</td><td>${eligList(j).length}</td><td>${db.apps.filter((a) => a.j == j.id).length}</td><td>${cl(j)}</td><td class="ac"><a class="ib" href="#/jobd/${j.id}" aria-label="View">\u{1F441}</a><button class="ib" data-a="jE" data-id="${j.id}" aria-label="Edit">\u270F\uFE0F</button><button class="ib dn" data-a="jD" data-id="${j.id}" aria-label="Delete">\u{1F5D1}</button></td></tr>`)) + p.bar : empty("No jobs found.");
      };
      return head("Manage Jobs", "Post jobs with eligibility rules and see who qualifies", '<button class="btn fill" data-a="jE">+ Post job</button>') + bar("Search jobs", `<select class="fl" name="c" aria-label="Company"><option value="">All companies</option>${m(db.cos, (c) => `<option value="${c.id}">${esc(c.n)}</option>`)}</select>`) + `<div id="lst">${ui.LF()}</div>`;
    },
    jobd(id) {
      const j = job(id);
      if (!j) return V404();
      const c = co(j.c), ap = db.apps.filter((a) => a.j == j.id), el = eligList(j), nap = el.filter((s) => !ap.some((a) => a.s == s.id));
      queueMicrotask(() => loadApplicantRanking(j.id));
      return `<a class="mu" href="#/jobs">\u2190 Back to jobs</a><section class="pn" style="margin-top:14px"><div class="row">${c.lg ? `<img class="clg big" src="${esc(media(c.lg))}" alt="">` : `<div class="co big">${esc(c.n[0])}</div>`}<div class="grow"><h1 class="ttl sm">${esc(j.t)}${j.hl ? ` <span class="b selected">${esc(j.hl)}</span>` : ""}</h1><p class="mu">${esc(c.n)} \xB7 ${esc(j.ty)} \xB7 ${esc(j.l)} \xB7 ${esc(j.pk)} \xB7 closes ${cl(j)}</p><p class="mu">Applications open ${fd(j.sd)} \xB7 Interview ${j.ivd ? fd(j.ivd) : "not set"} \xB7 ${esc(j.ex || "Freshers")}${j.ql ? " \xB7 " + esc(j.ql) : ""}</p></div><button class="btn" data-a="jE" data-id="${j.id}">Edit job</button><button class="btn fill" data-a="nfy" data-id="${j.id}" ${nap.length ? "" : "disabled"}>Notify ${nap.length} eligible student${nap.length == 1 ? "" : "s"}</button></div><div class="sk ro" style="margin-top:16px"><span>Min ${j.min}%</span><span>Max ${j.mb || 0} backlogs</span>${m(j.d, (d) => `<span>${esc(d)}</span>`)}${m(j.sk, (k) => `<span>${esc(k)}</span>`)}</div></section><div class="kp"><div class="k1"><small>Applicants</small><b>${ap.length}</b></div><div class="k2"><small>Eligible students</small><b>${el.length}</b></div><div class="k3"><small>Eligible, not applied</small><b>${nap.length}</b></div><div class="k4"><small>Selected</small><b>${ap.filter((a) => a.st == "Selected").length}</b></div></div><h3 style="margin-bottom:12px">Applicants</h3>${ap.length ? tbl(["Student", "%", "Eligibility", "Resume", "Applied on", "Status"], m(ap, (a) => {
        const s = stu(a.s), e = elig(s, j);
        return `<tr><td>${who(s)}</td><td>${s.pct}%</td><td>${e.ok ? '<span class="b selected">Eligible</span>' : `<span class="b rejected" title="${esc(e.why.join("; "))}">Not eligible</span>`}</td><td>${esc(s.rs || "\u2014")}</td><td>${fd(a.dt)}</td><td>${sSel(a)}</td></tr>`;
      })) : empty("No applications for this job yet.")}`;
    },
    applications() {
      ui.LF = () => {
        const q = (FV.q || "").toLowerCase(), r = db.apps.filter((a) => (!FV.st || a.st == FV.st) && (!FV.j || a.j == FV.j) && (!q || (stu(a.s).n + job(a.j).t + co(job(a.j).c).n).toLowerCase().includes(q))).sort((a, b) => b.dt > a.dt ? 1 : -1), p = pgr(r, 10);
        return r.length ? tbl(['<input type="checkbox" id="ckall" aria-label="Select all">', "Student", "Job", "Company", "Applied on", "Interview rounds", "Status"], m(p.rows, (a) => {
          const s = stu(a.s), j = job(a.j), isNew = isNewApplication(a);
          return `<tr class="${isNew ? "application-row-new" : ""}"><td><input type="checkbox" class="ck1" value="${a.id}" aria-label="Select"></td><td>${who(s)}</td><td><a href="#/jobd/${j.id}">${esc(j.t)}</a></td><td>${esc(co(j.c).n)}</td><td>${fd(a.dt)}${isNew ? ' <span class="application-new-badge">NEW</span>' : ""}${pend(a) ? ' <span class="b shortlisted">Review</span>' : ""}</td><td class="ad-interviews">${interviewInfo(a)}</td><td>${sSel(a)}</td></tr>`;
        })) + p.bar : empty("No applications here.");
      };
      return head("Applications", "Update each application stage, schedule interview rounds, or close an application") + bar("Search student, job or company", `<select class="fl" name="j" aria-label="Job"><option value="">All jobs</option>${m(db.jobs, (j) => `<option value="${j.id}">${esc(j.t)} \xB7 ${esc(co(j.c).n)}</option>`)}</select>`) + `<div class="chips">${m(["", ...SS], (x) => `<button class="chip fl ${(FV.st || "") == x ? "on" : ""}" data-n="st" data-v="${x}">${x || "All"}</button>`)}</div><div class="bulk" id="bk" hidden><b><span id="bn">0</span> selected</b><button class="btn sm" data-a="bulk" data-s="In Review">In review</button><button class="btn sm" data-a="bulk" data-s="Shortlisted">Shortlist</button><button class="btn sm" data-a="bulk" data-s="Selected">Mark selected</button><button class="btn sm" data-a="bulk" data-s="Rejected">Reject</button><button class="btn sm" data-a="bulk" data-s="Closed">Close applications</button></div><div id="lst">${ui.LF()}</div>`;
    },
    reports() {
      ui.LF = () => {
        const ds = FV.d ? [FV.d] : DEPTS, sts = db.st.filter((s) => ds.includes(s.d)), ids = new Set(sts.map((s) => s.id)), ap = db.apps.filter((a) => ids.has(a.s)), sl = ap.filter((a) => a.st == "Selected"), ps = new Set(sl.map((a) => a.s)), pk = sl.map((a) => pkmax(job(a.j).pk)), hi = Math.max(0, ...pk), avg = pk.length ? (pk.reduce((t, x) => t + x, 0) / pk.length).toFixed(1) : 0, bk = [[0, 4], [4, 6], [6, 10], [10, 999]].map((b) => pk.filter((x) => x >= b[0] && x < b[1]).length), ch = (o) => `<div class="cv"><canvas data-ch="${esc(JSON.stringify(o))}"></canvas></div>`;
        return `<div class="kp"><div class="k1"><small>Placement Rate</small><b>${sts.length ? Math.round(ps.size / sts.length * 100) : 0}%</b></div><div class="k2"><small>Students Placed</small><b>${ps.size}</b></div><div class="k3"><small>Highest Package</small><b>${hi ? "\u20B9" + hi + " LPA" : "\u2014"}</b></div><div class="k4"><small>Average Package</small><b>${avg ? "\u20B9" + avg + " LPA" : "\u2014"}</b></div></div><div class="g2"><section class="pn"><h3>Department-wise placement</h3>${ch({ t: "bar", l: DEPTS, d: [{ n: "Students", v: DEPTS.map((d) => sts.filter((s) => s.d == d).length) }, { n: "Placed", v: DEPTS.map((d) => [...ps].filter((i) => stu(i).d == d).length) }] })}</section><section class="pn"><h3>Package distribution (LPA)</h3>${ch({ t: "bar", l: ["Below 4", "4 - 6", "6 - 10", "10+"], d: [{ n: "Offers", v: bk }] })}</section></div><div class="g2"><section class="pn"><h3>Application status</h3>${ch({ t: "doughnut", l: SS, d: [{ n: "Applications", v: SS.map((k) => ap.filter((a) => a.st == k).length) }] })}</section><section class="pn"><h3>Company-wise selections</h3>${tbl(["Company", "Jobs", "Applications", "Selected"], m(db.cos, (c) => `<tr><td><b>${esc(c.n)}</b></td><td>${db.jobs.filter((j) => j.c == c.id).length}</td><td>${ap.filter((a) => job(a.j).c == c.id).length}</td><td>${sl.filter((a) => job(a.j).c == c.id).length}</td></tr>`))}</section></div>`;
      };
      return head("Placement Reports", "Statistics from live application data", '<div class="acts" style="margin:0"><button class="btn" data-a="csv">Export CSV</button><button class="btn fill" onclick="print()">Print</button></div>') + `<div class="flt"><select class="fl" name="d" aria-label="Department"><option value="">All departments</option>${m(DEPTS, (d) => `<option>${d}</option>`)}</select></div><div id="lst">${ui.LF()}</div>`;
    },
    notifications() {
      return head("Notifications", "Activity across the placement system", '<button class="btn" data-a="readAll">Mark all as read</button>') + (m(db.na.slice().sort((a, b) => b.tm - a.tm), (x) => `<div class="pn row nt ${x.rd ? "" : "un"}"><div class="ic">\u{1F514}</div><div class="grow">${esc(x.t)}</div><small class="mu">${ago(x.tm)}</small></div>`) || empty("No notifications."));
    },
    settings() {
      const a = db.admin, p = db.pol;
      return head("Settings", "Manage admin preferences") + `<section class="pn"><h3>General</h3><form data-f="org" class="fg2">${fld("Organization name", "org", a.org, "text", "required")}${fld("Email address", "e", a.e, "email", "required")}${fld("Contact number", "ph", a.ph)}<div class="full"><button class="btn fill">Save changes</button></div></form></section><section class="pn"><h3>Placement policy</h3><form data-f="pol"><label class="sw"><input type="checkbox" name="one" ${p.one ? "checked" : ""}> One-offer policy: placed students can only get higher offers</label>${fld("Dream offer multiplier (a new offer must be at least this many times the current one)", "dream", p.dream, "number", "min=1 step=0.1")}<button class="btn fill">Save policy</button></form></section><section class="pn"><h3>Security</h3><form data-f="pw" class="fg2"><label>Current password<input name="o" type="password" required></label><label>New password<input name="n" type="password" minlength="6" required></label><div class="full"><button class="btn fill">Update password</button></div></form></section>`;
    }
  };
  F.org = (d) => call("PUT", "/admin/settings", { org: d.org, e: d.e, ph: d.ph }, "Settings saved", false);
  F.pol = (d) => call("PUT", "/admin/policy", { one: !!d.one, dream: +d.dream }, "Policy saved", false);
  F.pw = async (d, f) => {
    if (await call("POST", "/admin/password", { old: d.o, new: d.n }, "Password updated", false)) f.reset();
  };
  A.stD = (d) => ask("Delete this student and their applications?", async () => {
    if (await call("DELETE", "/admin/students/" + d.id, void 0, "Student deleted") && location.hash.includes("student/")) location.hash = "#/students";
  });
  A.coE = (d) => {
    const c = d.id ? co(d.id) : {};
    modal(d.id ? "Edit company" : "Add company", `<div class="fg2">${fld("Company name", "n", c.n, "text", "required")}${fld("Website", "w", c.w, "url", 'placeholder="https://"')}${fld("Contact number", "p", c.p)}${sel("Status", "s", ["Active", "Inactive"], c.s)}${fld("Tagline", "tg", c.tg, "text", 'maxlength=120 placeholder="Shown under the company name"')}${fld("Employees", "em", c.em, "text", 'maxlength=30 placeholder="e.g. 6L+"')}${fld("Countries", "ct", c.ct, "text", 'maxlength=30 placeholder="e.g. 50+"')}</div><label>About the company<textarea name="ab" rows="3" maxlength="600" placeholder="A short description students see on the job page">${esc(c.ab)}</textarea></label><div class="lgup">${c.lg ? `<img class="lg-preview" src="${esc(media(c.lg))}" alt="Current logo">` : '<span class="lgph lg-preview" aria-hidden="true">Logo</span>'}<label>Company logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"><small class="mu">PNG, JPG or WEBP, up to 2 MB. Shown on job cards and job pages.</small></label>${c.lg ? '<label class="sw"><input type="checkbox" name="rmlogo">Remove current logo</label>' : ""}</div>`, async (v, f) => {
      const r = await call(d.id ? "PUT" : "POST", "/admin/companies" + (d.id ? "/" + d.id : ""), { n: v.n, w: v.w, p: v.p, s: v.s, tg: v.tg, ab: v.ab, em: v.em, ct: v.ct }, void 0, false);
      if (!r) return false;
      const id = d.id || r.id, file = f.querySelector("input[type=file]").files[0];
      try {
        if (file) {
          const fdt = new FormData();
          fdt.append("file", file);
          await api("POST", "/admin/companies/" + id + "/logo", fdt);
        } else if (v.rmlogo && c.lg) await api("DELETE", "/admin/companies/" + id + "/logo");
      } catch (x) {
        d.id = id;
        toast(x.error || "Could not save the logo");
        return false;
      }
      await boot();
      rr();
      toast("Company saved");
      return true;
    });
  };
  A.coD = (d) => ask("Delete this company, its jobs and their applications?", () => call("DELETE", "/admin/companies/" + d.id, void 0, "Company deleted"));
  A.iv = (d) => {
    const application = db.apps.find((a) => a.id == d.id);
    if (application && ["Rejected", "Closed"].includes(application.st)) return toast("Interview cannot be scheduled for a rejected or closed application.");
    const date = new Date(Date.now() + 864e5), dval = date.toISOString().slice(0, 10), tval = "10:00";
    modal("Schedule interview", `<p class="mu">Scheduling adds an interview stage and notifies the student. Add another round from this action when needed.</p><div class="fg2">${fld("Round name", "r", "Interview", "text", 'maxlength="60" placeholder="Technical round" required')}${fld("Date", "date", dval, "date", "required")}${fld("Time", "time", tval, "time", "required")}<label>Mode<select name="md">${m(["On-campus", "Online", "Phone"], (x) => `<option>${x}</option>`)}</select></label>${fld("Location / meeting link", "lc", "", "text", 'maxlength="120" placeholder="Room or meeting link"')}</div>`, async (v) => {
      const at = (/* @__PURE__ */ new Date(`${v.date}T${v.time}`)).toISOString();
      return ok(await call("POST", `/admin/applications/${d.id}/interviews`, { at, r: v.r, md: v.md, lc: v.lc }, "Interview scheduled"));
    }, "Schedule");
  };
  A.jE = (d) => {
    const j = d.id ? job(d.id) : {};
    if (!db.cos.length) return toast("Add a company first");
    modal(d.id ? "Edit job" : "Post job", `<div class="fg2">${fld("Job title", "t", j.t, "text", "required")}<label>Company<select name="c">${m(db.cos, (c) => `<option value="${c.id}" ${c.id == j.c ? "selected" : ""}>${esc(c.n)}</option>`)}</select></label>${fld("Location", "l", j.l, "text", "required")}${sel("Type", "ty", ["Full Time", "Internship", "Part Time"], j.ty)}${fld("Package", "pk", j.pk, "text", 'placeholder="4 - 8 LPA"')}${sel("Category", "cat", CATS, j.cat)}${fld("Minimum graduation %", "min", j.min, "number", "min=0 max=100 required")}${fld("Max backlogs allowed", "mb", j.mb ?? 0, "number", "min=0 max=10")}${fld("Minimum 10th %", "m10", j.m10 || 0, "number", "min=0 max=100")}${fld("Minimum 12th / diploma %", "m12", j.m12 || 0, "number", "min=0 max=100")}${fld("Application start date (optional)", "sd", j.sd && d.id ? j.sd : "", "date")}${fld("Last date to apply", "dl", j.dl, "date", "required")}${fld("Interview date (optional)", "ivd", j.ivd, "date")}${fld("Experience", "ex", j.ex || "Freshers", "text", 'maxlength=40 placeholder="Freshers or 0 - 1 Year"')}${fld("Qualification", "ql", j.ql, "text", 'maxlength=80 placeholder="B.E / B.Tech"')}<label>Badge on the job card<select name="hl">${m(["", "Top Hiring", "Featured", "Popular"], (h) => `<option value="${h}" ${h == (j.hl || "") ? "selected" : ""}>${h || "None"}</option>`)}</select></label></div>${fld("Required skills, comma separated", "sk", (j.sk || []).join(", "), "text", "required")}<fieldset class="dp"><legend>Eligible departments</legend>${m(DEPTS, (x) => `<label class="sw"><input type="checkbox" name="d" value="${x}" ${(j.d || DEPTS).includes(x) ? "checked" : ""}>${x}</label>`)}</fieldset><label>Job description, one point per line<textarea name="ds" rows="4">${esc(j.ds)}</textarea></label><label>Benefits, one per line (optional)<textarea name="bn" rows="3" placeholder="Health insurance">${esc((j.bn || []).join("\n"))}</textarea></label>`, async (v, f) => ok(await call(d.id ? "PUT" : "POST", "/admin/jobs" + (d.id ? "/" + d.id : ""), { t: v.t, c: +v.c, l: v.l, ty: v.ty, pk: v.pk, cat: v.cat, min: +v.min, mb: +v.mb || 0, m10: +v.m10 || 0, m12: +v.m12 || 0, sk: v.sk.split(",").map((x) => x.trim()).filter(Boolean), dl: v.dl, ds: v.ds, d: new FormData(f).getAll("d"), sd: v.sd, ivd: v.ivd, ex: v.ex, ql: v.ql, hl: v.hl, bn: (v.bn || "").split("\n").map((x) => x.trim()).filter(Boolean) }, "Job saved")));
  };
  A.jD = (d) => ask("Delete this job and its applications?", async () => {
    if (await call("DELETE", "/admin/jobs/" + d.id, void 0, "Job deleted") && location.hash.includes("jobd/")) location.hash = "#/jobs";
  });
  A.nfy = (d) => {
    const j = job(d.id), n = eligList(j).filter((s) => !db.apps.some((a) => a.j == j.id && a.s == s.id));
    ask(`Send a notification to ${n.length} eligible student(s) who have not applied?`, async () => {
      const r = await call("POST", "/admin/jobs/" + d.id + "/notify", {});
      r && toast(`${r.notified} student(s) notified`);
    });
  };
  A.bulk = async (d) => {
    const ids = $$(".ck1:checked").map((c) => +c.value), r = await call("POST", "/admin/applications/bulk", { ids, status: d.s });
    r && toast(`${r.updated} updated${r.blocked ? `, ${r.blocked} blocked by placement policy` : ""}`);
  };
  A.rankRetry = (d) => loadApplicantRanking(+d.id);
  A.shortlistTop = (d) => {
    const jobId = +d.id, ranked = applicantRankings[jobId] || [], applied = ranked.filter((row) => row.status == "Applied");
    if (!applied.length) return toast("There are no Applied applicants to shortlist.");
    modal("Shortlist top applicants", `<p class="mu">Choose how many of the highest-ranked Applied applicants to shortlist. Other application statuses will not be changed.</p><label>Number to shortlist<input name="n" type="number" min="1" max="${applied.length}" value="${Math.min(5, applied.length)}" required></label>`, async (values) => {
      const count = Number(values.n);
      if (!Number.isInteger(count) || count < 1 || count > applied.length) {
        toast(`Enter a number from 1 to ${applied.length}.`);
        return false;
      }
      const selected = applied.slice(0, count);
      ask(`Move the top ${selected.length} ranked Applied applicant(s) to Shortlisted? Each student will receive a status notification.`, async () => {
        const result = await call("POST", "/admin/applications/bulk", { ids: selected.map((row) => row.application_id), status: "Shortlisted", from_status: "Applied", job: jobId });
        if (result) toast(`${result.updated} shortlisted${result.skipped ? `, ${result.skipped} skipped because status changed` : ""}${result.blocked ? `, ${result.blocked} blocked` : ""}`);
      });
      return true;
    }, "Continue");
  };
  A.readAll = () => call("POST", "/admin/notifications/read", {}, "All marked as read");
  A.csv = () => csv("applications.csv", [["Student", "Email", "Department", "Job", "Company", "Status", "Applied On"], ...db.apps.map((a) => [stu(a.s).n, stu(a.s).e, stu(a.s).d, job(a.j).t, co(job(a.j).c).n, a.st, a.dt])]);
  A.csvS = () => csv("students.csv", [["Name", "Email", "Department", "Percentage", "Backlogs", "Skills", "Placed (LPA)"], ...db.st.map((s) => [s.n, s.e, s.d, s.pct, s.bk || 0, s.sk.join("; "), offer(s.id) || ""])]);
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.classList.contains("stsel")) {
      try {
        await api("PUT", "/admin/applications/" + t.dataset.id, { status: t.value });
        await boot();
        toast("Status updated to " + t.value);
      } catch (x) {
        toast(x.error);
      }
      const ls = $("#lst");
      ls ? ls.innerHTML = ui.LF() : rr();
    }
    if (t.matches(".lgup input[type=file]") && t.files?.[0]) {
      const file = t.files[0], ext = file.name.toLowerCase().split(".").pop() || "";
      if (!["png", "jpg", "jpeg", "webp"].includes(ext)) {
        toast("Choose a PNG, JPG or WEBP logo.");
        t.value = "";
      } else if (file.size > 2 * 1024 * 1024) {
        toast("Company logo must be under 2 MB.");
        t.value = "";
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") return;
          const box = t.closest(".lgup"), preview = box.querySelector(".lg-preview");
          if (preview instanceof HTMLImageElement) preview.src = reader.result;
          else {
            const img = document.createElement("img");
            img.className = "lg-preview";
            img.alt = "Selected logo preview";
            img.src = reader.result;
            preview.replaceWith(img);
          }
        };
        reader.onerror = () => toast("Could not preview this image. Choose a valid PNG, JPG or WEBP file.");
        reader.readAsDataURL(file);
      }
    }
    if (t.classList.contains("ck1") || t.id == "ckall") {
      if (t.id == "ckall") $$(".ck1").forEach((c) => c.checked = t.checked);
      const n = $$(".ck1:checked").length;
      $("#bk").hidden = !n;
      $("#bn").textContent = n;
    }
  });
  start({ role: "Admin Panel", nav: [["dashboard", "\u25A6", "Dashboard"], ["students", "\u{1F393}", "Students"], ["companies", "\u{1F3E2}", "Companies"], ["jobs", "\u{1F4BC}", "Jobs"], ["applications", "\u{1F4E8}", "Applications"], ["reports", "\u{1F4CA}", "Reports"], ["notifications", "\u{1F514}", "Notifications"], ["resources", "\u{1F4DA}", "Resource Management"], ["settings", "\u2699\uFE0F", "Settings"]], al: { student: "students", jobd: "jobs" }, views: V, to: "logout.html", sp: "Search students", sv: "students", pf: "settings", user: () => db.admin, unread: () => db.na.filter((x) => !x.rd).length });
})();
