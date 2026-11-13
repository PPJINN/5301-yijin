const itemTasks = [
  { id: 'med-am', group: 'medication', name: 'Morning medication', meta: '8:00 AM · After breakfast', time: '8:00 AM', icon: '◇' },
  { id: 'med-noon', group: 'medication', name: 'Afternoon medication', meta: '1:00 PM · After lunch', time: '1:00 PM', icon: '◇' },
  { id: 'water', group: 'water', name: 'Refill water bottle', meta: 'Offer warm water', time: '3:00 PM', icon: '◯' },
  { id: 'med-pm', group: 'medication', name: 'Evening medication', meta: '8:00 PM · After dinner', time: '8:00 PM', icon: '◇' },
  { id: 'check', group: 'check', name: 'Evening check-in', meta: 'Mood and comfort', time: '8:30 PM', icon: '□' }
];

const demoTasks = [
  { id: 'wake', time: '07:30', name: 'Wake up & wash', meta: 'Give Mary a reminder', group: 'morning', icon: '☀' },
  { id: 'breakfast', time: '08:00', name: 'Breakfast', meta: 'Stay nearby while she eats', group: 'meal', icon: '♨' },
  { id: 'garden', time: '09:30', name: 'Gardening or light activity', meta: 'Stay nearby', group: 'activity', icon: '✿' },
  { id: 'lunch', time: '12:30', name: 'Lunch', meta: 'Remind Mary it’s time to eat', group: 'meal', icon: '♨' },
  { id: 'rest', time: '14:00', name: 'Afternoon rest', meta: 'Independent', group: 'rest', icon: '☾' },
  { id: 'walk', time: '17:00', name: 'Short walk', meta: 'Go outside with Mary', group: 'activity', icon: '↗' },
  { id: 'dinner', time: '18:30', name: 'Dinner', meta: 'Stay nearby while she eats', group: 'meal', icon: '♨' },
  { id: 'bed', time: '21:00', name: 'Prepare for bed', meta: 'Help Mary get ready', group: 'rest', icon: '☾' }
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

const careTeam = ['May', 'Li', 'Anna'];
const storedHandoverHistory = JSON.parse(localStorage.getItem('careReadyHandoverHistory') || '[]');
const initialCurrentCaregiver = storedHandoverHistory.length ? storedHandoverHistory[0].to : 'May';

const state = {
  completed: JSON.parse(localStorage.getItem('careReadyCompleted') || '{}'),
  notes: JSON.parse(localStorage.getItem('careReadyNotes') || '[{"type":"Routine update","text":"Ate well at lunch. Mood is good.","time":"Today 12:20 PM","author":"May"}]'),
  handoverHistory: storedHandoverHistory,
  handoverOpen: JSON.parse(localStorage.getItem('careReadyHandoverOpen') || String(storedHandoverHistory.length === 0)),
  handoverPlan: JSON.parse(localStorage.getItem('careReadyHandoverPlan') || 'null')
};

if (!state.handoverPlan) {
  state.handoverPlan = { from: initialCurrentCaregiver, to: nextCaregiver(initialCurrentCaregiver), scheduled: defaultScheduleValue() };
}
state.handoverConfirmed = !state.handoverOpen && state.handoverHistory.length > 0;

let selectedWeekDay = (new Date().getDay() + 6) % 7;

const app = document.querySelector('#app');

function save() {
  localStorage.setItem('careReadyCompleted', JSON.stringify(state.completed));
  localStorage.setItem('careReadyNotes', JSON.stringify(state.notes));
  localStorage.setItem('careReadyHandoverHistory', JSON.stringify(state.handoverHistory));
  localStorage.setItem('careReadyHandoverOpen', JSON.stringify(state.handoverOpen));
  localStorage.setItem('careReadyHandoverPlan', JSON.stringify(state.handoverPlan));
}

function currentCaregiver() {
  return state.handoverHistory.length ? state.handoverHistory[0].to : 'May';
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
      <div><small>Current caregiver</small><h1>${caregiver}</h1></div>
      <button id="duty-status" aria-label="${plan.requested ? 'Review pending handover' : 'On duty. Request handover'}">${plan.requested ? 'Awaiting takeover' : 'On duty'} ›</button>
    </header>
    <div class="duty-details">
      ${previous ? `<div class="resting-caregiver"><span>On break</span><strong>${previous}</strong></div>` : ''}
      <button data-route="plan-handover"><span>Next handover</span><strong>${state.handoverOpen ? plan.to + ' · ' + formatSchedule(plan.scheduled) : 'Plan next handover'} ›</strong></button>
      <button data-route="profile"><span>Care recipient</span><strong>Mary Tan ›</strong></button>
    </div>
    <div class="section-head"><h2>Today</h2><button data-route="week">View week</button></div>
    <ol class="focus-timeline" aria-label="Daily tasks" tabindex="0">${demoTasks.map(timelineRow).join('')}</ol>
    <div class="section-head"><h2>Handover notes</h2><button data-route="notes">View all</button></div>
    ${notesMarkup(1)}
    <div class="actions"><button class="wide-button" data-route="add-note">＋ Add update</button></div>`, 'home');
}

function profile() {
  return shell(`${topbar('Mary Tan')}
    <div class="card"><div class="avatar">M</div><h2>Mary Tan</h2><p>76 years old · Singapore · Lives with her daughter</p><p>Moderate Alzheimer’s disease · Supported by her daughter and a part-time helper</p></div>
    <div class="section-head"><h2>Daily habits</h2></div>
    <div class="info-grid">
      <div class="info-row"><span class="label">Morning</span><strong>Wakes at 7:30 AM and has breakfast at 8 AM.</strong></div>
      <div class="info-row"><span class="label">Drinks</span><strong>Prefers warm water.</strong></div>
      <div class="info-row"><span class="label">Communication</span><strong>Use short sentences and explain before helping.</strong></div>
      <div class="info-row"><span class="label">Comfort</span><strong>Enjoys old Mandarin songs, gardening and watching TV.</strong></div>
    </div>
    <div class="demo-banner">Fictional persona for prototype testing.</div>`, 'home');
}

function taskDetail(id) {
  const task = demoTasks.find(t => t.id === id) || itemTasks.find(t => t.id === id) || demoTasks[0];
  const done = state.completed[task.id];
  return shell(`${topbar(task.name)}
    ${task.group === 'medication' ? '<div class="demo-banner">Demo medication schedule only.</div>' : ''}
    <div class="card"><h2>${task.time}</h2><p>${task.meta}</p><div class="detail-line"><span>Status</span><strong>${done ? 'Completed' : 'Not completed'}</strong></div>${done ? `<div class="detail-line"><span>Recorded by</span><strong>${state.completed[task.id].by}</strong></div><div class="detail-line"><span>Recorded at</span><strong>${state.completed[task.id].time}</strong></div>` : ''}</div>
    <div class="actions">${done ? `<button class="secondary" data-undo="${task.id}">Undo completion</button>` : `<button class="primary" data-complete="${task.id}">Mark as completed</button>`}<button class="secondary" data-route="${task.group === 'medication' ? 'item-medication' : task.group === 'water' ? 'item-water' : 'care-guide'}">${itemTasks.includes(task) ? 'View related item' : 'View care guide'}</button></div>`, 'home');
}

function items() {
  return shell(`${topbar('Care items')}
    <p class="demo-banner">In the physical prototype, tapping an NFC tag opens the matching item page directly.</p>
    <div class="task-list">
      <button class="task-row" data-route="item-medication"><span class="task-icon">◇</span><span><span class="task-name">Medication</span><span class="task-meta">NFC-tagged container</span></span><span class="chevron">›</span></button>
      <button class="task-row" data-route="item-water"><span class="task-icon">◯</span><span><span class="task-name">Water bottle</span><span class="task-meta">NFC-tagged bottle</span></span><span class="chevron">›</span></button>
    </div>`, 'items');
}

function itemPage(type) {
  const med = type === 'medication';
  const related = itemTasks.filter(t => t.group === (med ? 'medication' : 'water'));
  return shell(`${topbar(med ? 'Medication' : 'Water bottle')}
    <div class="item-hero"><div class="item-symbol">${med ? '◇' : '◯'}</div><h1>${med ? 'Medication' : 'Water bottle'}</h1><p>NFC item guide</p></div>
    ${med ? '<div class="demo-banner">Demo content only. Confirm the medicine, dose and timing before using this prototype in real care.</div>' : ''}
    <div class="card"><h3>Care reminder</h3><p>${med ? 'Check the scheduled time and meal instruction. Confirm the correct container before giving any medication.' : 'Mary prefers warm water.'}</p></div>
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
  return shell(`${topbar('Care Guide')}
    <header class="guide-intro"><h2>Mary Tan</h2><p>Prefers Mandarin, home-cooked Chinese meals and warm water.</p></header>
    <section class="guide-section"><h3>Meeting Mary</h3><ul>
      <li>Introduce yourself and explain what comes next.</li>
      <li>Use short sentences. Give her time to reply.</li>
    </ul></section>
    <section class="guide-section"><h3>Everyday support</h3><dl>
      <div><dt>Meals</dt><dd>Eats independently. May need a reminder to start.</dd></div>
      <div><dt>Walking</dt><dd>Walks independently at home. Join her for her 5 pm walk outdoors.</dd></div>
      <div><dt>Medication</dt><dd>A caregiver manages her medication.</dd></div>
    </dl></section>
    <section class="guide-section"><h3>Changes to her routine</h3><p>Keep her usual meal and sleep times. Explain changes in advance.</p></section>`, 'care-guide');
}

function handover() {
  const unfinished = demoTasks.filter(t => !state.completed[t.id]);
  const latest = state.handoverHistory[0];
  const plan = state.handoverPlan;
  const teamOptions = careTeam.filter(name => name !== currentCaregiver()).map(name => `<option value="${name}" ${name === plan.to ? 'selected' : ''}>${name}</option>`).join('');
  return shell(`${topbar('Handover')}
    <div class="card ${state.handoverConfirmed ? 'handover-confirmed' : ''}"><span class="eyebrow">${state.handoverConfirmed ? 'CURRENT CAREGIVER' : 'UPCOMING HANDOVER'}</span><h2>${state.handoverConfirmed ? `${currentCaregiver()} is now responsible` : `${currentCaregiver()} → ${plan.to}`}</h2><p>${state.handoverConfirmed ? `${latest.from} handed over to ${latest.to} at ${latest.time}.` : `Expected handover: ${formatSchedule(plan.scheduled)}`}</p></div>
    ${state.handoverOpen ? `<div class="handover-planner">
      <div class="field"><label for="next-caregiver">Next caregiver</label><select id="next-caregiver">${teamOptions}</select></div>
      <div class="field"><label for="handover-time">Expected handover time</label><input id="handover-time" type="datetime-local" value="${plan.scheduled}"></div>
    </div>
    <div class="preview-card"><span class="eyebrow">PREVIEW FOR ${plan.to.toUpperCase()}</span><h3>${unfinished.length} unfinished tasks</h3><p>${state.notes.length} recent updates are ready to review before taking over.</p><strong>${formatSchedule(plan.scheduled)}</strong></div>` : ''}
    <div class="section-head"><h2>Unfinished tasks</h2></div>
    <div class="task-list">${unfinished.length ? unfinished.map(taskRow).join('') : '<p class="empty">All scheduled tasks are complete.</p>'}</div>
    <div class="section-head"><h2>Recent updates</h2><button data-route="notes">View all</button></div>${notesMarkup(2)}
    ${latest ? `<div class="section-head"><h2>Handover record</h2></div><div class="handover-record"><span class="record-mark">✓</span><div><strong>${latest.from} → ${latest.to}</strong><span>${latest.time} · Confirmed by ${latest.to}</span></div></div>` : ''}
    <div class="actions">
      ${state.handoverOpen ? `<button class="primary" id="confirm-handover">Confirm ${plan.to}'s takeover</button>` : `<button class="primary" id="start-next-handover">Plan next handover</button><button class="danger-button" id="undo-handover">Undo last takeover</button><p class="action-help">Undo returns responsibility to ${latest.from}. Task and update records stay unchanged.</p>`}
    </div>`, 'home');
}

function week() {
  const days = getWeekDays();
  const day = days[selectedWeekDay];
  const isToday = day.dateKey === localDateKey(new Date());
  const completedCount = isToday ? demoTasks.filter(task => state.completed[task.id]).length : 0;
  const caregiver = isToday ? currentCaregiver() : ['May', 'May', 'Li', 'Li', 'May', 'Li', 'May'][selectedWeekDay];
  const rows = isToday
    ? demoTasks.map(taskRow).join('')
    : demoTasks.map(task => `<div class="task-row planned">
        <span class="task-icon">${task.icon}</span>
        <span><span class="task-name">${task.name}</span><span class="task-meta">${task.meta}</span></span>
        <span class="task-time">${task.time}</span>
      </div>`).join('');

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
    <div class="task-list">${rows}</div>
    <div class="card week-note"><h3>Daily care notes</h3><p><strong>Medication:</strong> follow the stated meal timing and verify the correct container.</p><p><strong>Water:</strong> offer warm water and return the bottle within comfortable reach.</p><p><strong>Evening:</strong> record any change in mood, comfort or routine for the next caregiver.</p></div>
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

function render() {
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
    state.handoverOpen = true;
    state.handoverConfirmed = false;
    state.handoverPlan.requested = true;
    save();
    go('plan-handover');
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
  const confirm = document.querySelector('#confirm-handover');
  if (confirm && state.handoverOpen) confirm.addEventListener('click', () => {
    const nextName = document.querySelector('#next-caregiver').value;
    const scheduledValue = document.querySelector('#handover-time').value;
    const record = {
      from: currentCaregiver(),
      to: nextName,
      time: new Date().toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      scheduled: scheduledValue
    };
    state.handoverHistory.unshift(record);
    state.handoverOpen = false;
    state.handoverConfirmed = true;
    state.handoverPlan = { from: nextName, to: nextCaregiver(nextName), scheduled: defaultScheduleValue() };
    save(); go('home'); showToast(`${nextName} is on duty. ${record.from} is on break.`);
  });
  const startNextHandover = document.querySelector('#start-next-handover');
  if (startNextHandover) startNextHandover.addEventListener('click', () => {
    state.handoverOpen = true;
    state.handoverConfirmed = false;
    state.handoverPlan = { from: currentCaregiver(), to: nextCaregiver(currentCaregiver()), scheduled: defaultScheduleValue() };
    save(); render(); showToast('Next handover is ready to plan');
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
  const nextSelect = document.querySelector('#next-caregiver');
  if (nextSelect) nextSelect.addEventListener('change', () => {
    state.handoverPlan.to = nextSelect.value;
    state.handoverPlan.scheduled = document.querySelector('#handover-time').value;
    save(); render();
  });
  const handoverTime = document.querySelector('#handover-time');
  if (handoverTime) handoverTime.addEventListener('change', () => {
    state.handoverPlan.scheduled = handoverTime.value;
    save(); render();
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
