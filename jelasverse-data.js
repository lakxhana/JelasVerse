import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getFirestore, collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const firebaseConfig={projectId:'jelasverse',appId:'1:793023449954:web:acd8684cde2b617b11fa3b',storageBucket:'jelasverse.firebasestorage.app',apiKey:'AIzaSyCnPTypJtoAWWSEQDQbFeDSeBZAQ6TpA0M',authDomain:'jelasverse.firebaseapp.com',messagingSenderId:'793023449954'};
const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const studentKey='jelasverse-student-code';
const mockStudents={
  '0000':'Aina Rahman','0001':'Daniel Tan','0002':'Kavya Devi','0003':'Muhammad Adam','0004':'Sofia Lim'
};

export function cleanStudentCode(value){return String(value??'').replace(/\D/g,'').slice(0,4).padStart(4,'0')}
export function getStudentCode(){try{return cleanStudentCode(localStorage.getItem(studentKey)||'')}catch{return ''}}
export function getStudentName(code=getStudentCode()){return mockStudents[code]||`Explorer ${code}`}

export async function signInStudent(value){
  const code=cleanStudentCode(value);
  if(!/^\d{4}$/.test(code))throw new Error('Use a four-digit student code.');
  try{localStorage.setItem(studentKey,code)}catch{}
  const profile={code,name:getStudentName(code),lastSeenAt:serverTimestamp(),updatedAt:serverTimestamp()};
  try{await setDoc(doc(db,'students',code),profile,{merge:true})}catch(error){console.warn('Cloud student profile unavailable; using this device only.',error.code||error)}
  return {code,...profile};
}

export async function saveStudentProgress(progress){
  const code=getStudentCode(); if(!code)return;
  const payload={code,name:getStudentName(code),stars:Math.max(0,Number(progress.stars)||0),lessonComplete:!!progress.lessonComplete,quizComplete:!!progress.quizComplete,lastSeenAt:serverTimestamp(),updatedAt:serverTimestamp()};
  try{await setDoc(doc(db,'students',code),payload,{merge:true})}catch(error){console.warn('Cloud progress unavailable; using this device only.',error.code||error)}
  try{localStorage.setItem(`jelasverse-progress-${code}`,JSON.stringify({...payload,lastSeenAt:Date.now()}))}catch{}
}

export async function seedMockStudents(){
  const seed=[['0000','Aina Rahman',3,true,true],['0001','Daniel Tan',2,true,false],['0002','Kavya Devi',1,false,false],['0003','Muhammad Adam',4,true,true],['0004','Sofia Lim',0,false,false]];
  await Promise.all(seed.map(([code,name,stars,lessonComplete,quizComplete])=>setDoc(doc(db,'students',code),{code,name,stars,lessonComplete,quizComplete,seeded:true,updatedAt:serverTimestamp()},{merge:true}))).catch(error=>console.warn('Mock class data is unavailable.',error.code||error));
}

export function subscribeStudents(callback){
  return onSnapshot(collection(db,'students'),snapshot=>callback(snapshot.docs.map(item=>item.data()).sort((a,b)=>String(a.code).localeCompare(String(b.code)))),error=>{console.warn('Student dashboard is unavailable.',error.code||error);callback([])});
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

window.JelasVerseData={cleanStudentCode,getStudentCode,getStudentName,signInStudent,saveStudentProgress,seedMockStudents,subscribeStudents,publishController,subscribeController};
window.dispatchEvent(new Event('jelasverse-data-ready'));
