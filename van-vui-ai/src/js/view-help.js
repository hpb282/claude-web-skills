/* Hướng dẫn sử dụng, kịch bản trình diễn 3 phút, câu hỏi thường gặp. */
(function (VV) {
  'use strict';
  var ui = VV.ui, S = VV.store;

  var DEMO = [
    { time: '0:00 đến 0:30', what: 'Nêu vấn đề: cùng một bài, mỗi em cần luyện những lỗi khác nhau.', act: 'demo-map', label: 'Mở bản đồ âm vần' },
    { time: '0:30 đến 1:10', what: 'Mở hai hồ sơ ẩn danh, giải thích lý do hệ thống gợi ý hai bài khác nhau.', act: 'demo-compare', label: 'So sánh hai hồ sơ' },
    { time: '1:10 đến 2:00', what: 'Chơi thử một nhiệm vụ. Cho thấy giáo viên duyệt bài và ghi nhận kết quả.', act: 'demo-play', label: 'Mở góc luyện tập' },
    { time: '2:00 đến 3:00', what: 'Trình bày minh chứng: kết quả đầu vào, đầu ra, công sức giáo viên, nhật ký chỉnh sửa học liệu AI.', act: 'demo-report', label: 'Mở báo cáo tiến bộ' }
  ];

  function render(root) {
    var st = S.state;
    root.innerHTML = '<section class="page help"><header class="page-head"><div><h1>Hướng dẫn</h1>' +
      '<p class="lede">Vần vui AI không dạy thay giáo viên. Học liệu số, AI hỗ trợ soạn bài và đánh giá của giáo viên đi cùng nhau trong một chu trình.</p></div></header>' +

      '<section class="panel"><h2 class="panel-title">Bắt đầu nhanh</h2><ol class="steps">' +
      '<li><b>Tạo lớp.</b> Vào Cài đặt, nhập tên lớp, chọn nhóm lớp đang học, thêm mã học sinh (HS01, HS02…).' + (st.isDemo ? ' Đang dùng dữ liệu mẫu: bấm Bắt đầu lớp mới ở mục Dữ liệu khi sẵn sàng.' : '') + ' <a href="#/cai-dat/lop">Mở Cài đặt lớp</a></li>' +
      '<li><b>Đo đầu vào.</b> Dùng bài đo đọc dạng A hoặc phiếu đọc nhanh; giáo viên nghe từng em đọc và ghi đúng, sai. <a href="#/danh-gia/ab">Mở bài đo A/B</a></li>' +
      '<li><b>Xem bản đồ âm vần.</b> Mỗi em có gợi ý vần cần luyện kèm lý do. Giao bài, hoặc đổi bài nếu giáo viên thấy cần. <a href="#/ban-do">Mở bản đồ</a></li>' +
      '<li><b>Soạn và duyệt học liệu.</b> Nhập API key nếu muốn AI soạn nháp; luôn kiểm tra kho tiếng và đáp án trước khi duyệt. <a href="#/tro-ly">Mở trợ lý soạn bài</a></li>' +
      '<li><b>Cho học sinh luyện.</b> Mở Góc luyện tập trên màn hình chung hoặc máy tính bảng; em chọn mã của mình và làm bài được giao.</li>' +
      '<li><b>Đối chiếu.</b> Sau một đến hai tuần, đo lại bằng dạng B và xem Báo cáo tiến bộ. <a href="#/bao-cao">Mở báo cáo</a></li>' +
      '</ol></section>' +

      '<section class="panel"><h2 class="panel-title">Chu trình dạy học</h2><div class="cycle">' +
      '<div><p class="cycle-name">Ghi nhận</p><p>Học sinh còn nhầm nhóm vần nào?</p><p class="muted">Phiếu đọc nhanh, bài đo A/B, chấm bài viết.</p></div>' +
      '<div><p class="cycle-name">Gợi ý</p><p>Bài luyện ngắn nào phù hợp với lỗi đó?</p><p class="muted">Bản đồ âm vần, trợ lý soạn bài, gói 5 phút cùng con.</p></div>' +
      '<div><p class="cycle-name">Đối chiếu</p><p>Ở bài mới, em đã làm tốt hơn chưa?</p><p class="muted">Đối chiếu theo buổi trong từng vần, báo cáo tiến bộ.</p></div>' +
      '</div></section>' +

      '<section class="panel"><h2 class="panel-title">Trình diễn sản phẩm trong 3 phút</h2>' +
      '<p class="muted">Kịch bản gợi ý cho buổi giới thiệu. Chỉ trình bày số liệu thu được thật; nếu chưa thử nghiệm, nói rõ đây là kế hoạch và mô phỏng.</p>' +
      '<ol class="demo-list">' + DEMO.map(function (d) {
        return '<li><span class="demo-time tnum">' + d.time + '</span><span>' + ui.esc(d.what) + '</span>' +
          '<button type="button" class="btn btn-sm" data-act="' + d.act + '">' + ui.esc(d.label) + '</button></li>';
      }).join('') + '</ol></section>' +

      '<div class="two-col"><section class="panel"><h2 class="panel-title">Phím tắt</h2><table class="table"><tbody>' +
      '<tr><th scope="row"><kbd>D</kbd></th><td>Phiếu đọc nhanh: tiếng đọc đúng</td></tr>' +
      '<tr><th scope="row"><kbd>S</kbd></th><td>Phiếu đọc nhanh: tiếng chưa đúng</td></tr>' +
      '<tr><th scope="row"><kbd>1</kbd> đến <kbd>5</kbd></th><td>Phiếu đọc nhanh: chọn loại lỗi sau khi bấm S</td></tr>' +
      '<tr><th scope="row"><kbd>←</kbd> <kbd>→</kbd></th><td>Phiếu đọc nhanh: chuyển tiếng</td></tr>' +
      '<tr><th scope="row"><kbd>1</kbd> đến <kbd>4</kbd></th><td>Góc luyện tập: chọn phương án</td></tr>' +
      '<tr><th scope="row"><kbd>Esc</kbd></th><td>Thoát Góc luyện tập, đóng menu</td></tr>' +
      '</tbody></table></section>' +

      '<section class="panel"><h2 class="panel-title">Câu hỏi thường gặp</h2>' +
      faq('Không có API key thì dùng được không?', 'Được. Mọi phần trừ AI soạn nháp đều chạy không cần key. Trợ lý soạn bài có nút Soạn từ mẫu có sẵn.') +
      faq('Mất mạng thì sao?', 'File chạy hoàn toàn trên máy. Khi mất mạng chỉ mất AI soạn nháp và phông chữ tải từ Google (trang tự dùng phông có sẵn). Luôn có phiếu giấy in sẵn để lớp tiếp tục hoạt động.') +
      faq('Dữ liệu lưu ở đâu?', 'Trong trình duyệt của máy đang dùng. Học sinh ghi bằng mã, không cần họ tên. Xuất bản sao lưu định kỳ ở Cài đặt, mục Dữ liệu; nhập lại trên máy khác khi cần.') +
      faq('Vì sao nút nghe không phát âm?', 'Vào Cài đặt, Giọng đọc, bấm Nghe thử. Nếu vẫn im lặng: kiểm tra loa và âm lượng, chọn một giọng không ghi “cần mạng”, hoặc cài giọng tiếng Việt cho hệ điều hành rồi mở lại trang. App tự chuyển giọng khi giọng đang dùng không đọc. Trong lúc đó giáo viên đọc mẫu trực tiếp.') +
      faq('AI lúc được lúc không?', 'App tự thử lại tối đa 3 lần khi mạng chập hoặc máy chủ AI bận, và nhận câu trả lời dần dần nên ít bị ngắt giữa chừng. Nếu vẫn lỗi: bấm Kiểm tra kết nối trong Cài đặt để xem lý do (sai key, hết hạn mức, máy chủ quá tải). Chọn Ghi nhớ key để không phải nhập lại mỗi lần mở trang.') +
      faq('Mã QR trên thẻ hoạt động thế nào?', 'Đăng file lên một địa chỉ web, nhập địa chỉ ở Cài đặt, mục Mã QR. Thẻ in ra có mã; điện thoại quét sẽ mở thẻ để nghe đọc, ghép tiếng và viết.') +
      faq('AI có chấm phát âm, chữ viết không?', 'Không. Giáo viên nghe đọc và chấm bài viết theo tiêu chí. Kết quả trò chơi chỉ phản ánh khả năng nhận diện.') +
      faq('Làm sao cho khớp bộ sách của trường?', 'Cài đặt, mục Nội dung bài học: ẩn nhóm lớp không học, đổi thứ tự bằng mũi tên, thêm nhóm vần còn thiếu, sửa tiếng, từ, câu của từng nhóm. Kết quả đã ghi không mất khi ẩn hay đổi thứ tự.') +
      '</section></div></section>';
  }

  function faq(q, a) { return '<details class="details"><summary>' + ui.esc(q) + '</summary><p>' + ui.esc(a) + '</p></details>'; }

  VV.views['huong-dan'] = {
    render: render,
    act: {
      'demo-map': function () { VV.app.go('ban-do'); },
      'demo-compare': function () { VV.views['ban-do'].setCompare(true); VV.app.go('ban-do'); },
      'demo-play': function () { VV.studentMode.open({}); },
      'demo-report': function () { VV.app.go('bao-cao'); }
    }
  };
})(window.VV = window.VV || {});
