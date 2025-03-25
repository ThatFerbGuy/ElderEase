// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const languageSelect = document.getElementById('language-select');
const voiceSelect = document.getElementById('voice-select');
const rateRange = document.getElementById('rate-range');
const rateValue = document.getElementById('rate-value');
const progressContainer = document.querySelector('.progress-container');
const progressBar = document.querySelector('.progress');
const progressText = document.querySelector('.progress-text');
const resultContainer = document.querySelector('.result-container');
const extractedText = document.getElementById('extractedText');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const copyBtn = document.getElementById('copyBtn');

// Speech synthesis setup
let speechSynth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;

// Initialize voices
function loadVoices() {
    voices = speechSynth.getVoices();
    voiceSelect.innerHTML = voices
        .map((voice, index) => `<option value="${index}">${voice.name} (${voice.lang})</option>`)
        .join('');
}

speechSynth.onvoiceschanged = loadVoices;
loadVoices();

// Update rate display
rateRange.addEventListener('input', () => {
    rateValue.textContent = `${rateRange.value}x`;
});

// Handle image upload
imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('Please upload an image smaller than 10MB');
        return;
    }

    // Display image preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Process image
    await processImage(file);
});

// Process image with Tesseract.js
async function processImage(file) {
    try {
        progressContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        extractedText.textContent = '';
        progressBar.style.width = '0%';
        progressText.textContent = 'Initializing...';

        // Create a worker and load language
        const worker = await Tesseract.createWorker();
        
        // Update progress bar during initialization
        progressBar.style.width = '20%';
        progressText.textContent = 'Loading language data...';
        
        await worker.loadLanguage(languageSelect.value);
        progressBar.style.width = '40%';
        
        await worker.initialize(languageSelect.value);
        progressBar.style.width = '60%';
        
        progressText.textContent = 'Recognizing text...';
        
        // Recognize text
        const { data: { text } } = await worker.recognize(file);
        
        // Clean up worker
        await worker.terminate();
        
        // Check if text was extracted
        if (!text.trim()) {
            throw new Error('No text was found in the image');
        }

        // Display results
        extractedText.textContent = text;
        progressContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        
        // Enable buttons
        playBtn.disabled = false;
        copyBtn.disabled = false;

    } catch (error) {
        console.error('Error processing image:', error);
        progressContainer.style.display = 'block';
        progressText.textContent = error.message || 'Error processing image. Please try again.';
        progressBar.style.width = '0%';
        
        // Show error for 3 seconds then reset
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressText.textContent = '';
        }, 3000);
    }
}

// Speech controls
playBtn.addEventListener('click', () => {
    if (!extractedText.textContent.trim()) {
        alert('No text to read');
        return;
    }

    if (speechSynth.speaking && speechSynth.paused) {
        return speechSynth.resume();
    }

    if (speechSynth.speaking) return;

    const utterance = new SpeechSynthesisUtterance(extractedText.textContent);
    utterance.voice = voices[voiceSelect.value];
    utterance.rate = parseFloat(rateRange.value);

    utterance.onstart = () => {
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
    };

    utterance.onend = () => {
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
    };

    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
    };

    currentUtterance = utterance;
    speechSynth.speak(utterance);
});

pauseBtn.addEventListener('click', () => {
    if (speechSynth.speaking) {
        speechSynth.pause();
        playBtn.disabled = false;
    }
});

stopBtn.addEventListener('click', () => {
    if (speechSynth.speaking) {
        speechSynth.cancel();
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
    }
});

copyBtn.addEventListener('click', () => {
    const text = extractedText.textContent.trim();
    if (!text) {
        alert('No text to copy');
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="btn-icon">✅</span> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text:', err);
            alert('Failed to copy text to clipboard');
        });
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden && speechSynth.speaking) {
        speechSynth.pause();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if Tesseract is loaded
    if (typeof Tesseract === 'undefined') {
        alert('Error: Tesseract.js failed to load. Please check your internet connection and refresh the page.');
    }
}); 