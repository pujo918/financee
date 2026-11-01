// build-assets.js - Prepares the www/ folder for Capacitor Android build
const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const outDir = path.join(__dirname, 'www');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Copy single files
const filesToCopy = [
    'index.html',
    'saving.html',
    'calculator.html',
    'style.css',
    'manifest.json',
    'sw.js',
    'app-calculator.js',
    'app-global-voice.js',
    'app-monthly.js',
    'app-saving.js',
    'nav-menu.js',
    'voice-parser.js'
];

filesToCopy.forEach(f => {
    const src = path.join(srcDir, f);
    const dest = path.join(outDir, f);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
    }
});

// Copy directory helper
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy images
copyDirSync(path.join(srcDir, 'images'), path.join(outDir, 'images'));

console.log('✓ Assets successfully prepared in www/ folder!');
