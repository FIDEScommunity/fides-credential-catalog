/**
 * Copies issuer catalog aggregated.json into the credential catalog plugin data folder
 * so the credential catalog UI can show "Issuers" per credential (e.g. Digital Credentials Issuer).
 *
 * Run from credential-catalog root. Expects sibling: ../issuer-catalog/data/aggregated.json
 * Usage: node scripts/copy-issuer-aggregated.js
 */

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const sourcePath = path.join(cwd, '..', 'issuer-catalog', 'data', 'aggregated.json');
const targetDir = path.join(cwd, 'wordpress-plugin', 'fides-credential-catalog', 'data');
const targetPath = path.join(targetDir, 'issuer-aggregated.json');

if (!fs.existsSync(sourcePath)) {
  console.warn('copy-issuer-aggregated: source not found:', sourcePath);
  console.warn('  Run the issuer catalog crawler first (npm run crawl in issuer-catalog).');
  process.exit(0);
}

try {
  const data = fs.readFileSync(sourcePath, 'utf-8');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, data, 'utf-8');
  console.log('Copied issuer catalog →', targetPath);
} catch (err) {
  console.error('copy-issuer-aggregated:', err.message);
  process.exit(1);
}
