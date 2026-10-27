# Menu Skill làm web đẹp

Kho này chứa 6 Claude Code Skills trong `.claude/skills/` cho HTML, CSS, JS, UI/UX và animation.

## Cách Claude xử lý lệnh tắt

Khi tin nhắn của người dùng có một lệnh tắt dưới đây (đứng ở bất kỳ vị trí nào trong câu), Claude phải gọi tool `Skill` với tên skill tương ứng **trước khi** làm bất cứ việc gì khác, rồi làm theo hướng dẫn của skill đó. Phần chữ còn lại trong tin nhắn là yêu cầu cụ thể (brief, file cần review…).

| Lệnh tắt | Skill | Dùng khi |
|----------|-------|----------|
| `@design` | `frontend-design` | Định hướng thẩm mỹ, chọn font, bảng màu, bố cục cho trang mới hoặc làm lại giao diện. Tránh kiểu "template AI". |
| `@polish` | `interface-polish` | Mài chi tiết: border-radius đồng tâm, shadow nhiều lớp, `scale(0.96)` khi nhấn, `tabular-nums`, căn quang học, không `transition: all`. |
| `@gsap` | `gsap-animation` | Animation bằng GSAP: timeline, ScrollTrigger, Flip, SplitText, `gsap.matchMedia()`, `autoAlpha`, tối ưu GPU. |
| `@motion` | `motion-principles` | Tạo (Create) hoặc kiểm tra (Audit) chuyển động theo 3 góc nhìn Emil Kowalski, Jakub Krehel, Jhey Tompkins. |
| `@vercel` | `vercel-guidelines` | Rà soát theo Vercel Web Interface Guidelines: a11y, focus, form, CLS, hiệu năng, typography. Xuất lỗi dạng `file:line`. |
| `@uipro` | `ui-ux-pro-max` | Tra cứu dữ liệu thiết kế: 50 UI style, bảng màu theo ngành, cặp font, 119 quy tắc UX, danh sách anti-pattern. |
| `@all-web` | cả 6 skill | Quy trình đầy đủ từ ý tưởng đến kiểm tra cuối (xem bên dưới). |

Có thể ghép nhiều lệnh tắt trong một tin nhắn, ví dụ `@design @gsap trang landing cho quán cà phê`. Khi đó gọi lần lượt từng skill theo thứ tự trong quy trình `@all-web`.

Không có lệnh tắt nào thì Claude vẫn tự chọn skill phù hợp dựa trên mô tả của từng skill.

## Quy trình `@all-web`

Gọi các skill theo đúng thứ tự, mỗi bước chỉ nạp skill khi tới bước đó:

1. **`ui-ux-pro-max`** — xác định loại sản phẩm, đối tượng, stack; chạy `--design-system` để lấy dữ liệu tham khảo (style, màu, font, anti-pattern). Kết quả là nguyên liệu, chưa phải quyết định cuối.
2. **`frontend-design`** — lập design plan (4–6 màu hex, font và vai trò, bố cục kèm wireframe ASCII, nguyên tắc riêng), tự phản biện để loại các lựa chọn mặc định, rồi mới viết code.
3. **`gsap-animation`** và/hoặc **`motion-principles`** (chế độ Create) — thêm chuyển động có mục đích. Dùng GSAP cho timeline/scroll/text phức tạp; CSS transition cho tương tác đơn giản.
4. **`interface-polish`** — mài chi tiết bề mặt, chữ, icon, hiệu ứng nhấn.
5. **`vercel-guidelines`** — rà soát cuối theo dạng `file:line`, sửa hết lỗi trước khi giao.
6. **`motion-principles`** (chế độ Audit) — chỉ chạy khi trang có nhiều chuyển động.

## Khi các skill mâu thuẫn nhau

Theo thứ tự ưu tiên sau (cao xuống thấp):

1. Yêu cầu rõ ràng của người dùng trong brief.
2. Khả năng truy cập và an toàn: `prefers-reduced-motion`, focus nhìn thấy được, độ tương phản, vùng chạm tối thiểu (`vercel-guidelines`, `ui-ux-pro-max`).
3. Định hướng thẩm mỹ từ `frontend-design` — vượt trên các gợi ý style/màu/font của `ui-ux-pro-max`, vì dữ liệu tra cứu dễ dẫn tới lựa chọn mặc định.
4. Mức độ chuyển động: `frontend-design` và `motion-principles` (Frequency Gate) thắng khi `ui-ux-pro-max` hoặc GSAP gợi ý thêm hiệu ứng. Tương tác lặp lại nhiều lần thì không animate.
5. Chi tiết kỹ thuật: `interface-polish` và `vercel-guidelines`.

Một mâu thuẫn đã biết: `vercel-guidelines` muốn Title Case cho tiêu đề và nút, còn `frontend-design` muốn sentence case. Mặc định dùng sentence case; nếu nội dung là tiếng Việt thì luôn dùng sentence case.

## Ghi chú cho người dùng

- Trong Claude Code, gõ `@` sẽ mở gợi ý chọn file; cứ gõ tiếp `@design` rồi nhấn Space là được, Claude vẫn đọc được lệnh tắt.
- Cũng có thể gọi trực tiếp bằng slash command: `/frontend-design`, `/interface-polish`, `/gsap-animation`, `/motion-principles`, `/vercel-guidelines`, `/ui-ux-pro-max`.
- `ui-ux-pro-max` cần Python 3 để chạy script tra cứu (`.claude/skills/ui-ux-pro-max/scripts/search.py`).
- Nguồn gốc và giấy phép của từng skill: xem `.claude/skills/SOURCES.md`.
