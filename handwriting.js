// DOM Elements
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const penSize = document.getElementById('penSize');
const penSizeValue = document.getElementById('penSizeValue');
const penColor = document.getElementById('penColor');
const recognizeBtn = document.getElementById('recognizeBtn');
const speakBtn = document.getElementById('speakBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const resultDiv = document.getElementById('result');
const confidenceDiv = document.getElementById('confidence');
const historyDiv = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const imageUpload = document.getElementById('imageUpload');
const statusDiv = document.getElementById('status');

// Settings elements
// We're no longer using these advanced settings
// const enhanceContrastCheckbox = document.getElementById('enhanceContrast');
// const removeNoiseCheckbox = document.getElementById('removeNoise');
// const thickenStrokesCheckbox = document.getElementById('thickenStrokes');
// const autoRotateCheckbox = document.getElementById('autoRotate');
// const detectOrientationCheckbox = document.getElementById('detectOrientation');

// Still using these settings
const languageSelect = document.getElementById('language');
const recognitionModeSelect = document.getElementById('recognitionMode');

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];
let currentPath = [];
let recognizedText = '';

// Initialize canvas
function initCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = penColor.value;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = penSize.value;
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDrawing);

// Touch event handler
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: x + rect.left,
        clientY: y + rect.top
    });
    canvas.dispatchEvent(mouseEvent);
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    currentPath = [[lastX, lastY]];
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function draw(e) {
    if (!isDrawing) return;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    
    [lastX, lastY] = [e.offsetX, e.offsetY];
    currentPath.push([lastX, lastY]);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    drawingHistory.push({
        path: currentPath,
        color: ctx.strokeStyle,
        width: ctx.lineWidth
    });
    currentPath = [];
}

// Simplified image preprocessing for elder use
async function preprocessImage(imageData) {
    try {
        // Create a temporary canvas for preprocessing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the current canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Simple contrast enhancement
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        // Basic contrast enhancement to make text clearer
        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale
            const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            
            // Simple threshold for clearer writing
            const newValue = gray < 150 ? 0 : 255;
            
            data[i] = data[i + 1] = data[i + 2] = newValue;
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        return tempCanvas;
    } catch (error) {
        console.error('Preprocessing error:', error);
        // Return original canvas if preprocessing fails
        return canvas;
    }
}

// Text recognition with simplified settings
async function recognizeText(imageElement) {
    try {
        const scheduler = recognitionModeSelect.value === 'accurate' ? 
            Tesseract.createScheduler() : undefined;
        
        // Language mapping for proper Tesseract language codes
        const languageMap = {
            'eng': 'eng',
            'hin': 'hin',
            'mal': 'mal',
            'eng+hin': 'eng+hin',
            'eng+mal': 'eng+mal',
            'eng+fra': 'eng+fra',
            'eng+spa': 'eng+spa',
            'eng+deu': 'eng+deu'
        };
        
        const selectedLang = languageMap[languageSelect.value] || 'eng';
        
        // Use standard settings for elder-friendly use
        const config = {
            lang: selectedLang,
            tessedit_pageseg_mode: '1', // Automatic page segmentation
            tessedit_ocr_engine_mode: recognitionModeSelect.value === 'accurate' ? 2 : 3, // 2 for neural nets, 3 for fast
            tessedit_enable_doc_dict: 1,
            tessedit_preserve_interword_spaces: 1,
            tessedit_auto_rotate: 1, // Always enable auto-rotate
            detect_orientation: 1  // Always enable orientation detection
        };
        
        // Add specific character sets for Indian languages
        if (selectedLang.includes('hin')) {
            config.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-_\'"\n अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह';
        } else if (selectedLang.includes('mal')) {
            config.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-_\'"\n അആഇഈഉഊഋഌഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറ';
        } else {
            config.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-_\'"\n ';
        }

        const result = await Tesseract.recognize(imageElement, selectedLang, {
            logger: message => {
                if (message.status === 'recognizing text') {
                    showStatus(`Recognition progress: ${Math.round(message.progress * 100)}%`, 'info');
                }
            },
            ...config
        });

        if (scheduler) {
            scheduler.terminate();
        }

        return {
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            words: result.data.words
        };
    } catch (error) {
        console.error('Recognition error:', error);
        throw new Error('Failed to recognize text. Please try again.');
    }
}

// Recognition button click handler
recognizeBtn.addEventListener('click', async () => {
    showStatus('Processing handwriting...', 'info');
    recognizeBtn.disabled = true;
    
    try {
        // Check if canvas is empty
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let isEmpty = true;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] !== 0) { // Check alpha channel
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            showStatus('Please write or upload something first', 'error');
            recognizeBtn.disabled = false;
            return;
        }
        
        // Preprocess the image
        const processedCanvas = await preprocessImage(canvas);
        
        // Perform recognition
        const result = await recognizeText(processedCanvas);
        
        recognizedText = result.text;
        if (recognizedText) {
            resultDiv.textContent = recognizedText;
            confidenceDiv.textContent = `Confidence: ${Math.round(result.confidence)}%`;
            
            speakBtn.disabled = false;
            copyBtn.disabled = false;
            saveBtn.disabled = false;
            
            addToHistory(recognizedText, result.confidence);
            showStatus('Text recognition complete', 'success');
        } else {
            showStatus('No text was recognized. Try writing more clearly.', 'error');
        }
    } catch (error) {
        console.error('Recognition error:', error);
        showStatus(error.message || 'Error during text recognition. Please try again.', 'error');
    } finally {
        recognizeBtn.disabled = false;
    }
});

// Pen settings
penSize.addEventListener('input', (e) => {
    ctx.lineWidth = e.target.value;
    penSizeValue.textContent = e.target.value + 'px';
});

penColor.addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value;
});

// Clear canvas
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory = [];
    currentPath = [];
    showStatus('Canvas cleared', 'info');
});

// Undo last stroke
undoBtn.addEventListener('click', () => {
    if (drawingHistory.length === 0) return;
    
    drawingHistory.pop();
    redrawCanvas();
    showStatus('Last stroke undone', 'info');
});

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory.forEach(stroke => {
        if (stroke.path.length < 2) return;
        
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.moveTo(stroke.path[0][0], stroke.path[0][1]);
        
        stroke.path.forEach(point => {
            ctx.lineTo(point[0], point[1]);
        });
        
        ctx.stroke();
    });
}

// Image upload handling
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showStatus('Please upload an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            drawingHistory = [];
            showStatus('Image uploaded successfully', 'success');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Text-to-speech with enhanced language support
speakBtn.addEventListener('click', () => {
    if (!recognizedText) return;
    
    // Get voices and find appropriate ones for selected language
    const voices = window.speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(recognizedText);
    
    // Set language based on selected recognition language
    const lang = languageSelect.value.split('+')[0]; // Use first language if multiple
    
    // Map language code to speech synthesis language code
    const langMap = {
        'eng': 'en-US',
        'hin': 'hi-IN',
        'mal': 'ml-IN',
        'fra': 'fr-FR',
        'spa': 'es-ES',
        'deu': 'de-DE'
    };
    
    utterance.lang = langMap[lang] || 'en-US';
    
    // Try to find a voice for the selected language
    const voice = voices.find(v => v.lang.startsWith(utterance.lang)) || 
                  voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
    
    if (voice) {
        utterance.voice = voice;
    }
    
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    speechSynthesis.speak(utterance);
    showStatus(`Reading text aloud in ${langMap[lang] || 'English'}`, 'info');
});

// Copy to clipboard
copyBtn.addEventListener('click', () => {
    if (!recognizedText) return;
    
    navigator.clipboard.writeText(recognizedText)
        .then(() => showStatus('Text copied to clipboard', 'success'))
        .catch(() => showStatus('Failed to copy text', 'error'));
});

// Save recognition
saveBtn.addEventListener('click', () => {
    if (!recognizedText) return;
    
    const blob = new Blob([recognizedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recognized_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Text saved to file', 'success');
});

// History management
function addToHistory(text, confidence) {
    const timestamp = new Date().toLocaleString();
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-content">
            <div class="history-text">${text}</div>
            <div class="history-confidence">Confidence: ${Math.round(confidence)}%</div>
            <div class="history-time">${timestamp}</div>
        </div>
        <div class="history-actions">
            <button class="history-btn speak-btn" title="Speak">🔊</button>
            <button class="history-btn copy-btn" title="Copy">📋</button>
            <button class="history-btn delete-btn" title="Delete">🗑️</button>
        </div>
    `;
    
    // Add event listeners to history item buttons
    historyItem.querySelector('.speak-btn').addEventListener('click', () => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language based on selected recognition language
        const lang = languageSelect.value.split('+')[0]; // Use first language if multiple
        
        // Map language code to speech synthesis language code
        const langMap = {
            'eng': 'en-US',
            'hin': 'hi-IN',
            'mal': 'ml-IN',
            'fra': 'fr-FR',
            'spa': 'es-ES',
            'deu': 'de-DE'
        };
        
        utterance.lang = langMap[lang] || 'en-US';
        
        // Get voices and find appropriate ones for selected language
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(utterance.lang)) || 
                      voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.rate = 0.9;
        
        speechSynthesis.speak(utterance);
        showStatus(`Reading text aloud in ${langMap[lang] || 'English'}`, 'info');
    });
    
    historyItem.querySelector('.copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(text)
            .then(() => showStatus('Text copied to clipboard', 'success'))
            .catch(() => showStatus('Failed to copy text', 'error'));
    });
    
    historyItem.querySelector('.delete-btn').addEventListener('click', () => {
        historyItem.remove();
        showStatus('History item deleted', 'info');
    });
    
    historyDiv.insertBefore(historyItem, historyDiv.firstChild);
}

// Clear history
clearHistoryBtn.addEventListener('click', () => {
    historyDiv.innerHTML = '';
    showStatus('History cleared', 'info');
});

// Status message handler
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
    }, 3000);
}

// Initialize on load
window.addEventListener('load', () => {
    initCanvas();
    
    // Load voices for text-to-speech
    if (window.speechSynthesis) {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                // Voices loaded (this helps ensure voices are loaded in Chrome)
                console.log("Voices loaded:", window.speechSynthesis.getVoices().length);
            };
        }
    }
    
    showStatus('Ready to recognize handwriting', 'info');
});

// Handle window resize
window.addEventListener('resize', () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    initCanvas();
    ctx.putImageData(imageData, 0, 0);
}); 