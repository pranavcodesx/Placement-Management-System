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
  var ini = (n) => String(n || "?").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  var fd = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  var left = (dl) => Math.ceil((+/* @__PURE__ */ new Date(dl + "T23:59:59") - Date.now()) / DAY);
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
  var selp = (l, n, o, v, ph) => `<label>${l}<select name="${n}" required><option value="">${ph}</option>${m(o, (x) => `<option ${x == v ? "selected" : ""}>${esc(x)}</option>`)}</select></label>`;
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
      $$(".application-select-option", dropdown).forEach((item) => {
        const selected = item === option;
        item.setAttribute("aria-selected", String(selected));
        $("i", item).textContent = selected ? "\u2713" : "";
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
        const options = $$(".application-select-option", dropdown), index = options.findIndex((item) => item === document.activeElement), next = e.key === "ArrowUp" ? options[Math.max(0, index - 1)] : options[Math.min(options.length - 1, Math.max(0, index + 1))];
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

  // src/onboarding.ts
  if (!S.get("studenttok")) {
    location.replace("login.html");
    throw 0;
  }
  var STEPS = [["account", "Account"], ["personal", "Personal"], ["education", "Education"], ["skills", "Skills"], ["projects", "Projects"], ["resume", "Resume"], ["prefs", "Preferences"], ["review", "Review"]];
  var ICONS = { personal: "\u{1F9D1}\u200D\u{1F393}", education: "\u{1F393}", skills: "\u{1F4A1}", projects: "\u{1F3C6}", resume: "\u{1F4C4}", prefs: "\u{1F3AF}", review: "\u2705" };
  var stepNo = () => Math.min(8, Math.max(2, +location.hash.slice(2) || ME().step || 2));
  var go = (n) => location.hash = "#/" + Math.min(8, n);
  window.WZ = { n: (k) => STEPS.findIndex((x) => x[0] == k) + 2, after: (k) => go(window.WZ.n(k)) };
  var MUST = ["personal", "education", "skills"];
  var NAME = { personal: "Personal information", education: "Education details", skills: "Skills & technologies", projects: "Projects & certifications", resume: "Resume", prefs: "Career preferences" };
  function foot(n, k, body) {
    const nx = STEPS[n] && STEPS[n][1];
    return `<div class="wzf"><button class="btn" ${n == 2 ? "disabled" : ""} data-a="back" data-n="${n}">\u2190 Back</button><div class="r">${SEC[k] && SEC[k].opt ? `<button class="btn" data-a="skip" data-n="${n}">Skip for now</button>` : ""}${body}</div></div>`;
  }
  function draw() {
    const s = ME(), n = stepNo(), k = STEPS[n - 1][0];
    let main;
    if (k == "review") {
      const sec = s.sec, miss = MUST.filter((x) => !sec[x]);
      main = `<div class="sh2"><div class="ic">\u2705</div><div><h1>Review Your Profile</h1><p class="mu">Please review your information before submitting</p></div></div><div class="rv"><ul class="cl">${m(Object.keys(NAME), (x) => `<li data-a="to" data-n="${window.WZ.n(x)}"><span class="${sec[x] ? "y" : "n"}">${sec[x] ? "\u2713" : "\u25CB"}</span><span class="grow">${NAME[x]}</span><small class="mu">${sec[x] ? "Done" : MUST.includes(x) ? "Required" : "Skipped"}</small></li>`)}</ul><div class="pn rvc">${s.photo ? `<img class="bigav" src="${esc(media(s.photo))}" alt="">` : `<div class="bigav">${ini(s.n)}</div>`}<h3>${esc(s.n)}</h3><p class="mu">${esc(s.e)}${s.loc ? "<br>\u{1F4CD} " + esc(s.loc) : ""}</p><div class="pbar" style="margin-top:16px"><i style="width:${s.pp}%"></i></div><b>${s.pp}% complete</b></div></div>${miss.length ? `<p class="res no" style="margin-top:18px">Please complete: ${miss.map((x) => NAME[x]).join(", ")}.</p>` : ""}${foot(n, k, `<button class="btn fill" data-a="finish" ${miss.length ? "disabled" : ""}>Complete My Profile \u2192</button>`)}`;
    } else {
      const form = ["personal", "education", "skills", "prefs"].includes(k);
      main = `<div class="sh2"><div class="ic">${SEC[k].ic}</div><div><h1>${SEC[k].t}</h1><p class="mu">${SEC[k].s}</p></div></div>${SEC[k].render(s, "wiz")}${foot(n, k, form ? `<button class="btn fill" form="secf">Next: ${STEPS[n][1]} \u2192</button>` : `<button class="btn fill" data-a="skip" data-n="${n}">Next: ${STEPS[n][1]} \u2192</button>`)}`;
    }
    $("#root").innerHTML = `<div class="wz"><header class="wzh"><a class="logo" href="index.html" style="display:flex;gap:9px;align-items:center;font-weight:700;font-size:21px">${LOGO.replace("#a995ff", "#1b1650")}<span>Career<b>Track</b></span></a><span class="wzc">Step ${n} of 8</span></header><ol class="stp">${m(STEPS, (x, i) => `<li class="${i + 1 < n ? "dc" : i + 1 == n ? "cur" : ""}"><i>${i + 1 < n ? "\u2713" : i + 1}</i>${x[1]}</li>`)}</ol><main class="wzm"><aside class="wzi" aria-hidden="true">${ICONS[k]}</aside><section class="pn wzs">${main}</section></main></div>`;
    scrollTo(0, 0);
  }
  A.back = (d) => go(+d.n - 1);
  A.skip = (d) => {
    call("PUT", "/student/profile", { step: Math.max(ME().step, +d.n + 1) }, "", false);
    go(+d.n + 1);
  };
  A.to = (d) => go(+d.n);
  A.finish = async () => {
    const r = await call("PUT", "/student/profile", { finish: true, step: 9 }, "", false);
    if (r) done();
  };
  function done() {
    const s = ME(), el = db.jobs.filter((j) => left(j.dl) >= 0 && elig(s, j).ok).length, cf = m([...Array(60).keys()], (i) => `<span class="cf" style="left:${Math.random() * 100}%;background:${PAL[i % 5]};animation-duration:${2.5 + Math.random() * 2.5}s;animation-delay:${Math.random() * 1.5}s"></span>`);
    $("#root").innerHTML = `<div class="done">${cf}<div class="ok">\u2713</div><h1>Profile Completed Successfully!</h1><p class="mu">Your profile is now ${s.pp}% complete. Explore job opportunities and kickstart your career journey.</p><a class="btn fill" href="app.html#/jobs" style="margin-top:12px">Explore Jobs \u2192</a><div class="stats"><div><b>${s.pp}%</b>Profile complete</div><div><b>${el}</b>Jobs you are eligible for</div><div><b>${db.jobs.filter((j) => left(j.dl) >= 0).length}</b>Open opportunities</div></div></div>`;
  }
  addEventListener("hashchange", () => {
    if (!$(".done")) draw();
  });
  (async () => {
    $("#root").innerHTML = '<div class="ld"><i></i>Loading\u2026</div>';
    try {
      await boot();
    } catch (e) {
      if (e.net) offline(e);
      return;
    }
    if (ME().ob && !location.search.includes("edit")) {
      location.replace("app.html");
      return;
    }
    if (!location.hash) location.hash = "#/" + stepNo();
    else draw();
  })();
})();
