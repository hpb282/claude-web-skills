import {presetLesson,TYPES} from './lessons.js';
const KEY='mam-chu-writing-v1';
export const emptyWork=()=>({seeds:[],answerDrafts:{},paragraph:'',spoken:false,peer:{remember:'',question:''},revisionHistory:[],updatedAt:null});
export function freshState(){const lesson=presetLesson();return {version:1,lesson,works:{[lesson.id]:emptyWork()},customLessons:[],page:'home',question:0,kind:'tell',motion:matchMedia('(prefers-reduced-motion: reduce)').matches,peerTurn:0};}
export function validateLesson(value){
  if(!value||typeof value.id!=='string'||typeof value.prompt!=='string'||typeof value.title!=='string'||!Array.isArray(value.questions)||!value.questions.length||value.questions.length>20)return false;
  return value.questions.every(q=>q&&TYPES.some(t=>t.id===q.kind)&&typeof q.text==='string'&&Array.isArray(q.hints)&&q.hints.every(h=>typeof h==='string'));
}
export function validateWork(w){return !!w&&Array.isArray(w.seeds)&&w.seeds.length<=200&&w.seeds.every(s=>s&&typeof s.id==='string'&&/^[A-Za-z0-9_-]{1,100}$/u.test(s.id)&&typeof s.text==='string'&&s.text.length<=5000&&TYPES.some(t=>t.id===s.kind))&&new Set(w.seeds.map(s=>s.id)).size===w.seeds.length&&typeof w.paragraph==='string'&&w.paragraph.length<=30000;}
export function loadState(){
  const fallback=freshState();
  try{
    const data=JSON.parse(localStorage.getItem(KEY));
    if(data?.version!==1||!validateLesson(data.lesson)||!data.works||!Object.values(data.works).every(validateWork))return fallback;
    const work=Object.fromEntries(Object.entries(data.works).map(([id,w])=>[id,{...emptyWork(),...w,answerDrafts:w.answerDrafts&&typeof w.answerDrafts==='object'?w.answerDrafts:{},peer:{remember:'',question:'',...w.peer},revisionHistory:Array.isArray(w.revisionHistory)?w.revisionHistory:[]} ]));
    return {...fallback,...data,works:work,page:['home','ideas','talk','write','review','garden'].includes(data.page)?data.page:'home',customLessons:(data.customLessons||[]).filter(validateLesson),question:Math.max(0,Math.min(Number(data.question)||0,data.lesson.questions.length-1)),peerTurn:Math.max(0,Math.min(Number(data.peerTurn)||0,2)),motion:fallback.motion||data.motion===true,kind:TYPES.some(t=>t.id===data.kind)?data.kind:'tell'};
  }catch{return fallback;}
}
export function saveState(state){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
export function exportWork(state){return JSON.stringify({format:'mam-chu-bai-viet',version:1,exportedAt:new Date().toISOString(),lesson:state.lesson,work:state.works[state.lesson.id]},null,2);}
export function importWork(text){
  const data=JSON.parse(text);
  if(data.format!=='mam-chu-bai-viet'||data.version!==1||!validateLesson(data.lesson)||!validateWork(data.work))throw new Error('Tệp chưa đúng định dạng bài viết Mầm chữ.');
  return {lesson:data.lesson,work:{...emptyWork(),...data.work,answerDrafts:{},peer:{remember:'',question:'',...data.work.peer},revisionHistory:[]}};
}
