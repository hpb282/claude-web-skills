import '@fontsource-variable/dm-sans';
import './style.css';
import gsap from 'gsap';
import {Flip} from 'gsap/Flip';
import {SeedScene} from '../learning/seed-scene.js';
import {TYPES} from '../learning/lessons.js';
import {reviewParagraph, checkExercise, applyExercise} from '../learning/checker.js';
import {icon, escapeHTML as e} from '../learning/icons.js';
import {slides, sentences} from './content.js';
import {templates, teacherExample} from './templates.js';

gsap.registerPlugin(Flip);
const $=selector=>document.querySelector(selector);
const mount=$('#presentation');
let index=Math.max(0,Math.min(slides.length-1,Number(location.hash.match(/slide-(\d+)/u)?.[1]||1)-1));
let busy=false, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene=null, entrance=null, transition=null, demoAnimation=null, activeKind=0;
let reviewText='em có một chiếc cặp xinh sắn', chosenAnswer=null;
let review=reviewParagraph(reviewText);

mount.innerHTML=`<div class="stage-shell"><main id="deck" tabindex="-1" aria-label="Bài thuyết trình Mầm chữ" aria-roledescription="trình chiếu">${slides.map((s,i)=>`<section class="slide slide-${s.mode}" data-slide="${i}" aria-labelledby="slide-title-${i}" aria-hidden="${i!==index}" ${i!==index?'hidden inert':''}><header class="slide-top"><span class="slide-brand">${icon('garden')} mầm chữ</span><span>${e(s.chapter)}</span></header><div class="slide-number">${String(i+1).padStart(2,'0')} / ${slides.length}</div>${templates[s.mode]()}</section>`).join('')}<div class="transition-layer" aria-hidden="true"><div class="curtain-set"><div class="curtain curtain-left"><span class="curtain-medallion">${icon('garden')}</span></div><div class="curtain curtain-right"></div></div><div class="blind-set" hidden>${Array.from({length:8},()=>'<div class="blind"></div>').join('')}</div><div class="door-set" hidden><div class="door door-left"><i class="door-handle"></i></div><div class="door door-right"><i class="door-handle"></i></div></div><div class="transition-fade" hidden></div></div></main></div><nav class="controls" aria-label="Điều khiển trình chiếu"><button data-control="previous" aria-label="Slide trước" title="Slide trước (←)">${icon('left')}</button><span class="counter" id="counter"></span><button class="nav-next" data-control="next" aria-label="Slide tiếp theo" title="Slide tiếp theo (→ hoặc Space)"><span class="control-text">Tiếp theo</span>${icon('right')}</button><div class="progress-track" aria-hidden="true"><div class="progress-fill"></div></div><span class="control-spacer"></span><span class="key-hint">← → đổi slide</span><button data-control="replay" aria-label="Phát lại hiệu ứng slide" title="Phát lại hiệu ứng">${icon('rotate')}</button><button data-control="overview" title="Mục lục (O)">${icon('book')}<span class="control-text">Mục lục</span></button><button data-control="notes" title="Ghi chú thuyết trình (N)">${icon('pen')}<span class="control-text">Ghi chú</span></button><button data-control="motion" aria-pressed="${reduced}" title="Giảm chuyển động (M)">${icon('pause')}<span class="control-text">Giảm chuyển động</span></button><button data-control="fullscreen" aria-label="Toàn màn hình" title="Toàn màn hình (F)"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg></button></nav><p class="sr-only" id="announce" aria-live="polite"></p><dialog id="overview" aria-labelledby="overview-title"><div class="dialog-title"><h2 id="overview-title">Hành trình Mầm chữ</h2><button data-close="overview" aria-label="Đóng mục lục">${icon('close')}</button></div><div class="overview-grid">${slides.map((s,i)=>`<button data-jump="${i}" aria-current="${i===index}"><b>${String(i+1).padStart(2,'0')}</b><span>${e(s.title)}</span></button>`).join('')}</div></dialog><dialog id="notes" aria-labelledby="notes-title"><div class="dialog-title"><h2 id="notes-title">Ghi chú thuyết trình</h2><button data-close="notes" aria-label="Đóng ghi chú">${icon('close')}</button></div><span class="notes-time" id="notes-time"></span><h3 id="notes-slide"></h3><p id="notes-text"></p><p class="notes-tip">Ghi chú hiện trên màn hình này. Đóng cửa sổ trước khi tiếp tục trình chiếu với khán giả.</p></dialog><div class="runtime-message" role="status" hidden></div>`;

const elements=[...document.querySelectorAll('.slide')];
elements.forEach((el,i)=>el.querySelector('h1').id=`slide-title-${i}`);
const sceneElement=document.createElement('div');sceneElement.id='presentation-scene';sceneElement.setAttribute('aria-label','Ba hạt mầm 3D, kéo để xoay');
let messageTimeout;
function message(text){const el=$('.runtime-message');el.textContent=text;el.hidden=false;clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>el.hidden=true,4500);}
function resize(){
  const controlsHeight=$('.controls').getBoundingClientRect().height;
  const scale=Math.max(.1,Math.min((innerWidth-24)/1600,(innerHeight-controlsHeight-38)/900));
  mount.style.setProperty('--deck-scale',scale);scene?.resize();
}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe($('.controls'));
window.addEventListener('resize',resize);

function updateControls(){
  $('#counter').textContent=`${String(index+1).padStart(2,'0')} / ${slides.length}`;
  $('[data-control=previous]').disabled=index===0;
  $('[data-control=next]').disabled=index===slides.length-1;
  $('[data-control=motion]').setAttribute('aria-pressed',reduced);
  document.querySelectorAll('[data-jump]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.jump)===index));
  gsap.set('.progress-fill',{scaleX:(index+1)/slides.length});
  $('#announce').textContent=`Slide ${index+1} trên ${slides.length}: ${slides[index].title}`;
}

function positionScene(){
  const slot=elements[index].querySelector('[data-scene-slot]');
  if(slot){slot.append(sceneElement);scene?.setVisible(true);scene?.resize();scene?.select(slides[index].mode==='seeds'?activeKind:0,false);scene?.setGrowth(slides[index].mode==='closing'?7:0);if(scene?.renderer)slot.classList.add('has-webgl');}
  else scene?.setVisible(false);
}

function enter(){
  entrance?.progress(1);entrance?.kill();
  const active=elements[index],targets=active.querySelectorAll('[data-reveal]');
  gsap.set(targets,{clearProps:'transform,opacity,visibility'});
  if(reduced)return;
  entrance=gsap.timeline({defaults:{ease:'power3.out',duration:.75}});
  entrance.fromTo(targets,{y:32,autoAlpha:0},{y:0,autoAlpha:1,stagger:.075,clearProps:'transform,opacity,visibility'},0);
  if(slides[index].mode==='cover')entrance.fromTo('.cover-art .open-book',{y:60,rotationX:12,autoAlpha:0},{y:0,rotationX:0,autoAlpha:1,duration:1.25},.1);
  if(slides[index].mode==='garden'){
    entrance.fromTo('.hanging-examples',{y:-65,rotation:3},{y:0,rotation:0,duration:1.2,ease:'power3.out'},.2);
    entrance.fromTo('.garden-landscape',{scale:1},{scale:1.035,duration:7,ease:'none'},0);
  }
}

function activate(next){
  demoAnimation?.progress(1);demoAnimation?.kill();demoAnimation=null;
  entrance?.progress(1);entrance?.kill();
  elements[index].hidden=true;elements[index].inert=true;elements[index].setAttribute('aria-hidden','true');
  index=next;elements[index].hidden=false;elements[index].inert=false;elements[index].setAttribute('aria-hidden','false');
  history.replaceState(null,'',`#slide-${index+1}`);document.title=`Mầm chữ · ${index+1}/${slides.length} · ${slides[index].title}`;
  positionScene();updateControls();enter();
}

function layer(kind){
  const names={curtain:'.curtain-set',slats:'.blind-set',doors:'.door-set',fade:'.transition-fade'};
  Object.values(names).forEach(s=>$(s).hidden=s!==names[kind]);
  gsap.set('.transition-layer',{autoAlpha:1});
}

function go(next,{force=false}={}){
  next=Math.max(0,Math.min(slides.length-1,next));
  if(busy||(!force&&next===index))return;
  busy=true;mount.setAttribute('aria-busy','true');
  const done=()=>{gsap.set('.transition-layer',{autoAlpha:0});busy=false;mount.removeAttribute('aria-busy');};
  transition?.kill();
  transition=gsap.timeline({defaults:{ease:'power3.inOut'},onComplete:done});
  if(reduced){layer('fade');gsap.set('.transition-fade',{autoAlpha:0});transition.to('.transition-fade',{autoAlpha:1,duration:.09}).call(()=>activate(next)).to('.transition-fade',{autoAlpha:0,duration:.1});return;}
  const kind=slides[next].transition;layer(kind);
  if(kind==='curtain'){
    gsap.set('.curtain-left',{xPercent:-103});gsap.set('.curtain-right',{xPercent:103});
    transition.to('.curtain-left',{xPercent:0,duration:.58},0).to('.curtain-right',{xPercent:0,duration:.58},0).call(()=>activate(next),[],.6).to('.curtain-left',{xPercent:-103,duration:.85},.74).to('.curtain-right',{xPercent:103,duration:.85},.74);
  }else if(kind==='slats'){
    gsap.set('.blind',{yPercent:-103});
    transition.to('.blind',{yPercent:0,duration:.48,stagger:{each:.035,from:'center'}},0).call(()=>activate(next),[],.78).to('.blind',{yPercent:103,duration:.65,stagger:{each:.035,from:'edges'}},.88);
  }else{
    gsap.set('.door-left',{xPercent:-103,rotationY:-15});gsap.set('.door-right',{xPercent:103,rotationY:15});
    transition.to('.door-left',{xPercent:0,rotationY:0,duration:.58},0).to('.door-right',{xPercent:0,rotationY:0,duration:.58},0).call(()=>activate(next),[],.62).to('.door-left',{xPercent:-103,rotationY:-35,duration:.8},.76).to('.door-right',{xPercent:103,rotationY:35,duration:.8},.76);
  }
}

function showNotes(){
  $('#notes-time').textContent=`Slide ${index+1} / ${slides.length} · Gợi ý ${slides[index].minutes}`;
  $('#notes-slide').textContent=slides[index].title;$('#notes-text').textContent=slides[index].notes;$('#notes').showModal();
}
async function fullscreen(){
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{message('Trình duyệt chưa cho phép toàn màn hình. Bạn có thể dùng phím F11.');}
}
function toggleMotion(){
  reduced=!reduced;scene?.setReduced(reduced);scene?.setPaused(reduced);entrance?.progress(1);updateControls();
  message(reduced?'Đã giảm chuyển động. Hiệu ứng chuyển cảnh sẽ rút gọn.':'Đã bật lại hiệu ứng chuyển cảnh và hạt 3D.');
}

function selectSeed(kind){
  activeKind=kind;scene?.select(kind,false);
  document.querySelectorAll('[data-seed-kind]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.seedKind)===kind));
  $('#seed-example').innerHTML=`<span>Ví dụ · ${e(TYPES[kind].label)}</span><p>${e(sentences[kind])}</p>`;
  if(!reduced)gsap.fromTo('#seed-example',{y:12,autoAlpha:0},{y:0,autoAlpha:1,duration:.35,clearProps:'transform,opacity,visibility'});
}
function assemble(){
  const board=$('.composition-board'),button=$('#assemble-demo'),pieces=[...document.querySelectorAll('.sentence-piece')];
  if(board.classList.contains('is-assembled')){
    pieces.forEach(p=>$('#sentence-pool').append(p));board.classList.remove('is-assembled');$('#paragraph-target').innerHTML='<span class="target-placeholder">Những câu văn đang chờ em kết nối…</span>';button.innerHTML=`${icon('pen')} Ghép thành đoạn`;return;
  }
  const state=Flip.getState(pieces);$('#paragraph-target').replaceChildren();
  pieces.forEach((p,i)=>{$('#paragraph-target').append(p,document.createTextNode(i<pieces.length-1?' ':''));});
  board.classList.add('is-assembled');button.innerHTML=`${icon('rotate')} Xem lại các hạt`;
  if(!reduced)demoAnimation=Flip.from(state,{duration:1.1,ease:'power3.inOut',absolute:true,scale:true,stagger:.07});
}

function renderReview(){
  review=reviewParagraph(reviewText);chosenAnswer=null;
  const issue=review.issues[0],target=$('#review-demo');
  let marked=e(reviewText);
  if(issue)marked=e(reviewText.slice(0,issue.start))+`<mark>${e(issue.original)||' '}</mark>`+e(reviewText.slice(issue.end));
  target.innerHTML=`<div class="demo-source">${marked}</div>${issue?`<p class="exercise-count">Còn ${review.issues.length} chỗ thuộc các nhóm đang kiểm tra</p><h3 class="demo-question">${e(issue.question)}</h3><div class="answer-options" role="group" aria-label="Chọn cách sửa">${(issue.rule==='capital'?['e','E']:issue.rule==='spelling'?[issue.original,issue.replacement]:[',','.']).map(a=>`<button data-answer="${e(a)}" aria-pressed="false">${e(a)}</button>`).join('')}</div><p class="demo-feedback" role="status">Em thử chọn một cách sửa.</p><button class="demo-button" id="apply-demo" hidden>${icon('check')} Dùng phần sửa này</button>`:`<div class="all-done">${icon('garden')}<strong>Một câu văn đã được chăm chút!</strong><p>Em vẫn đọc lại để xem mình còn muốn kể thêm điều gì.</p></div>`}`;
}

mount.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.control){
    const actions={previous:()=>go(index-1),next:()=>go(index+1),replay:()=>go(index,{force:true}),overview:()=>$('#overview').showModal(),notes:showNotes,motion:toggleMotion,fullscreen};actions[b.dataset.control]?.();return;
  }
  if(b.dataset.close){$(`#${b.dataset.close}`).close();return;}
  if(b.dataset.jump!==undefined){$('#overview').close();go(Number(b.dataset.jump));return;}
  if(b.dataset.topic!==undefined){
    const n=Number(b.dataset.topic);document.querySelectorAll('[data-topic]').forEach(el=>el.setAttribute('aria-pressed',el===b));$('#teacher-example').innerHTML=teacherExample(n);
    if(!reduced)gsap.fromTo('#teacher-example',{y:10,autoAlpha:0},{y:0,autoAlpha:1,duration:.3,clearProps:'transform,opacity,visibility'});return;
  }
  if(b.dataset.seedKind!==undefined){selectSeed(Number(b.dataset.seedKind));return;}
  if(b.id==='assemble-demo'){assemble();return;}
  if(b.id==='reset-review'){reviewText='em có một chiếc cặp xinh sắn';renderReview();return;}
  if(b.dataset.answer!==undefined){
    chosenAnswer=b.dataset.answer;const correct=checkExercise(review.issues[0],chosenAnswer);
    document.querySelectorAll('[data-answer]').forEach(el=>el.setAttribute('aria-pressed',el===b));
    $('.demo-feedback').textContent=correct?'Em đã tìm được cách sửa. Em tự chọn dùng trong bài nhé.':'Em đọc lại lời gợi ý và thử thêm lần nữa nhé.';
    $('.demo-feedback').classList.toggle('good',correct);$('#apply-demo').hidden=!correct;return;
  }
  if(b.id==='apply-demo'){
    const result=applyExercise(review,review.issues[0],chosenAnswer,reviewText);if(result.ok){reviewText=result.text;renderReview();}return;
  }
});

document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,[contenteditable=true]'))return;
  if(document.querySelector('dialog[open]'))return;
  const key=event.key.toLowerCase();
  if(['arrowright','pagedown'].includes(key)||(key===' '&&!event.target.closest('button,a'))){event.preventDefault();go(index+1);}
  else if(['arrowleft','pageup'].includes(key)){event.preventDefault();go(index-1);}
  else if(key==='home'){event.preventDefault();go(0);}
  else if(key==='end'){event.preventDefault();go(slides.length-1);}
  else if(key==='f'){event.preventDefault();fullscreen();}
  else if(key==='n')showNotes();else if(key==='o')$('#overview').showModal();else if(key==='m')toggleMotion();
});
let swipe=null;
$('#deck').addEventListener('pointerdown',event=>{if(event.target.closest('button,a,#presentation-scene'))return;swipe={x:event.clientX,y:event.clientY};});
$('#deck').addEventListener('pointerup',event=>{if(!swipe)return;const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;swipe=null;if(Math.abs(dx)>70&&Math.abs(dy)<50)go(index+(dx<0?1:-1));});
window.addEventListener('hashchange',()=>{const n=Number(location.hash.match(/slide-(\d+)/u)?.[1]);if(n)go(n-1);});
const mm=gsap.matchMedia();
mm.add({reduce:'(prefers-reduced-motion: reduce)',normal:'(prefers-reduced-motion: no-preference)'},ctx=>{reduced=ctx.conditions.reduce;scene?.setReduced(reduced);updateControls();});
window.addEventListener('pagehide',()=>{transition?.kill();entrance?.kill();demoAnimation?.kill();scene?.setVisible(false);scene?.setPaused(true);mm.revert();resizeObserver.disconnect();});

resize();renderReview();
const firstSlot=elements[index].querySelector('[data-scene-slot]')||elements[0].querySelector('[data-scene-slot]');firstSlot.append(sceneElement);
scene=new SeedScene(sceneElement,{
  onSelect:kind=>{if(slides[index].mode==='seeds')selectSeed(kind);},onOpen:()=>{},
  onError:()=>{sceneElement.hidden=true;document.body.classList.add('webgl-unavailable');},
  onReady:()=>{document.body.classList.add('seeds-ready');positionScene();},
});
scene.setReduced(reduced);scene.setPaused(reduced);positionScene();updateControls();
document.fonts.ready.then(()=>{
if(reduced){enter();document.body.classList.add('deck-ready');}
else{
  busy=true;layer('curtain');gsap.set('.curtain',{xPercent:0});
  transition=gsap.timeline({onComplete:()=>{busy=false;gsap.set('.transition-layer',{autoAlpha:0});document.body.classList.add('deck-ready');}});
  transition.to('.curtain-left',{xPercent:-103,duration:1.4,ease:'power3.inOut'},.15).to('.curtain-right',{xPercent:103,duration:1.4,ease:'power3.inOut'},.15).call(enter,[],.6);
}
});
