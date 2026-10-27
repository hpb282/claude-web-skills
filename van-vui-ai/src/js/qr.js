/* Tạo mã QR (chế độ byte, mức sửa lỗi M, phiên bản 1 đến 10) không cần thư viện ngoài, chạy được khi mất mạng. */
(function (VV) {
  'use strict';

  // Số mã sửa lỗi mỗi khối và cấu trúc khối dữ liệu cho mức M.
  var EC_M = {
    1: [10, [[1, 16]]], 2: [16, [[1, 28]]], 3: [26, [[1, 44]]], 4: [18, [[2, 32]]], 5: [24, [[2, 43]]],
    6: [16, [[4, 27]]], 7: [18, [[4, 31]]], 8: [22, [[2, 38], [2, 39]]], 9: [22, [[3, 36], [2, 37]]], 10: [26, [[4, 43], [1, 44]]]
  };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  var REMAINDER = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0 };

  // Trường Galois GF(256).
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function genPoly(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var ng = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); }
      g = ng;
    }
    return g;
  }
  function rsEncode(data, n) {
    var g = genPoly(n);
    var res = new Array(n).fill(0);
    for (var i = 0; i < data.length; i++) {
      var f = data[i] ^ res[0];
      res.shift(); res.push(0);
      for (var j = 0; j < n; j++) res[j] ^= mul(g[j + 1], f);
    }
    return res;
  }

  function utf8(text) {
    if (window.TextEncoder) return Array.from(new TextEncoder().encode(text));
    var s = unescape(encodeURIComponent(text)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function dataCapacity(v) {
    var n = 0;
    EC_M[v][1].forEach(function (g) { n += g[0] * g[1]; });
    return n;
  }

  function buildCodewords(bytes, v) {
    var bits = [];
    function push(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    push(4, 4);
    push(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(function (b) { push(b, 8); });
    var capBits = dataCapacity(v) * 8;
    push(0, Math.min(4, capBits - bits.length));
    while (bits.length % 8) bits.push(0);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      data.push(b);
    }
    for (var pad = 0xEC; data.length < dataCapacity(v); pad ^= 0xEC ^ 0x11) data.push(pad);

    // Chia khối, tính mã sửa lỗi, xen kẽ.
    var ecLen = EC_M[v][0];
    var blocks = [], off = 0;
    EC_M[v][1].forEach(function (g) {
      for (var c = 0; c < g[0]; c++) { var d = data.slice(off, off + g[1]); off += g[1]; blocks.push({ d: d, e: rsEncode(d, ecLen) }); }
    });
    var out = [];
    var maxD = Math.max.apply(null, blocks.map(function (b) { return b.d.length; }));
    for (i = 0; i < maxD; i++) blocks.forEach(function (b) { if (i < b.d.length) out.push(b.d[i]); });
    for (i = 0; i < ecLen; i++) blocks.forEach(function (b) { out.push(b.e[i]); });
    return out;
  }

  function makeMatrix(codewords, v) {
    var size = 17 + 4 * v;
    var mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, yy, dark) { mod[yy][x] = dark; fn[yy][x] = true; }

    for (var i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var xx = c[0] + dx, yy = c[1] + dy;
        if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        set(xx, yy, dist !== 2 && dist !== 4);
      }
    });
    var al = ALIGN[v], last = al.length - 1;
    for (i = 0; i < al.length; i++) for (var j = 0; j < al.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) set(al[i] + ax, al[j] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1);
    }
    drawFormat(0);
    if (v >= 7) {
      var rem = v;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (v << 12) | rem;
      for (i = 0; i < 18; i++) {
        var bt = ((vb >>> i) & 1) === 1;
        var a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, bt); set(b, a, bt);
      }
    }

    function drawFormat(mask) {
      var data = (0 << 3) | mask; // mức M = 00
      var r = data;
      for (var k = 0; k < 10; k++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bits = ((data << 10) | r) ^ 0x5412;
      function bit(n) { return ((bits >>> n) & 1) === 1; }
      for (k = 0; k <= 5; k++) set(8, k, bit(k));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (k = 9; k < 15; k++) set(14 - k, 8, bit(k));
      for (k = 0; k < 8; k++) set(size - 1 - k, 8, bit(k));
      for (k = 8; k < 15; k++) set(8, size - 15 + k, bit(k));
      set(8, size - 8, true);
    }

    // Đặt dữ liệu theo đường zíc zắc.
    var bitsArr = [];
    codewords.forEach(function (cw) { for (var k = 7; k >= 0; k--) bitsArr.push((cw >>> k) & 1); });
    for (i = 0; i < REMAINDER[v]; i++) bitsArr.push(0);
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var x = right - jj;
          var upward = ((right + 1) & 2) === 0;
          var yy2 = upward ? size - 1 - vert : vert;
          if (!fn[yy2][x]) { mod[yy2][x] = bi < bitsArr.length ? bitsArr[bi] === 1 : false; bi++; }
        }
      }
    }

    // Chọn mặt nạ có điểm phạt thấp nhất.
    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; },
      function (x, y) { return y % 2 === 0; },
      function (x) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
      function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
    ];
    function applyMask(m) {
      for (var yy3 = 0; yy3 < size; yy3++) for (var x3 = 0; x3 < size; x3++) if (!fn[yy3][x3] && MASKS[m](x3, yy3)) mod[yy3][x3] = !mod[yy3][x3];
    }
    function penalty() {
      var p = 0, dark = 0, yy4, x4, run, k;
      for (yy4 = 0; yy4 < size; yy4++) {
        run = 1;
        for (x4 = 1; x4 < size; x4++) {
          if (mod[yy4][x4] === mod[yy4][x4 - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
      for (x4 = 0; x4 < size; x4++) {
        run = 1;
        for (yy4 = 1; yy4 < size; yy4++) {
          if (mod[yy4][x4] === mod[yy4 - 1][x4]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
      for (yy4 = 0; yy4 < size - 1; yy4++) for (x4 = 0; x4 < size - 1; x4++) {
        var c = mod[yy4][x4];
        if (c === mod[yy4][x4 + 1] && c === mod[yy4 + 1][x4] && c === mod[yy4 + 1][x4 + 1]) p += 3;
      }
      var pat1 = [true, false, true, true, true, false, true, false, false, false, false];
      var pat2 = pat1.slice().reverse();
      for (yy4 = 0; yy4 < size; yy4++) for (x4 = 0; x4 <= size - 11; x4++) {
        var h1 = true, h2 = true, v1 = true, v2 = true;
        for (k = 0; k < 11; k++) {
          if (mod[yy4][x4 + k] !== pat1[k]) h1 = false;
          if (mod[yy4][x4 + k] !== pat2[k]) h2 = false;
          if (mod[x4 + k][yy4] !== pat1[k]) v1 = false;
          if (mod[x4 + k][yy4] !== pat2[k]) v2 = false;
        }
        p += 40 * (h1 + h2 + v1 + v2);
      }
      for (yy4 = 0; yy4 < size; yy4++) for (x4 = 0; x4 < size; x4++) if (mod[yy4][x4]) dark++;
      p += 10 * Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size));
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      var pen = penalty();
      if (pen < bestP) { bestP = pen; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);
    return mod;
  }

  // Trả về ma trận các ô (true là ô tối). Ném lỗi nếu nội dung quá dài.
  function encode(text) {
    var bytes = utf8(text);
    for (var v = 1; v <= 10; v++) {
      var need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
      if (need <= dataCapacity(v) * 8) return makeMatrix(buildCodewords(bytes, v), v);
    }
    throw new Error('Địa chỉ quá dài để tạo mã QR.');
  }

  function svg(text, opts) {
    opts = opts || {};
    var m = encode(text);
    var size = m.length, q = 4, total = size + q * 2;
    var d = '';
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg class="qr ' + (opts.cls || '') + '" viewBox="0 0 ' + total + ' ' + total + '" role="img" aria-label="' + (opts.label || 'Mã QR') + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }

  VV.qr = { encode: encode, svg: svg };
})(window.VV = window.VV || {});
