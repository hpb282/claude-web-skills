/* Dữ liệu chương trình lớp 1: phần âm và các nhóm vần (tiếng, từ, câu, câu điền từ). Mỗi nhóm chỉ dùng âm, vần đã học tới nhóm đó. */
(function (VV) {
  'use strict';

  // Vần học trước giai đoạn vần (phần âm và vần mở): luôn có trong kho tiếng.
  var BASE_VANS = ['a', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y', 'ia', 'ua', 'ưa'];

  var GROUPS = [
    {
      id: 1, vans: ['an', 'ăn', 'ân'],
      words: {
        an: ['bàn', 'bạn', 'lan', 'đàn', 'nhãn', 'ngan'],
        'ăn': ['chăn', 'khăn', 'săn', 'lặn', 'nặn', 'rắn'],
        'ân': ['cân', 'sân', 'mận', 'chân', 'gần', 'bận']
      },
      phrases: ['bạn bè', 'khăn đỏ', 'quả mận', 'đàn gà', 'sân nhà', 'bàn chân'],
      sentences: ['Bạn Lan có khăn đỏ.', 'Bà cho bé quả mận.', 'Bé và bạn ra sân.'],
      fill: [
        { text: 'Bạn Lan có ___ đỏ.', options: ['khăn', 'chân', 'đàn'], answer: 'khăn' },
        { text: 'Bà cho bé quả ___.', options: ['mận', 'sân', 'bàn'], answer: 'mận' }
      ]
    },
    {
      id: 2, vans: ['on', 'ôn', 'ơn'],
      words: {
        on: ['con', 'nón', 'hòn', 'ngon', 'non', 'đón'],
        'ôn': ['chồn', 'thôn', 'bốn', 'khôn', 'tôn', 'ổn'],
        'ơn': ['sơn', 'lợn', 'đơn', 'cơn', 'hơn', 'lớn']
      },
      phrases: ['con chồn', 'nón lá', 'sơn ca', 'thôn xa', 'lợn con', 'hòn đá'],
      sentences: ['Con chồn ở hòn non bộ.', 'Nhà bà có bốn con lợn.', 'Bố sơn cửa.'],
      fill: [
        { text: 'Bố ___ cửa.', options: ['sơn', 'nón', 'chồn'], answer: 'sơn' },
        { text: 'Bà có ___ lá.', options: ['nón', 'sơn', 'thôn'], answer: 'nón' }
      ]
    },
    {
      id: 3, vans: ['en', 'ên', 'in', 'un'],
      words: {
        en: ['sen', 'kèn', 'len', 'chén', 'khen', 'đèn'],
        'ên': ['nến', 'bến', 'sên', 'tên', 'lên', 'mền'],
        'in': ['pin', 'chín', 'nhìn', 'xin', 'tin', 'mịn'],
        un: ['giun', 'cún', 'bún', 'run', 'vun', 'phun']
      },
      phrases: ['lá sen', 'len đỏ', 'ngọn nến', 'bún chả', 'chú cún', 'đèn pin'],
      sentences: ['Mẹ cho bé ăn bún.', 'Mẹ đan len.', 'Quả na đã chín.'],
      fill: [
        { text: 'Mẹ đan ___.', options: ['len', 'lên', 'kèn'], answer: 'len' },
        { text: 'Quả na đã ___.', options: ['chín', 'chân', 'bún'], answer: 'chín' }
      ]
    },
    {
      id: 4, vans: ['am', 'ăm', 'âm'],
      words: {
        am: ['cam', 'tám', 'làm', 'nam', 'xám', 'khám'],
        'ăm': ['tằm', 'chăm', 'năm', 'cằm', 'gặm', 'tắm'],
        'âm': ['nấm', 'mầm', 'sấm', 'tâm', 'ấm', 'cầm']
      },
      phrases: ['quả cam', 'con tằm', 'mầm non', 'số tám', 'tắm mưa', 'ấm chè'],
      sentences: ['Bé có tám quả cam.', 'Mẹ đi chợ mua nấm.', 'Con tằm ăn lá.'],
      fill: [
        { text: 'Mẹ đi chợ mua ___.', options: ['nấm', 'tằm', 'năm'], answer: 'nấm' },
        { text: 'Bé có tám quả ___.', options: ['cam', 'cằm', 'sâm'], answer: 'cam' }
      ]
    },
    {
      id: 5, vans: ['ai', 'ay', 'ây'],
      words: {
        ai: ['tai', 'hai', 'nai', 'gái', 'mái', 'chai'],
        ay: ['tay', 'máy', 'bay', 'cày', 'chạy', 'váy'],
        'ây': ['dây', 'mây', 'cây', 'gậy', 'sậy', 'đây']
      },
      phrases: ['bàn tay', 'máy bay', 'cây na', 'dây đàn', 'chú nai', 'mây đen'],
      sentences: ['Chú nai có hai tai.', 'Mẹ may váy cho bé.', 'Bé vẽ cây và mây.'],
      fill: [
        { text: 'Chú nai có hai ___.', options: ['tai', 'tay', 'tây'], answer: 'tai' },
        { text: 'Mẹ may ___ cho bé.', options: ['váy', 'vai', 'vây'], answer: 'váy' }
      ]
    },
    {
      id: 6, vans: ['oi', 'ôi', 'ơi'],
      words: {
        oi: ['còi', 'voi', 'sói', 'gói', 'nói', 'hỏi'],
        'ôi': ['chổi', 'gối', 'ổi', 'đôi', 'môi', 'tôi'],
        'ơi': ['bơi', 'chơi', 'dơi', 'mời', 'phơi', 'trời']
      },
      phrases: ['bơi lội', 'cái chổi', 'quả ổi', 'chú voi', 'đồ chơi', 'trời mưa'],
      sentences: ['Bé đi bơi với bố.', 'Chú voi có cái vòi dài.', 'Mẹ cho bé quả ổi.'],
      fill: [
        { text: 'Bé đi ___ với bố.', options: ['bơi', 'bôi', 'bói'], answer: 'bơi' },
        { text: 'Mẹ cho bé quả ___.', options: ['ổi', 'gối', 'voi'], answer: 'ổi' }
      ]
    },
    {
      id: 7, vans: ['ao', 'eo', 'au', 'âu'],
      words: {
        ao: ['sao', 'cáo', 'táo', 'chào', 'bão', 'gạo'],
        eo: ['mèo', 'kéo', 'bèo', 'kẹo', 'leo', 'trèo'],
        au: ['rau', 'cau', 'sáu', 'màu', 'cháu', 'đau'],
        'âu': ['câu', 'trâu', 'sâu', 'đậu', 'cầu', 'râu']
      },
      phrases: ['ngôi sao', 'con mèo', 'rau cải', 'trâu cày', 'quả táo', 'cây cầu'],
      sentences: ['Mèo trèo cây cau.', 'Con trâu ăn cỏ.', 'Bé hái táo cho bà.'],
      fill: [
        { text: 'Con ___ ăn cỏ.', options: ['trâu', 'sao', 'cầu'], answer: 'trâu' },
        { text: 'Mèo trèo cây ___.', options: ['cau', 'câu', 'cao'], answer: 'cau' }
      ]
    },
    {
      id: 8, vans: ['at', 'ăt', 'ât'],
      words: {
        at: ['hát', 'mát', 'bát', 'cát', 'nhạt', 'quạt'],
        'ăt': ['mắt', 'cắt', 'mặt', 'bắt', 'chặt', 'thắt'],
        'ât': ['mật', 'đất', 'vật', 'tất', 'gật', 'thật']
      },
      phrases: ['hát ca', 'bát đũa', 'đôi mắt', 'quạt máy', 'rửa mặt', 'đất đai'],
      sentences: ['Bà bật quạt.', 'Mẹ rửa mặt cho bé.', 'Bé và bạn hát ca.'],
      fill: [
        { text: 'Bà bật ___.', options: ['quạt', 'mắt', 'đất'], answer: 'quạt' },
        { text: 'Mẹ rửa ___ cho bé.', options: ['mặt', 'mật', 'mát'], answer: 'mặt' }
      ]
    },
    {
      id: 9, vans: ['ac', 'ăc', 'âc'],
      words: {
        ac: ['bác', 'các', 'lạc', 'nhạc', 'vạc', 'hạc'],
        'ăc': ['mắc', 'sắc', 'mặc', 'chắc', 'lắc', 'tắc'],
        'âc': ['gấc', 'bậc', 'nhấc', 'tấc', 'bấc', 'giấc']
      },
      phrases: ['bác sĩ', 'âm nhạc', 'quả gấc', 'mặc áo', 'củ lạc', 'lắc tay'],
      sentences: ['Bé mặc áo mới.', 'Bác cho bé quả gấc.', 'Bé nghe nhạc.'],
      fill: [
        { text: 'Bé ___ áo mới.', options: ['mặc', 'bậc', 'lạc'], answer: 'mặc' },
        { text: 'Bác cho bé quả ___.', options: ['gấc', 'gác', 'bậc'], answer: 'gấc' }
      ]
    },
    {
      id: 10, vans: ['ang', 'ăng', 'âng'],
      words: {
        ang: ['bàng', 'làng', 'vàng', 'thang', 'trang', 'càng'],
        'ăng': ['măng', 'trăng', 'răng', 'nắng', 'căng', 'vắng'],
        'âng': ['tầng', 'vâng', 'nâng', 'tâng', 'dâng', 'vầng']
      },
      phrases: ['cây bàng', 'trăng rằm', 'nhà tầng', 'làng quê', 'măng tre', 'nắng mai'],
      sentences: ['Tối nay trăng sáng.', 'Bé lên tầng hai.', 'Ở làng có cây bàng.'],
      fill: [
        { text: 'Bé lên ___ hai.', options: ['tầng', 'tăng', 'tang'], answer: 'tầng' },
        { text: 'Tối nay ___ sáng.', options: ['trăng', 'trang', 'tầng'], answer: 'trăng' }
      ]
    }
  ];

  // ---------- Bổ sung: phần âm và các vần còn lại của lớp 1 ----------
  // G(khóa, loại, giai đoạn, {đơn vị: [tiếng]}, [từ ngữ], [câu], ['câu có ___ | lựa chọn | đáp án'])
  function G(key, kind, stage, words, phrases, sentences, fills) {
    return {
      key: key, kind: kind, stage: stage, vans: Object.keys(words), words: words,
      phrases: phrases, sentences: sentences,
      fill: (fills || []).map(function (ln) {
        var p = ln.split('|').map(function (x) { return x.trim(); });
        return { text: p[0], options: p[1].split(',').map(function (x) { return x.trim(); }), answer: p[2] };
      })
    };
  }

  var AM_GROUPS = [
    G('am-1', 'am', 'am', { a: ['bà', 'ba', 'cá', 'cà'], b: ['ba', 'bà', 'bá', 'bã'], c: ['ca', 'cà', 'cá', 'cả'] },
      ['ba ba', 'bà ba'], [], []),
    G('am-2', 'am', 'am', { e: ['be', 'bé', 'bè', 'bẻ'], 'ê': ['bê', 'bế', 'bể', 'bề'], o: ['bò', 'bó', 'cò', 'có', 'cỏ'], 'ô': ['bố', 'bổ', 'cô', 'cổ', 'bộ'] },
      ['cô bé', 'bế bé', 'bó cỏ', 'cổ cò', 'bò bê'], ['Bố bế bé.', 'Bé có bê.', 'Cô có cá.'],
      ['Cô bế ___. | bé, bò, bể | bé']),
    G('am-3', 'am', 'am', { 'ơ': ['bơ', 'bờ', 'cờ', 'đỡ', 'dở'], d: ['da', 'dê', 'dế', 'dỗ'], 'đ': ['đá', 'đò', 'đỗ', 'đê'] },
      ['bờ đê', 'dỗ bé', 'đỗ đỏ', 'da dê'], ['Bé có cờ đỏ.', 'Bố dỗ bé.', 'Dê ở bờ đê.'],
      ['Bé có cờ ___. | đỏ, đá, đò | đỏ', 'Dê ở bờ ___. | đê, dê, đỗ | đê']),
    G('am-4', 'am', 'am', { i: ['bi', 'bí', 'đi', 'dì', 'li'], k: ['kê', 'kẻ', 'kế', 'kì'], h: ['hè', 'hồ', 'hổ', 'hà'], l: ['lá', 'lê', 'lọ', 'lò'] },
      ['lá cờ', 'bờ hồ', 'bí đỏ', 'hồ cá'], ['Bé có bi.', 'Bé đi bờ hồ.', 'Dì có bí đỏ.'],
      ['Dì có ___ đỏ. | bí, bé, bò | bí', 'Bé đi bờ ___. | hồ, hổ, hè | hồ']),
    G('am-5', 'am', 'am', { u: ['cụ', 'củ', 'đu', 'bú', 'hũ'], 'ư': ['cừ', 'cử', 'dữ', 'hư'], ch: ['chó', 'chè', 'chả', 'chợ', 'chú'], kh: ['khế', 'khỉ', 'kho', 'khô', 'khá'] },
      ['chú khỉ', 'cá kho', 'chả cá', 'lá khế'], ['Chú khỉ có khế.', 'Bà đi chợ.', 'Bố có chó.'],
      ['Bà đi ___. | chợ, chó, chè | chợ', 'Chú khỉ có ___. | khế, khô, kho | khế']),
    G('am-6', 'am', 'am', { m: ['mẹ', 'mè', 'mũ', 'mơ', 'mì'], n: ['nơ', 'na', 'no', 'nụ'], g: ['gà', 'gỗ', 'gõ', 'ga'], gi: ['giá', 'giỏ', 'giữ', 'giò'] },
      ['gà mẹ', 'giỏ cá', 'cá mè', 'giò chả', 'nơ đỏ'], ['Mẹ đi chợ.', 'Bé có nơ đỏ.', 'Mẹ có giỏ cá.'],
      ['Bé có ___ đỏ. | nơ, na, no | nơ', 'Mẹ có ___ cá. | giỏ, gỗ, giữ | giỏ']),
    G('am-7', 'am', 'am', { gh: ['ghế', 'ghi', 'ghẹ', 'ghé'], nh: ['nhà', 'nhỏ', 'nho', 'nhớ'], ng: ['ngõ', 'ngô', 'ngà', 'ngủ'], ngh: ['nghé', 'nghe', 'nghề', 'nghỉ'] },
      ['nhà bà', 'ghế gỗ', 'ngõ nhỏ', 'bé ngủ', 'nho khô'], ['Nhà bà có ghế gỗ.', 'Bé nghe mẹ.', 'Ngõ nhà bé nhỏ.'],
      ['Nhà bà có ___ gỗ. | ghế, ghé, ghi | ghế', 'Bé ___ mẹ. | nghe, nghé, ngõ | nghe']),
    G('am-8', 'am', 'am', { r: ['rổ', 'rễ', 'rá', 'rẽ'], s: ['số', 'sẻ', 'sò', 'sổ'], t: ['tô', 'tủ', 'tí', 'tổ', 'to'], tr: ['tre', 'trà', 'trê', 'trụ'] },
      ['rổ rá', 'cá trê', 'tủ gỗ', 'số ba', 'cá rô'], ['Bà có rổ cá rô.', 'Tủ nhà bé to.', 'Bà có trà.'],
      ['Bà có rổ cá ___. | rô, rổ, rễ | rô', 'Tủ nhà bé ___. | to, tô, tơ | to']),
    G('am-9', 'am', 'am', { th: ['thỏ', 'thư', 'thả', 'thợ'], ia: ['mía', 'tía', 'kìa', 'chia'], ua: ['cua', 'rùa', 'mua', 'đũa'], 'ưa': ['dừa', 'cửa', 'mưa', 'sữa'] },
      ['cua đá', 'sữa chua', 'cửa sổ', 'cá thu'], ['Mẹ mua cua.', 'Bà cho bé mía.', 'Mưa to.'],
      ['Mẹ đi chợ mua ___. | cua, cửa, của | cua', 'Bà cho bé ___. | mía, mưa, mua | mía']),
    G('am-10', 'am', 'am', { ph: ['phở', 'phố', 'pha', 'phà'], qu: ['quả', 'quê', 'quà', 'quạ'], v: ['vé', 'vở', 'vẽ', 'võ'], x: ['xe', 'xa', 'xô', 'xẻ'] },
      ['phố cổ', 'quả na', 'vở ô li', 'quà quê', 'phở bò'], ['Bố đi phố.', 'Bé có vở.', 'Bà cho bé quà.', 'Bé vẽ xe.'],
      ['Bà cho bé ___. | quà, quả, quạ | quà', 'Bé có ___ ô li. | vở, vẽ, võ | vở'])
  ];

  var NEW_VAN = {
    'v-om': G('v-om', 'van', 'van1', { om: ['xóm', 'nhóm', 'khóm', 'chòm', 'gom'], 'ôm': ['tôm', 'cốm', 'đốm', 'gốm', 'chôm'], 'ơm': ['cơm', 'rơm', 'thơm', 'sớm', 'bờm'] },
      ['con tôm', 'cơm nắm', 'rơm khô', 'thơm ngon', 'chôm chôm', 'đồ gốm'], ['Bà cho bé cốm.', 'Bé ăn cơm và tôm.', 'Ở xóm, bà có chôm chôm.'],
      ['Bé ăn cơm và ___. | tôm, cốm, xóm | tôm', 'Ở xóm, bà có ___ chôm. | chôm, chòm, chơm | chôm']),
    'v-em': G('v-em', 'van', 'van1', { em: ['kem', 'tem', 'nem', 'xem', 'thèm'], 'êm': ['đêm', 'nệm', 'thềm', 'mềm', 'êm'], im: ['chim', 'kim', 'tim', 'sim', 'phim'], um: ['chùm', 'chum', 'cúm', 'xúm', 'hùm'] },
      ['que kem', 'tem thư', 'êm ả', 'chim sẻ', 'kim chỉ', 'chùm nho', 'nệm êm'], ['Bé ăn kem.', 'Mẹ có kim chỉ.', 'Đêm, bé ngủ trên nệm êm.'],
      ['Bé ăn ___. | kem, kim, kèm | kem', 'Mẹ có ___ chỉ. | kim, kem, chim | kim']),
    'v-ui': G('v-ui', 'van', 'van1', { ui: ['núi', 'túi', 'mũi', 'bụi', 'củi', 'vui'], 'ưi': ['gửi', 'ngửi', 'cửi'] },
      ['đồi núi', 'túi vải', 'cái mũi', 'vui vẻ', 'gửi thư', 'ngửi mùi'], ['Bé vui vẻ.', 'Bà gửi quà cho bé.', 'Mũi bé ngửi mùi thơm.'],
      ['Bà ___ quà cho bé. | gửi, ngửi, núi | gửi', 'Bé ___ vẻ. | vui, vùi, vai | vui']),
    'v-eu': G('v-eu', 'van', 'van1', { 'êu': ['kêu', 'sếu', 'lều', 'phễu', 'rêu'], iu: ['rìu', 'địu', 'níu', 'dịu', 'chịu'], 'ưu': ['cừu', 'lựu', 'hưu', 'bưu'] },
      ['cái lều', 'cái rìu', 'quả lựu', 'con cừu', 'kêu gọi'], ['Mẹ địu bé.', 'Con cừu kêu be be.', 'Bà cho bé quả lựu.'],
      ['Mẹ ___ bé. | địu, đều, đậu | địu', 'Bà cho bé quả ___. | lựu, lều, lâu | lựu']),
    'v-oc': G('v-oc', 'van', 'van1', { oc: ['sóc', 'cóc', 'móc', 'học', 'đọc'], 'ôc': ['cốc', 'ốc', 'gốc', 'dốc', 'mốc'], uc: ['cúc', 'xúc', 'chục', 'trúc', 'lúc'], 'ưc': ['mực', 'lực', 'rực', 'thức', 'đực'] },
      ['con sóc', 'đi học', 'cái cốc', 'cúc áo', 'con mực', 'thức dậy', 'gốc cây'], ['Bé đi học.', 'Chú sóc leo cây.', 'Mẹ đọc cho bé nghe.'],
      ['Bé đi ___. | học, hộc, hục | học', 'Chú ___ leo cây. | sóc, súc, sốc | sóc']),
    'v-ot': G('v-ot', 'van', 'van1', { ot: ['hót', 'ngọt', 'rót', 'bọt', 'lọt'], 'ôt': ['cột', 'một', 'tốt', 'bột', 'đốt'], 'ơt': ['ớt', 'vợt', 'thớt', 'bớt'] },
      ['chim hót', 'kẹo ngọt', 'cột cờ', 'bột mì', 'quả ớt', 'cái vợt'], ['Chim hót trên cây.', 'Mẹ rót trà.', 'Bé có một cái vợt.'],
      ['Chim ___ trên cây. | hót, hột, hớt | hót', 'Bé có một cái ___. | vợt, vọt, vột | vợt']),
    'v-et': G('v-et', 'van', 'van1', { et: ['vẹt', 'két', 'hét', 'sét', 'mét'], 'êt': ['tết', 'dệt', 'mệt', 'rết', 'hết'], it: ['vịt', 'mít', 'thịt', 'ít', 'hít'], ut: ['bút', 'phút', 'hút', 'sút', 'mút'], 'ưt': ['nứt', 'mứt', 'đứt', 'sứt'] },
      ['con vẹt', 'ngày tết', 'con vịt', 'quả mít', 'cái bút', 'mứt dừa'], ['Tết, bé ăn mứt.', 'Bé có cái bút.', 'Con vịt bơi.'],
      ['Bé có cái ___. | bút, bít, bét | bút', 'Con ___ bơi. | vịt, vẹt, vụt | vịt']),
    'v-ap': G('v-ap', 'van', 'van1', { ap: ['tháp', 'đạp', 'sạp', 'nạp'], 'ăp': ['cặp', 'sắp', 'bắp', 'gặp', 'nắp'], 'âp': ['tập', 'nấp', 'mập', 'đập', 'cấp'] },
      ['xe đạp', 'cái tháp', 'cặp da', 'bắp ngô', 'tập vở', 'nắp nồi'], ['Bố đi xe đạp.', 'Bé tập vẽ.', 'Mẹ gặp cô giáo.'],
      ['Bố đi xe ___. | đạp, đập, đắp | đạp', 'Bé ___ vẽ. | tập, táp, tắp | tập']),
    'v-op': G('v-op', 'van', 'van1', { op: ['họp', 'góp', 'cọp', 'chóp'], 'ôp': ['hộp', 'lốp', 'xốp', 'tốp'], 'ơp': ['lớp', 'chớp', 'đớp', 'lợp'] },
      ['con cọp', 'họp lớp', 'hộp bút', 'lốp xe', 'tia chớp', 'góp ý'], ['Bé có hộp bút.', 'Bố thay lốp xe.', 'Cá đớp mồi.'],
      ['Bé có ___ bút. | hộp, họp, hợp | hộp', 'Bố thay ___ xe. | lốp, lớp, lọp | lốp']),
    'v-ep': G('v-ep', 'van', 'van1', { ep: ['dép', 'kẹp', 'đẹp', 'chép', 'tép'], 'êp': ['bếp', 'xếp', 'nếp'], ip: ['kịp', 'nhịp', 'híp'], up: ['búp', 'chụp', 'húp', 'núp', 'giúp'] },
      ['đôi dép', 'cái kẹp', 'gian bếp', 'xếp đồ', 'búp bê', 'giúp đỡ'], ['Bé có đôi dép đẹp.', 'Mẹ nấu cơm ở bếp.', 'Bé giúp mẹ xếp đồ.'],
      ['Bé có đôi ___ đẹp. | dép, dẹp, dịp | dép', 'Mẹ nấu cơm ở ___. | bếp, bép, búp | bếp']),
    'v-anh': G('v-anh', 'van', 'van1', { anh: ['chanh', 'xanh', 'canh', 'tranh', 'bánh'], 'ênh': ['kênh', 'bệnh', 'lênh', 'chênh'], inh: ['kính', 'xinh', 'tính', 'bình', 'đỉnh'] },
      ['quả chanh', 'bánh mì', 'con kênh', 'xinh xắn', 'kính mắt', 'bức tranh'], ['Bé có cái kính.', 'Mẹ nấu canh chua.', 'Bé vẽ tranh.', 'Lá cây xanh.'],
      ['Bé vẽ ___. | tranh, trinh, xinh | tranh', 'Mẹ nấu ___ chua. | canh, kênh, kính | canh']),
    'v-ach': G('v-ach', 'van', 'van1', { ach: ['sách', 'vách', 'gạch', 'khách', 'mạch'], 'êch': ['ếch', 'lệch', 'chếch'], ich: ['lịch', 'xích', 'thích', 'kịch'] },
      ['cặp sách', 'gạch đỏ', 'con ếch', 'tờ lịch', 'xích đu'], ['Bé thích đọc sách.', 'Con ếch nhảy.', 'Nhà bé có khách.'],
      ['Bé thích đọc ___. | sách, sạch, xích | sách', 'Con ___ nhảy. | ếch, ách, ích | ếch']),
    'v-ong': G('v-ong', 'van', 'van1', { ong: ['bóng', 'cong', 'võng', 'ong', 'sóng'], 'ông': ['ông', 'công', 'sông', 'bông', 'hồng'], ung: ['súng', 'cung', 'thùng', 'nhung', 'rung'], 'ưng': ['trứng', 'lưng', 'gừng', 'mừng', 'sừng'] },
      ['quả bóng', 'con ong', 'bông hồng', 'dòng sông', 'thùng gỗ', 'quả trứng'], ['Ông cho bé quả bóng.', 'Đàn ong bay.', 'Mẹ mua trứng gà.'],
      ['Ông cho bé quả ___. | bóng, bông, bỏng | bóng', 'Mẹ mua ___ gà. | trứng, trưng, trống | trứng']),
    'v-ien': G('v-ien', 'van', 'van2', { 'iên': ['tiên', 'biển', 'điện', 'kiến', 'tiền'], 'yên': ['yên', 'yến'], 'iêt': ['biết', 'viết', 'việt', 'tiết'] },
      ['bờ biển', 'cô tiên', 'đèn điện', 'con kiến', 'chim yến', 'yên xe', 'tập viết'], ['Bé tập viết.', 'Bố đưa bé ra biển.', 'Con kiến bé tí.'],
      ['Bé tập ___. | viết, vết, vịt | viết', 'Bố đưa bé ra ___. | biển, kiến, tiền | biển']),
    'v-ieng': G('v-ieng', 'van', 'van2', { 'iêng': ['chiêng', 'kiềng', 'siêng', 'giếng', 'miếng'], 'iêc': ['tiệc', 'việc', 'xiếc', 'chiếc'], 'iêm': ['kiếm', 'diêm', 'tiêm', 'liềm'], 'iêp': ['tiếp', 'nghiệp', 'diếp'] },
      ['cái giếng', 'miếng bánh', 'rạp xiếc', 'bữa tiệc', 'que diêm', 'rau diếp'], ['Bé đi xem xiếc.', 'Bé chăm chỉ, siêng năng.', 'Mẹ cho bé miếng bánh.'],
      ['Bé đi xem ___. | xiếc, tiệc, xiêng | xiếc', 'Mẹ cho bé ___ bánh. | miếng, miệng, tiếng | miếng']),
    'v-ieu': G('v-ieu', 'van', 'van2', { 'iêu': ['diều', 'tiêu', 'chiếu', 'phiếu', 'siêu'], 'yêu': ['yêu', 'yếu'] },
      ['cánh diều', 'hạt tiêu', 'chiếu cói', 'yêu quý', 'yếu ớt'], ['Bé thả diều.', 'Bé yêu mẹ.', 'Bà trải chiếu.'],
      ['Bé thả ___. | diều, điều, đều | diều', 'Bé ___ mẹ. | yêu, yếu, yếm | yêu']),
    'v-uon': G('v-uon', 'van', 'van2', { 'uôn': ['muốn', 'cuộn', 'chuồn', 'luôn', 'buồn'], 'uông': ['chuông', 'xuồng', 'muống', 'luống', 'buồng'], 'uôt': ['chuột', 'nuốt', 'suốt', 'ruột'], 'uôc': ['thuốc', 'cuốc', 'buộc', 'luộc', 'đuốc'] },
      ['chuồn chuồn', 'cuộn len', 'cái chuông', 'rau muống', 'con chuột', 'trứng luộc'], ['Mẹ luộc rau muống.', 'Chuông reo.', 'Con mèo bắt chuột.'],
      ['Mẹ luộc rau ___. | muống, muốn, muộn | muống', 'Con mèo bắt ___. | chuột, chuộc, chuồn | chuột']),
    'v-uoi': G('v-uoi', 'van', 'van2', { 'uôi': ['chuối', 'muối', 'suối', 'tuổi', 'cuối'], 'uôm': ['buồm', 'nhuộm', 'muỗm'] },
      ['quả chuối', 'con suối', 'cánh buồm', 'nhuộm vải'], ['Bé ăn chuối.', 'Bé lên sáu tuổi.', 'Cánh buồm trắng.'],
      ['Bé ăn ___. | chuối, chồi, chối | chuối', 'Bé lên sáu ___. | tuổi, tươi, tối | tuổi']),
    'v-uon2': G('v-uon2', 'van', 'van2', { 'ươn': ['vườn', 'lươn', 'mượn', 'vượn', 'sườn'], 'ương': ['gương', 'giường', 'đường', 'sương', 'hương'], 'ươt': ['lướt', 'trượt', 'mượt', 'rượt'], 'ươc': ['nước', 'bước', 'thước', 'lược', 'rước'] },
      ['khu vườn', 'con lươn', 'con đường', 'cái gương', 'thước kẻ', 'cái lược'], ['Bé ra vườn.', 'Bé uống nước.', 'Bé chải tóc bằng lược.'],
      ['Bé uống ___. | nước, nướng, mượt | nước', 'Bé ra ___. | vườn, vượn, vương | vườn']),
    'v-uoi2': G('v-uoi2', 'van', 'van2', { 'ươi': ['lưới', 'tươi', 'cười', 'mười', 'bưởi'], 'ươu': ['hươu', 'bướu', 'khướu'], 'ươm': ['bướm', 'gươm', 'lượm', 'cườm'], 'ươp': ['mướp', 'ướp'] },
      ['quả bưởi', 'con hươu', 'con bướm', 'quả mướp', 'cá ướp'], ['Bé cười tươi.', 'Con bướm bay.', 'Bà cho bé quả bưởi.'],
      ['Con ___ bay. | bướm, bướu, buồm | bướm', 'Bà cho bé quả ___. | bưởi, bướm, buổi | bưởi']),
    'v-oa': G('v-oa', 'van', 'van3', { oa: ['hoa', 'loa', 'toa', 'xoa', 'khoa'], oe: ['xoe', 'loe', 'khoe', 'hoe'] },
      ['bông hoa', 'cái loa', 'toa tàu', 'tròn xoe'], ['Mẹ mua hoa.', 'Mắt bé tròn xoe.', 'Bé khoe bức tranh.'],
      ['Mẹ mua ___. | hoa, hoe, xoe | hoa', 'Mắt bé tròn ___. | xoe, xoa, khoe | xoe']),
    'v-oan': G('v-oan', 'van', 'van3', { oan: ['ngoan', 'khoan', 'toán', 'đoàn', 'loan'], 'oăn': ['xoăn', 'ngoằn', 'thoăn'], oat: ['hoạt', 'thoát', 'loát', 'soát'], 'oăt': ['loắt', 'choắt', 'thoắt'] },
      ['bé ngoan', 'học toán', 'tóc xoăn', 'hoạt hình', 'thoăn thoắt', 'loắt choắt'], ['Bé ngoan, học giỏi.', 'Tóc bé xoăn.', 'Bé xem hoạt hình.'],
      ['Bé ___, học giỏi. | ngoan, ngon, ngoằn | ngoan', 'Tóc bé ___. | xoăn, ngoan, khoan | xoăn']),
    'v-oai': G('v-oai', 'van', 'van3', { oai: ['ngoài', 'xoài', 'khoai', 'loài'], oay: ['xoáy', 'ngoáy', 'loay', 'hoay'] },
      ['quả xoài', 'củ khoai', 'ngoài sân', 'loay hoay', 'xoáy nước'], ['Bé ăn xoài.', 'Bé chơi ở ngoài sân.', 'Bà luộc khoai.'],
      ['Bé ăn ___. | xoài, xoáy, ngoáy | xoài', 'Bà luộc ___. | khoai, khoái, khay | khoai']),
    'v-oang': G('v-oang', 'van', 'van3', { oang: ['hoàng', 'khoang', 'choàng', 'loáng'], 'oăng': ['hoẵng', 'ngoẵng', 'loằng'], oanh: ['khoanh', 'doanh', 'loanh'], oach: ['hoạch', 'xoạch'] },
      ['áo choàng', 'khoanh tay', 'kế hoạch', 'loanh quanh', 'dài ngoẵng'], ['Bé khoanh tay.', 'Bé mặc áo choàng.', 'Cổ hươu dài ngoẵng.'],
      ['Bé ___ tay. | khoanh, khoang, khanh | khoanh', 'Bé mặc áo ___. | choàng, chàng, choàn | choàng']),
    'v-uy': G('v-uy', 'van', 'van3', { 'uê': ['huệ', 'thuê', 'thuế'], uy: ['huy', 'khuy', 'tuy', 'suy', 'duy'], 'uơ': ['huơ', 'thuở'] },
      ['hoa huệ', 'khuy áo', 'huơ tay', 'thuở bé'], ['Mẹ mua hoa huệ.', 'Bé cài khuy áo.', 'Bé huơ tay.'],
      ['Bé cài ___ áo. | khuy, khui, khuê | khuy', 'Mẹ mua hoa ___. | huệ, huy, hoe | huệ']),
    'v-uan': G('v-uan', 'van', 'van3', { 'uân': ['xuân', 'tuần', 'huấn', 'luận'], 'uât': ['thuật', 'xuất', 'luật', 'khuất'], uynh: ['huynh', 'khuỳnh'], uych: ['huých', 'huỵch'] },
      ['mùa xuân', 'tuần lễ', 'phụ huynh', 'kĩ thuật', 'luật lệ'], ['Mùa xuân, cây ra lá.', 'Phụ huynh đến lớp.'],
      ['Mùa ___, cây ra lá. | xuân, xuất, xoan | xuân']),
    'v-uyen': G('v-uyen', 'van', 'van3', { 'uyên': ['thuyền', 'chuyện', 'khuyên', 'truyện', 'luyện'], 'uyêt': ['tuyết', 'khuyết', 'duyệt'] },
      ['con thuyền', 'kể chuyện', 'truyện tranh', 'bông tuyết', 'trăng khuyết'], ['Bà kể chuyện cho bé nghe.', 'Con thuyền trên sông.', 'Bé thích đọc truyện.'],
      ['Bà kể ___ cho bé nghe. | chuyện, thuyền, tuyết | chuyện', 'Con ___ trên sông. | thuyền, thuyết, tuyền | thuyền'])
  };

  // Khóa ổn định của 10 nhóm có từ bản đầu (dùng để chuyển dữ liệu cũ).
  var LEGACY_KEYS = ['v-an', 'v-on', 'v-en', 'v-am', 'v-ai', 'v-oi', 'v-ao', 'v-at', 'v-ac', 'v-ang'];
  GROUPS.forEach(function (g, i) { g.key = LEGACY_KEYS[i]; g.kind = 'van'; g.stage = 'van1'; delete g.id; });
  var LEGACY = {};
  GROUPS.forEach(function (g) { LEGACY[g.key] = g; });

  // Thứ tự gợi ý, gần với tiến độ phổ biến của sách lớp 1. Giáo viên đổi được trong Cài đặt.
  var DEFAULT_ORDER = ['am-1', 'am-2', 'am-3', 'am-4', 'am-5', 'am-6', 'am-7', 'am-8', 'am-9', 'am-10',
    'v-an', 'v-on', 'v-en', 'v-am', 'v-om', 'v-em', 'v-ai', 'v-oi', 'v-ui', 'v-ao', 'v-eu',
    'v-ac', 'v-oc', 'v-at', 'v-ot', 'v-et', 'v-ap', 'v-op', 'v-ep', 'v-anh', 'v-ach', 'v-ang', 'v-ong',
    'v-ien', 'v-ieng', 'v-ieu', 'v-uon', 'v-uoi', 'v-uon2', 'v-uoi2',
    'v-oa', 'v-oan', 'v-oai', 'v-oang', 'v-uy', 'v-uan', 'v-uyen'];

  var STAGES = [
    { id: 'am', label: 'Âm và chữ ghi âm' },
    { id: 'van1', label: 'Vần cơ bản' },
    { id: 'van2', label: 'Vần có iê, uô, ươ' },
    { id: 'van3', label: 'Vần có âm đệm (oa, uê, uy…)' },
    { id: 'tu-them', label: 'Nhóm giáo viên thêm' }
  ];

  var CATALOG = {};
  AM_GROUPS.forEach(function (g) { CATALOG[g.key] = g; });
  Object.keys(NEW_VAN).forEach(function (k) { CATALOG[k] = NEW_VAN[k]; });
  Object.keys(LEGACY).forEach(function (k) { CATALOG[k] = LEGACY[k]; });

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // Danh sách nhóm đang dùng (đã sắp xếp, bỏ nhóm ẩn), đánh số lại 1, 2, 3…
  var ALL = [];
  function applyCurriculum(cur) {
    cur = cur || {};
    var edits = cur.edits || {};
    var custom = (cur.custom || []).map(function (c) { var g = clone(c); g.kind = 'van'; g.stage = 'tu-them'; return g; });
    var pool = {};
    Object.keys(CATALOG).forEach(function (k) { pool[k] = clone(CATALOG[k]); });
    custom.forEach(function (g) { pool[g.key] = g; });
    var order = (cur.order || DEFAULT_ORDER).filter(function (k) { return pool[k]; });
    DEFAULT_ORDER.concat(custom.map(function (g) { return g.key; })).forEach(function (k) { if (order.indexOf(k) === -1 && pool[k]) order.push(k); });
    var hidden = cur.hidden || [];
    ALL = order.map(function (k) {
      var g = pool[k], e = edits[k] || {};
      if (e.words) g.vans.forEach(function (v) { if (e.words[v] && e.words[v].length) g.words[v] = clone(e.words[v]); });
      if (e.phrases) g.phrases = clone(e.phrases);
      if (e.sentences) g.sentences = clone(e.sentences);
      if (e.fill) g.fill = clone(e.fill);
      g.title = g.vans.join(', ');
      g.hidden = hidden.indexOf(k) !== -1;
      g.edited = !!edits[k];
      return g;
    });
    var active = ALL.filter(function (g) { return !g.hidden; });
    active.forEach(function (g, i) { g.id = i + 1; });
    VV.data.GROUPS = active;
    GROUPS = active;
  }
  function allGroups() { return ALL; }
  function defaultsOf(key) { return CATALOG[key] ? clone(CATALOG[key]) : null; }

  // Đơn vị là âm đầu (phụ âm) hay vần (bắt đầu bằng nguyên âm).
  function isConsonantUnit(u) { return !!u && 'aăâeêioôơuưy'.indexOf(u[0]) === -1; }
  function matches(word, unit) {
    var p = VV.viet.parse(word);
    if (!p) return false;
    return isConsonantUnit(unit) ? p.initial === unit : p.van === unit;
  }
  function unitOf(group, word) {
    for (var i = 0; i < group.vans.length; i++) if (matches(word, group.vans[i])) return group.vans[i];
    return null;
  }
  function unitWord(u) { var g = groupOfVan(u); return g && g.kind === 'am' ? 'âm' : 'vần'; }
  function unitLabel(u) { return unitWord(u) + ' ' + u; }
  // Tìm nhóm và đơn vị chứa một tiếng (dùng cho thẻ mở từ mã QR).
  function findWord(word) {
    var w = String(word || '').toLowerCase();
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i];
      for (var j = 0; j < g.vans.length; j++) if (g.words[g.vans[j]].indexOf(w) !== -1) return { group: g, unit: g.vans[j] };
    }
    for (i = GROUPS.length - 1; i >= 0; i--) { var u = unitOf(GROUPS[i], w); if (u) return { group: GROUPS[i], unit: u }; }
    return null;
  }

  // Kho tiếng tại một vị trí: còn trong giai đoạn học âm thì chỉ cho phép âm đầu đã học.
  function khoAt(position, extraWords) {
    var learned = vansUpTo(position);
    var amGroups = GROUPS.filter(function (g) { return g.kind === 'am'; });
    var lastAm = amGroups.length ? amGroups[amGroups.length - 1].id : 0;
    var inAm = lastAm && position < lastAm;
    var vowels = learned.filter(function (u) { return !isConsonantUnit(u); });
    var vans = new Set(inAm ? vowels : BASE_VANS.concat(vowels));
    var initials = inAm ? new Set(learned.filter(isConsonantUnit)) : null;
    if (initials && initials.has('c')) initials.add('k');
    return { vans: vans, initials: initials, extra: new Set((extraWords || []).map(function (w) { return String(w).toLowerCase(); })) };
  }

  var READ_ERRORS = [
    { id: 'am-dau', label: 'Sai âm đầu' },
    { id: 'van', label: 'Sai vần' },
    { id: 'thanh', label: 'Sai thanh' },
    { id: 'danh-van', label: 'Còn đánh vần' },
    { id: 'chua-doc', label: 'Chưa đọc được' }
  ];
  var WRITE_CRITERIA = [
    { id: 'hinh-chu', label: 'Hình chữ' },
    { id: 'dau-thanh', label: 'Vị trí dấu thanh' },
    { id: 'khoang-cach', label: 'Khoảng cách' },
    { id: 'do-cao', label: 'Độ cao con chữ' }
  ];
  var INDEPENDENCE = [
    { id: 'tu-viet', label: 'Tự viết' },
    { id: 'nhin-mau', label: 'Nhìn mẫu' },
    { id: 'can-ho-tro', label: 'Cần hỗ trợ' }
  ];
  var LEVELS = [
    { id: 'ho-tro', label: 'Có hỗ trợ', hint: 'Có nghe mẫu, tô màu vần, ít lựa chọn.' },
    { id: 'tu-lam', label: 'Tự thực hiện', hint: 'Tự ghép, tự chọn, không có gợi ý.' },
    { id: 'van-dung', label: 'Vận dụng', hint: 'Dùng tiếng trong từ, câu mới.' }
  ];
  var PHASES = [
    { id: 'dau-vao', label: 'Đầu vào' },
    { id: 'thuong-xuyen', label: 'Thường xuyên' },
    { id: 'dau-ra', label: 'Đầu ra' }
  ];
  var HOME_STATUS = [
    { id: 'da-giao', label: 'Đã giao' },
    { id: 'da-lam', label: 'Đã làm' },
    { id: 'chua-lam', label: 'Chưa làm' }
  ];
  var HOME_SUPPORT = [
    { id: 'tu-lam', label: 'Con tự làm' },
    { id: 'nhac-nho', label: 'Cần nhắc' },
    { id: 'lam-cung', label: 'Bố mẹ làm cùng' }
  ];
  var TOPICS = ['Gia đình', 'Trường lớp', 'Con vật', 'Cây và quả', 'Thời tiết'];

  function groupOfVan(van) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].vans.indexOf(van) !== -1) return GROUPS[i];
    return null;
  }
  function allVans() {
    var out = [];
    GROUPS.forEach(function (g) { out = out.concat(g.vans); });
    return out;
  }
  function vansUpTo(groupId) {
    var out = [];
    GROUPS.forEach(function (g) { if (g.id <= groupId) out = out.concat(g.vans); });
    return out;
  }
  function label(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id;
  }

  VV.data = {
    BASE_VANS: BASE_VANS,
    GROUPS: GROUPS,
    STAGES: STAGES,
    DEFAULT_ORDER: DEFAULT_ORDER,
    LEGACY_KEYS: LEGACY_KEYS,
    applyCurriculum: applyCurriculum,
    allGroups: allGroups,
    isConsonantUnit: isConsonantUnit,
    matches: matches,
    unitOf: unitOf,
    unitWord: unitWord,
    unitLabel: unitLabel,
    findWord: findWord,
    khoAt: khoAt,
    READ_ERRORS: READ_ERRORS,
    WRITE_CRITERIA: WRITE_CRITERIA,
    INDEPENDENCE: INDEPENDENCE,
    LEVELS: LEVELS,
    PHASES: PHASES,
    TOPICS: TOPICS,
    HOME_STATUS: HOME_STATUS,
    HOME_SUPPORT: HOME_SUPPORT,
    groupOfVan: groupOfVan,
    defaultsOf: defaultsOf,
    allVans: allVans,
    vansUpTo: vansUpTo,
    label: label
  };
  applyCurriculum({});
})(window.VV = window.VV || {});
