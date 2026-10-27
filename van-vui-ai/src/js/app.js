/* Khung ứng dụng: điều hướng, thanh bên, phân phối sự kiện cho từng màn hình. */
(function (VV) {
  'use strict';
  var ui = VV.ui;
  VV.views = VV.views || {};

  var NAV = [
    { route: 'ban-do', label: 'Bản đồ âm vần', icon: 'map' },
    { route: 'bai-hoc', label: 'Bài học số', icon: 'book' },
    { route: 'tro-choi', label: 'Trò chơi', icon: 'puzzle' },
    { route: 'tro-ly', label: 'Trợ lý soạn bài', icon: 'pen' },
    { route: 'danh-gia', label: 'Đánh giá', icon: 'clipboard' },
    { route: 'bao-cao', label: 'Báo cáo tiến bộ', icon: 'chart' },
    { route: 'cai-dat', label: 'Cài đặt', icon: 'gear' }
  ];

  var current = { route: null, params: [], view: null };
  var main;

  function parseHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    var route = parts[0] || 'ban-do';
    if (!VV.views[route]) route = 'ban-do';
    return { route: route, params: parts.slice(1) };
  }

  function go(path) {
    var target = '#/' + path;
    if (location.hash === target) render(); else location.hash = target;
  }

  function aiStatusHTML() {
    var ready = VV.ai.isReady();
    var c = VV.ai.cfg();
    var name = VV.ai.PROVIDERS[c.provider] ? VV.ai.PROVIDERS[c.provider].label : c.provider;
    return '<a class="ai-status ' + (ready ? 'is-ready' : '') + '" href="#/cai-dat/ai">' +
      '<span class="ai-dot" aria-hidden="true"></span>' +
      '<span><span class="ai-status-title">' + (ready ? 'AI đã kết nối' : 'AI chưa kết nối') + '</span>' +
      '<span class="ai-status-sub">' + (ready ? ui.esc(name) : 'Nhập API key trong Cài đặt') + '</span></span></a>';
  }

  function renderNav() {
    var nav = document.getElementById('nav');
    var st = VV.store.state;
    nav.innerHTML =
      '<div class="brand"><span class="brand-name" translate="no">Vần vui <span class="brand-ai">AI</span></span>' +
      '<span class="brand-class">' + ui.esc(st.classInfo.name) + '</span></div>' +
      '<nav aria-label="Chức năng chính"><ul class="nav-list">' +
      NAV.map(function (n) {
        var active = current.route === n.route;
        return '<li><a class="nav-link' + (active ? ' is-active' : '') + '" href="#/' + n.route + '"' + (active ? ' aria-current="page"' : '') + '>' +
          ui.icon(n.icon) + '<span>' + ui.esc(n.label) + '</span></a></li>';
      }).join('') +
      '</ul></nav>' +
      '<button type="button" class="btn btn-student" data-global="student">' + ui.icon('play') + '<span>Mở góc luyện tập</span></button>' +
      aiStatusHTML();
  }

  function render() {
    var h = parseHash();
    var view = VV.views[h.route];
    var changedRoute = current.route !== h.route;
    current = { route: h.route, params: h.params, view: view };
    document.body.classList.remove('nav-open');
    renderNav();
    var titles = NAV.filter(function (n) { return n.route === h.route; });
    document.title = (titles[0] ? titles[0].label + ' | ' : '') + 'Vần vui AI';
    main.innerHTML = '';
    view.render(main, h.params);
    if (changedRoute) {
      window.scrollTo(0, 0);
      var h1 = main.querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
  }

  // Vẽ lại màn hình hiện tại mà vẫn giữ vị trí cuộn.
  function refresh() {
    current.params = parseHash().params;
    var y = window.scrollY;
    var active = document.activeElement && document.activeElement.id;
    renderNav();
    main.innerHTML = '';
    current.view.render(main, current.params);
    window.scrollTo(0, y);
    if (active) { var el = document.getElementById(active); if (el) el.focus({ preventScroll: true }); }
  }

  function dispatch(type, e) {
    var v = current.view;
    if (!v) return;
    var handlerMap = type === 'click' ? v.act : v['on' + type];
    if (type === 'click') {
      var el = e.target.closest('[data-act]');
      if (el && main.contains(el) && handlerMap && handlerMap[el.getAttribute('data-act')]) {
        handlerMap[el.getAttribute('data-act')](el, e);
      }
    } else if (typeof handlerMap === 'function') {
      handlerMap(e);
    }
  }

  function init() {
    VV.store.load();
    main = document.getElementById('main');
    ['click'].forEach(function (t) { main.addEventListener(t, function (e) { dispatch('click', e); }); });
    main.addEventListener('change', function (e) { dispatch('change', e); });
    main.addEventListener('input', function (e) { dispatch('input', e); });
    main.addEventListener('submit', function (e) { dispatch('submit', e); });

    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-global]');
      if (!g) return;
      var what = g.getAttribute('data-global');
      if (what === 'student') VV.studentMode.open({});
      if (what === 'menu') {
        var open = document.body.classList.toggle('nav-open');
        var mb = document.querySelector('.topbar [data-global="menu"]');
        if (mb) { mb.setAttribute('aria-expanded', open); mb.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu'); }
      }
      if (what === 'close-dialog') ui.closeDialog();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) document.body.classList.remove('nav-open');
      var v = current.view;
      if (v && v.onkey && !document.getElementById('student-mode').classList.contains('is-open')) v.onkey(e);
    });
    window.addEventListener('hashchange', render);
    // Cảnh báo khi rời trang mà phiếu đang chấm hoặc bản nháp chưa duyệt.
    window.addEventListener('beforeunload', function (e) {
      var dirty = (VV.assess && VV.assess.isDirty()) || (VV.assistant && VV.assistant.isDirty());
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
    var dlg = document.getElementById('dialog');
    dlg.addEventListener('close', function () { dlg.innerHTML = ''; });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) ui.closeDialog(); });

    if (VV.store.saveFailed) ui.toast('Trình duyệt đang chặn lưu dữ liệu. Kết quả sẽ mất khi đóng trang.', 'error');
    render();
  }

  VV.app = { go: go, render: render, refresh: refresh, renderNav: renderNav, get route() { return current.route; } };
  document.addEventListener('DOMContentLoaded', init);
})(window.VV = window.VV || {});
