const fs = require('fs');
const filePath = 'C:/Users/yezir/AppData/Local/npm-cache/_npx/8ddf6bea01b2519d/node_modules/@testsprite/testsprite-mcp/dist/index.js';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const searchStr = "const RunFrontendTestParam =";
let foundLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(searchStr)) {
    foundLine = i;
    break;
  }
}

if (foundLine !== -1) {
  console.log(`Found RunFrontendTestParam at line ${foundLine + 1}`);
  const start = Math.max(0, foundLine - 5);
  const end = Math.min(lines.length, foundLine + 50);
  for (let j = start; j < end; j++) {
    console.log(`${j + 1}: ${lines[j]}`);
  }
} else {
  console.log('RunFrontendTestParam not found');
}
