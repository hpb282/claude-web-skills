/* Cài đặt: kết nối AI, lớp học, kho tiếng, giọng đọc, dữ liệu. */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store;

  var showKey = false;
  var testing = null;

  function aiSection() {
    var s = S.settings.ai;
    var P = VV.ai.PROVIDERS;
    var prov = P[s.provider];
    var key = S.getApiKey();
    return '<section class="panel" id="ai" aria-labelledby="ai-title"><h2 class="panel-title" id="ai-title">Kết nối AI</h2>' +
      '<p class="muted">AI chỉ soạn bản nháp học liệu. Nhập API key của dịch vụ bạn dùng; key được gửi thẳng từ trình duyệt tới nhà cung cấp đó, không qua máy chủ nào khác.</p>' +
      '<form data-form="ai" autocomplete="off">' +
      '<fieldset class="field"><legend>Nhà cung cấp</legend><div class="provider-grid">' +
      Object.keys(P).map(function (k) {
        return '<label class="provider"><input type="radio" name="provider" value="' + k + '"' + (k === s.provider ? ' checked' : '') + '><span class="provider-name">' + ui.esc(P[k].label) + '</span><span class="provider-hint">' + ui.esc(P[k].keyHint) + '</span></label>';
      }).join('') + '</div></fieldset>' +
      (s.provider === 'compatible'
        ? '<div class="field"><label for="ai-base">Địa chỉ API (base URL)</label><input id="ai-base" name="baseUrl" type="url" inputmode="url" spellcheck="false" placeholder="https://openrouter.ai/api/v1…" value="' + ui.esc(s.baseUrl) + '"><p class="hint">Địa chỉ có đường dẫn /chat/completions phía sau, theo chuẩn OpenAI.</p></div>'
        : '') +
      '<div class="field"><label for="ai-key">API key</label><div class="input-group">' +
      '<input id="ai-key" name="key" type="' + (showKey ? 'text' : 'password') + '" spellcheck="false" autocomplete="off" placeholder="' + ui.esc(prov.keyHint) + '…" value="' + ui.esc(key) + '">' +
      '<button type="button" class="btn-icon" data-act="toggle-key" aria-label="' + (showKey ? 'Ẩn key' : 'Hiện key') + '" aria-pressed="' + showKey + '">' + ui.icon(showKey ? 'eyeOff' : 'eye') + '</button></div>' +
      (prov.keyUrl ? '<p class="hint">Lấy key tại <a href="' + prov.keyUrl + '" target="_blank" rel="noopener">' + ui.esc(prov.keyUrl.replace(/^https:\/\//, '')) + '</a>.</p>' : '') + '</div>' +
      '<div class="field"><label for="ai-model">Model</label><input id="ai-model" name="model" list="ai-models" spellcheck="false" value="' + ui.esc(s.model) + '" placeholder="Ví dụ: claude-opus-5-5…">' +
      '<datalist id="ai-models">' + prov.models.map(function (m) { return '<option value="' + ui.esc(m) + '">'; }).join('') + '</datalist>' +
      '<p class="hint">' + (s.provider === 'anthropic' ? 'Mặc định claude-opus-5-5. Có thể chọn claude-sonnet-5-5 hoặc claude-haiku-5-5 để nhanh và rẻ hơn.' : 'Nhập đúng tên model mà tài khoản của bạn được dùng.') + '</p></div>' +
      '<label class="check"><input type="checkbox" name="remember"' + (s.remember ? ' checked' : '') + '><span>Ghi nhớ key trên máy này. Bỏ chọn nếu dùng máy chung: key sẽ mất khi đóng thẻ trình duyệt.</span></label>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu kết nối</button>' +
      '<button type="button" class="btn" data-act="test-ai"' + (testing ? ' disabled' : '') + '>' + (testing ? 'Đang kiểm tra…' : 'Kiểm tra kết nối') + '</button>' +
      (key ? '<button type="button" class="btn btn-ghost" data-act="clear-key">Xóa key</button>' : '') + '</div>' +
      '<p class="ai-test" id="ai-test" role="status" aria-live="polite"></p>' +
      '<details class="details"><summary>Dữ liệu nào được gửi cho AI?</summary><p>Chỉ gửi vần, yêu cầu cần đạt, loại lỗi và danh sách vần trong kho tiếng. Không gửi mã học sinh, kết quả đọc, ảnh bài viết hay ghi chú. Dịch vụ AI tính phí theo tài khoản của bạn.</p></details>' +
      '</form></section>';
  }

  function classSection() {
    var c = S.state.classInfo;
    return '<section class="panel" id="lop" aria-labelledby="lop-title"><h2 class="panel-title" id="lop-title">Lớp học</h2>' +
      '<form data-form="class"><div class="form-grid">' +
      '<div class="field"><label for="cl-name">Tên lớp</label><input id="cl-name" name="name" value="' + ui.esc(c.name) + '" autocomplete="off"></div>' +
      '<div class="field"><label for="cl-prog">Lớp đang học</label>' + ui.groupSelect('cl-prog', 'progress', c.progress) +
      '<p class="hint">Quyết định kho tiếng, âm, vần được gợi ý và phạm vi bài đo.</p></div></div>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu thông tin lớp</button></div></form>' +
      '<h3 class="sub-title">Học sinh</h3><p class="muted">Dùng mã thay cho họ tên để bảo vệ dữ liệu trẻ em. Ghi chú chỉ lưu trên máy này.</p>' +
      '<ul class="student-list">' + S.state.students.map(function (s) {
        return '<li><input value="' + ui.esc(s.code) + '" data-stu-code="' + s.id + '" aria-label="Mã học sinh" class="input-short" autocomplete="off">' +
          '<input value="' + ui.esc(s.note) + '" data-stu-note="' + s.id + '" aria-label="Ghi chú cho ' + ui.esc(s.code) + '" placeholder="Ghi chú, không bắt buộc…" autocomplete="off">' +
          '<button type="button" class="btn-icon" data-act="del-stu" data-id="' + s.id + '" aria-label="Xóa ' + ui.esc(s.code) + '">' + ui.icon('trash') + '</button></li>';
      }).join('') + '</ul>' +
      '<div class="btn-row"><button type="button" class="btn" data-act="add-stu">' + ui.icon('plus') + 'Thêm một học sinh</button>' +
      '<button type="button" class="btn btn-ghost" data-act="add-many">Thêm nhiều mã cùng lúc</button></div></section>';
  }

  function khoSection() {
    var c = S.state.classInfo;
    var k = S.kho();
    var vans = Array.from(k.vans);
    return '<section class="panel" id="kho" aria-labelledby="kho-title"><h2 class="panel-title" id="kho-title">Kho tiếng</h2>' +
      '<p class="muted">Tiếng có vần dưới đây được xem là đã học. Trợ lý AI và bộ kiểm tra dùng danh sách này để đánh dấu tiếng vượt nội dung đã học.</p>' +
      '<ul class="chips kho-chips" aria-label="Vần đã học">' + vans.map(function (v) { return '<li class="chip chip-static reading">' + ui.esc(v) + '</li>'; }).join('') + '</ul>' +
      (k.initials ? '<p class="muted">Lớp đang học âm nên chỉ chấp nhận các âm đầu đã học:</p><ul class="chips kho-chips" aria-label="Âm đầu đã học">' +
        Array.from(k.initials).map(function (v) { return '<li class="chip chip-static reading">' + ui.esc(v) + '</li>'; }).join('') + '</ul>' : '') +
      '<form data-form="kho"><div class="field"><label for="kho-extra">Tiếng bổ sung đã duyệt</label>' +
      '<textarea id="kho-extra" name="extra" rows="3" class="reading" spellcheck="false" placeholder="Ví dụ: Lan, Nam…">' + ui.esc(c.extraWords.join(', ')) + '</textarea>' +
      '<p class="hint">Cách nhau bằng dấu phẩy hoặc xuống dòng.</p></div>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu kho tiếng</button></div></form></section>';
  }

  function qrSection() {
    var url = S.state.classInfo.siteUrl || '';
    var sample = url ? url.replace(/#.*$/, '') + '#/the/' + encodeURIComponent('bàn') : '';
    var preview = '';
    if (sample) { try { preview = '<div class="qr-preview">' + VV.qr.svg(sample, { label: 'Mã QR thử cho thẻ bàn' }) + '<p class="hint">Quét thử mã này bằng điện thoại: phải mở ra thẻ “bàn”.</p></div>'; } catch (e) { preview = '<p class="hint">' + ui.esc(e.message) + '</p>'; } }
    return '<section class="panel" id="qr" aria-labelledby="qr-title"><h2 class="panel-title" id="qr-title">Mã QR cho thẻ ghép tiếng</h2>' +
      '<p class="muted">Mã QR trên thẻ giấy chỉ mở được khi file này được đăng lên một địa chỉ web (ví dụ GitHub Pages, Google Sites, máy chủ của trường). Dán địa chỉ đó vào đây; thẻ in ra sẽ có mã QR mở đúng thẻ trên điện thoại. Chưa có địa chỉ thì thẻ in không kèm mã.</p>' +
      '<form data-form="site" class="qr-form"><div class="field"><label for="site-url">Địa chỉ trang Vần vui AI đã đăng</label>' +
      '<input id="site-url" name="siteUrl" type="url" inputmode="url" spellcheck="false" autocomplete="off" placeholder="https://truong-cua-ban.github.io/van-vui-ai.html…" value="' + ui.esc(url) + '"></div>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu địa chỉ</button>' + (url ? '<button type="button" class="btn btn-ghost" data-act="clear-site">Xóa địa chỉ</button>' : '') + '</div></form>' +
      preview + '</section>';
  }

  // ---------- Nội dung bài học: danh sách nhóm và ô sửa ----------
  var editKey = null;
  function findGroup(key) { return D.allGroups().filter(function (g) { return g.key === key; })[0]; }
  function stageLabel(id) { return D.label(D.STAGES, id); }

  function groupListHTML() {
    var all = D.allGroups();
    var used = all.filter(function (g) { return !g.hidden; }).length;
    return '<details class="details group-list-wrap"' + (S.state.curriculum.order || S.state.curriculum.hidden.length || S.state.curriculum.custom.length ? ' open' : '') + '>' +
      '<summary>Danh sách nhóm: ' + used + ' nhóm đang dùng' + (all.length > used ? ', ' + (all.length - used) + ' nhóm ẩn' : '') + '</summary>' +
      '<p class="muted">Bỏ chọn “Dùng” để ẩn nhóm lớp không học. Dùng mũi tên để đổi thứ tự cho khớp bộ sách. Kết quả đã ghi không bị mất khi ẩn hay đổi thứ tự.</p>' +
      '<ol class="group-list">' + all.map(function (g, i) {
        return '<li class="group-item' + (g.hidden ? ' is-hidden' : '') + '">' +
          '<label class="check"><input type="checkbox" data-grp-use="' + g.key + '"' + (g.hidden ? '' : ' checked') + '><span>Dùng</span></label>' +
          '<span class="group-item-name"><span class="group-item-num">' + (g.hidden ? 'Ẩn' : 'Nhóm ' + g.id) + '</span>' +
          '<span class="reading">' + ui.esc(g.title) + '</span><span class="group-item-stage">' + ui.esc(stageLabel(g.stage)) + (g.edited ? ', đã sửa' : '') + '</span></span>' +
          '<span class="group-item-actions">' +
          '<button type="button" class="btn-icon" data-act="grp-up" data-key="' + g.key + '" aria-label="Đưa nhóm ' + ui.esc(g.title) + ' lên"' + (i === 0 ? ' disabled' : '') + '>' + ui.icon('arrowUp') + '</button>' +
          '<button type="button" class="btn-icon" data-act="grp-down" data-key="' + g.key + '" aria-label="Đưa nhóm ' + ui.esc(g.title) + ' xuống"' + (i === all.length - 1 ? ' disabled' : '') + '>' + ui.icon('arrowDown') + '</button>' +
          '<button type="button" class="btn btn-sm" data-act="grp-edit" data-key="' + g.key + '">Sửa</button></span></li>';
      }).join('') + '</ol>' +
      '<div class="btn-row"><button type="button" class="btn" data-act="grp-add">' + ui.icon('plus') + 'Thêm nhóm vần</button>' +
      (S.state.curriculum.order || S.state.curriculum.hidden.length ? '<button type="button" class="btn btn-ghost" data-act="grp-reset-order">Trở về thứ tự gợi ý</button>' : '') + '</div></details>';
  }

  function contentSection() {
    var g = (editKey && findGroup(editKey)) || D.GROUPS[S.state.classInfo.progress - 1];
    editKey = g.key;
    var isCustom = g.stage === 'tu-them';
    var unitName = function (v) { return D.isConsonantUnit(v) ? 'âm' : 'vần'; };
    return '<section class="panel" id="noi-dung" aria-labelledby="nd-title"><h2 class="panel-title" id="nd-title">Nội dung bài học</h2>' +
      '<p class="muted">Chỉnh cho khớp bộ sách và những gì lớp đã học: ẩn hoặc đổi thứ tự nhóm, thêm nhóm vần, sửa tiếng, từ, câu của từng nhóm.</p>' +
      groupListHTML() +
      '<form data-form="content" class="content-form">' +
      '<div class="field field-inline"><label for="nd-group">Sửa nhóm</label><select id="nd-group" name="groupKey">' +
      D.allGroups().map(function (x) { return '<option value="' + x.key + '"' + (x.key === g.key ? ' selected' : '') + '>' + (x.hidden ? 'Ẩn' : 'Nhóm ' + x.id) + ': ' + ui.esc(x.title) + (x.edited ? ' (đã sửa)' : '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-grid">' + g.vans.map(function (v) {
        return '<div class="field"><label for="nd-w-' + v + '">Tiếng có ' + unitName(v) + ' <span class="reading">' + ui.esc(v) + '</span></label>' +
          '<textarea id="nd-w-' + v + '" name="w-' + v + '" rows="2" class="reading" spellcheck="false">' + ui.esc(g.words[v].join(', ')) + '</textarea><p class="hint">Từ 2 đến 8 tiếng, cách nhau dấu phẩy.</p></div>';
      }).join('') + '</div>' +
      '<div class="form-grid"><div class="field"><label for="nd-ph">Từ ngữ (mỗi dòng một từ)</label><textarea id="nd-ph" name="phrases" rows="5" class="reading" spellcheck="false">' + ui.esc(g.phrases.join('\n')) + '</textarea></div>' +
      '<div class="field"><label for="nd-se">Câu (mỗi dòng một câu) <span class="optional">(không bắt buộc)</span></label><textarea id="nd-se" name="sentences" rows="5" class="reading" spellcheck="false">' + ui.esc(g.sentences.join('\n')) + '</textarea></div></div>' +
      '<div class="field"><label for="nd-fill">Câu điền từ <span class="optional">(không bắt buộc; mỗi dòng: câu có ___ | các lựa chọn cách nhau dấu phẩy | đáp án)</span></label>' +
      '<textarea id="nd-fill" name="fill" rows="3" class="reading" spellcheck="false">' + ui.esc(g.fill.map(function (f) { return f.text + ' | ' + f.options.join(', ') + ' | ' + f.answer; }).join('\n')) + '</textarea></div>' +
      '<div id="nd-issues"></div>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu nhóm ' + ui.esc(g.title) + '</button>' +
      (g.edited && !isCustom ? '<button type="button" class="btn btn-ghost" data-act="reset-group">Khôi phục nội dung gốc</button>' : '') +
      (isCustom ? '<button type="button" class="btn btn-danger" data-act="grp-delete">Xóa nhóm này</button>' : '') + '</div></form>' +
      '<fieldset class="field tone-style"><legend>Cách đặt dấu với oa, oe, uy</legend>' +
      ui.segmented('tone-style', [{ id: 'moi', label: 'Kiểu mới: hoà, khoẻ, thuỷ' }, { id: 'cu', label: 'Kiểu cũ: hòa, khỏe, thủy' }], S.state.curriculum.toneStyle || 'moi', 'Cách đặt dấu') +
      '<p class="hint">Chọn theo sách lớp đang dùng. Ảnh hưởng tới tiếng app tự ghép trong trò chơi và bài tập.</p></fieldset></section>';
  }

  function readContent(form, g) {
    var issues = [], warns = [];
    var words = {};
    g.vans.forEach(function (v) {
      var list = form['w-' + v].value.split(/[,\n]+/).map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
      list = list.filter(function (x, i) { return list.indexOf(x) === i; });
      var name = D.isConsonantUnit(v) ? 'Âm ' : 'Vần ';
      if (list.length < 2 || list.length > 8) issues.push(name + v + ' cần từ 2 đến 8 tiếng (đang có ' + list.length + ').');
      list.forEach(function (w) {
        var p = VV.viet.parse(w);
        if (!p) issues.push('“' + w + '” không phải một tiếng hợp lệ.');
        else if (!D.matches(w, v)) issues.push('“' + w + '” không có ' + (D.isConsonantUnit(v) ? 'âm ' : 'vần ') + v + (D.isConsonantUnit(v) ? '' : ' (vần của tiếng này là ' + p.van + ')') + '.');
      });
      words[v] = list;
    });
    function lines(name) { return form[name].value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
    var phrases = lines('phrases'), sentences = lines('sentences');
    if (!phrases.length) warns.push('Chưa có từ ngữ: trò chơi “Chọn từ đúng” sẽ dùng câu hỏi khác.');
    var fill = [];
    lines('fill').forEach(function (ln, i) {
      var parts = ln.split('|').map(function (x) { return x.trim(); });
      var opts = (parts[1] || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      var ans = parts[2] || '';
      if (parts.length < 3 || parts[0].indexOf('___') === -1) { issues.push('Câu điền từ dòng ' + (i + 1) + ': cần dạng “câu có ___ | lựa chọn | đáp án”.'); return; }
      if (opts.length < 2) { issues.push('Câu điền từ dòng ' + (i + 1) + ': cần ít nhất 2 lựa chọn.'); return; }
      if (opts.indexOf(ans) === -1) { issues.push('Câu điền từ dòng ' + (i + 1) + ': đáp án “' + ans + '” không nằm trong các lựa chọn.'); return; }
      fill.push({ text: parts[0], options: opts, answer: ans });
    });
    if (!g.hidden && g.id) {
      var kho = D.khoAt(g.id, S.state.classInfo.extraWords);
      phrases.concat(sentences, fill.map(function (f) { return f.text.replace('___', f.answer); })).forEach(function (t) {
        var out = VV.viet.checkText(t, kho).outside;
        if (out.length) warns.push('“' + t + '” có tiếng chưa học tới nhóm ' + g.id + ': ' + out.join(', ') + '.');
      });
    }
    return { issues: issues, warns: warns, data: { words: words, phrases: phrases, sentences: sentences, fill: fill } };
  }

  // Thêm nhóm vần riêng (ví dụ vần sách lớp đang dùng có mà danh sách gợi ý chưa có).
  function addGroupDialog() {
    ui.openDialog('<form><h2 id="dialog-title" class="dialog-title">Thêm nhóm vần</h2>' +
      '<p class="muted">Mỗi dòng một vần: viết vần, dấu hai chấm, rồi các tiếng có vần đó. Từ ngữ và câu thêm sau ở ô sửa nhóm.</p>' +
      '<div class="field"><label for="ng-lines">Vần và tiếng</label><textarea id="ng-lines" name="lines" rows="4" class="reading" spellcheck="false" placeholder="oong: boong, xoong…"></textarea></div>' +
      '<div id="ng-issues"></div>' +
      '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Hủy</button><button type="submit" class="btn btn-primary">Thêm nhóm</button></div></form>',
      {
        onMount: function (dlg) {
          dlg.querySelector('form').onsubmit = function (e) {
            e.preventDefault();
            var issues = [], words = {}, vans = [];
            var existing = [];
            D.allGroups().forEach(function (g) { existing = existing.concat(g.vans); });
            e.target.lines.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (ln) {
              var parts = ln.split(':');
              var v = (parts[0] || '').trim().toLowerCase();
              var list = (parts[1] || '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
              if (!v || D.isConsonantUnit(v)) { issues.push('“' + ln + '”: cần bắt đầu bằng một vần, ví dụ “oong: boong, xoong”.'); return; }
              if (existing.indexOf(v) !== -1 || vans.indexOf(v) !== -1) { issues.push('Vần ' + v + ' đã có trong danh sách.'); return; }
              if (list.length < 2) { issues.push('Vần ' + v + ' cần ít nhất 2 tiếng.'); return; }
              list.forEach(function (w) { var p = VV.viet.parse(w); if (!p || p.van !== v) issues.push('“' + w + '” không có vần ' + v + '.'); });
              vans.push(v); words[v] = list.slice(0, 8);
            });
            if (!vans.length && !issues.length) issues.push('Nhập ít nhất một dòng.');
            if (issues.length) {
              dlg.querySelector('#ng-issues').innerHTML = '<div class="kho-summary is-warn" role="alert">' + ui.icon('alert') + '<ul>' + issues.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ul></div>';
              return;
            }
            var key = 'tu-' + Date.now().toString(36);
            S.updateCurriculum(function (cur) { cur.custom.push({ key: key, vans: vans, words: words, phrases: [], sentences: [], fill: [] }); });
            editKey = key;
            ui.closeDialog();
            ui.toast('Đã thêm nhóm ' + vans.join(', ') + ' vào cuối danh sách. Dùng mũi tên để đưa nhóm về đúng chỗ.');
            VV.app.refresh();
          };
        }
      });
  }

  function moveGroup(key, dir) {
    var order = D.allGroups().map(function (g) { return g.key; });
    var i = order.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    order[i] = order[j]; order[j] = key;
    S.updateCurriculum(function (cur) { cur.order = order; });
    VV.app.refresh();
    var btn = document.querySelector('[data-act="' + (dir < 0 ? 'grp-up' : 'grp-down') + '"][data-key="' + key + '"]');
    if (btn && !btn.disabled) btn.focus();
  }

  var INSTALL_VOICE = 'Cài giọng tiếng Việt: trên Windows vào Cài đặt, Thời gian và ngôn ngữ, Giọng nói, thêm Tiếng Việt; trên Android vào Cài đặt, Chuyển văn bản thành giọng nói, tải dữ liệu giọng tiếng Việt; trên iPhone, iPad vào Cài đặt, Trợ năng, Nội dung được đọc, Giọng nói, tải Tiếng Việt. Sau đó mở lại trang.';
  function voiceSection() {
    var voices = ui.viVoices();
    var v = S.settings.voice;
    var st = ui.speechStatus();
    var status = st === 'none' ? ['is-miss', 'Trình duyệt này không có chức năng đọc. Dùng Chrome, Edge hoặc Safari bản mới.']
      : st === 'ok' ? ['is-ok', 'Đã đọc được trên máy này.']
      : st === 'fail' ? ['is-miss', 'Lần đọc gần nhất không phát ra tiếng. ' + INSTALL_VOICE]
      : ['', voices.length ? 'Có ' + voices.length + ' giọng tiếng Việt. Bấm Nghe thử để kiểm tra.' : 'Máy không liệt kê giọng tiếng Việt, nhưng điện thoại thường vẫn đọc được. Bấm Nghe thử để kiểm tra.'];
    var hasPref = voices.some(function (x) { return x.name === v.name; });
    return '<section class="panel" id="giong" aria-labelledby="giong-title"><h2 class="panel-title" id="giong-title">Giọng đọc mẫu</h2>' +
      '<form data-form="voice"><div class="form-grid">' +
      '<div class="field"><label for="vc-name">Giọng</label><select id="vc-name" name="name">' +
      '<option value=""' + (hasPref ? '' : ' selected') + '>Tự chọn (ưu tiên giọng cài trong máy)</option>' +
      voices.map(function (x) {
        return '<option value="' + ui.esc(x.name) + '"' + (x.name === v.name ? ' selected' : '') + '>' + ui.esc(x.name) + (x.localService ? '' : ' (cần mạng)') + '</option>';
      }).join('') + '</select>' +
      '<p class="hint">Giọng “cần mạng” đọc hay hơn nhưng dễ mất tiếng khi mạng yếu. App tự chuyển sang giọng khác nếu giọng đã chọn không đọc.</p></div>' +
      '<div class="field"><label for="vc-rate">Tốc độ đọc <span class="num" id="vc-rate-val">' + String(v.rate).replace('.', ',') + '</span></label><input id="vc-rate" name="rate" type="range" min="0.5" max="1.2" step="0.05" value="' + v.rate + '"></div></div>' +
      '<div class="btn-row"><button type="button" class="btn" data-speak="Bé và bạn ra sân.">' + ui.icon('volume') + 'Nghe thử</button></div>' +
      '<p class="ai-test ' + status[0] + '" role="status" id="voice-status">' + ui.esc(status[1]) + '</p></form>' +
      '</section>';
  }

  function dataSection() {
    var kb = Math.round(S.storageSize() / 1024);
    return '<section class="panel" id="du-lieu" aria-labelledby="dl-title"><h2 class="panel-title" id="dl-title">Dữ liệu</h2>' +
      '<p class="muted">Mọi dữ liệu lưu trong trình duyệt của máy này (đang dùng khoảng <span class="num">' + kb + '</span> KB). Xuất bản sao định kỳ để không mất dữ liệu khi xóa lịch sử trình duyệt hoặc đổi máy.</p>' +
      (S.state.isDemo ? '<div class="banner">Đang dùng dữ liệu mẫu. Bấm <b>Bắt đầu lớp mới</b> để xóa dữ liệu mẫu và nhập học sinh của bạn.</div>' : '') +
      '<div class="btn-row">' +
      '<button type="button" class="btn" data-act="export">' + ui.icon('download') + 'Xuất bản sao lưu</button>' +
      '<label class="btn" for="import-file">' + ui.icon('upload') + 'Nhập bản sao lưu</label><input id="import-file" type="file" accept="application/json,.json" class="sr-only" data-role="import">' +
      '</div><div class="btn-row">' +
      '<button type="button" class="btn btn-danger" data-act="new-class">Bắt đầu lớp mới</button>' +
      '<button type="button" class="btn btn-ghost" data-act="demo">Nạp lại dữ liệu mẫu</button></div></section>';
  }

  function render(root, params) {
    root.innerHTML = '<section class="page settings"><header class="page-head"><div><h1>Cài đặt</h1>' +
      '<p class="lede">Kết nối AI, thông tin lớp, kho tiếng và sao lưu dữ liệu.</p></div></header>' +
      '<nav class="tabs" aria-label="Mục cài đặt">' +
      [['ai', 'Kết nối AI'], ['lop', 'Lớp học'], ['kho', 'Kho tiếng'], ['noi-dung', 'Nội dung bài học'], ['qr', 'Mã QR'], ['giong', 'Giọng đọc'], ['du-lieu', 'Dữ liệu']].map(function (x) {
        return '<a class="tab" href="#/cai-dat/' + x[0] + '">' + x[1] + '</a>';
      }).join('') + '</nav>' +
      aiSection() + classSection() + khoSection() + contentSection() + qrSection() + voiceSection() + dataSection() + '</section>';
    if (params[0]) {
      var el = document.getElementById(params[0]);
      if (el) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 0);
    }
  }

  function saveAI(form, silent) {
    var s = S.settings.ai;
    var provider = form.querySelector('input[name="provider"]:checked').value;
    s.provider = provider;
    s.model = form.model.value.trim() || VV.ai.PROVIDERS[provider].defaultModel;
    if (form.baseUrl) s.baseUrl = form.baseUrl.value.trim();
    s.remember = form.remember.checked;
    S.setApiKey(form.key.value.trim(), s.remember);
    S.save();
    VV.app.renderNav();
    if (!silent) ui.toast(VV.ai.isReady() ? 'Đã lưu kết nối AI.' : 'Đã lưu. Còn thiếu API key' + (provider === 'compatible' ? ' hoặc địa chỉ API' : '') + '.');
  }

  VV.views['cai-dat'] = {
    render: render,
    act: {
      'toggle-key': function () {
        var input = document.getElementById('ai-key');
        showKey = !showKey;
        input.type = showKey ? 'text' : 'password';
        var b = document.querySelector('[data-act="toggle-key"]');
        b.setAttribute('aria-pressed', showKey);
        b.setAttribute('aria-label', showKey ? 'Ẩn key' : 'Hiện key');
        b.innerHTML = ui.icon(showKey ? 'eyeOff' : 'eye');
      },
      'test-ai': function () {
        var form = document.querySelector('form[data-form="ai"]');
        saveAI(form, true);
        var out = document.getElementById('ai-test');
        if (!VV.ai.isReady()) { out.className = 'ai-test is-miss'; out.textContent = 'Chưa đủ thông tin: cần API key, model' + (S.settings.ai.provider === 'compatible' ? ' và địa chỉ API' : '') + '.'; return; }
        testing = new AbortController();
        var btn = document.querySelector('[data-act="test-ai"]');
        btn.disabled = true; btn.textContent = 'Đang kiểm tra…';
        out.className = 'ai-test'; out.textContent = 'Đang gửi một yêu cầu ngắn…';
        var t0 = Date.now();
        VV.ai.testConnection(testing.signal, function (n, wait) {
          out.textContent = 'Chưa nhận được trả lời. Đang thử lại lần ' + n + (wait ? ' sau ' + wait + ' giây' : '') + '…';
        }).then(function (text) {
          out.className = 'ai-test is-ok';
          out.textContent = 'Kết nối được. AI trả lời “' + String(text).trim().slice(0, 40) + '” sau ' + ((Date.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' giây.';
        }, function (err) {
          out.className = 'ai-test is-miss';
          out.textContent = err.message;
        }).then(function () {
          testing = null; btn.disabled = false; btn.textContent = 'Kiểm tra kết nối';
        });
      },
      'clear-site': function () {
        S.commit(function (s) { s.classInfo.siteUrl = ''; });
        ui.toast('Đã xóa địa chỉ. Thẻ in sẽ không kèm mã QR.'); VV.app.refresh();
      },
      'reset-group': function () {
        var g = findGroup(editKey);
        ui.confirmDialog({ title: 'Khôi phục nội dung gốc nhóm ' + g.title + '?', body: 'Các tiếng, từ, câu bạn đã sửa của nhóm này sẽ trở về bản có sẵn.' }, 'Khôi phục', true).then(function (ok) {
          if (!ok) return;
          S.updateCurriculum(function (cur) { delete cur.edits[editKey]; });
          ui.toast('Đã khôi phục nội dung gốc nhóm ' + g.title + '.'); VV.app.refresh();
        });
      },
      'grp-up': function (el) { moveGroup(el.getAttribute('data-key'), -1); },
      'grp-down': function (el) { moveGroup(el.getAttribute('data-key'), 1); },
      'grp-edit': function (el) {
        editKey = el.getAttribute('data-key');
        VV.app.refresh();
        var f = document.querySelector('form[data-form="content"]');
        if (f) { f.scrollIntoView({ block: 'start' }); var first = f.querySelector('textarea'); if (first) first.focus({ preventScroll: true }); }
      },
      'grp-add': function () { addGroupDialog(); },
      'grp-reset-order': function () {
        ui.confirmDialog({ title: 'Trở về thứ tự gợi ý?', body: 'Mọi nhóm sẽ được dùng lại theo thứ tự có sẵn. Nội dung đã sửa và nhóm tự thêm vẫn giữ nguyên.' }, 'Trở về thứ tự gợi ý').then(function (ok) {
          if (!ok) return;
          S.updateCurriculum(function (cur) { cur.order = null; cur.hidden = []; });
          ui.toast('Đã trở về thứ tự gợi ý.'); VV.app.refresh();
        });
      },
      'grp-delete': function () {
        var g = findGroup(editKey);
        ui.confirmDialog({ title: 'Xóa nhóm ' + g.title + '?', body: 'Nhóm tự thêm này sẽ bị xóa khỏi danh sách. Kết quả đọc đã ghi vẫn còn trong nhật ký.' }, 'Xóa nhóm', true).then(function (ok) {
          if (!ok) return;
          S.updateCurriculum(function (cur) {
            cur.custom = cur.custom.filter(function (c) { return c.key !== editKey; });
            if (cur.order) cur.order = cur.order.filter(function (k) { return k !== editKey; });
          });
          editKey = null;
          ui.toast('Đã xóa nhóm.'); VV.app.refresh();
        });
      },
      'clear-key': function () {
        S.setApiKey('', false);
        ui.toast('Đã xóa API key khỏi máy này.');
        VV.app.renderNav(); VV.app.refresh();
      },
      'add-stu': function () {
        S.commit(function (s) {
          var n = s.students.length + 1;
          var code = 'HS' + ('0' + n).slice(-2);
          while (s.students.some(function (x) { return x.code === code; })) { n++; code = 'HS' + ('0' + n).slice(-2); }
          s.students.push({ id: S.uid('stu'), code: code, note: '' });
        });
        VV.app.refresh();
      },
      'add-many': function () {
        ui.openDialog('<form><h2 id="dialog-title" class="dialog-title">Thêm nhiều học sinh</h2>' +
          '<div class="field"><label for="many-n">Số học sinh cần thêm</label><input id="many-n" name="n" type="number" inputmode="numeric" min="1" max="60" value="20" class="input-short num" required></div>' +
          '<p class="hint">Mã được tạo tự động theo dạng HS01, HS02… Có thể sửa mã sau.</p>' +
          '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Hủy</button><button type="submit" class="btn btn-primary">Thêm</button></div></form>',
          {
            onMount: function (dlg) {
              dlg.querySelector('form').onsubmit = function (e) {
                e.preventDefault();
                var count = Math.max(1, Math.min(60, Number(e.target.n.value) || 0));
                S.commit(function (s) {
                  var n = s.students.length;
                  for (var i = 0; i < count; i++) {
                    var code;
                    do { n++; code = 'HS' + ('0' + n).slice(-2); } while (s.students.some(function (x) { return x.code === code; }));
                    s.students.push({ id: S.uid('stu'), code: code, note: '' });
                  }
                });
                ui.closeDialog(); ui.toast('Đã thêm ' + count + ' học sinh.'); VV.app.refresh();
              };
            }
          });
      },
      'del-stu': function (el) {
        var id = el.getAttribute('data-id');
        ui.confirmDialog({ title: 'Xóa ' + S.studentLabel(id) + '?', body: 'Mọi kết quả đọc, viết và bài đo của em này cũng bị xóa.' }, 'Xóa học sinh', true).then(function (ok) {
          if (!ok) return;
          S.commit(function (s) {
            s.students = s.students.filter(function (x) { return x.id !== id; });
            ['records', 'tests', 'writing', 'comprehension', 'practice'].forEach(function (k) { s[k] = s[k].filter(function (x) { return x.studentId !== id; }); });
            delete s.assignments[id];
          });
          VV.app.refresh();
        });
      },
      export: function () {
        var d = new Date();
        var name = 'van-vui-ai-sao-luu-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.json';
        ui.download(name, JSON.stringify(S.state, null, 1), 'application/json');
      },
      'new-class': function () {
        ui.confirmDialog({ title: 'Bắt đầu lớp mới?', body: 'Toàn bộ học sinh, kết quả và học liệu hiện có trên máy này sẽ bị xóa. Nên xuất bản sao lưu trước.' }, 'Xóa và bắt đầu', true).then(function (ok) {
          if (!ok) return;
          S.resetToEmpty(false);
          VV.app.go('cai-dat/lop');
          ui.toast('Đã tạo lớp mới. Thêm học sinh để bắt đầu.');
        });
      },
      demo: function () {
        ui.confirmDialog({ title: 'Nạp dữ liệu mẫu?', body: 'Dữ liệu hiện tại sẽ được thay bằng 8 học sinh mẫu.' }, 'Nạp dữ liệu mẫu', true).then(function (ok) {
          if (!ok) return;
          S.resetToDemo(); VV.app.refresh(); ui.toast('Đã nạp dữ liệu mẫu.');
        });
      }
    },
    onchange: function (e) {
      var t = e.target;
      if (t.name === 'groupKey') { editKey = t.value; VV.app.refresh(); return; }
      if (t.hasAttribute('data-grp-use')) {
        var key = t.getAttribute('data-grp-use');
        if (!t.checked && D.GROUPS.length <= 1) { t.checked = true; ui.toast('Cần dùng ít nhất một nhóm.', 'error'); return; }
        S.updateCurriculum(function (cur) {
          cur.hidden = cur.hidden.filter(function (k) { return k !== key; });
          if (!t.checked) cur.hidden.push(key);
        });
        ui.toast(t.checked ? 'Đã dùng lại nhóm.' : 'Đã ẩn nhóm. Bài học, trò chơi và bản đồ sẽ bỏ qua nhóm này.');
        VV.app.refresh();
        var again = document.querySelector('[data-grp-use="' + key + '"]');
        if (again) again.focus();
        return;
      }
      if (t.name === 'tone-style') {
        S.updateCurriculum(function (cur) { cur.toneStyle = t.value; });
        ui.toast('Đã đổi cách đặt dấu.');
        return;
      }
      if (t.name === 'provider') {
        var s = S.settings.ai;
        s.provider = t.value;
        s.model = VV.ai.PROVIDERS[t.value].defaultModel;
        S.save(); VV.app.refresh();
        return;
      }
      if (t.getAttribute('data-role') === 'import' && t.files && t.files[0]) {
        var reader = new FileReader();
        reader.onload = function () {
          try {
            S.importState(JSON.parse(reader.result));
            ui.toast('Đã nhập bản sao lưu.'); VV.app.refresh();
          } catch (err) { ui.toast(err.message || 'Tệp không đọc được.', 'error'); }
        };
        reader.readAsText(t.files[0]);
        return;
      }
      if (t.hasAttribute('data-stu-code')) {
        var id = t.getAttribute('data-stu-code'), val = t.value.trim();
        if (!val) { ui.toast('Mã học sinh không được để trống.', 'error'); t.value = S.studentLabel(id); return; }
        if (S.state.students.some(function (x) { return x.id !== id && x.code === val; })) { ui.toast('Mã ' + val + ' đã có trong lớp.', 'error'); t.value = S.studentLabel(id); return; }
        S.commit(function (s) { S.student(id).code = val; });
        ui.toast('Đã lưu mã ' + val + '.');
      }
      if (t.hasAttribute('data-stu-note')) {
        var sid = t.getAttribute('data-stu-note');
        S.commit(function () { S.student(sid).note = t.value.trim(); });
      }
      if (t.closest('form[data-form="voice"]')) {
        if (t.name === 'name') S.settings.voice.name = t.value;
        S.save();
      }
    },
    oninput: function (e) {
      if (e.target.name === 'rate') {
        S.settings.voice.rate = Number(e.target.value);
        document.getElementById('vc-rate-val').textContent = e.target.value.replace('.', ',');
        S.save();
      }
    },
    onsubmit: function (e) {
      e.preventDefault();
      var f = e.target, kind = f.getAttribute('data-form');
      if (kind === 'ai') saveAI(f);
      if (kind === 'class') {
        S.commit(function (s) { s.classInfo.name = f.name.value.trim() || 'Lớp 1'; s.classInfo.progress = Number(f.progress.value); });
        ui.toast('Đã lưu thông tin lớp.'); VV.app.refresh();
      }
      if (kind === 'site') {
        var u = f.siteUrl.value.trim();
        if (u && !/^https?:\/\//i.test(u)) { ui.toast('Địa chỉ cần bắt đầu bằng https://', 'error'); f.siteUrl.focus(); return; }
        S.commit(function (s) { s.classInfo.siteUrl = u; });
        ui.toast(u ? 'Đã lưu địa chỉ. Thẻ in sẽ có mã QR.' : 'Đã xóa địa chỉ.'); VV.app.refresh();
      }
      if (kind === 'content') {
        var g = findGroup(editKey);
        var r = readContent(f, g);
        var box = document.getElementById('nd-issues');
        if (r.issues.length) {
          box.innerHTML = '<div class="kho-summary is-warn" role="alert">' + ui.icon('alert') + '<div><p>Chưa lưu được. Sửa các chỗ sau:</p><ul>' + r.issues.map(function (x) { return '<li>' + ui.esc(x) + '</li>'; }).join('') + '</ul></div></div>';
          return;
        }
        var save = function () {
          S.updateCurriculum(function (cur) {
            var custom = cur.custom.filter(function (c) { return c.key === g.key; })[0];
            if (custom) { custom.words = r.data.words; custom.phrases = r.data.phrases; custom.sentences = r.data.sentences; custom.fill = r.data.fill; }
            else cur.edits[g.key] = r.data;
          });
          ui.toast('Đã lưu nhóm ' + g.title + '.'); VV.app.refresh();
        };
        if (r.warns.length) {
          ui.confirmDialog({ title: 'Có tiếng chưa học', body: r.warns.join(' ') + ' Vẫn lưu?' }, 'Vẫn lưu').then(function (ok) { if (ok) save(); });
        } else save();
      }
      if (kind === 'kho') {
        var words = f.extra.value.split(/[,\n;]+/).map(function (w) { return w.trim().toLowerCase(); }).filter(Boolean);
        S.commit(function (s) { s.classInfo.extraWords = words.filter(function (w, i) { return words.indexOf(w) === i; }); });
        ui.toast('Đã lưu ' + words.length + ' tiếng bổ sung.'); VV.app.refresh();
      }
    }
  };

  // Danh sách giọng hoặc trạng thái đọc thay đổi: chỉ vẽ lại mục Giọng đọc, không làm mất chỗ đang thao tác.
  document.addEventListener('vv-voices', function () {
    if (VV.app.route !== 'cai-dat') return;
    var sec = document.getElementById('giong');
    if (!sec || sec.contains(document.activeElement) && document.activeElement.tagName === 'SELECT') return;
    var focusedSpeak = document.activeElement && document.activeElement.hasAttribute('data-speak');
    sec.outerHTML = voiceSection();
    if (focusedSpeak) { var b = document.querySelector('#giong [data-speak]'); if (b) b.focus({ preventScroll: true }); }
  });
})(window.VV = window.VV || {});
