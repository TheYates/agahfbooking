// Manual TanStack Query installation script
const fs = require('fs');
const path = require('path');

async function installTanStackQuery() {
  try {
    console.log('🔧 Installing TanStack Query manually...');
    
    // Read current package.json
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add TanStack Query dependencies
    packageJson.dependencies['@tanstack/react-query'] = '^5.61.5';
    packageJson.dependencies['@tanstack/react-query-devtools'] = '^5.61.5';
    
    // Write updated package.json
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    
    console.log('✅ Added TanStack Query to package.json');
    console.log('📦 Please run: pnpm install (or npm install) to install the packages');
    console.log('🚀 Then restart your dev server');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

installTanStackQuery();