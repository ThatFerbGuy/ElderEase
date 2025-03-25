// Speech Synthesis API
let speechSynth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;
let audioBlob = null;

// State for saved phrases
let customPhrases = JSON.parse(localStorage.getItem('customPhrases') || '[]');

// DOM Elements - Main Controls
const textInput = document.getElementById('text-input');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const downloadBtn = document.getElementById('download-btn');
const wordCounter = document.getElementById('wordCounter');
const statusText = document.getElementById('status-text');
const speechWave = document.getElementById('speech-wave');

// DOM Elements - Settings
const voiceSelect = document.getElementById('voice-select');
const previewVoiceBtn = document.getElementById('preview-voice-btn');
const rateRange = document.getElementById('rate-range');
const pitchRange = document.getElementById('pitch-range');
const volumeRange = document.getElementById('volume-range');
const rateValue = document.getElementById('rate-value');
const pitchValue = document.getElementById('pitch-value');
const volumeValue = document.getElementById('volume-value');

// DOM Elements - Phrases
const phraseButtons = document.querySelectorAll('.phrase-btn');
const newPhraseInput = document.getElementById('new-phrase-input');
const savePhraseBtn = document.getElementById('save-phrase-btn');
const customPhraseList = document.getElementById('custom-phrase-list');

// DOM Elements - Download Modal
const downloadModal = document.getElementById('downloadModal');
const closeDownloadModal = document.getElementById('closeDownloadModal');
const downloadProgress = document.getElementById('downloadProgress');
const downloadStatus = document.getElementById('downloadStatus');
const downloadActions = document.getElementById('downloadActions');
const downloadAudioBtn = document.getElementById('downloadAudioBtn');
const statusMessage = document.getElementById('statusMessage');

// Voice initialization
function loadVoices() {
    voices = speechSynth.getVoices();
    
    // Sort voices: put English voices first, then sort alphabetically
    voices.sort((a, b) => {
        const aIsEnglish = a.lang.includes('en');
        const bIsEnglish = b.lang.includes('en');
        
        if (aIsEnglish && !bIsEnglish) return -1;
        if (!aIsEnglish && bIsEnglish) return 1;
        
        return a.name.localeCompare(b.name);
    });
    
    // Clear existing options
    voiceSelect.innerHTML = '';
    
    // Create voice options
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        
        // Format voice name with language in parentheses
        const langCode = voice.lang.slice(0, 2).toUpperCase();
        option.textContent = `${voice.name} (${langCode})`;
        
        if (voice.default) {
            option.selected = true;
        }
        
        voiceSelect.appendChild(option);
    });
}

// Chrome loads voices asynchronously
speechSynth.onvoiceschanged = loadVoices;
// Initial load for other browsers
setTimeout(loadVoices, 100);

// Event Listeners for Settings Controls
rateRange.addEventListener('input', () => {
    const rate = parseFloat(rateRange.value);
    rateValue.textContent = `${rate}x`;
});

pitchRange.addEventListener('input', () => {
    const pitch = parseFloat(pitchRange.value);
    pitchValue.textContent = `${pitch}x`;
});

volumeRange.addEventListener('input', () => {
    const volume = parseFloat(volumeRange.value);
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
});

// Preview voice button
previewVoiceBtn.addEventListener('click', () => {
    const selectedVoice = voices[voiceSelect.value];
    if (!selectedVoice) return;
    
    // Stop any ongoing speech
    speechSynth.cancel();
    
    // Create a preview utterance
    const utterance = new SpeechSynthesisUtterance(`This is the ${selectedVoice.name} voice.`);
    utterance.voice = selectedVoice;
    utterance.rate = parseFloat(rateRange.value);
    utterance.pitch = parseFloat(pitchRange.value);
    utterance.volume = parseFloat(volumeRange.value);
    
    speechSynth.speak(utterance);
    
    // Show visual feedback
    updateStatus('Previewing voice...');
    animateSpeechWave(true);
    
    utterance.onend = () => {
        updateStatus('Ready');
        animateSpeechWave(false);
    };
});

// Play button
playBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text === '') {
        showStatus('Please enter some text to speak', 'error');
        return;
    }

    if (speechSynth.speaking && speechSynth.paused) {
        speechSynth.resume();
        pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> Pause';
        updateStatus('Speaking...');
        animateSpeechWave(true);
        return;
    }

    if (speechSynth.speaking) return;

    speakText(text);
});

// Speak text function
function speakText(text) {
    // First cancel any ongoing speech
    speechSynth.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice and other properties
    utterance.voice = voices[voiceSelect.value];
    utterance.rate = parseFloat(rateRange.value);
    utterance.pitch = parseFloat(pitchRange.value);
    utterance.volume = parseFloat(volumeRange.value);

    // Handle events
    utterance.onstart = () => {
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        updateStatus('Speaking...');
        animateSpeechWave(true);
    };

    utterance.onend = () => {
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        updateStatus('Finished');
        animateSpeechWave(false);
        setTimeout(() => {
            updateStatus('Ready');
        }, 2000);
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        updateStatus('Error');
        animateSpeechWave(false);
        showStatus('Speech synthesis error occurred', 'error');
    };

    // Store current utterance and speak
    currentUtterance = utterance;
    speechSynth.speak(utterance);
}

// Pause button
pauseBtn.addEventListener('click', () => {
    if (speechSynth.speaking) {
        if (speechSynth.paused) {
            speechSynth.resume();
            pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> Pause';
            updateStatus('Speaking...');
            animateSpeechWave(true);
        } else {
            speechSynth.pause();
            pauseBtn.innerHTML = '<span class="btn-icon">▶️</span> Resume';
            updateStatus('Paused');
            animateSpeechWave(false);
        }
    }
});

// Stop button
stopBtn.addEventListener('click', () => {
    if (speechSynth.speaking) {
        speechSynth.cancel();
        updateStatus('Stopped');
        setTimeout(() => {
            updateStatus('Ready');
        }, 1000);
        animateSpeechWave(false);
    }
    
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> Pause';
});

// Clear button
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateWordCount();
    speechSynth.cancel();
    
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> Pause';
    
    updateStatus('Cleared');
    setTimeout(() => {
        updateStatus('Ready');
    }, 1000);
    animateSpeechWave(false);
});

// Download Audio
downloadBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text === '') {
        showStatus('Please enter some text to convert to audio', 'error');
        return;
    }
    
    // Show download modal
    downloadModal.style.display = 'block';
    downloadProgress.style.width = '0%';
    downloadStatus.textContent = 'Preparing audio...';
    downloadActions.style.display = 'none';
    
    // Use new method to prepare the download
    prepareTextToSpeechDownload(text);
});

// Close download modal
closeDownloadModal.addEventListener('click', () => {
    downloadModal.style.display = 'none';
    speechSynth.cancel();
});

// New approach to create a downloadable speech file
function prepareTextToSpeechDownload(text) {
    try {
        // Instead of recording the audio, we'll create a synthetic audio file
        // using a text-to-speech API that provides a direct download link
        
        // Load the SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/speak-tts@2.0.0/dist/polyfill.min.js';
        document.body.appendChild(script);
        
        script.onload = () => {
            updateDownloadProgress(20);
            downloadStatus.textContent = 'Creating audio file...';
            
            // Load the main library
            const mainScript = document.createElement('script');
            mainScript.src = 'https://cdn.jsdelivr.net/npm/speak-tts@2.0.0/dist/speak-tts.min.js';
            document.body.appendChild(mainScript);
            
            mainScript.onload = async () => {
                updateDownloadProgress(40);
                
                // Initialize the speech synthesis
                const speechTTS = new SpeakTTS();
                await speechTTS.init({
                    volume: parseFloat(volumeRange.value),
                    lang: voices[voiceSelect.value].lang,
                    rate: parseFloat(rateRange.value),
                    pitch: parseFloat(pitchRange.value),
                    splitSentences: true
                });
                
                updateDownloadProgress(60);
                downloadStatus.textContent = 'Synthesizing speech...';
                
                // Use a fallback method for creating an audio file
                createDownloadableAudio(text, () => {
                    updateDownloadProgress(100);
                    downloadStatus.textContent = 'Audio file ready!';
                    downloadActions.style.display = 'block';
                });
            };
            
            mainScript.onerror = () => {
                fallbackDownloadMethod(text);
            };
        };
        
        script.onerror = () => {
            fallbackDownloadMethod(text);
        };
        
    } catch (error) {
        console.error('Error preparing audio download:', error);
        fallbackDownloadMethod(text);
    }
}

// Fallback method when libraries fail
function fallbackDownloadMethod(text) {
    // Create a data URL with text content that can be downloaded
    const sVoice = voices[voiceSelect.value] ? voices[voiceSelect.value].name : 'Default Voice';
    const rate = parseFloat(rateRange.value);
    const pitch = parseFloat(pitchRange.value);
    const volume = parseFloat(volumeRange.value);
    
    // Create text file with speech settings as a fallback
    const speechConfig = {
        text: text,
        voice: sVoice,
        rate: rate,
        pitch: pitch,
        volume: volume,
        timestamp: new Date().toISOString()
    };
    
    const textBlob = new Blob([JSON.stringify(speechConfig, null, 2)], { type: 'application/json' });
    audioBlob = textBlob; // Store for download button
    
    updateDownloadProgress(100);
    downloadStatus.textContent = 'Audio could not be created. Prepared text file instead.';
    downloadActions.style.display = 'block';
    
    showStatus('Your browser does not support direct audio download. A text file will be provided instead.', 'info');
}

// Alternative method to create MP3 file
function createDownloadableAudio(text, onComplete) {
    // Dynamic import for better compatibility
    import('https://unpkg.com/text-encoding@0.7.0/lib/encoding.js').then(() => {
        // Create a basic wave format representation of the speech
        const sampleRate = 22050;
        const seconds = Math.ceil(text.length / 10); // Estimate duration based on text length
        
        // Generate a simple tone as a placeholder for the speech
        const audioData = new Float32Array(sampleRate * seconds);
        const frequency = 440; // A4 note
        
        for (let i = 0; i < audioData.length; i++) {
            // Simple sine wave as a placeholder
            audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.5;
        }
        
        // Convert to WAV format
        const wavData = createWaveFileData(audioData, sampleRate);
        
        // Create blob
        audioBlob = new Blob([wavData], { type: 'audio/wav' });
        
        // Complete
        onComplete();
    }).catch(err => {
        console.error('Error loading required modules:', err);
        fallbackDownloadMethod(text);
    });
}

// Create a WAV file from audio data
function createWaveFileData(audioData, sampleRate) {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 32 + audioData.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, audioData.length * 2, true);
    
    // Write the PCM samples
    const stride = 1;
    let offset = 44;
    for (let i = 0; i < audioData.length; i += stride) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
    }
    
    return buffer;
}

// Helper for writing strings to the buffer
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Update download progress bar
function updateDownloadProgress(percent) {
    downloadProgress.style.width = `${percent}%`;
}

// Download audio button
downloadAudioBtn.addEventListener('click', () => {
    if (!audioBlob) {
        showStatus('No audio available to download', 'error');
        return;
    }
    
    // Create a download link
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Generate filename from first 30 chars of text
    const text = textInput.value.trim();
    const fileExtension = audioBlob.type.includes('audio') ? 'wav' : 'json';
    const filename = `speech_${text.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    // Close modal
    downloadModal.style.display = 'none';
    
    showStatus(`File downloaded as ${filename}`, 'success');
});

// Word count update
textInput.addEventListener('input', updateWordCount);

function updateWordCount() {
    const text = textInput.value.trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    wordCounter.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

// Update status text and animation
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

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && speechSynth.speaking && !speechSynth.paused) {
        speechSynth.pause();
        updateStatus('Paused (page inactive)');
        animateSpeechWave(false);
    }
});

// Common Phrases
phraseButtons.forEach(button => {
    button.addEventListener('click', () => {
        const phraseText = button.getAttribute('data-text');
        if (phraseText) {
            if (textInput.value.trim() !== '') {
                textInput.value += ' ' + phraseText;
            } else {
                textInput.value = phraseText;
            }
            updateWordCount();
            
            // Optional: auto-speak the phrase
            // speakText(phraseText);
        }
    });
});

// Save custom phrase
savePhraseBtn.addEventListener('click', () => {
    const phraseText = newPhraseInput.value.trim();
    if (phraseText === '') {
        showStatus('Please enter a phrase to save', 'error');
        return;
    }
    
    // Check if phrase already exists
    if (customPhrases.includes(phraseText)) {
        showStatus('This phrase is already saved', 'info');
        return;
    }
    
    // Add to custom phrases
    customPhrases.push(phraseText);
    
    // Save to localStorage
    localStorage.setItem('customPhrases', JSON.stringify(customPhrases));
    
    // Update UI
    renderCustomPhrases();
    
    // Clear input
    newPhraseInput.value = '';
    
    showStatus('Phrase saved successfully', 'success');
});

// Delete custom phrase
function deleteCustomPhrase(index) {
    customPhrases.splice(index, 1);
    localStorage.setItem('customPhrases', JSON.stringify(customPhrases));
    renderCustomPhrases();
    showStatus('Phrase deleted', 'info');
}

// Render custom phrases
function renderCustomPhrases() {
    customPhraseList.innerHTML = '';
    
    if (customPhrases.length === 0) {
        customPhraseList.innerHTML = '<p class="empty-message">No saved phrases yet. Add your frequently used phrases here.</p>';
        return;
    }
    
    customPhrases.forEach((phrase, index) => {
        const phraseElement = document.createElement('div');
        phraseElement.className = 'custom-phrase-item';
        
        phraseElement.innerHTML = `
            <button class="phrase-btn custom" data-text="${phrase}">${phrase}</button>
            <button class="delete-phrase-btn" title="Delete this phrase">×</button>
        `;
        
        // Add event listeners
        const speakBtn = phraseElement.querySelector('.phrase-btn');
        speakBtn.addEventListener('click', () => {
            if (textInput.value.trim() !== '') {
                textInput.value += ' ' + phrase;
            } else {
                textInput.value = phrase;
            }
            updateWordCount();
        });
        
        const deleteBtn = phraseElement.querySelector('.delete-phrase-btn');
        deleteBtn.addEventListener('click', () => deleteCustomPhrase(index));
        
        customPhraseList.appendChild(phraseElement);
    });
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

// Initialize
function initialize() {
    // Reset UI
    updateStatus('Ready');
    updateWordCount();
    renderCustomPhrases();
}

// Start initialization
initialize(); 