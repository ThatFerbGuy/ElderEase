// Speech Recognition API
let recognition = null;
let isRecording = false;
let finalTranscript = '';
let interimTranscript = '';

// DOM Elements - Main Controls
const textOutput = document.getElementById('text-output');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const sendToTTSBtn = document.getElementById('send-to-tts-btn');
const wordCounter = document.getElementById('wordCounter');
const statusText = document.getElementById('status-text');
const speechWave = document.getElementById('speech-wave');

// DOM Elements - Settings
const languageSelect = document.getElementById('language-select');
const continuousMode = document.getElementById('continuous-mode');
const interimResults = document.getElementById('interim-results');
const autoPunctuate = document.getElementById('auto-punctuate');

// DOM Element - Status Message
const statusMessage = document.getElementById('statusMessage');

// Check for browser support
function checkBrowserSupport() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showStatus('Speech recognition is not supported in your browser. Please try Chrome or Edge.', 'error');
        startBtn.disabled = true;
        return false;
    }
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showStatus('Microphone access is not supported in your browser. Please try a modern browser.', 'error');
        startBtn.disabled = true;
        return false;
    }
    
    return true;
}

// Initialize Speech Recognition
function initSpeechRecognition() {
    // Check for browser support first
    if (!checkBrowserSupport()) return;
    
    // Create speech recognition instance
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    // Configure recognition
    recognition.continuous = continuousMode.checked;
    recognition.interimResults = interimResults.checked;
    recognition.lang = languageSelect.value;
    
    // Event handlers
    recognition.onstart = () => {
        isRecording = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        updateStatus('Listening...');
        animateSpeechWave(true);
        
        // Change button text for better UX
        startBtn.innerHTML = '<span class="btn-icon">🎤</span> Recording...';
        showStatus('Started listening. Speak now...', 'info');
    };
    
    recognition.onresult = (event) => {
        // Process speech recognition results
        processRecognitionResults(event);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition error';
        
        // Customize message based on error type
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'aborted':
                errorMessage = 'Recognition aborted';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone issue detected. Please check if your microphone is muted in system settings and reload the page.';
                break;
            case 'network':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            case 'not-allowed':
            case 'service-not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and reload the page.';
                break;
        }
        
        showStatus(errorMessage, 'error');
        
        // Don't reset if it's just a no-speech error
        if (event.error !== 'no-speech' && isRecording) {
            resetRecognition();
        }
    };
    
    recognition.onend = () => {
        // If still in recording mode but recognition ended (timeout), restart it
        if (isRecording && continuousMode.checked) {
            recognition.start();
            updateStatus('Listening...');
        } else {
            resetRecognition();
        }
    };
}

// Process recognition results
function processRecognitionResults(event) {
    interimTranscript = '';
    
    // Process results
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
            // Process voice commands first
            if (processVoiceCommands(transcript.trim().toLowerCase())) {
                // If a command was processed, don't add it to the transcript
                continue;
            }
            
            // Add punctuation if option is enabled
            let processedText = autoPunctuate.checked ? addPunctuation(transcript) : transcript;
            
            // Append to final transcript
            finalTranscript += ' ' + processedText;
        } else {
            interimTranscript += transcript;
        }
    }
    
    // Update the text output
    updateTextOutput();
}

// Process voice commands
function processVoiceCommands(text) {
    // Check for commands
    if (text.includes('new line') || text.includes('newline')) {
        finalTranscript += '\n';
        return true;
    }
    
    if (text.includes('new paragraph')) {
        finalTranscript += '\n\n';
        return true;
    }
    
    if (text === 'period' || text === 'full stop') {
        finalTranscript += '.';
        return true;
    }
    
    if (text === 'question mark') {
        finalTranscript += '?';
        return true;
    }
    
    if (text === 'exclamation point' || text === 'exclamation mark') {
        finalTranscript += '!';
        return true;
    }
    
    if (text === 'comma') {
        finalTranscript += ',';
        return true;
    }
    
    if (text.includes('delete that') || text.includes('erase that')) {
        // Delete the last sentence or last chunk of text
        const lastPeriodIndex = finalTranscript.lastIndexOf('.');
        const lastQuestionIndex = finalTranscript.lastIndexOf('?');
        const lastExclamationIndex = finalTranscript.lastIndexOf('!');
        
        const lastIndex = Math.max(lastPeriodIndex, lastQuestionIndex, lastExclamationIndex);
        
        if (lastIndex !== -1) {
            finalTranscript = finalTranscript.substring(0, lastIndex + 1);
        } else {
            // If no punctuation, delete the last 10 words or so
            const words = finalTranscript.trim().split(' ');
            if (words.length > 10) {
                finalTranscript = words.slice(0, -10).join(' ') + ' ';
            } else {
                finalTranscript = '';
            }
        }
        
        updateTextOutput();
        return true;
    }
    
    if (text.includes('stop listening')) {
        stopRecognition();
        return true;
    }
    
    // Not a command
    return false;
}

// Add punctuation to text based on simple rules
function addPunctuation(text) {
    // Basic rules for punctuation
    let processedText = text.trim();
    
    // Capitalize first letter of sentences
    if (processedText.length > 0) {
        processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
    }
    
    // Add periods to the end of sentences when they seem to end
    // This is a very simple implementation, could be improved
    const sentenceEndingWords = ['right', 'okay', 'sure', 'thanks', 'thank you', 'yes', 'no', 'yeah', 'nope'];
    
    for (const word of sentenceEndingWords) {
        if (processedText.toLowerCase().endsWith(word)) {
            processedText += '.';
            break;
        }
    }
    
    return processedText;
}

// Update the text output field
function updateTextOutput() {
    // Clean up the final transcript (remove double spaces, etc.)
    const cleanedFinalTranscript = finalTranscript.trim().replace(/\s+/g, ' ');
    
    // Display the transcript
    textOutput.value = cleanedFinalTranscript + ' ' + interimTranscript;
    
    // Update word count
    updateWordCount();
    
    // Auto-scroll to the bottom
    textOutput.scrollTop = textOutput.scrollHeight;
}

// Reset recognition state
function resetRecognition() {
    isRecording = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    startBtn.innerHTML = '<span class="btn-icon">🎤</span> Start Recording';
    updateStatus('Ready');
    animateSpeechWave(false);
}

// Start speech recognition
function startRecognition() {
    try {
        // First request microphone permission explicitly before starting recognition
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // Permission granted, clean up the stream
                stream.getTracks().forEach(track => track.stop());
                
                // Initialize and start recognition
                initSpeechRecognition();
                recognition.start();
            })
            .catch(err => {
                console.error('Microphone permission error:', err);
                
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    showStatus('Microphone access denied. Please allow microphone access in your browser settings.', 'error');
                } else if (err.name === 'NotFoundError') {
                    showStatus('No microphone found. Please check your microphone connection or try a different device.', 'error');
                } else {
                    showStatus(`Microphone error: ${err.message}. Try restarting your browser.`, 'error');
                }
                
                resetRecognition();
            });
    } catch (error) {
        console.error('Error starting recognition:', error);
        showStatus(`Error starting speech recognition: ${error.message}. Please make sure your microphone is connected and working.`, 'error');
        resetRecognition();
    }
}

// Stop speech recognition
function stopRecognition() {
    if (recognition) {
        recognition.stop();
    }
    
    isRecording = false;
    updateStatus('Stopped');
    
    // Finalize any interim results
    if (interimTranscript) {
        finalTranscript += ' ' + interimTranscript;
        interimTranscript = '';
        updateTextOutput();
    }
    
    resetRecognition();
    showStatus('Recording stopped', 'info');
}

// Clear transcript
function clearTranscript() {
    finalTranscript = '';
    interimTranscript = '';
    textOutput.value = '';
    updateWordCount();
    
    updateStatus('Cleared');
    setTimeout(() => {
        updateStatus('Ready');
    }, 1000);
    
    showStatus('Transcript cleared', 'info');
}

// Copy transcript to clipboard
function copyTranscript() {
    if (!textOutput.value) {
        showStatus('Nothing to copy', 'error');
        return;
    }
    
    textOutput.select();
    document.execCommand('copy');
    
    // Deselect text
    window.getSelection().removeAllRanges();
    
    showStatus('Transcript copied to clipboard', 'success');
}

// Send transcript to text-to-speech page
function sendToTTS() {
    if (!textOutput.value) {
        showStatus('No text to send', 'error');
        return;
    }
    
    // Store in localStorage for the TTS page to read
    localStorage.setItem('sttText', textOutput.value);
    
    // Navigate to the TTS page
    window.location.href = 'text-to-speech.html';
}

// Update word count
function updateWordCount() {
    const text = textOutput.value.trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    wordCounter.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

// Update status text
function updateStatus(status) {
    statusText.textContent = status;
}

// Animate speech wave
function animateSpeechWave(active) {
    if (active) {
        speechWave.classList.add('active');
    } else {
        speechWave.classList.remove('active');
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    // Clear the message after 3 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// Event Listeners
startBtn.addEventListener('click', startRecognition);
stopBtn.addEventListener('click', stopRecognition);
clearBtn.addEventListener('click', clearTranscript);
copyBtn.addEventListener('click', copyTranscript);
sendToTTSBtn.addEventListener('click', sendToTTS);

// Settings change event listeners
languageSelect.addEventListener('change', () => {
    if (isRecording) {
        stopRecognition();
        startRecognition();
    }
});

continuousMode.addEventListener('change', () => {
    if (isRecording) {
        stopRecognition();
        startRecognition();
    }
});

interimResults.addEventListener('change', () => {
    if (isRecording) {
        stopRecognition();
        startRecognition();
    }
});

// Test microphone access directly
function testMicrophoneAccess() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Microphone access granted
            showStatus('Microphone access granted. Ready to start recording.', 'success');
            startBtn.disabled = false;
            
            // Clean up the stream
            stream.getTracks().forEach(track => track.stop());
        })
        .catch(error => {
            console.error('Microphone test failed:', error);
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                showStatus('Microphone access is blocked. Please allow it in your browser settings.', 'error');
            } else {
                showStatus('Unable to access microphone. Please check your device settings.', 'error');
            }
            
            startBtn.disabled = true;
        });
}

// Initialize on page load
function initialize() {
    // Check for browser support
    if (checkBrowserSupport()) {
        // Show initial permission info
        showStatus('This feature requires microphone access. Please allow it when prompted.', 'info');
        
        // Try to check microphone permission status using Permissions API
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' })
                .then(permissionStatus => {
                    if (permissionStatus.state === 'granted') {
                        showStatus('Microphone access is allowed. Ready to start recording.', 'success');
                    } else if (permissionStatus.state === 'denied') {
                        showStatus('Microphone access is blocked. Please allow it in your browser settings.', 'error');
                        startBtn.disabled = true;
                    } else {
                        // Permission status is 'prompt', test microphone directly
                        testMicrophoneAccess();
                    }
                    
                    permissionStatus.onchange = function() {
                        if (this.state === 'granted') {
                            showStatus('Microphone access granted. Ready to start recording.', 'success');
                            startBtn.disabled = false;
                        } else {
                            showStatus('Microphone access denied. Voice recording is unavailable.', 'error');
                            startBtn.disabled = true;
                        }
                    };
                })
                .catch(error => {
                    console.log('Unable to check permission status:', error);
                    // Try direct microphone test as fallback
                    testMicrophoneAccess();
                });
        } else {
            // Permissions API not supported, test microphone directly
            testMicrophoneAccess();
        }
    }
    
    // Check for text sent from speech-to-text page
    if (localStorage.getItem('ttsText')) {
        textOutput.value = localStorage.getItem('ttsText');
        localStorage.removeItem('ttsText'); // Clear after using
        updateWordCount();
    }
    
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Set initial status
    updateStatus('Ready');
}

// Start initialization
initialize(); 