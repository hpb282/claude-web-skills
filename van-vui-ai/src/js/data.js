/* Dữ liệu chương trình: 10 nhóm vần, tiếng, từ, câu, câu điền từ. Chỉ dùng vần đã học tới nhóm đó. */
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

  GROUPS.forEach(function (g) { g.title = g.vans.join(', '); });

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
    READ_ERRORS: READ_ERRORS,
    WRITE_CRITERIA: WRITE_CRITERIA,
    INDEPENDENCE: INDEPENDENCE,
    LEVELS: LEVELS,
    PHASES: PHASES,
    TOPICS: TOPICS,
    groupOfVan: groupOfVan,
    allVans: allVans,
    vansUpTo: vansUpTo,
    label: label
  };
})(window.VV = window.VV || {});
