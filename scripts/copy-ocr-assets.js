const fs = require("fs");
const path = require("path");
const https = require("https");

const ocrDir = path.join(__dirname, "../public/ocr");
if (!fs.existsSync(ocrDir)) {
  fs.mkdirSync(ocrDir, { recursive: true });
}

// 1. Copy files from node_modules
const filesToCopy = [
  {
    src: path.join(__dirname, "../node_modules/tesseract.js/dist/worker.min.js"),
    dest: path.join(ocrDir, "tesseract-worker.min.js")
  },
  {
    src: path.join(__dirname, "../node_modules/tesseract.js-core/tesseract-core.js"),
    dest: path.join(ocrDir, "tesseract-core.js")
  },
  {
    src: path.join(__dirname, "../node_modules/tesseract.js-core/tesseract-core.wasm"),
    dest: path.join(ocrDir, "tesseract-core.wasm")
  },
  {
    src: path.join(__dirname, "../node_modules/tesseract.js-core/tesseract-core.wasm.js"),
    dest: path.join(ocrDir, "tesseract-core.wasm.js")
  },
  {
    src: path.join(__dirname, "../node_modules/tesseract.js-core/tesseract-core-simd.js"),
    dest: path.join(ocrDir, "tesseract-core-simd.js")
  },
  {
    src: path.join(__dirname, "../node_modules/tesseract.js-core/tesseract-core-simd.wasm"),
    dest: path.join(ocrDir, "tesseract-core-simd.wasm")
  },
  {
    src: path.join(__dirname, "../node_modules/tesseract.js-core/tesseract-core-simd.wasm.js"),
    dest: path.join(ocrDir, "tesseract-core-simd.wasm.js")
  }
];

console.log("Copying local Tesseract assets from node_modules...");
for (const file of filesToCopy) {
  if (fs.existsSync(file.src)) {
    fs.copyFileSync(file.src, file.dest);
    console.log(`Copied: ${path.basename(file.dest)}`);
  } else {
    console.warn(`Warning: Source file not found: ${file.src}`);
  }
}

// 2. Download traineddata files
const langFiles = [
  {
    url: "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata",
    dest: path.join(ocrDir, "eng.traineddata")
  },
  {
    url: "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/vie.traineddata",
    dest: path.join(ocrDir, "vie.traineddata")
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      console.log(`Already exists: ${path.basename(destPath)}`);
      return resolve();
    }

    console.log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Downloaded: ${path.basename(destPath)}`);
        resolve();
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function main() {
  try {
    for (const lang of langFiles) {
      await downloadFile(lang.url, lang.dest);
    }
    console.log("All Tesseract OCR assets prepared successfully!");
  } catch (err) {
    console.error("Error downloading lang files:", err);
    process.exit(1);
  }
}

main();
