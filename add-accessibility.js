const fs = require('fs');
const path = require('path');

// Function to add accessibility controls to HTML files
function addAccessibilityToHtml(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add Font Awesome if not present
    if (!content.includes('font-awesome')) {
        content = content.replace(
            '</head>',
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">\n</head>'
        );
    }
    
    // Add accessibility.js if not present
    if (!content.includes('accessibility.js')) {
        content = content.replace(
            '</body>',
            '<script src="accessibility.js"></script>\n</body>'
        );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Added accessibility controls to ${filePath}`);
}

// Function to process all HTML files in a directory
function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.html')) {
            addAccessibilityToHtml(filePath);
        }
    });
}

// Start processing from the current directory
processDirectory('.'); 