// The registry: one import and one entry per episode.
// `python video.py new <slug>` rewrites this file automatically.
import { chuyenPha } from './chuyen-pha';
import { chuyenPhaSau } from './chuyen-pha-sau';
import { refNhanVat } from './ref-nhan-vat';
import { storyboardMau } from './storyboard-mau';
import { chuyenXe } from './chuyen-xe';

export const EPISODES = [chuyenPha, storyboardMau, refNhanVat, chuyenPhaSau, chuyenXe];
