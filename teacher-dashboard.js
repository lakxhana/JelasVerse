import { browserLocalPersistence, GoogleAuthProvider, getAuth, getRedirectResult, onAuthStateChanged, setPersistence, signInWithRedirect, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { app, seedMockStudents, subscribeStudents } from './jelasverse-data.js';

// The first teacher is the Firebase project owner. Add future authorised
// teacher accounts here only after their access is provisioned in Firebase.
const authorisedTeacherEmails = new Set(['lakxhanaselvarajah@gmail.com']);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const gate = document.querySelector('#authGate');
const status = document.querySelector('#authStatus');
const signInButton = document.querySelector('#signInButton');
const account = document.querySelector('#teacherAccount');
const accountName = document.querySelector('#accountName');
const accountAvatar = document.querySelector('#accountAvatar');
const signOutButton = document.querySelector('#signOutButton');
const dashboard = document.querySelector('.teacher-app');

function setStatus(message) { status.textContent = message; }

function friendlyAuthMessage(error) {
  switch (error?.code) {
    case 'auth/unauthorized-domain':
      return 'This game address is not authorised for Google sign-in yet.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this project yet.';
    case 'auth/network-request-failed':
      return 'Check the internet connection, then try again.';
    case 'auth/account-exists-with-different-credential':
      return 'Use the Google account already linked to teacher access.';
    case 'auth/redirect-cancelled-by-user':
      return 'Sign-in was cancelled before it finished.';
    default:
      return 'Sign-in could not be completed. Please try again.';
  }
}

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
  try {
    // Redirect avoids Safari and in-app browser pop-up cancellation.
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.warn('Teacher sign-in failed.', error.code);
    signInButton.disabled = false;
    setStatus(friendlyAuthMessage(error));
  }
}

async function resolveTeacher(user) {
  if (!user) return showGate();
  const email = (user.email || '').toLowerCase();
  if (!authorisedTeacherEmails.has(email)) {
    await signOut(auth);
    return showGate('This Google account is not authorised for teacher access.');
  }
  showDashboard(user);
}

async function startTeacherSession() {
  try {
    // Set persistence before Firebase restores the active account. This keeps
    // a valid teacher session visible after a dashboard refresh.
    await setPersistence(auth, browserLocalPersistence);
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) await resolveTeacher(redirectResult.user);
    onAuthStateChanged(auth, resolveTeacher);
  } catch (error) {
    console.warn('Teacher session persistence could not be prepared.', error.code);
    showGate('Teacher session could not be restored. Please sign in again.');
  }
}

void startTeacherSession();

signInButton.addEventListener('click', authenticateTeacher);
signOutButton.addEventListener('click', () => signOut(auth));

document.querySelectorAll('a[href="index.html"]').forEach(link => {
  link.addEventListener('click', async event => {
    event.preventDefault();
    try {
      await signOut(auth);
    } finally {
      window.location.assign('index.html');
    }
  });
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

function status(value, completeLabel='Complete'){
  return value ? `<span class="status complete">${completeLabel}</span>` : '<span class="status waiting">Not started</span>';
}
function renderStudents(students){
  const rows=students.length?students:[{code:'0000',name:'Aina Rahman',stars:0,lessonComplete:false,quizComplete:false}];
  const stars=rows.reduce((total,student)=>total+(Number(student.stars)||0),0);
  if(classStars)classStars.textContent=String(stars);
  if(classLessons)classLessons.textContent=`${rows.filter(student=>student.lessonComplete).length} / ${rows.length}`;
  if(classChallenges)classChallenges.textContent=`${rows.filter(student=>student.quizComplete).length} / ${rows.length}`;
  if(progressRows)progressRows.innerHTML=rows.map(student=>`<div class="progress-row" role="row"><strong role="cell">${student.name||`Explorer ${student.code}`}</strong><span role="cell">${status(student.lessonComplete)}</span><span role="cell">${status(student.quizComplete)}</span><span role="cell" class="status active">★ ${Number(student.stars)||0}</span></div>`).join('');
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
