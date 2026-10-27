/* Trợ lý soạn bài: AI soạn nháp, kiểm tra kho tiếng, giáo viên sửa và duyệt. */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store, V = VV.viet;

  var TABS = [
    { id: 'bai-tap', tool: 'exercises', label: 'Bài tập theo mức độ', libKind: 'bai-tap' },
    { id: 'truyen', tool: 'story', label: 'Truyện đúng vần', libKind: 'truyen' },
    { id: 'phu-huynh', tool: 'parent', label: '5 phút cùng con', libKind: 'phu-huynh' },
    { id: 'phieu-viet', tool: 'writing', label: 'Phiếu luyện viết', libKind: 'phieu-viet' },
    { id: 'kho', tool: null, label: 'Kho học liệu' }
  ];
  var KIND_LABEL = { 'bai-tap': 'Bài tập', truyen: 'Truyện', 'phu-huynh': '5 phút cùng con', 'phieu-viet': 'Phiếu luyện viết' };

  var drafts = {};
  var forms = {};
  var busy = null; // { tool, controller }
  var tab = TABS[0];

  function learnedVans() { return D.vansUpTo(S.state.classInfo.progress); }
  function currentGroup() { return D.GROUPS[S.state.classInfo.progress - 1]; }

  function formState(tool) {
    if (!forms[tool]) {
      var g = currentGroup();
      forms[tool] = {
        vans: g.vans.slice(),
        objective: 'Đọc đúng, viết đúng các tiếng có vần ' + g.vans.join(', ') + '; nhận ra vần trong tiếng, từ và câu.',
        errors: [], perLevel: 3, topic: D.TOPICS[0], sentences: 3, studentId: ''
      };
    }
    return forms[tool];
  }

  // ---------- Biểu mẫu ----------
  function vanChips(f) {
    var learned = learnedVans();
    return '<fieldset class="field"><legend>Vần trọng tâm</legend><div class="chip-check">' +
      learned.map(function (v) {
        var id = 'v-' + v;
        return '<input type="checkbox" id="' + id + '" name="vans" value="' + ui.esc(v) + '"' + (f.vans.indexOf(v) !== -1 ? ' checked' : '') + '><label for="' + id + '" class="reading">' + ui.esc(v) + '</label>';
      }).join('') + '</div><p class="hint">Chỉ hiện vần đã học tới nhóm ' + S.state.classInfo.progress + '. Đổi tiến độ lớp trong Cài đặt.</p></fieldset>';
  }
  function errorChips(f, list, legend) {
    return '<fieldset class="field"><legend>' + legend + ' <span class="optional">(không bắt buộc)</span></legend><div class="chip-check">' +
      list.map(function (e) {
        var id = 'e-' + e.id;
        return '<input type="checkbox" id="' + id + '" name="errors" value="' + ui.esc(e.label) + '"' + (f.errors.indexOf(e.label) !== -1 ? ' checked' : '') + '><label for="' + id + '">' + ui.esc(e.label) + '</label>';
      }).join('') + '</div></fieldset>';
  }

  function formHTML(t) {
    var f = formState(t.tool);
    var body = '';
    if (t.tool === 'exercises') {
      body = vanChips(f) +
        '<div class="field"><label for="f-obj">Yêu cầu cần đạt của bài</label><textarea id="f-obj" name="objective" rows="3">' + ui.esc(f.objective) + '</textarea></div>' +
        errorChips(f, D.READ_ERRORS, 'Lỗi cần luyện') +
        '<fieldset class="field"><legend>Số nhiệm vụ mỗi mức</legend>' + ui.segmented('perLevel', [{ id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' }], String(f.perLevel), 'Số nhiệm vụ mỗi mức') + '</fieldset>';
    } else if (t.tool === 'story') {
      body = vanChips(f) +
        '<div class="field"><label for="f-topic">Chủ đề</label><select id="f-topic" name="topic">' + D.TOPICS.map(function (x) { return '<option' + (x === f.topic ? ' selected' : '') + '>' + ui.esc(x) + '</option>'; }).join('') + '</select></div>' +
        '<fieldset class="field"><legend>Số câu</legend>' + ui.segmented('sentences', [{ id: '3', label: '3 câu' }, { id: '4', label: '4 câu' }], String(f.sentences), 'Số câu') + '</fieldset>';
    } else if (t.tool === 'parent') {
      body = '<div class="field"><label for="f-stu">Học sinh</label><select id="f-stu" name="studentId">' + ui.studentOptions(f.studentId, 'Chọn để điền sẵn vần và lỗi') + '</select>' +
        '<p class="hint">Mã học sinh không được gửi cho AI, chỉ gửi vần và loại lỗi.</p></div>' +
        vanChips(f) + errorChips(f, D.READ_ERRORS, 'Lỗi con hay gặp');
    } else {
      body = vanChips(f) + errorChips(f, D.WRITE_CRITERIA.map(function (c) { return { id: c.id, label: c.label + ' chưa đúng' }; }), 'Lỗi viết cần luyện');
    }
    var ready = VV.ai.isReady();
    var isBusy = busy && busy.tool === t.tool;
    return '<form class="panel assist-form" data-form="assist" novalidate>' + body +
      '<div class="btn-col">' +
      '<button type="submit" class="btn btn-primary" name="mode" value="ai"' + (ready && !isBusy ? '' : ' disabled') + '>' + ui.icon('pen') + 'Soạn bản nháp bằng AI</button>' +
      '<button type="button" class="btn" data-act="template"' + (isBusy ? ' disabled' : '') + '>Soạn từ mẫu có sẵn</button>' +
      (ready ? '' : '<p class="hint">Chưa kết nối AI. <a href="#/cai-dat/ai">Nhập API key</a>, hoặc dùng mẫu có sẵn (chạy được khi không có mạng).</p>') +
      '</div></form>';
  }

  // ---------- Kiểm tra kho tiếng ----------
  function childTexts(tool, data) {
    if (tool === 'exercises') {
      var out = [];
      data.tasks.forEach(function (t) {
        if (CHILD_READS_QUESTION.indexOf(t.type) !== -1) out.push(t.question);
        t.options.forEach(function (o) { out.push(o); });
      });
      return out;
    }
    if (tool === 'story') return [data.story];
    if (tool === 'parent') return data.readWords.concat(data.writeWords);
    return data.words;
  }
  function outsideWords(tool, data) {
    var all = [];
    childTexts(tool, data).forEach(function (t) {
      // Bỏ các nhãn như "dấu huyền", "(không có âm đầu)" khỏi câu ghép tiếng.
      var clean = String(t || '').replace(/\(.*?\)/g, ' ').replace(/dấu (huyền|sắc|hỏi|ngã|nặng)|thanh ngang/gi, ' ').replace(/___/g, ' ');
      if (/\+/.test(clean)) clean = clean.split('+').filter(function (p) { return V.parse(p.trim()) || /\s/.test(p.trim()); }).join(' ');
      VV.viet.checkText(clean, S.kho()).outside.forEach(function (w) { if (all.indexOf(w) === -1) all.push(w); });
    });
    return all;
  }
  function khoSummaryHTML(tool, data) {
    var out = outsideWords(tool, data);
    var k = S.state.classInfo;
    if (!out.length) {
      return '<div class="kho-summary is-ok" id="kho-summary">' + ui.icon('check') + '<p>Mọi tiếng cho học sinh đọc đều nằm trong kho tiếng (vần đã học tới nhóm ' + k.progress + (k.extraWords.length ? ' và ' + k.extraWords.length + ' tiếng bổ sung' : '') + '). Giáo viên vẫn cần xem nghĩa, mức độ và đáp án.</p></div>';
    }
    return '<div class="kho-summary is-warn" id="kho-summary">' + ui.icon('alert') + '<div><p>Cần giáo viên xem lại: ' +
      out.map(function (w) { return '“' + ui.esc(w) + '”'; }).join(', ') + ' chưa có trong kho tiếng. Sửa lại, hoặc thêm vào kho nếu học sinh đã được học.</p>' +
      '<div class="btn-row">' + out.slice(0, 6).map(function (w) { return '<button type="button" class="btn btn-sm" data-act="add-kho" data-word="' + ui.esc(w) + '">' + ui.icon('plus') + 'Thêm “' + ui.esc(w) + '” vào kho</button>'; }).join('') + '</div></div></div>';
  }
  function previewHTML(text) {
    var r = ui.khoText(text);
    if (!r.outside.length) return '';
    return '<span class="reading">' + r.html + '</span>';
  }

  // ---------- Bản nháp ----------
  function field(label, path, value, opts) {
    opts = opts || {};
    var id = 'd-' + path.replace(/\./g, '-');
    var input = opts.multiline
      ? '<textarea id="' + id + '" data-path="' + path + '" rows="' + (opts.rows || 3) + '"' + (opts.check ? ' data-check="1"' : '') + '>' + ui.esc(value) + '</textarea>'
      : '<input id="' + id + '" data-path="' + path + '" value="' + ui.esc(value) + '" autocomplete="off"' + (opts.check ? ' data-check="1"' : '') + (opts.cls ? ' class="' + opts.cls + '"' : '') + '>';
    return '<div class="field' + (opts.compact ? ' field-compact' : '') + '"><label for="' + id + '">' + ui.esc(label) + '</label>' + input +
      (opts.check ? '<p class="kho-preview" data-preview="' + path + '">' + previewHTML(value) + '</p>' : '') + '</div>';
  }

  function taskHTML(t, i) {
    var interactive = ['nhan-dien', 'ghep-tieng', 'chon-tu', 'hoan-thanh-cau'].indexOf(t.type) !== -1;
    return '<article class="task-card" data-task="' + i + '">' +
      '<div class="task-head"><div class="field field-compact"><label for="d-tasks-' + i + '-type">Loại</label><select id="d-tasks-' + i + '-type" data-path="tasks.' + i + '.type">' +
      Object.keys(VV.ai.TASK_TYPES).map(function (k) { return '<option value="' + k + '"' + (k === t.type ? ' selected' : '') + '>' + VV.ai.TASK_TYPES[k] + '</option>'; }).join('') + '</select></div>' +
      field('Vần', 'tasks.' + i + '.van', t.van, { compact: true, cls: 'input-short reading' }) +
      '<button type="button" class="btn-icon" data-act="del-task" data-i="' + i + '" aria-label="Xóa nhiệm vụ ' + (i + 1) + '">' + ui.icon('trash') + '</button></div>' +
      field('Lời giao việc', 'tasks.' + i + '.prompt', t.prompt) +
      field(t.type === 'doc' ? 'Chữ cho học sinh đọc' : t.type === 'viet' ? 'Chữ cho học sinh viết' : t.type === 'hoan-thanh-cau' ? 'Câu có chỗ trống ___' : 'Câu hỏi (giáo viên đọc)', 'tasks.' + i + '.question', t.question, { check: CHILD_READS_QUESTION.indexOf(t.type) !== -1, cls: 'reading' }) +
      (interactive
        ? '<fieldset class="field"><legend>Lựa chọn (đánh dấu đáp án đúng)</legend><div class="option-edit">' +
          [0, 1, 2].map(function (k) {
            var val = t.options[k] || '';
            return '<div class="option-row"><input type="radio" name="ans-' + i + '" data-answer="' + i + '" value="' + k + '" aria-label="Đáp án đúng là lựa chọn ' + (k + 1) + '"' + (val && val === t.answer ? ' checked' : '') + '>' +
              '<input data-path="tasks.' + i + '.options.' + k + '" data-check="1" value="' + ui.esc(val) + '" aria-label="Lựa chọn ' + (k + 1) + '" class="reading" autocomplete="off">' +
              '<p class="kho-preview" data-preview="tasks.' + i + '.options.' + k + '">' + previewHTML(val) + '</p></div>';
          }).join('') + '</div></fieldset>'
        : '') +
      field('Ghi chú cho giáo viên', 'tasks.' + i + '.teacherNote', t.teacherNote) +
      '</article>';
  }

  function draftBody(tool, data) {
    if (tool === 'exercises') {
      return D.LEVELS.map(function (lv) {
        var items = [];
        data.tasks.forEach(function (t, i) { if (t.level === lv.id) items.push(taskHTML(t, i)); });
        return '<section class="level-block"><h3 class="level-title"><span class="level-tag level-' + lv.id + '">' + lv.label + '</span><span class="muted">' + ui.esc(lv.hint) + '</span></h3>' +
          (items.join('') || '<p class="muted">Chưa có nhiệm vụ ở mức này.</p>') +
          '<button type="button" class="btn btn-sm btn-ghost" data-act="add-task" data-level="' + lv.id + '">' + ui.icon('plus') + 'Thêm nhiệm vụ</button></section>';
      }).join('');
    }
    if (tool === 'story') {
      return field('Tên truyện', 'title', data.title) +
        field('Nội dung truyện', 'story', data.story, { multiline: true, rows: 4, check: true, cls: 'reading' }) +
        '<div class="story-preview reading" id="story-preview">' + ui.vanText(data.story, forms.story ? forms.story.vans : []) + '</div>' +
        '<h3 class="sub-title">Câu hỏi đọc hiểu</h3>' +
        data.questions.map(function (q, i) {
          return '<div class="qa-row">' + field('Câu hỏi ' + (i + 1), 'questions.' + i + '.q', q.q) + field('Trả lời mẫu', 'questions.' + i + '.a', q.a) + '</div>';
        }).join('');
    }
    if (tool === 'parent') {
      return field('Tên gói', 'title', data.title) +
        field('3 phút đọc: các bước (mỗi dòng một bước)', 'read3', data.read3.join('\n'), { multiline: true, rows: 3 }) +
        field('Tiếng, câu để con đọc (mỗi dòng một mục)', 'readWords', data.readWords.join('\n'), { multiline: true, rows: 4, check: true, cls: 'reading' }) +
        field('2 phút viết', 'write2', data.write2) +
        field('Tiếng để con viết (mỗi dòng một tiếng)', 'writeWords', data.writeWords.join('\n'), { multiline: true, rows: 2, check: true, cls: 'reading' }) +
        field('Lời khuyên cho phụ huynh (mỗi dòng một ý)', 'tips', data.tips.join('\n'), { multiline: true, rows: 3 }) +
        '<div class="field"><label for="d-phone">Tin nhắn gửi phụ huynh</label><textarea id="d-phone" data-path="phone" rows="4">' + ui.esc(data.phone) + '</textarea>' +
        '<p class="hint"><span id="phone-count">' + data.phone.length + '</span> ký tự. Gửi qua Zalo hoặc tin nhắn; bản giấy in kèm có cùng nhiệm vụ.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-sm" data-act="copy-phone">' + ui.icon('copy') + 'Sao chép tin nhắn</button></div></div>';
    }
    return field('Tên phiếu', 'title', data.title) +
      field('Hướng dẫn cho học sinh (mỗi dòng một ý)', 'guide', data.guide.join('\n'), { multiline: true, rows: 3 }) +
      field('Tiếng hoặc từ để viết (mỗi dòng một mục)', 'words', data.words.join('\n'), { multiline: true, rows: 5, check: true, cls: 'reading' }) +
      field('Lưu ý khi chấm', 'teacherNote', data.teacherNote);
  }

  // Loại nhiệm vụ mà học sinh đọc chính câu hỏi (các loại khác là lời giáo viên đọc).
  var CHILD_READS_QUESTION = ['hoan-thanh-cau', 'doc', 'viet'];
  var LIST_FIELDS = ['read3', 'readWords', 'writeWords', 'tips', 'guide', 'words'];

  function draftHTML(t) {
    var isBusy = busy && busy.tool === t.tool;
    if (isBusy) {
      return '<section class="panel draft is-busy" aria-busy="true"><div class="draft-head"><h2 class="panel-title">Đang soạn bản nháp…</h2>' +
        '<button type="button" class="btn btn-sm" data-act="stop">Dừng</button></div>' +
        '<div class="skeleton"><span></span><span></span><span></span><span></span></div>' +
        '<p class="muted">AI thường mất 10 đến 60 giây. Bản nháp sẽ được kiểm tra theo kho tiếng ngay khi về.</p></section>';
    }
    var d = drafts[t.tool];
    if (!d) {
      return '<section class="panel draft is-empty"><h2 class="panel-title">Bản nháp</h2>' +
        '<p>Chọn vần, ghi yêu cầu cần đạt rồi bấm soạn. Bản nháp hiện ở đây để giáo viên sửa, kiểm tra kho tiếng và duyệt trước khi dùng với học sinh.</p>' +
        '<ol class="flow"><li><b>Giáo viên</b> chọn yêu cầu</li><li><b>AI</b> soạn bản nháp</li><li><b>Kiểm tra</b> kho tiếng, đáp án</li><li><b>Duyệt</b> rồi mới dùng</li></ol></section>';
    }
    var minutes = Math.max(1, Math.round((Date.now() - d.startedAt) / 60000));
    var fresh = d.fresh; d.fresh = false;
    return '<section class="panel draft' + (fresh ? ' is-fresh' : '') + '" aria-label="Bản nháp cần giáo viên duyệt">' +
      '<div class="draft-head"><h2 class="panel-title">' + (d.editingId ? 'Sửa học liệu đã duyệt' : 'Bản nháp cần giáo viên duyệt') + '</h2>' +
      '<span class="source-tag ' + (d.source === 'ai' ? 'is-ai' : '') + '">' + (d.source === 'ai' ? 'Nháp AI' : 'Nháp từ mẫu') + '</span></div>' +
      khoSummaryHTML(t.tool, d.data) +
      '<div class="draft-body">' + draftBody(t.tool, d.data) + '</div>' +
      '<form class="approve" data-form="approve">' +
      '<div class="field field-inline"><label for="ap-min">Thời gian soạn và duyệt</label><input id="ap-min" name="minutes" type="number" inputmode="numeric" min="1" max="240" value="' + minutes + '" class="input-short num"><span>phút</span></div>' +
      '<label class="check"><input type="checkbox" name="ok" required><span>Tôi đã kiểm tra ngữ liệu, mức độ và đáp án.</span></label>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="discard">Bỏ bản nháp</button>' +
      '<button type="submit" class="btn btn-primary">' + (d.editingId ? 'Lưu bản sửa' : 'Duyệt và lưu vào kho học liệu') + '</button></div></form></section>';
  }

  // ---------- Kho học liệu ----------
  function libraryHTML() {
    var lib = S.state.library.slice().sort(function (a, b) { return b.approvedAt - a.approvedAt; });
    if (!lib.length) return ui.emptyState('Kho học liệu còn trống', 'Soạn và duyệt một bản nháp, nội dung đã duyệt sẽ được lưu ở đây để in, giao cho học sinh hoặc dùng trong đánh giá.');
    return '<ul class="lib-list">' + lib.map(function (it) {
      return '<li class="lib-item"><div><p class="lib-title">' + ui.esc(it.title) + '</p>' +
        '<p class="lib-meta"><span class="kind-tag">' + KIND_LABEL[it.kind] + '</span>' +
        '<span>Vần ' + ui.esc((it.vans || []).join(', ')) + '</span><span>Duyệt ' + ui.fmtDate(it.approvedAt) + '</span>' +
        '<span>' + (it.source === 'ai' ? 'AI soạn nháp' : 'Từ mẫu') + '</span><span>' + (it.minutes || 0) + ' phút</span>' +
        (it.source === 'ai' ? '<span>' + (it.edits && it.edits.length ? 'Giáo viên sửa ' + it.edits.length + ' chỗ' : 'Duyệt nguyên bản AI') + '</span>' : '') +
        (it.kind === 'phu-huynh' ? '<span>Đã giao ' + S.state.homework.filter(function (h) { return h.packId === it.id; }).length + ' em</span>' : '') + '</p></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-sm" data-act="lib-view" data-id="' + it.id + '">' + ui.icon('eye') + 'Xem</button>' +
        '<button type="button" class="btn btn-sm" data-act="lib-edit" data-id="' + it.id + '">' + ui.icon('pen') + 'Sửa</button>' +
        (it.kind === 'phu-huynh' ? '<button type="button" class="btn btn-sm" data-act="lib-home" data-id="' + it.id + '">' + ui.icon('home') + 'Giao về nhà</button>' : '') +
        '<button type="button" class="btn btn-sm" data-act="lib-print" data-id="' + it.id + '">' + ui.icon('printer') + 'In</button>' +
        '<button type="button" class="btn-icon" data-act="lib-del" data-id="' + it.id + '" aria-label="Xóa ' + ui.esc(it.title) + '">' + ui.icon('trash') + '</button></div></li>';
    }).join('') + '</ul>';
  }

  function libContentHTML(it) {
    var c = it.content;
    if (it.kind === 'bai-tap') {
      return D.LEVELS.map(function (lv) {
        var ts = c.tasks.filter(function (t) { return t.level === lv.id; });
        if (!ts.length) return '';
        return '<h3 class="sub-title">' + lv.label + '</h3><ol class="print-tasks">' + ts.map(function (t) {
          return '<li><p><b>' + ui.esc(VV.ai.TASK_TYPES[t.type]) + '.</b> ' + ui.esc(t.prompt) + '</p><p class="reading big">' + ui.esc(t.question) + '</p>' +
            (t.options.length ? '<p class="reading print-options">' + t.options.map(function (o) { return '<span>' + ui.esc(o) + '</span>'; }).join('') + '</p>' : '') +
            (t.answer ? '<p class="muted">Đáp án: ' + ui.esc(t.answer) + '</p>' : '') + '</li>';
        }).join('') + '</ol>';
      }).join('');
    }
    if (it.kind === 'truyen') {
      return '<p class="reading story-big">' + ui.vanText(c.story, it.vans || []) + '</p><h3 class="sub-title">Câu hỏi</h3><ol>' +
        c.questions.map(function (q) { return '<li>' + ui.esc(q.q) + ' <span class="muted">(' + ui.esc(q.a) + ')</span></li>'; }).join('') + '</ol>';
    }
    if (it.kind === 'phu-huynh') {
      return '<h3 class="sub-title">3 phút đọc</h3><ol>' + c.read3.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ol>' +
        '<p class="reading big">' + c.readWords.map(ui.esc).join(' &nbsp; ') + '</p>' +
        '<h3 class="sub-title">2 phút viết</h3><p>' + ui.esc(c.write2) + '</p><p class="reading big">' + c.writeWords.map(ui.esc).join(' &nbsp; ') + '</p>' +
        '<h3 class="sub-title">Lời khuyên</h3><ul>' + c.tips.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h3 class="sub-title">Tin nhắn điện thoại</h3><p class="phone-msg">' + ui.esc(c.phone) + '</p>';
    }
    return '<ol>' + c.guide.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ol><p class="reading big">' + c.words.map(ui.esc).join(' &nbsp; ') + '</p><p class="muted">' + ui.esc(c.teacherNote) + '</p>';
  }

  function editLogHTML(it) {
    if (it.source !== 'ai' && !(it.edits && it.edits.length)) return '';
    var edits = it.edits || [];
    var head = '<h3 class="sub-title">Nhật ký chỉnh sửa</h3>' +
      '<p class="muted">' + (it.source === 'ai' ? 'Bản nháp do AI soạn. ' : '') +
      (it.outsideStart != null ? 'Tiếng ngoài kho lúc nhận: <span class="num">' + it.outsideStart + '</span>, lúc duyệt: <span class="num">' + (it.outsideEnd || 0) + '</span>. ' : '') +
      (edits.length ? 'Giáo viên đã sửa <span class="num">' + edits.length + '</span> chỗ.' : 'Giáo viên duyệt nguyên bản, không sửa.') + '</p>';
    if (!edits.length) return head;
    return head + '<div class="table-wrap"><table class="table edit-log"><thead><tr><th scope="col">Mục</th><th scope="col">Bản trước</th><th scope="col">Sau khi sửa</th></tr></thead><tbody>' +
      edits.slice(0, 40).map(function (e) {
        return '<tr><td>' + ui.esc(e.field) + '</td><td class="was">' + ui.esc(e.before) + '</td><td>' + ui.esc(e.after) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (edits.length > 40 ? '<p class="muted">Và ' + (edits.length - 40) + ' chỗ khác.</p>' : '');
  }

  // ---------- So sánh bản nháp gốc với bản duyệt ----------
  var FIELD_LABEL = {
    type: 'loại', van: 'vần', prompt: 'lời giao việc', question: 'câu hỏi', options: 'lựa chọn', answer: 'đáp án', teacherNote: 'ghi chú',
    title: 'Tên', story: 'Nội dung truyện', read3: '3 phút đọc', readWords: 'Tiếng, câu để đọc', write2: '2 phút viết',
    writeWords: 'Tiếng để viết', tips: 'Lời khuyên', phone: 'Tin nhắn', guide: 'Hướng dẫn', words: 'Tiếng, từ để viết'
  };
  function val(v) { return Array.isArray(v) ? v.join(' | ') : String(v == null ? '' : v); }
  function flatten(tool, data) {
    var out = {};
    if (tool === 'exercises') {
      data.tasks.forEach(function (t, i) {
        var label = 'Nhiệm vụ ' + (i + 1);
        out['t:' + t._id] = { label: label, value: t.question, task: true };
        ['type', 'van', 'prompt', 'question', 'options', 'answer', 'teacherNote'].forEach(function (k) {
          out['t:' + t._id + ':' + k] = { label: label + ', ' + FIELD_LABEL[k], value: k === 'type' ? VV.ai.TASK_TYPES[t.type] : val(t[k]), parent: 't:' + t._id };
        });
      });
    } else if (tool === 'story') {
      out.title = { label: 'Tên truyện', value: data.title };
      out.story = { label: 'Nội dung truyện', value: data.story };
      data.questions.forEach(function (q, i) {
        out['q' + i] = { label: 'Câu hỏi ' + (i + 1), value: q.q };
        out['a' + i] = { label: 'Trả lời mẫu ' + (i + 1), value: q.a };
      });
    } else {
      Object.keys(data).forEach(function (k) { if (k[0] !== '_') out[k] = { label: FIELD_LABEL[k] || k, value: val(data[k]) }; });
    }
    return out;
  }
  function diffDraft(tool, before, after) {
    var a = flatten(tool, before), b = flatten(tool, after), edits = [];
    Object.keys(a).forEach(function (k) {
      if (a[k].parent && !(a[k].parent in b)) return;
      if (!(k in b)) edits.push({ field: a[k].task ? a[k].label + ' (xóa)' : a[k].label, before: a[k].value, after: 'Đã xóa' });
      else if (!a[k].task && a[k].value !== b[k].value) edits.push({ field: b[k].label, before: a[k].value, after: b[k].value });
    });
    Object.keys(b).forEach(function (k) {
      if (b[k].task && !(k in a)) edits.push({ field: b[k].label + ' (thêm)', before: 'Chưa có', after: b[k].value });
    });
    return edits;
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function tagTasks(data) {
    (data.tasks || []).forEach(function (t) { if (!t._id) t._id = S.uid('task'); });
    return data;
  }
  function makeDraft(tool, data, source, params, extra) {
    tagTasks(data);
    return Object.assign({ data: data, source: source, startedAt: Date.now(), params: params, fresh: true,
      original: clone(data), outsideStart: outsideWords(tool, data).length }, extra || {});
  }

  function printLib(it) {
    if (it.kind === 'phieu-viet') {
      ui.printHTML(VV.lessons.writingSheetHTML(it.title, it.content.words, it.content.guide), it.title);
    } else if (it.kind === 'phu-huynh') {
      var c = it.content;
      ui.printHTML('<h1 class="print-title">' + ui.esc(it.title) + '</h1>' +
        '<p class="print-meta">Gửi phụ huynh. Mỗi ngày khoảng 5 phút: 3 phút đọc cùng con, 2 phút con tự viết.</p>' +
        '<h2>3 phút đọc</h2><ol class="print-guide">' + c.read3.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ol>' +
        '<p class="reading print-big">' + c.readWords.map(ui.esc).join(' &nbsp;&nbsp; ') + '</p>' +
        '<h2>2 phút viết</h2><p>' + ui.esc(c.write2) + '</p>' +
        c.writeWords.map(function (w) { return '<div class="oli-line is-model"><span class="reading">' + ui.esc(w) + '</span></div><div class="oli-line"></div>'; }).join('') +
        '<h2>Lời khuyên</h2><ul>' + c.tips.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p class="print-meta">Con đã luyện: ☐ Thứ hai ☐ Thứ ba ☐ Thứ tư ☐ Thứ năm ☐ Thứ sáu. Tiếng con còn đọc sai: ........................</p>', it.title);
    } else {
      ui.printHTML('<h1 class="print-title">' + ui.esc(it.title) + '</h1>' + libContentHTML(it), it.title);
    }
  }

  // ---------- Vẽ màn hình ----------
  function render(root, params) {
    tab = TABS.filter(function (t) { return t.id === params[0]; })[0] || TABS[0];
    var ready = VV.ai.isReady();
    var c = VV.ai.cfg();
    var tabs = '<nav class="tabs" aria-label="Công cụ soạn bài">' + TABS.map(function (t) {
      var count = t.id === 'kho' ? ' <span class="count num">' + S.state.library.length + '</span>' : '';
      return '<a class="tab' + (t === tab ? ' is-active' : '') + '" href="#/tro-ly/' + t.id + '"' + (t === tab ? ' aria-current="page"' : '') + '>' + ui.esc(t.label) + count + '</a>';
    }).join('') + '</nav>';
    var status = ready
      ? '<p class="ai-line">' + ui.icon('check') + 'Đang dùng ' + ui.esc(VV.ai.PROVIDERS[c.provider].label) + ', model <code translate="no">' + ui.esc(c.model) + '</code>. <a href="#/cai-dat/ai">Đổi</a></p>'
      : '<div class="banner banner-ai"><p><b>AI chưa được kết nối.</b> Nhập API key của Claude, OpenAI, Gemini hoặc dịch vụ tương thích để AI soạn bản nháp. Không có key, bạn vẫn soạn được từ mẫu có sẵn.</p><a class="btn btn-sm" href="#/cai-dat/ai">Nhập API key</a></div>';

    var body = tab.id === 'kho'
      ? '<section class="panel">' + libraryHTML() + '</section>'
      : '<div class="assist-grid">' + formHTML(tab) + draftHTML(tab) + '</div>';

    root.innerHTML = '<section class="page"><header class="page-head"><div><h1>Trợ lý soạn bài</h1>' +
      '<p class="lede">AI soạn bản nháp theo kho tiếng của lớp. Giáo viên sửa, kiểm tra đáp án và duyệt; chỉ nội dung đã duyệt mới đến tay học sinh.</p></div></header>' +
      status + tabs + body + '</section>';
  }

  function readForm(form, tool) {
    var f = formState(tool);
    f.vans = Array.prototype.map.call(form.querySelectorAll('input[name="vans"]:checked'), function (i) { return i.value; });
    f.errors = Array.prototype.map.call(form.querySelectorAll('input[name="errors"]:checked'), function (i) { return i.value; });
    if (form.objective) f.objective = form.objective.value.trim();
    var pl = form.querySelector('input[name="perLevel"]:checked'); if (pl) f.perLevel = Number(pl.value);
    var sn = form.querySelector('input[name="sentences"]:checked'); if (sn) f.sentences = Number(sn.value);
    if (form.topic) f.topic = form.topic.value;
    if (form.studentId) f.studentId = form.studentId.value;
    return f;
  }

  function generate(useAI) {
    var form = document.querySelector('form[data-form="assist"]');
    var t = tab;
    var f = readForm(form, t.tool);
    if (!f.vans.length) { ui.toast('Chọn ít nhất một vần trọng tâm.', 'error'); var first = form.querySelector('input[name="vans"]'); if (first) first.focus(); return; }
    var params = { vans: f.vans, objective: f.objective, errors: f.errors, perLevel: f.perLevel, topic: f.topic, sentences: f.sentences };
    var controller = useAI ? new AbortController() : null;
    var startedAt = Date.now();
    if (useAI) { busy = { tool: t.tool, controller: controller }; VV.app.refresh(); }
    VV.ai.draft(t.tool, params, useAI, controller && controller.signal).then(function (res) {
      drafts[t.tool] = makeDraft(t.tool, res.data, res.source, params, { startedAt: startedAt });
      if (t.tool === 'exercises' && !res.data.tasks.length) throw new Error('AI không trả về nhiệm vụ nào. Bấm soạn lại.');
      ui.toast(useAI ? 'AI đã soạn xong bản nháp. Hãy kiểm tra trước khi duyệt.' : 'Đã soạn bản nháp từ mẫu.');
    }).catch(function (err) {
      ui.toast(err.message, 'error');
    }).then(function () {
      busy = null;
      if (VV.app.route === 'tro-ly') VV.app.refresh();
    });
  }

  function setPath(obj, path, value) {
    var parts = path.split('.');
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) o = o[isNaN(parts[i]) ? parts[i] : Number(parts[i])];
    var last = parts[parts.length - 1];
    o[isNaN(last) ? last : Number(last)] = value;
  }

  var summaryTimer = null;
  function onInput(e) {
    var el = e.target;
    if (el.name === 'objective') { formState(tab.tool).objective = el.value; return; }
    var path = el.getAttribute('data-path');
    if (!path || !drafts[tab.tool]) return;
    var d = drafts[tab.tool].data;
    var val = el.value;
    if (LIST_FIELDS.indexOf(path) !== -1) val = val.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    var m = path.match(/^tasks\.(\d+)\.options\.(\d+)$/);
    if (m) {
      var task = d.tasks[Number(m[1])];
      var old = task.options[Number(m[2])];
      if (old && old === task.answer) task.answer = val;
      while (task.options.length <= Number(m[2])) task.options.push('');
    }
    setPath(d, path, val);
    if (el.hasAttribute('data-check')) {
      var pv = document.querySelector('[data-preview="' + path + '"]');
      if (pv) pv.innerHTML = previewHTML(el.value);
    }
    if (path === 'story') { var sp = document.getElementById('story-preview'); if (sp) sp.innerHTML = ui.vanText(el.value, forms.story ? forms.story.vans : []); }
    if (path === 'phone') { var pc = document.getElementById('phone-count'); if (pc) pc.textContent = el.value.length; }
    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(function () {
      var box = document.getElementById('kho-summary');
      if (box) box.outerHTML = khoSummaryHTML(tab.tool, d);
    }, 250);
  }

  function onChange(e) {
    var el = e.target;
    var assistForm = el.closest('form[data-form="assist"]');
    if (assistForm) readForm(assistForm, tab.tool);
    if (el.hasAttribute('data-answer')) {
      var i = Number(el.getAttribute('data-answer'));
      var t = drafts[tab.tool].data.tasks[i];
      t.answer = t.options[Number(el.value)] || '';
      return;
    }
    if (el.getAttribute('data-path') && /\.type$/.test(el.getAttribute('data-path'))) {
      setPath(drafts[tab.tool].data, el.getAttribute('data-path'), el.value);
      VV.app.refresh();
      return;
    }
    if (el.name === 'studentId' && el.value) {
      var f = formState('parent');
      var sug = S.suggest(el.value);
      var errs = S.errorCounts(el.value);
      f.studentId = el.value;
      f.vans = [sug.van];
      f.errors = D.READ_ERRORS.filter(function (x) { return errs[x.id] > 0; })
        .sort(function (a, b) { return errs[b.id] - errs[a.id]; }).slice(0, 2).map(function (x) { return x.label; });
      VV.app.refresh();
    }
  }

  function approve(form) {
    var d = drafts[tab.tool];
    if (!form.ok.checked) { ui.toast('Đánh dấu ô xác nhận đã kiểm tra trước khi duyệt.', 'error'); form.ok.focus(); return; }
    if (tab.tool === 'exercises') {
      var bad = d.data.tasks.filter(function (t) {
        var interactive = ['nhan-dien', 'ghep-tieng', 'chon-tu', 'hoan-thanh-cau'].indexOf(t.type) !== -1;
        return interactive && (!t.answer || t.options.filter(Boolean).indexOf(t.answer) === -1);
      });
      if (bad.length) { ui.toast(bad.length + ' nhiệm vụ chọn đáp án chưa đánh dấu đáp án đúng.', 'error'); return; }
      d.data.tasks.forEach(function (t) { t.options = t.options.filter(Boolean); });
    }
    var out = outsideWords(tab.tool, d.data);
    var go = out.length
      ? ui.confirmDialog({ title: 'Còn tiếng ngoài kho', body: 'Bản nháp còn ' + out.length + ' tiếng ngoài kho tiếng (' + out.join(', ') + '). Vẫn duyệt và lưu?' }, 'Vẫn duyệt')
      : Promise.resolve(true);
    go.then(function (ok) {
      if (!ok) return;
      var minutes = Math.max(1, Math.min(240, Number(form.minutes.value) || 1));
      var titleMap = {
        exercises: 'Bài tập vần ' + d.params.vans.join(', '),
        story: d.data.title, parent: d.data.title, writing: d.data.title
      };
      var edits = diffDraft(tab.tool, d.original, d.data);
      var now = Date.now();
      S.commit(function (s) {
        var prev = d.editingId ? s.library.filter(function (x) { return x.id === d.editingId; })[0] : null;
        if (prev) {
          prev.title = titleMap[tab.tool];
          prev.vans = d.params.vans;
          prev.content = clone(d.data);
          prev.approvedAt = now;
          prev.minutes = (prev.minutes || 0) + minutes;
          prev.edits = (prev.edits || []).concat(edits);
          prev.outsideEnd = out.length;
        } else {
          s.library.push({ id: S.uid('lib'), kind: tab.libKind, title: titleMap[tab.tool], vans: d.params.vans,
            createdAt: d.startedAt, approvedAt: now, minutes: minutes, source: d.source, content: clone(d.data),
            aiOriginal: d.source === 'ai' ? clone(d.original) : null, edits: edits, outsideStart: d.outsideStart, outsideEnd: out.length });
        }
        s.effort.push({ id: S.uid('e'), date: now, tool: tab.label, minutes: minutes,
          note: (prev ? 'Sửa lại: ' : '') + 'Vần ' + d.params.vans.join(', ') + (d.source === 'ai' ? ' (AI soạn nháp, sửa ' + edits.length + ' chỗ)' : ' (từ mẫu)') });
      });
      delete drafts[tab.tool];
      ui.toast(d.editingId ? 'Đã lưu bản sửa vào kho học liệu.' : 'Đã duyệt và lưu vào kho học liệu.');
      VV.app.refresh();
    });
  }

  // Giao gói "5 phút cùng con" về nhà cho một số em.
  function homeDialog(packId) {
    var it = S.state.library.filter(function (x) { return x.id === packId; })[0];
    var already = S.state.homework.filter(function (h) { return h.packId === packId; }).map(function (h) { return h.studentId; });
    ui.openDialog('<form><h2 id="dialog-title" class="dialog-title">Giao về nhà: ' + ui.esc(it.title) + '</h2>' +
      '<p class="muted">Đánh dấu sẵn các em có vần cần luyện trùng với gói này. Giáo viên có thể đổi lại.</p>' +
      '<fieldset class="field"><legend>Học sinh</legend><div class="chip-check">' +
      S.state.students.map(function (s) {
        var sug = S.suggest(s.id);
        var pre = already.indexOf(s.id) === -1 && (it.vans || []).indexOf(sug.van) !== -1;
        return '<input type="checkbox" id="hw-' + s.id + '" name="stu" value="' + s.id + '"' + (pre ? ' checked' : '') + (already.indexOf(s.id) !== -1 ? ' disabled' : '') + '>' +
          '<label for="hw-' + s.id + '">' + ui.esc(s.code) + (already.indexOf(s.id) !== -1 ? ' (đã giao)' : '') + '</label>';
      }).join('') + '</div></fieldset>' +
      '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Hủy</button><button type="submit" class="btn btn-primary">Giao gói</button></div></form>',
      {
        onMount: function (dlg) {
          dlg.querySelector('form').onsubmit = function (e) {
            e.preventDefault();
            var ids = Array.prototype.map.call(e.target.querySelectorAll('input[name="stu"]:checked'), function (i) { return i.value; });
            if (!ids.length) { ui.toast('Chọn ít nhất một học sinh.', 'error'); return; }
            S.commit(function (s) {
              ids.forEach(function (sid) { s.homework.push({ id: S.uid('hw'), packId: packId, studentId: sid, sentAt: Date.now(), status: 'da-giao', support: '', note: '', updatedAt: Date.now() }); });
            });
            ui.closeDialog();
            ui.toast('Đã giao gói cho ' + ids.length + ' em. Ghi nhận kết quả ở Đánh giá, mục Luyện ở nhà.');
            VV.app.refresh();
          };
        }
      });
  }

  // Mở công cụ soạn với các ô đã điền sẵn (gọi từ bản đồ âm vần, bài viết…).
  function prefill(tool, p) {
    var f = formState(tool);
    if (p.vans && p.vans.length) f.vans = p.vans.slice();
    if (p.errors) f.errors = p.errors.slice();
    if (p.studentId != null) f.studentId = p.studentId;
    if (p.objective) f.objective = p.objective;
    var t = TABS.filter(function (x) { return x.tool === tool; })[0];
    VV.app.go('tro-ly/' + t.id);
  }

  VV.assistant = { isDirty: function () { return Object.keys(drafts).length > 0 || !!busy; }, prefill: prefill, editLogHTML: editLogHTML };

  VV.views['tro-ly'] = {
    render: render,
    act: {
      template: function () { generate(false); },
      stop: function () { if (busy && busy.controller) busy.controller.abort(); },
      discard: function () {
        ui.confirmDialog({ title: 'Bỏ bản nháp?', body: 'Nội dung chưa duyệt sẽ mất.' }, 'Bỏ bản nháp', true).then(function (ok) {
          if (ok) { delete drafts[tab.tool]; VV.app.refresh(); }
        });
      },
      'add-kho': function (el) {
        var w = el.getAttribute('data-word');
        S.commit(function (s) { if (s.classInfo.extraWords.indexOf(w) === -1) s.classInfo.extraWords.push(w); });
        ui.toast('Đã thêm “' + w + '” vào kho tiếng của lớp.');
        VV.app.refresh();
      },
      'del-task': function (el) {
        drafts[tab.tool].data.tasks.splice(Number(el.getAttribute('data-i')), 1);
        VV.app.refresh();
      },
      'add-task': function (el) {
        var lv = el.getAttribute('data-level');
        drafts[tab.tool].data.tasks.push({ _id: S.uid('task'), level: lv, type: 'doc', van: (forms.exercises && forms.exercises.vans[0]) || '', prompt: 'Đọc to cho cô nghe.', question: '', options: [], answer: '', teacherNote: '' });
        VV.app.refresh();
      },
      'copy-phone': function () { ui.copyText(drafts.parent.data.phone); },
      'lib-view': function (el) {
        var it = S.state.library.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
        ui.openDialog('<h2 id="dialog-title" class="dialog-title">' + ui.esc(it.title) + '</h2><div class="lib-content">' + libContentHTML(it) + editLogHTML(it) + '</div>' +
          '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Đóng</button></div>', { wide: true });
      },
      'lib-edit': function (el) {
        var it = S.state.library.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0];
        var t = TABS.filter(function (x) { return x.libKind === it.kind; })[0];
        if (drafts[t.tool]) { ui.toast('Đang có bản nháp chưa duyệt ở mục ' + t.label + '. Duyệt hoặc bỏ bản nháp đó trước.', 'error'); return; }
        var data = tagTasks(clone(it.content));
        drafts[t.tool] = makeDraft(t.tool, data, it.source, { vans: (it.vans || []).slice() }, { editingId: it.id });
        formState(t.tool).vans = (it.vans || []).slice();
        VV.app.go('tro-ly/' + t.id);
      },
      'lib-home': function (el) { homeDialog(el.getAttribute('data-id')); },
      'lib-print': function (el) {
        printLib(S.state.library.filter(function (x) { return x.id === el.getAttribute('data-id'); })[0]);
      },
      'lib-del': function (el) {
        var id = el.getAttribute('data-id');
        ui.confirmDialog({ title: 'Xóa khỏi kho học liệu?', body: 'Nội dung này sẽ không còn dùng được trong Góc luyện tập và đánh giá.' }, 'Xóa', true).then(function (ok) {
          if (!ok) return;
          S.commit(function (s) { s.library = s.library.filter(function (x) { return x.id !== id; }); });
          VV.app.refresh();
        });
      }
    },
    oninput: onInput,
    onchange: onChange,
    onsubmit: function (e) {
      e.preventDefault();
      var form = e.target;
      if (form.getAttribute('data-form') === 'assist') generate(true);
      if (form.getAttribute('data-form') === 'approve') approve(form);
    }
  };
})(window.VV = window.VV || {});
