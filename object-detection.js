// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resultsDiv = document.getElementById('results');
const descriptionDiv = document.getElementById('description');
const speakDescBtn = document.getElementById('speakDescription');

// State
let model;
let isModelLoaded = false;
let currentDescription = '';
let synth = window.speechSynthesis;

// Load the COCO-SSD model
async function loadModel() {
    try {
        showStatus('Loading object detection model...', 'info');
        model = await cocoSsd.load();
        isModelLoaded = true;
        showStatus('Model loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading model:', error);
        showStatus('Error loading model. Please refresh the page.', 'error');
    }
}

// Calculate relative distance based on bounding box size
function calculateDistance(bbox, imageWidth, imageHeight) {
    const [, , width, height] = bbox;
    const boxArea = width * height;
    const imageArea = imageWidth * imageHeight;
    const areaRatio = boxArea / imageArea;

    if (areaRatio > 0.2) {
        return 'very close';
    } else if (areaRatio > 0.1) {
        return 'close';
    } else if (areaRatio > 0.05) {
        return 'medium';
    } else if (areaRatio > 0.01) {
        return 'far';
    } else {
        return 'very far';
    }
}

// Generate image description based on detected objects
function generateImageDescription(predictions) {
    if (predictions.length === 0) {
        return "No objects were detected in this image.";
    }
    
    // Count objects by type
    const objectCounts = {};
    predictions.forEach(prediction => {
        const objName = prediction.class;
        objectCounts[objName] = (objectCounts[objName] || 0) + 1;
    });
    
    // Create a description
    let description = "In this image, I can see ";
    const objects = Object.entries(objectCounts).map(([name, count]) => {
        if (count === 1) {
            return `a ${name}`;
        } else {
            return `${count} ${name}s`;
        }
    });
    
    if (objects.length === 1) {
        description += objects[0] + ".";
    } else if (objects.length === 2) {
        description += objects.join(" and ") + ".";
    } else {
        const lastObject = objects.pop();
        description += objects.join(", ") + ", and " + lastObject + ".";
    }
    
    // Add information about relative positions if there are multiple objects
    if (predictions.length > 1) {
        description += " The objects are at varying distances from the camera.";
    }
    
    return description;
}

// Speak the image description
function speakDescription() {
    if (!currentDescription) {
        showStatus('No description to speak', 'error');
        return;
    }
    
    // Cancel any ongoing speech
    if (synth.speaking) {
        synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(currentDescription);
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    
    speakDescBtn.disabled = true;
    speakDescBtn.textContent = '🔊 Speaking...';
    
    utterance.onend = () => {
        speakDescBtn.disabled = false;
        speakDescBtn.textContent = '🔊 Speak Description';
    };
    
    utterance.onerror = () => {
        speakDescBtn.disabled = false;
        speakDescBtn.textContent = '🔊 Speak Description';
        showStatus('Error speaking description', 'error');
    };
    
    synth.speak(utterance);
}

// Handle image upload
imageUpload.addEventListener('change', async (e) => {
    if (!isModelLoaded) {
        showStatus('Please wait for the model to load...', 'error');
        return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showStatus('Image is too large. Please choose an image under 10MB.', 'error');
        return;
    }

    showStatus('Processing image...', 'info');
    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = async () => {
            if (img.width > 4096 || img.height > 4096) {
                showStatus('Image dimensions are too large. Please use an image smaller than 4096x4096 pixels.', 'error');
                return;
            }

            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            
            try {
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const predictions = await model.detect(img);
                predictions.forEach(prediction => {
                    prediction.distance = calculateDistance(prediction.bbox, img.width, img.height);
                });
                
                // Display results and draw detections
                displayResults(predictions);
                drawDetections(predictions);
                
                // Generate and display image description
                currentDescription = generateImageDescription(predictions);
                descriptionDiv.textContent = currentDescription;
                
                // Show description section
                document.getElementById('descriptionSection').style.display = 'block';
                speakDescBtn.disabled = false;
                
                showStatus('Detection complete', 'success');
            } catch (error) {
                console.error('Error during detection:', error);
                showStatus('Error during detection. Please try again.', 'error');
            }
        };
    };
    reader.readAsDataURL(file);
});

// Display detection results
function displayResults(predictions) {
    resultsDiv.innerHTML = '';
    if (predictions.length === 0) {
        resultsDiv.innerHTML = '<p>No objects detected</p>';
        return;
    }
    
    const list = document.createElement('div');
    list.className = 'results-list';
    
    predictions.forEach(prediction => {
        const confidence = Math.round(prediction.score * 100);
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="result-details">
                <span class="object-name">${prediction.class}</span>
                <span class="distance-info">(${prediction.distance})</span>
            </div>
            <span class="confidence">${confidence}%</span>
        `;
        list.appendChild(div);
    });
    
    resultsDiv.appendChild(list);
}

// Draw bounding boxes and labels on the canvas
function drawDetections(predictions) {
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        
        // Draw bounding box
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        ctx.fillStyle = '#1a73e8';
        const label = `${prediction.class} (${prediction.distance})`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);
        
        // Draw label text
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(label, x + 5, y - 7);
    });
}

// Status message handler
function showStatus(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    
    // Remove any existing status messages
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    document.body.appendChild(statusDiv);
    
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }
}

// Initialize
window.addEventListener('load', () => {
    loadModel();
    
    // Setup speak button event listener
    speakDescBtn.addEventListener('click', speakDescription);
}); 