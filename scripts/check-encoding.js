const fs = require("fs");
const path = require("path");

const BAD = ["�"]; // replacement character

const root = process.cwd();
const stack = [root];

while (stack.length) {
  const current = stack.pop();
  const entries = fs.readdirSync(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      stack.push(full);
      continue;
    }
    if (!full.match(/\.(ts|tsx|js|jsx|md)$/)) continue;
    const content = fs.readFileSync(full, "utf8");
    const bad = BAD.find((c) => content.includes(c));
    if (bad) {
      console.error(`❌ Encoding issue in: ${full} (contains replacement char �)`);
      process.exitCode = 1;
    }
  }
}

if (!process.exitCode) console.log("✅ Encoding check passed");
