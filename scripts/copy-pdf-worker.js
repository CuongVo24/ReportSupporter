const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.mjs');
const destDir = path.resolve(__dirname, '../public');
const dest = path.resolve(destDir, 'pdf.worker.mjs');

// Create public directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy worker file
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied pdf.worker.mjs to public/');
} else {
  // Fallback check for older .js file
  const srcJs = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
  const destJs = path.resolve(destDir, 'pdf.worker.min.js');
  if (fs.existsSync(srcJs)) {
    fs.copyFileSync(srcJs, destJs);
    console.log('Successfully copied pdf.worker.min.js to public/');
  } else {
    // Check if pdf.worker.js exists (unminified)
    const srcUnminJs = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.js');
    const destUnminJs = path.resolve(destDir, 'pdf.worker.js');
    if (fs.existsSync(srcUnminJs)) {
      fs.copyFileSync(srcUnminJs, destUnminJs);
      console.log('Successfully copied pdf.worker.js to public/');
    } else {
      console.error('Could not find pdf.worker.mjs, pdf.worker.min.js, or pdf.worker.js in node_modules/pdfjs-dist/build/');
    }
  }
}

// Helper to copy folders recursively
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

// Copy cmaps
const cmapsSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/cmaps');
const cmapsDest = path.resolve(destDir, 'cmaps');
if (fs.existsSync(cmapsSrc)) {
  copyFolderSync(cmapsSrc, cmapsDest);
  console.log('Successfully copied cmaps folder to public/cmaps/');
}

// Copy standard_fonts
const fontsSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/standard_fonts');
const fontsDest = path.resolve(destDir, 'standard_fonts');
if (fs.existsSync(fontsSrc)) {
  copyFolderSync(fontsSrc, fontsDest);
  console.log('Successfully copied standard_fonts folder to public/standard_fonts/');
}
