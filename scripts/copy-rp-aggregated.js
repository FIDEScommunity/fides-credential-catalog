/**
 * Copies RP catalog aggregated.json into the credential catalog plugin data folder
 * so the credential catalog UI can show "Relying parties" per credential.
 *
 * Run from credential-catalog root. Expects sibling: ../rp-catalog/data/aggregated.json
 * Usage: node scripts/copy-rp-aggregated.js
 */

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const sourcePath = path.join(cwd, '..', 'rp-catalog', 'data', 'aggregated.json');
const targetDir = path.join(cwd, 'wordpress-plugin', 'fides-credential-catalog', 'data');
const targetPath = path.join(targetDir, 'rp-aggregated.json');

if (!fs.existsSync(sourcePath)) {
  console.warn('copy-rp-aggregated: source not found:', sourcePath);
  console.warn('  Run the RP catalog crawler first (npm run crawl in rp-catalog).');
  process.exit(0);
}

try {
  const data = fs.readFileSync(sourcePath, 'utf-8');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, data, 'utf-8');
  console.log('Copied RP catalog →', targetPath);
} catch (err) {
  console.error('copy-rp-aggregated:', err.message);
  process.exit(1);
}
