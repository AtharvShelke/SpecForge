const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "app"); 
const OUTPUT_FILE = path.join(__dirname, "txt/frontend.txt");

// 👇 ignore rule
function shouldIgnore(p) {
  return (
    p.includes(path.join("app", "generated")) || p.includes(path.join("app", "api")) || p.includes(path.join("components", "ui")) || p.includes(path.join("lib", "services"))
  );
}

// Helper: Generate directory tree
function getDirectoryTree(dir, prefix = "") {
  let result = "";
  const items = fs.readdirSync(dir);

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);

    if (shouldIgnore(fullPath)) return; // 👈 skip

    const isLast = index === items.length - 1;
    const connector = isLast ? "└── " : "├── ";

    result += `${prefix}${connector}${item}\n`;

    if (fs.statSync(fullPath).isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      result += getDirectoryTree(fullPath, newPrefix);
    }
  });

  return result;
}

// Helper: Read all files recursively
function getAllFiles(dir) {
  let files = [];

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);

    if (shouldIgnore(fullPath)) return; // 👈 skip

    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  });

  return files;
}

// Main
function generateDump() {
  let output = "";

  // 1. Directory structure
  output += "===== DIRECTORY STRUCTURE =====\n\n";
  output += getDirectoryTree(ROOT_DIR);

  // 2. File contents
  output += "\n\n===== FILE CONTENTS =====\n\n";

  const files = getAllFiles(ROOT_DIR);

  files.forEach((filePath) => {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, "utf-8");

    output += `\n\n----- FILE: ${relativePath} -----\n\n`;
    output += content;
    output += "\n";
  });

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log("Dump generated at:", OUTPUT_FILE);
}

generateDump();