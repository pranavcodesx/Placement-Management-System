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
  var PAL = ["#6d4aff", "#18b26b", "#f5a524", "#e5484d", "#3b82f6"];
  var LOGO = '<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6bff"/><stop offset="1" stop-color="#4b2fd0"/></linearGradient></defs><path d="M20 3 1 12.5 20 22l15-7.5V26h3V13z" fill="#a995ff"/><circle cx="20" cy="29" r="5.5" fill="url(#lg)"/><path d="M7 39c3-9 23-9 26 0z" fill="url(#lg)"/></svg>';
  var ROLE = document.body.dataset.r || "student";
  var API = window.CT_API || (location.port == "8000" ? "/api" : "http://127.0.0.1:8000/api");
  var ORIGIN = API.replace(/\/api$/, "");
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
  var DAY = 864e5;
  var fd = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  var pkn = (p) => (String(p).match(/[\d.]+/g) || [0]).map(Number);
  var pkmax = (p) => Math.max(...pkn(p));
  var left = (dl) => Math.ceil((+/* @__PURE__ */ new Date(dl + "T23:59:59") - Date.now()) / DAY);
  var FV = {};
  var Q = new URLSearchParams();
  var ui = { LF: () => "" };
  var A = {};
  var F = {};
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

  // src/site.ts
  var NAV = [["home", "index", "Home"], ["about", "about", "About"], ["features", "features", "Features"], ["placements", "placements", "Placements"], ["contact", "contact", "Contact"]];
  var page = document.body.dataset.page || "home";
  var loggedIn = !!S.get("studenttok");
  var logo = LOGO.replace("#a995ff", "#1b1650");
  var links = NAV.map((l) => `<a href="${l[1]}.html" class="${l[0] == page ? "on" : ""}">${l[2]}</a>`).join("");
  $("#hdr").innerHTML = `<div class="ann"><div class="wrap" id="ann"><span class="msg on">\u{1F393} Campus placement season is live <a href="placements.html">See all openings</a></span></div></div>
<header class="nav"><div class="wrap"><a class="logo" href="index.html" aria-label="CareerTrack home">${logo}<span>Career<b>Track</b></span></a>
<nav class="links" id="lk" aria-label="Main"><span class="ind" id="ind"></span>${links}<a class="mm" href="${loggedIn ? "app.html#/dashboard" : "login.html"}">${loggedIn ? "My dashboard" : "Login / Register"}</a></nav>
<div class="auth">${loggedIn ? '<a class="btn fill hm" href="app.html#/dashboard">My dashboard</a>' : '<a class="btn hm" href="login.html">Login</a><a class="btn fill hm" href="register.html">Get started</a>'}<button class="burger" id="bg" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="lk">\u2630</button></div></div></header><button class="menu-backdrop" type="button" aria-label="Close menu" tabindex="-1"></button>`;
  $("#ftr").innerHTML = `<div class="wrap"><div class="fg"><div><a class="logo" href="index.html">${LOGO}<span>Career<b>Track</b></span></a><p>Student Career &amp; Placement Management System. Plan, apply and grow.</p></div><div><h5>Explore</h5>${links}</div><div><h5>Student portal</h5><a href="login.html">Login</a><a href="register.html">Create account</a><a href="forgot.html">Forgot password</a></div><div><h5>Contact</h5><a href="mailto:support@careertrack.com">support@careertrack.com</a><a href="tel:+919876543210">+91 98765 43210</a><a href="contact.html">Pune, Maharashtra</a></div></div><div class="cp"><span>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} CareerTrack. All rights reserved.</span><span>Plan \xB7 Apply \xB7 Grow</span></div></div>`;
  var hdr = $("#hdr");
  var lk = $("#lk");
  var bg = $("#bg");
  var onScroll = () => hdr.classList.toggle("sc", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var setMenu = (open2) => {
    hdr.classList.toggle("menu-open", open2);
    lk.classList.toggle("open", open2);
    bg.setAttribute("aria-expanded", String(open2));
    bg.setAttribute("aria-label", open2 ? "Close menu" : "Open menu");
    bg.textContent = open2 ? "\u2715" : "\u2630";
  };
  bg.onclick = () => setMenu(bg.getAttribute("aria-expanded") !== "true");
  $(".menu-backdrop", hdr).addEventListener("click", () => setMenu(false));
  lk.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lk.classList.contains("open")) {
      setMenu(false);
      bg.focus();
    }
  });
  addEventListener("resize", () => {
    if (matchMedia("(min-width: 901px)").matches) setMenu(false);
  });
  var ind = $("#ind");
  var place = (smooth) => {
    const on = $("#lk a.on");
    if (!on) return;
    if (!smooth) ind.style.transition = "none";
    ind.style.width = on.offsetWidth + "px";
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
    if (!smooth) {
      ind.getBoundingClientRect();
      ind.style.transition = "";
    }
  };
  var prev = sessionStorage.getItem("ctInd");
  if (prev) {
    try {
      const p = JSON.parse(prev);
      ind.style.transition = "none";
      ind.style.width = p.w + "px";
      ind.style.transform = `translateX(${p.x}px)`;
      ind.getBoundingClientRect();
      ind.style.transition = "";
    } catch {
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(() => place(!!prev)));
  var remember = () => {
    const on = $("#lk a.on");
    if (on) sessionStorage.setItem("ctInd", JSON.stringify({ x: on.offsetLeft, w: on.offsetWidth }));
  };
  lk.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.classList.contains("mm") === false && a.getAttribute("href") && !a.classList.contains("on")) {
      ind.style.width = a.offsetWidth + "px";
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
      sessionStorage.setItem("ctInd", JSON.stringify({ x: a.offsetLeft, w: a.offsetWidth }));
    }
  });
  addEventListener("pagehide", remember);
  addEventListener("resize", () => place(false));
  var faqItems = $$(".faq-item");
  var setFaqOpen = (item, expanded) => {
    const button = $(".faq-question", item);
    const panel = $(".faq-answer", item), inner = $(".faq-answer-inner", item);
    panel.style.height = `${panel.getBoundingClientRect().height}px`;
    panel.getBoundingClientRect();
    item.classList.toggle("open", expanded);
    button.setAttribute("aria-expanded", String(expanded));
    panel.setAttribute("aria-hidden", String(!expanded));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      panel.style.height = expanded ? "auto" : "0px";
      return;
    }
    panel.style.height = expanded ? `${inner.scrollHeight}px` : "0px";
  };
  faqItems.forEach((item) => {
    const panel = $(".faq-answer", item), button = $(".faq-question", item);
    panel.setAttribute("aria-hidden", "true");
    panel.addEventListener("transitionend", (event) => {
      if (event.target === panel && event.propertyName === "height" && item.classList.contains("open")) panel.style.height = "auto";
    });
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      if (expanded) faqItems.filter((other) => other !== item && other.parentElement === item.parentElement && other.classList.contains("open")).forEach((other) => setFaqOpen(other, false));
      setFaqOpen(item, expanded);
    });
  });
  $$(".seg").forEach((seg) => {
    const si = $(".sgi", seg), buttons = $$('button[role="tab"]', seg), set = (b, smooth = true) => {
      if (!smooth) si.style.transition = "none";
      si.style.width = b.offsetWidth + "px";
      si.style.transform = `translateX(${b.offsetLeft - 5}px)`;
      if (!smooth) {
        si.getBoundingClientRect();
        si.style.transition = "";
      }
    };
    const activate = (b) => {
      buttons.forEach((x) => {
        const active = x === b;
        x.classList.toggle("on", active);
        x.setAttribute("aria-selected", String(active));
        x.tabIndex = active ? 0 : -1;
      });
      set(b);
      $$('.tabp[role="tabpanel"]').forEach((p) => p.hidden = p.id !== b.getAttribute("aria-controls"));
      reveal();
    };
    const first = $('button[role="tab"].on', seg);
    requestAnimationFrame(() => set(first, false));
    seg.addEventListener("click", (e) => {
      const b = e.target.closest('button[role="tab"]');
      if (b) activate(b);
    });
    seg.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const current = buttons.indexOf(document.activeElement), next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : (current + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      activate(buttons[next]);
    });
  });
  var io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  function reveal() {
    $$("[data-stag]").forEach((c) => {
      if (c.dataset.done) return;
      c.dataset.done = "1";
      [...c.children].forEach((k, i) => {
        k.setAttribute("data-rv", "");
        k.style.setProperty("--d", i * 0.09 + "s");
      });
    });
    $$("[data-rv]:not(.in)").forEach((e) => io.observe(e));
  }
  var cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      count(e.target);
      cio.unobserve(e.target);
    }
  }), { threshold: 0.4 });
  function count(e) {
    const n = +(e.dataset.n || 0);
    let t0 = 0;
    const f = (t) => {
      t0 = t0 || t;
      const k = Math.min((t - t0) / 1500, 1);
      e.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  reveal();
  var O = { jobs: [], cos: [], stats: { jobs: 0, cos: 0, students: 0, offers: 0, placed: 0, rate: 0, hi: 0, avg: 0 } };
  var plural = (n, w) => n + " " + w + (n == 1 ? "" : "s");
  var companyMark = (c) => {
    const domain = c?.w.match(/^https?:\/\/([^/?#]+)/i)?.[1];
    return `<span class="rc-logo"><i aria-hidden="true">${esc(c?.n.trim()[0] || "?")}</i>${domain ? `<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&amp;sz=128" alt="" width="36" height="36" decoding="async">` : ""}</span>`;
  };
  var loadCompanyMarks = (root = document) => {
    $$(".rc-logo img", root).forEach((img) => {
      const mark = img.parentElement;
      if (img.complete) {
        if (img.naturalWidth) mark?.classList.add("loaded");
      } else {
        img.addEventListener("load", () => mark?.classList.add("loaded"), { once: true });
      }
    });
  };
  var wj = (j) => {
    const c = O.cos.find((x) => x.id == j.c), r = left(j.dl), href = loggedIn ? `app.html#/job/${j.id}` : `login.html?next=${encodeURIComponent("app.html#/job/" + j.id)}`;
    return `<article class="job card" data-rv><div class="co">${companyMark(c)}</div><div><h4>${esc(j.t)}</h4><small>${esc(c ? c.n : "")} \xB7 ${esc(j.l)}</small></div><span class="dlp ${r > 7 ? "ok" : ""}">${r <= 0 ? "Last day" : r <= 7 ? plural(r, "day") + " left" : "Closes " + fd(j.dl)}</span><div class="sk2">${j.sk.map((k) => `<span>${esc(k)}</span>`).join("")}</div><p class="meta">\u{1F4B0} ${esc(j.pk)} &nbsp;\xB7&nbsp; \u{1F3F7} ${esc(j.cat)}</p><a class="btn fill sm" href="${href}">${loggedIn ? "View and apply" : "Login to apply"}</a></article>`;
  };
  var open = () => O.jobs.filter((j) => left(j.dl) >= 0).sort((a, b) => left(a.dl) - left(b.dl));
  function apply(o) {
    O = o;
    const s = o.stats, K = { jobs: s.jobs, cos: s.cos, offers: s.offers, studs: s.students, placed: s.placed }, T = { rate: s.rate + "%", hi: s.hi ? "\u20B9" + s.hi + " LPA" : "\u2014", avg: s.avg ? "\u20B9" + s.avg + " LPA" : "\u2014" };
    $$("[data-k]").forEach((e) => {
      e.dataset.n = String(K[e.dataset.k] || 0);
      cio.observe(e);
    });
    $$("[data-t]").forEach((e) => e.textContent = T[e.dataset.t] ?? String(K[e.dataset.t] ?? "\u2014"));
    const el = (id) => document.getElementById(id);
    if (el("latest")) {
      el("latest").innerHTML = o.jobs.slice(0, 3).map(wj).join("");
      loadCompanyMarks(el("latest"));
    }
    if (el("mq")) {
      const b = o.cos.map((c) => `<span class="rc">${companyMark(c)}${esc(c.n)}</span>`).join("");
      el("mq").innerHTML = b + b + b + b;
      loadCompanyMarks(el("mq"));
    }
    const soon = open();
    if (el("ud")) {
      el("ud").innerHTML = soon.slice(0, 4).map((j) => {
        const c = o.cos.find((x) => x.id == j.c), r = left(j.dl);
        return `<a class="dli" href="placements.html?q=${encodeURIComponent(j.t)}"><div class="co">${companyMark(c)}</div><div class="g"><b>${esc(j.t)}</b><small>${esc(c ? c.n : "")} \xB7 ${esc(j.l)} \xB7 ${esc(j.pk)}</small></div><span class="dlp ${r > 7 ? "ok" : ""}">${r <= 0 ? "Last day" : plural(r, "day") + " left"}</span></a>`;
      }).join("") || '<div class="emp">No open deadlines right now.</div>';
      loadCompanyMarks(el("ud"));
    }
    const msgs = [`\u{1F393} Campus placement season is live <a href="placements.html">See all openings</a>`];
    if (s.hi) msgs.push(`\u{1F4B0} Highest package this season: \u20B9${s.hi} LPA <a href="placements.html">Explore jobs</a>`);
    const nj = soon[0];
    if (nj) {
      const c = o.cos.find((x) => x.id == nj.c);
      msgs.push(`\u23F0 ${esc(nj.t)} at ${esc(c ? c.n : "")} closes in ${plural(Math.max(0, left(nj.dl)), "day")} <a href="placements.html?q=${encodeURIComponent(nj.t)}">Apply now</a>`);
    }
    msgs.push(`\u2728 Free to join \u2014 build your profile in 7 simple steps <a href="register.html">Get started</a>`);
    const ann = el("ann");
    ann.innerHTML = msgs.map((t, i) => `<span class="msg ${i ? "" : "on"}">${t}</span>`).join("");
    let mi = 0;
    if (msgs.length > 1) setInterval(() => {
      const a = ann.children;
      a[mi].classList.remove("on");
      mi = (mi + 1) % a.length;
      a[mi].classList.add("on");
    }, 4200);
    if (el("cd") && nj) {
      const end = +/* @__PURE__ */ new Date(nj.dl + "T23:59:59"), c = o.cos.find((x) => x.id == nj.c);
      el("cd-j").textContent = `${nj.t} \xB7 ${c ? c.n : ""}`;
      const tick = () => {
        let d = Math.max(0, end - Date.now());
        const p = (n) => String(n).padStart(2, "0");
        el("cd-d").textContent = p(Math.floor(d / 864e5));
        el("cd-h").textContent = p(Math.floor(d / 36e5) % 24);
        el("cd-m").textContent = p(Math.floor(d / 6e4) % 60);
        el("cd-s").textContent = p(Math.floor(d / 1e3) % 60);
      };
      tick();
      setInterval(tick, 1e3);
    }
    if (el("pj")) placements();
    reveal();
  }
  function placements() {
    const q = $("#pq");
    q.value = new URLSearchParams(location.search).get("q") || "";
    const createDropdown = (id, label, options, onChange) => {
      const root = $("#" + id), listId = id + "-options";
      root.innerHTML = `<button class="filter-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${listId}"><span>${label}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg></button><div class="filter-options" id="${listId}" role="listbox" aria-label="${label}"></div>`;
      const trigger = $(".filter-trigger", root), list = $(".filter-options", root);
      let value = options[0].value;
      const close = () => {
        root.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      };
      const select = (option) => {
        value = option.dataset.value || "";
        $(".filter-trigger span", root).textContent = option.textContent;
        $$('[role="option"]', list).forEach((item) => item.setAttribute("aria-selected", String(item === option)));
        close();
        onChange();
      };
      list.innerHTML = options.map((option, i) => `<button class="filter-option" type="button" role="option" aria-selected="${i === 0}" data-value="${esc(option.value)}">${esc(option.label)}</button>`).join("");
      trigger.addEventListener("click", () => {
        const opening = !root.classList.contains("open");
        $$(".filter-dropdown.open").forEach((item) => {
          item.classList.remove("open");
          $(".filter-trigger", item).setAttribute("aria-expanded", "false");
        });
        root.classList.toggle("open", opening);
        trigger.setAttribute("aria-expanded", String(opening));
      });
      list.addEventListener("click", (event) => {
        const option = event.target.closest('[role="option"]');
        if (option) select(option);
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          root.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
          const opts = $$('[role="option"]', list);
          (event.key === "ArrowDown" ? opts[0] : opts[opts.length - 1]).focus();
        }
      });
      list.addEventListener("keydown", (event) => {
        const opts = $$('[role="option"]', list), current = opts.indexOf(document.activeElement);
        let next = -1;
        if (event.key === "ArrowDown") next = (current + 1) % opts.length;
        else if (event.key === "ArrowUp") next = (current - 1 + opts.length) % opts.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = opts.length - 1;
        else if (event.key === "Escape") {
          event.preventDefault();
          close();
          trigger.focus();
        }
        if (next >= 0) {
          event.preventDefault();
          opts[next].focus();
        }
      });
      document.addEventListener("click", (event) => {
        if (!root.contains(event.target)) close();
      });
      return { get value() {
        return value;
      } };
    };
    let companyValue = "", sortValue = "d";
    const company = createDropdown("company-filter", "All companies", [{ value: "", label: "All companies" }, ...O.cos.map((x) => ({ value: String(x.id), label: x.n }))], () => {
      companyValue = company.value;
      draw();
    });
    const sort = createDropdown("sort-filter", "Closing soon", [{ value: "d", label: "Closing soon" }, { value: "p", label: "Highest package" }], () => {
      sortValue = sort.value;
      draw();
    });
    const draw = () => {
      const t = q.value.toLowerCase(), r = open().filter((j) => (!t || (j.t + (O.cos.find((x) => x.id == j.c) || { n: "" }).n + j.sk.join(" ") + j.l + j.cat).toLowerCase().includes(t)) && (!companyValue || String(j.c) == companyValue));
      if (sortValue === "p") r.sort((a, b) => pkmax(b.pk) - pkmax(a.pk));
      $("#pj").innerHTML = r.map(wj).join("") || '<div class="emp">No openings match your search. Try another keyword.</div>';
      loadCompanyMarks($("#pj"));
      $("#pn").textContent = plural(r.length, "open position");
      reveal();
    };
    q.addEventListener("input", draw);
    companyValue = company.value;
    sortValue = sort.value;
    draw();
  }
  fetch(API + "/public/overview").then((r) => r.json()).then(apply).catch(() => {
    const t = document.getElementById("latest") || document.getElementById("pj");
    if (t) t.innerHTML = '<div class="emp">Cannot reach the server. Start the backend with: python manage.py runserver</div>';
  });
  var contactForm = $("form.contact-form");
  if (contactForm) {
    const fields = { name: $("#n", contactForm), email: $("#e", contactForm), message: $("#m", contactForm) };
    const messages = { name: $("#n-error", contactForm), email: $("#e-error", contactForm), message: $("#m-error", contactForm) };
    const status = $("#contact-status", contactForm), submit = $('button[type="submit"]', contactForm);
    const errorFor = (key) => {
      const field = fields[key], value = field.value.trim();
      if (!value) return key === "name" ? "Please enter your name." : key === "email" ? "Please enter your email address." : "Please enter a message.";
      if (key === "name" && value.length > 80) return "Name must be 80 characters or fewer.";
      if (key === "email" && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) || !field.validity.valid)) return "Enter a valid email address.";
      if (key === "message" && value.length > 2e3) return "Message must be 2000 characters or fewer.";
      return "";
    };
    const validate = (key) => {
      const error = errorFor(key), field = fields[key], message = messages[key];
      field.classList.toggle("err", !!error);
      field.setAttribute("aria-invalid", String(!!error));
      message.textContent = error;
      message.hidden = !error;
      return !error;
    };
    Object.keys(fields).forEach((key) => {
      fields[key].addEventListener("blur", () => validate(key));
      fields[key].addEventListener("input", () => {
        if (fields[key].getAttribute("aria-invalid") === "true") validate(key);
        status.hidden = true;
      });
    });
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.hidden = true;
      status.className = "form-status";
      const valid = Object.keys(fields).map(validate).every(Boolean);
      if (!valid) {
        fields[Object.keys(fields).find((key) => fields[key].getAttribute("aria-invalid") === "true")].focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = "Sending...";
      const payload = { name: fields.name.value.trim(), email: fields.email.value.trim(), message: fields.message.value.trim() };
      try {
        const response = await fetch(API + "/public/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) {
          status.textContent = result.error || "We could not send your message. Please check your details and try again.";
          status.classList.add("error");
          status.setAttribute("role", "alert");
          status.hidden = false;
          return;
        }
        contactForm.reset();
        Object.keys(fields).forEach((key) => {
          fields[key].classList.remove("err");
          fields[key].setAttribute("aria-invalid", "false");
          messages[key].hidden = true;
        });
        status.innerHTML = '<span class="success-mark" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="m15 27 7 7 15-16"/></svg></span><span class="success-copy"><strong>Message sent!</strong><span>Thanks for reaching out. We\u2019ll reply by email within one working day.</span></span><span class="success-spark" aria-hidden="true">\u2726</span>';
        status.classList.add("success");
        status.setAttribute("role", "status");
        status.hidden = false;
      } catch {
        status.textContent = "Unable to reach the server. Please check your connection and try again.";
        status.classList.add("error");
        status.setAttribute("role", "alert");
        status.hidden = false;
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Send message <span aria-hidden="true">\u2192</span>';
      }
    });
  }
})();
