// Deliberately local, explainable review rules. No student text is sent away.
// Style suggestions are kept separate from detectable writing conventions.
export function splitSentences(text){
  if(!text?.trim())return [];
  // Segmenters often keep a lowercase sentence after a full stop together
  // with the previous sentence. Those are exactly the starts pupils review.
  const result=[];let cursor=0;
  const push=end=>{const raw=text.slice(cursor,end);if(raw.trim())result.push({text:raw.trim(),start:cursor+raw.search(/\S/u)});cursor=end;};
  for(const m of text.matchAll(/[.!?…]+(?:[”’"')\]]+)?/gu)){
    if(m[0]==='.'&&/\d/u.test(text[m.index-1]||'')&&/\d/u.test(text[m.index+1]||''))continue;
    const token=text.slice(0,m.index).match(/[\p{L}.]+$/u)?.[0];
    if(m[0]==='.'&&['TP','ThS','TS','PGS','GS','v.v','v.d'].includes(token))continue;
    push(m.index+m[0].length);
  }
  push(text.length);return result;
}
export function wordCount(text){return (text.trim().match(/[\p{L}\p{N}]+/gu)||[]).length;}
export function guessKind(text){
  if(/(?:em|tôi|mình|chúng em)\s+(?:rất\s+|thật\s+|cảm thấy\s+)?(?:yêu|thích|vui|buồn|biết ơn|tự hào|mong|nhớ|hạnh phúc|xúc động|hồi hộp)/iu.test(text))return 'feel';
  if(/xanh|đỏ|hồng|vàng|trắng|đen|màu|mượt|cao|thấp|tròn|nhỏ|to lớn|ấm áp|hiền hậu|rực rỡ|xào xạc|ríu rít|thoang thoảng|xinh|lấp lánh|mềm|dài|ngắn/iu.test(text))return 'describe';
  return 'tell';
}
const spelling=[
  ['xinh sắn','xinh xắn'],['sạch xẽ','sạch sẽ'],['xắp xếp','sắp xếp'],['chăm trỉ','chăm chỉ'],
  ['ngỉ ngơi','nghỉ ngơi'],['giúp đở','giúp đỡ'],['cảm súc','cảm xúc'],['xân trường','sân trường'],['dử gìn','giữ gìn'],
];
const accidentalRepeat=new Set(['em','tôi','mình','bạn','của','và','là','thì','đã','đang','sẽ','rất','ở','có','với','được','nhưng','vì']);
const normalize=text=>text.normalize('NFC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('vi');
const capitalize=text=>text.replace(/\p{L}/u,c=>c.toLocaleUpperCase('vi'));
export function reviewParagraph(source,lesson={}){
  const issues=[];const suggestions=[];const strengths=[];
  const add=(rule,start,end,replacement,title,why,question,kind='rewrite',options=[])=>{
    issues.push({id:`${rule}-${start}`,rule,start,end,original:source.slice(start,end),replacement,title,why,question,kind,options});
  };
  if(!source.trim())return {source,issues,suggestions,strengths,sentences:[],empty:true};
  const sentences=splitSentences(source);
  for(const sentence of sentences){
    const first=sentence.text.match(/\p{L}/u);
    if(first&&first[0]!==first[0].toLocaleUpperCase('vi')){
      const start=sentence.start+first.index;
      add('capital',start,start+first[0].length,first[0].toLocaleUpperCase('vi'),'Chữ đầu câu cần viết hoa','Đầu mỗi câu, em viết hoa chữ cái đầu tiên.',`Em hãy viết hoa chữ “${first[0]}”.`,'rewrite');
    }
    if(wordCount(sentence.text)>35)suggestions.push({title:'Câu này có thể đọc dễ hơn',excerpt:sentence.text,body:'Em đọc thành tiếng rồi tìm chỗ có thể ngắt thành hai câu. Giữ nguyên ý em muốn kể nhé.'});
  }
  const endingAt=source.trimEnd().length-(source.trimEnd().match(/[”’"')\]]+$/u)?.[0].length||0);
  const unquoted=source.trim().replace(/[”’"')\]]+$/u,'');
  if(unquoted&&!/[.!?…]$/u.test(unquoted)){
    add('ending',endingAt,endingAt,'.','Em thêm dấu kết thúc câu nhé','Dấu chấm, dấu hỏi hoặc dấu chấm than giúp người đọc biết câu đã kết thúc.','Chọn một dấu để kết thúc câu cuối của em.','ending',['.','?','!']);
  }
  for(const m of source.matchAll(/[^\S\n]{2,}/gu))add('spacing',m.index,m.index+m[0].length,' ','Hai từ chỉ cần một khoảng trắng','Một khoảng trắng giữa các từ giúp đoạn văn gọn, dễ đọc.','Gõ một dấu cách để thay khoảng trắng thừa.','space');
  for(const m of source.matchAll(/\s+([,;:.!?])/gu)){
    if(issues.some(i=>i.rule==='spacing'&&i.start===m.index))continue;
    add('before-punctuation',m.index,m.index+m[0].length,m[1],'Dấu câu đứng sát từ phía trước','Em bỏ khoảng trắng ngay trước dấu câu.',`Viết lại phần “${m[0]}” chỉ giữ dấu câu.`);
  }
  for(const m of source.matchAll(/([,;:!?]|\.(?!\p{N}))(?=\p{L})/gu))add('after-punctuation',m.index,m.index+m[0].length,`${m[0]} `,'Thêm khoảng trắng sau dấu câu','Sau dấu câu, em để một khoảng trắng rồi viết tiếp.','Giữ dấu câu và thêm một khoảng trắng sau nó.','space-after');
  for(const [wrong,right] of spelling){
    const escaped=wrong.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`,'giu');
    for(const m of source.matchAll(re)){
      const correct=m[0][0]===m[0][0].toLocaleUpperCase('vi')?capitalize(right):right;
      add('spelling',m.index,m.index+m[0].length,correct,'Mình xem lại cách viết từ này','Đối chiếu cách viết của từ và đọc lại trong câu. Nếu đây là tên riêng, em hãy hỏi cô/thầy.',`Trong câu của em, từ nào có cách viết phù hợp?`,'choice',[correct,m[0]]);
    }
  }
  const tokens=[...source.matchAll(/[\p{L}\p{M}]+/gu)];
  for(let i=1;i<tokens.length;i++){
    const a=tokens[i-1],b=tokens[i],word=normalize(b[0]);
    if(word===normalize(a[0])&&accidentalRepeat.has(word)&&/^\s+$/u.test(source.slice(a.index+a[0].length,b.index))){
      add('repeated',a.index,b.index+b[0].length,a[0],'Có một từ xuất hiện hai lần liền nhau','Em đọc lại xem mình có gõ thừa một từ không.',`Viết lại “${source.slice(a.index,b.index+b[0].length)}” để chỉ còn một từ.`);
    }
  }
  const kinds=sentences.map(s=>guessKind(s.text));
  const feeling=sentences.find((s,i)=>kinds[i]==='feel');
  const detail=sentences.find((s,i)=>kinds[i]==='describe');
  if(detail)strengths.push({title:'Em đã có một chi tiết để người đọc hình dung',excerpt:detail.text});
  if(feeling)strengths.push({title:'Em đã chia sẻ cảm xúc của mình',excerpt:feeling.text});
  if(!strengths.length&&sentences.length)strengths.push({title:'Em đã viết được ý tưởng thành lời',excerpt:sentences[0].text});
  if(sentences.length<3)suggestions.push({title:'Câu chuyện của em còn có thể lớn thêm',body:'Em thử kể thêm một việc, tả một chi tiết hoặc nói rõ cảm xúc. Đây là gợi ý mở rộng, không phải lỗi.'});
  if(!detail&&sentences.length>=3)suggestions.push({title:'Một chi tiết nhỏ làm câu chuyện rõ hơn',body:'Em có muốn thêm màu sắc, âm thanh, dáng vẻ hoặc một việc làm cụ thể không?'});
  if(!feeling&&/tình cảm|cảm nhận|cảm xúc/iu.test(lesson.prompt||''))suggestions.push({title:'Em muốn gửi gắm cảm xúc gì?',body:'Em có thể thêm suy nghĩ hoặc tình cảm của chính mình. Em quyết định cách nói phù hợp với câu chuyện.'});
  issues.sort((a,b)=>a.start-b.start||a.rule.localeCompare(b.rule));
  return {source,issues,suggestions,strengths:strengths.slice(0,2),sentences,empty:false};
}
export function checkExercise(issue,answer){
  if(issue.kind==='ending')return /^[.!?]$/u.test(answer.trim());
  if(issue.kind==='space')return answer===' ';
  if(issue.kind==='space-after')return answer===issue.replacement;
  if(issue.rule==='capital')return answer.trim()===issue.replacement;
  return normalize(answer)===normalize(issue.replacement);
}
export function applyExercise(review,issue,answer,currentText){
  if(currentText!==review.source)return {ok:false,reason:'Bài đã thay đổi. Em kiểm tra lại trước khi dùng gợi ý nhé.'};
  if(!checkExercise(issue,answer))return {ok:false,reason:'Em đọc lại lời gợi ý rồi thử thêm lần nữa nhé.'};
  const replacement=issue.kind==='ending'?answer.trim():issue.replacement;
  return {ok:true,text:currentText.slice(0,issue.start)+replacement+currentText.slice(issue.end)};
}
