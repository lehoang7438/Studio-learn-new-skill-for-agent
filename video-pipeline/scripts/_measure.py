from PIL import ImageFont

f = ImageFont.truetype('public/fonts/Anton-Regular.ttf', 100)
chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?-'
chars += 'ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ'
for ch in chars:
    w = f.getlength(ch)
    print(repr(ch), round(w, 1), round(w / 100, 3))
