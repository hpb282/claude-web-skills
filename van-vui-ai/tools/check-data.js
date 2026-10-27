// Kiểm tra dữ liệu: mỗi tiếng trong nhóm k chỉ dùng vần mở hoặc vần của nhóm <= k.
// Chạy: node tools/check-data.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '../src/js/viet.js'));
require(path.join(__dirname, '../src/js/data.js'));
const VV = global.window.VV;
const { GROUPS, BASE_VANS, vansUpTo } = VV.data;
const { parse, checkText, compose } = VV.viet;

let problems = 0;
function fail(msg) { problems++; console.log('  ✗ ' + msg); }

// 1. Bộ tách tiếng
const cases = [
  ['bàn', '', 'an', 'huyen'], ['quạt', 'qu', 'at', 'nang'], ['giun', 'gi', 'un', 'ngang'],
  ['gì', 'gi', 'i', 'huyen'], ['nghe', 'ngh', 'e', 'ngang'], ['ổi', '', 'ôi', 'hoi'],
  ['trăng', 'tr', 'ăng', 'ngang'], ['cửa', 'c', 'ưa', 'hoi'], ['giấc', 'gi', 'âc', 'sac'],
  ['chuối', 'ch', 'uôi', 'sac']
];
cases.forEach(([w, i, v, t]) => {
  const p = parse(w);
  const ini = i || (w === 'bàn' ? 'b' : '');
  const want = w === 'bàn' ? 'b' : i;
  if (!p || p.initial !== want || p.van !== v || p.tone !== t) fail(`parse(${w}) = ${JSON.stringify(p)}`);
});
// 2. Ghép tiếng
[['b', 'an', 'huyen', 'bàn'], ['m', 'ây', 'ngang', 'mây'], ['t', 'ai', 'sac', 'tái'], ['c', 'ưa', 'hoi', 'cửa'],
 ['tr', 'âu', 'ngang', 'trâu'], ['qu', 'at', 'nang', 'quạt'], ['m', 'ăt', 'sac', 'mắt'], ['c', 'au', 'sac', 'cáu'],
 ['m', 'ia', 'sac', 'mía']].forEach(([i, v, t, want]) => {
  const got = compose(i, v, t);
  if (got !== want) fail(`compose(${i},${v},${t}) = ${got}, cần ${want}`);
});

// 3. Dữ liệu nhóm vần
GROUPS.forEach(g => {
  const kho = { vans: new Set(BASE_VANS.concat(vansUpTo(g.id))), extra: new Set() };
  g.vans.forEach(v => {
    const list = g.words[v] || [];
    if (list.length !== 6) fail(`nhóm ${g.id} vần ${v}: cần 6 tiếng, có ${list.length}`);
    list.forEach(w => {
      const p = parse(w);
      if (!p || p.van !== v) fail(`nhóm ${g.id}: "${w}" không thuộc vần ${v} (${p && p.van})`);
    });
  });
  const texts = [].concat(g.phrases, g.sentences, g.fill.map(f => f.text.replace('___', f.answer)));
  texts.forEach(t => {
    const r = checkText(t, kho);
    if (r.outside.length) fail(`nhóm ${g.id}: "${t}" có tiếng ngoài kho: ${r.outside.join(', ')}`);
  });
  g.fill.forEach(f => {
    if (f.options.indexOf(f.answer) === -1) fail(`nhóm ${g.id}: đáp án không nằm trong lựa chọn: ${f.text}`);
  });
});

console.log(problems ? `\n${problems} lỗi` : 'Dữ liệu hợp lệ: 10 nhóm vần, mọi câu nằm trong kho tiếng.');
process.exit(problems ? 1 : 0);
