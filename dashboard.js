// ===================== DATA =====================
const DEFAULT_PROJECTS = [
  {
    id: 'job-search',
    name: 'Job Search',
    category: 'Job Search',
    energy: 'high',
    next: 'Review job boards, filter for fit, begin one application',
    notes: '',
    open: false
  },
  {
    id: 'design-doc-1',
    name: 'Software Design Doc #1',
    category: 'Writing',
    energy: 'high',
    next: 'Read last section written, continue from there',
    notes: 'Nearly done. Two more design docs to follow.',
    open: false
  },
  {
    id: 'design-doc-2',
    name: 'Software Design Doc #2',
    category: 'Writing',
    energy: 'med',
    next: 'Outline the core problem and system approach',
    notes: '',
    open: false
  },
  {
    id: 'design-doc-3',
    name: 'Software Design Doc #3',
    category: 'Writing',
    energy: 'med',
    next: 'Not started — wait until Doc #2 is drafted',
    notes: '',
    open: false
  },
  {
    id: 'holographic',
    name: 'Holographic Framework',
    category: 'Writing',
    energy: 'high',
    next: 'Outline first voice blog episode structure',
    notes: 'Series of voice blogs with transcripts. Theoretical framework built on holographic principle.',
    open: false
  },
  {
    id: 'systems-thinking',
    name: 'Systems Thinking Writing',
    category: 'Writing',
    energy: 'med',
    next: 'Write one page describing how you archive and rotate between systems',
    notes: 'About your cognitive style: learning systems, archiving them, finding and smoothing friction.',
    open: false
  },
  {
    id: 'streaming',
    name: 'AI Coding Stream (evenings)',
    category: 'Streaming',
    energy: 'low',
    next: 'Practice one streaming session with OBS — no audience',
    notes: 'Evening activity. Audience submits app ideas, you build with AI on stream. Publish code; optionally to itch.io.',
    open: false
  }
];

function loadProjects() {
  try {
    const saved = localStorage.getItem('dashboard879383-projects');
    const list = saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const frog   = list.filter(p => !p.completed && !p.deleted && !p.disabled && p.frog);
    const recent = list.filter(p => !p.completed && !p.deleted && !p.disabled && !p.frog && p.lastSession && (Date.now() - new Date(p.lastSession).getTime()) < threeDays);
    const rest   = list.filter(p => !frog.includes(p) && !recent.includes(p));
    return [...frog, ...recent, ...rest];
  } catch { return DEFAULT_PROJECTS; }
}

function saveProjects() {
  localStorage.setItem('dashboard879383-projects', JSON.stringify(projects));
}

// ===================== COMPLETED =====================
function loadCompleted() {
  try {
    const saved = localStorage.getItem('dashboard879383-completed');
    return saved ? JSON.parse(saved) : ['Column about QA Test Plans'];
  } catch { return ['Column about QA Test Plans']; }
}

function saveCompleted() {
  localStorage.setItem('dashboard879383-completed', JSON.stringify(completed));
}

let completed = loadCompleted();

function renderCompleted() {
  const list = document.getElementById('completedList');
  list.innerHTML = '';
  if (completed.length === 0) {
    list.innerHTML = '<li class="completed-empty">Nothing yet — finish something!</li>';
    return;
  }
  completed.forEach((name, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="completed-check">🏆</span>
      <span class="completed-name">${escHtml(name)}</span>
      <button class="completed-remove" onclick="removeCompleted(${i})" title="Remove">✕</button>
    `;
    list.appendChild(li);
  });
}

function addCompleted() {
  const input = document.getElementById('completedInput');
  const name = input.value.trim();
  if (!name) return;
  completed.unshift(name);
  saveCompleted();
  renderCompleted();
  input.value = '';
}

function removeCompleted(i) {
  const name = completed[i];
  completed.splice(i, 1);
  saveCompleted();
  renderCompleted();
  showNotifUndo(`"${name}" removed from completed.`, () => {
    completed.splice(i, 0, name);
    saveCompleted();
    renderCompleted();
  });
}

document.getElementById('completedInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addCompleted();
});

let projects = loadProjects();
let activityLog = [];

// ===================== COLORS =====================
const COLOR_PALETTE = [
  '#ffd5d5', // red
  '#ffd9b8', // orange
  '#fff0b8', // yellow
  '#d4f5b8', // lime
  '#b8f5d4', // mint
  '#b8f0ff', // sky
  '#b8d4ff', // cornflower
  '#d4b8ff', // violet
  '#ffb8f0', // pink
  '#ffb8d4', // rose
  '#b8ffe8', // aqua
  '#ffe8b8', // amber
  '#e8ffb8', // chartreuse
  '#b8e8ff', // cerulean
  '#f5b8ff', // magenta
  '#b8fff5', // teal
];

function ensureColors() {
  let changed = false;
  projects.forEach(p => {
    if (!p.color) {
      p.color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      changed = true;
    }
  });
  if (changed) saveProjects();
}

function reassignColors() {
  // shuffle palette and assign in order so no two adjacent projects get same color
  const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5);
  let ci = 0;
  projects.forEach(p => {
    if (!p.completed && !p.deleted) {
      p.color = shuffled[ci % shuffled.length];
      ci++;
    }
  });
  saveProjects();
  render();
  showNotif('Colors reassigned!');
}

function getProjectColor(p) {
  if (p.linkedTo) {
    const linked = projects.find(lp => lp.id === p.linkedTo && !lp.completed && !lp.deleted);
    if (linked) return linked.color || p.color;
  }
  return p.color || '#ffffff';
}

function setLink(i, linkedId) {
  projects[i].linkedTo = linkedId || null;
  saveProjects();
  render();
}

// ===================== RENDER =====================
function render() {
  const list = document.getElementById('projectList');
  list.innerHTML = '';
  // active projects first, disabled at bottom
  const ordered = [
    ...projects.filter(p => !p.completed && !p.deleted && !p.disabled),
    ...projects.filter(p => !p.completed && !p.deleted && p.disabled)
  ];
  ordered.forEach((p, _) => {
    const i = projects.indexOf(p);
    const card = document.createElement('div');
    const cardColor = getProjectColor(p);
    card.className = 'project-card' + (p.open ? ' open' : '') + (p.disabled ? ' disabled' : '');
    card.draggable = !p.disabled;
    card.dataset.index = i;
    card.style.borderColor = cardColor === '#ffffff' ? '' : cardColor;
    card.style.backgroundColor = cardColor;

    // build link options
    const linkOptions = projects
      .filter(lp => lp.id !== p.id && !lp.completed && !lp.deleted)
      .map(lp => `<option value="${lp.id}" ${p.linkedTo === lp.id ? 'selected' : ''}>${escHtml(lp.name)}</option>`)
      .join('');

    card.innerHTML = `
      <div style="display:flex;align-items:stretch;">
        <div class="drag-handle" title="Drag to reorder">⠿</div>
        <div style="flex:1;min-width:0;">
          <div class="card-header" onclick="toggleCard(${i})">
            <span class="energy-dot energy-${p.energy}"></span>
            <span class="card-title">${p.name}&nbsp;<button class="rename-btn" onclick="event.stopPropagation(); renameProject(${i})" title="Rename project">🖊</button>&nbsp;<span class="session-count">${(p.sessions||0) > 0 ? `(${p.sessions} sessions)` : ''}</span></span>
            ${p.frog ? '<span style="font-size:0.9rem;" title="Eat the frog!">🐸</span>' : ''}
            ${!p.disabled && isRecent(p.lastSession) ? '<span style="font-size:0.9rem;" title="Worked on in last 3 days">🔥</span>' : (!p.disabled && isOverdue(p) ? '<span style="font-size:0.9rem;" title="No activity in 2+ weeks">❗</span>' : '')}
            <span class="card-tag">${p.category}</span>
            <span class="card-chevron">▶</span>
          </div>
          <div class="card-body">
            <div class="frog-row">
              <label class="frog-label" onclick="event.stopPropagation()">
                <input type="checkbox" ${p.frog ? 'checked' : ''} onchange="setFrog(${i}, this.checked)"> 🐸 Eat the frog
              </label>
              <label class="disable-label" onclick="event.stopPropagation()">
                <input type="checkbox" ${p.disabled ? 'checked' : ''} onchange="toggleDisabled(${i}, this.checked)"> 💤 Disable
              </label>
            </div>
            <div class="link-row">
              <label>Link to project</label>
              <select class="link-select" onchange="setLink(${i}, this.value)">
                <option value="" ${!p.linkedTo ? 'selected' : ''}>No link</option>
                ${linkOptions}
              </select>
            </div>
            <div class="next-action">
              <label>Next action</label>
              <input type="text" value="${escHtml(p.next)}"
                onchange="updateField(${i}, 'next', this.value)"
                placeholder="What's the very next step?">
            </div>
            <div class="notes-area">
              <label>Notes</label>
              <textarea onchange="updateField(${i}, 'notes', this.value)"
                placeholder="Context, links, reminders...">${escHtml(p.notes)}</textarea>
            </div>
            <div class="card-actions">
              <button class="start-session-btn" onclick="startSession(${i})">▶ Start 45-min session</button>
              <button class="quick-session-btn" onclick="logQuickSession(${i})" title="Log a session without starting timer">++</button>
              <select class="energy-select" onchange="updateField(${i}, 'energy', this.value)">
                <option value="high" ${p.energy==='high'?'selected':''}>High energy</option>
                <option value="med"  ${p.energy==='med' ?'selected':''}>Med energy</option>
                <option value="low"  ${p.energy==='low' ?'selected':''}>Low energy</option>
              </select>
              <button class="delete-btn" onclick="deleteProject(${i})" title="Remove project">✕</button>
            </div>
            <div style="margin-top:0.5rem;">
              <button class="mark-complete-btn" onclick="markComplete(${i})">🏆 Mark Complete!</button>
            </div>
          </div>
        </div>
      </div>
    `;
    // drag events only on the handle
    const handle = card.querySelector('.drag-handle');
    handle.addEventListener('mousedown', () => { card.draggable = true; });
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragover',  onDragOver);
    card.addEventListener('drop',      onDrop);
    card.addEventListener('dragend',   onDragEnd);
    list.appendChild(card);
  });
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isRecent(ts) {
  if (!ts) return false;
  return (Date.now() - new Date(ts).getTime()) < 3 * 24 * 60 * 60 * 1000;
}

function isOverdue(p) {
  const ref = p.lastSession || p.createdAt;
  if (!ref) return false;
  return (Date.now() - new Date(ref).getTime()) >= 14 * 24 * 60 * 60 * 1000;
}

function toggleDisabled(i, disabled) {
  projects[i].disabled = disabled;
  if (disabled && projects[i].frog) {
    projects[i].frog = false; // can't be frog if disabled
  }
  saveProjects();
  render();
}

function toggleTimerControls() {
  const el = document.getElementById('timerControls');
  const btn = document.getElementById('timerExpandBtn');
  const open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  btn.textContent = open ? '▼ controls' : '▶ controls';
  btn.classList.toggle('open', open);
}

function setFrog(i, checked) {
  projects.forEach((p, j) => { if (j !== i) p.frog = false; });
  projects[i].frog = checked;
  if (checked) {
    const project = projects.splice(i, 1)[0];
    projects.unshift(project);
  }
  saveProjects();
  render();
}

// ===================== DRAG & DROP =====================
let dragSrcIndex = null;

function onDragStart(e) {
  dragSrcIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function onDrop(e) {
  e.preventDefault();
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
  const moved = projects.splice(dragSrcIndex, 1)[0];
  projects.splice(targetIndex, 0, moved);
  saveProjects();
  render();
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  dragSrcIndex = null;
}

function markComplete(i) {
  if (!confirm(`Mark "${projects[i].name}" as complete?`)) return;
  projects[i].completed = true;
  saveProjects();
  // add to completed list if not already there
  if (!completed.includes(projects[i].name)) {
    completed.unshift(projects[i].name);
    saveCompleted();
  }
  // log the completion
  activityLog.unshift({ projectName: projects[i].name, ts: new Date().toISOString(), type: 'complete' });
  if (activityLog.length > 50) activityLog.length = 50;
  saveActivityLog();
  renderActivityLog();
  render();
  renderCompleted();
  showNotif(`🏆 ${projects[i].name} marked complete!`);
}

function renameProject(i) {
  const newName = prompt('Rename project:', projects[i].name);
  if (newName && newName.trim()) {
    projects[i].name = newName.trim();
    saveProjects();
    render();
  }
}

function toggleCard(i) {
  projects[i].open = !projects[i].open;
  saveProjects();
  render();
}

function updateField(i, field, value) {
  projects[i][field] = value;
  saveProjects();
}

function deleteProject(i) {
  if (confirm(`Remove "${projects[i].name}"?`)) {
    const removed = projects[i];
    projects[i].deleted = true;
    saveProjects();
    render();
    showNotifUndo(`"${removed.name}" removed.`, () => {
      removed.deleted = false;
      saveProjects();
      render();
    });
  }
}

// ===================== MODAL =====================
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('newName').focus();
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
function saveProject() {
  const name = document.getElementById('newName').value.trim();
  if (!name) return;
  projects.push({
    id: 'p' + Date.now(),
    name,
    category: document.getElementById('newCategory').value,
    energy: document.getElementById('newEnergy').value,
    next: document.getElementById('newNext').value.trim(),
    notes: '',
    open: false,
    createdAt: new Date().toISOString(),
    color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
  });
  saveProjects();
  render();
  closeModal();
  document.getElementById('newName').value = '';
  document.getElementById('newNext').value = '';
}

// ===================== TIMER =====================
let timerTotal = 45 * 60;
let timerRemaining = 45 * 60;
let timerRunning = false;
let timerInterval = null;
let timerProjectName = null;

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function updateTimerDisplay() {
  document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
  const pct = timerTotal > 0 ? (timerRemaining / timerTotal) * 100 : 100;
  document.getElementById('progressBar').style.width = pct + '%';
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('startStopBtn').textContent = 'Resume';
    document.getElementById('startStopBtn').classList.remove('active');
  } else {
    if (timerRemaining <= 0) resetTimer();
    timerRunning = true;
    document.getElementById('startStopBtn').textContent = 'Pause';
    document.getElementById('startStopBtn').classList.add('active');
    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('startStopBtn').textContent = 'Start';
        document.getElementById('startStopBtn').classList.remove('active');
        document.getElementById('timerLabel').textContent = '✓ Session complete!';
        showNotif(timerProjectName ? `Session done: ${timerProjectName}` : 'Session complete!');
        try { new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA==').play(); } catch(e) {}
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = timerTotal;
  timerProjectName = null;
  document.getElementById('startStopBtn').textContent = 'Start';
  document.getElementById('startStopBtn').classList.remove('active');
  document.getElementById('timerLabel').textContent = 'Ready';
  updateTimerDisplay();
}

function setPreset(minutes, btn) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  timerTotal = minutes * 60;
  timerRemaining = timerTotal;
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('startStopBtn').textContent = 'Start';
  document.getElementById('startStopBtn').classList.remove('active');
  document.getElementById('timerLabel').textContent = 'Ready';
  updateTimerDisplay();
}

function addTime(minutes) {
  timerRemaining = Math.min(timerRemaining + minutes * 60, 180 * 60);
  timerTotal = Math.max(timerTotal, timerRemaining);
  updateTimerDisplay();
}

function startSession(i) {
  timerProjectName = projects[i].name;
  timerRemaining = timerTotal;
  document.getElementById('timerLabel').textContent = projects[i].name;
  if (!timerRunning) toggleTimer();
  logSession(i);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showNotif(`Starting session: ${projects[i].name}`);
}

function logQuickSession(i) {
  logSession(i);
  showNotif(`Session logged: ${projects[i].name}`);
}

function logSession(i) {
  if (!projects[i].sessions) projects[i].sessions = 0;
  projects[i].sessions++;
  projects[i].lastSession = new Date().toISOString();

  // bubble to top, but keep frog pinned at position 0
  const project = projects.splice(i, 1)[0];
  const hasFrog = projects.findIndex(p => p.frog && !p.completed && !p.deleted);
  const insertAt = (!project.frog && hasFrog !== -1) ? 1 : 0;
  projects.splice(insertAt, 0, project);
  saveProjects();
  render();

  const entry = {
    projectName: project.name,
    ts: new Date().toISOString()
  };
  activityLog.unshift(entry);
  if (activityLog.length > 50) activityLog.length = 50;
  saveActivityLog();
  renderActivityLog();
}

// ===================== ACTIVITY LOG =====================
function loadActivityLog() {
  try {
    const saved = localStorage.getItem('dashboard879383-activity');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveActivityLog() {
  localStorage.setItem('dashboard879383-activity', JSON.stringify(activityLog));
}

function renderActivityLog() {
  const el = document.getElementById('activityLog');
  if (!activityLog.length) {
    el.innerHTML = '<span style="color:#3e3a36;font-style:italic;">No sessions yet</span>';
    renderActivityChart();
    return;
  }
  el.innerHTML = activityLog.slice(0, 50).map(e =>
    e.type === 'complete'
      ? `<div class="activity-entry">- <span class="proj-name">${escHtml(e.projectName)}</span> completed!</div>`
      : `<div class="activity-entry">- <span class="proj-name">${escHtml(e.projectName)}</span> session done</div>`
  ).join('');
  renderActivityChart();
}

function renderActivityChart() {
  const canvas = document.getElementById('activityChart');
  const emptyEl = document.getElementById('chartEmpty');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Count entries per project for the past 14 days, split by recency
  const now = Date.now();
  const sevenDays  = 7  * 24 * 60 * 60 * 1000;
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  const counts = {};
  activityLog.forEach(e => {
    const age = now - new Date(e.ts).getTime();
    if (age < fourteenDays) {
      if (!counts[e.projectName]) counts[e.projectName] = { recent: 0, older: 0 };
      if (age < sevenDays) counts[e.projectName].recent++;
      else                 counts[e.projectName].older++;
    }
  });

  const bars = Object.entries(counts)
    .map(([name, c]) => [name, c.recent, c.older])
    .sort((a, b) => (b[1] + b[2]) - (a[1] + a[2]));

  if (bars.length === 0) {
    canvas.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  const maxCount = bars[0][1] + bars[0][2];
  // Round y-axis ceiling up to next even number
  const yMax = maxCount % 2 === 0 ? maxCount : maxCount + 1;

  const fontSize = 11;
  const charH = 13;  // vertical pitch per @ in a bar
  const padL = 28;   // left margin for y-axis labels
  const padR = 8;
  const padT = 8;
  const padB = 20;   // bottom margin for x-axis labels

  const W = canvas.offsetWidth || 272;
  const H = yMax * charH + padT + padB;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // Y-axis: even-numbered grid lines and labels
  for (let val = 0; val <= yMax; val += 2) {
    const yPx = H - padB - val * charH;
    ctx.font = `10px 'DM Mono', monospace`;
    ctx.fillStyle = '#6b6560';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(val), padL - 4, yPx);
    ctx.beginPath();
    ctx.strokeStyle = val === 0 ? '#c4bfb8' : '#ddd8ce';
    ctx.lineWidth = val === 0 ? 1 : 0.5;
    ctx.moveTo(padL, yPx);
    ctx.lineTo(W - padR, yPx);
    ctx.stroke();
  }

  // Y-axis vertical line
  ctx.beginPath();
  ctx.strokeStyle = '#c4bfb8';
  ctx.lineWidth = 1;
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, H - padB);
  ctx.stroke();

  // Bars
  const slotW = Math.min((W - padL - padR) / bars.length, 28);
  bars.forEach(([name, recent, older], i) => {
    const cx = padL + i * slotW + slotW / 2;
    ctx.font = `${fontSize}px 'DM Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Older entries (8-14 days): grey, drawn from baseline
    ctx.fillStyle = '#a09a94';
    for (let j = 0; j < older; j++) {
      ctx.fillText('@', cx, H - padB - 3 - j * charH);
    }

    // Recent entries (last 7 days): accent, stacked on top
    ctx.fillStyle = '#c85c2d';
    for (let j = 0; j < recent; j++) {
      ctx.fillText('@', cx, H - padB - 3 - (older + j) * charH);
    }

    // X-axis label: first letter of project name
    ctx.font = `10px 'DM Mono', monospace`;
    ctx.fillStyle = '#6b6560';
    ctx.textBaseline = 'top';
    ctx.fillText(name[0].toUpperCase(), cx, H - padB + 4);
  });
}

// ===================== UTILS =====================
function showNotif(msg) {
  const el = document.getElementById('notif');
  el.innerHTML = escHtml(msg);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

let undoTimer = null;
function showNotifUndo(msg, undoFn) {
  const el = document.getElementById('notif');
  el.innerHTML = `${escHtml(msg)} <button onclick="doUndo()" style="margin-left:0.6rem;background:transparent;border:1px solid #a09a94;color:#f5f0e8;font-family:'DM Mono',monospace;font-size:0.72rem;padding:0.15rem 0.5rem;border-radius:2px;cursor:pointer;">Undo</button>`;
  el._undoFn = undoFn;
  el.classList.add('show');
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { el.classList.remove('show'); el._undoFn = null; }, 5000);
}

function doUndo() {
  const el = document.getElementById('notif');
  if (el._undoFn) { el._undoFn(); el._undoFn = null; }
  el.classList.remove('show');
  if (undoTimer) clearTimeout(undoTimer);
}

function exportData() {
  const data = {
    exported: new Date().toISOString(),
    projects,
    completed,
    activityLog
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showNotif('Data exported!');
}

function updateDate() {
  const d = new Date();
  document.getElementById('dateDisplay').textContent =
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Enter key in modal
document.getElementById('newName').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveProject();
});

// ===================== INIT =====================
updateDate();
updateTimerDisplay();
activityLog = loadActivityLog();
ensureColors();
render();
renderCompleted();
renderActivityLog();
