const fs = require('fs');
const path = require('path');

const mappings = {
    'Â°': '°',
    'â€”': '—',
    'â€“': '—',
    'â€¢': '•',
    'ðŸ“Š': '📊',
    'ðŸ “': '🐓',
    'ðŸ Ÿ': '🐟',
    'ðŸŒ¿': '🌿',
    'ðŸŒ±': '🌱',
    'ðŸŒ¡ï¸ ': '🌡️',
    'ðŸ’§': '💧',
    'ðŸŒ¾': '🌾',
    'ðŸ’¡': '💡',
    'ðŸ§ª': '🧪',
    'ðŸ«§': '🫧',
    'ðŸŒŠ': '🌊',
    'ðŸ”„': '🔄',
    'ðŸ žï¸ ': '🗺️',
    'ðŸ• ': '🕒',
    'ðŸŒ§ï¸ ': '🌧️',
    'ðŸ“¡': '📡',
    'ðŸš§': '🚧',
    'ðŸ”´': '🔴',
    'ðŸŸ¡': '🟡',
    'ðŸŸ¢': '🟢',
    'ðŸ”µ': '🔵',
    'ðŸŒ¬ï¸ ': '🌬️'
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
