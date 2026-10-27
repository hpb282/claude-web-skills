/* Lưu trữ trên trình duyệt, dữ liệu mẫu và các phép tính cho bản đồ âm vần, gợi ý, báo cáo. */
(function (VV) {
  'use strict';
  var D = VV.data;
  var KEY = 'vanvui.state.v1';
  var SETTINGS_KEY = 'vanvui.settings.v1';
  var APIKEY_KEY = 'vanvui.apikey.v1';
  var DAY = 86400000;

  var listeners = [];
  var state = null;
  var settings = null;
  var sessionKey = '';

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function safeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) {
    try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }
  function safeRemove(k) { try { window.localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } }

  function emptyState() {
    return {
      version: 1,
      isDemo: false,
      classInfo: { name: 'Lớp 1', progress: 1, extraWords: [], siteUrl: '' },
      students: [],
      records: [],
      tests: [],
      writing: [],
      comprehension: [],
      practice: [],
      assignments: {},
      library: [],
      effort: [],
      homework: [],
      curriculum: {}
    };
  }

  function defaultSettings() {
    return {
      ai: { provider: 'anthropic', model: 'claude-opus-5-5', baseUrl: '', remember: false },
      voice: { name: '', rate: 0.85 }
    };
  }

  function load() {
    var raw = safeGet(KEY);
    if (raw) {
      try { state = JSON.parse(raw); } catch (e) { state = null; }
    }
    if (!state || state.version !== 1) state = buildDemo();
    migrate(state);
    var s = safeGet(SETTINGS_KEY);
    settings = defaultSettings();
    if (s) {
      try {
        var parsed = JSON.parse(s);
        settings.ai = Object.assign(settings.ai, parsed.ai || {});
        settings.voice = Object.assign(settings.voice, parsed.voice || {});
      } catch (e) { /* giữ mặc định */ }
    }
    save();
  }

  // Bổ sung trường mới cho dữ liệu đã lưu từ bản trước.
  function migrate(s) {
    var base = emptyState();
    Object.keys(base).forEach(function (k) { if (s[k] === undefined) s[k] = base[k]; });
    Object.keys(base.classInfo).forEach(function (k) { if (s.classInfo[k] === undefined) s.classInfo[k] = base.classInfo[k]; });
    D.applyOverrides(s.curriculum);
  }

  var saveFailed = false;
  function save() {
    saveFailed = !safeSet(KEY, JSON.stringify(state));
    safeSet(SETTINGS_KEY, JSON.stringify(settings));
  }

  function commit(mutator) {
    mutator(state);
    save();
    listeners.forEach(function (fn) { fn(); });
  }
  function onChange(fn) { listeners.push(fn); }

  // ---------- API key ----------
  // Key ghi nhớ: localStorage. Không ghi nhớ: sessionStorage, mất khi đóng thẻ.
  function sessGet() { try { return window.sessionStorage.getItem(APIKEY_KEY); } catch (e) { return null; } }
  function sessSet(v) { try { if (v) window.sessionStorage.setItem(APIKEY_KEY, v); else window.sessionStorage.removeItem(APIKEY_KEY); } catch (e) { /* bỏ qua */ } }
  function getApiKey() { return sessionKey || sessGet() || safeGet(APIKEY_KEY) || ''; }
  function setApiKey(key, remember) {
    sessionKey = key || '';
    if (remember && key) { safeSet(APIKEY_KEY, key); sessSet(''); }
    else { safeRemove(APIKEY_KEY); sessSet(key || ''); }
  }

  // ---------- Truy vấn ----------
  function student(id) {
    for (var i = 0; i < state.students.length; i++) if (state.students[i].id === id) return state.students[i];
    return null;
  }
  function studentLabel(id) {
    var s = student(id);
    return s ? s.code : 'Học sinh đã xóa';
  }

  function kho() {
    var vans = new Set(D.BASE_VANS.concat(D.vansUpTo(state.classInfo.progress)));
    var extra = new Set((state.classInfo.extraWords || []).map(function (w) { return w.toLowerCase(); }));
    return { vans: vans, extra: extra };
  }

  function byDateDesc(a, b) { return b.date - a.date; }

  // Bản đồ âm vần của một học sinh: mỗi vần lấy tối đa 6 lần đọc gần nhất do giáo viên ghi.
  function vanMap(studentId) {
    var out = {};
    D.allVans().forEach(function (v) {
      out[v] = { van: v, read: { correct: 0, total: 0 }, game: { correct: 0, total: 0 }, errors: {} };
    });
    var recs = state.records.filter(function (r) { return r.studentId === studentId; }).sort(byDateDesc);
    var countRead = {}, countGame = {};
    recs.forEach(function (r) {
      var cell = out[r.van];
      if (!cell) return;
      if (r.skill === 'doc') {
        countRead[r.van] = (countRead[r.van] || 0) + 1;
        if (countRead[r.van] > 6) return;
        cell.read.total++;
        if (r.correct) cell.read.correct++;
        else if (r.error) cell.errors[r.error] = (cell.errors[r.error] || 0) + 1;
      } else if (r.skill === 'nhan-dien') {
        countGame[r.van] = (countGame[r.van] || 0) + 1;
        if (countGame[r.van] > 6) return;
        cell.game.total++;
        if (r.correct) cell.game.correct++;
      }
    });
    return out;
  }

  function cellStatus(cell) {
    if (!cell || cell.read.total === 0) return 'chua-do';
    var ratio = cell.read.correct / cell.read.total;
    if (ratio <= 0.5) return 'can-luyen';
    if (ratio >= 0.83) return 'vung';
    return 'dang-len';
  }

  function levelFor(ratio) {
    if (ratio < 0.34) return 'ho-tro';
    if (ratio < 0.67) return 'tu-lam';
    return 'van-dung';
  }

  // Gợi ý theo quy tắc: vần đã học có tỉ lệ đọc đúng thấp nhất (ít nhất 3 lần đọc).
  function suggest(studentId) {
    var map = vanMap(studentId);
    var learned = D.vansUpTo(state.classInfo.progress);
    var measured = learned.filter(function (v) { return map[v].read.total >= 3; });
    if (!measured.length) {
      var g = D.GROUPS[state.classInfo.progress - 1] || D.GROUPS[0];
      return {
        van: g.vans[0], level: 'ho-tro', measured: 0, cell: map[g.vans[0]],
        reason: 'Chưa có đủ kết quả đọc. Bắt đầu với vần ' + g.vans[0] + ' của bài đang học và ghi phiếu đọc nhanh để hệ thống có căn cứ.'
      };
    }
    measured.sort(function (a, b) {
      var ra = map[a].read.correct / map[a].read.total;
      var rb = map[b].read.correct / map[b].read.total;
      if (ra !== rb) return ra - rb;
      if (map[a].read.correct !== map[b].read.correct) return map[a].read.correct - map[b].read.correct;
      return learned.indexOf(a) - learned.indexOf(b);
    });
    var best = measured[0];
    var cell = map[best];
    var ratio = cell.read.correct / cell.read.total;
    if (ratio >= 0.83) {
      var next = D.GROUPS[Math.min(state.classInfo.progress, D.GROUPS.length) - 1];
      return {
        van: next.vans[0], level: 'van-dung', measured: measured.length, cell: map[next.vans[0]],
        reason: 'Các vần đã đo đều đạt từ 5/6 tiếng đúng. Gợi ý luyện vận dụng với bài đang học.'
      };
    }
    var topErr = Object.keys(cell.errors).sort(function (a, b) { return cell.errors[b] - cell.errors[a]; })[0];
    var reason = 'Hồ sơ ghi ' + cell.read.correct + '/' + cell.read.total + ' tiếng đúng ở vần ' + best +
      ', thấp nhất trong ' + measured.length + ' vần đã đo.';
    if (topErr) reason += ' Lỗi gặp nhiều nhất: ' + D.label(D.READ_ERRORS, topErr).toLowerCase() + ' (' + cell.errors[topErr] + ' lần).';
    return { van: best, level: levelFor(ratio), measured: measured.length, cell: cell, reason: reason, topError: topErr };
  }

  function assignment(studentId) {
    return state.assignments[studentId] || null;
  }

  // ---------- Báo cáo ----------
  function latestTest(studentId, phase) {
    var list = state.tests.filter(function (t) { return t.studentId === studentId && t.phase === phase; }).sort(byDateDesc);
    return list[0] || null;
  }

  function readRatioBy(filter) {
    var c = 0, t = 0;
    state.records.forEach(function (r) {
      if (r.skill !== 'doc' || !filter(r)) return;
      t++; if (r.correct) c++;
    });
    return { correct: c, total: t, ratio: t ? c / t : null };
  }

  function groupPrePost(groupId, studentId) {
    var g = D.GROUPS[groupId - 1];
    function f(phase) {
      return function (r) {
        return r.phase === phase && g.vans.indexOf(r.van) !== -1 && (!studentId || r.studentId === studentId);
      };
    }
    return { pre: readRatioBy(f('dau-vao')), post: readRatioBy(f('dau-ra')) };
  }

  function errorCounts(studentId) {
    var counts = {};
    D.READ_ERRORS.forEach(function (e) { counts[e.id] = 0; });
    state.records.forEach(function (r) {
      if (r.skill !== 'doc' || r.correct || !r.error) return;
      if (studentId && r.studentId !== studentId) return;
      counts[r.error] = (counts[r.error] || 0) + 1;
    });
    return counts;
  }

  function writingScore(w) {
    var got = 0, max = 0;
    w.items.forEach(function (it) {
      D.WRITE_CRITERIA.forEach(function (c) { max += 2; got += (it.scores && it.scores[c.id]) || 0; });
    });
    return { got: got, max: max, ratio: max ? got / max : null };
  }

  function latestWriting(studentId, phase) {
    var list = state.writing.filter(function (w) { return w.studentId === studentId && (!phase || w.phase === phase); }).sort(byDateDesc);
    return list[0] || null;
  }

  function effortMinutes() {
    return state.effort.reduce(function (s, e) { return s + (Number(e.minutes) || 0); }, 0);
  }

  // ---------- Dữ liệu mẫu ----------
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Bài đo A/B: 2 tiếng mỗi vần ở các nhóm đã học, chọn 20 tiếng. Dạng A lấy tiếng chẵn, dạng B lấy tiếng lẻ.
  function abForm(form, progress) {
    var vans = D.vansUpTo(progress);
    var pick = [];
    var offset = form === 'A' ? 0 : 1;
    var round = 0;
    while (pick.length < 20 && round < 3) {
      for (var i = 0; i < vans.length && pick.length < 20; i++) {
        var g = D.groupOfVan(vans[i]);
        var list = g.words[vans[i]];
        var w = list[(offset + round * 2) % list.length];
        if (pick.indexOf(w) === -1) pick.push(w);
      }
      round++;
    }
    return pick.slice(0, 20);
  }

  function buildDemo() {
    var s = emptyState();
    s.isDemo = true;
    s.classInfo = { name: 'Lớp 1A (mẫu)', progress: 6, extraWords: ['lan', 'na'] };
    var R = rng(20261026);
    var now = Date.now();
    var weak = {
      HS01: { vans: ['an', 'ăn'], err: 'van', base: 0.86 },
      HS02: { vans: ['ay', 'ây'], err: 'van', base: 0.82 },
      HS03: { vans: [], err: 'thanh', base: 0.93 },
      HS04: { vans: ['âm', 'ơn'], err: 'thanh', base: 0.78 },
      HS05: { vans: ['ôi', 'ơi'], err: 'van', base: 0.8 },
      HS06: { vans: ['ên', 'en'], err: 'van', base: 0.8 },
      HS07: { vans: ['ăm', 'ân', 'ay'], err: 'danh-van', base: 0.68 },
      HS08: { vans: ['un', 'on'], err: 'am-dau', base: 0.84 }
    };
    Object.keys(weak).forEach(function (code, idx) {
      var stu = { id: 'stu-' + (idx + 1), code: code, note: '' };
      s.students.push(stu);
      var prof = weak[code];

      function readTieng(van, phase, date, source, boost) {
        var p = prof.base + (boost || 0);
        if (prof.vans.indexOf(van) !== -1) p = 0.32 + (boost || 0) * 1.6;
        p = Math.max(0.05, Math.min(0.98, p));
        var ok = R() < p;
        var err = null;
        if (!ok) {
          var roll = R();
          err = roll < 0.6 ? prof.err : D.READ_ERRORS[Math.floor(R() * 4)].id;
        }
        return { ok: ok, err: err };
      }

      // Phiếu đọc nhanh đầu vào: nhóm 1-4, 6 tiếng mỗi vần, 4 tuần trước.
      D.GROUPS.slice(0, 6).forEach(function (g) {
        var phase = g.id <= 4 ? 'dau-vao' : 'thuong-xuyen';
        var date = now - (g.id <= 4 ? 27 : 12 + g.id) * DAY + idx * 600000;
        g.vans.forEach(function (v) {
          g.words[v].forEach(function (w) {
            var r = readTieng(v, phase, date, 'phieu', 0);
            s.records.push({ id: uid('r'), studentId: stu.id, date: date, phase: phase, skill: 'doc', source: 'phieu',
              van: v, tieng: w, correct: r.ok, error: r.err, support: r.ok ? 'tu-doc' : 'co-ho-tro' });
          });
        });
      });

      // Trò chơi nhận diện: vài lượt gần đây.
      D.vansUpTo(6).forEach(function (v) {
        var n = 3 + Math.floor(R() * 3);
        for (var k = 0; k < n; k++) {
          var gp = prof.vans.indexOf(v) !== -1 ? 0.6 : 0.92;
          s.records.push({ id: uid('r'), studentId: stu.id, date: now - (2 + R() * 8) * DAY, phase: 'thuong-xuyen',
            skill: 'nhan-dien', source: 'game', van: v, tieng: D.groupOfVan(v).words[v][k % D.groupOfVan(v).words[v].length], correct: R() < gp });
        }
      });

      // Bài đo A (đầu vào) cho mọi em, B (đầu ra) cho 6 em.
      ['A', 'B'].forEach(function (form) {
        if (form === 'B' && idx >= 6) return;
        var phase = form === 'A' ? 'dau-vao' : 'dau-ra';
        var date = now - (form === 'A' ? 28 : 1) * DAY + idx * 900000;
        var testId = uid('t');
        var items = abForm(form, 4).map(function (w) {
          var p = VV.viet.parse(w);
          var r = readTieng(p.van, phase, date, 'bai-do', form === 'B' ? 0.18 : 0);
          return { tieng: w, van: p.van, correct: r.ok, error: r.err };
        });
        var score = items.filter(function (i) { return i.correct; }).length;
        s.tests.push({ id: testId, studentId: stu.id, date: date, phase: phase, form: form, items: items, score: score, total: 20 });
        items.forEach(function (it) {
          s.records.push({ id: uid('r'), studentId: stu.id, date: date, phase: phase, skill: 'doc', source: 'bai-do', testId: testId,
            van: it.van, tieng: it.tieng, correct: it.correct, error: it.error, support: 'tu-doc' });
        });
      });

      // Bài viết: tuần đầu và tuần thứ tư.
      [{ phase: 'dau-vao', d: 26, add: 0 }, { phase: 'dau-ra', d: 2, add: 1 }].forEach(function (w) {
        if (w.phase === 'dau-ra' && idx >= 6) return;
        var words = ['bàn', 'khăn', 'con', 'nến', 'cam'];
        s.writing.push({
          id: uid('w'), studentId: stu.id, date: now - w.d * DAY, phase: w.phase,
          items: words.map(function (t) {
            var sc = {};
            D.WRITE_CRITERIA.forEach(function (c) {
              var v = Math.floor(R() * 2) + w.add;
              if (c.id === 'dau-thanh' && prof.err === 'thanh') v = Math.max(0, v - 1);
              sc[c.id] = Math.min(2, v);
            });
            return { text: t, scores: sc };
          }),
          independence: w.add ? 'tu-viet' : 'nhin-mau', note: '', photo: ''
        });
      });

      s.comprehension.push({ id: uid('c'), studentId: stu.id, date: now - 5 * DAY, phase: 'thuong-xuyen',
        textTitle: 'Bạn Lan có khăn đỏ.', correct: R() < 0.7 ? 2 : 1, total: 3, support: R() < 0.5 ? 'tu-doc' : 'duoc-doc' });

      s.practice.push({ id: uid('p'), studentId: stu.id, date: now - 3 * DAY, van: prof.vans[0] || 'ai', level: 'tu-lam',
        total: 6, correct: 3 + Math.floor(R() * 4) });
    });

    s.effort = [
      { id: uid('e'), date: now - 20 * DAY, tool: 'Bài tập theo mức độ', minutes: 14, note: 'Nhóm vần an, ăn, ân' },
      { id: uid('e'), date: now - 13 * DAY, tool: 'Truyện đúng vần', minutes: 9, note: 'Vần ai, ay' },
      { id: uid('e'), date: now - 6 * DAY, tool: 'Phiếu đọc nhanh', minutes: 18, note: 'Ghi lỗi đọc nhóm 5, 6' }
    ];

    s.library = [{
      id: uid('lib'), kind: 'truyen', title: 'Truyện mẫu: Bé và bạn', vans: ['an', 'ăn'], level: 'tu-lam',
      createdAt: now - 13 * DAY, approvedAt: now - 13 * DAY, minutes: 9, source: 'mau',
      content: {
        story: 'Bạn Lan có khăn đỏ. Bà cho Lan quả mận. Lan và bé ra sân.',
        questions: [
          { q: 'Bạn Lan có gì?', a: 'Bạn Lan có khăn đỏ.' },
          { q: 'Bà cho Lan quả gì?', a: 'Bà cho Lan quả mận.' }
        ]
      }
    }];

    // Bài tập do AI soạn, giáo viên đã sửa một chỗ (minh họa nhật ký chỉnh sửa).
    var aiTasks = [
      { _id: 'task-d1', level: 'ho-tro', type: 'nhan-dien', van: 'an', prompt: 'Nghe cô đọc, chọn tiếng có vần an.', question: 'Tiếng nào có vần an?', options: ['bàn', 'chăn', 'cân'], answer: 'bàn', teacherNote: 'Đọc mẫu vần an hai lần.' },
      { _id: 'task-d2', level: 'tu-lam', type: 'hoan-thanh-cau', van: 'an', prompt: 'Chọn tiếng điền vào chỗ trống.', question: 'Bé đi ___ ở sân.', options: ['chơi', 'chăn', 'chân'], answer: 'chơi', teacherNote: '' },
      { _id: 'task-d3', level: 'van-dung', type: 'doc', van: 'an', prompt: 'Đọc to cho cô nghe.', question: 'Bạn Lan có khăn đỏ.', options: [], answer: '', teacherNote: 'Ghi lại tiếng em đọc sai.' }
    ];
    var aiOriginal = JSON.parse(JSON.stringify(aiTasks));
    aiOriginal[1].question = 'Bé đi ___ ở vườn.';
    s.library.push({
      id: 'lib-demo-ai', kind: 'bai-tap', title: 'Bài tập vần an', vans: ['an'], createdAt: now - 20 * DAY, approvedAt: now - 20 * DAY,
      minutes: 14, source: 'ai', content: { tasks: aiTasks }, aiOriginal: { tasks: aiOriginal },
      edits: [{ field: 'Nhiệm vụ 2, câu hỏi', before: 'Bé đi ___ ở vườn.', after: 'Bé đi ___ ở sân.' }], outsideStart: 1, outsideEnd: 0
    });

    // Gói 5 phút cùng con đã giao về nhà.
    s.library.push({
      id: 'lib-demo-home', kind: 'phu-huynh', title: '5 phút cùng con: vần an, ăn', vans: ['an', 'ăn'], createdAt: now - 9 * DAY, approvedAt: now - 9 * DAY,
      minutes: 6, source: 'mau', edits: [],
      content: {
        title: '5 phút cùng con: vần an, ăn',
        read3: ['Bố mẹ đọc mẫu vần an, ăn hai lần, con đọc theo.', 'Con đọc các tiếng dưới đây. Con đọc sai thì đọc mẫu lại, không chê.', 'Con đọc câu ngắn. Khen khi con tự đọc được.'],
        readWords: ['bàn', 'bạn', 'chăn', 'khăn', 'Bạn Lan có khăn đỏ.'],
        write2: 'Con viết 2 tiếng vào vở ô li, mỗi tiếng một dòng ngắn.',
        writeWords: ['bàn', 'khăn'],
        tips: ['Ngồi cạnh con, đọc chậm và rõ.', 'Chỉ luyện khoảng 5 phút, dừng khi con mệt.', 'Ghi lại tiếng con còn đọc sai để báo cô.'],
        phone: 'Cô gửi gói 5 phút luyện vần an, ăn. Bố mẹ đọc mẫu, con đọc theo: bàn, bạn, chăn, khăn. Sau đó con viết 2 tiếng: bàn, khăn. Bố mẹ ghi lại tiếng con còn đọc sai giúp cô nhé.'
      }
    });
    [['stu-1', 'da-lam', 'tu-lam'], ['stu-2', 'da-lam', 'lam-cung'], ['stu-4', 'chua-lam', ''], ['stu-6', 'da-lam', 'nhac-nho'], ['stu-7', 'da-giao', '']].forEach(function (h, i) {
      s.homework.push({ id: 'hw-demo-' + i, packId: 'lib-demo-home', studentId: h[0], sentAt: now - 8 * DAY, status: h[1], support: h[2], note: '', updatedAt: now - (h[1] === 'da-giao' ? 8 : 4) * DAY });
    });

    // Một em đã được giao bài.
    s.assignments['stu-1'] = { van: 'an', level: 'ho-tro', source: 'goi-y', date: now - DAY,
      reason: 'Giao theo gợi ý của bản đồ âm vần.' };
    return s;
  }

  function resetToEmpty(keepClass) {
    var cls = keepClass ? state.classInfo : null;
    var students = keepClass ? state.students : [];
    commit(function (s) {
      var fresh = emptyState();
      Object.keys(fresh).forEach(function (k) { s[k] = fresh[k]; });
      if (cls) { s.classInfo = Object.assign({}, cls, { name: cls.name.replace(' (mẫu)', '') }); s.students = students; }
      migrate(s);
    });
  }
  function resetToDemo() {
    var demo = buildDemo();
    commit(function (s) { Object.keys(demo).forEach(function (k) { s[k] = demo[k]; }); migrate(s); });
  }
  function importState(obj) {
    if (!obj || obj.version !== 1 || !Array.isArray(obj.students)) throw new Error('Tệp không đúng định dạng sao lưu của Vần vui AI.');
    commit(function (s) { var base = emptyState(); Object.keys(base).forEach(function (k) { s[k] = obj[k] !== undefined ? obj[k] : base[k]; }); migrate(s); });
  }

  function storageSize() {
    var raw = safeGet(KEY) || '';
    return raw.length * 2;
  }

  VV.store = {
    load: load, save: save, commit: commit, onChange: onChange, uid: uid,
    get state() { return state; },
    get settings() { return settings; },
    get saveFailed() { return saveFailed; },
    getApiKey: getApiKey, setApiKey: setApiKey,
    student: student, studentLabel: studentLabel, kho: kho,
    vanMap: vanMap, cellStatus: cellStatus, suggest: suggest, levelFor: levelFor, assignment: assignment,
    latestTest: latestTest, groupPrePost: groupPrePost, errorCounts: errorCounts,
    writingScore: writingScore, latestWriting: latestWriting, effortMinutes: effortMinutes,
    abForm: abForm, resetToEmpty: resetToEmpty, resetToDemo: resetToDemo, importState: importState,
    storageSize: storageSize, rng: rng, DAY: DAY
  };
})(window.VV = window.VV || {});
