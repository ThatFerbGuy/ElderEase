// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorResults = document.getElementById('colorResults');
const objectResults = document.getElementById('objectResults');
const speakObjectsBtn = document.getElementById('speakObjects');
const loadingIndicator = document.getElementById('loadingIndicator');
const objectsSection = document.getElementById('objectsSection');
const colorsSection = document.getElementById('colorsSection');
const statusMessage = document.getElementById('statusMessage');

// State variables
let objectDetectionModel = null;
let isModelLoaded = false;
let detectedObjects = [];
let dominantColors = [];

// Color name mapping (expanded to include more shades)
const colorNames = {
    red: [[255, 0, 0], "Red"],
    darkred: [[139, 0, 0], "Dark Red"],
    crimson: [[220, 20, 60], "Crimson"],
    orange: [[255, 165, 0], "Orange"],
    darkorange: [[255, 140, 0], "Dark Orange"],
    gold: [[255, 215, 0], "Gold"],
    yellow: [[255, 255, 0], "Yellow"],
    lightyellow: [[255, 255, 224], "Light Yellow"],
    lemonchiffon: [[255, 250, 205], "Lemon"],
    lime: [[0, 255, 0], "Lime"],
    green: [[0, 128, 0], "Green"],
    darkgreen: [[0, 100, 0], "Dark Green"],
    olive: [[128, 128, 0], "Olive"],
    teal: [[0, 128, 128], "Teal"],
    aqua: [[0, 255, 255], "Aqua"],
    skyblue: [[135, 206, 235], "Sky Blue"],
    blue: [[0, 0, 255], "Blue"],
    navy: [[0, 0, 128], "Navy"],
    purple: [[128, 0, 128], "Purple"],
    magenta: [[255, 0, 255], "Magenta"],
    pink: [[255, 192, 203], "Pink"],
    hotpink: [[255, 105, 180], "Hot Pink"],
    brown: [[165, 42, 42], "Brown"],
    saddlebrown: [[139, 69, 19], "Saddle Brown"],
    chocolate: [[210, 105, 30], "Chocolate"],
    tan: [[210, 180, 140], "Tan"],
    beige: [[245, 245, 220], "Beige"],
    black: [[0, 0, 0], "Black"],
    gray: [[128, 128, 128], "Gray"],
    darkgray: [[169, 169, 169], "Dark Gray"],
    lightgray: [[211, 211, 211], "Light Gray"],
    white: [[255, 255, 255], "White"],
    ivory: [[255, 255, 240], "Ivory"],
    silver: [[192, 192, 192], "Silver"]
};

// Load object detection model
async function loadObjectDetectionModel() {
    try {
        showStatus('Loading object detection model...', 'info');
        objectDetectionModel = await cocoSsd.load();
        isModelLoaded = true;
        showStatus('Model loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading model:', error);
        showStatus('Error loading model. Please try again.', 'error');
    }
}

// Handle image upload
imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isModelLoaded) {
        await loadObjectDetectionModel();
    }

    if (file.size > 10 * 1024 * 1024) {
        showStatus('Image is too large. Please choose an image under 10MB.', 'error');
        return;
    }

    loadingIndicator.style.display = 'block';
    objectsSection.style.display = 'none';
    colorsSection.style.display = 'none';
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
            // Display the preview image
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
            
            // Set up canvas for analysis
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            try {
                // Analyze the image
                await analyzeImage(img);
                
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
                
                // Show results sections
                objectsSection.style.display = 'block';
                colorsSection.style.display = 'block';
                
                showStatus('Analysis complete', 'success');
            } catch (error) {
                console.error('Error analyzing image:', error);
                loadingIndicator.style.display = 'none';
                showStatus('Error analyzing image. Please try again.', 'error');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Analyze image for objects and colors
async function analyzeImage(img) {
    // Detect objects
    const predictions = await objectDetectionModel.detect(img);
    
    // Clear previous results
    objectResults.innerHTML = '';
    colorResults.innerHTML = '';
    detectedObjects = [];
    
    // Process detected objects
    if (predictions.length > 0) {
        for (const prediction of predictions) {
            const [x, y, width, height] = prediction.bbox;
            const objectClass = prediction.class;
            const confidence = Math.round(prediction.score * 100);
            
            // Get dominant color of the object
            const objectColors = getObjectColors(x, y, width, height);
            const dominantObjectColor = objectColors[0]; // First color is most dominant
            
            detectedObjects.push({
                name: objectClass,
                color: dominantObjectColor.name,
                confidence: confidence,
                colorHex: dominantObjectColor.hex
            });
            
            // Create object result item
            const objectItem = createObjectResultItem(objectClass, dominantObjectColor, confidence);
            objectResults.appendChild(objectItem);
        }
    } else {
        objectResults.innerHTML = '<p>No objects detected</p>';
    }
    
    // Get overall dominant colors of the image
    dominantColors = getImageDominantColors();
    
    // Display dominant colors
    dominantColors.forEach(color => {
        const colorItem = createColorResultItem(color);
        colorResults.appendChild(colorItem);
    });
}

// Get colors for a specific object region
function getObjectColors(x, y, width, height) {
    // Ensure coordinates are within canvas bounds
    x = Math.max(0, Math.floor(x));
    y = Math.max(0, Math.floor(y));
    width = Math.min(canvas.width - x, Math.floor(width));
    height = Math.min(canvas.height - y, Math.floor(height));
    
    // Get pixel data for the object region
    const imageData = ctx.getImageData(x, y, width, height);
    const pixels = imageData.data;
    
    // Sample pixels (analyze every 10th pixel for performance)
    const sampledColors = [];
    for (let i = 0; i < pixels.length; i += 40) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Skip transparent pixels
        if (pixels[i + 3] < 128) continue;
        
        const colorName = findClosestColorName(r, g, b);
        const hex = rgbToHex(r, g, b);
        
        sampledColors.push({r, g, b, name: colorName, hex});
    }
    
    // Count frequency of each color
    const colorFrequency = {};
    sampledColors.forEach(color => {
        if (!colorFrequency[color.name]) {
            colorFrequency[color.name] = {
                count: 0,
                r: color.r,
                g: color.g,
                b: color.b,
                hex: color.hex
            };
        }
        colorFrequency[color.name].count++;
    });
    
    // Sort colors by frequency
    const sortedColors = Object.entries(colorFrequency)
        .map(([name, data]) => ({
            name,
            count: data.count,
            r: data.r,
            g: data.g,
            b: data.b,
            hex: data.hex
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Get top 3 colors
    
    return sortedColors;
}

// Get dominant colors of the entire image
function getImageDominantColors() {
    // Get all pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Sample pixels (analyze every 50th pixel for performance)
    const sampledColors = [];
    for (let i = 0; i < pixels.length; i += 200) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Skip transparent pixels
        if (pixels[i + 3] < 128) continue;
        
        const colorName = findClosestColorName(r, g, b);
        const hex = rgbToHex(r, g, b);
        
        sampledColors.push({r, g, b, name: colorName, hex});
    }
    
    // Count frequency of each color
    const colorFrequency = {};
    sampledColors.forEach(color => {
        if (!colorFrequency[color.name]) {
            colorFrequency[color.name] = {
                count: 0,
                r: color.r,
                g: color.g,
                b: color.b,
                hex: color.hex
            };
        }
        colorFrequency[color.name].count++;
    });
    
    // Sort colors by frequency
    const sortedColors = Object.entries(colorFrequency)
        .map(([name, data]) => ({
            name,
            percentage: (data.count / sampledColors.length * 100).toFixed(1),
            r: data.r,
            g: data.g,
            b: data.b,
            hex: data.hex
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5); // Get top 5 colors
    
    return sortedColors;
}

// Create object result item
function createObjectResultItem(objectName, dominantColor, confidence) {
    const item = document.createElement('div');
    item.className = 'object-item';
    
    item.innerHTML = `
        <div class="object-color" style="background-color: ${dominantColor.hex}"></div>
        <div class="object-details">
            <div class="object-name">${dominantColor.name} ${objectName}</div>
            <div class="object-confidence">Confidence: ${confidence}%</div>
        </div>
    `;
    
    return item;
}

// Create color result item
function createColorResultItem(color) {
    const item = document.createElement('div');
    item.className = 'color-item';
    
    item.innerHTML = `
        <div class="color-preview" style="background-color: ${color.hex}"></div>
        <div class="color-details">
            <div class="color-name">${color.name}</div>
            <div class="color-percentage">${color.percentage}%</div>
        </div>
    `;
    
    return item;
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Find closest color name
function findClosestColorName(r, g, b) {
    let minDistance = Infinity;
    let closestColor = "Unknown";

    for (const [name, [rgb, colorName]] of Object.entries(colorNames)) {
        const distance = Math.sqrt(
            Math.pow(r - rgb[0], 2) +
            Math.pow(g - rgb[1], 2) +
            Math.pow(b - rgb[2], 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = colorName;
        }
    }
    return closestColor;
}

// Speak object colors
speakObjectsBtn.addEventListener('click', () => {
    if (detectedObjects.length === 0) {
        showStatus('No objects detected to speak', 'error');
        return;
    }
    
    // Create speech text
    let speechText = "I can see ";
    
    if (detectedObjects.length === 1) {
        speechText += `a ${detectedObjects[0].color} ${detectedObjects[0].name}`;
    } else {
        const objectDescriptions = detectedObjects.map(obj => `a ${obj.color} ${obj.name}`);
        const lastObject = objectDescriptions.pop();
        speechText += objectDescriptions.join(', ') + ' and ' + lastObject;
    }
    
    // Add dominant color information
    if (dominantColors.length > 0) {
        speechText += `. The dominant colors in the image are ${dominantColors[0].name}`;
        if (dominantColors.length > 1) {
            speechText += ` and ${dominantColors[1].name}`;
        }
    }
    
    // Speak the text
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.9; // Slightly slower for better comprehension
    window.speechSynthesis.speak(utterance);
    
    showStatus('Speaking object colors', 'info');
});

// Status message handler
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    
    // Clear the message after 3 seconds unless it's an error
    if (type !== 'error') {
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }, 3000);
    }
}

// Initialize by loading the model when the page loads
window.addEventListener('load', () => {
    loadObjectDetectionModel();
}); 