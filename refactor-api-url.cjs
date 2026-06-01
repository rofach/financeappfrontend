const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // If the file contains localhost:3000, we need to inject the config import and replace
            if (content.includes('http://localhost:3000')) {
                // Ensure import API_URL is at the top (after other imports)
                if (!content.includes('import { API_URL }')) {
                    const relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src', 'config')).replace(/\\/g, '/');
                    const importStatement = `import { API_URL } from '${relativePath.startsWith('.') ? relativePath : './' + relativePath}';\n`;
                    content = importStatement + content;
                }

                // Replace standard string quotes: 'http://localhost:3000/api/v1...' -> `${API_URL}/api/v1...`
                content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, '`${API_URL}$1`');
                
                // Replace template literals: `http://localhost:3000/api/v1/${id}` -> `${API_URL}/api/v1/${id}`
                content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, '`${API_URL}$1`');
                
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

const configPath = path.join(directoryPath, 'config.ts');
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, `export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';\n`);
    console.log("Created src/config.ts");
}

walkDir(directoryPath);
console.log("Refactoring complete.");
