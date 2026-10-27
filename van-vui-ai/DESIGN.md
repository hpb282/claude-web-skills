# Ghi chú thiết kế

## Chủ đề và người dùng
Giáo viên lớp 1 (dùng chính) và học sinh 6 tuổi (Góc luyện tập trên màn hình chung hoặc máy tính bảng). Việc chính: biết em nào cần luyện vần gì tiếp theo, vì sao.

## Bảng màu (giữ nhận diện từ file trình bày Vần vui AI)
| Tên | Hex | Vai trò |
|---|---|---|
| Rêu | `#1B3D35` | chữ, thanh bên, nút chính |
| Giấy | `#F6F1EA` | nền trang |
| Lá non | `#DCE6D0` | vần đã vững |
| Nghệ | `#E5C15F` | chỉ dùng cho AI và nút mở Góc luyện tập |
| Gạch | `#B5482F` | vần cần luyện, phần vần trong tiếng |
| Mực ô li | `#C3BADF` / `#E3DEF1` | dòng kẻ ô li như vở học sinh |

Biểu đồ: đầu vào `#B07D1E`, đầu ra `#0E7C61` (đã qua bộ kiểm tra màu cho người mù màu).

## Chữ
- **Be Vietnam Pro**: mọi chữ giao diện giáo viên.
- **Andika**: mọi chữ học sinh đọc (vần, tiếng, câu). Andika được thiết kế cho người mới tập đọc, chữ "a" một tầng giống chữ viết tay.

## Bố cục
```
┌──────────┬──────────────────────────────────────────┐
│ Thanh bên│ Tiêu đề, mô tả                            │
│ (rêu)    │ [HS01][HS02]…                             │
│          │ ┌──── giấy ô li ─────────┐ ┌───────────┐ │
│          │ │ Nhóm 1  an  ăn  ân     │ │ Gợi ý     │ │
│          │ │ Nhóm 2  on  ôn  ơn     │ │ an (lớn)  │ │
│          │ │ …                      │ │ lý do     │ │
│          │ └────────────────────────┘ │ [Giao bài]│ │
│          │                            └───────────┘ │
└──────────┴──────────────────────────────────────────┘
```
Căn trái toàn bộ, trừ Góc luyện tập căn giữa.

## Nguyên tắc riêng
1. Điểm nhấn duy nhất là giấy ô li: bản đồ âm vần, khung viết, Góc luyện tập, màn hình phiếu đọc.
2. Màu có nghĩa: gạch là cần luyện, lá non là vững, nghệ là AI. Không dùng màu để trang trí.
3. Mọi nội dung AI soạn là "bản nháp" cho tới khi giáo viên duyệt.
4. Chữ dành cho trẻ luôn là Andika, cỡ lớn, phần vần tô màu gạch.

## Đã đổi so với dữ liệu tra cứu ban đầu
Dữ liệu tham khảo gợi ý chàm + cam + claymorphism + Comic Neue. Bỏ vì: trùng mặc định của mọi app giáo dục, Comic Neue thiếu dấu tiếng Việt, và file trình bày của khách đã có nhận diện riêng.

## Chuyển động
- Trang giáo viên: chỉ có hiệu ứng nhấn (scale 0.96). Chuyển trang tức thì. Phím tắt không có hiệu ứng.
- Góc luyện tập: câu hỏi mới hiện rõ dần (mờ, dịch 8px, nhòe 4px, 340ms), các lựa chọn nối tiếp nhau; đúng thì nhấp nhẹ, sai thì rung ngắn. Có màu và chữ đi kèm, không chỉ dựa vào chuyển động.
- Tôn trọng `prefers-reduced-motion`.
- Không dùng GSAP để file HTML chạy được khi mất mạng.
