import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const firebaseConfig={projectId:'jelasverse',appId:'1:793023449954:web:acd8684cde2b617b11fa3b',storageBucket:'jelasverse.firebasestorage.app',apiKey:'AIzaSyCnPTypJtoAWWSEQDQbFeDSeBZAQ6TpA0M',authDomain:'jelasverse.firebaseapp.com',messagingSenderId:'793023449954'};
const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const studentSessionKey='jelasverse-anonymous-session-id';
const mockStudents={
  '0000':'Aina Rahman','0001':'Daniel Tan','0002':'Kavya Devi','0003':'Muhammad Adam','0004':'Sofia Lim'
};
const mockClasses={
  '0000':'Year 5 Aurora','0001':'Year 5 Aurora','0002':'Year 5 Aurora','0003':'Year 5 Horizon','0004':'Year 5 Horizon'
};
const eventStorageKey='jelasverse-learning-events-v1';
const dashboardStudentsStorageKey='jelasverse-dashboard-students-v1';
const learningEventTypes=new Set(['opened','attempted','answered','completed','paused','replayed']);

const mockLearningEvents=[
  ['evt-001','0000','2026-09-08T09:05:00.000Z','Algebraic balance','balance-basics','Q-ALG-01','opened',0,'started',null,false],
  ['evt-002','0000','2026-09-08T09:06:00.000Z','Algebraic balance','balance-basics','Q-ALG-01','attempted',1,'correct',null,false],
  ['evt-003','0000','2026-09-08T09:07:00.000Z','Algebraic balance','balance-basics','Q-ALG-01','answered',1,'correct',null,false],
  ['evt-004','0000','2026-09-08T09:07:30.000Z','Algebraic balance','balance-basics','Q-ALG-01','completed',1,'complete',null,false],
  ['evt-005','0001','2026-09-09T09:04:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','opened',0,'started',null,false],
  ['evt-006','0001','2026-09-09T09:05:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','attempted',1,'incorrect',null,false],
  ['evt-007','0001','2026-09-09T09:05:40.000Z','Algebraic balance','balance-steps','Q-ALG-03','answered',1,'shown','hint',true],
  ['evt-008','0001','2026-09-09T09:06:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','attempted',2,'incorrect',null,false],
  ['evt-009','0001','2026-09-09T09:06:30.000Z','Algebraic balance','balance-steps','Q-ALG-03','answered',2,'shown','visual cue',true],
  ['evt-010','0001','2026-09-09T09:07:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','attempted',3,'correct',null,false],
  ['evt-011','0001','2026-09-09T09:07:30.000Z','Algebraic balance','balance-steps','Q-ALG-03','completed',3,'complete',null,false],
  ['evt-012','0002','2026-09-10T09:10:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','opened',0,'started',null,false],
  ['evt-013','0002','2026-09-10T09:11:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','attempted',1,'incorrect',null,false],
  ['evt-014','0002','2026-09-10T09:11:30.000Z','Algebraic balance','inverse-operations','Q-ALG-05','answered',1,'played','audio explanation',true],
  ['evt-015','0002','2026-09-10T09:12:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','attempted',2,'incorrect',null,false],
  ['evt-016','0002','2026-09-10T09:12:30.000Z','Algebraic balance','inverse-operations','Q-ALG-05','paused',2,'paused',null,false],
  ['evt-017','0003','2026-09-11T09:02:00.000Z','Fractions','equivalent-fractions','Q-FRA-02','opened',0,'started',null,false],
  ['evt-018','0003','2026-09-11T09:03:00.000Z','Fractions','equivalent-fractions','Q-FRA-02','attempted',1,'incorrect',null,false],
  ['evt-019','0003','2026-09-11T09:03:30.000Z','Fractions','equivalent-fractions','Q-FRA-02','answered',1,'played','read-aloud',true],
  ['evt-020','0003','2026-09-11T09:04:00.000Z','Fractions','equivalent-fractions','Q-FRA-02','attempted',2,'correct',null,false],
  ['evt-021','0003','2026-09-11T09:04:30.000Z','Fractions','equivalent-fractions','Q-FRA-02','completed',2,'complete',null,false],
  ['evt-022','0003','2026-09-12T09:04:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','opened',0,'started',null,false],
  ['evt-023','0003','2026-09-12T09:05:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','attempted',1,'incorrect',null,false],
  ['evt-024','0003','2026-09-12T09:06:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','attempted',2,'incorrect',null,false],
  ['evt-025','0003','2026-09-12T09:07:00.000Z','Algebraic balance','balance-steps','Q-ALG-03','completed',2,'complete',null,false],
  ['evt-026','0004','2026-09-12T10:10:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','opened',0,'started',null,false],
  ['evt-027','0004','2026-09-12T10:11:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','attempted',1,'incorrect',null,false],
  ['evt-028','0004','2026-09-12T10:11:30.000Z','Algebraic balance','inverse-operations','Q-ALG-05','replayed',1,'played','replay',true],
  ['evt-029','0004','2026-09-12T10:12:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','attempted',2,'incorrect',null,false],
  ['evt-030','0004','2026-09-12T10:13:00.000Z','Algebraic balance','inverse-operations','Q-ALG-05','paused',2,'paused',null,false]
].map(([id,code,timestamp,topic,activity,questionId,eventType,attemptNumber,outcome,supportUsed,continuedAfterSupport])=>({
  id, learnerId:`learner-${code}`, code, className:mockClasses[code], sessionId:`session-${code}-september`, timestamp, subject:'Mathematics', topic, activity, questionId, eventType, attemptNumber, outcome, supportUsed, continuedAfterSupport
}));

export function cleanStudentCode(value){return String(value??'').replace(/\D/g,'').slice(0,4).padStart(4,'0')}
function normaliseLearnerId(value){return String(value??'').trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)}
export function getStudentCode(){
  try{return normaliseLearnerId(sessionStorage.getItem(studentSessionKey)||'')}catch{return ''}
}
export function getStudentName(code=getStudentCode()){return `Learner ${String(code).padStart(4,'0')}`}
export function getStudentClass(code=getStudentCode()){return mockClasses[code]||'Prototype class'}

async function createLearnerId(){
  try{
    const sequenceRef=doc(db,'demoConfig','learnerCodeSequence');
    return await runTransaction(db,async transaction=>{
      const snapshot=await transaction.get(sequenceRef);
      const next=Math.min(9999,Math.max(1000,Number(snapshot.data()?.nextCode)||1000));
      transaction.set(sequenceRef,{nextCode:next===9999?1000:next+1,updatedAt:serverTimestamp()},{merge:true});
      return String(next).padStart(4,'0');
    });
  }catch{
    try{return String(1000+(crypto.getRandomValues(new Uint32Array(1))[0]%9000)).padStart(4,'0');}catch{return String(1000+Math.floor(Math.random()*9000)).padStart(4,'0');}
  }
}
function resetSessionLearningData(){
  try{
    localStorage.removeItem('jelasverse-reward-stars');
    localStorage.removeItem('jelasverse-science-quiz-stars');
    localStorage.removeItem('jelasverse-science-learning-progress-v1');
    sessionStorage.removeItem('orbit-flight-points');
  }catch{}
}

// Every prototype refresh represents a new anonymous learner. The four-digit
// code is a display label, not an account or personally identifying detail.
export async function startAnonymousStudent({fresh=false}={}){
  if(fresh){
    try{sessionStorage.removeItem(studentSessionKey)}catch{}
    resetSessionLearningData();
  }
  let code=getStudentCode();
  const isNew=!code;
  if(!code){
    code=await createLearnerId();
    try{sessionStorage.setItem(studentSessionKey,code);}catch{}
    resetSessionLearningData();
  }
  const profile={code,learnerId:code,className:getStudentClass(code),anonymous:true,lastSeenAt:serverTimestamp(),updatedAt:serverTimestamp()};
  try{await setDoc(doc(db,'students',code),profile,{merge:true});}catch(error){console.warn('Cloud learner profile unavailable; using this device only.',error.code||error)}
  if(isNew)window.dispatchEvent(new CustomEvent('jelasverse-student-ready',{detail:{code}}));
  return profile;
}

function readLocalEvents(){
  try { return JSON.parse(localStorage.getItem(eventStorageKey)||'[]'); } catch { return []; }
}
function writeLocalEvents(events){
  try { localStorage.setItem(eventStorageKey,JSON.stringify(events)); } catch {}
}
function readDashboardStudents(){
  try{
    const students=JSON.parse(localStorage.getItem(dashboardStudentsStorageKey)||'[]');
    return Array.isArray(students)?students:[];
  }catch{return []}
}
function saveDashboardStudent(student){
  try{
    const students=readDashboardStudents();
    const next=[...students.filter(item=>item.code!==student.code),student]
      .sort((a,b)=>Number(b.lastSeenAt||0)-Number(a.lastSeenAt||0));
    localStorage.setItem(dashboardStudentsStorageKey,JSON.stringify(next));
    window.dispatchEvent(new Event('jelasverse-dashboard-progress-changed'));
  }catch{}
}

// This is the single event-writing boundary for learning telemetry. Call it at
// an opened, attempted, answered, completed, paused, replayed, or support-use
// moment; derived indicators intentionally remain a dashboard concern.
export async function recordLearningEvent(event={}){
  const code=normaliseLearnerId(event.code||getStudentCode());
  if(!code)return null;
  const id=event.id||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const payload={
    id, learnerId:`learner-${code}`, code, className:event.className||getStudentClass(code),
    sessionId:event.sessionId||`session-${code}-${new Date().toISOString().slice(0,10)}`,
    timestamp:event.timestamp||new Date().toISOString(), subject:event.subject||'Mathematics',
    topic:event.topic||'General learning', activity:event.activity||'unspecified-activity',
    questionId:event.questionId||'unspecified-question', eventType:learningEventTypes.has(event.eventType)?event.eventType:'opened',
    attemptNumber:Math.max(0,Number(event.attemptNumber)||0), outcome:event.outcome||'recorded',
    supportUsed:event.supportUsed||null, continuedAfterSupport:!!event.continuedAfterSupport
  };
  const localEvents=[...readLocalEvents().filter(item=>item.id!==id),payload];
  writeLocalEvents(localEvents);
  try{await setDoc(doc(db,'learningEvents',id),payload,{merge:true});}catch(error){console.warn('Learning event cloud sync unavailable; saved on this device.',error.code||error)}
  return payload;
}

export async function signInStudent(value){
  const code=normaliseLearnerId(value);
  if(!code)throw new Error('Enter the learner ID shown in the game.');
  try{sessionStorage.setItem(studentSessionKey,code)}catch{}
  const profile={code,learnerId:code,className:getStudentClass(code),anonymous:true,lastSeenAt:serverTimestamp(),updatedAt:serverTimestamp()};
  try{await setDoc(doc(db,'students',code),profile,{merge:true})}catch(error){console.warn('Cloud student profile unavailable; using this device only.',error.code||error)}
  return {code,...profile};
}

export async function saveStudentProgress(progress){
  const code=getStudentCode(); if(!code)return;
  const payload={code,learnerId:code,className:getStudentClass(code),anonymous:true,stars:Math.max(0,Number(progress.stars)||0),lessonComplete:!!progress.lessonComplete,quizComplete:!!progress.quizComplete,lastSeenAt:serverTimestamp(),updatedAt:serverTimestamp()};
  const localPayload={code,learnerId:code,className:getStudentClass(code),anonymous:true,stars:Math.max(0,Number(progress.stars)||0),lessonComplete:!!progress.lessonComplete,quizComplete:!!progress.quizComplete,lastSeenAt:Date.now(),updatedAt:Date.now()};
  try{localStorage.setItem(`jelasverse-progress-${code}`,JSON.stringify(localPayload))}catch{}
  saveDashboardStudent(localPayload);
  try{await setDoc(doc(db,'students',code),payload,{merge:true})}catch(error){console.warn('Cloud progress unavailable; using this device only.',error.code||error)}
}

export async function seedMockStudents(){
  const seed=[['0000','Aina Rahman',3,true,true],['0001','Daniel Tan',2,true,false],['0002','Kavya Devi',1,false,false],['0003','Muhammad Adam',4,true,true],['0004','Sofia Lim',0,false,false]];
  await Promise.all(seed.map(([code,name,stars,lessonComplete,quizComplete])=>setDoc(doc(db,'students',code),{code,name,stars,lessonComplete,quizComplete,seeded:true,updatedAt:serverTimestamp()},{merge:true}))).catch(error=>console.warn('Mock class data is unavailable.',error.code||error));
}

export async function seedMockLearningEvents(){
  // Keep locally recorded learning moments; mock records only make the local
  // teacher demo legible before a class has generated its own events.
  const existing=readLocalEvents();
  writeLocalEvents([...existing,...mockLearningEvents.filter(event=>!existing.some(item=>item.id===event.id))]);
}

export function subscribeStudents(callback){
  return onSnapshot(collection(db,'students'),snapshot=>callback(snapshot.docs.map(item=>item.data()).sort((a,b)=>String(a.code).localeCompare(String(b.code)))),error=>{console.warn('Student dashboard is unavailable.',error.code||error);callback([])});
}

export function subscribeLearningEvents(callback){
  const deliver=snapshot=>{
    const cloudEvents=snapshot.docs.map(item=>item.data());
    callback((cloudEvents.length?cloudEvents:readLocalEvents()).sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||''))));
  };
  return onSnapshot(collection(db,'learningEvents'),deliver,error=>{console.warn('Learning event dashboard is unavailable; showing local event data.',error.code||error);callback(readLocalEvents())});
}

export async function publishController(code,state){
  if(!code)return;
  const controls={up:!!state.up,down:!!state.down,left:!!state.left,right:!!state.right,boost:!!state.boost,action:!!state.action,pause:!!state.pause,skip:!!state.skip,home:!!state.home,back:!!state.back,settings:!!state.settings,updatedAt:serverTimestamp()};
  try{await setDoc(doc(db,'controllers',code),controls)}catch(error){console.warn('Cloud controller is unavailable.',error.code||error)}
}

export function subscribeController(code,callback){
  if(!code)return ()=>{};
  return onSnapshot(doc(db,'controllers',code),snapshot=>callback(snapshot.exists()?snapshot.data():{}),error=>console.warn('Cloud controller is unavailable.',error.code||error));
}

export {app,db,mockStudents};

window.JelasVerseData={cleanStudentCode,getStudentCode,getStudentName,getStudentClass,startAnonymousStudent,signInStudent,saveStudentProgress,recordLearningEvent,seedMockStudents,seedMockLearningEvents,subscribeStudents,subscribeLearningEvents,publishController,subscribeController};
window.dispatchEvent(new Event('jelasverse-data-ready'));
