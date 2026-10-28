# Vần vui AI

Học liệu số hỗ trợ luyện đọc, viết cho học sinh lớp 1. Giáo viên ghi nhận lỗi đọc, hệ thống gợi ý bài luyện phù hợp và giải thích lý do, AI hỗ trợ soạn bản nháp học liệu, giáo viên duyệt rồi mới dùng.

## Cách mở

- **Dùng ngay:** mở file `dist/van-vui-ai.html` bằng Chrome, Edge, Safari hoặc Firefox. Không cần cài đặt, không cần máy chủ.
- **Mã nguồn:** thư mục `src/`. Mở `src/index.html` cũng chạy được trực tiếp.
- **Đóng gói lại thành một file:** `python3 tools/build.py` (tạo lại `dist/van-vui-ai.html`).
- **Kiểm tra dữ liệu bài học:** `node tools/check-data.js` (47 nhóm âm, vần; mỗi câu, từ chỉ dùng âm, vần đã học tới nhóm đó).

Lần đầu mở, app có sẵn dữ liệu mẫu của 8 học sinh giả lập để xem thử. Vào **Cài đặt, Dữ liệu, Bắt đầu lớp mới** để xóa dữ liệu mẫu và nhập lớp thật.

## Kết nối AI

Vào **Cài đặt, Kết nối AI**:

1. Chọn nhà cung cấp: Claude (Anthropic), OpenAI, Google Gemini, hoặc dịch vụ tương thích OpenAI (OpenRouter, Groq, máy chủ nội bộ… cần nhập địa chỉ API).
2. Dán API key, kiểm tra tên model (mặc định Claude là `claude-opus-5-5`).
3. Bấm **Kiểm tra kết nối**.

- Key được gửi thẳng từ trình duyệt tới nhà cung cấp, không qua máy chủ nào khác.
- Bỏ chọn "Ghi nhớ key" khi dùng máy chung: key sẽ mất khi đóng thẻ.
- Chỉ gửi cho AI: vần, yêu cầu cần đạt, loại lỗi và danh sách vần trong kho tiếng. Không gửi mã học sinh, kết quả hay ảnh bài viết.
- Mạng chập hoặc máy chủ AI bận (lỗi 429, 5xx, 529): app tự thử lại tối đa 3 lần, chờ tăng dần. Câu trả lời được nhận dần (streaming) nên không bị ngắt khi AI soạn lâu; với Claude, câu trả lời được ép theo khuôn JSON nên không hỏng định dạng.
- Không có key hoặc mất mạng: mọi công cụ soạn bài vẫn có nút **Soạn từ mẫu có sẵn**.

## Các chức năng (theo đề xuất sản phẩm)

| Thành phần | Trong app |
|---|---|
| Bản đồ âm vần cá nhân (ưu tiên) | Lưới các nhóm đã học trên nền giấy ô li, gom theo giai đoạn (giai đoạn đã vững tự thu gọn); mỗi âm, vần ghi số tiếng đọc đúng trong 6 lần gần nhất. Gợi ý vần cần luyện, mức độ và lý do. Giao bài, đổi bài, so sánh hai hồ sơ. |
| 1. Bài học số | 47 nhóm cả năm lớp 1 (phần âm và mọi vần), chia theo giai đoạn: âm hoặc vần, tiếng (tô màu phần cần chú ý), thẻ biết nói, từ ngữ, câu, khung luyện viết ô li bằng tay hoặc bút cảm ứng. In thẻ vần và phiếu luyện viết. |
| 2. Trò chơi tương tác | Nhận diện vần, ghép tiếng, chọn từ đúng, hoàn thành câu. Góc luyện tập toàn màn hình cho học sinh, có đọc mẫu bằng giọng tiếng Việt của máy. |
| 3. Trợ lý tạo học liệu AI | Bài tập theo 3 mức (có hỗ trợ, tự thực hiện, vận dụng), truyện đúng vần, gói "5 phút cùng con" (bản điện thoại và bản giấy), phiếu luyện viết. Mọi tiếng ngoài kho bị đánh dấu; giáo viên sửa, duyệt rồi mới lưu vào kho học liệu. |
| 4. Công cụ đánh giá | Phiếu đọc nhanh (màn hình cho học sinh, phím tắt D/S cho giáo viên), bài đo đọc A/B 20 tiếng, chấm bài viết theo tiêu chí kèm ảnh, đọc hiểu, nhật ký lỗi xuất CSV. |
| 5. Báo cáo tiến bộ | Đầu vào so với đầu ra theo học sinh và nhóm vần, loại lỗi, bài viết đầu và mới nhất, luyện ở nhà, học liệu do AI soạn, công sức giáo viên. In báo cáo, xuất CSV. |
| Thẻ vần biết nói (Hướng 3) | Thẻ in kèm mã QR; điện thoại quét mở thẻ: đọc tiếng không dấu, thêm dấu, viết vào vở, chuyển sang thẻ khác hoặc luyện vần đó. |
| Xưởng truyện đúng vần (Hướng 2) | Trợ lý soạn truyện theo kho tiếng, đánh dấu tiếng vượt nội dung đã học, giáo viên sửa rồi duyệt. |
| Nét chữ lớn lên (Hướng 4) | Hồ sơ bài viết theo thời gian, so sánh bài đầu với bài mới nhất, gợi ý phiếu luyện viết theo tiêu chí còn yếu. |
| 5 phút cùng con (Hướng 5) | Gói có bản điện thoại và bản giấy, giao về nhà cho từng em, ghi nhận đã làm hay chưa và mức cần trợ giúp, tính tỷ lệ tham gia. |
| Minh chứng | Nhật ký chỉnh sửa học liệu AI (bản AI gốc, từng chỗ giáo viên sửa, tiếng ngoài kho lúc nhận và lúc duyệt), đối chiếu kết quả từng vần theo buổi, nhật ký công sức giáo viên. |
| Hướng dẫn | Bắt đầu nhanh, chu trình Ghi nhận, Gợi ý, Đối chiếu, kịch bản trình diễn 3 phút có nút mở thẳng từng màn hình, phím tắt, câu hỏi thường gặp. |

## Mã QR cho thẻ vần

Mã QR chỉ mở được trên điện thoại khi file đã được đăng lên một địa chỉ web (GitHub Pages, Google Sites, máy chủ của trường…). Vào **Cài đặt → Mã QR**, dán địa chỉ, quét thử mã mẫu. Thẻ in ra từ trang Bài học sẽ có mã mở đúng thẻ đó. Mã QR được tạo ngay trong file, không cần mạng.

## Chương trình

Có sẵn **47 nhóm, 158 âm và vần** của lớp 1, chia 4 giai đoạn:

| Giai đoạn | Nhóm |
|---|---|
| Âm và chữ ghi âm (10 nhóm) | a b c; e ê o ô; ơ d đ; i k h l; u ư ch kh; m n g gi; gh nh ng ngh; r s t tr; th ia ua ưa; ph qu v x |
| Vần cơ bản (23 nhóm) | an ăn ân; on ôn ơn; en ên in un; am ăm âm; om ôm ơm; em êm im um; ai ay ây; oi ôi ơi; ui ưi; ao eo au âu; êu iu ưu; ac ăc âc; oc ôc uc ưc; at ăt ât; ot ôt ơt; et êt it ut ưt; ap ăp âp; op ôp ơp; ep êp ip up; anh ênh inh; ach êch ich; ang ăng âng; ong ông ung ưng |
| Vần có iê, uô, ươ (7 nhóm) | iên yên iêt; iêng iêc iêm iêp; iêu yêu; uôn uông uôt uôc; uôi uôm; ươn ương ươt ươc; ươi ươu ươm ươp |
| Vần có âm đệm (7 nhóm) | oa oe; oan oăn oat oăt; oai oay; oang oăng oanh oach; uê uy uơ; uân uât uynh uych; uyên uyêt |

Thứ tự là gợi ý theo tiến độ phổ biến, chưa bám riêng bộ sách nào. Trong giai đoạn học âm, kho tiếng kiểm tra cả âm đầu: tiếng có chữ chưa học sẽ bị đánh dấu.

## Sửa nội dung cho đúng bộ sách

**Cài đặt → Nội dung bài học**:

- **Danh sách nhóm:** bỏ chọn "Dùng" để ẩn nhóm lớp không học, dùng mũi tên để đổi thứ tự, "Thêm nhóm vần" cho vần sách có mà danh sách chưa có (ví dụ `oong: boong, xoong`). Kết quả đã ghi không mất khi ẩn hay đổi thứ tự.
- **Sửa nhóm:** tiếng (2 đến 8 tiếng mỗi âm, vần), từ ngữ, câu, câu điền từ. Tiếng sai âm, vần bị chặn; câu có tiếng chưa học được cảnh báo. Có nút khôi phục nội dung gốc.
- **Cách đặt dấu với oa, oe, uy:** kiểu mới (hoà, khoẻ, thuỷ) hoặc kiểu cũ (hòa, khỏe, thủy), chọn theo sách lớp đang dùng.

## Dữ liệu

- Lưu trong trình duyệt của máy đang dùng (IndexedDB, đủ cho dữ liệu cả năm học của một lớp; trình duyệt không hỗ trợ thì tự dùng localStorage). Dùng **Xuất bản sao lưu** định kỳ; nhập lại trên máy khác bằng **Nhập bản sao lưu**.
- Học sinh được ghi bằng mã (HS01, HS02…), không cần họ tên.
- Ảnh bài viết được thu nhỏ trước khi lưu.

## Giọng đọc

Nút nghe dùng giọng tiếng Việt có sẵn trong hệ điều hành. App luôn thử đọc (kể cả khi máy không liệt kê giọng, như nhiều điện thoại Android), ưu tiên giọng cài trong máy, tự chuyển sang giọng khác nếu giọng đang dùng không phát tiếng. Kiểm tra ở **Cài đặt → Giọng đọc → Nghe thử**. Nếu máy chưa có giọng: Windows vào Cài đặt, Thời gian và ngôn ngữ, Giọng nói, thêm Tiếng Việt; Android và iPhone cài giọng tiếng Việt trong mục chuyển văn bản thành giọng nói.

## Cấu trúc

```
src/
  index.html          khung trang
  css/app.css         giao diện, in ấn
  js/viet.js          tách tiếng thành âm đầu + vần + thanh, ghép tiếng, kiểm tra kho tiếng
  js/qr.js            tạo mã QR không cần thư viện ngoài
  js/data.js          47 nhóm âm, vần (tiếng, từ, câu); thứ tự, ẩn, thêm nhóm
  js/store.js         lưu trữ, dữ liệu mẫu, bản đồ âm vần, gợi ý
  js/ai.js            gọi Claude / OpenAI / Gemini, soạn từ mẫu
  js/ui.js            hàm giao diện dùng chung
  js/app.js           điều hướng
  js/view-*.js        từng màn hình
  js/games.js         trò chơi, Góc luyện tập, thẻ vần mở từ mã QR
  js/view-help.js     trang Hướng dẫn
tools/build.py        gộp thành một file HTML
tools/check-data.js   kiểm tra dữ liệu bài học
dist/van-vui-ai.html  bản chạy trực tiếp
```

## Giới hạn

- Hệ thống không tự chấm phát âm hay chữ viết; giáo viên nghe và ghi.
- Kết quả trò chơi chỉ phản ánh khả năng nhận diện, không thay cho việc nghe em đọc.
- Số liệu mẫu là giả lập. Khi báo cáo, chỉ trình bày số liệu thu được thật.
