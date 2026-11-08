# Nike — A new perspective

Bản web tương tác dựng theo video tham chiếu: giày nổi trong không gian, trang chi tiết sản phẩm, quần áo trên móc treo giữa phong cảnh và lookbook có điểm chọn sản phẩm.

## Chạy web

Yêu cầu Node.js 22.12 trở lên (môi trường hiện tại dùng Node.js 24).

```bash
cd web
npm ci
npm run dev
```

Sau khi tải ZIP từ GitHub, giải nén và mở terminal ở thư mục repository trước khi chạy các lệnh trên. Nếu đang ở ngay thư mục `web`, bỏ qua lệnh `cd web`. Vite mặc định chạy ở cổng 5173.

Trong môi trường đám mây hiện tại, ứng dụng nằm tại `/workspace/claude-web-skills/web`. Nếu npm không ghi được cache mặc định, dùng `npm ci --cache /tmp/nike-npm-cache`.

Thư mục này là ứng dụng riêng; các skill có sẵn trong repository được giữ nguyên. Dùng checkout hiện có, không cần tạo Git worktree.

## Các tương tác đã dựng

- **Footwear:** Nike Air Mag 3D thật bằng Three.js; kéo để xoay hoặc dùng nút xoay; carousel giày nổi; chuyển cảnh và phóng sản phẩm bằng GSAP.
- **Everyday layers:** bốn mẫu áo trên móc treo, nền núi, hiệu ứng phối cảnh khi hover và chuyển sang chi tiết sản phẩm.
- **Shop the look:** bốn người mẫu, chuyển cảnh có chiều sâu, hotspot chọn áo/giày, chọn size từng món và thêm cả bộ vào giỏ.
- Chọn màu/size, bảng size, yêu thích, tìm kiếm, giỏ hàng, điều chỉnh số lượng và lưu trạng thái giỏ/yêu thích trong localStorage.
- Bố cục điện thoại, điều hướng bàn phím, focus trong dialog, thông báo trạng thái và tôn trọng `prefers-reduced-motion`. Có nút tắt chuyển động.

Đây là bản tái tạo trải nghiệm, có thay thế tài nguyên: chỉ Air Mag là mô hình 3D đầy đủ; ba mẫu giày còn lại dùng ảnh PNG trên mặt phẳng 3D. Quần áo và người mẫu là ảnh, chuyển động bằng CSS/GSAP. Hình quần áo, người mẫu và phong cảnh được tạo cho bản demo. Tên, giá và phối màu mang tính minh họa. Giỏ hàng chạy tại trình duyệt; chưa tích hợp máy chủ, thanh toán hoặc tồn kho.

Tất cả font, hình ảnh, mô hình và bộ giải mã Draco được phục vụ cục bộ, không cần CDN khi chạy.

## Build và kiểm thử

```bash
npm run build
npm run preview
npm test
```

Build tạo thư mục `dist/`, có thể phục vụ bằng bất kỳ static server nào tại đường dẫn gốc của website. Cần HTTP server; không mở `index.html` trực tiếp qua `file://`.

Playwright tự dùng `/usr/bin/chromium` nếu có. Trên máy khác, chạy `npx playwright install chromium` trước hoặc đặt biến `CHROMIUM_PATH` trỏ đến Chromium. Bộ kiểm thử kiểm tra WebGL, đổi sản phẩm, xác thực size, giỏ hàng và lưu trạng thái, tìm kiếm, yêu thích, tủ đồ, mua cả bộ, bố cục điện thoại và reduced motion.

## Ghi chú thiết kế

- Nền `#f6f5f1`, mực `#20211f`, xám `#777970`, đường phân cách `#dedfd7`, xanh `#46694a`.
- Barlow Condensed cho tiêu đề thể thao; DM Sans cho nội dung và điều khiển.
- Giữ khung điều hướng yên tĩnh, dành không gian cho sản phẩm. Ba cảnh dùng chung header/footer, chuyển qua tab mà không tải lại trang.
- Giày có chuyển động nổi nhẹ; thao tác chọn sản phẩm là chuyển động chính. Tủ đồ có điểm treo làm gốc xoay; lookbook dùng phối cảnh bằng vị trí, tỉ lệ và độ mờ.
- Có điều khiển thay thế cho thao tác kéo. Dừng render khi tab trình duyệt bị ẩn, cảnh không hiển thị hoặc drawer đang mở.

Nguồn tài nguyên và giấy phép: [ASSETS.md](ASSETS.md).
