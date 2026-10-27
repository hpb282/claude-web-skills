/* Màn hình Bản đồ âm vần: hồ sơ từng em, gợi ý bài luyện có lý do, so sánh hai hồ sơ. */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store;

  var view = { selected: null, compare: false, second: null };

  var STATUS_LABEL = { 'can-luyen': 'Cần luyện', 'dang-len': 'Đang lên', 'vung': 'Vững', 'chua-do': 'Chưa đo' };

  function dots(cell) {
    var out = '';
    for (var i = 0; i < 6; i++) {
      var cls = i < cell.read.correct ? 'is-ok' : (i < cell.read.total ? 'is-miss' : '');
      out += '<span class="dot ' + cls + '"></span>';
    }
    return '<span class="dots" aria-hidden="true">' + out + '</span>';
  }

  function tile(cell, learned) {
    var status = S.cellStatus(cell);
    var score = cell.read.total ? cell.read.correct + '/' + cell.read.total : '–';
    var aria = 'Vần ' + cell.van + ': ' + (cell.read.total ? cell.read.correct + ' trên ' + cell.read.total + ' tiếng đọc đúng' : 'chưa đo') + (learned ? '' : ', chưa học');
    var game = cell.game.total ? '<span class="van-game">chọn đúng ' + cell.game.correct + '/' + cell.game.total + '</span>' : '';
    return '<button type="button" class="van-tile is-' + status + (learned ? '' : ' is-future') + '" data-act="detail" data-van="' + ui.esc(cell.van) + '" aria-label="' + ui.esc(aria) + '">' +
      '<span class="van-glyph">' + ui.esc(cell.van) + '</span>' +
      '<span class="van-score">' + score + '</span>' + dots(cell) + game + '</button>';
  }

  function profileHTML(studentId) {
    var map = S.vanMap(studentId);
    var progress = S.state.classInfo.progress;
    var sug = S.suggest(studentId);
    var asg = S.assignment(studentId);
    var groups = D.GROUPS.map(function (g) {
      var learned = g.id <= progress;
      return '<div class="map-row' + (learned ? '' : ' is-future') + '">' +
        '<span class="map-row-label">Nhóm ' + g.id + (learned ? '' : '<small>chưa học</small>') + '</span>' +
        '<div class="map-tiles">' + g.vans.map(function (v) { return tile(map[v], learned); }).join('') + '</div></div>';
    }).join('');

    var asgHTML = asg
      ? '<p class="assigned">' + ui.icon('check') + '<span>Đang giao: vần <b class="glyph-inline">' + ui.esc(asg.van) + '</b>, mức ' +
        ui.esc(D.label(D.LEVELS, asg.level).toLowerCase()) + ' (' + (asg.source === 'goi-y' ? 'theo gợi ý' : 'giáo viên chọn') + ', ' + ui.fmtShort(asg.date) + ').</span>' +
        '<button type="button" class="btn btn-sm btn-ghost" data-act="unassign" data-student="' + studentId + '">Bỏ giao</button></p>'
      : '<p class="assigned is-none">Chưa giao bài cho em này.</p>';

    return '<article class="profile" aria-label="Hồ sơ ' + ui.esc(S.studentLabel(studentId)) + '">' +
      '<div class="oli-sheet">' +
      '<div class="sheet-head"><h2 class="sheet-title">Hồ sơ luyện đọc <span class="code-tag">' + ui.esc(S.studentLabel(studentId)) + '</span></h2>' +
      '<ul class="legend" aria-label="Chú thích màu">' +
      ['can-luyen', 'dang-len', 'vung', 'chua-do'].map(function (k) { return '<li><span class="swatch is-' + k + '"></span>' + STATUS_LABEL[k] + '</li>'; }).join('') +
      '</ul></div>' + groups +
      '<p class="sheet-note">Số trên mỗi ô là số tiếng đọc đúng trong tối đa 6 lần đọc gần nhất do giáo viên nghe và ghi. Dòng "chọn đúng" là kết quả trò chơi nhận diện, không thay cho việc nghe em đọc.</p>' +
      '</div>' +
      '<aside class="suggest" aria-label="Gợi ý luyện tiếp">' +
      '<h3 class="suggest-title">Gợi ý luyện tiếp</h3>' +
      '<p class="suggest-pick"><span class="suggest-van">' + ui.esc(sug.van) + '</span><span class="level-tag level-' + sug.level + '">' + ui.esc(D.label(D.LEVELS, sug.level)) + '</span></p>' +
      '<p class="suggest-reason">' + ui.esc(sug.reason) + '</p>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="assign" data-student="' + studentId + '" data-van="' + ui.esc(sug.van) + '" data-level="' + sug.level + '">Giao bài này</button>' +
      '<button type="button" class="btn" data-act="change" data-student="' + studentId + '">Đổi bài</button>' +
      '<button type="button" class="btn btn-ghost" data-act="preview" data-van="' + ui.esc((asg || sug).van) + '" data-level="' + (asg || sug).level + '">' + ui.icon('eye') + 'Xem bài luyện</button>' +
      '<button type="button" class="btn btn-ghost" data-act="compose" data-van="' + ui.esc(sug.van) + '" data-error="' + ui.esc(sug.topError || '') + '">' + ui.icon('pen') + 'Soạn bài cho em này</button>' +
      '</div>' + asgHTML + '</aside></article>';
  }

  function recentHTML(studentId) {
    var recs = S.state.records.filter(function (r) { return r.studentId === studentId && r.skill === 'doc'; })
      .sort(function (a, b) { return b.date - a.date; }).slice(0, 8);
    if (!recs.length) return '';
    return '<section class="panel"><h2 class="panel-title">Lần đọc gần đây của ' + ui.esc(S.studentLabel(studentId)) + '</h2>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Ngày</th><th scope="col">Tiếng</th><th scope="col">Vần</th><th scope="col">Kết quả</th><th scope="col">Lỗi</th><th scope="col">Nguồn</th></tr></thead><tbody>' +
      recs.map(function (r) {
        return '<tr><td class="tnum">' + ui.fmtShort(r.date) + '</td><td class="reading">' + ui.vanWord(r.tieng, r.van) + '</td><td>' + ui.esc(r.van) + '</td>' +
          '<td>' + (r.correct ? '<span class="pill pill-ok">Đúng</span>' : '<span class="pill pill-miss">Chưa đúng</span>') + '</td>' +
          '<td>' + (r.error ? ui.esc(D.label(D.READ_ERRORS, r.error)) : '') + '</td>' +
          '<td>' + ({ phieu: 'Phiếu đọc nhanh', 'bai-do': 'Bài đo A/B', 'luyen': 'Góc luyện tập' }[r.source] || r.source) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function render(root, params) {
    var st = S.state;
    if (params && params[0] && S.student(params[0])) view.selected = params[0];
    if (!st.students.length) {
      root.innerHTML = '<section class="page"><header class="page-head"><div><h1>Bản đồ âm vần</h1></div></header>' +
        ui.emptyState('Lớp chưa có học sinh', 'Thêm mã học sinh trong Cài đặt để bắt đầu ghi kết quả đọc.', '<a class="btn btn-primary" href="#/cai-dat/lop">Thêm học sinh</a>') + '</section>';
      return;
    }
    if (!view.selected || !S.student(view.selected)) view.selected = st.students[0].id;
    if (!view.second || !S.student(view.second) || view.second === view.selected) {
      view.second = (st.students.filter(function (s) { return s.id !== view.selected; })[0] || {}).id;
    }
    var g = D.GROUPS[st.classInfo.progress - 1];

    var picker = function (name, value, label) {
      return '<div class="student-picker" role="radiogroup" aria-label="' + label + '">' +
        st.students.map(function (s) {
          var id = name + '-' + s.id;
          var hasAsg = !!st.assignments[s.id];
          return '<input type="radio" name="' + name + '" id="' + id + '" value="' + s.id + '"' + (s.id === value ? ' checked' : '') + '>' +
            '<label for="' + id + '">' + ui.esc(s.code) + (hasAsg ? '<span class="asg-dot" title="Đã giao bài"></span>' : '') + '</label>';
        }).join('') + '</div>';
    };

    root.innerHTML = '<section class="page">' +
      '<header class="page-head"><div><h1>Bản đồ âm vần</h1>' +
      '<p class="lede">' + ui.esc(st.classInfo.name) + ' đã học tới nhóm ' + g.id + ' (' + ui.esc(g.title) + '). Chọn một em để xem vần cần luyện và bài gợi ý.</p></div>' +
      '<label class="switch"><input type="checkbox" data-role="compare"' + (view.compare ? ' checked' : '') + '><span>So sánh hai hồ sơ</span></label></header>' +
      (st.isDemo ? '<div class="banner">Đây là dữ liệu mẫu của 8 học sinh giả lập để xem thử. <a href="#/cai-dat/du-lieu">Xóa dữ liệu mẫu</a> khi bắt đầu dùng với lớp của bạn.</div>' : '') +
      (view.compare
        ? '<div class="compare-grid"><div>' + picker('stuA', view.selected, 'Hồ sơ thứ nhất') + profileHTML(view.selected) + '</div>' +
          '<div>' + picker('stuB', view.second, 'Hồ sơ thứ hai') + profileHTML(view.second) + '</div></div>' +
          '<p class="compare-note">Hai hồ sơ có lỗi khác nhau nên hệ thống gợi ý hai bài khác nhau. Lý do nằm ngay dưới mỗi gợi ý.</p>'
        : picker('stuA', view.selected, 'Chọn học sinh') + profileHTML(view.selected) + recentHTML(view.selected)) +
      '</section>';
  }

  function detail(van) {
    var sid = view.selected;
    var recs = S.state.records.filter(function (r) { return r.studentId === sid && r.van === van; }).sort(function (a, b) { return b.date - a.date; });
    var reads = recs.filter(function (r) { return r.skill === 'doc'; }).slice(0, 10);
    var games = recs.filter(function (r) { return r.skill === 'nhan-dien'; });
    var g = D.groupOfVan(van);
    ui.openDialog(
      '<h2 id="dialog-title" class="dialog-title">Vần <span class="glyph-inline">' + ui.esc(van) + '</span> của ' + ui.esc(S.studentLabel(sid)) + '</h2>' +
      (reads.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Ngày</th><th scope="col">Tiếng</th><th scope="col">Kết quả</th><th scope="col">Lỗi</th></tr></thead><tbody>' +
          reads.map(function (r) {
            return '<tr><td class="tnum">' + ui.fmtShort(r.date) + '</td><td class="reading">' + ui.vanWord(r.tieng, van) + '</td><td>' +
              (r.correct ? '<span class="pill pill-ok">Đúng</span>' : '<span class="pill pill-miss">Chưa đúng</span>') + '</td><td>' + (r.error ? ui.esc(D.label(D.READ_ERRORS, r.error)) : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p>Chưa có lần đọc nào của vần này.</p>') +
      timelineHTML(recs.filter(function (r) { return r.skill === 'doc'; })) +
      '<p class="muted">Trò chơi nhận diện: ' + (games.length ? games.filter(function (r) { return r.correct; }).length + '/' + games.length + ' lượt chọn đúng.' : 'chưa chơi.') + '</p>' +
      '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Đóng</button>' +
      '<a class="btn btn-primary" href="#/danh-gia/phieu/' + encodeURIComponent(sid) + '/' + g.id + '/' + encodeURIComponent(van) + '" data-global="close-dialog">Ghi phiếu đọc vần này</a></div>'
    );
  }

  // Đối chiếu: kết quả đọc vần này theo từng buổi, cũ đến mới.
  function timelineHTML(reads) {
    var byDay = {}, order = [];
    reads.slice().sort(function (a, b) { return a.date - b.date; }).forEach(function (r) {
      var key = ui.fmtDate(r.date);
      if (!byDay[key]) { byDay[key] = { c: 0, t: 0, date: r.date }; order.push(key); }
      byDay[key].t++; if (r.correct) byDay[key].c++;
    });
    if (order.length < 1) return '';
    return '<h3 class="sub-title">Đối chiếu theo buổi</h3><ol class="timeline">' + order.map(function (k) {
      var d = byDay[k], r = d.c / d.t;
      return '<li><span class="tnum">' + ui.fmtShort(d.date) + '</span><span class="bar" aria-hidden="true"><span style="width:' + Math.round(r * 100) + '%"></span></span>' +
        '<span class="num">' + d.c + '/' + d.t + '</span></li>';
    }).join('') + '</ol>' +
      (order.length > 1 ? '<p class="muted">' + (byDay[order[order.length - 1]].c / byDay[order[order.length - 1]].t > byDay[order[0]].c / byDay[order[0]].t ? 'Buổi gần nhất tốt hơn buổi đầu.' : 'Buổi gần nhất chưa tốt hơn buổi đầu; cân nhắc đổi cách luyện.') + '</p>' : '');
  }

  function changeDialog(studentId) {
    var learned = D.vansUpTo(S.state.classInfo.progress);
    var cur = S.assignment(studentId) || S.suggest(studentId);
    ui.openDialog(
      '<form data-form="change"><h2 id="dialog-title" class="dialog-title">Đổi bài cho ' + ui.esc(S.studentLabel(studentId)) + '</h2>' +
      '<div class="field"><label for="chg-van">Vần cần luyện</label><select id="chg-van" name="van">' +
      learned.map(function (v) { return '<option' + (v === cur.van ? ' selected' : '') + '>' + ui.esc(v) + '</option>'; }).join('') + '</select></div>' +
      '<fieldset class="field"><legend>Mức độ</legend>' + ui.segmented('chg-level', D.LEVELS, cur.level, 'Mức độ') + '</fieldset>' +
      '<div class="field"><label for="chg-note">Ghi chú của giáo viên <span class="optional">(không bắt buộc)</span></label><input id="chg-note" name="note" autocomplete="off" placeholder="Ví dụ: em đọc nhầm an và ang…"></div>' +
      '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Hủy</button><button type="submit" class="btn btn-primary">Giao bài</button></div></form>',
      {
        onMount: function (dlg) {
          dlg.querySelector('form').onsubmit = function (e) {
            e.preventDefault();
            var f = e.target;
            var van = f.van.value;
            var level = f.querySelector('input[name="chg-level"]:checked').value;
            var note = f.note.value.trim();
            S.commit(function (s) {
              s.assignments[studentId] = { van: van, level: level, source: 'giao-vien', date: Date.now(), reason: note || 'Giáo viên chọn bài.' };
            });
            ui.closeDialog();
            ui.toast('Đã giao bài vần ' + van + ' cho ' + S.studentLabel(studentId) + '.');
            VV.app.refresh();
          };
        }
      }
    );
  }

  view.render = render;
  view.setCompare = function (on) { view.compare = on; };
  view.act = {
    detail: function (el) {
      var prof = el.closest('.compare-grid > div');
      if (prof && view.compare) {
        var idx = Array.prototype.indexOf.call(prof.parentNode.children, prof);
        if (idx === 1) { var tmp = view.selected; view.selected = view.second; detail(el.getAttribute('data-van')); view.selected = tmp; return; }
      }
      detail(el.getAttribute('data-van'));
    },
    assign: function (el) {
      var sid = el.getAttribute('data-student');
      S.commit(function (s) {
        s.assignments[sid] = { van: el.getAttribute('data-van'), level: el.getAttribute('data-level'), source: 'goi-y', date: Date.now(), reason: 'Giao theo gợi ý của bản đồ âm vần.' };
      });
      ui.toast('Đã giao bài vần ' + el.getAttribute('data-van') + ' cho ' + S.studentLabel(sid) + '.');
      VV.app.refresh();
    },
    change: function (el) { changeDialog(el.getAttribute('data-student')); },
    unassign: function (el) {
      var sid = el.getAttribute('data-student');
      S.commit(function (s) { delete s.assignments[sid]; });
      ui.toast('Đã bỏ giao bài cho ' + S.studentLabel(sid) + '.');
      VV.app.refresh();
    },
    compose: function (el) {
      var van = el.getAttribute('data-van'), err = el.getAttribute('data-error');
      VV.assistant.prefill('exercises', {
        vans: [van],
        errors: err ? [D.label(D.READ_ERRORS, err)] : [],
        objective: 'Đọc đúng các tiếng có vần ' + van + ' trong tiếng, từ và câu; phân biệt vần ' + van + ' với các vần gần giống.'
      });
    },
    preview: function (el) {
      VV.studentMode.open({ preview: true, van: el.getAttribute('data-van'), level: el.getAttribute('data-level') });
    }
  };
  view.onchange = function (e) {
    var t = e.target;
    if (t.name === 'stuA') { view.selected = t.value; history.replaceState(null, '', '#/ban-do/' + t.value); VV.app.refresh(); }
    else if (t.name === 'stuB') { view.second = t.value; VV.app.refresh(); }
    else if (t.getAttribute('data-role') === 'compare') { view.compare = t.checked; VV.app.refresh(); }
  };

  VV.views['ban-do'] = view;
})(window.VV = window.VV || {});
