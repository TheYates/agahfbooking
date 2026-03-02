/**
 * PWA Icon Generator Script
 * 
 * This script helps generate PWA icons from your SVG logo.
 * 
 * OPTION 1: Use an online tool (Easiest)
 * =====================================
 * 1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
 * 2. Upload your logo (public/agahflogo.svg or public/agahflogo white.svg)
 * 3. Download the generated icons
 * 4. Place them in public/icons/ with these names:
 *    - icon-72x72.png
 *    - icon-96x96.png
 *    - icon-128x128.png
 *    - icon-144x144.png
 *    - icon-152x152.png
 *    - icon-192x192.png
 *    - icon-384x384.png
 *    - icon-512x512.png
 * 
 * OPTION 2: Use Sharp (requires installation)
 * ===========================================
 * Run: pnpm add -D sharp
 * Then run: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const sharp = require('sharp');
    
    const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512, 1024];
    const inputSvg = path.join(__dirname, '../public/agahflogo white.svg');
    const outputDir = path.join(__dirname, '../public/icons');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Generating PWA icons...');

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(inputSvg)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${size}x${size} icon`);
    }

    console.log('\n✅ All PWA icons generated successfully!');
    console.log(`Icons saved to: ${outputDir}`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Sharp module not found. Please install it first:');
      console.log('  pnpm add -D sharp');
      console.log('\nOr use an online tool like https://www.pwabuilder.com/imageGenerator');
    } else {
      console.error('Error generating icons:', error.message);
    }
  }
}

generateIcons();
