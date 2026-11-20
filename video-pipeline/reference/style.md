# VISUAL DNA — "first-person night vehicle"

Phân tích từ video tham chiếu 89.6s (thriller phà đêm, dọc 9:16) và các frame caption đã trích.
Đây là đặc tả để mọi tập mới trông cùng một "thương hiệu", không phải bản sao nội dung.

---

## 1. Khung nhìn

- **Máy đặt trong cabin**, ngang tầm mắt người lái; tay và vô lăng ở đáy khung.
- Kính chắn gió chiếm 55–70% chiều cao; thế giới bên ngoài luôn xa, tối, ướt.
- Người xem là nhân vật: không bao giờ thấy mặt nhân vật chính, chỉ thấy tay và phản chiếu.
- Cắt cảnh xen **insert cận** (đài, công tắc, gương, đồng hồ) để đổi nhịp.
- Cảnh "nhìn thẳng vào camera" chỉ dành cho thứ đáng sợ (đám đông, mắt trong tối).

## 2. Bảng màu

| Token | Hex | Dùng |
|---|---|---|
| `ink` | `#05080F` | đen nền, bóng |
| `night` | `#0A1730` | trời đêm |
| `night2` | `#122A4A` | mây/không gian |
| `horizon` | `#1E4670` | đường chân trời |
| `sea` | `#071426` | mặt nước |
| `steel` | `#1B2A40` | nội thất, kim loại |
| `cream` | `#F4EEE2` | chữ phụ, giấy |
| `muted` | `#8FA3BC` | chữ HUD phụ |
| `amber` | `#F2B33D` | đèn bến, HUD chính |
| `amber2` | `#FFD24A` | **accent caption** |
| `red` | `#E8402F` | **cảnh báo caption** |
| `green` | `#5BE08A` | trạng thái OK |
| `skin` | `#D99A6C` | tay |
| `glass` | `#7FB4E8` | phản chiếu kính |

Luật: nền **xanh đêm gần đen**, điểm sáng chỉ có 2 màu — **hổ phách** (đèn, HUD) và **trắng lạnh** (trăng, đèn pha).
Đỏ chỉ xuất hiện khi có nguy hiểm hoặc ở caption cảnh báo.

## 3. Ánh sáng

- Một nguồn chính: trăng/đèn bến phía sau, tạo silhouette.
- Một nguồn phụ: HUD/đài hắt lên tay và kính.
- `LightPool` là **radial gradient**, không có vành tròn nhìn thấy.
- Cảnh tối tuyệt đối vẫn có 1 điểm sáng nhỏ (mắt, đèn LED, khe cửa).
- Không dùng đèn phẳng; mọi mảng sáng đều có falloff.

## 4. Chữ và caption

Đo từ frame tham chiếu:

- Font **Anton** (condensed, all-caps). Bề rộng thực tế: chữ hoa ≈ **0.48 em**, space ≈ **0.23 em**, M/W ≈ **0.71–0.75 em**.
- Cỡ 96–112 px trên canvas 1080; một dòng tối đa ~**900 px** (`maxWidth`).
- **Nền trắng tuyệt đối**, viền đen dày (~0.06 em), drop shadow lệch xuống.
- Từ nhấn: **vàng `#FFD24A`** hoặc **đỏ `#E8402F`**, kèm **gạch chân cùng màu**, dày ~0.05 em, cách baseline ~0.12 em.
- Nhiều từ nhấn liền nhau → **một gạch liền**, không rời từng từ.
- Câu ngắn 2–5 từ, có dấu chấm. Không xuống 2 dòng nếu tránh được.
- Vị trí dọc **thay đổi có chủ ý**: 760 (trên), 900 (giữa), 1030–1200 (dưới) — để không thành một dải đứng.
- Xuất hiện tức thì (1–2 frame), không chạy chữ, không karaoke, không bounce.

Nhịp caption: **1–2 cue/cảnh**, mỗi cue 1.5–2.5s, không chồng.

## 5. Bố cục dọc

- Vùng an toàn: trên 120 px (HUD), dưới 260 px (UI TikTok).
- Chủ thể chính nằm trong dải y 500–1250 (canvas).
- Caption không bao giờ đè mặt/mắt; nếu cảnh có mắt thì caption xuống dưới.
- HUD ở góc trên trái/phải, chữ mono nhỏ, không bao giờ to hơn caption.

## 6. Chuyển động

- **Push-in chậm** 1.00 → 1.04–1.08 suốt cảnh (`push`).
- Rung nhẹ theo nhịp máy nổ; mưa và nước luôn động.
- Cắt cứng, không transition mềm. Twist đi kèm **flash 1 frame** hoặc **shake 6–10 frame**.
- Không zoom nhanh, không xoay, không whip pan.

## 7. Nhịp và cấu trúc

| Phần | Tỉ lệ | Nội dung |
|---|---|---|
| Mở | 0–15% | bối cảnh + quy tắc bình thường |
| Gieo | 15–40% | một chi tiết sai (đếm, bóng, âm thanh) |
| Twist | 40–65% | chi tiết sai thành hiển nhiên |
| Leo | 65–85% | nhân vật phải hành động |
| Chốt | 85–100% | thẻ A/B + prompt bình luận |

Cảnh 3.5–5s. Tổng 35–60s (bản tham chiếu 89.6s dùng cảnh dài hơn và nhiều cảnh đệm).
Cảnh cuối 5–6s, đứng yên, chữ to, không nhạc dồn.

## 8. Âm thanh

- Nền: drone thấp + mưa + động cơ, gần như không giai điệu.
- SFX điểm: còi tàu, radio static, click công tắc, tiếng nước.
- Giọng nam trầm, chậm (`rate -4%`), gần mic; giọng radio băng hẹp + echo.
- Khoảng lặng trước twist 0.4–0.8s quan trọng hơn nhạc.

## 9. Thẻ A/B

- Một cột dọc giữa khung: header nhỏ → câu hỏi → thẻ A → thẻ B → đếm ngược → prompt.
- Thẻ A viền hổ phách, thẻ B viền xanh lạnh; chữ all-caps; sub 1 dòng.
- Không logo, không watermark; prompt bình luận ở đáy.

## 10. Nên / Không nên

| Nên | Không nên |
|---|---|
| Giữ một góc nhìn nhất quán | Đổi góc máy liên tục |
| Để bóng tối làm hậu cảnh | Chiếu sáng phẳng toàn cảnh |
| Một ý mỗi cảnh | Nhồi 2 twist trong 1 cảnh |
| Caption như nhịp thở | Caption như phụ đề phim |
| Điểm nhấn màu có lý do | Rải màu khắp khung |
| Im lặng trước twist | Nhạc cao trào liên tục |
