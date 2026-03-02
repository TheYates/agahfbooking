const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const SOURCE_IMAGE = 'mobile/assets/agahflogo.png';
const ICONS_DIR = 'public/icons';

// Icon sizes needed for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72' },
  { size: 96, name: 'icon-96x96' },
  { size: 128, name: 'icon-128x128' },
  { size: 144, name: 'icon-144x144' },
  { size: 152, name: 'icon-152x152' },
  { size: 180, name: 'icon-180x180' },
  { size: 192, name: 'icon-192x192' },
  { size: 384, name: 'icon-384x384' },
  { size: 512, name: 'icon-512x512' },
  { size: 1024, name: 'icon-1024x1024' }
];

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  // Ensure icons directory exists
  await fs.mkdir(ICONS_DIR, { recursive: true });

  const sourcePath = path.join(process.cwd(), SOURCE_IMAGE);

  for (const { size, name } of ICON_SIZES) {
    try {
      // Regular icon (logo fills entire canvas) - for splashscreen and crisp display
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(path.join(ICONS_DIR, `${name}.png`));
      console.log(`✓ ${name}.png (${size}x${size}) - Regular`);

      // Maskable icon (logo centered in 80% safe zone) - for Android adaptive icons
      // Android adaptive icons require a 48dp safe zone (20% padding on each side)
      const padding = Math.round(size * 0.1); // 10% padding on each side = 80% safe zone
      const logoSize = size - (padding * 2);
      
      await sharp(sourcePath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(ICONS_DIR, `${name}-maskable.png`));
      console.log(`✓ ${name}-maskable.png (${size}x${size}) - Maskable (20% padding)`);
    } catch (error) {
      console.error(`✗ Error generating ${name}:`, error.message);
    }
  }

  console.log('\n✅ Icon generation complete!');
  console.log(`\nGenerated ${ICON_SIZES.length * 2} icons in ${ICONS_DIR}/`);
  console.log('- Regular icons: For splashscreen, iOS, Windows, Edge');
  console.log('- Maskable icons: For Android adaptive icons');
}

generateIcons().catch(console.error);
