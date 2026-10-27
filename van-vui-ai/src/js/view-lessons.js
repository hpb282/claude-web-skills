/* Bài học số: 10 nhóm vần, thẻ vần biết nói, luyện viết trên giấy ô li, in phiếu. */
(function (VV) {
  'use strict';
  var ui = VV.ui, D = VV.data, S = VV.store, V = VV.viet;

  function statusOf(g) {
    var p = S.state.classInfo.progress;
    if (g.id < p) return { id: 'da-hoc', label: 'Đã học' };
    if (g.id === p) return { id: 'dang-hoc', label: 'Đang học' };
    return { id: 'chua-hoc', label: 'Chưa học' };
  }

  function renderIndex(root) {
    root.innerHTML = '<section class="page"><header class="page-head"><div><h1>Bài học số</h1>' +
      '<p class="lede">10 nhóm vần theo tiến độ lớp. Mỗi bài có đọc mẫu, thẻ ghép tiếng, câu ngắn và phiếu luyện viết trên giấy ô li.</p></div></header>' +
      '<ol class="lesson-grid">' + D.GROUPS.map(function (g) {
        var st = statusOf(g);
        return '<li><a class="lesson-card is-' + st.id + '" href="#/bai-hoc/' + g.id + '">' +
          '<span class="lesson-num">Nhóm ' + g.id + '</span>' +
          '<span class="lesson-vans reading">' + g.vans.map(ui.esc).join('<span class="sep">,</span> ') + '</span>' +
          '<span class="lesson-status">' + st.label + '</span></a></li>';
      }).join('') + '</ol></section>';
  }

  // Địa chỉ mở thẻ khi quét mã QR (cần đăng file lên web và nhập địa chỉ trong Cài đặt).
  function cardUrl(word) {
    var base = (S.state.classInfo.siteUrl || '').trim();
    if (!base) return '';
    return base.replace(/#.*$/, '') + '#/the/' + encodeURIComponent(word);
  }
  function qrHTML(word) {
    var url = cardUrl(word);
    if (!url) return '';
    try { return '<span class="card-qr">' + VV.qr.svg(url, { label: 'Mã QR mở thẻ ' + word }) + '</span>'; }
    catch (e) { return ''; }
  }

  function cardHTML(word, van, withQr) {
    var p = V.parse(word);
    var flat = V.compose(p.initial, p.van, 'ngang');
    var step = p.tone === 'ngang'
      ? 'Đọc “' + flat + '”, rồi viết vào vở.'
      : 'Đọc “' + flat + '”. Thêm ' + V.TONE_NAME[p.tone] + ' thành “' + word + '”, rồi viết vào vở.';
    return '<article class="van-card">' +
      '<p class="van-card-sum reading">' + (p.initial ? '<span>' + ui.esc(p.initial) + '</span><span class="plus">+</span>' : '') +
      '<span class="hl-van">' + ui.esc(van) + '</span></p>' +
      '<p class="van-card-word reading">' + ui.vanWord(word, van) + '</p>' +
      '<p class="van-card-step">' + ui.esc(step) + '</p>' +
      (withQr ? qrHTML(word) : '') +
      '<div class="btn-row">' + ui.speakBtn(flat, 'Nghe “' + flat + '”') + ui.speakBtn(word, 'Nghe “' + word + '”', 'btn-icon-strong') +
      '<button type="button" class="btn btn-sm btn-ghost" data-act="open-card" data-word="' + ui.esc(word) + '">' + ui.icon('expand') + 'Mở thẻ</button></div></article>';
  }

  function countWords(g) { return g.vans.reduce(function (n, v) { return n + g.words[v].length; }, 0); }

  function renderLesson(root, id) {
    var g = D.GROUPS[id - 1];
    if (!g) { renderIndex(root); return; }
    var st = statusOf(g);
    var prev = D.GROUPS[id - 2], next = D.GROUPS[id];
    var writeChoices = g.vans.concat(g.vans.map(function (v) { return g.words[v][0]; }), g.phrases.slice(0, 3));

    root.innerHTML = '<section class="page lesson">' +
      '<nav class="crumbs" aria-label="Vị trí"><a href="#/bai-hoc">Bài học số</a><span aria-hidden="true">/</span><span aria-current="page">Nhóm ' + g.id + '</span></nav>' +
      '<header class="page-head"><div><h1>Nhóm ' + g.id + ': <span class="reading">' + ui.esc(g.title) + '</span></h1>' +
      '<p class="lede">' + st.label + '. ' + g.vans.length + ' vần, ' + countWords(g) + ' tiếng, ' + g.phrases.length + ' từ ngữ và ' + g.sentences.length + ' câu.</p></div>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="practice">' + ui.icon('play') + 'Cho học sinh luyện</button>' +
      (g.id !== S.state.classInfo.progress ? '<button type="button" class="btn" data-act="set-progress">Đặt làm bài đang học</button>' : '') +
      '<button type="button" class="btn" data-act="print-cards">' + ui.icon('printer') + 'In thẻ vần</button>' +
      '<button type="button" class="btn" data-act="print-sheet">' + ui.icon('printer') + 'In phiếu luyện viết</button></div></header>' +
      (ui.canSpeak() ? '' : '<div class="banner banner-soft">Máy này chưa có giọng đọc tiếng Việt nên nút nghe sẽ không phát âm. Giáo viên đọc mẫu trực tiếp, hoặc cài giọng tiếng Việt cho hệ điều hành rồi mở lại trang.</div>') +

      '<section class="panel"><h2 class="panel-title">Vần</h2><div class="van-row">' +
      g.vans.map(function (v) {
        var letters = v.split('');
        return '<div class="van-big"><span class="van-big-glyph reading">' + ui.esc(v) + '</span>' +
          '<span class="van-big-parts">' + letters.map(ui.esc).join(' + ') + '</span>' + ui.speakBtn(v, 'Nghe vần ' + v) + '</div>';
      }).join('') + '</div></section>' +

      '<section class="panel"><h2 class="panel-title">Tiếng</h2>' +
      g.vans.map(function (v) {
        return '<div class="word-row"><span class="word-row-van reading">' + ui.esc(v) + '</span><ul class="chips">' +
          g.words[v].map(function (w) { return '<li><button type="button" class="chip reading" data-speak="' + ui.esc(w) + '" aria-label="Nghe tiếng ' + ui.esc(w) + '">' + ui.vanWord(w, v) + '</button></li>'; }).join('') +
          '</ul></div>';
      }).join('') + '</section>' +

      '<section class="panel"><h2 class="panel-title">Thẻ vần biết nói</h2>' +
      '<p class="muted">Ghép âm đầu với vần, đọc tiếng không dấu, thêm dấu thanh rồi viết. Bản in có đủ ' + countWords(g) + ' thẻ' +
      (S.state.classInfo.siteUrl ? ', mỗi thẻ có mã QR mở bài nghe trên điện thoại.' : '. <a href="#/cai-dat/qr">Nhập địa chỉ web</a> để in thẻ có mã QR.') + '</p>' +
      '<div class="card-grid">' + g.vans.map(function (v) { return cardHTML(g.words[v][0], v) + cardHTML(g.words[v][1], v); }).join('') + '</div></section>' +

      '<div class="two-col">' +
      '<section class="panel"><h2 class="panel-title">Từ ngữ</h2><ul class="phrase-list">' +
      g.phrases.map(function (ph) { return '<li><span class="reading">' + ui.vanText(ph, g.vans) + '</span>' + ui.speakBtn(ph) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="panel"><h2 class="panel-title">Câu</h2><ul class="phrase-list sentences">' +
      g.sentences.map(function (s) { return '<li><span class="reading">' + ui.vanText(s, g.vans) + '</span>' + ui.speakBtn(s) + '</li>'; }).join('') + '</ul></section>' +
      '</div>' +

      '<section class="panel"><h2 class="panel-title">Luyện viết trên ô li</h2>' +
      '<div class="write-tools"><div class="field field-inline"><label for="w-model">Chữ mẫu</label><select id="w-model">' +
      writeChoices.map(function (c) { return '<option>' + ui.esc(c) + '</option>'; }).join('') + '</select></div>' +
      '<label class="switch"><input type="checkbox" id="w-ghost" checked><span>Hiện chữ mẫu mờ</span></label>' +
      '<button type="button" class="btn" data-act="clear-canvas">' + ui.icon('refresh') + 'Viết lại</button></div>' +
      '<div class="canvas-wrap"><canvas id="write-canvas" aria-label="Khung viết ô li. Dùng ngón tay, bút cảm ứng hoặc chuột để viết theo chữ mẫu."></canvas></div>' +
      '<p class="muted">Chữ mẫu dùng kiểu chữ in Andika giúp nhận diện mặt chữ. Khi chấm hình chữ viết tay, giáo viên dựa vào mẫu chữ trong vở tập viết của lớp.</p></section>' +

      '<nav class="pager" aria-label="Chuyển bài">' +
      (prev ? '<a class="btn btn-ghost" href="#/bai-hoc/' + prev.id + '">' + ui.icon('arrowLeft') + 'Nhóm ' + prev.id + '</a>' : '<span></span>') +
      (next ? '<a class="btn btn-ghost" href="#/bai-hoc/' + next.id + '">Nhóm ' + next.id + ui.icon('arrowRight') + '</a>' : '<span></span>') +
      '</nav></section>';

    setupCanvas(root);
  }

  // ---------- Khung viết ô li ----------
  var pad = null;
  var resizeObs = null;
  function setupCanvas(root) {
    var canvas = root.querySelector('#write-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var strokes = [];
    var drawing = null;
    var CELL = 12; // một ô li (px CSS)

    function size() {
      var w = canvas.parentNode.clientWidth;
      var h = CELL * (4 * 3 + 4); // 3 dòng viết, chừa 2 ô trên và dưới
      var dpr = window.devicePixelRatio || 1;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    }
    function cssVar(n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; }
    function paint() {
      if (!canvas.isConnected) return;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cssVar('--surface', '#fffdf8'); ctx.fillRect(0, 0, w, h);
      var faint = cssVar('--oli', '#cfc8e8'), strong = cssVar('--oli-strong', '#9c92cc');
      // Dòng kẻ đậm là đường chân chữ, cách nhau 4 ô li như vở học sinh.
      for (var y = CELL; y < h; y += CELL) {
        var main = (y / CELL) % 4 === 2;
        ctx.strokeStyle = main ? strong : faint;
        ctx.lineWidth = main ? 1.4 : 0.8;
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
      }
      ctx.strokeStyle = faint; ctx.lineWidth = 0.8;
      for (var x = CELL * 4; x < w; x += CELL * 4) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
      var model = root.querySelector('#w-model').value;
      if (root.querySelector('#w-ghost').checked) {
        ctx.fillStyle = 'rgba(27,61,53,0.16)';
        // Chữ thường cao khoảng 2 ô li tính từ đường chân chữ.
        ctx.font = (CELL * 4.2) + 'px Andika, "Be Vietnam Pro", sans-serif';
        ctx.textBaseline = 'alphabetic';
        for (var line = 0; line < 3; line++) {
          var baseY = CELL * (4 * line + 6);
          var text = model;
          var tw = ctx.measureText(text + '   ').width;
          for (var xx = CELL * 2; xx + tw * 0.6 < w; xx += tw) ctx.fillText(text, xx, baseY);
        }
      }
      ctx.strokeStyle = cssVar('--ink', '#1b3d35'); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.concat(drawing ? [drawing] : []).forEach(function (s) {
        ctx.beginPath();
        s.forEach(function (pt, i) { if (i) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); });
        ctx.stroke();
      });
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    canvas.addEventListener('pointerdown', function (e) { canvas.setPointerCapture(e.pointerId); drawing = [pos(e)]; paint(); });
    canvas.addEventListener('pointermove', function (e) { if (!drawing) return; drawing.push(pos(e)); paint(); });
    function end() { if (drawing) { strokes.push(drawing); drawing = null; } }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    root.querySelector('#w-model').addEventListener('change', paint);
    root.querySelector('#w-ghost').addEventListener('change', paint);
    pad = { clear: function () { strokes = []; paint(); } };
    if (resizeObs) resizeObs.disconnect();
    resizeObs = new ResizeObserver(function () { size(); });
    resizeObs.observe(canvas.parentNode);
    size();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
  }

  // ---------- In ấn ----------
  function printCards(g) {
    var cards = [];
    g.vans.forEach(function (v) { g.words[v].forEach(function (w) { cards.push(cardHTML(w, v, true)); }); });
    ui.printHTML('<h1 class="print-title">Thẻ vần nhóm ' + g.id + ': ' + ui.esc(g.title) + '</h1><div class="print-cards">' + cards.join('') + '</div>', 'Thẻ vần nhóm ' + g.id);
  }

  function oliRows(rows) {
    var out = '';
    for (var i = 0; i < rows; i++) out += '<div class="oli-line"></div>';
    return out;
  }
  function writingSheetHTML(title, items, guide) {
    return '<h1 class="print-title">' + ui.esc(title) + '</h1>' +
      '<p class="print-meta">Họ tên hoặc mã học sinh: ........................ Ngày: ..../..../........</p>' +
      (guide && guide.length ? '<ol class="print-guide">' + guide.map(function (gd) { return '<li>' + ui.esc(gd) + '</li>'; }).join('') + '</ol>' : '') +
      items.map(function (t) { return '<section class="print-write"><div class="oli-line is-model"><span class="reading">' + ui.esc(t) + '</span></div>' + oliRows(2) + '</section>'; }).join('');
  }
  function printSheet(g) {
    var items = g.vans.concat(g.vans.map(function (v) { return g.words[v][0]; }), g.phrases.slice(0, 2));
    ui.printHTML(writingSheetHTML('Phiếu luyện viết nhóm ' + g.id + ': ' + g.title, items, ['Viết vần trước, rồi viết tiếng.', 'Mỗi chữ mẫu viết hai dòng.']), 'Phiếu luyện viết nhóm ' + g.id);
  }

  var current = 1;
  VV.views['bai-hoc'] = {
    render: function (root, params) {
      if (params[0]) { current = Number(params[0]) || 1; renderLesson(root, current); }
      else renderIndex(root);
    },
    act: {
      practice: function () {
        var g = D.GROUPS[current - 1];
        VV.studentMode.open({ vans: g.vans, van: g.vans[0], level: 'tu-lam' });
      },
      'print-cards': function () { printCards(D.GROUPS[current - 1]); },
      'print-sheet': function () { printSheet(D.GROUPS[current - 1]); },
      'clear-canvas': function () { if (pad) pad.clear(); },
      'open-card': function (el) { VV.studentMode.openCard(el.getAttribute('data-word')); },
      'set-progress': function () {
        S.commit(function (s) { s.classInfo.progress = current; });
        ui.toast('Lớp đang học nhóm ' + current + '. Kho tiếng và gợi ý đã cập nhật.');
        VV.app.refresh();
      }
    }
  };
  VV.lessons = { writingSheetHTML: writingSheetHTML, cardHTML: cardHTML };
})(window.VV = window.VV || {});
