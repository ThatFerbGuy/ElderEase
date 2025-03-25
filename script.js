let model;
let isModelLoaded = false;
let isWebcamActive = false;
let liveDetectionActive = false;
let webcamStream = null;

// Load the COCO-SSD model
async function loadModel() {
    try {
        console.log('Loading COCO-SSD model...');
        model = await cocoSsd.load();
        isModelLoaded = true;
        console.log('Model loaded successfully!');
    } catch (error) {
        console.error('Error loading model:', error);
        alert('Error loading the object detection model. Please refresh the page and try again.');
    }
}

// Initialize the model when the page loads
window.addEventListener('load', loadModel);

// Get DOM elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resultsDiv = document.getElementById('results');
const webcamElement = document.getElementById('webcam');
const captureBtn = document.getElementById('captureBtn');
const startStopBtn = document.getElementById('startStopBtn');
const uploadMode = document.getElementById('uploadMode');
const webcamMode = document.getElementById('webcamMode');
const uploadSection = document.getElementById('uploadSection');
const webcamSection = document.getElementById('webcamSection');

// Mode switching
uploadMode.addEventListener('click', () => switchMode('upload'));
webcamMode.addEventListener('click', () => switchMode('webcam'));

async function switchMode(mode) {
    if (mode === 'upload') {
        uploadMode.classList.add('active');
        webcamMode.classList.remove('active');
        uploadSection.style.display = 'block';
        webcamSection.style.display = 'none';
        imagePreview.style.display = 'none';
        stopWebcam();
    } else {
        uploadMode.classList.remove('active');
        webcamMode.classList.add('active');
        uploadSection.style.display = 'none';
        webcamSection.style.display = 'block';
        imagePreview.style.display = 'none';
        
        // Check if we already have an active stream
        if (!isWebcamActive) {
            await startWebcam();
        }
    }
    resultsDiv.innerHTML = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Webcam handling
async function startWebcam() {
    try {
        // First check if webcam is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Your browser does not support webcam access');
        }

        // Try to get webcam permissions
        console.log('Requesting webcam access...');
        
        // First try environment camera (rear camera on mobile)
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { exact: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
        } catch (envError) {
            console.log('Could not access rear camera, trying front camera...', envError);
            // If environment camera fails, try any available camera
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
        }

        console.log('Webcam access granted');
        webcamElement.srcObject = webcamStream;
        isWebcamActive = true;

        // Add event listener to ensure video is playing
        webcamElement.addEventListener('loadedmetadata', () => {
            webcamElement.play();
        });

    } catch (error) {
        console.error('Detailed webcam error:', error);
        let errorMessage = 'Unable to access webcam. ';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'Camera permission was denied. Please check your browser settings and allow camera access.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += 'No camera device was found on your system.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage += 'Your camera might be in use by another application.';
        } else {
            errorMessage += `Error: ${error.message || 'Unknown error occurred'}`;
        }
        
        alert(errorMessage);
        switchMode('upload');
    }
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    isWebcamActive = false;
    liveDetectionActive = false;
    startStopBtn.classList.remove('active');
    startStopBtn.textContent = 'Start Live Detection';
}

// Capture and detect from webcam
captureBtn.addEventListener('click', async () => {
    if (!isWebcamActive || !isModelLoaded) return;
    
    // Set canvas dimensions to match video
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    
    // Clear previous results
    resultsDiv.innerHTML = '<p>Processing image...</p>';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the current frame
    ctx.save();
    ctx.scale(-1, 1); // Mirror the image
    ctx.drawImage(webcamElement, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    try {
        const predictions = await model.detect(canvas);
        predictions.forEach(prediction => {
            prediction.distance = calculateDistance(prediction.bbox, canvas.width, canvas.height);
        });
        displayResults(predictions);
        drawDetections(predictions);
    } catch (error) {
        console.error('Error during detection:', error);
        resultsDiv.innerHTML = `<p style="color: red;">Error during object detection: ${error.message || 'Unknown error'}. Please try again.</p>`;
    }
});

// Live detection
startStopBtn.addEventListener('click', () => {
    if (!isWebcamActive || !isModelLoaded) return;
    
    liveDetectionActive = !liveDetectionActive;
    startStopBtn.classList.toggle('active');
    startStopBtn.textContent = liveDetectionActive ? 'Stop Live Detection' : 'Start Live Detection';
    
    if (liveDetectionActive) {
        performLiveDetection();
    }
});

async function performLiveDetection() {
    if (!liveDetectionActive || !isWebcamActive) return;
    
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(webcamElement, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    try {
        const predictions = await model.detect(canvas);
        predictions.forEach(prediction => {
            prediction.distance = calculateDistance(prediction.bbox, canvas.width, canvas.height);
        });
        displayResults(predictions);
        drawDetections(predictions);
    } catch (error) {
        console.error('Error during live detection:', error);
        resultsDiv.innerHTML = `<p style="color: red;">Error during live detection: ${error.message || 'Unknown error'}</p>`;
        liveDetectionActive = false;
        startStopBtn.classList.remove('active');
        startStopBtn.textContent = 'Start Live Detection';
        return;
    }
    
    if (liveDetectionActive) {
        requestAnimationFrame(performLiveDetection);
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

// Handle image upload
imageUpload.addEventListener('change', async (e) => {
    if (!isModelLoaded) {
        alert('Please wait for the model to load completely...');
        return;
    }

    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image is too large. Please choose an image under 10MB.');
        return;
    }

    // Display preview
    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = async () => {
            if (img.width > 4096 || img.height > 4096) {
                alert('Image dimensions are too large. Please use an image smaller than 4096x4096 pixels.');
                return;
            }

            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            
            try {
                canvas.width = img.width;
                canvas.height = img.height;
                
                resultsDiv.innerHTML = '<p>Processing image...</p>';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const predictions = await model.detect(img);
                predictions.forEach(prediction => {
                    prediction.distance = calculateDistance(prediction.bbox, img.width, img.height);
                });
                displayResults(predictions);
                drawDetections(predictions);
            } catch (error) {
                console.error('Error during detection:', error);
                resultsDiv.innerHTML = `<p style="color: red;">Error during object detection: ${error.message || 'Unknown error'}. Please try again.</p>`;
            }
        };

        img.onerror = () => {
            resultsDiv.innerHTML = '<p style="color: red;">Error loading image. Please try a different image.</p>';
        };
    };

    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        resultsDiv.innerHTML = '<p style="color: red;">Error reading the image file. Please try again.</p>';
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
        resultsDiv.appendChild(div);
    });
}

// Draw bounding boxes and labels on the canvas
function drawDetections(predictions) {
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        
        // For webcam mode, adjust x coordinate due to mirroring
        const adjustedX = isWebcamActive ? canvas.width - x - width : x;
        
        // Draw bounding box
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = 2;
        ctx.strokeRect(adjustedX, y, width, height);
        
        // Draw label background
        ctx.fillStyle = '#1a73e8';
        const label = `${prediction.class} (${prediction.distance})`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(adjustedX, y - 25, textWidth + 10, 25);
        
        // Draw label text
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(label, adjustedX + 5, y - 7);
    });
}

// Add a check for webcam devices
async function checkWebcamAvailability() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices:', videoDevices);
        
        if (videoDevices.length === 0) {
            webcamMode.style.display = 'none';
            console.log('No video devices found');
        }
    } catch (error) {
        console.error('Error checking video devices:', error);
        webcamMode.style.display = 'none';
    }
}

// Call this when the page loads
window.addEventListener('load', async () => {
    loadModel();
    await checkWebcamAvailability();
}); 