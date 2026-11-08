import '@fontsource-variable/dm-sans';
import '@fontsource/barlow-condensed/600.css';
import './style.css';
import gsap from 'gsap';
import {Flip} from 'gsap/Flip';
import {SeedScene} from './seed-scene.js';
import {TYPES,PRESETS,typeOf,presetLesson,makeLesson} from './lessons.js';
import {splitSentences,wordCount,guessKind,reviewParagraph,checkExercise,applyExercise} from './checker.js';
import {loadState,saveState,emptyWork,exportWork,importWork} from './store.js';
import {icon,escapeHTML as e,buddySvg} from './icons.js';
gsap.registerPlugin(Flip);

const state=loadState();
const pages=[['home','Chọn đề bài','book'],['ideas','Gieo ý tưởng','seed'],['talk','Kể cho bạn nghe','chat'],['write','Viết đoạn văn','pen'],['review','Chăm chút bài viết','spark']];
const $=selector=>document.querySelector(selector);
const work=()=>state.works[state.lesson.id]||(state.works[state.lesson.id]=emptyWork());
let scene,analysis=null,editSeed=null,timer=null,seconds=60,timerRunning=false,selectedExercise=0,undoAction=null,toastTimer;
const duration=n=>state.motion?0:n;
const seedMark=(kind,cls='')=>`<span class="seed-mark ${kind} ${cls}" aria-hidden="true"></span>`;
const badge=kind=>{const t=typeOf(kind);return `<span class="type-badge ${kind}">${seedMark(kind)}${t.label}</span>`;};
const button=(label,action,kind='primary',symbol='arrow')=>`<button class="button ${kind}" data-action="${action}">${label}${icon(symbol)}</button>`;
const date=value=>value?new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'';

$('#app').innerHTML=`
  <a class="skip-link" href="#main">Đến nội dung bài học</a>
  <aside class="sidebar">
    <a class="logo" href="#home"><img src="/mam-chu.svg" width="44" height="44" alt=""/><span>mầm chữ<small>Vườn ươm những câu chuyện</small></span></a>
    <div class="workspace-label">Xưởng viết của em</div>
    <nav class="step-nav" aria-label="Hành trình viết văn">${pages.map(([id,label,symbol],i)=>`<a href="#${id}" data-page="${id}"><span class="step-icon">${icon(symbol)}</span><span>${label}</span><span class="step-complete" data-complete="${id}"></span></a>`).join('')}</nav>
    <div class="sidebar-garden"><div class="garden-illustration" aria-hidden="true"><span></span><span></span><span></span><i></i></div><strong>Ý tưởng nhỏ,<br>câu chuyện lớn.</strong><p>Mỗi câu em viết đều là<br>một điều đáng nâng niu.</p><a href="#garden" data-page="garden">Thăm vườn của em ${icon('arrow')}</a></div>
    <div class="sidebar-bottom"><button data-action="drafts">${icon('folder')}Bài viết đã lưu</button><button data-action="help">${icon('info')}Mình học như thế nào?</button></div>
  </aside>
  <div class="app-body">
    <header class="topbar"><div class="breadcrumb"><span>Vườn học tập</span>${icon('right')}<strong>Tập làm văn</strong></div><div class="top-actions"><button class="icon-button mobile-drafts" data-action="drafts" aria-label="Bài viết đã lưu">${icon('folder')}</button><span id="save-status" class="save-status" role="status">${icon('check')}Đã lưu trên máy</span><button class="teacher-button" data-action="teacher">${icon('teacher')}<span>Góc giáo viên</span></button><div class="avatar" title="Nhà văn nhỏ">${icon('leaf')}</div></div></header>
    <main id="main" tabindex="-1"><div id="page-content"></div><div id="scene-home" class="scene-home"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="scene-speck speck-one"></span><span class="scene-speck speck-two"></span><span class="scene-speck speck-three"></span><div id="seed-stage" class="seed-stage" aria-label="Hạt mầm 3D"></div><span class="floating-tag tag-one">${icon('spark')}Mỗi câu, một hạt mầm</span><span class="floating-tag tag-two">${icon('heart')}Ý tưởng của riêng em</span><div class="seed-rotate"><button data-action="rotate-left" class="icon-button" aria-label="Xoay hạt sang trái">${icon('left')}</button><span>${icon('rotate')}Kéo để xoay hạt</span><button data-action="rotate-right" class="icon-button" aria-label="Xoay hạt sang phải">${icon('right')}</button><button data-action="pause-scene" class="icon-button" aria-label="Tạm dừng hạt chuyển động" aria-pressed="false">${icon('pause')}</button></div></div></main>
    <footer class="app-footer"><span>Một chút quan sát. Một chút cảm xúc. Rất nhiều điều để kể.</span><button data-action="motion" aria-pressed="${!state.motion}"><i class="motion-dot"></i>Chuyển động: <span id="motion-label">${state.motion?'tắt':'bật'}</span></button></footer>
  </div>
  <dialog id="panel" class="panel-dialog" aria-labelledby="panel-title"><div class="dialog-header"><span id="panel-kicker">Mầm chữ</span><button class="icon-button" data-action="close-dialog" aria-label="Đóng cửa sổ">${icon('close')}</button></div><h2 id="panel-title"></h2><div id="panel-content"></div></dialog>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <input type="file" id="import-file" accept="application/json,.json" hidden />
`;

function persist(){
  work().updatedAt=new Date().toISOString();
  const ok=saveState(state);
  $('#save-status').innerHTML=ok?`${icon('check')}Đã lưu trên máy`:`${icon('info')}Chưa lưu được — hãy tải bài về`;
  $('#save-status').classList.toggle('save-failed',!ok);
  updateSidebar();return ok;
}
function updateSidebar(){
  const w=work();
  const completed={home:true,ideas:w.seeds.length>0,talk:w.spoken,write:!!w.paragraph.trim(),review:w.revisionHistory.length>0};
  document.querySelectorAll('[data-complete]').forEach(el=>el.innerHTML=completed[el.dataset.complete]?icon('check'):'');
  document.querySelectorAll('.step-nav [data-page]').forEach(a=>{const yes=a.dataset.page===state.page;a.classList.toggle('is-active',yes);yes?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current');});
}
function toast(message,undo){
  clearTimeout(toastTimer);undoAction=undo||null;
  $('#toast').innerHTML=`${icon('check')}<span>${e(message)}</span>${undo?'<button data-action="undo">Hoàn tác</button>':''}`;
  gsap.to('#toast',{autoAlpha:1,y:0,duration:duration(.25),overwrite:true});
  toastTimer=setTimeout(()=>gsap.to('#toast',{autoAlpha:0,y:14,duration:duration(.3)}),undo?8000:4000);
}
function heading(eyebrow,title,description,extra=''){return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-description">${description}</p></div>${extra}</div>`;}
function lessonStrip(){return `<div class="lesson-strip"><span>${icon('book')}Đề bài của em</span><p>${e(state.lesson.prompt)}</p><button data-action="teacher" aria-label="Chỉnh đề bài và câu hỏi">${icon('pen')}</button></div>`;}
function counts(){return TYPES.map(t=>({type:t,count:work().seeds.filter(s=>s.kind===t.id).length}));}
function seedPicker(){return `<div class="seed-picker" aria-label="Ba loại hạt câu văn">${TYPES.map((t,i)=>`<button class="seed-type ${state.kind===t.id?'is-selected':''} ${t.id}" data-kind="${t.id}" aria-pressed="${state.kind===t.id}"><span class="seed-chip-icon">${seedMark(t.id)}</span><span><strong>${t.name}</strong><small>${t.label}</small></span><span class="seed-type-arrow">${icon('right')}</span></button>`).join('')}</div>`;}

function renderHome(){
  const w=work();
  return `<section class="home-page"><div class="hero-content"><p class="eyebrow"><span class="little-leaf">${icon('leaf')}</span>Chào nhà văn nhỏ, mình cùng bắt đầu nhé!</p><h1>Gieo một ý tưởng.<br>Nở một câu chuyện.</h1><p class="hero-description">Có biết bao điều hay trong suy nghĩ của em.<br>Cùng nhặt từng ý nhỏ, kể thành lời và viết thành<br class="desktop-break"> đoạn văn của riêng mình.</p><div class="hero-actions">${button(w.seeds.length?'Tiếp tục gieo ý tưởng':'Bắt đầu gieo ý tưởng','start')}<span>${icon('clock')}Học theo nhịp của em</span></div><div class="hero-note"><span class="note-avatars"><i>${icon('leaf')}</i><i>${icon('sun')}</i><i>${icon('heart')}</i></span><span>Không cần viết thật hay ngay.<br>Chỉ cần bắt đầu từ một câu.</span></div></div>
    <div class="hero-scene-slot"></div><div class="home-lower"><div class="section-heading"><div><span class="small-label">Hôm nay em muốn kể về…</span><h2>Chọn một hạt ý tưởng</h2></div><button class="text-button" data-action="teacher">Đề bài của cô/thầy ${icon('plus')}</button></div><div class="topic-grid">${PRESETS.map((p,i)=>`<button class="topic-card ${p.id===state.lesson.id?'is-selected':''}" data-preset="${i}"><span class="topic-icon topic-${i}">${icon(p.emoji)}</span><span class="topic-card-copy"><small>${p.tag}</small><strong>${p.title}</strong></span><span class="topic-radio">${p.id===state.lesson.id?icon('check'):icon('arrow')}</span></button>`).join('')}</div><div class="current-prompt"><span>Đề đang chọn</span><p>${e(state.lesson.prompt)}</p></div>
    <div class="section-heading seed-heading"><div><span class="small-label">Ba màu sắc, ba cách kể</span><h2>Mỗi câu văn là một hạt mầm</h2></div><span class="gentle-note">Một câu có thể vừa kể vừa tả.<br>Em chọn vai trò chính cho hạt của mình.</span></div>${seedPicker()}
    <div class="journey-banner"><span class="banner-icon">${icon('garden')}</span><div><strong>Từ ý tưởng đến khu vườn câu chữ</strong><p>Gieo ý tưởng ${icon('right')} Kể cho bạn ${icon('right')} Viết thành đoạn ${icon('right')} Cùng chăm chút</p></div><button class="icon-button" data-action="help" aria-label="Xem hướng dẫn hành trình">${icon('arrow')}</button></div></div></section>`;
}

function seedList(){
  const seeds=work().seeds;
  return `<section class="seed-basket"><div class="section-heading"><h2>Giỏ hạt của em <span class="count-pill">${seeds.length}</span></h2><span class="small-label">Mỗi câu đã lưu là một hạt</span></div><div class="basket-counts">${counts().map(({type:t,count})=>`<span>${seedMark(t.id)}${t.name}: <strong>${count}</strong></span>`).join('')}</div><div id="seed-list">${seeds.length?seeds.map((s,i)=>`<article class="saved-seed ${s.kind}" data-seed-id="${e(s.id)}" draggable="true"><span class="seed-order">${String(i+1).padStart(2,'0')}</span><div class="saved-seed-copy">${badge(s.kind)}<p>${e(s.text)}</p></div><div class="seed-tools"><button data-move-seed="${e(s.id)}" data-direction="-1" class="icon-button" aria-label="Đưa câu ${i+1} lên trước" ${i===0?'disabled':''}>${icon('up')}</button><button data-move-seed="${e(s.id)}" data-direction="1" class="icon-button" aria-label="Đưa câu ${i+1} xuống sau" ${i===seeds.length-1?'disabled':''}>${icon('down')}</button><button data-edit-seed="${e(s.id)}" class="icon-button" aria-label="Sửa câu ${i+1}">${icon('pen')}</button><button data-delete-seed="${e(s.id)}" class="icon-button" aria-label="Xóa câu ${i+1}">${icon('trash')}</button></div></article>`).join(''):`<div class="basket-empty">${icon('seed')}<p>Giỏ hạt đang chờ câu đầu tiên của em.</p><span>Em nghĩ gì? Hãy kể theo cách của mình nhé.</span></div>`}</div>${seeds.length?`<div class="basket-next"><span>${icon('info')}Em có thể kéo thẻ hoặc dùng nút mũi tên để đổi thứ tự.</span>${button('Kể cho bạn nghe','go-talk')}</div>`:''}</section>`;
}
function renderIdeas(){
  const q=state.lesson.questions[state.question],t=typeOf(state.kind),draft=work().answerDrafts[state.question]||'';
  return `<section class="ideas-page">${heading('Bước 1 · Tìm ý và đặt câu','Mình gieo câu đầu tiên nhé.','Không có ý tưởng nào quá nhỏ. Em quan sát, nhớ lại và viết bằng lời của mình.')} ${lessonStrip()}<div class="ideas-layout"><div class="question-card ${state.kind}"><div class="question-top">${badge(q.kind)}<span>Câu hỏi ${state.question+1} / ${state.lesson.questions.length}</span></div><h2>${e(q.text)}</h2><div class="hint-label">${icon('spark')}Một vài từ có thể giúp em</div><div class="hint-chips">${q.hints.map(h=>`<button data-hint="${e(h)}">${e(h)} ${icon('plus')}</button>`).join('')}</div><label class="answer-label" for="answer">Câu trả lời của em</label><textarea id="answer" maxlength="1800" placeholder="Em hãy viết một câu theo ý của mình…">${e(draft)}</textarea><div class="answer-meta"><span>Em có thể thêm nhiều câu; mỗi câu sẽ thành một hạt.</span><span id="answer-length">${draft.length}/1800</span></div><fieldset class="kind-options"><legend>Em muốn gieo loại hạt nào?</legend>${TYPES.map(type=>`<label><input type="radio" name="seed-kind" value="${type.id}" ${type.id===state.kind?'checked':''}/>${seedMark(type.id)}${type.label}</label>`).join('')}</fieldset><p id="answer-error" class="inline-error" role="status"></p><div class="question-actions"><button class="text-button" data-action="prev-question" ${state.question===0?'disabled':''}>${icon('left')}Câu trước</button><button class="text-button" data-action="next-question">Câu tiếp ${icon('right')}</button>${button('Gieo hạt câu văn','save-seed','primary','plus')}</div><div class="question-dots" aria-label="Chọn câu hỏi">${state.lesson.questions.map((_,i)=>`<button data-question="${i}" class="${i===state.question?'is-active':''}" aria-label="Câu hỏi ${i+1}" aria-pressed="${i===state.question}">${i+1}</button>`).join('')}</div></div><div class="ideas-aside"><div class="aside-seed-space"></div><div class="seed-tip"><span class="tip-icon">${icon(t.icon)}</span><div><strong>${t.name} · ${t.label}</strong><p>${t.description}</p></div></div><blockquote>“${e(t.example)}”<span>Một ví dụ để hiểu loại câu — em viết ý của riêng mình nhé.</span></blockquote></div></div>${seedList()}</section>`;
}

const peerRoles=[{title:'Em là người kể',label:'Kể câu chuyện của em',description:'Nhìn những hạt ý tưởng và kể cho bạn nghe. Em không cần đọc thuộc từng câu.',name:'Sóc kể chuyện'},{title:'Bạn là người lắng nghe',label:'Lắng nghe bằng cả trái tim',description:'Nghe hết lượt của bạn. Chọn một chi tiết em nhớ và hỏi thêm một điều thật nhẹ nhàng.',name:'Thỏ lắng nghe'},{title:'Mình cùng góp ý',label:'Một lời góp ý biết nâng niu',description:'Nói điều em thích trước, rồi gợi ý một điều giúp câu chuyện của bạn rõ hơn.',name:'Gấu đồng hành'}];
function renderTalk(){
  const w=work(),role=peerRoles[state.peerTurn];
  return `<section class="talk-page">${heading('Bước 2 · Nói và lắng nghe','Câu chuyện hay hơn khi được sẻ chia.','Một bạn kể, một bạn lắng nghe. Sau một lượt, chúng mình đổi vai nhé.')}<div class="talk-layout"><div class="peer-stage"><div class="peer-orbit"></div><div class="peer-figures">${peerRoles.map((r,i)=>`<div class="peer-figure ${i===state.peerTurn?'is-selected':''}" data-peer-figure="${i}"><button class="buddy-art" data-peer="${i}" aria-label="${r.name}" aria-pressed="${i===state.peerTurn}">${buddySvg(i)}</button><button class="buddy-hotspot" data-peer-tip="${i}" aria-label="Xem gợi ý: ${r.title}">${icon('plus')}</button></div>`).join('')}</div><div class="peer-controls"><button class="icon-button" data-action="prev-peer" aria-label="Vai trước">${icon('left')}</button><span>${state.peerTurn+1} / 3 · ${role.name}</span><button class="icon-button" data-action="next-peer" aria-label="Vai tiếp theo">${icon('right')}</button></div></div><div class="talk-card"><span class="type-badge feel">${icon('chat')}${role.title}</span><h2>${role.label}</h2><p>${role.description}</p><div class="talk-timer"><span>${icon('clock')}Một phút chia sẻ</span><strong id="timer-display">${formatTimer(seconds)}</strong><button data-action="timer" class="icon-button" aria-label="${timerRunning?'Tạm dừng':'Bắt đầu'} đồng hồ">${icon(timerRunning?'pause':'play')}</button><button data-action="reset-timer" class="icon-button" aria-label="Đặt lại đồng hồ">${icon('rotate')}</button></div><div class="story-cues">${w.seeds.length?w.seeds.map((s,i)=>`<p>${seedMark(s.kind)}<span>${e(s.text)}</span></p>`).join(''):`<div class="empty-inline">Em gieo vài hạt trước để có thẻ gợi nhớ nhé. ${button('Đi gieo ý tưởng','start','secondary')}</div>`}</div><label class="field-label" for="peer-remember">Một chi tiết em nhớ trong câu chuyện của bạn</label><input id="peer-remember" maxlength="350" value="${e(w.peer.remember)}" placeholder="Mình thích chi tiết…"/><label class="field-label" for="peer-question">Một câu hỏi hoặc lời góp ý nhẹ nhàng</label><input id="peer-question" maxlength="350" value="${e(w.peer.question)}" placeholder="Bạn có thể kể thêm về… không?"/><div class="talk-actions"><button class="text-button" data-action="read-seeds">${icon('sound')}Nghe các câu của em</button>${button(w.spoken?'Đã chia sẻ · Đi viết đoạn':'Chúng mình đã chia sẻ','finish-talk','primary','check')}</div><p class="microcopy">Học một mình? Em có thể tập nói thành tiếng rồi tự đọc lại.</p></div></div></section>`;
}

function renderWrite(){
  const w=work();
  return `<section class="write-page">${heading('Bước 3 · Sắp ý và viết đoạn','Những hạt nhỏ thành một đoạn văn.','Em sắp xếp ý, nối các câu và thêm lời văn của mình. Bài viết vẫn là câu chuyện của riêng em.',`<button class="button secondary" data-action="export-text">${icon('download')}Tải bài viết</button>`)}${lessonStrip()}<div class="writing-layout"><aside class="outline-panel"><div class="section-heading"><h2>Nhìn lại các hạt</h2><span class="count-pill">${w.seeds.length}</span></div><p class="muted">Kéo thẻ hoặc dùng nút mũi tên ở bước gieo ý để sắp xếp trước khi ghép.</p><div class="outline-seeds">${w.seeds.length?w.seeds.map((s,i)=>`<article class="outline-seed ${s.kind}"><span>${seedMark(s.kind)}${i+1}</span><p>${e(s.text)}</p></article>`).join(''):`<div class="empty-inline">Giỏ hạt của em còn trống.${button('Thêm câu ý tưởng','start','secondary')}</div>`}</div>${button('Ghép các câu của em','assemble','secondary','plus')}<p class="microcopy">Ghép câu là bước đầu. Em đọc lại để nối ý cho tự nhiên nhé.</p></aside><div class="notebook"><div class="notebook-header"><span>${icon('pen')}Trang viết của em</span><span id="writing-count">${wordCount(w.paragraph)} tiếng · ${splitSentences(w.paragraph).length} câu</span></div><label class="sr-only" for="paragraph">Đoạn văn của em</label><textarea id="paragraph" maxlength="12000" placeholder="Ý tưởng đã sẵn sàng. Em bắt đầu câu chuyện của mình ở đây nhé…">${e(w.paragraph)}</textarea><div class="notebook-footer"><span>${icon('save')}Bài được lưu tự động trên thiết bị này.</span><button class="text-button" data-action="read-paragraph">${icon('sound')}Nghe lại bài</button></div><div class="writing-reminder"><span>${seedMark('tell')}Kể rõ điều em muốn nói</span><span>${seedMark('describe')}Thêm chi tiết em quan sát</span><span>${seedMark('feel')}Chia sẻ cảm xúc thật</span></div><div class="notebook-action"><p>Đọc lại một lượt.<br>Mình cùng chăm chút bài viết nhé?</p>${button('Kiểm tra đoạn văn','check','primary','spark')}</div></div></div></section>`;
}

function highlight(text,issues){
  const ranges=issues.filter(i=>i.start<i.end).sort((a,b)=>a.start-b.start);let cursor=0,result='';
  for(const issue of ranges){if(issue.start<cursor)continue;result+=e(text.slice(cursor,issue.start));result+=`<mark title="${e(issue.title)}">${e(text.slice(issue.start,issue.end))}</mark>`;cursor=issue.end;}
  return result+e(text.slice(cursor));
}
function exerciseMarkup(issue){
  if(!issue)return `<div class="empty-inline">${icon('garden')}Chưa thấy lỗi thuộc những nhóm đang kiểm tra. Em vẫn nên đọc lại cùng cô/thầy.</div>`;
  return `<div class="exercise-label">${icon('pen')}Bài tập từ chính bài của em</div><h3>${e(issue.title)}</h3><blockquote>${issue.original.trim()?e(issue.original):e(analysis.sentences.at(-1)?.text||'Câu cuối của em')}</blockquote><p>${e(issue.question)}</p>${['choice','ending'].includes(issue.kind)?`<div class="exercise-options">${[...issue.options].reverse().map((option,i)=>`<button data-exercise-answer="${e(option)}">${e(option)}</button>`).join('')}</div>`:`<form id="exercise-form"><label for="exercise-answer">${issue.kind==='space'?'Nhập một dấu cách':issue.kind==='space-after'?'Viết dấu câu và một dấu cách':'Em viết lại ở đây'}</label><div class="exercise-input-row"><input id="exercise-answer" autocomplete="off" name="answer" maxlength="250" placeholder="Câu trả lời của em…"/><button class="button secondary" type="submit">Thử trả lời ${icon('check')}</button></div></form>`}<div id="exercise-feedback" class="exercise-feedback" role="status"></div><button id="apply-exercise" class="button primary" data-action="apply-exercise" hidden>Dùng phần sửa này trong bài ${icon('arrow')}</button><details class="exercise-help"><summary>Mình xem một lời nhắc nhé</summary><p>${e(issue.why)}</p></details>`;
}
function renderReview(){
  const w=work();if(!analysis||analysis.source!==w.paragraph)analysis=reviewParagraph(w.paragraph,state.lesson);
  selectedExercise=Math.min(selectedExercise,Math.max(analysis.issues.length-1,0));
  return `<section class="review-page">${heading('Bước 4 · Đọc lại, luyện sửa và lớn lên','Chăm chút để câu chuyện rõ hơn.','Mình tìm một chỗ nhỏ để sửa mỗi lần. Ý tưởng và giọng văn vẫn là của em.')}<div class="review-notice">${icon('info')}Gợi ý tự động theo quy tắc, chưa thay thế lời nhận xét của cô/thầy. Có thể chưa phát hiện hết lỗi hoặc hiểu hết ý của em.</div>${analysis.empty?`<div class="large-empty">${icon('pen')}<h2>Mình cần một đoạn văn để cùng đọc lại.</h2>${button('Đến trang viết','go-write')}</div>`:`<div class="review-summary"><div><span class="review-flower">${icon('garden')}</span><div><h2>${analysis.issues.length?`Có ${analysis.issues.length} chỗ mình cùng xem lại`:'Thêm một bước tiến của em!'}</h2><p>${analysis.issues.length?'Em chọn một chỗ, làm bài tập và tự quyết định phần sửa.':'Chưa thấy lỗi trong các nhóm quy tắc hiện có. Cùng đọc lại nội dung và cách diễn đạt nhé.'}</p></div></div><span class="revision-badge">${w.revisionHistory.length} lần chăm chút</span></div><div class="review-layout"><div class="review-document"><div class="section-heading"><h2>Đoạn văn của em</h2><button class="text-button" data-action="go-write">${icon('pen')}Sửa trực tiếp</button></div><div class="highlighted-paragraph">${highlight(w.paragraph,analysis.issues)}</div><div class="strengths">${analysis.strengths.map(s=>`<div><span>${icon('leaf')}</span><p><strong>${e(s.title)}</strong><q>${e(s.excerpt)}</q></p></div>`).join('')}</div><div class="issue-list">${analysis.issues.slice(0,3).map((issue,i)=>`<button class="issue-card ${i===selectedExercise?'is-selected':''}" data-issue="${i}"><span>${i+1}</span><div><strong>${e(issue.title)}</strong><small>${e(issue.why)}</small></div>${icon('right')}</button>`).join('')}</div>${analysis.issues.length>3?`<p class="microcopy">Mình tập trung 3 chỗ trước. Sửa xong, những gợi ý tiếp theo sẽ hiện ra.</p>`:''}${analysis.suggestions.length?`<div class="growth-suggestions"><h3>${icon('spark')}Gợi ý để ý tưởng lớn thêm</h3><span class="microcopy">Đây là gợi ý mở rộng, không phải lỗi.</span>${analysis.suggestions.slice(0,2).map(s=>`<div><strong>${e(s.title)}</strong><p>${e(s.body)}</p>${s.excerpt?`<q>${e(s.excerpt)}</q>`:''}</div>`).join('')}</div>`:''}</div><aside class="exercise-card" id="exercise-card">${exerciseMarkup(analysis.issues[selectedExercise])}</aside></div><div class="review-footer">${button('Em đã tự sửa · Kiểm tra lại','check','secondary','rotate')}${button('Lưu vào vườn của em','finish','primary','garden')}</div>`}</section>`;
}

function renderGarden(){
  const w=work();const achievements=[{earned:w.seeds.length>0,title:'Hạt mầm đầu tiên',desc:'Viết một câu của riêng mình',icon:'seed'},{earned:TYPES.every(t=>w.seeds.some(s=>s.kind===t.id)),title:'Khu vườn ba màu',desc:'Có đủ ba loại hạt câu văn',icon:'sun'},{earned:w.spoken,title:'Người kể chuyện',desc:'Tập nói và lắng nghe',icon:'chat'},{earned:w.paragraph.trim().length>0,title:'Đoạn văn đầu tiên',desc:'Kết nối những ý tưởng',icon:'book'},{earned:w.revisionHistory.length>0,title:'Người chăm vườn',desc:'Tự sửa một chỗ trong bài',icon:'garden'}];
  return `<section class="garden-page"><div class="garden-panorama"><div class="garden-panorama-shade"></div><div class="garden-title"><span>Mỗi lần đọc lại, em lại lớn thêm một chút.</span><h1>Vườn câu chữ<br>của em.</h1><p>${w.seeds.length} hạt ý tưởng · ${w.revisionHistory.length} lần chăm chút</p></div><div class="story-line"></div><div class="hanging-stories">${(w.seeds.length?w.seeds.slice(-4):TYPES.map(t=>({kind:t.id,text:t.description}))).map((s,i)=>`<button class="hanging-story ${s.kind}" style="--item:${i}" data-garden-seed="${i}"><span class="story-thread"></span><span class="story-paper">${seedMark(s.kind)}<strong>${typeOf(s.kind).label}</strong><p>${e(s.text)}</p>${icon('heart')}</span></button>`).join('')}</div></div><div class="garden-content"><div class="section-heading"><div><span class="small-label">Những điều em đã làm được</span><h2>Mỗi bước đều đáng tự hào</h2></div><button class="text-button" data-action="export-json">${icon('download')}Mang bài viết về máy</button></div><div class="achievement-grid">${achievements.map(a=>`<div class="achievement ${a.earned?'is-earned':''}"><span>${icon(a.icon)}</span><strong>${a.title}</strong><small>${a.earned?'Em đã làm được!':a.desc}</small></div>`).join('')}</div><div class="garden-paragraph"><h2>Câu chuyện đang lớn</h2><p>${e(w.paragraph||'Trang viết đang đợi câu chuyện của riêng em. Mình bắt đầu với một hạt nhỏ nhé.')}</p><div>${button('Trở lại trang viết','go-write','secondary','pen')}${button('Tải đoạn văn (.txt)','export-text','primary','download')}</div></div></div></section>`;
}

function render(animate=true){
  const target=$('#page-content');
  const sceneElement=$('#scene-home');
  if(sceneElement.parentElement!==$('#main'))$('#main').append(sceneElement);
  const renders={home:renderHome,ideas:renderIdeas,talk:renderTalk,write:renderWrite,review:renderReview,garden:renderGarden};
  document.body.dataset.page=state.page;document.body.classList.toggle('reduce-motion',state.motion);
  target.innerHTML=renders[state.page]();
  const slot=state.page==='home'?$('.hero-scene-slot'):state.page==='ideas'?$('.aside-seed-space'):null;
  if(slot)slot.append(sceneElement);
  scene?.setVisible(['home','ideas'].includes(state.page));
  $('#scene-home').hidden=!['home','ideas'].includes(state.page);
  scene?.select(TYPES.findIndex(t=>t.id===state.kind),state.page==='ideas');scene?.setGrowth(work().seeds.length);
  updateSidebar();
  if(state.page==='talk')layoutPeers(false);
  if(animate){gsap.fromTo(target,{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:duration(.5),ease:'power3.out',clearProps:'transform'});if(state.page==='garden')gsap.fromTo('.hanging-story',{rotation:5,y:-40},{rotation:0,y:0,stagger:.07,duration:duration(1.1),ease:'power3.out',clearProps:'transform'});}
  bindPageForms();
}
function go(page,{animate=true,focus=true}={}){
  if(!pages.some(p=>p[0]===page)&&page!=='garden')page='home';
  if(state.page==='talk'&&page!=='talk')stopTimer();
  window.speechSynthesis?.cancel();state.page=page;editSeed=null;
  history.replaceState(null,'',`#${page}`);persist();render(animate);
  if(focus){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});}
}
function chooseKind(kind,{rerender=true}={}){state.kind=typeOf(kind).id;scene?.select(TYPES.findIndex(t=>t.id===state.kind),state.page==='ideas');if(rerender)render(false);persist();}
function chooseQuestion(index){state.question=Math.max(0,Math.min(index,state.lesson.questions.length-1));state.kind=state.lesson.questions[state.question].kind;persist();render();$('#answer')?.focus({preventScroll:true});}
function chooseLesson(lesson){
  state.lesson=lesson;state.question=0;state.kind=lesson.questions[0].kind;analysis=null;
  if(!state.works[lesson.id])state.works[lesson.id]=emptyWork();
  persist();render();toast('Đã chọn đề. Ý tưởng của các đề khác vẫn được giữ lại.');
}
function saveSeed(){
  const value=$('#answer').value.trim();
  if(!value){$('#answer-error').textContent='Em viết một câu trước khi gieo hạt nhé.';$('#answer').focus();return;}
  if(work().seeds.length>=200){$('#answer-error').textContent='Giỏ đã có 200 hạt. Em tải bài về hoặc chăm chút các câu đang có nhé.';return;}
  const chunks=splitSentences(value).slice(0,200-work().seeds.length);
  const seeds=chunks.map((s,i)=>({id:crypto.randomUUID(),text:s.text,kind:state.kind,question:state.question,createdAt:new Date().toISOString()}));
  work().seeds.push(...seeds);delete work().answerDrafts[state.question];persist();
  const previous=state.question;state.question=Math.min(previous+1,state.lesson.questions.length-1);state.kind=state.lesson.questions[state.question].kind;
  render(false);persist();
  const newest=document.querySelectorAll('.saved-seed');
  gsap.from([...newest].slice(-seeds.length),{autoAlpha:0,x:35,scale:.94,stagger:.08,duration:duration(.65),ease:'back.out(1.2)'});
  toast(`Em vừa gieo ${seeds.length} hạt câu văn. Ý tưởng đang lớn lên rồi!`);
}
function moveSeed(id,direction){
  const seeds=work().seeds,i=seeds.findIndex(s=>s.id===id),next=i+direction;if(i<0||next<0||next>=seeds.length)return;
  const flip=Flip.getState('.saved-seed');[seeds[i],seeds[next]]=[seeds[next],seeds[i]];persist();
  const list=$('#seed-list');if(list){seeds.forEach((s,index)=>{const el=list.querySelector(`[data-seed-id="${CSS.escape(s.id)}"]`);if(el){list.append(el);el.querySelector('.seed-order').textContent=String(index+1).padStart(2,'0');el.querySelector('[data-direction="-1"]').disabled=index===0;el.querySelector('[data-direction="1"]').disabled=index===seeds.length-1;}});Flip.from(flip,{duration:duration(.5),ease:'power2.inOut',absolute:false});}
}
function showDialog(title,html,kicker='Cùng Mầm chữ'){ // Dynamic text is escaped at each template boundary.
  $('#panel-title').textContent=title;$('#panel-kicker').textContent=kicker;
  $('#panel-content').innerHTML=html;
  if(!$('#panel').open)$('#panel').showModal();scene?.setSuspended(true);
  gsap.fromTo('#panel',{autoAlpha:0,y:18},{autoAlpha:1,y:0,duration:duration(.3),ease:'power3.out'});
}
function closeDialog(){$('#panel').close();}
function editSeedDialog(id){
  const s=work().seeds.find(s=>s.id===id);if(!s)return;editSeed=id;
  showDialog('Chăm lại một hạt ý tưởng',`<form id="edit-seed-form"><label class="field-label" for="edit-seed-text">Câu văn của em</label><textarea id="edit-seed-text" maxlength="1800" required>${e(s.text)}</textarea><label class="field-label" for="edit-seed-kind">Vai trò chính của câu</label><select id="edit-seed-kind">${TYPES.map(t=>`<option value="${t.id}" ${t.id===s.kind?'selected':''}>${t.name} · ${t.label}</option>`).join('')}</select><p class="microcopy">Nếu viết thành nhiều câu, mỗi câu được lưu thành một hạt.</p><button type="submit" class="button primary">Lưu hạt câu văn ${icon('check')}</button></form>`);
  $('#edit-seed-form').addEventListener('submit',event=>{event.preventDefault();const text=$('#edit-seed-text').value.trim();if(!text)return;const index=work().seeds.findIndex(s=>s.id===editSeed);const parts=splitSentences(text);if(work().seeds.length-1+parts.length>200){toast('Giỏ hạt tối đa 200 câu. Em giữ lại những câu mình muốn dùng nhé.');return;}const old=work().seeds[index];work().seeds.splice(index,1,...parts.map((p,i)=>({...old,id:i?crypto.randomUUID():old.id,text:p.text,kind:$('#edit-seed-kind').value})));persist();closeDialog();render(false);toast('Hạt câu văn đã được chăm lại. Đoạn văn hiện tại được giữ nguyên để em tự cập nhật.');});
}

function teacherDialog(){
  showDialog('Một đề bài, nhiều ý tưởng nhỏ.',`<form id="teacher-form"><div class="teacher-note">${icon('teacher')}Cô/thầy có thể viết đề riêng, tạo bộ câu hỏi theo chủ đề rồi chỉnh từng câu cho phù hợp lớp mình.</div><div class="form-columns"><div><label class="field-label" for="lesson-title">Tên bài học</label><input id="lesson-title" maxlength="100" value="${e(state.lesson.title)}" required/></div><div><label class="field-label" for="lesson-grade">Dành cho lớp</label><select id="lesson-grade">${['3–5','3','4','5','1–2'].map(g=>`<option ${state.lesson.grade===g?'selected':''}>${g}</option>`).join('')}</select></div></div><label class="field-label" for="lesson-prompt">Đề bài</label><textarea id="lesson-prompt" maxlength="2000" required>${e(state.lesson.prompt)}</textarea><button type="button" class="button secondary" data-action="generate-questions">${icon('spark')}Tạo câu hỏi & từ gợi ý theo đề</button><p class="microcopy">Bộ gợi ý dùng mẫu theo chủ đề, chạy trên máy; cô/thầy duyệt lại trước khi giao bài. Học liệu minh họa tự biên soạn.</p><div id="teacher-questions">${teacherQuestions(state.lesson.questions)}</div><button type="submit" class="button primary teacher-submit">Dùng đề và bộ câu hỏi này ${icon('arrow')}</button></form>`,'Góc giáo viên');
  $('#teacher-form').addEventListener('submit',event=>{
    event.preventDefault();
    const questions=[...document.querySelectorAll('.teacher-question')].map(el=>({kind:el.querySelector('select').value,text:el.querySelector('input').value.trim(),hints:el.querySelector('textarea').value.split(/[,\n]/u).map(s=>s.trim()).filter(Boolean).slice(0,10)}));
    if(questions.some(q=>!q.text)){toast('Cô/thầy điền đầy đủ các câu hỏi trước khi lưu nhé.');return;}
    const lesson={...makeLesson($('#lesson-prompt').value,{title:$('#lesson-title').value.trim(),grade:$('#lesson-grade').value}),questions};
    state.customLessons.push(lesson);chooseLesson(lesson);closeDialog();go('ideas');toast('Đề bài và bộ câu hỏi đã sẵn sàng.');
  });
}
function teacherQuestions(questions){return questions.map((q,i)=>`<div class="teacher-question"><div><strong>Câu ${i+1}</strong><select aria-label="Loại hạt câu hỏi ${i+1}">${TYPES.map(t=>`<option value="${t.id}" ${q.kind===t.id?'selected':''}>${t.name} · ${t.label}</option>`).join('')}</select></div><label class="field-label">Câu hỏi<input aria-label="Nội dung câu hỏi ${i+1}" maxlength="400" value="${e(q.text)}" required/></label><label class="field-label">Từ gợi ý, ngăn cách bằng dấu phẩy<textarea aria-label="Từ gợi ý câu hỏi ${i+1}" rows="2" maxlength="400">${e(q.hints.join(', '))}</textarea></label></div>`).join('');}
function draftsDialog(){
  const all=[...PRESETS.map((_,i)=>presetLesson(i)),...state.customLessons];
  const unique=all.filter((l,i)=>all.findIndex(x=>x.id===l.id)===i).filter(l=>state.works[l.id]);
  showDialog('Những câu chuyện đang lớn',`<p class="muted">Bài được lưu trên trình duyệt này. Em có thể tải tệp bài học để chuyển sang máy khác.</p><div class="draft-list">${unique.map(l=>`<button data-open-draft="${e(l.id)}"><span class="draft-symbol">${icon('book')}</span><span><strong>${e(l.title)}</strong><small>${state.works[l.id].seeds.length} hạt · ${date(state.works[l.id].updatedAt)||'Chưa viết'}</small></span>${icon('arrow')}</button>`).join('')}</div><div class="dialog-button-row">${button('Tải bài đang học (.json)','export-json','secondary','download')}${button('Mở bài từ máy','import','secondary','upload')}</div>`);
}
function assemble(){
  if(!work().seeds.length){toast('Mình gieo một vài câu trước nhé.');return;}
  const text=work().seeds.map(s=>s.text).join(' ');
  const apply=()=>{const before=work().paragraph;work().paragraph=text;analysis=null;persist();if($('#panel').open)closeDialog();render(false);toast('Đã ghép các câu theo thứ tự trong giỏ.',before?()=>{work().paragraph=before;persist();render(false);}:null);};
  if(work().paragraph.trim()&&work().paragraph!==text)showDialog('Ghép lại các hạt ý tưởng?',`<p>Trang viết đang có nội dung em đã chỉnh. Ghép lại sẽ thay nội dung đó bằng các câu trong giỏ. Em có thể tải bài hiện tại trước.</p><div class="dialog-button-row">${button('Giữ trang viết','close-dialog','secondary','pen')}${button('Ghép lại các câu','confirm-assemble','primary','check')}</div>`);
  else apply();
  const confirm=$('[data-action="confirm-assemble"]');if(confirm)confirm.onclick=apply;
}
function runReview(){analysis=reviewParagraph(work().paragraph,state.lesson);selectedExercise=0;go('review');}
function answerExercise(answer){
  const issue=analysis?.issues[selectedExercise];if(!issue)return;
  const correct=checkExercise(issue,answer);$('#exercise-feedback').className=`exercise-feedback ${correct?'is-correct':'is-retry'}`;
  $('#exercise-feedback').textContent=correct?'Em đã tìm được cách sửa. Em đọc lại rồi chọn dùng trong bài nhé.':`Mình thử lại nhé. ${issue.why}`;
  $('#apply-exercise').hidden=!correct;$('#apply-exercise').dataset.answer=answer;
  if(correct)gsap.fromTo('#apply-exercise',{autoAlpha:0,y:6},{autoAlpha:1,y:0,duration:duration(.3)});
}
function applyAnswer(){
  const issue=analysis?.issues[selectedExercise];if(!issue)return;
  const result=applyExercise(analysis,issue,$('#apply-exercise').dataset.answer,work().paragraph);
  if(!result.ok){toast(result.reason);return;}
  const before=work().paragraph;work().revisionHistory.push({at:new Date().toISOString(),before,after:result.text,rule:issue.rule});work().revisionHistory=work().revisionHistory.slice(-20);work().paragraph=result.text;
  analysis=reviewParagraph(result.text,state.lesson);selectedExercise=0;persist();render();toast('Em vừa chăm chút thêm một chỗ trong bài.',()=>{work().paragraph=before;work().revisionHistory.pop();analysis=null;persist();render(false);});
}
function download(content,filename,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportText(){download(`MẦM CHỮ — BÀI VIẾT CỦA EM\n\n${state.lesson.title}\nĐề bài: ${state.lesson.prompt}\n\n${work().paragraph||work().seeds.map(s=>s.text).join(' ')}\n\nCác hạt ý tưởng\n${work().seeds.map((s,i)=>`${i+1}. [${typeOf(s.kind).label}] ${s.text}`).join('\n')}`,'mam-chu-bai-viet.txt','text/plain;charset=utf-8');toast('Đã tạo tệp bài viết để em lưu về máy.');}
function speak(text){
  if(!text.trim()){toast('Em viết một vài câu để nghe lại nhé.');return;}
  if(!('speechSynthesis'in window)){toast('Trình duyệt này chưa hỗ trợ đọc văn bản. Em có thể tự đọc thành tiếng nhé.');return;}
  const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'));
  if(!voice){toast('Máy chưa có giọng đọc tiếng Việt. Em có thể tự đọc hoặc nhờ bạn đọc cùng nhé.');return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='vi-VN';utterance.voice=voice;utterance.rate=.85;utterance.onerror=()=>toast('Giọng đọc chưa phát được. Em thử đọc cùng một người bạn nhé.');speechSynthesis.speak(utterance);
}
function formatTimer(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function stopTimer(){clearInterval(timer);timer=null;timerRunning=false;}
function toggleTimer(){
  if(timerRunning)stopTimer();else{if(seconds<=0)seconds=60;timerRunning=true;timer=setInterval(()=>{seconds--;const el=$('#timer-display');if(el)el.textContent=formatTimer(seconds);if(seconds<=0){stopTimer();toast('Một lượt chia sẻ đã xong. Chúng mình có thể đổi vai nhé.');const b=$('[data-action="timer"]');if(b){b.innerHTML=icon('play');b.setAttribute('aria-label','Bắt đầu đồng hồ');}}},1000);}
  const b=$('[data-action="timer"]');b.innerHTML=icon(timerRunning?'pause':'play');b.setAttribute('aria-label',timerRunning?'Tạm dừng đồng hồ':'Bắt đầu đồng hồ');
}
function layoutPeers(animate=true){document.querySelectorAll('[data-peer-figure]').forEach((el,i)=>{const rel=(i-state.peerTurn+3)%3;const [left,scale,alpha]=[[39,1,1],[77,.64,.6],[95,.43,.3]][rel];el.classList.toggle('is-selected',i===state.peerTurn);el.style.zIndex=String(5-rel);gsap.to(el,{left:`${left}%`,xPercent:-50,scale,autoAlpha:alpha,duration:animate?duration(.8):0,ease:'power3.inOut',overwrite:true});});}
function updatePeer(index){
  state.peerTurn=index;persist();
  const temp=document.createElement('div');temp.innerHTML=renderTalk();
  $('.talk-card').replaceWith(temp.querySelector('.talk-card'));
  $('.peer-controls>span').textContent=`${index+1} / 3 · ${peerRoles[index].name}`;
  document.querySelectorAll('[data-peer]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.peer)===index));
  layoutPeers();bindPageForms();
  gsap.from('.talk-card>h2,.talk-card>p',{y:8,autoAlpha:0,duration:duration(.35),stagger:.04});
}
function nextPeer(direction){updatePeer((state.peerTurn+direction+3)%3);}
function bindPageForms(){
  $('#answer')?.addEventListener('input',event=>{work().answerDrafts[state.question]=event.target.value;$('#answer-length').textContent=`${event.target.value.length}/1800`;persist();});
  document.querySelectorAll('[name="seed-kind"]').forEach(input=>input.addEventListener('change',()=>{const value=input.value;chooseKind(value);document.querySelector(`[name="seed-kind"][value="${value}"]`)?.focus({preventScroll:true});}));
  $('#paragraph')?.addEventListener('input',event=>{work().paragraph=event.target.value;analysis=null;$('#writing-count').textContent=`${wordCount(event.target.value)} tiếng · ${splitSentences(event.target.value).length} câu`;persist();});
  ['remember','question'].forEach(key=>$(`#peer-${key}`)?.addEventListener('input',event=>{work().peer[key]=event.target.value;persist();}));
  $('#exercise-form')?.addEventListener('submit',event=>{event.preventDefault();answerExercise($('#exercise-answer').value);});
  let dragged=null;
  document.querySelectorAll('.saved-seed').forEach(el=>{
    el.addEventListener('dragstart',event=>{dragged=el.dataset.seedId;el.classList.add('is-dragging');event.dataTransfer.setData('text/plain',dragged);});
    el.addEventListener('dragover',event=>event.preventDefault());
    el.addEventListener('drop',event=>{event.preventDefault();const a=work().seeds.findIndex(s=>s.id===dragged),b=work().seeds.findIndex(s=>s.id===el.dataset.seedId);if(a>=0&&b>=0&&a!==b){const seed=work().seeds.splice(a,1)[0];work().seeds.splice(b,0,seed);persist();render(false);}});
    el.addEventListener('dragend',()=>{dragged=null;el.classList.remove('is-dragging');});
  });
}

document.addEventListener('click',event=>{
  const b=event.target.closest('button,a');if(!b)return;
  if(b.dataset.page){event.preventDefault();go(b.dataset.page);return;}
  if(b.classList.contains('logo')){event.preventDefault();go('home');return;}
  if(b.dataset.preset!==undefined){chooseLesson(presetLesson(Number(b.dataset.preset)));return;}
  if(b.dataset.kind){chooseKind(b.dataset.kind);return;}
  if(b.dataset.question!==undefined){chooseQuestion(Number(b.dataset.question));return;}
  if(b.dataset.hint){const el=$('#answer');const start=el.selectionStart,end=el.selectionEnd;el.setRangeText(`${start&&el.value[start-1]!==' '?' ':''}${b.dataset.hint}`,start,end,'end');el.dispatchEvent(new Event('input'));el.focus({preventScroll:true});return;}
  if(b.dataset.editSeed){editSeedDialog(b.dataset.editSeed);return;}
  if(b.dataset.deleteSeed){const i=work().seeds.findIndex(s=>s.id===b.dataset.deleteSeed);const removed=work().seeds.splice(i,1)[0];persist();render(false);toast('Đã lấy một hạt khỏi giỏ.',()=>{work().seeds.splice(i,0,removed);persist();render(false);});return;}
  if(b.dataset.moveSeed){moveSeed(b.dataset.moveSeed,Number(b.dataset.direction));return;}
  if(b.dataset.peer!==undefined){updatePeer(Number(b.dataset.peer));return;}
  if(b.dataset.peerTip!==undefined){const r=peerRoles[Number(b.dataset.peerTip)];showDialog(r.title,`<p>${r.description}</p><div class="kind-example">${Number(b.dataset.peerTip)===0?'“Mình muốn kể về…”':Number(b.dataset.peerTip)===1?'“Mình nhớ nhất chi tiết…”':'“Mình thích… Bạn có thể kể thêm về… không?”'}</div>`);return;}
  if(b.dataset.issue!==undefined){selectedExercise=Number(b.dataset.issue);$('#exercise-card').innerHTML=exerciseMarkup(analysis.issues[selectedExercise]);document.querySelectorAll('[data-issue]').forEach(el=>el.classList.toggle('is-selected',el===b));$('#exercise-form')?.addEventListener('submit',event=>{event.preventDefault();answerExercise($('#exercise-answer').value);});return;}
  if(b.dataset.exerciseAnswer!==undefined){answerExercise(b.dataset.exerciseAnswer);return;}
  if(b.dataset.openDraft){const lesson=[...PRESETS.map((_,i)=>presetLesson(i)),...state.customLessons].find(l=>l.id===b.dataset.openDraft);if(lesson){chooseLesson(lesson);closeDialog();go('write');}return;}
  if(b.dataset.gardenSeed!==undefined){const s=work().seeds.slice(-4)[Number(b.dataset.gardenSeed)];if(s)showDialog('Một hạt ý tưởng của em',`${badge(s.kind)}<p class="kind-example">${e(s.text)}</p>${button('Trở lại giỏ hạt','start','secondary','seed')}`);else {const t=TYPES[Number(b.dataset.gardenSeed)];showDialog(`${t.name} · ${t.label}`,`<p>${t.description}</p><p class="kind-example">${e(t.example)}</p>${button('Gieo hạt đầu tiên','start','primary','seed')}`);}return;}
  switch(b.dataset.action){
    case 'start':if($('#panel').open)closeDialog();go('ideas');break;
    case 'go-talk':go('talk');break;
    case 'go-write':go('write');break;
    case 'save-seed':saveSeed();break;
    case 'prev-question':chooseQuestion(state.question-1);break;
    case 'next-question':chooseQuestion((state.question+1)%state.lesson.questions.length);break;
    case 'teacher':teacherDialog();break;
    case 'generate-questions':{const prompt=$('#lesson-prompt').value.trim();if(!prompt){$('#lesson-prompt').focus();return;}$('#teacher-questions').innerHTML=teacherQuestions(makeLesson(prompt).questions);toast('Đã tạo bộ gợi ý theo chủ đề. Cô/thầy có thể chỉnh từng câu.');break;}
    case 'drafts':draftsDialog();break;
    case 'close-dialog':closeDialog();break;
    case 'assemble':assemble();break;
    case 'check':runReview();break;
    case 'apply-exercise':applyAnswer();break;
    case 'finish':go('garden');toast('Câu chuyện của em đã được lưu vào khu vườn.');break;
    case 'finish-talk':work().spoken=true;persist();go('write');toast('Em đã tập kể và lắng nghe. Mình viết đoạn văn nhé!');break;
    case 'prev-peer':nextPeer(-1);break;
    case 'next-peer':nextPeer(1);break;
    case 'timer':toggleTimer();break;
    case 'reset-timer':stopTimer();seconds=60;$('#timer-display').textContent=formatTimer(seconds);$('[data-action="timer"]').innerHTML=icon('play');break;
    case 'read-seeds':speak(work().seeds.map(s=>s.text).join(' '));break;
    case 'read-paragraph':speak(work().paragraph);break;
    case 'rotate-left':scene?.rotateBy(-Math.PI/4);break;
    case 'rotate-right':scene?.rotateBy(Math.PI/4);break;
    case 'pause-scene':{const paused=!scene?.paused;scene?.setPaused(paused);b.innerHTML=icon(paused?'play':'pause');b.setAttribute('aria-pressed',paused);b.setAttribute('aria-label',paused?'Tiếp tục hạt chuyển động':'Tạm dừng hạt chuyển động');break;}
    case 'motion':state.motion=!state.motion;scene?.setReduced(state.motion);document.body.classList.toggle('reduce-motion',state.motion);$('#motion-label').textContent=state.motion?'tắt':'bật';b.setAttribute('aria-pressed',!state.motion);persist();break;
    case 'undo':if(undoAction){const fn=undoAction;undoAction=null;fn();toast('Đã hoàn tác thay đổi vừa rồi.');}break;
    case 'export-text':exportText();break;
    case 'export-json':download(exportWork(state),'mam-chu-bai-hoc.json','application/json;charset=utf-8');toast('Đã tạo tệp bài học gồm câu hỏi, hạt và đoạn văn.');break;
    case 'import':$('#import-file').click();break;
    case 'help':showDialog('Mình học như chăm một khu vườn.',`<div class="help-steps">${[['book','Chọn đề','Đọc đề cùng cô/thầy và hiểu điều mình sẽ viết.'],['seed','Gieo từng câu','Trả lời câu hỏi, chọn hạt nâu, đỏ hoặc hồng cho mỗi câu.'],['chat','Kể và lắng nghe','Kể cho bạn nghe, nghe lại và hỏi thêm một chi tiết.'],['pen','Viết thành đoạn','Sắp ý và viết bằng lời của riêng mình.'],['garden','Chăm chút','Làm bài tập từ chỗ cần sửa, rồi đọc lại cùng cô/thầy.']].map(([i,h,p])=>`<div><span>${icon(i)}</span><p><strong>${h}</strong>${p}</p></div>`).join('')}</div><details class="original-details"><summary>Phòng trải nghiệm hiệu ứng gốc</summary><p>Bản gốc vẫn giữ đầy đủ mô hình 3D, kéo/xoay, carousel, chuyển cảnh phóng sản phẩm, móc treo, lookbook và các thao tác ban đầu.</p><a class="button secondary" href="/original.html" target="_blank" rel="noopener">Mở bản gốc còn nguyên hiệu ứng ${icon('arrow')}</a></details>`);break;
  }
});
$('#panel').addEventListener('close',()=>{scene?.setSuspended(false);editSeed=null;});
$('#panel').addEventListener('click',event=>{if(event.target===$('#panel')){const r=$('#panel').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>2_000_000)throw new Error('Tệp quá lớn. Em chọn tệp bài học nhỏ hơn 2 MB nhé.');const data=importWork(await file.text());
    const restore=()=>{data.lesson.id=`import-${Date.now()}`;state.customLessons.push(data.lesson);state.works[data.lesson.id]=data.work;state.lesson=data.lesson;state.question=0;state.kind=data.lesson.questions[0].kind;analysis=null;persist();closeDialog();go('write');toast('Đã mở bài học. Những bài đang có vẫn được giữ lại.');};restore();
  }catch(error){toast(error.message||'Chưa đọc được tệp. Em kiểm tra lại tệp bài học nhé.');}finally{event.target.value='';}
});
$('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main').focus();});
addEventListener('hashchange',()=>go(location.hash.slice(1),{focus:false}));
addEventListener('resize',()=>{if(state.page==='talk')layoutPeers(false);});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{state.motion=event.matches;scene?.setReduced(state.motion);document.body.classList.toggle('reduce-motion',state.motion);$('#motion-label').textContent=state.motion?'tắt':'bật';persist();});
addEventListener('beforeunload',()=>{saveState(state);window.speechSynthesis?.cancel();});
render(false);
scene=new SeedScene($('#seed-stage'),{onSelect:index=>chooseKind(TYPES[index].id),onOpen:()=>{const t=typeOf(state.kind);showDialog(`${t.name} · ${t.label}`,`<p>${t.description}</p><div class="kind-example">${e(t.example)}</div><p class="muted">Đây là ví dụ để hiểu loại câu. Em hãy kể điều em thật sự quan sát, trải qua hoặc cảm nhận.</p>${button('Gieo một câu của em','start','primary','seed')}`);},onReady:()=>{document.body.classList.add('seeds-ready');scene.setVisible(['home','ideas'].includes(state.page));scene.setReduced(state.motion);scene.select(TYPES.findIndex(t=>t.id===state.kind),state.page==='ideas');scene.setGrowth(work().seeds.length);},onError:()=>{$('#seed-stage').innerHTML=`<div class="seed-fallback">${TYPES.map(t=>seedMark(t.id)).join('')}</div>`;toast('Thiết bị đang dùng hình hạt tĩnh. Em vẫn có thể học và viết đầy đủ nhé.');}});
if(import.meta.env.DEV)window.__mamChu={scene,state};
go(location.hash.slice(1)||state.page,{animate:false,focus:false});
document.fonts.ready.then(()=>{if(!state.motion&&state.page==='home')gsap.from('.hero-content>*',{y:22,autoAlpha:0,stagger:.08,duration:.8,ease:'power3.out'});});
