/* Trò chơi tương tác và Góc luyện tập (màn hình học sinh). */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store, V = VV.viet;

  var GAME_TYPES = [
    { id: 'nhan-dien', label: 'Nhận diện vần', desc: 'Nghe vần, chọn tiếng có vần đó.' },
    { id: 'ghep-tieng', label: 'Ghép tiếng', desc: 'Âm đầu, vần và dấu thanh ghép thành tiếng.' },
    { id: 'chon-tu', label: 'Chọn từ đúng', desc: 'Chọn từ viết đúng chính tả.' },
    { id: 'hoan-thanh-cau', label: 'Hoàn thành câu', desc: 'Chọn tiếng điền vào chỗ trống trong câu.' }
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function uniq(arr) { return arr.filter(function (x, i) { return arr.indexOf(x) === i; }); }

  // ---------- Sinh câu hỏi ----------
  function siblings(van) {
    var g = D.groupOfVan(van);
    return g.vans.filter(function (v) { return v !== van; });
  }

  function qNhanDien(van, level, used) {
    var g = D.groupOfVan(van);
    var words = g.words[van].filter(function (w) { return used.indexOf(w) === -1; });
    var w = pick(words.length ? words : g.words[van]);
    var sib = siblings(van);
    var n = level === 'ho-tro' ? 1 : 2;
    var ds = shuffle(sib).slice(0, n).map(function (v) { return pick(g.words[v]); });
    return {
      type: 'nhan-dien', van: van, word: w,
      prompt: 'Chọn tiếng có vần', focus: van, speakText: van,
      options: shuffle([w].concat(ds)), answer: w, showVan: level === 'ho-tro'
    };
  }

  function qGhep(van, level, used) {
    var g = D.groupOfVan(van);
    var words = g.words[van].filter(function (w) { return used.indexOf(w) === -1; });
    var w = pick(words.length ? words : g.words[van]);
    var p = V.parse(w);
    var ds = V.toneDistractors(w, siblings(van)).slice(0, level === 'ho-tro' ? 1 : 2);
    return {
      type: 'ghep-tieng', van: van, word: w,
      prompt: 'Ghép thành tiếng', parts: [p.initial || '', van, V.TONE_NAME[p.tone]], speakText: w,
      options: shuffle([w].concat(ds)), answer: w, showVan: level === 'ho-tro'
    };
  }

  function qChonTu(van, level) {
    var g = D.groupOfVan(van);
    var phrases = g.phrases.filter(function (ph) {
      return ph.split(' ').some(function (x) { var q = V.parse(x); return q && q.van === van; });
    });
    if (!phrases.length) return qNhanDien(van, level, []);
    var ph = pick(phrases);
    var parts = ph.split(' ');
    var idx = 0;
    parts.forEach(function (x, i) { var q = V.parse(x); if (q && q.van === van) idx = i; });
    var p = V.parse(parts[idx]);
    var wrong = siblings(van).filter(function (v) { return V.validTones(v).indexOf(p.tone) !== -1; }).map(function (v) {
      var copy = parts.slice();
      var w = V.compose(p.initial, v, p.tone);
      copy[idx] = parts[idx][0] === parts[idx][0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w;
      return copy.join(' ');
    });
    var ds = uniq(wrong).filter(function (x) { return x !== ph; }).slice(0, level === 'ho-tro' ? 1 : 2);
    return {
      type: 'chon-tu', van: van, word: parts[idx],
      prompt: 'Từ nào viết đúng?', speakText: ph,
      options: shuffle([ph].concat(ds)), answer: ph, showVan: level === 'ho-tro'
    };
  }

  function qCau(van, level) {
    var g = D.groupOfVan(van);
    var fills = g.fill.filter(function (f) { return V.parse(f.answer).van === van; });
    var f = pick(fills.length ? fills : g.fill);
    var opts = level === 'ho-tro' ? [f.answer, f.options.filter(function (o) { return o !== f.answer; })[0]] : f.options;
    return {
      type: 'hoan-thanh-cau', van: V.parse(f.answer).van, word: f.answer,
      prompt: 'Chọn tiếng điền vào chỗ trống', sentence: f.text, speakText: f.text.replace('___', f.answer),
      options: shuffle(opts), answer: f.answer, showVan: level === 'ho-tro'
    };
  }

  // Nhiệm vụ do giáo viên duyệt trong kho học liệu.
  function libraryQuestions(van, level) {
    var out = [];
    S.state.library.forEach(function (item) {
      if (item.kind !== 'bai-tap') return;
      (item.content.tasks || []).forEach(function (t) {
        if (!t.options || t.options.length < 2 || !t.answer) return;
        if (van && t.van !== van) return;
        if (level && t.level !== level) return;
        out.push({
          type: t.type, van: t.van || van, word: t.answer, fromLibrary: true,
          prompt: t.prompt || 'Chọn đáp án đúng', freeText: t.question, speakText: t.question.replace('___', t.answer),
          options: shuffle(t.options), answer: t.answer, showVan: t.level === 'ho-tro'
        });
      });
    });
    return out;
  }

  // Một lượt luyện 6 câu.
  function buildRound(cfg) {
    var count = 6;
    var qs = [];
    var used = [];
    var gen = { 'nhan-dien': qNhanDien, 'ghep-tieng': qGhep, 'chon-tu': qChonTu, 'hoan-thanh-cau': qCau };
    var vans = cfg.vans && cfg.vans.length ? cfg.vans : [cfg.van];
    if (!cfg.type) {
      var lib = shuffle(libraryQuestions(cfg.van, cfg.level)).slice(0, 2);
      qs = qs.concat(lib);
    }
    var mix = cfg.type ? [cfg.type] :
      cfg.level === 'ho-tro' ? ['nhan-dien', 'nhan-dien', 'ghep-tieng'] :
      cfg.level === 'van-dung' ? ['hoan-thanh-cau', 'chon-tu', 'ghep-tieng'] :
      ['nhan-dien', 'ghep-tieng', 'chon-tu', 'hoan-thanh-cau'];
    var guard = 0;
    while (qs.length < count && guard < 40) {
      guard++;
      var type = mix[qs.length % mix.length];
      var van = vans[qs.length % vans.length];
      var q = gen[type](van, cfg.level || 'tu-lam', used);
      var key = q.type + '|' + q.answer;
      if (used.indexOf(key) !== -1 && guard < 30) continue;
      used.push(key); used.push(q.word);
      qs.push(q);
    }
    return qs;
  }

  // ---------- Góc luyện tập ----------
  var sm = null; // trạng thái phiên
  var root = null;
  var advanceTimer = null;

  function open(cfg) {
    root = document.getElementById('student-mode');
    sm = { cfg: cfg || {}, step: 'who', studentId: cfg && cfg.studentId || null, idx: 0, results: [], answered: false };
    if (cfg && cfg.preview) { sm.step = 'intro'; sm.cfg.level = cfg.level || 'tu-lam'; }
    else if (cfg && cfg.studentId) sm.step = 'intro';
    else if (cfg && cfg.noStudent) sm.step = 'intro';
    root.classList.add('is-open');
    root.removeAttribute('hidden');
    document.body.classList.add('student-open');
    root.setAttribute('aria-hidden', 'false');
    document.getElementById('app').setAttribute('inert', '');
    draw(true);
  }

  function close() {
    clearTimeout(advanceTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    root.classList.remove('is-open');
    root.setAttribute('hidden', '');
    root.innerHTML = '';
    document.body.classList.remove('student-open');
    document.getElementById('app').removeAttribute('inert');
    var card = sm && sm.step === 'card' ? sm.card : null;
    sm = null;
    // Mở từ mã QR: quay về bài học chứa thẻ thay vì mở lại thẻ.
    if (card && VV.app.route === 'the') { location.hash = '#/bai-hoc/' + D.groupOfVan(card.van).id; return; }
    VV.app.refresh();
  }

  // ---------- Thẻ vần biết nói (mở từ mã QR hoặc trang bài học) ----------
  function openCard(word) {
    var p = V.parse(word);
    var g = p && D.groupOfVan(p.van);
    if (!g) { ui.toast('Không tìm thấy thẻ cho “' + word + '”.', 'error'); return; }
    open({ noStudent: true });
    sm.step = 'card';
    sm.card = { word: word, van: p.van };
    draw(true);
  }
  function drawCard() {
    var c = sm.card, p = V.parse(c.word);
    var flat = V.compose(p.initial, p.van, 'ngang');
    var list = D.groupOfVan(c.van).words[c.van];
    var i = list.indexOf(c.word);
    return '<div class="sm-body sm-center">' +
      '<h1 class="sm-title" id="sm-title">Thẻ vần ' + ui.esc(c.van) + '</h1>' +
      '<p class="sm-parts reading">' + (p.initial ? '<span class="part">' + ui.esc(p.initial) + '</span><span class="plus">+</span>' : '') + '<span class="part part-van">' + ui.esc(c.van) + '</span></p>' +
      '<ol class="card-steps">' +
      '<li class="card-step"><p class="card-step-label">Đọc tiếng</p><p class="reading card-word">' + ui.esc(flat) + '</p>' + ui.speakBtn(flat, 'Nghe “' + flat + '”', 'sm-speak') + '</li>' +
      (p.tone !== 'ngang'
        ? '<li class="card-step"><p class="card-step-label">Thêm ' + ui.esc(V.TONE_NAME[p.tone]) + '</p><p class="reading card-word">' + ui.vanWord(c.word, c.van) + '</p>' + ui.speakBtn(c.word, 'Nghe “' + c.word + '”', 'sm-speak') + '</li>'
        : '') +
      '<li class="card-step"><p class="card-step-label">Viết vào vở ô li</p><p class="reading card-word card-write oli-paper">' + ui.esc(c.word) + '</p></li>' +
      '</ol>' +
      '<div class="btn-row sm-card-nav">' +
      (i > 0 ? '<button type="button" class="btn btn-lg" data-sm="card" data-word="' + ui.esc(list[i - 1]) + '">' + ui.icon('arrowLeft') + ui.esc(list[i - 1]) + '</button>' : '') +
      (i < list.length - 1 ? '<button type="button" class="btn btn-lg" data-sm="card" data-word="' + ui.esc(list[i + 1]) + '">' + ui.esc(list[i + 1]) + ui.icon('arrowRight') + '</button>' : '') +
      '<button type="button" class="btn btn-primary btn-lg" data-sm="card-practice">' + ui.icon('play') + 'Luyện vần ' + ui.esc(c.van) + '</button>' +
      '</div></div>';
  }

  // Bài của em: giáo viên giao > gợi ý của bản đồ > cấu hình truyền vào.
  function resolvePlan() {
    var c = sm.cfg;
    if (c.van || c.vans) return { van: c.van || c.vans[0], vans: c.vans, level: c.level || 'tu-lam', type: c.type, source: c.preview ? 'xem-thu' : 'chon' };
    if (sm.studentId) {
      var a = S.assignment(sm.studentId);
      if (a) return { van: a.van, level: a.level, source: 'giao' };
      var s = S.suggest(sm.studentId);
      return { van: s.van, level: s.level, source: 'goi-y' };
    }
    var g = D.GROUPS[S.state.classInfo.progress - 1];
    return { van: g.vans[0], vans: g.vans, level: 'tu-lam', source: 'chon' };
  }

  function topbar() {
    var label = sm.step === 'card' ? 'Thẻ vần biết nói' : sm.cfg.preview ? 'Xem thử, không ghi kết quả' : (sm.studentId ? S.studentLabel(sm.studentId) : 'Chơi thử, không ghi kết quả');
    var prog = sm.step === 'play' ? '<div class="sm-progress" role="progressbar" aria-label="Tiến độ" aria-valuemin="0" aria-valuemax="' + sm.questions.length + '" aria-valuenow="' + sm.idx + '">' +
      sm.questions.map(function (q, i) {
        var r = sm.results[i];
        return '<span class="sm-step' + (i === sm.idx ? ' is-current' : '') + (r ? (r.correct ? ' is-ok' : ' is-miss') : '') + '"></span>';
      }).join('') + '</div>' : '<span></span>';
    return '<header class="sm-top"><button type="button" class="btn btn-ghost sm-exit" data-sm="exit" aria-label="Về trang giáo viên">' + ui.icon('home') + '<span aria-hidden="true">Về trang giáo viên</span></button>' +
      prog + '<span class="sm-who">' + ui.esc(label) + '</span></header>';
  }

  function drawWho() {
    var st = S.state.students;
    return '<div class="sm-body sm-center"><h1 class="sm-title" id="sm-title">Em là bạn nào?</h1>' +
      '<div class="sm-who-grid">' + st.map(function (s) {
        return '<button type="button" class="sm-who-btn" data-sm="who" data-id="' + s.id + '">' + ui.esc(s.code) + '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="btn btn-ghost" data-sm="guest">Chơi thử, không ghi kết quả</button></div>';
  }

  function drawIntro() {
    var plan = resolvePlan();
    sm.plan = plan;
    var g = D.groupOfVan(plan.van);
    var examples = g.words[plan.van].slice(0, 3);
    var srcText = { giao: 'Bài cô giao cho em', 'goi-y': 'Bài gợi ý cho em', chon: 'Bài luyện', 'xem-thu': 'Xem thử bài luyện' }[plan.source];
    return '<div class="sm-body sm-center">' +
      '<p class="sm-kicker">' + ui.esc(srcText) + '</p>' +
      '<h1 class="sm-title" id="sm-title">Hôm nay em luyện vần</h1>' +
      '<div class="sm-van-card"><span class="sm-van">' + ui.esc(plan.vans ? plan.vans.join(', ') : plan.van) + '</span>' +
      ui.speakBtn(plan.vans ? plan.vans.join(', ') : plan.van, 'Nghe vần', 'sm-speak') + '</div>' +
      '<p class="sm-examples">' + examples.map(function (w) { return '<span class="reading">' + ui.vanWord(w, plan.van) + '</span>'; }).join('') + '</p>' +
      '<button type="button" class="btn btn-primary btn-xl" data-sm="start" autofocus>Bắt đầu</button></div>';
  }

  function optionHTML(q, o, i) {
    var r = sm.results[sm.idx];
    var cls = '';
    if (sm.answered) {
      if (o === q.answer) cls = ' is-correct';
      else if (r && r.chosen === o) cls = ' is-wrong';
    }
    // Mức có hỗ trợ: tô vần ở mọi phương án để em so sánh, không chỉ tô đáp án đúng.
    var content = q.showVan && q.type !== 'chon-tu' ? ui.vanWord(o, null) : ui.esc(o);
    if (q.type === 'chon-tu' && q.showVan) content = ui.vanText(o, [q.van].concat(siblings(q.van)));
    return '<button type="button" class="sm-option' + cls + '" data-sm="answer" data-value="' + ui.esc(o) + '"' + (sm.answered ? ' aria-disabled="true"' : '') + '>' +
      '<span class="reading">' + content + '</span></button>';
  }

  function drawPlay() {
    var q = sm.questions[sm.idx];
    var head = '';
    if (q.freeText) {
      head = '<p class="sm-prompt">' + ui.esc(q.prompt) + '</p><p class="sm-sentence reading">' + ui.esc(q.freeText).replace('___', '<span class="blank">___</span>') + '</p>';
    } else if (q.type === 'nhan-dien') {
      head = '<p class="sm-prompt">' + ui.esc(q.prompt) + '</p><div class="sm-van-card"><span class="sm-van">' + ui.esc(q.focus) + '</span>' + ui.speakBtn(q.focus, 'Nghe vần ' + q.focus, 'sm-speak') + '</div>';
    } else if (q.type === 'ghep-tieng') {
      head = '<p class="sm-prompt">' + ui.esc(q.prompt) + '</p><p class="sm-parts reading">' +
        (q.parts[0] ? '<span class="part">' + ui.esc(q.parts[0]) + '</span><span class="plus">+</span>' : '') +
        '<span class="part part-van">' + ui.esc(q.parts[1]) + '</span><span class="plus">+</span><span class="part part-tone">' + ui.esc(q.parts[2]) + '</span></p>';
    } else if (q.type === 'hoan-thanh-cau') {
      head = '<p class="sm-prompt">' + ui.esc(q.prompt) + '</p><p class="sm-sentence reading">' + ui.esc(q.sentence).replace('___', '<span class="blank">' + (sm.answered ? ui.esc(q.answer) : '___') + '</span>') + '</p>';
    } else {
      head = '<p class="sm-prompt">' + ui.esc(q.prompt) + '</p>';
    }
    var r = sm.results[sm.idx];
    var feedback = '';
    if (sm.answered && r) {
      feedback = r.correct
        ? '<p class="sm-feedback is-ok" role="status">' + ui.icon('check') + 'Đúng rồi!</p>'
        : '<p class="sm-feedback is-miss" role="status">Chưa đúng. Đáp án là <b class="reading">' + ui.esc(q.answer) + '</b></p>';
    }
    return '<div class="sm-body">' + head +
      '<div class="sm-options' + (q.type === 'chon-tu' || q.type === 'hoan-thanh-cau' && q.options[0].length > 6 ? ' is-wide' : '') + '">' + q.options.map(function (o, i) { return optionHTML(q, o, i); }).join('') + '</div>' +
      '<div class="sm-foot">' + feedback +
      (sm.answered ? '<button type="button" class="btn btn-primary btn-lg" data-sm="next" id="sm-next">' + (sm.idx === sm.questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp') + ui.icon('arrowRight') + '</button>' : '') +
      '</div></div>';
  }

  function drawDone() {
    var ok = sm.results.filter(function (r) { return r.correct; }).length;
    var plan = sm.plan;
    var g = D.groupOfVan(plan.van);
    var readList = g.words[plan.van].slice(0, 3);
    sm.readCheck = sm.readCheck || {};
    var recorded = sm.studentId && !sm.cfg.preview;
    return '<div class="sm-body sm-center">' +
      '<h1 class="sm-title" id="sm-title">Em đã làm xong!</h1>' +
      '<p class="sm-score"><span class="num">' + ok + '/' + sm.results.length + '</span> câu chọn đúng</p>' +
      (recorded
        ? '<section class="sm-teacher" aria-label="Phần dành cho giáo viên"><h2>Đọc cho cô nghe</h2>' +
          '<p class="muted">Giáo viên nghe em đọc từng tiếng và ghi kết quả. Phần này cập nhật bản đồ âm vần.</p>' +
          '<ul class="read-check">' + readList.map(function (w) {
            var v = sm.readCheck[w];
            return '<li><span class="reading big">' + ui.vanWord(w, plan.van) + '</span>' +
              '<span class="btn-row"><button type="button" class="btn btn-sm' + (v === true ? ' is-on-ok' : '') + '" data-sm="read" data-word="' + ui.esc(w) + '" data-ok="1" aria-pressed="' + (v === true) + '">Đúng</button>' +
              '<button type="button" class="btn btn-sm' + (v === false ? ' is-on-miss' : '') + '" data-sm="read" data-word="' + ui.esc(w) + '" data-ok="0" aria-pressed="' + (v === false) + '">Chưa đúng</button></span></li>';
          }).join('') + '</ul></section>'
        : '<p class="muted">Lượt này không ghi vào hồ sơ.</p>') +
      '<div class="btn-row"><button type="button" class="btn btn-lg" data-sm="again">Luyện lại</button>' +
      '<button type="button" class="btn btn-primary btn-lg" data-sm="finish">Xong</button></div></div>';
  }

  // enter = true khi một màn hình hoặc câu hỏi mới xuất hiện (không phát lại khi chỉ cập nhật trạng thái trả lời).
  function draw(enter) {
    var body = sm.step === 'card' ? drawCard() : sm.step === 'who' ? drawWho() : sm.step === 'intro' ? drawIntro() : sm.step === 'play' ? drawPlay() : drawDone();
    if (enter) body = body.replace('class="sm-body', 'class="sm-enter sm-body');
    root.innerHTML = '<div class="sm-shell" role="dialog" aria-modal="true" aria-labelledby="sm-title">' + topbar() + body + '</div>';
    if (sm.step === 'play' && !sm.answered) {
      var t = root.querySelector('.sm-prompt');
      if (t) { t.setAttribute('id', 'sm-title'); }
      var first = root.querySelector('.sm-option');
      if (first) first.focus();
    } else {
      var f = root.querySelector('[autofocus]') || root.querySelector('#sm-next') || root.querySelector('.sm-title');
      if (f) { if (!f.hasAttribute('tabindex') && f.tagName === 'H1') f.setAttribute('tabindex', '-1'); f.focus(); }
    }
  }

  function startRound() {
    var plan = sm.plan || resolvePlan();
    sm.plan = plan;
    sm.questions = buildRound(plan);
    sm.idx = 0; sm.results = []; sm.answered = false; sm.readCheck = {};
    sm.step = 'play';
    draw(true);
    var q = sm.questions[0];
    if (q.type === 'nhan-dien' && q.showVan && ui.canSpeak()) ui.speak(q.focus);
  }

  function answer(value) {
    if (sm.answered) return;
    var q = sm.questions[sm.idx];
    var correct = value === q.answer;
    sm.results[sm.idx] = { correct: correct, chosen: value, van: q.van, word: q.answer, type: q.type };
    sm.answered = true;
    draw();
    var opt = root.querySelector('.sm-option.is-correct');
    if (opt && !ui.reducedMotion()) opt.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (!correct) {
      var wrong = root.querySelector('.sm-option.is-wrong');
      if (wrong && !ui.reducedMotion()) wrong.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 280, easing: 'cubic-bezier(.36,.07,.19,.97)' });
    }
    if (ui.canSpeak()) ui.speak(q.speakText || q.answer);
    var nextBtn = root.querySelector('#sm-next');
    if (nextBtn) nextBtn.focus();
  }

  function finishRound() {
    if (sm.studentId && !sm.cfg.preview) {
      var sid = sm.studentId;
      var plan = sm.plan;
      var res = sm.results;
      var rc = sm.readCheck || {};
      S.commit(function (s) {
        var now = Date.now();
        res.forEach(function (r) {
          s.records.push({ id: S.uid('r'), studentId: sid, date: now, phase: 'thuong-xuyen', skill: 'nhan-dien', source: 'game',
            game: r.type, van: r.van, tieng: r.word, correct: r.correct });
        });
        Object.keys(rc).forEach(function (w) {
          s.records.push({ id: S.uid('r'), studentId: sid, date: now, phase: 'thuong-xuyen', skill: 'doc', source: 'luyen',
            van: plan.van, tieng: w, correct: rc[w], error: null, support: 'tu-doc' });
        });
        s.practice.push({ id: S.uid('p'), studentId: sid, date: now, van: plan.van, level: plan.level, total: res.length,
          correct: res.filter(function (r) { return r.correct; }).length });
      });
    }
  }

  function onClick(e) {
    var b = e.target.closest('[data-sm]');
    if (!b || !sm) return;
    var what = b.getAttribute('data-sm');
    if (what === 'exit') {
      if (sm.step === 'play' && sm.results.length && sm.studentId && !sm.cfg.preview) {
        ui.confirmDialog({ title: 'Dừng lượt luyện?', body: 'Kết quả của lượt đang làm dở sẽ không được lưu.' }, 'Dừng và thoát').then(function (ok) { if (ok) close(); });
        return;
      }
      close();
    } else if (what === 'card') { sm.card = { word: b.getAttribute('data-word'), van: sm.card.van }; draw(true); }
    else if (what === 'card-practice') { sm.cfg = { van: sm.card.van, level: 'ho-tro', noStudent: true }; sm.plan = null; sm.step = 'intro'; draw(true); }
    else if (what === 'who') { sm.studentId = b.getAttribute('data-id'); sm.step = 'intro'; draw(true); }
    else if (what === 'guest') { sm.studentId = null; sm.step = 'intro'; draw(true); }
    else if (what === 'start') startRound();
    else if (what === 'answer') answer(b.getAttribute('data-value'));
    else if (what === 'next') {
      if (sm.idx < sm.questions.length - 1) { sm.idx++; sm.answered = false; draw(true); }
      else { sm.step = 'done'; draw(true); }
    } else if (what === 'read') {
      sm.readCheck[b.getAttribute('data-word')] = b.getAttribute('data-ok') === '1';
      draw();
    } else if (what === 'again') { finishRound(); startRound(); }
    else if (what === 'finish') {
      finishRound();
      if (sm.studentId && !sm.cfg.preview) ui.toast('Đã lưu kết quả luyện tập của ' + S.studentLabel(sm.studentId) + '.');
      close();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('student-mode');
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', function (e) {
      if (!sm) return;
      if (e.key === 'Escape') { e.preventDefault(); onClick({ target: el.querySelector('[data-sm="exit"]') }); }
      if (sm.step === 'play' && !sm.answered && /^[1-4]$/.test(e.key)) {
        var opts = el.querySelectorAll('.sm-option');
        var o = opts[Number(e.key) - 1];
        if (o) answer(o.getAttribute('data-value'));
      }
    });
  });

  // ---------- Màn hình Trò chơi (giáo viên chọn) ----------
  var gv = { type: 'nhan-dien', group: null, studentId: '' };

  function renderGames(main) {
    var progress = S.state.classInfo.progress;
    if (!gv.group) gv.group = progress;
    var g = D.GROUPS[gv.group - 1];
    var libCount = libraryQuestions(null, null).length;
    main.innerHTML = '<section class="page">' +
      '<header class="page-head"><div><h1>Trò chơi tương tác</h1>' +
      '<p class="lede">Mỗi lượt 6 câu, chơi trên màn hình chung hoặc máy tính bảng. Kết quả chọn đúng chỉ phản ánh nhận diện; muốn biết em đọc được chưa, giáo viên vẫn cần nghe em đọc.</p></div></header>' +
      '<form class="panel game-setup" data-form="game">' +
      '<fieldset class="field"><legend>Chọn trò chơi</legend><div class="game-cards">' +
      GAME_TYPES.map(function (t) {
        return '<label class="game-card"><input type="radio" name="gtype" value="' + t.id + '"' + (gv.type === t.id ? ' checked' : '') + '>' +
          '<span class="game-card-title">' + ui.esc(t.label) + '</span><span class="game-card-desc">' + ui.esc(t.desc) + '</span>' + gamePreview(t.id) + '</label>';
      }).join('') + '</div></fieldset>' +
      '<div class="form-grid">' +
      '<div class="field"><label for="g-group">Nhóm vần</label><select id="g-group" name="group">' +
      D.GROUPS.map(function (x) { return '<option value="' + x.id + '"' + (x.id === gv.group ? ' selected' : '') + '>Nhóm ' + x.id + ': ' + ui.esc(x.title) + (x.id > progress ? ' (chưa học)' : '') + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label for="g-stu">Ghi kết quả cho</label><select id="g-stu" name="student">' + ui.studentOptions(gv.studentId, 'Không ghi (chơi thử, cả lớp)') + '</select></div>' +
      '</div>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary btn-lg">' + ui.icon('play') + 'Bắt đầu chơi</button></div>' +
      '</form>' +
      '<section class="panel"><h2 class="panel-title">Bài luyện giáo viên đã duyệt</h2>' +
      (libCount
        ? '<p>Kho học liệu có ' + libCount + ' nhiệm vụ chọn đáp án đã duyệt. Chúng được trộn vào lượt luyện của học sinh có cùng vần và mức độ trong Góc luyện tập.</p><a class="btn" href="#/tro-ly/kho">Xem kho học liệu</a>'
        : '<p>Chưa có nhiệm vụ nào. Dùng Trợ lý soạn bài để soạn và duyệt bài tập; bài đã duyệt sẽ xuất hiện trong Góc luyện tập.</p><a class="btn" href="#/tro-ly">Soạn bài tập</a>') +
      '</section></section>';
  }

  function gamePreview(type) {
    if (type === 'nhan-dien') return '<span class="mini" aria-hidden="true"><b>an</b><i>bàn</i><i>chăn</i></span>';
    if (type === 'ghep-tieng') return '<span class="mini" aria-hidden="true"><b>b + an + huyền</b></span>';
    if (type === 'chon-tu') return '<span class="mini" aria-hidden="true"><i>khăn đỏ</i><i>khân đỏ</i></span>';
    return '<span class="mini" aria-hidden="true"><b>Bà cho bé quả ___</b></span>';
  }

  VV.views['tro-choi'] = {
    render: renderGames,
    act: {},
    onchange: function (e) {
      if (e.target.name === 'gtype') gv.type = e.target.value;
      if (e.target.name === 'group') gv.group = Number(e.target.value);
      if (e.target.name === 'student') gv.studentId = e.target.value;
    },
    onsubmit: function (e) {
      e.preventDefault();
      var g = D.GROUPS[gv.group - 1];
      open({ type: gv.type, vans: g.vans, van: g.vans[0], level: 'tu-lam', studentId: gv.studentId || null, noStudent: !gv.studentId });
    }
  };

  VV.studentMode = { open: open, openCard: openCard, close: close, buildRound: buildRound, GAME_TYPES: GAME_TYPES };

  // Địa chỉ #/the/<tiếng>: mở thẻ vần (dùng cho mã QR in trên thẻ giấy).
  VV.views.the = {
    render: function (root, params) {
      var word = params[0] || '';
      var p = V.parse(word);
      var g = p && D.groupOfVan(p.van);
      VV.views['bai-hoc'].render(root, [String(g ? g.id : 1)]);
      if (g) setTimeout(function () { openCard(word); }, 0);
    },
    get act() { return VV.views['bai-hoc'].act; }
  };
})(window.VV = window.VV || {});
