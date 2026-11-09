# Mầm chữ — Bài thuyết trình HTML

12 slide tỉ lệ 16:9, khoảng 7 phút. Phát triển từ bảng màu và các tài nguyên của Mầm chữ; dùng trực tiếp `SeedScene`, ví dụ học liệu, bộ kiểm tra và áp dụng sửa của web. Không sửa luồng học hay dữ liệu học sinh.

Hiệu ứng lấy cảm hứng từ video tham khảo: rèm sân khấu, các dải trượt nối cảnh, cửa mở có phối cảnh, các lớp hình vào theo nhịp. Màu xanh lá, kem, vàng và hồng bám nhận diện Mầm chữ. Chuyển động có chế độ rút gọn và tôn trọng thiết lập của hệ điều hành.

Trong mã nguồn đang chạy Vite: mở `/slides.html`.

```bash
npm run build:slides
# Sau đó đặt index.html và original.html của gói HTML hiện có cạnh slides-ready/slides.html.
npm run test:slides
```

- `←`, `→`, Space: đổi slide. Home/End: đầu/cuối.
- F: toàn màn hình; O: mục lục; N: ghi chú; M: giảm chuyển động.
- Chủ đề, loại hạt, ghép đoạn và bài tập trên slide có thể bấm thử.
- Ghi chú mở trên cùng màn hình, không phải chế độ màn hình phụ của PowerPoint.
- Khi chuyển sang ứng dụng thật, nút mở tab mới để giữ bài trình chiếu.
- Tải ZIP và mở `slides.html` qua Live Server; mọi tài nguyên của slide được nhúng, không cần npm.

Nội dung, lời dẫn và mục đích từng slide ở `content.js`; giao diện ở `templates.js` và `style.css`; điều khiển và chuyển cảnh ở `main.js`. Ảnh chụp giao diện trong `assets/` dùng dữ liệu minh họa tự biên soạn.
