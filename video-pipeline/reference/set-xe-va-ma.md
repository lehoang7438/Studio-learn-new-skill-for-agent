# SET XE BAN ĐÊM & NHÂN VẬT KINH DỊ

Ghi lại từ tập `chuyen-xe` (9:00, 33 cảnh, 1080×1920). Đây là những chỗ **đã sai rồi sửa**, không phải
gợi ý chung. Mỗi mục đều chỉ thẳng vào file/component đang dùng.

---

## 1. Bốn thứ quyết định “đây là xe”, không phải ô cửa

Ở khung dọc, kính chắn gió rất dễ thành một ô chữ nhật dọc vô nghĩa. Bốn chi tiết dưới đây là thứ khiến
nó đọc ra buồng lái (`src/engine/taxi.tsx` → `CabinV`):

| Chi tiết | Sai | Đúng |
|---|---|---|
| **Trần** | cắt ngang một đường thẳng ở đỉnh | dải tối có **đường võng** (`Q 960 -218`), thêm một gờ sáng mảnh ở mép |
| **Gương** | nổi lơ lửng giữa kính | **treo từ trần** bằng cổ gương, cổ chạm đúng mép trần |
| **Trụ A** | dày 150–200 px, ăn mất 1/3 bề ngang | **mỏng ~50 px** mỗi bên, kính trải hết 1080 |
| **Gạt mưa** | dựng đứng giữa kính, thành hai cây cột | nằm **ngang ở đáy kính**, quét chậm, chỉ thấy ở mép dưới |

Táp-lô chiếm khoảng **1/5 dưới**, cong nhẹ, có cụm đồng hồ và vô lăng cắt ở đáy khung. Đồng hồ kỹ thuật
số đặt **lệch phải** cụm đồng hồ, không đè lên nó.

> Quy tắc nhớ: nếu bỏ hết nội dung bên ngoài mà khung vẫn đọc ra “trong xe” thì set đúng.

---

## 2. Quy tắc gương là hình học, không phải prompt

Nhân vật chỉ được vẽ **bên trong** `<Mirror>` / `<BigMirror>` cho tới cảnh được phép hiện trực tiếp.
Không có prompt nào cứu được một cái ghế có người ngồi sai chỗ.

- `BigMirror` dùng khi gương **là chủ thể** (cận): khung 640×330, mặt kính có phản chiếu đường phía sau
  (đường chân trời mờ + một đèn vàng xa), nhân vật nằm **trên** lớp phản chiếu đó.
- `Mirror` nhỏ dùng khi gương chỉ là chi tiết trong cabin.
- Gương nứt: vẽ 3 mảnh vỡ chia mặt — vừa che khuyết điểm hình, vừa đúng motif “ba mảnh”.

---

## 3. Nhân vật ma — 5 luật

1. **Mắt**: viền **đen tuyền**, bên trong **một chấm đỏ**. Không lòng trắng, không con ngươi tròn, không
   hai mắt to bằng nhau hoàn hảo. Mắt tròn trắng là thứ biến con ma thành mascot.
2. **Máu**: loang **dưới chân tóc** rồi mới chảy xuống — vẽ máu **trước** lọn tóc để tóc che mép trên.
   Thêm 2–3 vệt dài khác nhau + một vết thấm ở cổ áo. Không dùng một mảng đỏ dán lên tóc.
3. **Cổ**: phải **nối liền đầu–thân**. Cổ áo chữ V vẽ **đè lên** mối nối. Đầu hạ xuống đúng vị trí cổ,
   không lệch sang một bên.
4. **Tóc**: **một khối liền** + 2 lọn mảnh trước vai. Không dùng 5–6 lọn rời — ở cỡ 100 px nó thành
   con rối.
5. **Độ mờ**: trong gương, phủ thêm **veil tối 26%** + **vignette 72%** viền. Mặt không được sáng đều;
   chỉ còn máu và mắt là thứ nổi.

Đèn: ấm từ táp-lô một bên má, lạnh từ kính bên kia. Không có đèn thứ ba.

---

## 4. Bàn tay

**Cầm vô lăng (`GripHand`)** — lòng bàn tay ở **ngoài** vành, bốn ngón chụp **qua** vành xuống phía trong,
**ngón cái nằm bên trong** chĩa về tâm. Ngón cái ở ngoài là sai giải phẫu và nhìn ra ngay.

**Vặn núm (`T04`)** — tay 5 ngón: 3 ngón duỗi **cong về phía núm**, ngón trỏ và ngón cái **chỉ chạm ở
đầu ngón** (một ở mép trên, một ở giữa mặt núm). Núm **không bị ôm hết vòng** — nửa còn lại vẫn lộ.
Đầu ngón phải dính vào mu bàn tay; đặt sai một ngón ra ngoài là tay rời.

---

## 5. Ánh sáng & màu

- Nền xanh đêm gần đen; chỉ hai điểm sáng: **hổ phách** (táp-lô, đèn đường) và **trắng lạnh** (kính, đèn pin).
- **Đỏ** = máu + mắt ma (+ xe đạp đỏ nếu có). Đèn hậu xe phải là **hổ phách**, không đỏ.
- Cảnh tối vẫn phải có **một** điểm sáng nhỏ (đồng hồ, đèn LED, giọt nước).

---

## 6. Bẫy kỹ thuật (đã gặp thật trong tập này)

| Bẫy | Cách xử |
|---|---|
| `CaptionLayer` vẫn vẽ dù `project.json` có `captions: []` | truyền `captions: []` thẳng vào `defineEpisode` |
| `npx remotion still` fail `screenshotTask` ngay sau khi sửa file | chạy lại lần hai; không phải lỗi code |
| Dòng thoại > 150 ký tự bị edge-tts đọc một hơi | cắt theo ranh giới câu khi sinh `lines[]` |
| `video.py timeline` cần voice | không — thiếu `voice.wav` thì timeline tự bỏ audio |
| Muốn 16:9 | `stage="wide"`: thế giới luôn 1920×1080, khung dọc chỉ là một **crop** 420..1500 |
| Ảnh thẻ đen (23:34) | dùng cảnh `CARD` vẽ bằng Remotion, đừng sinh ảnh |

---

## 7. Checklist trước khi render một cảnh cabin

- [ ] Trần có đường võng, gương treo từ trần
- [ ] Trụ A mỏng, kính trải hết bề ngang
- [ ] Gạt mưa nằm ngang ở đáy
- [ ] Đồng hồ đọc được, đúng giờ của cảnh
- [ ] Tay: ngón cái đúng phía
- [ ] Nếu có nhân vật lạ: chỉ trong gương (hoặc đã qua cảnh cho phép)
- [ ] Đỏ chỉ ở máu / mắt / xe đạp
