/* Công cụ đánh giá: phiếu đọc nhanh, bài đo A/B, chấm viết, đọc hiểu, nhật ký lỗi. */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store, V = VV.viet;

  var TABS = [
    { id: 'phieu', label: 'Phiếu đọc nhanh' },
    { id: 'ab', label: 'Bài đo đọc A/B' },
    { id: 'viet', label: 'Chấm bài viết' },
    { id: 'doc-hieu', label: 'Đọc hiểu' },
    { id: 'nhat-ky', label: 'Nhật ký lỗi' }
  ];
  var tab = TABS[0];

  var phieu = { setup: { studentId: '', phase: 'thuong-xuyen', vans: null, per: 6 }, sess: null };
  var ab = { studentId: '', phase: 'dau-vao', form: 'A', scope: null, items: null };
  var viet = { studentId: '', phase: 'thuong-xuyen', words: null, scores: {}, independence: 'nhin-mau', note: '', photo: '' };
  var dh = { studentId: '', phase: 'thuong-xuyen', source: '', answers: {}, support: 'tu-doc' };
  var log = { studentId: '', skill: '', phase: '', onlyErrors: true };

  function firstStudent() { return (S.state.students[0] || {}).id || ''; }
  function studentField(id, value, label) {
    return '<div class="field"><label for="' + id + '">' + (label || 'Học sinh') + '</label><select id="' + id + '" name="studentId" required>' + ui.studentOptions(value) + '</select></div>';
  }
  function phaseField(name, value) {
    return '<fieldset class="field"><legend>Thời điểm</legend>' + ui.segmented(name, D.PHASES, value, 'Thời điểm') + '</fieldset>';
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---------- Phiếu đọc nhanh ----------
  function phieuSetupHTML() {
    var st = phieu.setup;
    if (!st.studentId) st.studentId = firstStudent();
    if (!st.vans) st.vans = D.GROUPS[S.state.classInfo.progress - 1].vans.slice();
    var learned = D.vansUpTo(Math.min(10, S.state.classInfo.progress + 1));
    return '<form class="panel" data-form="phieu-setup">' +
      '<p class="muted">Giáo viên nghe học sinh đọc từng tiếng và ghi kết quả. Mỗi vần 3 hoặc 6 tiếng. Kết quả cập nhật bản đồ âm vần ngay.</p>' +
      '<div class="form-grid">' + studentField('ph-stu', st.studentId) + phaseField('ph-phase', st.phase) + '</div>' +
      '<fieldset class="field"><legend>Vần cần đo</legend><div class="chip-check">' +
      learned.map(function (v) {
        return '<input type="checkbox" id="ph-v-' + v + '" name="vans" value="' + ui.esc(v) + '"' + (st.vans.indexOf(v) !== -1 ? ' checked' : '') + '><label for="ph-v-' + v + '" class="reading">' + ui.esc(v) + '</label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="field"><legend>Số tiếng mỗi vần</legend>' + ui.segmented('ph-per', [{ id: '3', label: '3 tiếng' }, { id: '6', label: '6 tiếng' }], String(st.per), 'Số tiếng mỗi vần') + '</fieldset>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Bắt đầu ghi phiếu</button></div></form>';
  }

  function phieuSessionHTML() {
    var s = phieu.sess;
    var it = s.items[s.idx];
    var done = s.items.filter(function (x) { return x.result !== null; }).length;
    return '<div class="assess-session">' +
      '<section class="show-card oli-paper" id="show-card" aria-label="Màn hình cho học sinh đọc">' +
      '<p class="show-meta">Tiếng ' + (s.idx + 1) + ' trên ' + s.items.length + '</p>' +
      '<p class="show-word reading" aria-live="polite">' + ui.esc(it.tieng) + '</p>' +
      '<div class="show-nav"><button type="button" class="btn btn-ghost" data-act="ph-prev"' + (s.idx === 0 ? ' disabled' : '') + '>' + ui.icon('arrowLeft') + 'Trước</button>' +
      '<button type="button" class="btn btn-ghost" data-act="ph-full">' + ui.icon('expand') + 'Toàn màn hình</button>' +
      '<button type="button" class="btn btn-ghost" data-act="ph-next"' + (s.idx === s.items.length - 1 ? ' disabled' : '') + '>Sau' + ui.icon('arrowRight') + '</button></div></section>' +
      '<section class="panel mark-panel" aria-label="Phần giáo viên ghi">' +
      '<h2 class="panel-title">' + ui.esc(S.studentLabel(s.studentId)) + ' đọc tiếng <span class="reading">' + ui.vanWord(it.tieng, it.van) + '</span></h2>' +
      '<div class="mark-buttons"><button type="button" class="btn btn-lg mark-ok' + (it.result === true ? ' is-on' : '') + '" data-act="ph-mark" data-ok="1" aria-pressed="' + (it.result === true) + '">Đúng <kbd>D</kbd></button>' +
      '<button type="button" class="btn btn-lg mark-miss' + (it.result === false ? ' is-on' : '') + '" data-act="ph-mark" data-ok="0" aria-pressed="' + (it.result === false) + '">Chưa đúng <kbd>S</kbd></button></div>' +
      (it.result === false
        ? '<fieldset class="field"><legend>Loại lỗi <span class="optional">(phím 1 đến 5)</span></legend><div class="chip-check">' +
          D.READ_ERRORS.map(function (e, i) {
            return '<input type="radio" id="ph-err-' + e.id + '" name="ph-err" value="' + e.id + '"' + (it.error === e.id ? ' checked' : '') + '><label for="ph-err-' + e.id + '"><kbd>' + (i + 1) + '</kbd>' + ui.esc(e.label) + '</label>';
          }).join('') + '</div></fieldset>'
        : '') +
      '<fieldset class="field"><legend>Mức hỗ trợ</legend>' + ui.segmented('ph-support', [{ id: 'tu-doc', label: 'Tự đọc' }, { id: 'co-ho-tro', label: 'Có hỗ trợ' }], it.support, 'Mức hỗ trợ') + '</fieldset>' +
      '<ol class="mark-list" aria-label="Danh sách tiếng">' + s.items.map(function (x, i) {
        var cls = x.result === true ? 'is-ok' : x.result === false ? 'is-miss' : '';
        return '<li><button type="button" class="mark-item ' + cls + (i === s.idx ? ' is-current' : '') + '" data-act="ph-go" data-i="' + i + '" aria-label="' + ui.esc(x.tieng) + (x.result === true ? ', đúng' : x.result === false ? ', chưa đúng' : ', chưa chấm') + '"' + (i === s.idx ? ' aria-current="true"' : '') + '><span class="reading">' + ui.esc(x.tieng) + '</span></button></li>';
      }).join('') + '</ol>' +
      '<p class="muted">Phím tắt: D là đúng, S là chưa đúng, mũi tên trái phải để chuyển tiếng.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="ph-cancel">Hủy phiếu</button>' +
      '<button type="button" class="btn btn-primary" data-act="ph-save">Lưu phiếu (' + done + '/' + s.items.length + ' đã chấm)</button></div>' +
      '</section></div>';
  }

  function phieuStart(form) {
    var st = phieu.setup;
    st.studentId = form.studentId.value;
    st.phase = form.querySelector('input[name="ph-phase"]:checked').value;
    st.vans = Array.prototype.map.call(form.querySelectorAll('input[name="vans"]:checked'), function (i) { return i.value; });
    st.per = Number(form.querySelector('input[name="ph-per"]:checked').value);
    if (!st.studentId) { ui.toast('Chọn học sinh.', 'error'); return; }
    if (!st.vans.length) { ui.toast('Chọn ít nhất một vần.', 'error'); return; }
    var items = [];
    st.vans.forEach(function (v) {
      var g = D.groupOfVan(v);
      shuffle(g.words[v]).slice(0, st.per).forEach(function (w) { items.push({ tieng: w, van: v, result: null, error: null, support: 'tu-doc' }); });
    });
    phieu.sess = { studentId: st.studentId, phase: st.phase, items: shuffle(items), idx: 0, startedAt: Date.now() };
    VV.app.refresh();
  }

  function phieuMark(ok) {
    var s = phieu.sess;
    var it = s.items[s.idx];
    it.result = ok;
    if (ok) { it.error = null; if (s.idx < s.items.length - 1) s.idx++; }
    VV.app.refresh();
  }

  function phieuSave() {
    var s = phieu.sess;
    var marked = s.items.filter(function (x) { return x.result !== null; });
    if (!marked.length) { ui.toast('Chưa chấm tiếng nào.', 'error'); return; }
    var minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));
    S.commit(function (st) {
      var now = Date.now();
      marked.forEach(function (x) {
        st.records.push({ id: S.uid('r'), studentId: s.studentId, date: now, phase: s.phase, skill: 'doc', source: 'phieu',
          van: x.van, tieng: x.tieng, correct: x.result, error: x.result ? null : x.error, support: x.support });
      });
      st.effort.push({ id: S.uid('e'), date: now, tool: 'Phiếu đọc nhanh', minutes: minutes, note: S.studentLabel(s.studentId) + ', ' + marked.length + ' tiếng' });
    });
    var ok = marked.filter(function (x) { return x.result; }).length;
    ui.toast('Đã lưu phiếu của ' + S.studentLabel(s.studentId) + ': ' + ok + '/' + marked.length + ' tiếng đúng.');
    phieu.sess = null;
    VV.app.refresh();
  }

  // ---------- Bài đo A/B ----------
  function abHTML() {
    if (!ab.studentId) ab.studentId = firstStudent();
    if (!ab.scope) ab.scope = S.state.classInfo.progress;
    if (!ab.items) ab.items = S.abForm(ab.form, ab.scope).map(function (w) { return { tieng: w, van: V.parse(w).van, result: null, error: '' }; });
    var score = ab.items.filter(function (x) { return x.result === true; }).length;
    var marked = ab.items.filter(function (x) { return x.result !== null; }).length;
    var tests = S.state.tests.slice().sort(function (a, b) { return b.date - a.date; });
    return '<form class="panel" data-form="ab">' +
      '<p class="muted">Hai dạng A và B tương đương: cùng số tiếng mỗi vần, khác tiếng. Dùng A cho đầu vào, B cho đầu ra để so sánh tiến bộ mà học sinh không học thuộc bài.</p>' +
      '<div class="form-grid">' + studentField('ab-stu', ab.studentId) +
      '<fieldset class="field"><legend>Thời điểm</legend>' + ui.segmented('ab-phase', [{ id: 'dau-vao', label: 'Đầu vào' }, { id: 'dau-ra', label: 'Đầu ra' }], ab.phase, 'Thời điểm') + '</fieldset>' +
      '<fieldset class="field"><legend>Dạng bài</legend>' + ui.segmented('ab-form', [{ id: 'A', label: 'Dạng A' }, { id: 'B', label: 'Dạng B' }], ab.form, 'Dạng bài') + '</fieldset>' +
      '<div class="field"><label for="ab-scope">Phạm vi</label><select id="ab-scope" name="scope">' +
      D.GROUPS.map(function (g) { return '<option value="' + g.id + '"' + (g.id === ab.scope ? ' selected' : '') + '>Nhóm 1 đến ' + g.id + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="ab-grid">' + ab.items.map(function (x, i) {
        return '<div class="ab-cell' + (x.result === true ? ' is-ok' : x.result === false ? ' is-miss' : '') + '">' +
          '<span class="ab-num num">' + (i + 1) + '</span><span class="ab-word reading">' + ui.esc(x.tieng) + '</span>' +
          '<span class="ab-actions"><button type="button" class="btn-icon btn-ok" data-act="ab-mark" data-i="' + i + '" data-ok="1" aria-label="' + ui.esc(x.tieng) + ' đúng" aria-pressed="' + (x.result === true) + '">' + ui.icon('check') + '</button>' +
          '<button type="button" class="btn-icon btn-miss" data-act="ab-mark" data-i="' + i + '" data-ok="0" aria-label="' + ui.esc(x.tieng) + ' chưa đúng" aria-pressed="' + (x.result === false) + '">' + ui.icon('x') + '</button></span>' +
          (x.result === false ? '<select class="ab-err" data-ab-err="' + i + '" aria-label="Loại lỗi của ' + ui.esc(x.tieng) + '"><option value="">Loại lỗi</option>' +
            D.READ_ERRORS.map(function (e) { return '<option value="' + e.id + '"' + (x.error === e.id ? ' selected' : '') + '>' + ui.esc(e.label) + '</option>'; }).join('') + '</select>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<div class="ab-foot"><p class="ab-score"><span class="num">' + score + '/20</span> tiếng đúng, đã chấm ' + marked + '/20</p>' +
      '<div class="btn-row"><button type="button" class="btn" data-act="ab-print">' + ui.icon('printer') + 'In bài đo cho học sinh</button>' +
      '<button type="submit" class="btn btn-primary">Lưu bài đo</button></div></div></form>' +
      '<section class="panel"><h2 class="panel-title">Các bài đo đã lưu</h2>' +
      (tests.length ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Ngày</th><th scope="col">Học sinh</th><th scope="col">Thời điểm</th><th scope="col">Dạng</th><th scope="col" class="num">Kết quả</th><th scope="col"><span class="sr-only">Thao tác</span></th></tr></thead><tbody>' +
        tests.map(function (t) {
          return '<tr><td class="tnum">' + ui.fmtDate(t.date) + '</td><td>' + ui.esc(S.studentLabel(t.studentId)) + '</td><td>' + ui.esc(D.label(D.PHASES, t.phase)) + '</td><td>' + t.form + '</td>' +
            '<td class="num">' + t.score + '/' + t.total + '</td><td><button type="button" class="btn-icon" data-act="ab-del" data-id="' + t.id + '" aria-label="Xóa bài đo ngày ' + ui.fmtDate(t.date) + ' của ' + ui.esc(S.studentLabel(t.studentId)) + '">' + ui.icon('trash') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có bài đo nào.</p>') +
      '</section>';
  }

  // ---------- Chấm bài viết ----------
  function vietHTML() {
    if (!viet.studentId) viet.studentId = firstStudent();
    if (!viet.words) { var g = D.GROUPS[S.state.classInfo.progress - 1]; viet.words = g.vans.slice(0, 2).map(function (v) { return g.words[v][0]; }).concat(g.phrases.slice(0, 3)); }
    var levels = [{ id: '0', label: 'Chưa đạt' }, { id: '1', label: 'Gần đạt' }, { id: '2', label: 'Đạt' }];
    var rows = viet.words.map(function (w, i) {
      return '<tr><th scope="row"><input class="reading input-word" data-word="' + i + '" value="' + ui.esc(w) + '" aria-label="Chữ thứ ' + (i + 1) + '"></th>' +
        D.WRITE_CRITERIA.map(function (c) {
          var key = i + '-' + c.id;
          var val = viet.scores[key] != null ? String(viet.scores[key]) : '';
          return '<td>' + ui.segmented('sc-' + key, levels, val, c.label + ' của chữ ' + (i + 1)) + '</td>';
        }).join('') + '</tr>';
    }).join('');
    return '<form class="panel" data-form="viet">' +
      '<p class="muted">Chấm theo tiêu chí thống nhất trên bài viết trong vở. Ảnh chỉ cho thấy kết quả cuối; thứ tự nét và cách cầm bút cần quan sát khi em viết.</p>' +
      '<div class="form-grid">' + studentField('vt-stu', viet.studentId) + phaseField('vt-phase', viet.phase) + '</div>' +
      '<div class="table-wrap"><table class="table score-table"><thead><tr><th scope="col">Chữ</th>' +
      D.WRITE_CRITERIA.map(function (c) { return '<th scope="col">' + ui.esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<fieldset class="field"><legend>Mức độc lập khi viết</legend>' + ui.segmented('vt-ind', D.INDEPENDENCE, viet.independence, 'Mức độc lập') + '</fieldset>' +
      '<div class="form-grid"><div class="field"><label for="vt-note">Nhận xét <span class="optional">(không bắt buộc)</span></label><textarea id="vt-note" name="note" rows="2">' + ui.esc(viet.note) + '</textarea></div>' +
      '<div class="field"><label for="vt-photo">Ảnh bài viết <span class="optional">(không bắt buộc)</span></label><input id="vt-photo" type="file" accept="image/*" capture="environment" name="photo">' +
      (viet.photo ? '<img class="photo-thumb" src="' + viet.photo + '" width="' + (viet.photoW || 900) + '" height="' + (viet.photoH || 675) + '" alt="Ảnh bài viết vừa chọn">' : '') +
      '<p class="hint">Ảnh được thu nhỏ và chỉ lưu trên máy này.</p></div></div>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu bài viết</button></div></form>' +
      writingHistoryHTML(viet.studentId);
  }

  function writingHistoryHTML(sid) {
    var list = S.state.writing.filter(function (w) { return w.studentId === sid; }).sort(function (a, b) { return a.date - b.date; });
    if (!list.length) return '';
    var first = list[0], last = list[list.length - 1];
    function card(w, title) {
      var sc = S.writingScore(w);
      return '<article class="write-card"><h3 class="sub-title">' + title + ' (' + ui.fmtDate(w.date) + ')</h3>' +
        (w.photo ? '<img class="photo" src="' + w.photo + '" width="' + (w.photoW || 900) + '" height="' + (w.photoH || 675) + '" loading="lazy" alt="Bài viết của ' + ui.esc(S.studentLabel(sid)) + ' ngày ' + ui.fmtDate(w.date) + '">' : '<p class="photo-none">Không có ảnh</p>') +
        '<p class="write-total"><span class="num">' + sc.got + '/' + sc.max + '</span> điểm tiêu chí, ' + ui.esc(D.label(D.INDEPENDENCE, w.independence).toLowerCase()) + '</p>' +
        '<ul class="crit-bars">' + D.WRITE_CRITERIA.map(function (c) {
          var got = 0; w.items.forEach(function (it) { got += (it.scores && it.scores[c.id]) || 0; });
          var max = w.items.length * 2;
          return '<li><span>' + ui.esc(c.label) + '</span><span class="bar"><span style="width:' + Math.round(got / max * 100) + '%"></span></span><span class="num">' + got + '/' + max + '</span></li>';
        }).join('') + '</ul>' + (w.note ? '<p class="muted">' + ui.esc(w.note) + '</p>' : '') + '</article>';
    }
    return '<section class="panel"><h2 class="panel-title">Nét chữ lớn lên: ' + ui.esc(S.studentLabel(sid)) + '</h2>' +
      (list.length > 1 ? '<div class="write-compare">' + card(first, 'Bài đầu') + card(last, 'Bài mới nhất') + '</div>' : card(first, 'Bài đã chấm')) +
      '<p class="muted">' + list.length + ' bài viết đã lưu.</p></section>';
  }

  // ---------- Đọc hiểu ----------
  function textSources() {
    var out = [];
    S.state.library.filter(function (x) { return x.kind === 'truyen'; }).forEach(function (x) {
      out.push({ id: x.id, title: x.title, text: x.content.story, questions: x.content.questions.map(function (q) { return q.q; }) });
    });
    D.GROUPS.slice(0, S.state.classInfo.progress).forEach(function (g) {
      out.push({ id: 'g' + g.id, title: 'Câu nhóm ' + g.id + ' (' + g.title + ')', text: g.sentences.join(' '),
        questions: ['Câu đầu tiên nói về ai?', 'Em hãy đọc lại câu có tiếng vần ' + g.vans[0] + '.'] });
    });
    return out;
  }
  function dhHTML() {
    if (!dh.studentId) dh.studentId = firstStudent();
    var src = textSources();
    var cur = src.filter(function (x) { return x.id === dh.source; })[0] || src[0];
    dh.source = cur.id;
    return '<form class="panel" data-form="dh">' +
      '<p class="muted">2 đến 3 câu hỏi với ngữ liệu phù hợp giai đoạn học. Ghi rõ em tự đọc hay được đọc hỗ trợ.</p>' +
      '<div class="form-grid">' + studentField('dh-stu', dh.studentId) + phaseField('dh-phase', dh.phase) +
      '<div class="field"><label for="dh-src">Bài đọc</label><select id="dh-src" name="source">' +
      src.map(function (x) { return '<option value="' + x.id + '"' + (x.id === cur.id ? ' selected' : '') + '>' + ui.esc(x.title) + '</option>'; }).join('') + '</select></div></div>' +
      '<p class="reading story-big oli-paper">' + ui.esc(cur.text) + '</p>' +
      '<ol class="dh-questions">' + cur.questions.slice(0, 3).map(function (q, i) {
        return '<li><p>' + ui.esc(q) + '</p>' + ui.segmented('dh-q' + i, [{ id: '1', label: 'Trả lời đúng' }, { id: '0', label: 'Chưa đúng' }], dh.answers[i] != null ? String(dh.answers[i]) : '', 'Kết quả câu ' + (i + 1)) + '</li>';
      }).join('') + '</ol>' +
      '<fieldset class="field"><legend>Cách đọc</legend>' + ui.segmented('dh-support', [{ id: 'tu-doc', label: 'Em tự đọc' }, { id: 'duoc-doc', label: 'Được đọc hỗ trợ' }], dh.support, 'Cách đọc') + '</fieldset>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu kết quả đọc hiểu</button></div></form>';
  }

  // ---------- Nhật ký lỗi ----------
  function logRows() {
    return S.state.records.filter(function (r) {
      if (log.studentId && r.studentId !== log.studentId) return false;
      if (log.skill && r.skill !== log.skill) return false;
      if (log.phase && r.phase !== log.phase) return false;
      if (log.onlyErrors && r.correct) return false;
      return true;
    }).sort(function (a, b) { return b.date - a.date; });
  }
  function logHTML() {
    var rows = logRows();
    var shown = rows.slice(0, 150);
    return '<section class="panel"><form class="filters" data-form="log">' +
      '<div class="field"><label for="lg-stu">Học sinh</label><select id="lg-stu" name="studentId">' + ui.studentOptions(log.studentId, 'Cả lớp') + '</select></div>' +
      '<div class="field"><label for="lg-skill">Kỹ năng</label><select id="lg-skill" name="skill"><option value="">Tất cả</option><option value="doc"' + (log.skill === 'doc' ? ' selected' : '') + '>Đọc (giáo viên nghe)</option><option value="nhan-dien"' + (log.skill === 'nhan-dien' ? ' selected' : '') + '>Nhận diện (trò chơi)</option></select></div>' +
      '<div class="field"><label for="lg-phase">Thời điểm</label><select id="lg-phase" name="phase"><option value="">Tất cả</option>' + D.PHASES.map(function (p) { return '<option value="' + p.id + '"' + (log.phase === p.id ? ' selected' : '') + '>' + p.label + '</option>'; }).join('') + '</select></div>' +
      '<label class="check"><input type="checkbox" name="onlyErrors"' + (log.onlyErrors ? ' checked' : '') + '><span>Chỉ hiện lỗi</span></label>' +
      '<button type="button" class="btn" data-act="log-csv">' + ui.icon('download') + 'Xuất CSV</button></form>' +
      '<p class="muted">' + rows.length + ' dòng' + (rows.length > shown.length ? ', hiện 150 dòng mới nhất' : '') + '.</p>' +
      (shown.length ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Ngày</th><th scope="col">Học sinh</th><th scope="col">Tiếng</th><th scope="col">Vần</th><th scope="col">Kỹ năng</th><th scope="col">Kết quả</th><th scope="col">Lỗi</th><th scope="col"><span class="sr-only">Thao tác</span></th></tr></thead><tbody>' +
        shown.map(function (r) {
          return '<tr><td class="tnum">' + ui.fmtShort(r.date) + '</td><td>' + ui.esc(S.studentLabel(r.studentId)) + '</td><td class="reading">' + ui.vanWord(r.tieng, r.van) + '</td><td>' + ui.esc(r.van) + '</td>' +
            '<td>' + (r.skill === 'doc' ? 'Đọc' : 'Nhận diện') + '</td><td>' + (r.correct ? '<span class="pill pill-ok">Đúng</span>' : '<span class="pill pill-miss">Chưa đúng</span>') + '</td>' +
            '<td>' + (r.error ? ui.esc(D.label(D.READ_ERRORS, r.error)) : '') + '</td>' +
            '<td><button type="button" class="btn-icon" data-act="log-del" data-id="' + r.id + '" aria-label="Xóa dòng ' + ui.esc(r.tieng) + ' của ' + ui.esc(S.studentLabel(r.studentId)) + '">' + ui.icon('trash') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' : ui.emptyState('Không có dòng nào', 'Đổi bộ lọc hoặc ghi phiếu đọc nhanh để có dữ liệu.')) +
      '</section>';
  }

  // ---------- Vẽ ----------
  function render(root, params) {
    tab = TABS.filter(function (t) { return t.id === params[0]; })[0] || TABS[0];
    // Liên kết sâu: #/danh-gia/phieu/<mã HS>/<nhóm>/<vần>
    if (tab.id === 'phieu' && params[1] && !phieu.sess) {
      phieu.setup.studentId = params[1];
      if (params[3]) phieu.setup.vans = [params[3]];
      history.replaceState(null, '', '#/danh-gia/phieu');
    }
    if (!S.state.students.length) {
      root.innerHTML = '<section class="page"><header class="page-head"><div><h1>Đánh giá</h1></div></header>' +
        ui.emptyState('Lớp chưa có học sinh', 'Thêm mã học sinh trước khi ghi kết quả.', '<a class="btn btn-primary" href="#/cai-dat/lop">Thêm học sinh</a>') + '</section>';
      return;
    }
    var body = tab.id === 'phieu' ? (phieu.sess ? phieuSessionHTML() : phieuSetupHTML())
      : tab.id === 'ab' ? abHTML() : tab.id === 'viet' ? vietHTML() : tab.id === 'doc-hieu' ? dhHTML() : logHTML();
    root.innerHTML = '<section class="page"><header class="page-head"><div><h1>Đánh giá</h1>' +
      '<p class="lede">Giáo viên nghe, quan sát và ghi kết quả. Hệ thống chưa tự chấm phát âm hay chữ viết.</p></div></header>' +
      '<nav class="tabs" aria-label="Công cụ đánh giá">' + TABS.map(function (t) {
        return '<a class="tab' + (t === tab ? ' is-active' : '') + '" href="#/danh-gia/' + t.id + '"' + (t === tab ? ' aria-current="page"' : '') + '>' + t.label + '</a>';
      }).join('') + '</nav>' + body + '</section>';
  }

  function printAB() {
    ui.printHTML('<h1 class="print-title">Bài đo đọc dạng ' + ab.form + ' (nhóm 1 đến ' + ab.scope + ')</h1>' +
      '<div class="print-ab">' + ab.items.map(function (x) { return '<span class="reading">' + ui.esc(x.tieng) + '</span>'; }).join('') + '</div>', 'Bài đo đọc dạng ' + ab.form);
  }

  VV.assess = { writingHistoryHTML: writingHistoryHTML, isDirty: function () { return !!(phieu.sess && phieu.sess.items.some(function (x) { return x.result !== null; })); } };

  VV.views['danh-gia'] = {
    render: render,
    act: {
      'ph-mark': function (el) { phieuMark(el.getAttribute('data-ok') === '1'); },
      'ph-prev': function () { if (phieu.sess.idx > 0) { phieu.sess.idx--; VV.app.refresh(); } },
      'ph-next': function () { if (phieu.sess.idx < phieu.sess.items.length - 1) { phieu.sess.idx++; VV.app.refresh(); } },
      'ph-go': function (el) { phieu.sess.idx = Number(el.getAttribute('data-i')); VV.app.refresh(); },
      'ph-full': function () {
        var c = document.getElementById('show-card');
        if (c && c.requestFullscreen) c.requestFullscreen().catch(function () { ui.toast('Trình duyệt không cho mở toàn màn hình.', 'error'); });
      },
      'ph-save': phieuSave,
      'ph-cancel': function () {
        ui.confirmDialog({ title: 'Hủy phiếu này?', body: 'Kết quả đã chấm trong phiếu sẽ không được lưu.' }, 'Hủy phiếu', true).then(function (ok) {
          if (ok) { phieu.sess = null; VV.app.refresh(); }
        });
      },
      'ab-mark': function (el) {
        var x = ab.items[Number(el.getAttribute('data-i'))];
        var ok = el.getAttribute('data-ok') === '1';
        x.result = x.result === ok ? null : ok;
        if (x.result !== false) x.error = '';
        VV.app.refresh();
      },
      'ab-print': printAB,
      'ab-del': function (el) {
        var id = el.getAttribute('data-id');
        ui.confirmDialog({ title: 'Xóa bài đo?', body: 'Bài đo và các kết quả đọc đi kèm sẽ bị xóa.' }, 'Xóa', true).then(function (ok) {
          if (!ok) return;
          S.commit(function (s) {
            s.tests = s.tests.filter(function (t) { return t.id !== id; });
            s.records = s.records.filter(function (r) { return r.testId !== id; });
          });
          VV.app.refresh();
        });
      },
      'log-del': function (el) {
        var id = el.getAttribute('data-id');
        ui.confirmDialog({ title: 'Xóa dòng này?', body: 'Kết quả đọc này sẽ bị xóa khỏi hồ sơ và bản đồ âm vần.' }, 'Xóa', true).then(function (ok) {
          if (!ok) return;
          S.commit(function (s) { s.records = s.records.filter(function (r) { return r.id !== id; }); });
          ui.toast('Đã xóa một dòng.');
          VV.app.refresh();
        });
      },
      'log-csv': function () {
        var rows = [['Ngày', 'Học sinh', 'Tiếng', 'Vần', 'Kỹ năng', 'Thời điểm', 'Kết quả', 'Lỗi', 'Nguồn']];
        logRows().forEach(function (r) {
          rows.push([ui.fmtDate(r.date), S.studentLabel(r.studentId), r.tieng, r.van, r.skill === 'doc' ? 'Đọc' : 'Nhận diện', D.label(D.PHASES, r.phase),
            r.correct ? 'Đúng' : 'Chưa đúng', r.error ? D.label(D.READ_ERRORS, r.error) : '', r.source]);
        });
        ui.download('nhat-ky-loi.csv', ui.csv(rows), 'text/csv;charset=utf-8');
      }
    },
    onchange: function (e) {
      var t = e.target;
      var form = t.closest('form');
      var f = form && form.getAttribute('data-form');
      if (f === 'phieu-setup') {
        if (t.name === 'studentId') phieu.setup.studentId = t.value;
        if (t.name === 'ph-phase') phieu.setup.phase = t.value;
        return;
      }
      if (t.name === 'ph-err') { phieu.sess.items[phieu.sess.idx].error = t.value; if (phieu.sess.idx < phieu.sess.items.length - 1) { phieu.sess.idx++; } VV.app.refresh(); return; }
      if (t.name === 'ph-support') { phieu.sess.items[phieu.sess.idx].support = t.value; return; }
      if (f === 'ab') {
        if (t.name === 'studentId') ab.studentId = t.value;
        if (t.name === 'ab-phase') { ab.phase = t.value; ab.form = t.value === 'dau-vao' ? 'A' : 'B'; ab.items = null; VV.app.refresh(); }
        if (t.name === 'ab-form') { ab.form = t.value; ab.items = null; VV.app.refresh(); }
        if (t.name === 'scope') { ab.scope = Number(t.value); ab.items = null; VV.app.refresh(); }
        if (t.hasAttribute('data-ab-err')) ab.items[Number(t.getAttribute('data-ab-err'))].error = t.value;
        return;
      }
      if (f === 'viet') {
        if (t.name === 'studentId') { viet.studentId = t.value; VV.app.refresh(); }
        if (t.name === 'vt-phase') viet.phase = t.value;
        if (t.name === 'vt-ind') viet.independence = t.value;
        if (/^sc-/.test(t.name)) viet.scores[t.name.slice(3)] = Number(t.value);
        if (t.name === 'photo' && t.files && t.files[0]) {
          ui.readImage(t.files[0], 900).then(function (img) { viet.photo = img.url; viet.photoW = img.w; viet.photoH = img.h; VV.app.refresh(); }, function (err) { ui.toast(err.message, 'error'); });
        }
        return;
      }
      if (f === 'dh') {
        if (t.name === 'studentId') dh.studentId = t.value;
        if (t.name === 'dh-phase') dh.phase = t.value;
        if (t.name === 'source') { dh.source = t.value; dh.answers = {}; VV.app.refresh(); }
        if (/^dh-q\d$/.test(t.name)) dh.answers[Number(t.name.slice(4))] = Number(t.value);
        if (t.name === 'dh-support') dh.support = t.value;
        return;
      }
      if (f === 'log') {
        if (t.name === 'studentId') log.studentId = t.value;
        if (t.name === 'skill') log.skill = t.value;
        if (t.name === 'phase') log.phase = t.value;
        if (t.name === 'onlyErrors') log.onlyErrors = t.checked;
        VV.app.refresh();
      }
    },
    oninput: function (e) {
      var t = e.target;
      if (t.hasAttribute('data-word')) viet.words[Number(t.getAttribute('data-word'))] = t.value;
      if (t.name === 'note' && t.closest('form[data-form="viet"]')) viet.note = t.value;
    },
    onsubmit: function (e) {
      e.preventDefault();
      var form = e.target;
      var f = form.getAttribute('data-form');
      if (f === 'phieu-setup') phieuStart(form);
      if (f === 'ab') {
        var marked = ab.items.filter(function (x) { return x.result !== null; });
        if (marked.length < 20) { ui.toast('Còn ' + (20 - marked.length) + ' tiếng chưa chấm.', 'error'); return; }
        var score = marked.filter(function (x) { return x.result; }).length;
        var testId = S.uid('t');
        S.commit(function (s) {
          var now = Date.now();
          s.tests.push({ id: testId, studentId: ab.studentId, date: now, phase: ab.phase, form: ab.form, scope: ab.scope, score: score, total: 20,
            items: ab.items.map(function (x) { return { tieng: x.tieng, van: x.van, correct: x.result, error: x.result ? null : (x.error || null) }; }) });
          ab.items.forEach(function (x) {
            s.records.push({ id: S.uid('r'), studentId: ab.studentId, date: now, phase: ab.phase, skill: 'doc', source: 'bai-do', testId: testId,
              van: x.van, tieng: x.tieng, correct: x.result, error: x.result ? null : (x.error || null), support: 'tu-doc' });
          });
        });
        ui.toast('Đã lưu bài đo dạng ' + ab.form + ' của ' + S.studentLabel(ab.studentId) + ': ' + score + '/20.');
        ab.items = null;
        VV.app.refresh();
      }
      if (f === 'viet') {
        var missing = 0;
        viet.words.forEach(function (w, i) { D.WRITE_CRITERIA.forEach(function (c) { if (viet.scores[i + '-' + c.id] == null) missing++; }); });
        if (missing) { ui.toast('Còn ' + missing + ' ô tiêu chí chưa chấm.', 'error'); return; }
        S.commit(function (s) {
          s.writing.push({ id: S.uid('w'), studentId: viet.studentId, date: Date.now(), phase: viet.phase,
            items: viet.words.map(function (w, i) {
              var sc = {}; D.WRITE_CRITERIA.forEach(function (c) { sc[c.id] = viet.scores[i + '-' + c.id]; });
              return { text: w, scores: sc };
            }), independence: viet.independence, note: viet.note, photo: viet.photo, photoW: viet.photoW, photoH: viet.photoH });
        });
        if (S.saveFailed) ui.toast('Bộ nhớ trình duyệt đã đầy. Xuất bản sao lưu rồi xóa bớt ảnh cũ.', 'error');
        else ui.toast('Đã lưu bài viết của ' + S.studentLabel(viet.studentId) + '.');
        viet.scores = {}; viet.note = ''; viet.photo = ''; viet.photoW = 0; viet.photoH = 0;
        VV.app.refresh();
      }
      if (f === 'dh') {
        var src = textSources().filter(function (x) { return x.id === dh.source; })[0];
        var n = Math.min(3, src.questions.length);
        var ans = Object.keys(dh.answers).length;
        if (ans < n) { ui.toast('Còn ' + (n - ans) + ' câu hỏi chưa ghi kết quả.', 'error'); return; }
        var correct = 0; for (var i = 0; i < n; i++) correct += dh.answers[i] || 0;
        S.commit(function (s) {
          s.comprehension.push({ id: S.uid('c'), studentId: dh.studentId, date: Date.now(), phase: dh.phase, textTitle: src.title, correct: correct, total: n, support: dh.support });
        });
        ui.toast('Đã lưu: ' + correct + '/' + n + ' câu đúng.');
        dh.answers = {};
        VV.app.refresh();
      }
    },
    onkey: function (e) {
      if (tab.id !== 'phieu' || !phieu.sess) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key.toLowerCase();
      if (k === 'd' || k === 'đ') { e.preventDefault(); phieuMark(true); }
      else if (k === 's') { e.preventDefault(); phieuMark(false); }
      else if (k === 'arrowleft') { e.preventDefault(); if (phieu.sess.idx > 0) { phieu.sess.idx--; VV.app.refresh(); } }
      else if (k === 'arrowright') { e.preventDefault(); if (phieu.sess.idx < phieu.sess.items.length - 1) { phieu.sess.idx++; VV.app.refresh(); } }
      else if (/^[1-5]$/.test(k) && phieu.sess.items[phieu.sess.idx].result === false) {
        e.preventDefault();
        phieu.sess.items[phieu.sess.idx].error = D.READ_ERRORS[Number(k) - 1].id;
        if (phieu.sess.idx < phieu.sess.items.length - 1) phieu.sess.idx++;
        VV.app.refresh();
      }
    }
  };
})(window.VV = window.VV || {});
