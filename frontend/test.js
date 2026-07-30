const fs = require('fs');
const content = fs.readFileSync('dist/assets/index-BMtjzpXM.js', 'utf8');
const match = content.match(/https:\/\/smartfarming-app-[^\"\'\]*/);
console.log(match ? match[0] : 'not found');
