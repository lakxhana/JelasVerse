import { seedMockStudents, subscribeStudents } from './jelasverse-data.js';

// Google sign-in is mocked for local development: no real Firebase Auth call
// is made. The button, status copy, and sign-out flow are the real UI/UX;
// only the network round-trip is simulated. Swap `authenticateTeacher` and
// `startTeacherSession` back to real Firebase Auth (GoogleAuthProvider /
// signInWithRedirect / onAuthStateChanged) to re-enable real sign-in.
const mockTeacherKey = 'jelasverse-teacher-mock-session';
const mockTeacher = { displayName: 'Lakxhana Selvarajah', email: 'lakxhanaselvarajah@gmail.com' };

function getMockSession() {
  try { return localStorage.getItem(mockTeacherKey) === '1'; } catch { return false; }
}
function setMockSession(signedIn) {
  try {
    if (signedIn) localStorage.setItem(mockTeacherKey, '1');
    else localStorage.removeItem(mockTeacherKey);
  } catch {}
}

const gate = document.querySelector('#authGate');
const status = document.querySelector('#authStatus');
const signInButton = document.querySelector('#signInButton');
const account = document.querySelector('#teacherAccount');
const accountName = document.querySelector('#accountName');
const accountAvatar = document.querySelector('#accountAvatar');
const signOutButton = document.querySelector('#signOutButton');
const dashboard = document.querySelector('.teacher-app');

function setStatus(message) { status.textContent = message; }

function showDashboard(user) {
  dashboard.hidden = false;
  account.hidden = false;
  accountName.textContent = user.displayName || user.email || 'Teacher';
  accountAvatar.textContent = (user.displayName || user.email || 'T').trim().slice(0, 1).toUpperCase();
  gate.hidden = true;
}

function showGate(message = 'Teacher access only.') {
  dashboard.hidden = true;
  account.hidden = true;
  gate.hidden = false;
  signInButton.disabled = false;
  setStatus(message);
}

async function authenticateTeacher() {
  signInButton.disabled = true;
  setStatus('Opening secure Google sign-in…');
  // Simulated redirect round-trip, so the button still feels like the real flow.
  await new Promise(resolve => setTimeout(resolve, 700));
  setMockSession(true);
  showDashboard(mockTeacher);
}

function startTeacherSession() {
  if (getMockSession()) showDashboard(mockTeacher);
  else showGate();
}

startTeacherSession();

signInButton.addEventListener('click', authenticateTeacher);
signOutButton.addEventListener('click', () => { setMockSession(false); showGate(); });

document.querySelectorAll('a[href="index.html"]').forEach(link => {
  link.addEventListener('click', () => { setMockSession(false); });
});

const rewardStorageKey = 'jelasverse-reward-stars';
const rewardSummary = document.querySelector('#rewardStarsSummary');
const rewardTotal = document.querySelector('#rewardStarsTotal');
const rewardCaption = document.querySelector('#rewardStarsCaption');
const rewardMessage = document.querySelector('#rewardStarsMessage');

function readRewardStars() {
  try {
    const value = Number.parseInt(localStorage.getItem(rewardStorageKey) || '0', 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function renderRewardStars() {
  const stars = readRewardStars();
  const noun = stars === 1 ? 'star' : 'stars';
  if (rewardSummary) rewardSummary.textContent = String(stars);
  if (rewardTotal) rewardTotal.textContent = String(stars);
  if (rewardCaption) rewardCaption.textContent = `Current device · ${stars} ${noun}.`;
  if (rewardMessage) rewardMessage.textContent = stars
    ? `${stars} ${noun} earned in flight and classroom quizzes.`
    : 'Earn a star in flight or a classroom quiz.';
}

renderRewardStars();
window.addEventListener('storage', event => {
  if (event.key === rewardStorageKey) renderRewardStars();
});

const progressRows = document.querySelector('#progressRows');
const studentList = document.querySelector('#studentList');
const classStars = document.querySelector('#classStars');
const classLessons = document.querySelector('#classLessons');
const classChallenges = document.querySelector('#classChallenges');

function statusBadge(value, completeLabel='Complete'){
  return value ? `<span class="status complete">${completeLabel}</span>` : '<span class="status waiting">Not started</span>';
}
function renderStudents(students){
  const rows=students.length?students:[{code:'0000',name:'Aina Rahman',stars:0,lessonComplete:false,quizComplete:false}];
  const stars=rows.reduce((total,student)=>total+(Number(student.stars)||0),0);
  if(classStars)classStars.textContent=String(stars);
  if(classLessons)classLessons.innerHTML=`${rows.filter(student=>student.lessonComplete).length}<span class="ratio-divider">/</span>${rows.length}`;
  if(classChallenges)classChallenges.innerHTML=`${rows.filter(student=>student.quizComplete).length}<span class="ratio-divider">/</span>${rows.length}`;
  if(progressRows)progressRows.innerHTML=rows.map(student=>`<div class="progress-row" role="row"><strong role="cell">${student.name||`Explorer ${student.code}`}</strong><span role="cell">${statusBadge(student.lessonComplete)}</span><span role="cell">${statusBadge(student.quizComplete)}</span><span role="cell" class="status active">★ ${Number(student.stars)||0}</span></div>`).join('');
  if(studentList)studentList.innerHTML=rows.map(student=>`<article class="student-card"><span class="student-mark">${student.code}</span><div><h3>${student.name||`Explorer ${student.code}`}</h3><p>${student.lessonComplete?'Lesson complete':'Lesson ready'} · ${student.quizComplete?'Quiz complete':'Quiz ready'}</p></div><span class="status active">★ ${Number(student.stars)||0}</span></article>`).join('');
}

void seedMockStudents().finally(()=>{ subscribeStudents(renderStudents); });

const buttons = [...document.querySelectorAll('[data-view]')];
const views = { overview: document.querySelector('#overviewView'), students: document.querySelector('#studentsView') };
buttons.forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.view;
  buttons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  Object.entries(views).forEach(([name, view]) => { view.hidden = name !== next; });
}));
