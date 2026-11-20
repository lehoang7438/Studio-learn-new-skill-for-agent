# NHÂN VẬT — khoá theo ảnh tham chiếu

Ảnh tham chiếu không phải "cảm hứng". Nó là **hợp đồng**: bảng màu, tỉ lệ, và 2–3 hình khối làm nên
khuôn mặt. Nếu một cảnh khiến nhân vật trông khác ảnh, cảnh đó sai — không phải ảnh sai.

Trong pipeline, hợp đồng đó được viết **một lần** bằng `CharSpec`, vẽ **một lần** bằng `FlatHero`,
và mọi cảnh chỉ `import` lại. Đó là lý do nhân vật không thể "trôi" giữa các cảnh.

---

## 1. Quy trình 5 bước

```
1 ĐỌC ẢNH        lấy 5–7 màu + tỉ lệ + 3 chi tiết nhận dạng
2 VIẾT SPEC      src/engine/character.tsx → CHARACTERS.<id>
3 VẼ 4 GÓC NHÌN  <CharacterSheet spec={...} refImage={...} />
4 SO VỚI ẢNH     mắt · tóc · áo · quần · tỉ lệ  → khớp mới đi tiếp
5 DỰNG SHOT      mọi shot dùng <FlatHero look={SPEC.look} />
```

Bước 4 là cổng chặn: **chưa khớp ảnh thì chưa dựng cảnh.** So ở 4 góc nhìn, vì mặt trước có thể
giống mà mặt nghiêng lại sai (mắt dẹt, tóc không có khối sau, cổ quá dài).

---

## 2. Đọc ảnh — bảng màu và tỉ lệ

Ví dụ đọc từ hai frame tham chiếu (hành lang + cabin tàu đêm):

| Vùng | Hex | Ghi chú |
|---|---|---|
| da | `#DFAE83` | sáng, ấm; bóng `#C68F63` |
| tóc | `#3A2520` | nâu gần đen, không đen tuyền |
| áo thun | `#C8702B` | cam cháy; shade `#A8581F` |
| quần bò | `#33414F` | xanh xám, tối hơn áo |
| giày | `#DDD2B8` | kem, gần như trắng |
| tường hành lang | `#204043` | teal tối; cửa `#2A4A4C` |
| cabin đêm | `#0B1226` | xanh navy; HUD `#C9CDD6` |

Tỉ lệ (đo trên ảnh, không đoán):

- đầu ≈ **1/3** chiều cao toàn thân (nhân vật hoạt hình dọc);
- mắt = **1/4** bề rộng mặt, tròng đen lớn, luôn có 1 điểm sáng;
- vai rộng ≈ **1,3** bề rộng đầu; tay dài tới ngang hông;
- tóc phủ trán tới **sát lông mày**, không cao hơn.

Ba chi tiết nhận dạng (chọn đúng 3, đừng chọn 10): **mắt tròn + tóc rối + áo cam**.
Mất một trong ba là mất nhân vật.

---

## 3. Viết spec

```ts
// src/engine/character.tsx
export const CHARACTERS = {
  nam: {
    id: 'nam',
    name: 'NAM',
    note: '17 tuổi · tóc rối · mắt tròn · áo thun cam · quần bò',
    look: {
      skin: '#DFAE83', skinShade: '#C68F63', hand: '#DFAE83', arm: '#DFAE83',
      jacket: '#C8702B', jacketShade: '#A8581F', accent: '#A8581F',
      limb: '#33414F', leg: '#33414F',
      line: '#2A1C1A', shoe: '#DDD2B8', face: '#2B1D1B', hair: '#3A2520',
      extra: 'messy',        // kiểu tóc
      eyes: 'round',         // tròng trắng + con ngươi (mặc định là mắt chấm)
      sleeve: 0.46,          // tay áo ngắn tới 46% cánh tay trên
    },
    palette: [
      { hex: '#DFAE83', use: 'da' },
      { hex: '#3A2520', use: 'tóc' },
      { hex: '#C8702B', use: 'áo thun' },
      { hex: '#33414F', use: 'quần bò' },
      { hex: '#DDD2B8', use: 'giày' },
    ],
    ref: 'ref-nhan-vat/ref/ref-01.png',
  },
} satisfies Record<string, CharSpec>;
```

`Look` là hợp đồng màu + hình. Các khoá dành riêng cho kiểu phẳng:

| Khoá | Giá trị | Tác dụng |
|---|---|---|
| `eyes` | `'dot' \| 'round'` | mắt chấm của rig cũ, hay mắt tròn có lòng trắng |
| `arm` / `leg` | hex | tay trần + quần bò khác màu (mặc định dùng `limb`) |
| `sleeve` | 0–0.9 | tay áo ngắn của áo thun |
| `glassesStyle` | `'shade' \| 'clear'` | kính râm, hay gọng mảnh |
| `extra` | `'messy' \| 'slick' \| …` | kiểu tóc |
| `headR`, `longFace` | số / bool | đầu tròn hay mặt dài (người già) |
| `brow` | 0–1 | lông mày cho biểu cảm trung tính |

---

## 4. Bảng nhân vật — frame để duyệt

```tsx
// S1 của episode
<CharacterSheet spec={CHARACTERS.nam} t={t} refImage={CHARACTERS.nam.ref} />
```

Sheet vẽ 4 góc nhìn (mặt trước · 3/4 · nghiêng · cận mặt), in bảng màu kèm hex, tỉ lệ đo từ rig,
và **ảnh tham chiếu ngay cạnh** kèm 4 dòng đối chiếu. Đây là frame duyệt: nếu nhìn sheet mà phải
hỏi "nhân vật này là ai?", spec chưa xong.

Ảnh gốc để trong `public/<slug>/ref/`. `refCrop` cắt đúng vùng nhân vật:

```tsx
<CharacterSheet spec={NAM} refImage={NAM.ref} refCrop={[50, 20, 360, 470]} />
```

---

## 5. Hai rig, một `Pose`

| Rig | Dùng cho | Nét |
|---|---|---|
| `Hero` (`rig.tsx`) | phim chalkboard, kinh dị, silhouette | đầu tròn, tay chân nét, viền đen |
| `FlatHero` (`flat.tsx`) | nhân vật tham chiếu kiểu phẳng | khối tô kín, không viền, tay áo, mắt tròn |

Cả hai nhận **cùng một `Pose`**, nên đổi rig chỉ là đổi một dòng; `walkPose`, `flatHandR`, prop
gắn tay vẫn dùng được. Nhân vật phẳng **không** dùng `Hero` — sẽ ra "stick figure" và lệch ảnh.

---

## 6. Checklist "phải trông như ảnh"

- [ ] Mắt: cùng kiểu (tròn/chấm), cùng tỉ lệ, cùng màu tròng, có điểm sáng.
- [ ] Tóc: cùng khối, cùng đường chân tóc, cùng độ dài 2 bên mai.
- [ ] Áo: đúng màu, đúng cổ, đúng tay áo (ngắn/dài), đúng độ dài thân.
- [ ] Quần/giày: đúng màu, đúng dáng.
- [ ] Tỉ lệ: đầu ≈ 1/3, vai/tay đúng, không cao lên hay lùn đi giữa cảnh.
- [ ] Phụ kiện: kính, thẻ tên, đồng hồ — có thì có ở mọi cảnh, không thì không cảnh nào.
- [ ] Cùng một `spec` cho mọi shot (grep `look={LOOK}`), không có màu viết tay trong shot.

---

## 6B. Ánh sáng trên khối phẳng

Mỗi cảnh truyền **một hướng sáng** cho `FlatHero`; rig tự vẽ viền sáng ở phía được chiếu và
mảng bóng mờ ở phía khuất — không cần gradient thủ công trong shot.

```tsx
<FlatHero
  pose={pose}
  look={LOOK}
  light={{ x: -0.8, y: -0.35, rim: 0.75, shade: 0.5, warm: '#D7E8DE' }}
/>
```

| Khoá | Ý nghĩa |
|---|---|
| `x`, `y` | hướng nguồn sáng, −1..1 (âm = trái/trên). `0,0` = phẳng hoàn toàn |
| `rim` | độ mạnh viền sáng trên mép được chiếu (0..1) |
| `shade` | độ đậm mảng bóng ở phía khuất (0..1) |
| `warm` | màu ánh sáng (đèn hành lang xanh nhạt, cabin xanh lạnh, trăng xanh nhạt) |

Nguyên tắc để không thành "hình dán" (sticker):

1. **Một hướng cho cả cảnh.** Đèn ở đâu thì viền sáng ở đó; mặt, tóc, áo, quần cùng một phía.
2. **Viền mỏng hơn bóng.** Rim chỉ 3–7 px (theo scale), opacity ~0.5–0.8; bóng là mảng mờ rộng,
   không phải đường kẻ.
3. **Terminator mềm.** Bóng đi từ 0 → 0.5 → 0.7 qua 3 stop; không cắt nửa mặt bằng một đường cứng.
4. **Tóc cũng bắt sáng**, nhưng mảnh hơn da (3.5 px, opacity 0.55), nếu không sẽ thành viền đen.
5. **Đừng nhân đôi bóng**: cảnh đã có overlay tối thì hạ `shade` hoặc hạ overlay, tránh nhân vật
   tối hơn cả nền.
6. **Chân đế**: bóng đổ dưới chân vẫn là ellipse mờ ở đáy, không phụ thuộc hướng sáng.

Bảng hướng sáng dùng trong repo:

| Cảnh | `x,y` | `warm` | Ghi chú |
|---|---|---|---|
| Hành lang (S2, S3) | `-0.8,-0.35` | `#D7E8DE` | cửa sổ bên trái |
| Cabin tàu, ông khách | `0.75,-0.4` | `#BFD9FF` | cửa sổ bên phải |
| Boong phà đêm | `0.65,-0.55` | `#DCE8FF` | trăng bên phải |
| Bảng nhân vật | `-0.55,-0.5` | `#FFF4E0` | studio trung tính |

---

## 7. Prompt ảnh tham chiếu (image-to-image)

Khi cần tạo ảnh mới (plate, storyboard) từ ảnh nhân vật, đưa ảnh vào làm **reference**, không tả lại
bằng lời:

```
Use the attached image as the character reference. Keep the exact same character:
same face shape, same eye size and spacing, same hairstyle, same orange tee, same denim jeans,
same cream shoes, same body proportions. Change only the pose and the background.
Scene: <bối cảnh>. Camera: <cỡ cảnh>. Light: <nguồn sáng>.
Flat vector illustration, soft cel shading, no outlines, vertical 9:16.
NEGATIVE: redesign, different hairstyle, different clothes, 3D render, photorealistic,
extra fingers, text, watermark, logo, different eye colour.
Seed: 4711 (giữ nguyên cho cả bộ)
```

Luật: **mỗi lần đổi seed là một lần đổi mặt.** Ghi seed vào `note` của spec.

---

## 8. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Mỗi cảnh một sắc áo | màu viết tay trong shot | đưa hết vào `look` |
| Mắt to nhỏ khác nhau | đổi `scale` nhưng giữ `headR` | `headR` là của spec, không sửa theo cảnh |
| Tóc dài ra ở cảnh nghiêng | chỉ vẽ tóc ở mặt trước | kiểm tra góc nghiêng trên sheet |
| Nhân vật "AI" hoá 3D | render ảnh thật thay vì vẽ | dùng `FlatHero`, ảnh chỉ để tham chiếu |
| Cổ dài/ngắn khác nhau | sửa `HEAD` trong rig | sửa `longFace`/`headR` trong spec |

---

## 9. Bản quyền

Ảnh tham chiếu của kênh khác dùng để **học ngôn ngữ thị giác** (tỉ lệ, cách tô, cách đặt caption),
không sao chép nhân vật. Đặt tên, lai lịch và bộ màu riêng; giữ lại cách vẽ, không giữ lại identity.
Ảnh tham chiếu để trong `public/<slug>/ref/` chỉ phục vụ đối chiếu nội bộ — xoá trước khi phát hành
nếu không có quyền.
