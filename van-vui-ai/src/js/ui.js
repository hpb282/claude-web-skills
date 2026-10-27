/* Hàm giao diện dùng chung. */
(function (VV) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Bộ icon nét (24px, stroke 1.75), vẽ tay theo phong cách Lucide.
  var ICONS = {
    map: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M2 4.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z"/><path d="M22 4.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z"/>',
    puzzle: '<path d="M19.4 14.4a2.4 2.4 0 1 0 0-4.8H18V6a1 1 0 0 0-1-1h-3.6V3.6a2.4 2.4 0 1 0-4.8 0V5H5a1 1 0 0 0-1 1v3.6h1.4a2.4 2.4 0 1 1 0 4.8H4V18a1 1 0 0 0 1 1h3.6v-1.4a2.4 2.4 0 1 1 4.8 0V19H17a1 1 0 0 0 1-1v-3.6z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17V11"/><path d="M13 17V7"/><path d="M18 17v-4"/>',
    gear: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    printer: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8" rx="1"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.1"/><path d="M6.6 6.6A17.5 17.5 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
    alert: '<path d="M12 3 2 21h20z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  // ---------- Thông báo ----------
  function toast(msg, kind) {
    var region = document.getElementById('toast-region');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast-' + kind : '');
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.textContent = msg;
    region.appendChild(el);
    while (region.children.length > 2) region.removeChild(region.firstChild);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 200);
    }, kind === 'error' ? 6000 : 3200);
  }

  // ---------- Hộp thoại ----------
  var lastFocus = null;
  function openDialog(html, opts) {
    opts = opts || {};
    var dlg = document.getElementById('dialog');
    lastFocus = document.activeElement;
    dlg.className = 'dialog' + (opts.wide ? ' dialog-wide' : '');
    dlg.innerHTML = '<div class="dialog-inner">' + html + '</div>';
    dlg.setAttribute('aria-labelledby', 'dialog-title');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    var first = dlg.querySelector('[autofocus]') || dlg.querySelector('input, select, textarea, button');
    if (first) first.focus();
    if (opts.onMount) opts.onMount(dlg);
    return dlg;
  }
  function closeDialog() {
    var dlg = document.getElementById('dialog');
    if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
    dlg.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function confirmDialog(message, okLabel, danger) {
    return new Promise(function (resolve) {
      openDialog(
        '<h2 id="dialog-title" class="dialog-title">' + esc(message.title || 'Xác nhận') + '</h2>' +
        '<p>' + esc(message.body || message) + '</p>' +
        '<div class="dialog-actions">' +
        '<button type="button" class="btn" data-dlg="cancel">Hủy</button>' +
        '<button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-dlg="ok" autofocus>' + esc(okLabel || 'Đồng ý') + '</button>' +
        '</div>',
        {
          onMount: function (dlg) {
            dlg.onclick = function (e) {
              var b = e.target.closest('[data-dlg]');
              if (!b) return;
              closeDialog(); resolve(b.getAttribute('data-dlg') === 'ok');
            };
            dlg.oncancel = function () { resolve(false); };
          }
        }
      );
    });
  }

  // ---------- Giọng đọc ----------
  var viVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var pref = VV.store && VV.store.settings && VV.store.settings.voice.name;
    var vi = voices.filter(function (v) { return /^vi/i.test(v.lang); });
    viVoice = vi.filter(function (v) { return v.name === pref; })[0] || vi[0] || null;
    return viVoice;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = function () { pickVoice(); document.dispatchEvent(new Event('vv-voices')); };
  }
  function viVoices() {
    if (!('speechSynthesis' in window)) return [];
    return (window.speechSynthesis.getVoices() || []).filter(function (v) { return /^vi/i.test(v.lang); });
  }
  function canSpeak() { return !!pickVoice(); }
  function speak(text) {
    if (!('speechSynthesis' in window)) { toast('Trình duyệt này không có chức năng đọc.', 'error'); return; }
    var v = pickVoice();
    if (!v) { toast('Máy chưa có giọng đọc tiếng Việt. Giáo viên đọc mẫu giúp em nhé.', 'error'); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang;
    u.rate = (VV.store.settings.voice.rate || 0.85);
    window.speechSynthesis.speak(u);
  }
  function speakBtn(text, label, cls) {
    return '<button type="button" class="btn-icon ' + (cls || '') + '" data-speak="' + esc(text) + '" aria-label="' + esc(label || ('Nghe: ' + text)) + '" title="' + esc(label || 'Nghe đọc mẫu') + '">' + icon('volume') + '</button>';
  }

  // ---------- Chữ: tô vần, kiểm tra kho ----------
  function vanWord(word, van) {
    var parts = VV.viet.splitForHighlight(word);
    var p = VV.viet.parse(word);
    if (!p || (van && p.van !== van)) return esc(word);
    return esc(parts[0]) + '<span class="hl-van">' + esc(parts[1]) + '</span>';
  }
  // Tô các tiếng mang vần trong danh sách vans.
  function vanText(text, vans) {
    return VV.viet.tokenize(text).map(function (t) {
      if (!t.isWord) return esc(t.text);
      var p = VV.viet.parse(t.text);
      if (p && vans.indexOf(p.van) !== -1) return vanWord(t.text, p.van);
      return esc(t.text);
    }).join('');
  }
  // Đánh dấu tiếng ngoài kho.
  function khoText(text) {
    var r = VV.viet.checkText(text, VV.store.kho());
    var html = r.tokens.map(function (t) {
      if (!t.isWord) return esc(t.text);
      if (t.ok) return esc(t.text);
      return '<mark class="ngoai-kho" title="Chưa có trong kho tiếng">' + esc(t.text) + '</mark>';
    }).join('');
    return { html: html, outside: r.outside };
  }

  // ---------- Tiện ích ----------
  var DATE_FMT = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  var SHORT_FMT = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
  var PCT_FMT = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 0 });
  var DEC_FMT = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
  function fmtDate(ts) { return DATE_FMT.format(new Date(ts)); }
  function fmtShort(ts) { return SHORT_FMT.format(new Date(ts)); }
  function pct(r) { return r == null ? '–' : PCT_FMT.format(r); }
  function dec(n) { return n == null ? '–' : DEC_FMT.format(n); }

  function download(filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(rows) {
    return '﻿' + rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c == null ? '' : c);
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\n');
  }

  function printHTML(html, title) {
    var root = document.getElementById('print-root');
    root.innerHTML = '<div class="print-doc"><header class="print-head"><span class="print-brand">Vần vui AI</span><span>' + esc(title || '') + '</span></header>' + html + '</div>';
    var prevTitle = document.title;
    if (title) document.title = title;
    document.body.classList.add('is-printing');
    setTimeout(function () {
      window.print();
      document.body.classList.remove('is-printing');
      document.title = prevTitle;
    }, 60);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('Đã sao chép.'); }, function () { toast('Không sao chép được. Hãy bôi đen và sao chép thủ công.', 'error'); });
    }
    toast('Không sao chép được. Hãy bôi đen và sao chép thủ công.', 'error');
    return Promise.resolve();
  }

  // Ảnh bài viết: thu nhỏ để không làm đầy bộ nhớ trình duyệt.
  function readImage(file, maxSide) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Chỉ nhận tệp ảnh.')); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, (maxSide || 900) / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve({ url: c.toDataURL('image/jpeg', 0.62), w: c.width, h: c.height });
        };
        img.onerror = function () { reject(new Error('Không đọc được ảnh.')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('Không đọc được tệp.')); };
      reader.readAsDataURL(file);
    });
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Thanh lựa chọn dạng nút (radiogroup).
  function segmented(name, options, value, label) {
    return '<div class="segmented" role="radiogroup" aria-label="' + esc(label) + '">' +
      options.map(function (o) {
        var id = name + '-' + o.id;
        return '<input type="radio" id="' + esc(id) + '" name="' + esc(name) + '" value="' + esc(o.id) + '"' + (o.id === value ? ' checked' : '') + '>' +
          '<label for="' + esc(id) + '">' + esc(o.label) + '</label>';
      }).join('') + '</div>';
  }

  function studentOptions(selected, includeNone) {
    var st = VV.store.state.students;
    return (includeNone ? '<option value="">' + esc(includeNone) + '</option>' : '') +
      st.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === selected ? ' selected' : '') + '>' + esc(s.code) + (s.note ? ' (' + esc(s.note) + ')' : '') + '</option>'; }).join('');
  }

  function emptyState(title, body, actionHtml) {
    return '<div class="empty"><p class="empty-title">' + esc(title) + '</p>' + (body ? '<p>' + esc(body) + '</p>' : '') + (actionHtml || '') + '</div>';
  }

  // Một lần bấm vào nút nghe ở bất kỳ đâu.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-speak]');
    if (b) { e.preventDefault(); speak(b.getAttribute('data-speak')); }
  });

  VV.ui = {
    esc: esc, icon: icon, toast: toast, openDialog: openDialog, closeDialog: closeDialog, confirmDialog: confirmDialog,
    speak: speak, speakBtn: speakBtn, canSpeak: canSpeak, viVoices: viVoices,
    vanWord: vanWord, vanText: vanText, khoText: khoText,
    fmtDate: fmtDate, fmtShort: fmtShort, pct: pct, dec: dec, download: download, csv: csv, printHTML: printHTML, copyText: copyText,
    readImage: readImage, reducedMotion: reducedMotion, segmented: segmented, studentOptions: studentOptions, emptyState: emptyState
  };
})(window.VV = window.VV || {});
