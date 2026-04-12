const sharp = require('sharp');
const src = "C:\\Users\\Target\\.gemini\\antigravity\\brain\\2cd3ffb3-c846-4387-99f2-d0669b7da2f4\\abrars_stylish_logo_1775927248208.png";
const dst = "c:\\Sultan Furniture\\frontend\\public\\logo.png";

sharp(src)
  .ensureAlpha()
  .toColourspace('srgb')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // data is a Buffer of raw RGBA pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const maxColor = Math.max(r, g, b);
      if (maxColor < 20) {
        data[i+3] = 0; // completely transparent
      } else if (maxColor < 60) {
        data[i+3] = Math.min(255, maxColor * 4); // smooth edges near black
      }
    }
    return sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 }
    }).toFile(dst);
  })
  .then(() => console.log('Done with sharp'))
  .catch(console.error);
