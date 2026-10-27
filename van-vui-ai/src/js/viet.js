/* Phân tích tiếng Việt: tách âm đầu, vần, thanh; ghép tiếng; kiểm tra kho tiếng. */
(function (VV) {
  'use strict';

  var TONE_MARKS = {
    '̀': 'huyen',
    '́': 'sac',
    '̃': 'nga',
    '̉': 'hoi',
    '̣': 'nang'
  };
  var TONE_CHAR = { huyen: '̀', sac: '́', nga: '̃', hoi: '̉', nang: '̣', ngang: '' };
  var TONE_NAME = { ngang: 'thanh ngang', huyen: 'dấu huyền', sac: 'dấu sắc', hoi: 'dấu hỏi', nga: 'dấu ngã', nang: 'dấu nặng' };

  // Âm đầu, xếp từ dài đến ngắn để so khớp đúng.
  var INITIALS = ['ngh', 'ng', 'nh', 'ch', 'gh', 'gi', 'kh', 'ph', 'qu', 'th', 'tr',
    'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x'];
  var VOWELS = 'aăâeêioôơuưy';
  var MARKED_VOWELS = 'ăâêôơư';

  function isVowel(ch) { return VOWELS.indexOf(ch) !== -1; }

  // Tách một tiếng thành { initial, van, tone, base }. Trả về null nếu không phải tiếng hợp lệ.
  function parse(word) {
    if (!word) return null;
    var w = String(word).toLowerCase().normalize('NFD');
    var tone = 'ngang';
    var base = '';
    for (var i = 0; i < w.length; i++) {
      var ch = w[i];
      if (TONE_MARKS[ch]) tone = TONE_MARKS[ch];
      else base += ch;
    }
    base = base.normalize('NFC');
    if (!/^[a-zăâđêôơư]+$/.test(base)) return null;

    var initial = '';
    for (var j = 0; j < INITIALS.length; j++) {
      var ini = INITIALS[j];
      if (base.indexOf(ini) === 0) { initial = ini; break; }
    }
    var rest = base.slice(initial.length);

    // "gi": gì = gi + i; gìn = gi + in; gia = gi + a; giếng = gi + iêng (chữ i được lược bớt).
    if (initial === 'gi') {
      if (rest === '' || !isVowel(rest[0]) || rest[0] === 'ê') rest = 'i' + rest;
    }
    // Không bắt đầu bằng nguyên âm: không phải tiếng (ví dụ "ng").
    if (!rest || !isVowel(rest[0])) return null;
    return { initial: initial, van: rest, tone: tone, base: base, word: String(word).toLowerCase() };
  }

  // Cách đặt dấu với oa, oe, uy không có âm cuối: 'moi' (hoà, khoẻ, thuỷ) hoặc 'cu' (hòa, khỏe, thủy).
  var toneStyle = 'moi';
  function setToneStyle(s) { toneStyle = s === 'cu' ? 'cu' : 'moi'; }

  // Chọn nguyên âm mang dấu thanh trong vần (quy tắc đơn giản, đủ cho vần lớp 1).
  function toneIndex(van) {
    if (toneStyle === 'moi' && (van === 'oa' || van === 'oe' || van === 'uy')) return 1;
    var uo = van.indexOf('ươ');
    if (uo !== -1) return uo + 1;
    for (var i = 0; i < van.length; i++) if (MARKED_VOWELS.indexOf(van[i]) !== -1) return i;
    var vowelIdx = [];
    for (var k = 0; k < van.length; k++) if (isVowel(van[k])) vowelIdx.push(k);
    if (!vowelIdx.length) return -1;
    var last = van[van.length - 1];
    var endsWithConsonant = !isVowel(last);
    if (endsWithConsonant) return vowelIdx[vowelIdx.length - 1];
    if (vowelIdx.length >= 3) return vowelIdx[1];
    return vowelIdx[0];
  }

  // Ghép âm đầu + vần + thanh thành tiếng.
  function compose(initial, van, tone) {
    var mark = TONE_CHAR[tone] || '';
    if (!mark) return (initial || '') + van;
    var idx = toneIndex(van);
    if (idx < 0) return (initial || '') + van;
    var withTone = van.slice(0, idx) + (van[idx].normalize('NFD') + mark).normalize('NFC') + van.slice(idx + 1);
    return (initial || '') + withTone;
  }

  // Tách văn bản thành các phần: tiếng và dấu câu/khoảng trắng.
  function tokenize(text) {
    var parts = String(text || '').split(/([A-Za-zÀ-ỹĐđ]+)/u);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      var isWord = /^[A-Za-zÀ-ỹĐđ]+$/u.test(parts[i]);
      out.push({ text: parts[i], isWord: isWord });
    }
    return out;
  }

  // Kiểm tra văn bản theo kho tiếng.
  // kho = { vans: Set, extra: Set (tiếng bổ sung đã duyệt, viết thường) }
  function checkText(text, kho) {
    var tokens = tokenize(text);
    var outside = [];
    tokens.forEach(function (t) {
      if (!t.isWord) return;
      var lower = t.text.toLowerCase();
      var p = parse(lower);
      t.parsed = p;
      if (kho.extra && kho.extra.has(lower)) { t.ok = true; return; }
      t.ok = !!(p && kho.vans.has(p.van) && (!kho.initials || !p.initial || kho.initials.has(p.initial)));
      if (!t.ok && outside.indexOf(lower) === -1) outside.push(lower);
    });
    return { tokens: tokens, outside: outside };
  }

  // Tách phần vần trong một tiếng để tô màu: trả về [trước, vần có dấu, sau].
  function splitForHighlight(word) {
    var p = parse(word);
    if (!p) return [word, '', ''];
    // Âm đầu chiếm bao nhiêu ký tự trong từ gốc (dấu thanh không nằm trong âm đầu, trừ "gi" + i).
    var n = p.initial.length;
    if (p.initial === 'gi' && p.van[0] === 'i' && p.base.length === p.initial.length + p.van.length - 1) n = 1;
    return [word.slice(0, n), word.slice(n), ''];
  }

  // Vần tắc (kết thúc bằng c, ch, p, t) chỉ đi với dấu sắc hoặc dấu nặng.
  function isStopVan(van) { return /(c|ch|p|t)$/.test(van); }
  function validTones(van) { return isStopVan(van) ? ['sac', 'nang'] : ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang']; }

  // Hai phương án nhiễu cho bài ghép tiếng: đổi thanh (hợp luật) hoặc đổi sang vần gần giống.
  function toneDistractors(word, siblingVans) {
    var p = parse(word);
    if (!p) return [];
    var out = [];
    validTones(p.van).forEach(function (t) {
      if (t !== p.tone && out.length < 2) out.push(compose(p.initial, p.van, t));
    });
    (siblingVans || []).forEach(function (v) {
      if (out.length < 2 && v !== p.van && validTones(v).indexOf(p.tone) !== -1) out.push(compose(p.initial, v, p.tone));
    });
    return out;
  }

  VV.viet = {
    isStopVan: isStopVan,
    setToneStyle: setToneStyle,
    validTones: validTones,
    toneDistractors: toneDistractors,
    parse: parse,
    compose: compose,
    tokenize: tokenize,
    checkText: checkText,
    splitForHighlight: splitForHighlight,
    TONE_NAME: TONE_NAME,
    TONES: ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang']
  };
})(window.VV = window.VV || {});
