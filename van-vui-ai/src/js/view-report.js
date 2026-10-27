/* Báo cáo tiến bộ: trước và sau, theo học sinh, nhóm vần, loại lỗi, công sức giáo viên. */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store;

  function trend(a, b) {
    if (!a) return { id: 'thieu', label: 'Chưa đo đầu vào' };
    if (!b) return { id: 'cho', label: 'Chưa đo đầu ra' };
    var d = b.score - a.score;
    if (d >= 2) return { id: 'len', label: 'Tiến bộ', delta: d };
    if (d <= -2) return { id: 'xuong', label: 'Giảm', delta: d };
    return { id: 'giu', label: 'Chưa rõ thay đổi', delta: d };
  }
  function trendChip(t) {
    var icon = { len: 'arrowRight', xuong: 'alert', giu: 'refresh', cho: 'clipboard', thieu: 'clipboard' }[t.id];
    return '<span class="trend trend-' + t.id + '">' + ui.icon(icon) + ui.esc(t.label) + '</span>';
  }
  function delta(t) {
    if (t.delta == null) return '–';
    return (t.delta > 0 ? '+' : t.delta < 0 ? '−' : '') + Math.abs(t.delta);
  }

  function studentRows() {
    return S.state.students.map(function (s) {
      var a = S.latestTest(s.id, 'dau-vao');
      var b = S.latestTest(s.id, 'dau-ra');
      var wa = S.latestWriting(s.id, 'dau-vao'), wb = S.latestWriting(s.id, 'dau-ra');
      var sug = S.suggest(s.id);
      var sessions = S.state.practice.filter(function (p) { return p.studentId === s.id; }).length;
      return { s: s, a: a, b: b, t: trend(a, b), wa: wa && S.writingScore(wa), wb: wb && S.writingScore(wb), sug: sug, sessions: sessions };
    });
  }

  function avg(list) { return list.length ? list.reduce(function (x, y) { return x + y; }, 0) / list.length : null; }
  function one(n) { return ui.dec(n); }

  // Biểu đồ cặp cột ngang: đầu vào và đầu ra theo nhóm vần.
  function prePostChart(studentId) {
    var progress = S.state.classInfo.progress;
    var rows = D.GROUPS.slice(0, progress).map(function (g) {
      var pp = S.groupPrePost(g.id, studentId);
      function bar(cls, r, label) {
        if (!r.total) return '<div class="pp-bar is-none"><span class="pp-val">' + label + ': chưa đo</span></div>';
        var w = Math.max(2, Math.round(r.ratio * 100));
        return '<div class="pp-bar ' + cls + '" tabindex="0" data-tip="' + ui.esc(label + ': ' + r.correct + '/' + r.total + ' tiếng đúng (' + Math.round(r.ratio * 100) + '%)') + '">' +
          '<span class="pp-fill" style="width:' + w + '%"></span><span class="pp-val num">' + Math.round(r.ratio * 100) + '%</span></div>';
      }
      return '<div class="pp-row"><span class="pp-label">Nhóm ' + g.id + ' <span class="reading">' + ui.esc(g.title) + '</span></span>' +
        '<div class="pp-bars">' + bar('is-pre', pp.pre, 'Đầu vào') + bar('is-post', pp.post, 'Đầu ra') + '</div></div>';
    }).join('');
    return '<figure class="chart"><figcaption class="chart-head"><span class="chart-title">Tỉ lệ đọc đúng theo nhóm vần</span>' +
      '<span class="legend-inline"><span class="key is-pre"></span>Đầu vào<span class="key is-post"></span>Đầu ra</span></figcaption>' +
      '<div class="pp-chart">' + rows + '</div>' +
      '<p class="chart-note">Tính từ phiếu đọc nhanh và bài đo A/B có ghi thời điểm đầu vào hoặc đầu ra. Rê chuột hoặc chạm vào cột để xem số tiếng.</p></figure>';
  }

  function errorChart(studentId) {
    var c = S.errorCounts(studentId);
    var max = Math.max.apply(null, D.READ_ERRORS.map(function (e) { return c[e.id]; }).concat([1]));
    var total = D.READ_ERRORS.reduce(function (s, e) { return s + c[e.id]; }, 0);
    return '<figure class="chart"><figcaption class="chart-head"><span class="chart-title">Loại lỗi đọc đã ghi</span><span class="muted num">' + total + ' lỗi</span></figcaption>' +
      (total ? '<div class="err-chart">' + D.READ_ERRORS.map(function (e) {
        return '<div class="err-row"><span class="err-label">' + ui.esc(e.label) + '</span>' +
          '<span class="err-track" tabindex="0" data-tip="' + ui.esc(e.label + ': ' + c[e.id] + ' lần') + '"><span class="err-fill" style="width:' + Math.round(c[e.id] / max * 100) + '%"></span></span>' +
          '<span class="err-val num">' + c[e.id] + '</span></div>';
      }).join('') + '</div>' : '<p class="muted">Chưa ghi lỗi nào.</p>') + '</figure>';
  }

  function classView() {
    var rows = studentRows();
    var withA = rows.filter(function (r) { return r.a; });
    var withB = rows.filter(function (r) { return r.a && r.b; });
    var up = rows.filter(function (r) { return r.t.id === 'len'; }).length;
    var flat = rows.filter(function (r) { return r.t.id === 'giu' || r.t.id === 'xuong'; }).length;
    var waiting = rows.length - up - flat;
    var minutes = S.effortMinutes();
    var wPre = avg(rows.filter(function (r) { return r.wa; }).map(function (r) { return r.wa.ratio; }));
    var wPost = avg(rows.filter(function (r) { return r.wb; }).map(function (r) { return r.wb.ratio; }));

    var stats = '<div class="stats">' +
      '<div class="stat"><p class="stat-label">Đọc đúng, bài đo A/B</p><p class="stat-value num">' + one(avg(withA.map(function (r) { return r.a.score; }))) + '<span class="stat-arrow">→</span>' + one(avg(withB.map(function (r) { return r.b.score; }))) + '<span class="stat-unit">/20</span></p>' +
      '<p class="stat-sub">Trung bình đầu vào ' + withA.length + ' em, đầu ra ' + withB.length + ' em</p></div>' +
      '<div class="stat"><p class="stat-label">Số em theo kết quả</p><p class="stat-value num">' + up + '<span class="stat-unit">tiến bộ</span></p>' +
      '<p class="stat-sub">' + flat + ' em chưa rõ thay đổi hoặc giảm, ' + waiting + ' em chưa đủ dữ liệu</p></div>' +
      '<div class="stat"><p class="stat-label">Viết đúng tiêu chí</p><p class="stat-value num">' + ui.pct(wPre) + '<span class="stat-arrow">→</span>' + ui.pct(wPost) + '</p><p class="stat-sub">Trung bình điểm tiêu chí, đầu vào và đầu ra</p></div>' +
      '<div class="stat"><p class="stat-label">Công sức giáo viên</p><p class="stat-value num">' + minutes + '<span class="stat-unit">phút</span></p><p class="stat-sub">' + S.state.effort.length + ' lần soạn, duyệt, ghi phiếu</p></div>' +
      '</div>';

    var table = '<section class="panel"><div class="panel-head"><h2 class="panel-title">Từng học sinh</h2>' +
      '<button type="button" class="btn btn-sm" data-act="csv">' + ui.icon('download') + 'Xuất CSV</button></div>' +
      '<div class="table-wrap"><table class="table report-table"><thead><tr>' +
      '<th scope="col">Học sinh</th><th scope="col" class="num">Đọc đầu vào</th><th scope="col" class="num">Đọc đầu ra</th><th scope="col" class="num">Thay đổi</th><th scope="col">Kết quả</th>' +
      '<th scope="col" class="num">Viết</th><th scope="col">Vần cần luyện</th><th scope="col" class="num">Buổi luyện</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th scope="row"><a href="#/bao-cao/' + r.s.id + '">' + ui.esc(r.s.code) + '</a></th>' +
          '<td class="num">' + (r.a ? r.a.score + '/20' : '–') + '</td><td class="num">' + (r.b ? r.b.score + '/20' : '–') + '</td>' +
          '<td class="num">' + delta(r.t) + '</td><td>' + trendChip(r.t) + '</td>' +
          '<td class="num">' + (r.wa ? ui.pct(r.wa.ratio) : '–') + ' → ' + (r.wb ? ui.pct(r.wb.ratio) : '–') + '</td>' +
          '<td class="reading">' + ui.esc(r.sug.van) + '</td><td class="num">' + r.sessions + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted">Báo cáo liệt kê đủ cả em tiến bộ và em chưa tiến bộ. Kết quả trước, sau ở một lớp là bằng chứng ban đầu, chưa đủ để kết luận học liệu là nguyên nhân.</p></section>';

    var effort = '<section class="panel"><div class="panel-head"><h2 class="panel-title">Nhật ký công sức giáo viên</h2>' +
      '<button type="button" class="btn btn-sm" data-act="add-effort">' + ui.icon('plus') + 'Ghi thêm</button></div>' +
      (S.state.effort.length ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Ngày</th><th scope="col">Việc</th><th scope="col">Ghi chú</th><th scope="col" class="num">Phút</th></tr></thead><tbody>' +
        S.state.effort.slice().sort(function (a, b) { return b.date - a.date; }).map(function (e) {
          return '<tr><td class="tnum">' + ui.fmtDate(e.date) + '</td><td>' + ui.esc(e.tool) + '</td><td>' + ui.esc(e.note) + '</td><td class="num">' + e.minutes + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có ghi nhận.</p>') +
      '<p class="muted">Thời gian thực tế tính cả phần sửa nội dung AI. Được ghi tự động khi duyệt học liệu và lưu phiếu đọc.</p></section>';

    return stats + '<div class="two-col">' + '<section class="panel">' + prePostChart(null) + '</section>' + '<section class="panel">' + errorChart(null) + '</section></div>' + table + effort;
  }

  function studentView(sid) {
    var s = S.student(sid);
    if (!s) return ui.emptyState('Không tìm thấy học sinh', 'Học sinh này có thể đã bị xóa.', '<a class="btn" href="#/bao-cao">Về báo cáo cả lớp</a>');
    var a = S.latestTest(sid, 'dau-vao'), b = S.latestTest(sid, 'dau-ra');
    var t = trend(a, b);
    var sug = S.suggest(sid);
    var comp = S.state.comprehension.filter(function (c) { return c.studentId === sid; }).sort(function (x, y) { return y.date - x.date; });
    var prac = S.state.practice.filter(function (p) { return p.studentId === sid; }).sort(function (x, y) { return y.date - x.date; });
    var map = S.vanMap(sid);
    var mini = '<div class="mini-map">' + D.vansUpTo(S.state.classInfo.progress).map(function (v) {
      var c = map[v];
      return '<span class="mini-tile is-' + S.cellStatus(c) + '"><span class="reading">' + ui.esc(v) + '</span><span class="num">' + (c.read.total ? c.read.correct + '/' + c.read.total : '–') + '</span></span>';
    }).join('') + '</div>';

    return '<div class="stats">' +
      '<div class="stat"><p class="stat-label">Đọc đúng, bài đo A/B</p><p class="stat-value num">' + (a ? a.score : '–') + '<span class="stat-arrow">→</span>' + (b ? b.score : '–') + '<span class="stat-unit">/20</span></p><p class="stat-sub">' + trendChip(t) + '</p></div>' +
      '<div class="stat"><p class="stat-label">Gợi ý luyện tiếp</p><p class="stat-value reading">' + ui.esc(sug.van) + '</p><p class="stat-sub">' + ui.esc(D.label(D.LEVELS, sug.level)) + '</p></div>' +
      '<div class="stat"><p class="stat-label">Buổi luyện ở Góc luyện tập</p><p class="stat-value num">' + prac.length + '</p><p class="stat-sub">' + (prac[0] ? 'Gần nhất ' + ui.fmtDate(prac[0].date) + ', đúng ' + prac[0].correct + '/' + prac[0].total : 'Chưa luyện') + '</p></div>' +
      '</div>' +
      '<section class="panel"><h2 class="panel-title">Bản đồ âm vần</h2>' + mini + '<p class="muted">' + ui.esc(sug.reason) + '</p></section>' +
      '<div class="two-col"><section class="panel">' + prePostChart(sid) + '</section><section class="panel">' + errorChart(sid) + '</section></div>' +
      (VV.assess.writingHistoryHTML(sid) || '') +
      '<section class="panel"><h2 class="panel-title">Đọc hiểu</h2>' +
      (comp.length ? '<ul class="plain-list">' + comp.map(function (c) {
        return '<li><span class="num">' + ui.fmtDate(c.date) + '</span> ' + ui.esc(c.textTitle) + ': <b class="num">' + c.correct + '/' + c.total + '</b> câu đúng, ' + (c.support === 'tu-doc' ? 'em tự đọc' : 'được đọc hỗ trợ') + '.</li>';
      }).join('') + '</ul>' : '<p class="muted">Chưa ghi đọc hiểu.</p>') + '</section>';
  }

  var sid = null;
  function render(root, params) {
    sid = params[0] || null;
    var st = S.state;
    var head = sid
      ? '<nav class="crumbs" aria-label="Vị trí"><a href="#/bao-cao">Báo cáo tiến bộ</a><span aria-hidden="true">/</span><span aria-current="page">' + ui.esc(S.studentLabel(sid)) + '</span></nav>' +
        '<header class="page-head"><div><h1>Tiến bộ của ' + ui.esc(S.studentLabel(sid)) + '</h1><p class="lede">Đầu vào so với đầu ra, lỗi đọc, bài viết và đọc hiểu.</p></div>'
      : '<header class="page-head"><div><h1>Báo cáo tiến bộ</h1><p class="lede">Tổng hợp kết quả trước và sau khi dùng học liệu để giáo viên điều chỉnh việc dạy.</p></div>';
    head += '<div class="btn-row"><label class="field field-inline"><span class="sr-only">Xem báo cáo của</span><select data-role="pick" aria-label="Xem báo cáo của">' +
      '<option value="">Cả lớp</option>' + st.students.map(function (s) { return '<option value="' + s.id + '"' + (s.id === sid ? ' selected' : '') + '>' + ui.esc(s.code) + '</option>'; }).join('') + '</select></label>' +
      '<button type="button" class="btn" data-act="print">' + ui.icon('printer') + 'In báo cáo</button></div></header>';
    root.innerHTML = '<section class="page report">' + head +
      (st.isDemo ? '<div class="banner">Số liệu đang hiển thị là dữ liệu mẫu giả lập. Chỉ trình bày số liệu thu được thật khi báo cáo.</div>' : '') +
      '<div id="report-body">' + (st.students.length ? (sid ? studentView(sid) : classView()) : ui.emptyState('Chưa có dữ liệu', 'Thêm học sinh và ghi bài đo đầu vào để bắt đầu.', '<a class="btn btn-primary" href="#/cai-dat/lop">Thêm học sinh</a>')) + '</div>' +
      '</section>';
  }

  VV.views['bao-cao'] = {
    render: render,
    act: {
      print: function () {
        var body = document.getElementById('report-body').innerHTML;
        ui.printHTML('<h1 class="print-title">' + (sid ? 'Tiến bộ của ' + ui.esc(S.studentLabel(sid)) : 'Báo cáo tiến bộ ' + ui.esc(S.state.classInfo.name)) + '</h1><p class="print-meta">Ngày in: ' + ui.fmtDate(Date.now()) + '</p>' + body, 'Báo cáo tiến bộ');
      },
      csv: function () {
        var rows = [['Học sinh', 'Đọc đầu vào (/20)', 'Đọc đầu ra (/20)', 'Thay đổi', 'Kết quả', 'Viết đầu vào', 'Viết đầu ra', 'Vần cần luyện', 'Buổi luyện']];
        studentRows().forEach(function (r) {
          rows.push([r.s.code, r.a ? r.a.score : '', r.b ? r.b.score : '', r.t.delta == null ? '' : r.t.delta, r.t.label,
            r.wa ? Math.round(r.wa.ratio * 100) + '%' : '', r.wb ? Math.round(r.wb.ratio * 100) + '%' : '', r.sug.van, r.sessions]);
        });
        ui.download('bao-cao-tien-bo.csv', ui.csv(rows), 'text/csv;charset=utf-8');
      },
      'add-effort': function () {
        ui.openDialog('<form><h2 id="dialog-title" class="dialog-title">Ghi thời gian làm việc</h2>' +
          '<div class="field"><label for="ef-tool">Việc đã làm</label><input id="ef-tool" name="tool" required autocomplete="off" placeholder="Ví dụ: chấm vở…"></div>' +
          '<div class="field"><label for="ef-min">Số phút</label><input id="ef-min" name="minutes" type="number" inputmode="numeric" min="1" max="600" required class="input-short num"></div>' +
          '<div class="field"><label for="ef-note">Ghi chú <span class="optional">(không bắt buộc)</span></label><input id="ef-note" name="note" autocomplete="off"></div>' +
          '<div class="dialog-actions"><button type="button" class="btn" data-global="close-dialog">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form>',
          {
            onMount: function (dlg) {
              dlg.querySelector('form').onsubmit = function (e) {
                e.preventDefault();
                var f = e.target;
                S.commit(function (s) { s.effort.push({ id: S.uid('e'), date: Date.now(), tool: f.tool.value.trim(), minutes: Number(f.minutes.value), note: f.note.value.trim() }); });
                ui.closeDialog(); VV.app.refresh();
              };
            }
          });
      }
    },
    onchange: function (e) {
      if (e.target.getAttribute('data-role') === 'pick') VV.app.go('bao-cao' + (e.target.value ? '/' + e.target.value : ''));
    }
  };
})(window.VV = window.VV || {});
