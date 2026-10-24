
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const targetDir = path.join(projectRoot, "public", "tesseract");

const candidates = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  [
    "tesseract.js-core/tesseract-core.wasm.js",
    "tesseract-core.wasm.js"
  ],
  [
    "tesseract.js-core/tesseract-core.wasm",
    "tesseract-core.wasm"
  ],
  [
    "tesseract.js-core/tesseract-core-simd.wasm.js",
    "tesseract-core-simd.wasm.js"
  ],
  [
    "tesseract.js-core/tesseract-core-simd.wasm",
    "tesseract-core-simd.wasm"
  ]
];

function main() {
  try {
    fs.mkdirSync(targetDir, { recursive: true });

    let copied = 0;

    for (const [relativeSource, fileName] of candidates) {
      const source = path.join(
        projectRoot,
        "node_modules",
        relativeSource
      );
      const destination = path.join(targetDir, fileName);

      if (!fs.existsSync(source)) {
        continue;
      }

      try {
        fs.copyFileSync(source, destination);
        console.log(`[Tesseract] Copied ${fileName}`);
        copied++;
      } catch (error) {
        console.warn(
          `[Tesseract] Could not copy ${fileName}: ${error.message}`
        );
      }
    }

    if (copied === 0) {
      console.log(
        "[Tesseract] No local assets found; the app can use CDN assets if configured."
      );
    } else {
      console.log(`[Tesseract] Finished: ${copied} asset(s) copied.`);
    }
  } catch (error) {
    console.warn(
      `[Tesseract] Optional asset setup skipped: ${error.message}`
    );
  }

  // Optional asset copying must not block npm installation.
}

main();
