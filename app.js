const persona = {
  name: 'Mary Tan',
  age: 76,
  location: 'Singapore',
  condition: "Moderate Alzheimer’s disease",
  living: 'Lives with her daughter',
  mainCaregiver: 'Daughter',
  otherCaregiver: 'Part-time helper'
};

const itemTasks = [
  { id: 'med-am', group: 'medication', name: 'Morning medication', meta: 'Caregiver managed · After breakfast', time: '08:30', icon: '◇', support: 'Managed', guidance: 'Verify the correct medicine and current family instruction before assisting Mary.' },
  { id: 'water', group: 'water', name: 'Warm water', meta: 'Refill her familiar bottle', time: '15:00', icon: '◯', support: 'Reminder', guidance: 'Fill Mary’s familiar bottle with warm water and return it to its usual place.' },
  { id: 'med-pm', group: 'medication', name: 'Evening medication', meta: 'Caregiver managed · After dinner', time: '19:00', icon: '◇', support: 'Managed', guidance: 'Verify the correct medicine and current family instruction before assisting Mary.' }
];

const demoTasks = [
  { id: 'wake', time: '07:30', name: 'Wake up & wash', meta: 'Give Mary a reminder', group: 'morning', icon: '☀' },
  { id: 'breakfast', time: '08:00', name: 'Breakfast', meta: 'Stay nearby while she eats', group: 'meal', icon: '♨', support: 'Supervision', guidance: 'Offer a familiar Chinese home-cooked breakfast and warm water.' },
  { ...itemTasks[0] },
  { id: 'garden', time: '09:30', name: 'Gardening or light activity', meta: 'Stay nearby', group: 'activity', icon: '✿' },
  { id: 'lunch', time: '12:30', name: 'Lunch', meta: 'Remind Mary it’s time to eat', group: 'meal', icon: '♨', support: 'Reminder', guidance: 'Keep the usual mealtime and familiar meal setting.' },
  { id: 'rest', time: '14:00', name: 'Afternoon rest', meta: 'Independent', group: 'rest', icon: '☾' },
  { ...itemTasks[1] },
  { id: 'walk', time: '17:00', name: 'Short walk', meta: 'Go outside with Mary', group: 'activity', icon: '↗', support: 'Accompanied', guidance: 'Stay with Mary outdoors and use a familiar route.' },
  { id: 'dinner', time: '18:30', name: 'Dinner', meta: 'Stay nearby while she eats', group: 'meal', icon: '♨' },
  { ...itemTasks[2] },
  { id: 'bed', time: '21:00', name: 'Prepare for bed', meta: 'Help Mary get ready', group: 'rest', icon: '☾', support: 'Assistance', guidance: 'Use short sentences, explain each step and keep her familiar bedtime sequence.' }
];

function timelineRow(task) {
  return `<li class="focus-task">
    <button class="task-copy" data-task="${task.id}"><time>${task.time}</time><strong>${task.name}</strong><small>${task.meta}</small></button>
    <label class="task-check"><input type="checkbox" data-toggle="${task.id}" aria-label="Completed: ${task.name}" ${state.completed[task.id] ? 'checked' : ''}></label>
  </li>`;
}

function bindTimeline(list) {
  const rows = [...list.children];
  const now = new Date();
  const clock = now.toTimeString().slice(0, 5);
  const index = Math.max(0, demoTasks.findLastIndex(task => task.time <= clock));
  const rowHeight = rows[0].offsetHeight;
  list.scrollTop = index * rowHeight;
  const animate = window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function highlight(immediate) {
    const position = list.scrollTop / rowHeight;
    rows.forEach((row, i) => {
      const opacity = Math.max(0.25, 1 - Math.abs(position - i) * 0.75);
      if (animate && !immediate) gsap.to(row, { opacity, duration: 0.16, overwrite: true });
      else row.style.opacity = opacity;
    });
  }
  highlight(true);
  list.addEventListener('scroll', () => highlight(false), { passive: true });
  list.addEventListener('change', event => {
    const input = event.target;
    const id = input.dataset.toggle;
    if (!id) return;
    if (input.checked) state.completed[id] = { by: currentCaregiver(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    else delete state.completed[id];
    save();
    if (animate) gsap.fromTo(input, { scale: 0.82 }, { scale: 1, duration: 0.22 });
  });
}

const careTeam = ['Daughter', 'Part-time helper'];
const storagePrefix = 'careReadyMary';
const storedHandoverHistory = JSON.parse(localStorage.getItem(`${storagePrefix}HandoverHistory`) || '[]');
const initialCurrentCaregiver = storedHandoverHistory.length ? storedHandoverHistory[0].to : 'Daughter';

const state = {
  completed: JSON.parse(localStorage.getItem(`${storagePrefix}Completed`) || '{}'),
  notes: JSON.parse(localStorage.getItem(`${storagePrefix}Notes`) || '[{"type":"Routine update","text":"Mary ate well at lunch and was calm during her afternoon rest.","time":"Today 2:20 PM","author":"Daughter"}]'),
  handoverHistory: storedHandoverHistory,
  handoverOpen: JSON.parse(localStorage.getItem(`${storagePrefix}HandoverOpen`) || String(storedHandoverHistory.length === 0)),
  handoverPlan: JSON.parse(localStorage.getItem(`${storagePrefix}HandoverPlan`) || 'null')
};

if (!state.handoverPlan) {
  state.handoverPlan = { from: initialCurrentCaregiver, to: nextCaregiver(initialCurrentCaregiver), scheduled: defaultScheduleValue() };
}
state.handoverConfirmed = !state.handoverOpen && state.handoverHistory.length > 0;

let selectedWeekDay = (new Date().getDay() + 6) % 7;

const app = document.querySelector('#app');

function save() {
  localStorage.setItem(`${storagePrefix}Completed`, JSON.stringify(state.completed));
  localStorage.setItem(`${storagePrefix}Notes`, JSON.stringify(state.notes));
  localStorage.setItem(`${storagePrefix}HandoverHistory`, JSON.stringify(state.handoverHistory));
  localStorage.setItem(`${storagePrefix}HandoverOpen`, JSON.stringify(state.handoverOpen));
  localStorage.setItem(`${storagePrefix}HandoverPlan`, JSON.stringify(state.handoverPlan));
}

function currentCaregiver() {
  return state.handoverHistory.length ? state.handoverHistory[0].to : 'Daughter';
}

function nextCaregiver(name) {
  const index = careTeam.indexOf(name);
  return careTeam[(index + 1) % careTeam.length];
}

function defaultScheduleValue() {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatSchedule(value) {
  if (!value) return 'Time not set';
  const date = new Date(value);
  return date.toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function go(route) {
  location.hash = route;
}

function shell(content, active = 'home') {
  return `<section class="page">${content}</section>
    <nav class="bottom-nav" aria-label="Primary navigation">
      <button class="${active === 'home' ? 'active' : ''}" data-route="home"><span class="nav-icon">⌂</span>Home</button>
      <button class="${active === 'items' ? 'active' : ''}" data-route="items"><span class="nav-icon">▣</span>Items</button>
      <button class="${active === 'care-guide' ? 'active' : ''}" data-route="care-guide"><span class="nav-icon">▤</span>Care Guide</button>
    </nav>`;
}

function brand() {
  return `<header class="brand"><span class="brand-mark">♡</span><span>Care Ready</span></header>`;
}

function taskRow(task) {
  const done = state.completed[task.id];
  return `<button class="task-row ${done ? 'done' : ''}" data-task="${task.id}">
    <span class="task-icon">${task.icon}</span>
    <span><span class="task-name">${task.name}</span><span class="task-meta">${task.meta}</span></span>
    <span class="task-time ${done ? 'complete' : ''}">${done ? 'Completed' : task.time}</span>
  </button>`;
}

function notesMarkup(limit) {
  const notes = typeof limit === 'number' ? state.notes.slice(0, limit) : state.notes;
  if (!notes.length) return '<p class="empty">No updates yet.</p>';
  return `<div class="note-list">${notes.map(n => `<article class="note-card"><span class="eyebrow">${n.type} · ${n.author}</span><p>${escapeHtml(n.text)}</p><time>${n.time}</time></article>`).join('')}</div>`;
}

function home() {
  const caregiver = currentCaregiver();
  const previous = state.handoverHistory[0]?.from;
  const plan = state.handoverPlan;
  return shell(`<header class="duty-header">
      <div><small>${plan.ready ? 'Next caregiver' : 'On duty'}</small><h1>${plan.ready ? plan.to : caregiver}</h1></div>
      <button type="button" id="duty-status">${plan.ready ? 'Go on duty' : 'Go off duty'}</button>
    </header>
    <div class="shift-context"><button data-route="profile">Caring for Mary Tan ›</button>
      <small>${plan.ready ? caregiver + ' on duty' : previous ? previous + ' off duty' : ''}</small>
    </div>
    <div class="section-head"><h2>Today</h2><button data-route="week">View week</button></div>
    <ol class="focus-timeline" aria-label="Daily tasks" tabindex="0">${demoTasks.map(timelineRow).join('')}</ol>
    <div class="section-head"><h2>Handover notes</h2><button data-route="notes">View all</button></div>
    ${notesMarkup(1)}
    <div class="actions"><button class="wide-button" data-route="add-note">＋ Add update</button></div>`, 'home');
}

function profile() {
  return shell(`${topbar(persona.name)}
    <div class="persona-card"><div class="avatar persona-avatar">M</div><div><span class="eyebrow">CARE RECIPIENT · FICTIONAL PERSONA</span><h2>${persona.name}</h2><p>${persona.age} years old · Female · ${persona.location}</p></div></div>
    <div class="persona-facts"><span>${persona.condition}</span><span>${persona.living}</span><span>Main caregiver: ${persona.mainCaregiver}</span><span>Other caregiver: ${persona.otherCaregiver}</span></div>

    <div class="section-head"><h2>Familiar routines</h2></div>
    <div class="profile-panel"><p><strong>Comfort:</strong> Mandarin, Chinese home-cooked meals, warm water, old Mandarin songs, gardening and watching TV.</p><p><strong>Routine:</strong> Keep meal and sleep times consistent where possible.</p></div>

    <div class="section-head"><h2>Communication &amp; emotional cues</h2></div>
    <div class="profile-panel profile-panel-alt"><p>Mary can express basic needs but may struggle to find words. Speak slowly, use short sentences and allow time for her to respond.</p><p>She usually recognizes close family. Unfamiliar people or changes in routine may cause anxiety.</p></div>

    <div class="section-head"><h2>Everyday support</h2></div>
    <div class="support-map">
      <article><span>INDEPENDENT</span><p>Walking at home<br>Eating<br>Afternoon rest</p></article>
      <article><span>REMINDERS / SOME HELP</span><p>Remembering mealtimes<br>Dressing<br>Bathing</p></article>
      <article><span>ACCOMPANIED / MANAGED</span><p>Going out<br>Medication</p></article>
    </div>
    <p class="profile-note">Support is shown by activity, not as a clinical score. Independent eating may still require reminders or supervision.</p>
    <div class="demo-banner">Medication details remain placeholders until the family supplies verified instructions.</div>`, 'home');
}

function taskDetail(id) {
  const task = demoTasks.find(t => t.id === id) || itemTasks.find(t => t.id === id) || demoTasks[0];
  const done = state.completed[task.id];
  return shell(`${topbar(task.name)}
    ${task.group === 'medication' ? '<div class="demo-banner">Demo medication schedule only. Verify the medicine, dose and timing before real care use.</div>' : ''}
    <div class="card">${task.support ? `<span class="support-tag">${task.support}</span>` : ''}<h2>${task.time}</h2><p>${task.meta}</p>${task.guidance ? `<div class="task-guidance"><small>HOW TO SUPPORT MARY</small><p>${task.guidance}</p></div>` : ''}<div class="detail-line"><span>Status</span><strong>${done ? 'Completed' : 'Not completed'}</strong></div>${done ? `<div class="detail-line"><span>Recorded by</span><strong>${state.completed[task.id].by}</strong></div><div class="detail-line"><span>Recorded at</span><strong>${state.completed[task.id].time}</strong></div>` : ''}</div>
    <div class="actions">${done ? `<button class="secondary" data-undo="${task.id}">Undo completion</button>` : `<button class="primary" data-complete="${task.id}">Mark as completed</button>`}<button class="secondary" data-route="${task.group === 'medication' ? 'item-medication' : task.group === 'water' ? 'item-water' : 'care-guide'}">${task.group === 'medication' || task.group === 'water' ? 'View NFC item guide' : 'View care guide'}</button></div>`, 'home');
}

function items() {
  return shell(`${topbar('Care items')}
    <div class="item-grid">
      <button class="item-tile" data-route="item-medication"><span class="item-art" aria-hidden="true">💊</span><strong>Mary's medication</strong><small>NFC tag · Caregiver managed</small></button>
      <button class="item-tile" data-route="item-water"><span class="item-art" aria-hidden="true">💧</span><strong>Mary's water bottle</strong><small>NFC tag · Warm water</small></button>
    </div>`, 'items');
}

function itemPage(type) {
  const med = type === 'medication';
  const related = itemTasks.filter(t => t.group === (med ? 'medication' : 'water'));
  return shell(`${topbar(med ? 'Medication' : 'Water bottle')}
    <div class="item-hero"><div class="item-symbol">${med ? '◇' : '◯'}</div><h1>${med ? "Mary's medication" : "Mary's water bottle"}</h1><p>NFC item guide · ${med ? 'Managed care' : 'Daily reminder'}</p></div>
    ${med ? '<div class="demo-banner">Demo content only. Confirm the medicine, dose and timing before using this prototype in real care.</div>' : ''}
    <div class="card"><h3>Care reminder</h3><p>${med ? 'Mary cannot manage medication independently. Check the scheduled time and meal instruction, verify the correct container, and record completion.' : 'Mary prefers warm water in her familiar bottle. Refill it and return it to the usual place within comfortable reach.'}</p><p class="profile-note">${med ? 'If the label, schedule or family instruction does not match, pause and contact the daughter before continuing.' : 'Familiar objects and consistent placement can reduce searching and avoid unnecessary changes to Mary’s routine.'}</p></div>
    <div class="section-head"><h2>Related today</h2></div>
    <div class="task-list">${related.map(taskRow).join('')}</div>`, 'items');
}

function addNote() {
  return shell(`${topbar('Add handover update')}
    <form id="note-form">
      <div class="field"><label for="note-type">Update type</label><select id="note-type"><option>Unexpected change</option><option>Routine update</option><option>Unfinished task</option><option>Other information</option></select></div>
      <div class="field"><label for="note-text">What should the next caregiver know?</label><textarea id="note-text" required placeholder="What happened, what you did, and what may need follow-up"></textarea></div>
      <button class="primary" type="submit">Save update</button>
    </form>`, 'home');
}

function notes() {
  return shell(`${topbar('Handover notes')}${notesMarkup()}<div class="actions"><button class="wide-button" data-route="add-note">＋ Add update</button></div>`, 'home');
}

function careGuide() {
  const cues = [
    ['💬', 'Conversation', 'Use Mandarin, short sentences and extra response time.'],
    ['👋', 'Unfamiliar caregiver', 'Introduce yourself calmly and explain what you are going to do.'],
    ['🍚', 'Meals', 'Keep familiar meal times. Remind her to start and stay nearby.'],
    ['🚶', 'Walking', 'Independent at home. Accompany her outdoors on a familiar route.'],
    ['💊', 'Medication', 'Mary cannot manage medication independently. Verify instructions and record completion.'],
    ['🕒', 'Routine changes', 'Explain changes early. Watch for anxiety, confusion or a change in mood.']
  ];
  return shell(`${topbar('Care Guide')}
    <header class="guide-intro"><h2>Mary Tan</h2><div class="guide-preferences">
      <span><i aria-hidden="true">🥢</i> Chinese home cooking</span>
      <span><i aria-hidden="true">☕</i> Warm water</span>
    </div></header>
    <ul class="guide-cues">${cues.map(([icon, title, cue]) => `<li>
      <span class="cue-icon" aria-hidden="true">${icon}</span>
      <div><h3>${title}</h3><p>${cue}</p></div>
    </li>`).join('')}</ul>`, 'care-guide');
}

function handover() {
  const plan = state.handoverPlan;
  if (plan.ready) return home();
  const options = careTeam.filter(name => name !== currentCaregiver()).map(name =>
    `<option ${name === plan.to ? 'selected' : ''}>${name}</option>`).join('');
  return shell(`${topbar('Go off duty')}
    <form id="shift-form">
      <section id="voice-guide"></section>
      <section id="shift-review" hidden>
      <div class="field"><label for="shift-note">Review handover notes</label>
        <textarea id="shift-note" name="note" rows="5" disabled required></textarea></div>
      <div class="section-head"><h2>Next handover</h2></div>
      <div class="field"><label for="shift-next">Next caregiver</label><select id="shift-next" name="next">${options}</select></div>
      <div class="field"><label for="shift-time">Takeover time</label><input id="shift-time" name="scheduled" type="datetime-local" required value="${plan.scheduled || defaultScheduleValue()}"></div>
      <button class="primary">Save notes &amp; request takeover</button></section>
    </form>
    ${state.handoverHistory.length ? '<div class="actions"><button class="secondary" id="undo-handover">Undo last takeover</button></div>' : ''}`, 'home');

}

function week() {
  const days = getWeekDays();
  const day = days[selectedWeekDay];
  const isToday = day.dateKey === localDateKey(new Date());
  const completedCount = isToday ? demoTasks.filter(task => state.completed[task.id]).length : 0;
  const caregiver = isToday ? currentCaregiver() : ['Daughter', 'Daughter', 'Part-time helper', 'Daughter', 'Part-time helper', 'Daughter', 'Daughter'][selectedWeekDay];
  const rows = demoTasks.map(task => {
    const done = isToday && state.completed[task.id];
    const content = `<span class="task-name">${task.name}</span><span class="task-meta">${task.meta}</span>`;
    const card = isToday
      ? `<button class="week-task-card" data-task="${task.id}">${content}</button>`
      : `<div class="week-task-card">${content}</div>`;
    return `<li class="week-event${done ? ' finished' : ''}">
      <time>${task.time}</time>
      <span class="week-marker" aria-hidden="true">${done ? '✓' : task.icon}</span>
      ${done ? '<span class="week-completed">Completed</span>' : ''}${card}
    </li>`;
  }).join('');

  return shell(`${topbar('This week')}
    <div class="week-strip" aria-label="Choose a day">
      ${days.map((item, index) => `<button class="day-chip ${index === selectedWeekDay ? 'selected' : ''} ${item.dateKey === localDateKey(new Date()) ? 'today' : ''}" data-day="${index}">
        <span>${item.short}</span><strong>${item.number}</strong>
      </button>`).join('')}
    </div>
    <div class="week-summary">
      <div><span class="eyebrow">${isToday ? 'TODAY' : day.full.toUpperCase()}</span><h2>${day.full}, ${day.month} ${day.number}</h2></div>
      <span class="caregiver-badge">Caregiver: ${caregiver}</span>
    </div>
    <div class="progress-block">
      <div class="progress-copy"><span>${isToday ? `${completedCount} of ${demoTasks.length} completed` : `${demoTasks.length} tasks planned`}</span><strong>${isToday ? Math.round(completedCount / demoTasks.length * 100) : 0}%</strong></div>
      <div class="progress-track"><span style="width:${isToday ? completedCount / demoTasks.length * 100 : 0}%"></span></div>
    </div>
    <div class="section-head"><h2>Schedule</h2><span class="eyebrow">${isToday ? 'Tap a task for details' : 'Planned tasks'}</span></div>
    <ol class="week-timeline">${rows}</ol>
    <div class="card week-note"><h3>Mary's care notes</h3><p><strong>Communication:</strong> use short sentences and explain before helping.</p><p><strong>Medication:</strong> caregiver managed; verify the current family instruction and correct container.</p><p><strong>Water:</strong> offer warm water and return the familiar bottle to its usual place.</p><p><strong>Changes:</strong> record any change in mood, orientation or routine for the next caregiver.</p></div>
    <div class="demo-banner">This weekly schedule uses demonstration content. The family must replace it with verified care and medication instructions.</div>`, 'home');
}

function getWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      dateKey: localDateKey(date),
      short: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
      full: date.toLocaleDateString('en', { weekday: 'long' }),
      month: date.toLocaleDateString('en', { month: 'short' }),
      number: date.getDate()
    };
  });
}

function localDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function topbar(title) {
  return `<header class="topbar"><button class="back" aria-label="Go back" data-back>‹</button><h1 class="page-title">${title}</h1></header>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

let stopVoiceGuide;
function bindVoiceGuide(form) {
  const panel = form.querySelector('#voice-guide');
  const review = form.querySelector('#shift-review');
  const prompts = [
    ['Shift update', 'How was Mary during your shift?'],
    ['Next shift', 'What should the next caregiver follow up on?']
  ];
  const answers = ['', ''];
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let step = 0;
  let recognition;

  function stop() {
    if (recognition) {
      recognition.onresult = recognition.onend = recognition.onerror = null;
      recognition.abort();
      recognition = null;
    }
  }
  function question() {
    panel.innerHTML = `<small>Handover notes · ${step + 1} of 2</small>
      <h2>${prompts[step][1]}</h2>
      <div class="answer-composer">
        <textarea id="shift-answer" aria-label="Your answer" rows="3" placeholder="${step ? 'Add a follow-up (optional)' : 'Type your update here'}"></textarea>
        ${Recognition ? '<button type="button" data-record aria-label="Speak answer" title="Speak answer"><span aria-hidden="true" class="mic-glyph"></span></button>' : ''}
      </div>
      <small role="status"></small>
      <button type="button" class="primary" data-next>${step ? 'Review notes' : 'Next question'}</button>`;
    const input = panel.querySelector('textarea');
    const record = panel.querySelector('[data-record]');
    const next = panel.querySelector('[data-next]');
    const status = panel.querySelector('[role=status]');
    if (!Recognition) status.textContent = 'Voice input is unavailable in this browser. You can type your answer.';
    if (record) record.onclick = () => {
      if (recognition) { recognition.stop(); return; }
      const session = new Recognition();
      recognition = session;
      session.lang = 'en-SG';
      session.onresult = event => {
        input.value = [input.value.trim(), event.results[event.resultIndex][0].transcript].filter(Boolean).join(' ');
      };
      session.onerror = () => { status.textContent = 'Couldn’t transcribe. Try again or type your answer.'; };
      session.onend = () => {
        recognition = null;
        record.setAttribute('aria-label', 'Speak answer');
        record.title = 'Speak answer';
        next.disabled = false;
        if (status.textContent === 'Listening…') status.textContent = 'Check your answer before continuing.';
      };
      try {
        session.start();
        record.setAttribute('aria-label', 'Stop listening');
        record.title = 'Stop listening';
        status.textContent = 'Listening…';
        next.disabled = true;
      } catch { session.onerror(); session.onend(); }
    };
    next.onclick = () => {
      answers[step] = input.value.trim();
      if (!step && !answers[0]) { status.textContent = 'Add a spoken or typed shift update to continue.'; input.focus(); return; }
      stop();
      if (!step) {
        step++;
        question();
      } else {
        panel.hidden = true;
        review.hidden = false;
        form.elements.note.disabled = false;
        form.elements.note.value = answers.map((answer, i) => answer && prompts[i][0] + ' — ' + answer).filter(Boolean).join('\n');
        form.elements.note.focus();
      }
    };
  }
  question();
  return stop;
}

function render() {
  stopVoiceGuide?.();
  stopVoiceGuide = null;
  const route = (location.hash.slice(1) || 'home').split('?')[0];
  if (route === 'profile') app.innerHTML = profile();
  else if (route.startsWith('task-')) app.innerHTML = taskDetail(route.slice(5));
  else if (route === 'items') app.innerHTML = items();
  else if (route === 'item-medication') app.innerHTML = itemPage('medication');
  else if (route === 'item-water') app.innerHTML = itemPage('water');
  else if (route === 'add-note') app.innerHTML = addNote();
  else if (route === 'notes') app.innerHTML = notes();
  else if (route === 'care-guide' || route === 'handover') app.innerHTML = careGuide();
  else if (route === 'plan-handover') app.innerHTML = handover();
  else if (route === 'week') app.innerHTML = week();
  else app.innerHTML = home();
  bind();
  window.scrollTo(0, 0);
}

function bind() {
  const dutyStatus = app.querySelector('#duty-status');
  if (dutyStatus) dutyStatus.addEventListener('click', () => {
    const plan = state.handoverPlan;
    if (!plan.ready) return go('plan-handover');
    state.handoverHistory.unshift({ from: currentCaregiver(), to: plan.to, scheduled: plan.scheduled, time: new Date().toLocaleString('en') });
    state.handoverPlan = { from: plan.to, to: nextCaregiver(plan.to), scheduled: defaultScheduleValue() };
    state.handoverOpen = false;
    state.handoverConfirmed = true;
    save();
    render();
  });
  const shiftForm = app.querySelector('#shift-form');
  if (shiftForm) stopVoiceGuide = bindVoiceGuide(shiftForm);
  if (shiftForm) shiftForm.addEventListener('submit', event => {
    event.preventDefault();
    const fields = shiftForm.elements;
    if (fields.note.disabled) return;
    const note = fields.note.value.trim();
    if (!note) {
      fields.note.value = '';
      fields.note.reportValidity();
      return;
    }
    state.notes.unshift({ type: 'Handover', text: note, author: currentCaregiver(), time: new Date().toLocaleString('en') });
    state.handoverPlan = { from: currentCaregiver(), to: fields.next.value, scheduled: fields.scheduled.value, ready: true };
    state.handoverOpen = true;
    state.handoverConfirmed = false;
    save();
    go('home');
  });
  const timeline = app.querySelector(".focus-timeline");
  if (timeline) bindTimeline(timeline);
  document.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', () => go(el.dataset.route)));
  document.querySelectorAll('[data-task]').forEach(el => el.addEventListener('click', () => go(`task-${el.dataset.task}`)));
  document.querySelectorAll('[data-back]').forEach(el => el.addEventListener('click', () => history.length > 1 ? history.back() : go('home')));
  document.querySelectorAll('[data-complete]').forEach(el => el.addEventListener('click', () => {
    state.completed[el.dataset.complete] = { by: currentCaregiver(), time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) };
    save(); render(); showToast('Completion recorded');
  }));
  document.querySelectorAll('[data-undo]').forEach(el => el.addEventListener('click', () => { delete state.completed[el.dataset.undo]; save(); render(); }));
  const form = document.querySelector('#note-form');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    const text = document.querySelector('#note-text').value.trim();
    if (!text) return;
    state.notes.unshift({ type: document.querySelector('#note-type').value, text, author: currentCaregiver(), time: 'Just now' });
    save(); go('notes'); setTimeout(() => showToast('Update saved'), 40);
  });
  const undoHandover = document.querySelector('#undo-handover');
  if (undoHandover) undoHandover.addEventListener('click', () => {
    const undone = state.handoverHistory.shift();
    state.handoverOpen = true;
    state.handoverConfirmed = false;
    state.handoverPlan = { from: currentCaregiver(), to: undone.to, scheduled: undone.scheduled || defaultScheduleValue() };
    const restoredName = currentCaregiver();
    save(); render(); showToast(`Takeover undone. ${restoredName} is responsible again`);
  });
  document.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => {
    selectedWeekDay = Number(el.dataset.day);
    render();
  }));
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1600);
}

window.addEventListener('hashchange', render);
render();
