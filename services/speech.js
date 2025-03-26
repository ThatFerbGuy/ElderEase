class SpeechService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.defaultVoice = null;

        // Load available voices
        this.loadVoices();
        
        // Some browsers need a delay to load voices
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        
        // Set default voice (preferably English)
        if (this.voices.length > 0) {
            this.defaultVoice = this.voices.find(voice => 
                voice.lang.includes('en-US') || voice.lang.includes('en-GB')
            ) || this.voices[0];
        }
    }

    speak(text, options = {}) {
        // Stop any current speech
        this.stop();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice, rate, pitch, and volume
        utterance.voice = options.voice || this.defaultVoice;
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        
        // Save the current utterance
        this.currentUtterance = utterance;
        
        // Start speaking
        this.synth.speak(utterance);
        
        return utterance;
    }

    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.currentUtterance = null;
    }

    pause() {
        if (this.synth) {
            this.synth.pause();
        }
    }

    resume() {
        if (this.synth) {
            this.synth.resume();
        }
    }

    getVoices() {
        return this.voices;
    }
}

// Create a global instance of the speech service
window.speechService = new SpeechService(); 