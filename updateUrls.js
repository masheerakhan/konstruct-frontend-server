const fs = require('fs');
const path = require('path');

const newFuncStr = `const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const base =
        window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
            ? "http://127.0.0.1:8001"
            : "https://konstruct.world/checklists";

    const clean = path.startsWith("/") ? path : \`/\${path}\`;
    return \`\${base}\${clean}\`;
};`;

const newFuncExportStr = `export const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const base =
        window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
            ? "http://127.0.0.1:8001"
            : "https://konstruct.world/checklists";

    const clean = path.startsWith("/") ? path : \`/\${path}\`;
    return \`\${base}\${clean}\`;
};`;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Konstruct/frontend/src/components/QHSE/Safety/Safety_Inspection');
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace old longer version
    content = content.replace(
        /const resolveMediaUrl = \(path\) => \{[\s\S]*?return `\$\{base\}\$\{cleanPath\}`;?\r?\n\};?(?:;)?/g, 
        newFuncStr
    );
    
    content = content.replace(
        /export const resolveMediaUrl = \(path\) => \{[\s\S]*?return `\$\{base\}\$\{cleanPath\}`;?\r?\n\};?(?:;)?/g, 
        newFuncExportStr
    );
    
    // Also fix the double semicolon in SafetyChecklistHistoryModal.jsx
    content = content.replace(/};\s*;/g, '};');

    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
        console.log("Updated: " + file);
    }
});

console.log('Total Updated ' + changed + ' files.');
