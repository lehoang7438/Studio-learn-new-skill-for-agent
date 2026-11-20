import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Local faces, shipped in public/fonts so a render works offline and Vietnamese
// diacritics never fall back to a system font.
//   Anton           display / captions (condensed, all caps)
//   Be Vietnam Pro  body, titles and long Vietnamese text
//   JetBrains Mono  HUD readouts, timecodes, radio displays
loadFont({ family: 'Anton', url: staticFile('fonts/Anton-Regular.ttf'), weight: '400' });
loadFont({ family: 'Be Vietnam Pro', url: staticFile('fonts/BeVietnamPro-Regular.ttf'), weight: '400' });
loadFont({ family: 'Be Vietnam Pro', url: staticFile('fonts/BeVietnamPro-SemiBold.ttf'), weight: '600' });
loadFont({ family: 'Be Vietnam Pro', url: staticFile('fonts/BeVietnamPro-ExtraBold.ttf'), weight: '800' });
loadFont({ family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono.ttf'), weight: '100 800' });

export const FONT = {
  title: 'Anton',
  body: 'Be Vietnam Pro',
  ui: 'JetBrains Mono',
  hand: 'Be Vietnam Pro',
};
