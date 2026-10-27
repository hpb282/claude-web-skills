// Kiểm tra dữ liệu bài học: mỗi tiếng đúng âm/vần của dòng; mọi từ, câu chỉ dùng âm, vần đã học tới nhóm đó.
// Chạy: node tools/check-data.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '../src/js/viet.js'));
require(path.join(__dirname, '../src/js/data.js'));
const VV = global.window.VV;
const D = VV.data;
const { parse, checkText, compose } = VV.viet;

let problems = 0;
function fail(msg) { problems++; console.log('  ✗ ' + msg); }

// 1. Bộ tách tiếng
[['bàn', 'b', 'an', 'huyen'], ['quạt', 'qu', 'at', 'nang'], ['giun', 'gi', 'un', 'ngang'], ['gì', 'gi', 'i', 'huyen'],
 ['nghe', 'ngh', 'e', 'ngang'], ['ổi', '', 'ôi', 'hoi'], ['trăng', 'tr', 'ăng', 'ngang'], ['cửa', 'c', 'ưa', 'hoi'],
 ['giấc', 'gi', 'âc', 'sac'], ['chuối', 'ch', 'uôi', 'sac'], ['giếng', 'gi', 'iêng', 'sac'], ['yêu', '', 'yêu', 'ngang'],
 ['khuyết', 'kh', 'uyêt', 'sac'], ['ngoằn', 'ng', 'oăn', 'huyen'], ['giường', 'gi', 'ương', 'huyen']
].forEach(([w, i, v, t]) => {
  const p = parse(w);
  if (!p || p.initial !== i || p.van !== v || p.tone !== t) fail(`parse(${w}) = ${JSON.stringify(p)}`);
});
// 2. Ghép tiếng (kiểu dấu mới và cũ)
[['b', 'an', 'huyen', 'bàn'], ['m', 'ây', 'ngang', 'mây'], ['t', 'ai', 'sac', 'tái'], ['c', 'ưa', 'hoi', 'cửa'],
 ['tr', 'âu', 'ngang', 'trâu'], ['qu', 'at', 'nang', 'quạt'], ['ng', 'oai', 'huyen', 'ngoài'], ['h', 'ươu', 'ngang', 'hươu'],
 ['h', 'oa', 'huyen', 'hoà'], ['th', 'uy', 'hoi', 'thuỷ'], ['kh', 'oe', 'hoi', 'khoẻ']].forEach(([i, v, t, want]) => {
  const got = compose(i, v, t);
  if (got !== want) fail(`compose(${i},${v},${t}) = ${got}, cần ${want}`);
});
VV.viet.setToneStyle('cu');
if (compose('h', 'oa', 'huyen') !== 'hòa') fail('kiểu dấu cũ: hòa');
VV.viet.setToneStyle('moi');

// 3. Dữ liệu từng nhóm theo thứ tự mặc định
const seen = {};
D.GROUPS.forEach(g => {
  const kho = D.khoAt(g.id, []);
  g.vans.forEach(v => {
    if (seen[v]) fail(`"${v}" có ở cả nhóm ${seen[v]} và ${g.id}`);
    seen[v] = g.id;
    const list = g.words[v] || [];
    if (list.length < 2 || list.length > 8) fail(`nhóm ${g.id} (${g.title}) ${v}: cần 2 đến 8 tiếng, có ${list.length}`);
    list.forEach(w => {
      if (!D.matches(w, v)) fail(`nhóm ${g.id}: "${w}" không thuộc ${D.unitLabel(v)} (${JSON.stringify(parse(w))})`);
      const r = checkText(w, kho);
      if (r.outside.length) fail(`nhóm ${g.id}: tiếng "${w}" dùng âm/vần chưa học`);
    });
  });
  if (g.phrases.length < 2) fail(`nhóm ${g.id}: cần ít nhất 2 từ ngữ`);
  if (g.kind === 'van' && (!g.sentences.length || !g.fill.length)) fail(`nhóm ${g.id}: nhóm vần cần có câu và câu điền từ`);
  const texts = [].concat(g.phrases, g.sentences, g.fill.map(f => f.text.replace('___', f.answer)));
  texts.forEach(t => {
    const r = checkText(t, kho);
    if (r.outside.length) fail(`nhóm ${g.id} (${g.title}): "${t}" có tiếng chưa học: ${r.outside.join(', ')}`);
  });
  g.fill.forEach(f => {
    if (f.text.indexOf('___') === -1) fail(`nhóm ${g.id}: câu điền từ thiếu ___: ${f.text}`);
    if (f.options.indexOf(f.answer) === -1) fail(`nhóm ${g.id}: đáp án không nằm trong lựa chọn: ${f.text}`);
    if (!D.unitOf(g, f.answer)) fail(`nhóm ${g.id}: đáp án "${f.answer}" không thuộc âm/vần của nhóm`);
  });
});

console.log(problems ? `\n${problems} lỗi` : `Dữ liệu hợp lệ: ${D.GROUPS.length} nhóm, ${D.allVans().length} âm và vần; mọi từ, câu chỉ dùng âm, vần đã học.`);
process.exit(problems ? 1 : 0);
