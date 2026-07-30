const fs = require('fs');
const path = require('path');

const mappings = {
    'ðŸ “': '🐓',
    'ðŸ Ÿ': '🐟',
    'ðŸŒ¡ï¸ ': '🌡️',
    'âš ï¸ ': '⚠️',
    'ðŸ žï¸ ': '🗺️',
    'ðŸ• ': '🕒',
    'ðŸŒ§ï¸ ': '🌧️',
    'âœ¨': '✨',
    'ðŸŒ¬ï¸ ': '🌬️',
    'Â©': '©'
};

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            // Fix emojis
            for (let key in mappings) {
                if (content.includes(key)) {
                    content = content.split(key).join(mappings[key]);
                    changed = true;
                }
            }
            
            // Remove JetBrains Mono
            const fontString = "fontFamily: 'JetBrains Mono, monospace', ";
            if (content.includes(fontString)) {
                content = content.split(fontString).join("");
                changed = true;
            }
            
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    });
}

walkDir(path.join(__dirname, 'frontend/src'));

// Also fix index.css
const cssPath = path.join(__dirname, 'frontend/src/index.css');
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    if (css.includes("font-family: 'JetBrains Mono', monospace;")) {
        css = css.split("font-family: 'JetBrains Mono', monospace;").join("font-family: inherit; font-variant-numeric: tabular-nums;");
        fs.writeFileSync(cssPath, css, 'utf8');
        console.log('Fixed:', cssPath);
    }
}
