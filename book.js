// ---- Consultation booking: date & time -> plan -> details -> done ----
// Every rule (free times, prices, packages) comes from Waky Booking's public API; this page only shows them.

const BOOKING_API = "https://waky-booking-50046919821.development.catalystappsail.in/api/public/v1";

// The "Consultation" service in Waky Booking (Services > its id). Booking stays offline until it is set.
const CONSULTATION_SERVICE_ID = "5147c5c0-87bd-4143-a9f2-f7f3797705c6";

// Matched against staff names from the API, so the cards keep working if an id changes.
const PEOPLE = {
  ameen:   { name: "Ameen Sha PK",     match: /ameen/i },
  adil:    { name: "Adil Ali",         match: /ad(h)?il/i },
  fathima: { name: "Fathima Muhammed", match: /fathima/i },
};

const root = document.querySelector("[data-booking]");

if (root) {
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const rupees = (paise) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");

  const personKey = new URLSearchParams(location.search).get("with");
  const person = PEOPLE[personKey] || null;

  const state = {
    staff: null,              // { id, name, pricePaise }
    timezone: "Asia/Kolkata",
    month: null,              // Date at the 1st of the shown month (local)
    slotsByDay: new Map(),    // "YYYY-MM-DD" -> [{ start, end }]
    day: null,
    slot: null,
    packages: [],
    idemKey: null,
  };

  // ---- Small helpers ----

  const dayKey = (iso) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: state.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const timeLabel = (iso) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: state.timezone, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).toUpperCase();
  const dayLabel = (key) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" }).format(new Date(key + "T00:00:00Z"));
  const longLabel = (iso) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: state.timezone, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

  // Only "simple" requests (no custom headers, text/plain body): Catalyst's gateway answers the CORS
  // preflight itself without CORS headers, so any request that needs one is blocked by the browser.
  async function api(path, opts = {}) {
    const res = await fetch(BOOKING_API + path, {
      ...opts,
      ...(opts.body ? { headers: { "Content-Type": "text/plain;charset=UTF-8" } } : {}),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error?.message || "Something went wrong");
      err.status = res.status;
      err.reason = body.error?.details?.reason;
      throw err;
    }
    return body.data;
  }

  function show(step) {
    $$("[data-step]").forEach((el) => (el.hidden = el.dataset.step !== step));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function offline() {
    show("offline");
    const wa = $('[data-step="offline"] [data-wa-button]');
    if (wa && person && typeof waLink === "function") {
      wa.href = waLink(`Hi Waky, I'd like to book a consultation with ${person.name}.`);
    }
  }

  // ---- Step 1: calendar and times ----

  async function loadMonth() {
    const m = state.month;
    const from = new Date(Math.max(Date.now(), new Date(m.getFullYear(), m.getMonth(), 1).getTime()));
    const to = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    $("[data-month-label]").textContent = m.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    $("[data-calendar]").setAttribute("aria-busy", "true");

    state.slotsByDay = new Map();
    if (to > from) {
      const q = new URLSearchParams({
        serviceId: CONSULTATION_SERVICE_ID,
        staffId: state.staff.id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const data = await api(`/availability?${q}`);
      state.timezone = data.timezone || state.timezone;
      for (const s of data.slots) {
        const k = dayKey(s.start);
        if (!state.slotsByDay.has(k)) state.slotsByDay.set(k, []);
        state.slotsByDay.get(k).push(s);
      }
    }
    renderCalendar();
    $("[data-calendar]").removeAttribute("aria-busy");

    // Open on the first free day, so the times show without an extra click.
    const first = [...state.slotsByDay.keys()].sort()[0];
    selectDay(state.day && state.slotsByDay.has(state.day) ? state.day : first || null);
  }

  function renderCalendar() {
    const m = state.month;
    const grid = $("[data-calendar]");
    const most = Math.max(1, ...[...state.slotsByDay.values()].map((s) => s.length));
    const cells = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => `<span class="book-dow" aria-hidden="true">${d}</span>`);

    const lead = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
    for (let i = 0; i < lead; i++) cells.push("<span></span>");

    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const slots = state.slotsByDay.get(key);
      if (!slots) {
        cells.push(`<button type="button" class="book-day" disabled>${d}</button>`);
        continue;
      }
      // The bar shows how open the day is; gold when only a few times are left.
      const fill = Math.max(18, Math.round((slots.length / most) * 100));
      cells.push(
        `<button type="button" class="book-day${slots.length <= 3 ? " is-few" : ""}" data-day="${key}" aria-pressed="false"
          aria-label="${dayLabel(key)}, ${slots.length} times free">${d}<i style="--fill:${fill}%"></i></button>`,
      );
    }
    grid.innerHTML = cells.join("");

    // Nothing to go back to before this month.
    const now = new Date();
    $('[data-month="-1"]').disabled = m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth();
  }

  function selectDay(key) {
    state.day = key;
    $$(".book-day[data-day]").forEach((b) => {
      const on = b.dataset.day === key;
      b.classList.toggle("is-selected", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const list = $("[data-slots]");
    if (!key) {
      $("[data-day-label]").textContent = "No free times this month";
      $("[data-day-count]").textContent = "Try the next month.";
      list.innerHTML = "";
      return;
    }
    const slots = state.slotsByDay.get(key) || [];
    $("[data-day-label]").textContent = dayLabel(key);
    $("[data-day-count]").textContent = `${slots.length} ${slots.length === 1 ? "time" : "times"} available`;
    list.innerHTML = slots
      .map((s, i) => `<button type="button" class="book-slot" data-slot="${i}">${timeLabel(s.start)}</button>`)
      .join("");
  }

  root.addEventListener("click", (e) => {
    const month = e.target.closest("[data-month]");
    if (month && !month.disabled) {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(month.dataset.month), 1);
      state.day = null;
      loadMonth().catch(offline);
      return;
    }

    const day = e.target.closest(".book-day[data-day]");
    if (day) return selectDay(day.dataset.day);

    const slot = e.target.closest("[data-slot]");
    if (slot) {
      state.slot = state.slotsByDay.get(state.day)[Number(slot.dataset.slot)];
      state.idemKey = null;
      $("[data-chosen-time]").textContent = longLabel(state.slot.start);
      renderPlans();
      return show("plan");
    }

    const go = e.target.closest("[data-go]");
    if (go) return show(go.dataset.go);

    const tab = e.target.closest("[data-plan]");
    if (tab) return setPlanTab(tab.dataset.plan);

    const pick = e.target.closest("[data-pick]");
    if (pick) return choosePlan(pick.dataset.pick);
  });

  // ---- Step 2: plans ----

  function setPlanTab(which) {
    $$("[data-plan]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.plan === which)));
    $$("[data-plan-panel]").forEach((p) => (p.hidden = p.dataset.planPanel !== which));
  }

  function renderPlans() {
    const price = state.staff.pricePaise;
    const single = `
      <button type="button" class="book-plan" data-pick="single">
        <span class="book-plan-name">1 session</span>
        <span class="book-plan-price">${price ? rupees(price) : "Price on request"}</span>
        <span class="book-plan-foot"><small>Duration</small>60 minutes, one-to-one</span>
      </button>`;

    const packs = state.packages
      .map((p) => {
        // Full price for the same sessions, shown struck through when the package saves money.
        const full = price ? price * p.credits : 0;
        return `
          <button type="button" class="book-plan" data-pick="pkg:${p.id}">
            <span class="book-plan-name">${p.credits} sessions</span>
            <span class="book-plan-price">${rupees(p.pricePaise)}${full > p.pricePaise ? ` <s>${rupees(full)}</s>` : ""}</span>
            <span class="book-plan-foot"><small>Per session</small>${rupees(p.perCreditPaise)}</span>
          </button>`;
      })
      .join("");

    $("[data-plans]").innerHTML = `
      <div class="book-plan-grid" data-plan-panel="packages">${packs}</div>
      <div class="book-plan-grid" data-plan-panel="single">${single}</div>`;

    $("[data-plan-toggle]").hidden = !packs;
    setPlanTab(packs ? "packages" : "single");
  }

  function choosePlan(choice) {
    if (choice.startsWith("pkg:")) {
      // Packages are paid before they are recorded, and online payment isn't live yet: hand over to WhatsApp.
      const p = state.packages.find((x) => `pkg:${x.id}` === choice);
      const msg = `Hi Waky, I'd like the ${p.credits}-session package (${rupees(p.pricePaise)}) with ${state.staff.name}, starting ${longLabel(state.slot.start)}.`;
      window.open(typeof waLink === "function" ? waLink(msg) : `https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      return;
    }
    $("[data-summary]").textContent = `${state.staff.name} · ${longLabel(state.slot.start)} · ${state.staff.pricePaise ? rupees(state.staff.pricePaise) : ""}`;
    show("details");
  }

  // ---- Step 3: details and booking ----

  $("[data-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const err = $("[data-error]");
    const btn = form.querySelector("button[type=submit]");
    err.hidden = true;
    if (!form.reportValidity()) return;

    const f = new FormData(form);
    // Same key on a retry of this attempt, so a slow network never books twice.
    state.idemKey = state.idemKey || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

    btn.disabled = true;
    btn.textContent = "Booking…";
    try {
      const data = await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: state.idemKey,
          serviceId: CONSULTATION_SERVICE_ID,
          staffId: state.staff.id,
          start: state.slot.start,
          client: {
            name: f.get("name").trim(),
            phone: f.get("phone").trim(),
            email: f.get("email").trim() || undefined,
            whatsappOptIn: true,
          },
          notes: f.get("notes").trim() || undefined,
        }),
      });
      $("[data-done-text]").textContent = `${state.staff.name} will see you on ${longLabel(data.booking.start)}. We'll send the details on WhatsApp.`;
      $("[data-done-ref]").textContent = `Reference ${data.booking.reference}`;
      $("[data-manage]").href = data.manageUrl;
      show("done");
    } catch (ex) {
      if (ex.status === 409) {
        // Someone took the time first: fresh times, and let them pick again.
        state.idemKey = null;
        await loadMonth().catch(offline);
        show("time");
        $("[data-day-count]").textContent = "That time was just taken. Please pick another.";
      } else {
        err.textContent = ex.message;
        err.hidden = false;
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Confirm booking";
    }
  });

  // ---- Start ----

  async function start() {
    if (!person) return (location.href = "consultation.html");
    $("[data-person-name]").textContent = person.name;
    if (!CONSULTATION_SERVICE_ID) return offline();

    const [staff, packages] = await Promise.all([
      api(`/staff?service=${encodeURIComponent(CONSULTATION_SERVICE_ID)}`),
      api("/packages").catch(() => []),
    ]);
    state.staff = staff.find((s) => person.match.test(s.name));
    if (!state.staff) return offline();
    state.packages = packages.filter((p) => !p.serviceIds?.length || p.serviceIds.includes(CONSULTATION_SERVICE_ID));

    const now = new Date();
    state.month = new Date(now.getFullYear(), now.getMonth(), 1);
    await loadMonth();
  }

  start().catch(offline);
}
