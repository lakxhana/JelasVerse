// The dashboard starts in prototype mode and reads the game’s local progress
// record, so a network or Firebase outage cannot block the teacher view.
const prototypeTeacher = { displayName: 'Teacher', email: '' };
const questionLabels = {
  'Q-ALG-01': 'Balance both sides: x + 3 = 8',
  'Q-ALG-03': 'Balance both sides: 3 + x = 11',
  'Q-ALG-05': 'Inverse operations: 4x = 20',
  'Q-FRA-02': 'Match equivalent fractions'
};
const $ = selector => document.querySelector(selector);
const gate = $('#authGate');
const status = $('#authStatus');
const signInButton = $('#signInButton');
const account = $('#teacherAccount');
const accountName = $('#accountName');
const accountAvatar = $('#accountAvatar');
const signOutButton = $('#signOutButton');
const dashboard = $('.teacher-app');
const dashboardTitle = $('#dashboard-title');
const todayLabel = $('#todayLabel');
const progressRows = $('#progressRows');
const studentList = $('#studentList');
const filters = { className: $('#classFilter'), topic: $('#topicFilter'), time: $('#timeFilter'), support: $('#supportFilter') };
const drawer = $('#learnerDrawer');
const state = { students: [], events: [] };

function setStatus(message) { status.textContent = message; }
function showDashboard(user) {
  dashboard.hidden = false;
  account.hidden = false;
  accountName.textContent = user.displayName || user.email || 'Teacher';
  accountAvatar.textContent = (user.displayName || user.email || 'T').trim().slice(0, 1).toUpperCase();
  const firstName = (user.displayName || 'Teacher').trim().split(/\s+/)[0];
  dashboardTitle.textContent = `Good morning, ${firstName} ✦`;
  todayLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();
  gate.hidden = true;
}
function showGate(message = 'Prototype mode is ready. No sign-in is required.') {
  dashboard.hidden = true;
  account.hidden = true;
  gate.hidden = false;
  signInButton.disabled = false;
  setStatus(message);
}
function authenticateTeacher() {
  showDashboard(prototypeTeacher);
}
function startTeacherSession() { showGate(); }

function storedPrototypeEvents() {
  try {
    const events = JSON.parse(localStorage.getItem('jelasverse-learning-events-v1') || '[]');
    return Array.isArray(events) ? events.filter(event => /^\d{4}$/.test(String(event.code || ''))) : [];
  } catch {
    return [];
  }
}
function storedPrototypeStudents() {
  try {
    const students = JSON.parse(localStorage.getItem('jelasverse-dashboard-students-v1') || '[]');
    return Array.isArray(students) ? students.filter(student => /^\d{4}$/.test(String(student.code || ''))) : [];
  } catch {
    return [];
  }
}
function showPrototypeData() {
  const storedEvents = storedPrototypeEvents();
  const storedStudents = storedPrototypeStudents();
  state.events = storedEvents;
  state.students = storedStudents.length ? storedStudents : [...new Map(storedEvents.map(event => [learnerKey(event), {
    code: learnerKey(event), learnerId: event.learnerId, name: `Learner ${learnerKey(event)}`,
    className: event.className, stars: 0, lessonComplete: false, quizComplete: false
  }])).values()];
  refreshFilterOptions();
  renderDashboard();
}

function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
function eventTime(event) {
  if (typeof event.timestamp === 'number') return event.timestamp;
  if (typeof event.timestamp === 'string') return new Date(event.timestamp).getTime() || 0;
  if (event.timestamp?.toDate) return event.timestamp.toDate().getTime();
  return 0;
}
function shortDate(event) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(eventTime(event))); }
function fullTime(event) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(eventTime(event))); }
function questionName(id) { return questionLabels[id] || id || 'Learning question'; }
function displayName(student) { return String(learnerKey(student) || '—').padStart(4, '0'); }
function learnerKey(item) { return item.code || item.learnerId?.replace('learner-', '') || ''; }
function statuses(value, completeLabel = 'Complete') { return value ? `<span class="status complete">${completeLabel}</span>` : '<span class="status waiting">Not started</span>'; }

function refreshFilterOptions() {
  const setOptions = (select, values, label) => {
    const selected = select.value || 'all';
    select.innerHTML = `<option value="all">${label}</option>${values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`;
    select.value = values.includes(selected) ? selected : 'all';
  };
  setOptions(filters.className, [...new Set([...state.students.map(student => student.className), ...state.events.map(event => event.className)].filter(Boolean))].sort(), 'All classes');
  setOptions(filters.topic, [...new Set(state.events.map(event => event.topic).filter(Boolean))].sort(), 'All topics');
}

function filteredEvents() {
  const { className, topic, time, support } = filters;
  const days = time.value === 'all' ? null : Number(time.value);
  const floor = days ? Date.now() - days * 86400000 : 0;
  return state.events.filter(event =>
    (!className.value || className.value === 'all' || event.className === className.value) &&
    (!topic.value || topic.value === 'all' || event.topic === topic.value) &&
    (!floor || eventTime(event) >= floor) &&
    (support.value === 'all' || (support.value === 'used' && event.supportUsed) || (support.value === 'continued' && event.continuedAfterSupport))
  );
}

function analyzeLearner(student, events) {
  const attempts = events.filter(event => event.eventType === 'attempted');
  const grouped = new Map();
  attempts.forEach(event => {
    const key = event.activity || 'unspecified-activity';
    grouped.set(key, [...(grouped.get(key) || []), event]);
  });
  const repeatedGroups = [...grouped.values()].filter(group => group.length >= 2);
  const stalledGroups = repeatedGroups.filter(group => {
    const lastAttempt = Math.max(...group.map(eventTime));
    return !events.some(event => event.activity === group[0].activity && event.eventType === 'completed' && eventTime(event) > lastAttempt);
  });
  const supports = events.filter(event => event.supportUsed);
  const supportsUsed = [...new Set(supports.map(event => event.supportUsed))];
  const latest = [...events].sort((a, b) => eventTime(b) - eventTime(a))[0];
  const featured = [...stalledGroups, ...repeatedGroups][0]?.[0];
  const complete = events.some(event => event.eventType === 'completed');
  let evidence = 'No learning attempts are recorded in this selection.';
  let pill = 'No recent activity';
  let pillClass = 'waiting';
  let rank = 0;
  if (stalledGroups.length) {
    const group = stalledGroups[0];
    evidence = `Repeated ${questionName(group[0].questionId)} ${group.length} times with no later completion.`;
    pill = 'Check-in suggested';
    pillClass = 'checkin';
    rank = 30 + group.length;
  } else if (repeatedGroups.length) {
    const group = repeatedGroups[0];
    evidence = `Retried ${questionName(group[0].questionId)} ${group.length} times${complete ? ' before completing' : ''}.`;
    pill = 'Pattern to review';
    pillClass = 'review';
    rank = 20 + group.length;
  } else if (supports.some(event => event.continuedAfterSupport)) {
    evidence = `Continued after using ${supportsUsed.join(', ')}.`;
    pill = 'Persistence shown';
    pillClass = 'persistence';
    rank = 10;
  } else if (complete) {
    evidence = 'Completed the selected learning activity.';
    pill = 'Completed';
    pillClass = 'complete';
    rank = 5;
  } else if (student.quizComplete) {
    evidence = 'Completed the Science Lab lesson and quiz.';
    pill = 'Quiz complete';
    pillClass = 'complete';
    rank = 5;
  } else if (student.lessonComplete) {
    evidence = 'Completed the Science Lab lesson and is ready for the quiz.';
    pill = 'Quiz ready';
    pillClass = 'review';
    rank = 4;
  } else if (Number(student.stars) > 0) {
    evidence = `Earned ${Number(student.stars)} reward star${Number(student.stars) === 1 ? '' : 's'} in the game.`;
    pill = 'In progress';
    pillClass = 'persistence';
    rank = 3;
  }
  return { student, events, attempts, repeatedGroups, stalledGroups, supportsUsed, supports, latest, featured, evidence, pill, pillClass, rank };
}

function learnerSummaries(events) {
  const selectedClass = filters.className.value;
  const selectedDays = filters.time.value === 'all' ? null : Number(filters.time.value);
  const floor = selectedDays ? Date.now() - selectedDays * 86400000 : 0;
  const visibleStudents = state.students.filter(student =>
    (selectedClass === 'all' || !selectedClass || student.className === selectedClass) &&
    (!floor || !student.lastSeenAt || eventTime({ timestamp: student.lastSeenAt }) >= floor)
  );
  const byCode = new Map(visibleStudents.map(student => [learnerKey(student), student]));
  events.forEach(event => {
    const code = learnerKey(event);
    if (!byCode.has(code)) byCode.set(code, { code, learnerId: event.learnerId, name: `Learner ${code}`, className: event.className });
  });
  return [...byCode.values()].map(student => analyzeLearner(student, events.filter(event => learnerKey(event) === learnerKey(student))))
    .sort((a, b) => b.rank - a.rank || displayName(a.student).localeCompare(displayName(b.student)));
}

function barriers(events) {
  const byQuestion = new Map();
  events.filter(event => event.eventType === 'attempted').forEach(event => byQuestion.set(event.questionId, [...(byQuestion.get(event.questionId) || []), event]));
  return [...byQuestion.entries()].map(([questionId, questionAttempts]) => {
    const perLearner = new Map();
    questionAttempts.forEach(event => { const key = learnerKey(event); perLearner.set(key, [...(perLearner.get(key) || []), event]); });
    const repeated = [...perLearner.values()].filter(group => group.length >= 2);
    return { questionId, learners: perLearner.size, repeatedLearners: repeated.length, repeatRate: perLearner.size ? Math.round(repeated.length / perLearner.size * 100) : 0 };
  }).filter(item => item.repeatedLearners).sort((a, b) => b.repeatRate - a.repeatRate || b.repeatedLearners - a.repeatedLearners);
}

function renderMetrics(events, summaries) {
  $('#activeLearnerTotal').textContent = String(summaries.filter(summary => summary.events.length || summary.student.lastSeenAt).length);
  $('#attemptTotal').textContent = String(events.filter(event => event.eventType === 'attempted').length);
  $('#quizCompleteTotal').textContent = String(summaries.filter(summary => summary.student.quizComplete).length);
  $('#rewardTotal').textContent = String(summaries.reduce((total, summary) => total + Math.max(0, Number(summary.student.stars) || 0), 0));
  $('#supportTypesTotal').textContent = String(new Set(events.map(event => event.supportUsed).filter(Boolean)).size);
}
function renderBarriers(events) {
  const items = barriers(events);
  $('#barriersList').innerHTML = items.length ? items.slice(0, 3).map((item, index) => `<article class="barrier-item"><span class="barrier-rank">${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(questionName(item.questionId))}</h3><p>${item.learners} learner${item.learners === 1 ? '' : 's'} attempted it · ${item.repeatedLearners} returned to it.</p></div><strong>${item.repeatRate}%<small>repeat rate</small></strong></article>`).join('') : '<p class="quiet-empty">No repeated-question pattern in this selection yet.</p>';
}
function initials(student) {
  return displayName(student).slice(-2);
}
function renderCheckIns(summaries) {
  const checkIns = summaries.filter(summary => summary.stalledGroups.length || summary.repeatedGroups.length).slice(0, 5);
  $('#checkInList').innerHTML = checkIns.length ? checkIns.map(summary => {
    const student = summary.student;
    const repeats = summary.stalledGroups[0]?.length || summary.repeatedGroups[0]?.length || 0;
    const topic = summary.featured ? questionName(summary.featured.questionId) : 'Recent activity';
    const supportTags = summary.supportsUsed.slice(0, 2).map(support => `<span>${escapeHtml(support)}</span>`).join('');
    return `<button class="checkin-item learner-button" type="button" data-learner="${escapeHtml(learnerKey(student))}"><span class="learner-initials">${escapeHtml(initials(student))}</span><span class="checkin-copy"><span><strong>${escapeHtml(displayName(student))}</strong><em class="status ${summary.pillClass}">${escapeHtml(summary.pill)}</em></span><b>Focus: ${escapeHtml(topic)}</b><small>${escapeHtml(summary.evidence)}</small></span><span class="checkin-meta"><b>${repeats}× <small>repeated</small></b><span class="support-tags">${supportTags}</span></span><span class="checkin-arrow" aria-hidden="true">→</span></button>`;
  }).join('') : '<div class="calm-empty"><span aria-hidden="true">✓</span><p>No repeat pattern needs a check-in in this selection.</p></div>';
}
function renderSupportUsage(events) {
  const groups = new Map();
  events.filter(event => event.supportUsed).forEach(event => groups.set(event.supportUsed, [...(groups.get(event.supportUsed) || []), event]));
  $('#supportUsage').innerHTML = groups.size ? [...groups.entries()].sort((a, b) => b[1].length - a[1].length).map(([support, uses]) => {
    const continued = uses.filter(event => event.continuedAfterSupport).length;
    return `<div class="support-item"><span>${escapeHtml(support)}</span><strong>${uses.length} use${uses.length === 1 ? '' : 's'}</strong><small>${continued}/${uses.length} continued afterward</small></div>`;
  }).join('') : '<p class="quiet-empty">No support use in this selection.</p>';
}
function renderChart(events, summaries) {
  const days = new Map();
  const hasLearningEvents = events.some(event => event.eventType === 'attempted' || event.eventType === 'completed');
  const chart = hasLearningEvents
    ? { primary: 'attempts', secondary: 'completions', primaryLabel: 'Attempts', secondaryLabel: 'Completed learning moments', description: 'Attempts and completed learning moments each day.' }
    : { primary: 'stars', secondary: 'quizzes', primaryLabel: 'Reward stars', secondaryLabel: 'Quizzes complete', description: 'Reward stars and completed quizzes from the game, by day.' };
  if (hasLearningEvents) {
    events.forEach(event => {
      const key = new Date(eventTime(event)).toISOString().slice(0, 10);
      const value = days.get(key) || { attempts: 0, completions: 0 };
      if (event.eventType === 'attempted') value.attempts += 1;
      if (event.eventType === 'completed') value.completions += 1;
      days.set(key, value);
    });
  } else {
    summaries.forEach(summary => {
      const timestamp = Number(summary.student.lastSeenAt) || 0;
      if (!timestamp) return;
      const key = new Date(timestamp).toISOString().slice(0, 10);
      const value = days.get(key) || { stars: 0, quizzes: 0 };
      value.stars += Math.max(0, Number(summary.student.stars) || 0);
      value.quizzes += Number(summary.student.quizComplete);
      days.set(key, value);
    });
  }
  $('#chartPrimaryKey').textContent = chart.primaryLabel;
  $('#chartSecondaryKey').textContent = chart.secondaryLabel;
  $('#chartDescription').textContent = chart.description;
  const series = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7);
  if (!series.length) {
    $('#activityChart').innerHTML = '<p class="quiet-empty">Game progress will appear here as learners earn stars and complete quizzes.</p>';
    $('#activityChart').setAttribute('aria-label', 'No daily game progress in this selection.');
    return;
  }
  const width = 760, height = 230, padding = { top: 18, right: 18, bottom: 40, left: 38 };
  const max = Math.max(1, ...series.flatMap(([, item]) => [item[chart.primary], item[chart.secondary]]));
  const x = index => padding.left + index * ((width - padding.left - padding.right) / Math.max(1, series.length - 1));
  const y = value => height - padding.bottom - value / max * (height - padding.top - padding.bottom);
  const points = key => series.map(([, item], index) => `${x(index)},${y(item[key])}`).join(' ');
  const labels = series.map(([date], index) => `<text x="${x(index)}" y="${height - 13}" text-anchor="middle">${escapeHtml(new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T12:00:00`)))}</text>`).join('');
  const grid = [0, Math.ceil(max / 2), max].map(value => `<g><line x1="${padding.left}" x2="${width - padding.right}" y1="${y(value)}" y2="${y(value)}"/><text x="${padding.left - 10}" y="${y(value) + 4}" text-anchor="end">${value}</text></g>`).join('');
  const dots = key => series.map(([, item], index) => `<circle cx="${x(index)}" cy="${y(item[key])}" r="4" data-value="${item[key]}"><title>${item[key]} ${escapeHtml(key)}</title></circle>`).join('');
  $('#activityChart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="presentation"><g class="chart-grid">${grid}</g><polyline class="attempt-line" points="${points(chart.primary)}"/><polyline class="complete-line" points="${points(chart.secondary)}"/><g class="attempt-dots">${dots(chart.primary)}</g><g class="complete-dots">${dots(chart.secondary)}</g><g class="chart-labels">${labels}</g></svg>`;
  $('#activityChart').setAttribute('aria-label', series.map(([date, item]) => `${date}: ${item[chart.primary]} ${chart.primaryLabel.toLowerCase()} and ${item[chart.secondary]} ${chart.secondaryLabel.toLowerCase()}`).join('. '));
}
function renderActions(events, summaries) {
  const barrier = barriers(events)[0];
  const checkIn = summaries.find(summary => summary.stalledGroups.length);
  const actions = [];
  if (barrier) actions.push({ icon: '↗', time: '3 min', title: `Start with ${questionName(barrier.questionId)}`, text: 'Model one worked example, then invite a fresh attempt.' });
  if (checkIn) actions.push({ icon: '◌', time: 'Quick chat', title: `Check in with ${displayName(checkIn.student)}`, text: 'Ask one open question about what made the next step clearer or harder.' });
  if (events.some(event => event.supportUsed === 'replay')) actions.push({ icon: '↻', time: 'No prep', title: 'Offer a replay-friendly recap', text: 'Point learners to the short explanation before the next independent task.' });
  if (!actions.length && summaries.some(summary => summary.student.quizComplete)) actions.push({ icon: '★', time: 'Celebrate', title: 'Recognise completed quizzes', text: 'Use the earned stars to celebrate the learning and quiz milestone.' });
  if (!actions.length) actions.push({ icon: '→', time: 'This week', title: 'Play a lesson or quiz', text: 'Quiz completion and reward stars from the game will appear here automatically.' });
  $('#teachingActions').innerHTML = actions.slice(0, 3).map(action => `<article><span class="action-icon" aria-hidden="true">${action.icon}</span><div><h3>${escapeHtml(action.title)} <em>${escapeHtml(action.time)}</em></h3><p>${escapeHtml(action.text)}</p></div></article>`).join('');
}
function renderProgress(summaries) {
  progressRows.innerHTML = summaries.length ? summaries.map(summary => {
    const student = summary.student;
    const supports = summary.supportsUsed.length ? summary.supportsUsed.join(', ') : '—';
    const lastActive = summary.latest || (student.lastSeenAt ? { timestamp: student.lastSeenAt } : null);
    return `<button class="progress-row learner-button" type="button" data-learner="${escapeHtml(learnerKey(student))}" role="row"><span role="cell"><strong>${escapeHtml(displayName(student))}</strong><small>${escapeHtml(summary.evidence)}</small><em class="status ${summary.pillClass}">${escapeHtml(summary.pill)}</em></span><span role="cell">${statuses(student.lessonComplete)}</span><span role="cell">${statuses(student.quizComplete)}</span><span role="cell" class="status active">★ ${Math.max(0, Number(student.stars) || 0)}</span><span role="cell">${summary.repeatedGroups.length || '—'}</span><span role="cell">${lastActive ? shortDate(lastActive) : '—'}</span><span role="cell" class="support-cell">${escapeHtml(supports)}</span></button>`;
  }).join('') : '<p class="quiet-empty">No learner activity in this selection.</p>';
}
function renderStudents(summaries) {
  studentList.innerHTML = summaries.length ? summaries.map(summary => {
    const student = summary.student;
    return `<button class="student-card learner-button" type="button" data-learner="${escapeHtml(learnerKey(student))}"><span class="student-mark">${escapeHtml(student.code || '—')}</span><span><h3>${escapeHtml(displayName(student))}</h3><p>${escapeHtml(summary.evidence)}</p></span><span class="status ${summary.pillClass}">${escapeHtml(summary.pill)}</span></button>`;
  }).join('') : '<p class="quiet-empty">No students match the current filters.</p>';
}
function openDrawer(code) {
  const summary = learnerSummaries(filteredEvents()).find(item => learnerKey(item.student) === code);
  if (!summary) return;
  $('#drawerTitle').textContent = displayName(summary.student);
  $('#drawerEvidence').textContent = summary.evidence;
  $('#drawerAttempts').textContent = `${summary.attempts.length} attempt${summary.attempts.length === 1 ? '' : 's'} · ${summary.repeatedGroups.length} repeated activit${summary.repeatedGroups.length === 1 ? 'y' : 'ies'}.`;
  $('#drawerSupports').textContent = summary.supportsUsed.length ? summary.supportsUsed.join(', ') : 'No support use recorded.';
  $('#drawerTimeline').innerHTML = [...summary.events].sort((a, b) => eventTime(a) - eventTime(b)).map(event => `<li><time>${escapeHtml(fullTime(event))}</time><span><strong>${escapeHtml(event.eventType)}</strong> · ${escapeHtml(questionName(event.questionId))}${event.outcome ? ` · ${escapeHtml(event.outcome)}` : ''}${event.supportUsed ? ` · ${escapeHtml(event.supportUsed)}` : ''}</span></li>`).join('');
  drawer.hidden = false;
  $('#closeDrawer').focus();
}
function closeDrawer() { drawer.hidden = true; }
function renderDashboard() {
  const events = filteredEvents();
  const summaries = learnerSummaries(events);
  renderMetrics(events, summaries);
  renderCheckIns(summaries);
  renderBarriers(events);
  renderSupportUsage(events);
  renderChart(events, summaries);
  renderActions(events, summaries);
  renderProgress(summaries);
  renderStudents(summaries);
}

startTeacherSession();
signInButton.addEventListener('click', authenticateTeacher);
signOutButton.addEventListener('click', () => showGate());
Object.values(filters).forEach(filter => filter.addEventListener('change', renderDashboard));
document.addEventListener('click', event => {
  const learner = event.target.closest('[data-learner]');
  if (learner) openDrawer(learner.dataset.learner);
  if (event.target.closest('[data-close-drawer]')) closeDrawer();
});
$('#closeDrawer').addEventListener('click', closeDrawer);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !drawer.hidden) closeDrawer(); });

const buttons = [...document.querySelectorAll('.nav-item[data-view]')];
const views = { overview: $('#overviewView'), students: $('#studentsView') };
function showView(next) {
  buttons.forEach(item => {
    const active = item.dataset.view === next;
    item.classList.toggle('active', active);
    active ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current');
  });
  Object.entries(views).forEach(([name, view]) => { view.hidden = name !== next; });
}
buttons.forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.view;
  showView(next);
}));
document.querySelectorAll('.quiet-action[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

showPrototypeData();
async function connectFirebaseData() {
  try {
    const { subscribeLearningEvents, subscribeStudents } = await import('./jelasverse-data.js');
    subscribeStudents(students => {
      const numberedStudents = students.filter(student => /^\d{4}$/.test(String(student.code || '')));
      if (numberedStudents.length) state.students = numberedStudents;
      refreshFilterOptions();
      renderDashboard();
    });
    subscribeLearningEvents(events => {
      const numberedEvents = events.filter(event => /^\d{4}$/.test(String(event.code || '')));
      if (numberedEvents.length) state.events = numberedEvents;
      refreshFilterOptions();
      renderDashboard();
    });
  } catch (error) {
    console.info('Firebase is unavailable; the dashboard is showing local prototype data.', error);
  }
}
void connectFirebaseData();
window.addEventListener('storage', event => {
  if (['jelasverse-dashboard-students-v1', 'jelasverse-learning-events-v1'].includes(event.key)) showPrototypeData();
});
window.addEventListener('jelasverse-dashboard-progress-changed', showPrototypeData);
