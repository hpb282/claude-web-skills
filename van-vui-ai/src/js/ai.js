/* Kết nối AI bằng API key do giáo viên nhập. Gọi thẳng từ trình duyệt tới nhà cung cấp. */
(function (VV) {
  'use strict';
  var D = VV.data;

  var PROVIDERS = {
    anthropic: {
      label: 'Claude (Anthropic)',
      models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
      defaultModel: 'claude-opus-5-5',
      keyHint: 'Bắt đầu bằng sk-ant-',
      keyUrl: 'https://console.anthropic.com/settings/keys'
    },
    openai: {
      label: 'OpenAI',
      models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
      defaultModel: 'gpt-4.1-mini',
      keyHint: 'Bắt đầu bằng sk-',
      keyUrl: 'https://platform.openai.com/api-keys'
    },
    gemini: {
      label: 'Google Gemini',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
      defaultModel: 'gemini-2.5-flash',
      keyHint: 'Lấy tại Google AI Studio',
      keyUrl: 'https://aistudio.google.com/app/apikey'
    },
    compatible: {
      label: 'Dịch vụ tương thích OpenAI',
      models: [],
      defaultModel: '',
      keyHint: 'Ví dụ OpenRouter, Groq, máy chủ nội bộ',
      keyUrl: ''
    }
  };

  function cfg() {
    var s = VV.store.settings.ai;
    return { provider: s.provider, model: s.model || PROVIDERS[s.provider].defaultModel, baseUrl: s.baseUrl, key: VV.store.getApiKey() };
  }
  function isReady() {
    var c = cfg();
    if (!c.key) return false;
    if (c.provider === 'compatible' && !c.baseUrl) return false;
    return !!c.model;
  }

  function httpError(status, bodyText) {
    var msg = '';
    try {
      var j = JSON.parse(bodyText);
      msg = (j.error && (j.error.message || j.error.type)) || j.message || '';
    } catch (e) { msg = (bodyText || '').slice(0, 200); }
    var hint = '';
    if (status === 401 || status === 403) hint = 'API key không đúng hoặc chưa được cấp quyền. Kiểm tra lại key trong Cài đặt.';
    else if (status === 404) hint = 'Không tìm thấy model hoặc địa chỉ. Kiểm tra tên model trong Cài đặt.';
    else if (status === 429) hint = 'Đã vượt giới hạn gọi hoặc hết hạn mức. Đợi một lúc rồi thử lại.';
    else if (status >= 500) hint = 'Máy chủ AI đang bận. Thử lại sau ít phút.';
    else hint = 'Yêu cầu bị từ chối.';
    var err = new Error(hint + (msg ? ' Chi tiết: ' + msg : ''));
    err.status = status;
    return err;
  }

  // Model Claude hỗ trợ tham số effort và cơ chế chuyển model dự phòng khi bị từ chối.
  function claudeFeatures(model) {
    var effort = /^claude-(opus|sonnet|haiku|fable)-5/.test(model);
    var fallback = /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model);
    return { effort: effort, fallback: fallback };
  }

  function callAnthropic(c, system, user, signal, opts) {
    var f = claudeFeatures(c.model);
    var body = { model: c.model, max_tokens: opts.maxTokens || 16000, system: system, messages: [{ role: 'user', content: user }] };
    var headers = {
      'content-type': 'application/json',
      'x-api-key': c.key,
      'anthropic-version': '2026-10-21',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    if (f.effort) body.output_config = { effort: opts.effort || 'medium' };
    if (f.fallback && !opts.noFallback) {
      body.fallbacks = 'default';
      headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    }
    return fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: headers, body: JSON.stringify(body), signal: signal })
      .then(function (res) {
        return res.text().then(function (t) {
          if (!res.ok) {
            // Một số tài khoản chưa bật tính năng dự phòng: gửi lại không kèm tham số đó.
            if (res.status === 400 && /fallback|beta/i.test(t) && !opts.noFallback) {
              return callAnthropic(c, system, user, signal, Object.assign({}, opts, { noFallback: true }));
            }
            throw httpError(res.status, t);
          }
          var j = JSON.parse(t);
          if (j.stop_reason === 'refusal') throw new Error('AI từ chối yêu cầu này. Hãy diễn đạt lại yêu cầu cần đạt rồi thử lại.');
          if (j.stop_reason === 'max_tokens') throw new Error('Câu trả lời của AI bị cắt giữa chừng. Giảm số nhiệm vụ rồi thử lại.');
          return (j.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
        });
      });
  }

  function callOpenAI(c, system, user, signal, opts) {
    var base = c.provider === 'compatible' ? c.baseUrl.replace(/\/+$/, '') : 'https://api.openai.com/v1';
    var body = { model: c.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
    if (c.provider === 'openai' && opts.json) body.response_format = { type: 'json_object' };
    return fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key },
      body: JSON.stringify(body), signal: signal
    }).then(function (res) {
      return res.text().then(function (t) {
        if (!res.ok) throw httpError(res.status, t);
        var j = JSON.parse(t);
        var ch = j.choices && j.choices[0];
        if (!ch) throw new Error('AI không trả về nội dung.');
        if (ch.finish_reason === 'length') throw new Error('Câu trả lời của AI bị cắt giữa chừng. Giảm số nhiệm vụ rồi thử lại.');
        return ch.message && ch.message.content || '';
      });
    });
  }

  function callGemini(c, system, user, signal, opts) {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(c.model) + ':generateContent';
    var body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }]
    };
    if (opts.json) body.generationConfig = { responseMimeType: 'application/json' };
    return fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': c.key },
      body: JSON.stringify(body), signal: signal
    }).then(function (res) {
      return res.text().then(function (t) {
        if (!res.ok) throw httpError(res.status, t);
        var j = JSON.parse(t);
        var cand = j.candidates && j.candidates[0];
        if (!cand) throw new Error('AI không trả về nội dung' + (j.promptFeedback && j.promptFeedback.blockReason ? ' (bị chặn: ' + j.promptFeedback.blockReason + ').' : '.'));
        return (cand.content && cand.content.parts || []).map(function (p) { return p.text || ''; }).join('');
      });
    });
  }

  function complete(system, user, opts) {
    opts = opts || {};
    var c = cfg();
    if (!c.key) return Promise.reject(new Error('Chưa có API key. Mở Cài đặt để nhập key.'));
    var p;
    if (c.provider === 'anthropic') p = callAnthropic(c, system, user, opts.signal, opts);
    else if (c.provider === 'gemini') p = callGemini(c, system, user, opts.signal, opts);
    else p = callOpenAI(c, system, user, opts.signal, opts);
    return p.catch(function (e) {
      if (e.name === 'AbortError') throw new Error('Đã dừng soạn.');
      if (e instanceof TypeError) throw new Error('Không kết nối được tới dịch vụ AI. Kiểm tra mạng, địa chỉ máy chủ, hoặc dịch vụ này không cho gọi trực tiếp từ trình duyệt.');
      throw e;
    });
  }

  function extractJSON(text) {
    var t = String(text || '').replace(/```json/gi, '```');
    var fence = t.match(/```([\s\S]*?)```/);
    if (fence) t = fence[1];
    var a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a === -1 || b === -1) throw new Error('AI không trả về đúng định dạng. Bấm soạn lại.');
    try { return JSON.parse(t.slice(a, b + 1)); }
    catch (e) { throw new Error('AI trả về dữ liệu lỗi định dạng. Bấm soạn lại.'); }
  }

  function testConnection(signal) {
    return complete('Bạn là trợ lý kiểm tra kết nối.', 'Trả lời đúng một từ: OK', { signal: signal, maxTokens: 2000, effort: 'low' });
  }

  // ---------- Lời nhắc ----------
  function systemPrompt(allowedVans, extra, initials) {
    return [
      'Bạn là trợ lý soạn học liệu luyện đọc, viết tiếng Việt cho học sinh lớp 1 (khoảng 6 tuổi). Bạn chỉ soạn bản nháp; giáo viên là người kiểm tra và quyết định cuối cùng.',
      'Quy tắc bắt buộc:',
      '1. Chỉ dùng tiếng có vần nằm trong danh sách vần đã học: ' + allowedVans.join(', ') + '. ' +
        (initials ? 'Lớp đang học âm: chỉ dùng tiếng không có âm đầu hoặc có âm đầu trong danh sách: ' + initials.join(', ') + '.' : 'Âm đầu nào cũng được.') +
        ' Tiếng có vần khác danh sách là lỗi (ví dụ "vườn" có vần ươn, "hoa" có vần oa).',
      extra && extra.length ? '2. Được dùng thêm các tiếng giáo viên đã duyệt: ' + extra.join(', ') + '.' : '2. Không có tiếng bổ sung.',
      '3. Câu ngắn từ 3 đến 7 tiếng, nội dung gần gũi, an toàn, tích cực với trẻ. Không dùng tên thật của học sinh. Không chép nguyên văn sách giáo khoa.',
      '4. Viết đúng chính tả và dấu thanh; viết thường, chỉ viết hoa đầu câu và tên riêng.',
      '5. Không dùng emoji. Chỉ trả về một đối tượng JSON hợp lệ theo mẫu được yêu cầu, không thêm lời giải thích.'
    ].join('\n');
  }

  var TASK_TYPES = {
    'nhan-dien': 'Nhận diện vần',
    'ghep-tieng': 'Ghép tiếng',
    'chon-tu': 'Chọn từ đúng',
    'hoan-thanh-cau': 'Hoàn thành câu',
    'doc': 'Đọc',
    'viet': 'Viết'
  };

  function exercisesPrompt(p) {
    return [
      'Soạn bài tập luyện theo 3 mức độ cho: ' + p.vans.map(D.unitLabel).join(', ') + '.',
      'Yêu cầu cần đạt của bài: ' + (p.objective || '(không ghi)'),
      p.errors.length ? 'Lỗi học sinh hay gặp cần luyện: ' + p.errors.join(', ') + '.' : '',
      'Mỗi mức độ ' + p.perLevel + ' nhiệm vụ. Ba mức: "ho-tro" (có hỗ trợ: tô màu vần, ít lựa chọn, có nghe mẫu), "tu-lam" (tự thực hiện), "van-dung" (dùng tiếng trong từ, câu mới).',
      'Loại nhiệm vụ: "nhan-dien" (chọn tiếng có vần), "ghep-tieng" (âm đầu + vần + thanh), "chon-tu" (chọn từ viết đúng), "hoan-thanh-cau" (chọn tiếng điền vào chỗ trống ___), "doc" (đọc to cho giáo viên nghe), "viet" (viết vào vở ô li).',
      'Với nhan-dien, ghep-tieng, chon-tu, hoan-thanh-cau: có 3 lựa chọn, đúng một đáp án nằm trong lựa chọn. Với doc và viet: options là mảng rỗng, answer là chuỗi rỗng.',
      'Trả về JSON đúng mẫu:',
      '{"tasks":[{"level":"ho-tro","type":"nhan-dien","van":"an","prompt":"Lời giao việc ngắn cho học sinh","question":"Nội dung câu hỏi hoặc chữ cần đọc, viết","options":["bàn","bông","bé"],"answer":"bàn","teacherNote":"Gợi ý ngắn cho giáo viên"}]}'
    ].filter(Boolean).join('\n');
  }

  function storyPrompt(p) {
    return [
      'Viết một truyện rất ngắn ' + p.sentences + ' câu để luyện đọc: ' + p.vans.map(D.unitLabel).join(', ') + '. Chủ đề: ' + p.topic + '.',
      'Dùng nhiều tiếng có vần cần luyện. Thêm 2 câu hỏi đọc hiểu ngắn kèm câu trả lời mẫu.',
      'Trả về JSON đúng mẫu:',
      '{"title":"Tên truyện","story":"Câu 1. Câu 2. Câu 3.","questions":[{"q":"Câu hỏi?","a":"Câu trả lời."}]}'
    ].join('\n');
  }

  function parentPrompt(p) {
    return [
      'Soạn gói "5 phút cùng con" để phụ huynh luyện cùng con ở nhà: 3 phút đọc có người lớn hỗ trợ, 2 phút viết một nhiệm vụ ngắn.',
      'Âm, vần cần luyện: ' + p.vans.map(D.unitLabel).join(', ') + '. Lỗi con hay gặp: ' + (p.errors.length ? p.errors.join(', ') : 'chưa ghi') + '.',
      'Hướng dẫn dễ hiểu cho phụ huynh không có chuyên môn, giọng nhẹ nhàng, không so sánh với bạn khác, không chấm điểm.',
      'Các tiếng, câu để con đọc và viết phải theo quy tắc kho tiếng. Lời hướng dẫn cho phụ huynh thì không bị giới hạn.',
      'Trả về JSON đúng mẫu:',
      '{"title":"Tên gói","read3":["Bước 1","Bước 2","Bước 3"],"readWords":["tiếng hoặc câu để con đọc"],"write2":"Nhiệm vụ viết 2 phút","writeWords":["tiếng để con viết"],"tips":["Lời khuyên ngắn"],"phone":"Tin nhắn ngắn gửi phụ huynh qua điện thoại, tối đa 500 ký tự"}'
    ].join('\n');
  }

  function writingPrompt(p) {
    return [
      'Soạn phiếu luyện viết vào vở ô li cho học sinh lớp 1. Trọng tâm: ' + p.vans.map(D.unitLabel).join(', ') + '.',
      'Lỗi viết giáo viên đã ghi: ' + (p.errors.length ? p.errors.join(', ') : 'chưa ghi') + '.',
      'Gồm hướng dẫn ngắn cho học sinh (giáo viên đọc to), 5 tiếng hoặc từ để viết, và một lưu ý cho giáo viên khi chấm.',
      'Trả về JSON đúng mẫu:',
      '{"title":"Tên phiếu","guide":["Hướng dẫn 1","Hướng dẫn 2"],"words":["tiếng 1","tiếng 2","tiếng 3","tiếng 4","tiếng 5"],"teacherNote":"Lưu ý khi chấm"}'
    ].join('\n');
  }

  // ---------- Soạn từ mẫu (không dùng AI, chạy khi mất mạng) ----------
  function shuffle(arr, R) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function templateExercises(p) {
    var R = VV.store.rng(Date.now() % 100000);
    var out = { 'ho-tro': [], 'tu-lam': [], 'van-dung': [] };
    for (var k = 0; k < p.perLevel * p.vans.length && out['ho-tro'].length < p.perLevel; k++) {
      var van = p.vans[k % p.vans.length];
      var round = Math.floor(k / p.vans.length);
      var g = D.groupOfVan(van);
      var words = g.words[van];
      var w = words[(round * 2) % words.length];
      var parsed = VV.viet.parse(w);
      var cons = D.isConsonantUnit(van);
      var others = g.vans.filter(function (v) { return v !== van && D.isConsonantUnit(v) === cons; });
      // Tiếng nhiễu không được chứa âm, vần đang hỏi.
      var pool = [];
      g.vans.forEach(function (v) { if (v !== van) g.words[v].forEach(function (x) { if (!D.matches(x, van) && pool.indexOf(x) === -1) pool.push(x); }); });
      var d1 = pool[round % (pool.length || 1)] || 'bé', d2 = pool[(round + 3) % (pool.length || 1)] || 'bà';
      if (d2 === d1) d2 = pool[(round + 1) % (pool.length || 1)] || 'bà';
      var label = D.unitLabel(van);

      out['ho-tro'].push({
        level: 'ho-tro', type: 'nhan-dien', van: van,
        prompt: 'Nghe cô đọc, chọn tiếng có ' + label + '.',
        question: 'Tiếng nào có ' + label + '?',
        options: shuffle([w, d1, d2], R), answer: w,
        teacherNote: 'Đọc mẫu ' + label + ' trước khi cho học sinh chọn.'
      });

      var dis = VV.viet.toneDistractors(w, cons ? [] : others);
      out['tu-lam'].push({
        level: 'tu-lam', type: 'ghep-tieng', van: van,
        prompt: 'Ghép âm, vần và dấu thanh thành tiếng.',
        question: (parsed.initial || '(không có âm đầu)') + ' + ' + parsed.van + ' + ' + VV.viet.TONE_NAME[parsed.tone],
        options: shuffle([w].concat(dis), R),
        answer: w, teacherNote: 'Cho học sinh đọc to tiếng vừa ghép.'
      });

      var fills = g.fill.filter(function (f) { return D.matches(f.answer, van); });
      if ((k % 2 === 0 || !fills.length) && g.fill.length) {
        var f = fills[round % (fills.length || 1)] || g.fill[round % g.fill.length];
        out['van-dung'].push({
          level: 'van-dung', type: 'hoan-thanh-cau', van: D.unitOf(g, f.answer) || van,
          prompt: 'Chọn tiếng điền vào chỗ trống rồi đọc cả câu.',
          question: f.text, options: shuffle(f.options, R), answer: f.answer,
          teacherNote: 'Hỏi học sinh vì sao chọn tiếng đó.'
        });
      } else {
        var phrase = g.phrases.filter(function (ph) {
          return ph.split(' ').some(function (x) { return D.matches(x, van); });
        })[0] || w;
        out['van-dung'].push({
          level: 'van-dung', type: 'viet', van: van, prompt: 'Viết vào vở ô li.',
          question: phrase, options: [], answer: '',
          teacherNote: 'Chấm theo tiêu chí: hình chữ, vị trí dấu thanh, khoảng cách.'
        });
      }
    }
    return { tasks: out['ho-tro'].concat(out['tu-lam'], out['van-dung']) };
  }

  function templateStory(p) {
    var lines = [];
    var vans = p.vans;
    D.GROUPS.forEach(function (g) {
      if (g.vans.some(function (v) { return vans.indexOf(v) !== -1; })) lines = lines.concat(g.sentences);
    });
    lines = lines.slice(0, p.sentences);
    return {
      title: 'Truyện ghép từ câu mẫu',
      story: lines.join(' '),
      questions: [{ q: 'Trong truyện có những ai?', a: 'Học sinh trả lời theo truyện.' }, { q: 'Em thích câu nào nhất?', a: 'Học sinh đọc lại câu mình thích.' }]
    };
  }

  function templateParent(p) {
    var g = D.groupOfVan(p.vans[0]) || D.GROUPS[0];
    var words = g.words[p.vans[0]] || [];
    return {
      title: '5 phút cùng con: vần ' + p.vans.join(', '),
      read3: [
        'Đọc mẫu vần ' + p.vans[0] + ' hai lần, con đọc theo.',
        'Con đọc các tiếng dưới đây. Con đọc sai thì bố mẹ đọc mẫu lại, không chê.',
        'Con đọc câu ngắn. Khen khi con tự đọc được.'
      ],
      readWords: words.slice(0, 4).concat(g.sentences.slice(0, 1)),
      write2: 'Con viết 2 tiếng vào vở ô li, mỗi tiếng một dòng ngắn.',
      writeWords: words.slice(0, 2),
      tips: ['Ngồi cạnh con, đọc chậm và rõ.', 'Chỉ luyện khoảng 5 phút, dừng khi con mệt.', 'Ghi lại tiếng con còn đọc sai để báo cô.'],
      phone: 'Cô gửi gói 5 phút luyện vần ' + p.vans.join(', ') + '. Bố mẹ đọc mẫu, con đọc theo các tiếng: ' + words.slice(0, 4).join(', ') + '. Sau đó con viết 2 tiếng: ' + words.slice(0, 2).join(', ') + '. Bố mẹ ghi lại tiếng con còn đọc sai giúp cô nhé.'
    };
  }

  function templateWriting(p) {
    var words = [];
    p.vans.forEach(function (v) { var g = D.groupOfVan(v); if (g) words = words.concat(g.words[v].slice(0, 3)); });
    return {
      title: 'Phiếu luyện viết vần ' + p.vans.join(', '),
      guide: ['Ngồi thẳng lưng, cầm bút đúng cách.', 'Viết vần trước, rồi viết tiếng.', 'Đặt dấu thanh trên hoặc dưới con chữ chính của vần.'],
      words: words.slice(0, 5),
      teacherNote: 'Chú ý độ cao con chữ và khoảng cách giữa các tiếng.'
    };
  }

  // ---------- Chuẩn hóa kết quả ----------
  function normExercises(j) {
    var tasks = Array.isArray(j.tasks) ? j.tasks : [];
    if (!tasks.length && Array.isArray(j.levels)) {
      j.levels.forEach(function (lv) { (lv.tasks || []).forEach(function (t) { t.level = t.level || lv.level; tasks.push(t); }); });
    }
    return {
      tasks: tasks.map(function (t) {
        var level = ['ho-tro', 'tu-lam', 'van-dung'].indexOf(t.level) !== -1 ? t.level : 'tu-lam';
        var type = TASK_TYPES[t.type] ? t.type : 'doc';
        var options = Array.isArray(t.options) ? t.options.map(String).slice(0, 4) : [];
        return {
          level: level, type: type, van: String(t.van || ''),
          prompt: String(t.prompt || ''), question: String(t.question || ''),
          options: options, answer: String(t.answer || ''), teacherNote: String(t.teacherNote || '')
        };
      }).filter(function (t) { return t.question || t.prompt; })
    };
  }
  function normStory(j) {
    return {
      title: String(j.title || 'Truyện luyện vần'),
      story: String(j.story || ''),
      questions: (Array.isArray(j.questions) ? j.questions : []).map(function (q) { return { q: String(q.q || ''), a: String(q.a || '') }; })
    };
  }
  function strList(x) { return (Array.isArray(x) ? x : []).map(String).filter(Boolean); }
  function normParent(j) {
    return {
      title: String(j.title || '5 phút cùng con'), read3: strList(j.read3), readWords: strList(j.readWords),
      write2: String(j.write2 || ''), writeWords: strList(j.writeWords), tips: strList(j.tips), phone: String(j.phone || '')
    };
  }
  function normWriting(j) {
    return { title: String(j.title || 'Phiếu luyện viết'), guide: strList(j.guide), words: strList(j.words), teacherNote: String(j.teacherNote || '') };
  }

  var TOOLS = {
    exercises: { prompt: exercisesPrompt, template: templateExercises, norm: normExercises, maxTokens: 16000 },
    story: { prompt: storyPrompt, template: templateStory, norm: normStory, maxTokens: 8000 },
    parent: { prompt: parentPrompt, template: templateParent, norm: normParent, maxTokens: 8000 },
    writing: { prompt: writingPrompt, template: templateWriting, norm: normWriting, maxTokens: 8000 }
  };

  // Soạn bản nháp. useAI=false dùng mẫu có sẵn.
  function draft(tool, params, useAI, signal) {
    var t = TOOLS[tool];
    if (!useAI) return Promise.resolve({ data: t.norm(t.template(params)), source: 'mau' });
    var k = VV.store.kho();
    var sys = systemPrompt(Array.from(k.vans), Array.from(k.extra), k.initials ? Array.from(k.initials) : null);
    return complete(sys, t.prompt(params), { signal: signal, json: true, maxTokens: t.maxTokens })
      .then(function (text) { return { data: t.norm(extractJSON(text)), source: 'ai' }; });
  }

  VV.ai = {
    PROVIDERS: PROVIDERS, TASK_TYPES: TASK_TYPES,
    isReady: isReady, cfg: cfg, complete: complete, testConnection: testConnection, draft: draft, extractJSON: extractJSON
  };
})(window.VV = window.VV || {});
