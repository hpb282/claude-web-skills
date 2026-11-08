import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewParagraph,splitSentences,guessKind,checkExercise,applyExercise} from '../src/learning/checker.js';
import {makeLesson,TYPES,presetLesson} from '../src/learning/lessons.js';
import {importWork,exportWork,validateLesson,loadState} from '../src/learning/store.js';

test('there are exactly three seed kinds with the requested mapping',()=>{
  assert.deepEqual(TYPES.map(t=>[t.id,t.name,t.label]),[['tell','Hạt nâu','Câu kể'],['describe','Hạt đỏ','Câu tả'],['feel','Hạt hồng','Câu nêu tình cảm']]);
});
test('sentence splitting includes lowercase starts without splitting decimals',()=>{
  assert.equal(splitSentences('Em cao 1.2 mét. em thích đọc sách! Em yêu bà').length,3);
  assert.equal(splitSentences('Em ở TP. Hồ Chí Minh. Em thích nơi này.').length,2);
});
test('capitalization and missing ending generate separate exercises',()=>{
  const review=reviewParagraph('em rất yêu bà');
  assert.deepEqual(review.issues.map(i=>i.rule),['capital','ending']);
  assert.equal(checkExercise(review.issues[0],'e'),false);
  assert.equal(checkExercise(review.issues[0],'E'),true);
  assert.equal(checkExercise(review.issues[1],','),false);
  assert.equal(checkExercise(review.issues[1],'!'),true);
});
test('a lowercase sentence after a period is detected',()=>{
  const review=reviewParagraph('Em thích hoa. em chăm cây.');
  assert.equal(review.issues.filter(i=>i.rule==='capital').length,1);
  assert.equal(review.issues[0].start,14);
});
test('correct Vietnamese conventions are not reported as mistakes',()=>{
  assert.equal(reviewParagraph('Em rất yêu bà. Bà có đôi mắt hiền hậu.').issues.length,0);
  assert.equal(reviewParagraph('“Em rất yêu bà!”').issues.length,0);
});
test('spelling exercises are anchored to the actual erroneous phrase',()=>{
  const review=reviewParagraph('Chiếc cặp của em rất xinh sắn.');
  const issue=review.issues.find(i=>i.rule==='spelling');
  assert.equal(issue.original,'xinh sắn');assert.equal(issue.replacement,'xinh xắn');
  assert.ok(issue.options.includes('xinh xắn'));
  assert.ok(checkExercise(issue,'xinh xắn'));assert.ok(!checkExercise(issue,'xinh sắn'));
});
test('phrase matching respects Vietnamese letter boundaries',()=>{
  assert.equal(reviewParagraph('Em gọi đó là axinh sắn.').issues.filter(i=>i.rule==='spelling').length,0);
});
test('unintentional word repetition is distinct from legitimate reduplication',()=>{
  assert.ok(reviewParagraph('Em em đi học.').issues.some(i=>i.rule==='repeated'));
  assert.equal(reviewParagraph('Những chiếc lá xanh xanh.').issues.filter(i=>i.rule==='repeated').length,0);
});
test('spacing and punctuation issues are explained with exact replacement',()=>{
  const review=reviewParagraph('Em  yêu bà ,bà yêu em.');
  assert.ok(review.issues.some(i=>i.rule==='spacing'));
  assert.ok(review.issues.some(i=>i.rule==='before-punctuation'));
  assert.ok(review.issues.some(i=>i.rule==='after-punctuation'));
});
test('applying a correction changes only its range and preserves student voice',()=>{
  const text='Em có một chiếc cặp xinh sắn. Em thích chiếc cặp ấy.';
  const review=reviewParagraph(text),issue=review.issues.find(i=>i.rule==='spelling');
  assert.equal(applyExercise(review,issue,'xinh xắn',text).text,'Em có một chiếc cặp xinh xắn. Em thích chiếc cặp ấy.');
});
test('a stale review or an incorrect answer cannot overwrite a revised draft',()=>{
  const text='em yêu bà',review=reviewParagraph(text),issue=review.issues[0];
  assert.equal(applyExercise(review,issue,'E','Em yêu bà nhiều.').ok,false);
  assert.equal(applyExercise(review,issue,'e',text).ok,false);
});
test('ending punctuation is inserted before a closing quote',()=>{
  const text='“Em yêu bà”',review=reviewParagraph(text),issue=review.issues.find(i=>i.rule==='ending');
  assert.equal(applyExercise(review,issue,'.',text).text,'“Em yêu bà.”');
});
test('content suggestions stay separate from errors and quote actual strengths',()=>{
  const text='Em yêu bà.';const review=reviewParagraph(text,{prompt:'Nêu tình cảm của em.'});
  assert.equal(review.issues.length,0);assert.ok(review.suggestions.length>0);
  assert.equal(review.strengths[0].excerpt,text);
});
test('kind hints are advisory and can distinguish example sentences',()=>{
  assert.equal(guessKind('Em rất yêu bà.'),'feel');
  assert.equal(guessKind('Những chiếc lá xanh mướt.'),'describe');
  assert.equal(guessKind('Mỗi chiều, em cùng bà tưới cây.'),'tell');
});
test('custom prompts create editable questions and hints with all three kinds',()=>{
  const lesson=makeLesson('Viết về một chuyến đi đáng nhớ.');
  assert.ok(validateLesson(lesson));assert.equal(lesson.theme,'event');
  assert.equal(lesson.questions.length,6);
  assert.ok(TYPES.every(t=>lesson.questions.some(q=>q.kind===t.id)));
  assert.ok(lesson.questions.every(q=>q.hints.length>=3));
});
test('export and import preserve authored sentences, manual kinds and paragraph',()=>{
  const lesson=presetLesson();const work={seeds:[{id:'seed-1',text:'Em yêu bà.',kind:'feel'}],paragraph:'Em yêu bà.'};
  const restored=importWork(exportWork({lesson,works:{[lesson.id]:work}}));
  assert.equal(restored.work.seeds[0].kind,'feel');assert.equal(restored.work.paragraph,work.paragraph);
});
test('invalid lesson or seed data cannot be imported as a writing project',()=>{
  assert.throws(()=>importWork('{"format":"wrong"}'));
  const lesson=presetLesson();assert.throws(()=>importWork(JSON.stringify({format:'mam-chu-bai-viet',version:1,lesson,work:{seeds:[{id:'s',text:'Câu.',kind:'blue'}],paragraph:'Câu.'}})));
  assert.throws(()=>importWork(JSON.stringify({format:'mam-chu-bai-viet',version:1,lesson,work:{seeds:[{id:'" onclick="alert(1)',text:'Câu.',kind:'tell'}],paragraph:'Câu.'}})));
});
test('system reduced motion is respected when opening a previously saved draft',()=>{
  const lesson=presetLesson(),originalMedia=globalThis.matchMedia,originalStorage=globalThis.localStorage;
  globalThis.matchMedia=()=>({matches:true});
  globalThis.localStorage={getItem:()=>JSON.stringify({version:1,lesson,works:{[lesson.id]:{seeds:[],paragraph:''}},customLessons:[],motion:false})};
  try{assert.equal(loadState().motion,true);}finally{
    if(originalMedia===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=originalMedia;
    if(originalStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=originalStorage;
  }
});
