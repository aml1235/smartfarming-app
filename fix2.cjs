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
            for (let key in mappings) {
                if (content.includes(key)) {
                    content = content.split(key).join(mappings[key]);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    });
}

walkDir(path.join(__dirname, 'frontend/src'));
