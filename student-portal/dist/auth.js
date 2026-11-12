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

  // src/auth.ts
  var M = document.body.dataset.m || "login";
  var ST = ROLE == "student";
  var NX = new URLSearchParams(location.search).get("next") || "";
  var IC = { mail: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 7 9-7"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>', key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' };
  var svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
  var field = (label, name, type, icon, extra = "") => `<label class="fi"><span>${label}</span><div class="ip">${svg(icon)}<input name="${name}" type="${type}" ${extra} required>${type == "password" ? `<button type="button" class="eye" aria-label="Show or hide password">${svg("eye")}</button>` : ""}</div></label>`;
  var COPY = {
    login: ST ? { h: "Welcome back", p: "Sign in to continue your placement journey.", b: "Sign in", r: "Your next opportunity is one login away.", l: ["See jobs you are eligible for", "Track every application", "Get instant status updates"] } : { h: "Admin sign in", p: "Manage students, companies, jobs and applications.", b: "Sign in", r: "Run the whole placement cell from one place.", l: ["Post jobs with eligibility rules", "Update application status in bulk", "Live placement reports"] },
    register: { h: "Create your account", p: "It's free and takes a minute. You will set up your profile next.", b: "Create account", r: "Join CareerTrack. Start your journey towards a better career!", l: ["Create your account in a minute", "Set up your profile step by step", "Get matched with jobs you qualify for"] },
    forgot: { h: "Reset your password", p: "Enter your email and we will send you a 6 digit code.", b: "Send reset code", r: "Locked out? We'll get you back in.", l: ["Secure 6 digit reset code", "Valid for 15 minutes", "Back to your dashboard in seconds"] }
  };
  var stage = 1;
  function draw(extra = {}) {
    const c = COPY[M], reset = M == "forgot" && stage == 2;
    const lnk = M == "login" ? ST ? `New here? <a href="register.html">Create an account</a>` : "" : M == "register" ? 'Already have an account? <a href="login.html">Sign in</a>' : '<a href="login.html">Back to sign in</a>';
    $("#root").innerHTML = `<div class="au2"><section class="aL"><div class="aTop"><a class="logo" href="${ST ? "index.html" : "#"}">${LOGO.replace("#a995ff", "#1b1650")}<span>Career<b>Track</b></span></a>${ST ? '<a class="back" href="index.html">\u2190 Back to website</a>' : '<span class="back">Admin panel</span>'}</div>
<div class="aC"><form id="af" class="afm" novalidate><h1>${reset ? "Enter the code" : c.h}</h1><p class="mu">${reset ? "We sent a 6 digit code to your email." : c.p}</p>
${M == "register" ? field("Full name", "name", "text", "user", 'autocomplete="name" placeholder="e.g. Swara Narkar"') : ""}
${field("Email address", "email", "email", "mail", `autocomplete="email" placeholder="you@example.com" value="${esc(extra.email || "")}" ${reset ? "readonly" : ""}`)}
${M == "register" ? field("Mobile number", "phone", "tel", "phone", 'inputmode="numeric" placeholder="98765 43210" autocomplete="tel"') : ""}
${reset ? field("6 digit code", "code", "text", "key", 'inputmode="numeric" maxlength="6" placeholder="123456"') : ""}
${M == "forgot" && stage == 1 ? "" : field(reset ? "New password" : "Password", "password", "password", "lock", `autocomplete="${M == "login" ? "current-password" : "new-password"}" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"`)}
${M != "login" && !(M == "forgot" && stage == 1) ? '<div class="meter"><i id="mi"></i></div><small class="mu pwd" id="ml">Use 8+ characters with a letter and a number.</small>' : ""}
${M == "register" ? field("Confirm password", "confirm", "password", "lock", 'autocomplete="new-password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"') : ""}
${M == "login" && ST ? '<div class="rw"><span></span><a href="forgot.html">Forgot password?</a></div>' : ""}
<button class="sub">${reset ? "Reset password" : c.b}</button><p class="em" id="em" role="alert" hidden></p>${extra.dev ? `<p class="hint">Development mode: your code is <b>${extra.dev}</b> (also printed in the backend terminal).</p>` : ""}
<p class="alt">${lnk}</p>${M == "login" ? `<p class="hint">Demo login: <b>${ST ? "swara@example.com / student123" : "admin@careertrack.com / admin123"}</b></p>` : ""}</form></div><p class="aF">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} CareerTrack</p></section>
<aside class="aR"><div class="mesh"></div><div class="aRi"><img src="assets/img/hero-jobs.svg" alt=""><h2>${c.r}</h2><ul>${c.l.map((x) => `<li>${x}</li>`).join("")}</ul></div><div class="hc c1">\u{1F4BC} Eligibility in one click</div><div class="hc c2">\u{1F514} Instant status updates</div></aside></div>`;
    const af = $("#af"), er = (t) => {
      const x = $("#em");
      x.textContent = t;
      x.hidden = !t;
    };
    af.addEventListener("click", (e) => {
      const b = e.target.closest(".eye");
      if (b) {
        const i = b.previousElementSibling;
        i.type = i.type == "password" ? "text" : "password";
      }
    });
    const p = af.elements.namedItem("password");
    if (p && $("#mi")) p.oninput = () => {
      const v = p.value, s = +(v.length >= 8) + +/[A-Z]/.test(v) + +/\d/.test(v) + +/[^A-Za-z0-9]/.test(v), i = $("#mi");
      i.style.width = (v ? s * 25 : 0) + "%";
      i.style.background = ["#e5484d", "#e5484d", "#f5a524", "#18b26b", "#18b26b"][s];
      $("#ml").textContent = v ? ["Weak", "Weak", "Fair", "Strong", "Very strong"][s] + " password" : "Use 8+ characters with a letter and a number.";
    };
    af.onsubmit = async (e) => {
      e.preventDefault();
      er("");
      const f = Object.fromEntries(new FormData(af));
      f.email = (f.email || "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return er("Enter a valid email address.");
      if (M == "register") {
        if ((f.name || "").trim().length < 2) return er("Enter your full name.");
        if (!/^[6-9]\d{9}$/.test(String(f.phone).replace(/\D/g, "").slice(-10))) return er("Enter a valid 10 digit mobile number.");
        if (f.password != f.confirm) return er("Passwords do not match.");
      }
      if (f.password !== void 0 && f.password.length < (M == "login" ? 1 : 8)) return er("Password must be at least 8 characters.");
      const btn = $(".sub");
      btn.disabled = true;
      try {
        if (M == "login") {
          const r = await api("POST", "/auth/login", { email: f.email, password: f.password, role: ROLE });
          S.set(ROLE + "tok", r.token);
          location.href = ST ? r.onboarded ? /^app\.html#\//.test(NX) ? NX : "app.html#/dashboard" : "onboarding.html" : "app.html#/dashboard";
        } else if (M == "register") {
          const r = await api("POST", "/auth/register", { name: f.name.trim(), email: f.email, phone: f.phone, password: f.password });
          S.set("studenttok", r.token);
          location.href = "onboarding.html#/2";
        } else if (stage == 1) {
          const r = await api("POST", "/auth/forgot", { email: f.email });
          stage = 2;
          draw({ email: f.email, dev: r.dev_code });
        } else {
          await api("POST", "/auth/reset", { email: f.email, code: f.code, password: f.password });
          location.href = "login.html";
        }
      } catch (x) {
        er(x.error || "Something went wrong");
        btn.disabled = false;
      }
    };
  }
  draw();
})();
