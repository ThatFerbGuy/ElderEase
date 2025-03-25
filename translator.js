// DOM Elements
const fromLang = document.getElementById('fromLang');
const toLang = document.getElementById('toLang');
const sourceText = document.getElementById('sourceText');
const translatedText = document.getElementById('translatedText');
const translateBtn = document.getElementById('translateBtn');
const swapLang = document.getElementById('swapLang');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');

// Initialize speech synthesis
const synth = window.speechSynthesis;

// Language names for display
const languageNames = {
    'en': 'English',
    'ml': 'Malayalam',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu'
};

// Mock translations for common phrases and words
const mockTranslations = {
    'hi': {
        // Basic Greetings
        'hello': 'नमस्ते', 'hi': 'हाय', 'good morning': 'सुप्रभात', 'good afternoon': 'नमस्कार',
        'good evening': 'शुभ संध्या', 'good night': 'शुभ रात्रि', 'how are you': 'आप कैसे हैं', 
        'i am fine': 'मैं ठीक हूँ', 'nice to meet you': 'आपसे मिलकर खुशी हुई', 'see you later': 'फिर मिलेंगे',

        // Common Phrases
        'thank you': 'धन्यवाद', 'please': 'कृपया', 'sorry': 'माफ कीजिए', 'yes': 'हाँ', 'no': 'नहीं', 
        'excuse me': 'माफ़ कीजिए', 'help me': 'मेरी मदद करें', 'i dont understand': 'मुझे समझ नहीं आ रहा है', 
        'do you speak english': 'क्या आप अंग्रे़ी बोलते हैं?', 'speak slowly': 'धीरे बोलें',

        // Directions & Navigation
        'where is': 'कहाँ है', 'left': 'बाएँ', 'right': 'दाएँ', 'straight': 'सीधा', 'near': 'पास में',
        'far': 'दूर', 'bus stop': 'बस स्टॉप', 'train station': 'रेलवे स्टेशन', 'hospital': 'अस्पताल', 'market': 'बाज़ार',

        // Health & Emergency
        'doctor': 'डॉक्टर', 'hospital': 'अस्पताल', 'medicine': 'दवा', 'pain': 'दर्द', 'headache': 'सिरदर्द', 
        'fever': 'बुखार', 'ambulance': 'एम्बुलेंस', 'police': 'पुलिस', 'help': 'मदद', 'fire': 'आग', 

        // Family & Relationships
        'mother': 'माँ', 'father': 'पिता', 'brother': 'भाई', 'sister': 'बहन', 'grandmother': 'दादी',
        'grandfather': 'दादा', 'friend': 'मित्र', 'neighbor': 'पड़ोसी',

        // Daily Activities
        'water': 'पानी', 'food': 'भोजन', 'breakfast': 'नाश्ता', 'lunch': 'दोपहर का भोजन', 
        'dinner': 'रात का खाना', 'eat': 'खाना', 'drink': 'पीना', 'sleep': 'सोना', 

        // Technology & Communication
        'phone': 'फ़ोन', 'message': 'संदेश', 'call': 'कॉल', 'internet': 'इंटरनेट', 'battery': 'बैटरी',

        // Additional words
        'book': 'किताब', 'chair': 'कुर्सी', 'table': 'मेज़', 'light': 'रोशनी', 'door': 'दरवाज़ा',
        'welcome': 'स्वागत है', 'goodbye': 'अलविदा', 'stomach': 'पेट'
    },
    
    'ml': {
        // Basic Greetings
        'hello': 'നമസ്കാരം', 'hi': 'ഹായ്', 'good morning': 'സുപ്രഭാതം', 'good afternoon': 'ശുഭ സന്ധ്യ', 
        'good evening': 'ശുഭ രാത്രി', 'good night': 'ശുഭ രാത്രി', 'how are you': 'എങ്ങനെ ഉണ്ട്', 
        'i am fine': 'ഞാൻ സുഖമാണു', 'nice to meet you': 'നിനക്കൊപ്പം കാണുന്നത് സന്തോഷം', 'see you later': 'പിന്നീട് കാണാം',

        // Common Phrases
        'thank you': 'നന്ദി', 'please': 'ദയവായി', 'sorry': 'ക്ഷമിക്കണം', 'yes': 'അതെ', 'no': 'ഇല്ല', 
        'excuse me': 'ക്ഷമിക്കണം', 'help me': 'എനിക്ക് സഹായിക്കുക', 'i dont understand': 'എനിക്ക് മനസിലായില്ല', 
        'do you speak english': 'നിനക്ക് ഇംഗ്ലീഷ് സംസാരിക്കാമോ?', 'speak slowly': 'മടിഞ്ഞു സംസാരിക്കൂ',

        // Directions & Navigation
        'where is': 'എവിടെയാണ്', 'left': 'ഇടതു', 'right': 'വലതു', 'straight': 'സിറി', 'near': 'പുറത്തുള്ള', 
        'far': 'ദൂരം', 'bus stop': 'ബസ് സ്റ്റോപ്പ്', 'train station': 'ട്രെയിൻ സ്റ്റേഷൻ', 'hospital': 'ആശുപത്രി', 'market': 'വിപണി',

        // Health & Emergency
        'doctor': 'ഡോക്ടർ', 'hospital': 'ആശുപത്രി', 'medicine': 'മരുന്ന്', 'pain': 'വേദന', 'headache': 'തലവേദന', 
        'fever': 'പനി', 'ambulance': 'ആംബുലൻസ്', 'police': 'പോലീസ്', 'help': 'സഹായം', 'fire': 'അഗ്നി', 

        // Family & Relationships
        'mother': 'അമ്മ', 'father': 'അച്ഛൻ', 'brother': 'സഹോദരൻ', 'sister': 'സഹോദരി', 'grandmother': 'പെരുന്നത്തി', 
        'grandfather': 'പെരുന്നൻ', 'friend': 'സുഹൃത്ത്', 'neighbor': 'പുറംവളരെ',

        // Daily Activities
        'water': 'വെള്ളം', 'food': 'ഭക്ഷണം', 'breakfast': 'പ്രഭാതഭക്ഷണം', 'lunch': 'പകൽഭക്ഷണം', 
        'dinner': 'രാത്രിഭക്ഷണം', 'eat': 'ചെയ്യുക', 'drink': 'പാനീയം', 'sleep': 'ഉറക്കം', 

        // Technology & Communication
        'phone': 'ഫോൺ', 'message': 'സന്ദേശം', 'call': 'കോള', 'internet': 'ഇന്റർനെറ്റ്', 'battery': 'ബാറ്ററി',

        // Additional words
        'book': 'പുസ്തകം', 'chair': 'കുര്ഷി', 'table': 'മേശ', 'light': 'പ്രകാശം', 'door': 'കത്വാര',
        'welcome': 'സ്വാഗതം', 'goodbye': 'വിട', 'stomach': 'വയറ്'
    },

    'ta': {
      // Basic Greetings
        'hello': 'வணக்கம்', 'hi': 'ஹாய்', 'good morning': 'காலை வணக்கம்', 'good afternoon': 'மாலை வணக்கம்', 
        'good evening': 'சனி வணக்கம்', 'good night': 'இனிய இரவு', 'how are you': 'எப்படி இருக்கிறீர்கள்', 
        'i am fine': 'நான் நன்றாக இருக்கின்றேன்', 'nice to meet you': 'உங்களை சந்தித்ததில் மகிழ்ச்சி', 'see you later': 'பிறகு சந்திப்போம்',

        // Common Phrases
        'thank you': 'நன்றி', 'please': 'தயவுசெய்து', 'sorry': 'மன்னிக்கவும்', 'yes': 'ஆம்', 'no': 'இல்லை', 
        'excuse me': 'மன்னிக்கவும்', 'help me': 'எனக்கு உதவி செய்யவும்', 'i dont understand': 'எனக்கு புரியவில்லை', 
        'do you speak english': 'நீங்கள் ஆங்கிலம் பேசுகிறீர்களா?', 'speak slowly': 'மெல்ல பேசுங்கள்',

        // Directions & Navigation
        'where is': 'எங்கு உள்ளது', 'left': 'இடது', 'right': 'வலது', 'straight': 'நேராக', 'near': 'பக்கம்', 
        'far': 'தூரம்', 'bus stop': 'பஸ் நிறுத்தம்', 'train station': 'பொதுமுகம்', 'hospital': 'ஆசபத்திரம்', 'market': 'பெருந்தொகுதி',

        // Health & Emergency
        'doctor': 'மருத்துவர்', 'hospital': 'மருத்துவமனை', 'medicine': 'மருந்து', 'pain': 'வலி', 'headache': 'தலைவலி', 
        'fever': 'காய்ச்சல்', 'ambulance': 'ஆம்புலன்ஸ்', 'police': 'போலீசு', 'help': 'உதவி', 'fire': 'ஆக்சிடேன்', 

        // Family & Relationships
        'mother': 'அம்மா', 'father': 'அப்பா', 'brother': 'சகோதரன்', 'sister': 'சகோதரி', 'grandmother': 'பாட்டி', 
        'grandfather': 'தாத்தா', 'friend': 'மைத்திரி', 'neighbor': 'புறம்',

        // Daily Activities
        'water': 'தண்ணீர்', 'food': 'உணவு', 'breakfast': 'காலை உணவு', 'lunch': 'மதிய உணவு', 
        'dinner': 'இரவு உணவு', 'eat': 'சாப்பிடு', 'drink': 'பானம்', 'sleep': 'அராமம்', 

        // Technology & Communication
        'phone': 'தொலைபேசி', 'message': 'செய்தி', 'call': 'கால்', 'internet': 'இன்டர்நெட்', 'battery': 'பேட்டரி',

        // Additional words
        'book': 'புத்தகம்', 'chair': 'நாற்காலி', 'table': 'மேசை', 'light': 'ஒளி', 'door': 'வறிய',
        'welcome': 'வரவேற்கிறோம்', 'goodbye': 'பிரியாவிடை', 'stomach': 'வயிறு'
    },

    'te': {
      // Basic Greetings
        'hello': 'నమస్కారం', 'hi': 'హాయ్', 'good morning': 'శుభోదయం', 'good afternoon': 'శుభ సాయంకాలం', 
        'good evening': 'శుభ సాయంత్రం', 'good night': 'శుభ రాత్రి', 'how are you': 'ఎలా ఉన్నారు', 
        'i am fine': 'నేను బాగున్నాను', 'nice to meet you': 'మీతో కలవడం ఆనందంగా ఉంది', 'see you later': 'తర్వాత కలుద్దాం',

        // Common Phrases
        'thank you': 'ధన్యవాదాలు', 'please': 'దయచేసి', 'sorry': 'క్షమించండి', 'yes': 'అవును', 'no': 'కాదు', 
        'excuse me': 'మాఫీ చేయండి', 'help me': 'నా కు సహాయం చేయండి', 'i dont understand': 'నాకు అర్థం కావడంలేదు', 
        'do you speak english': 'మీరు ఆంగ్లం మాట్లాడుతారా?', 'speak slowly': 'తొడిగిగా మాట్లాడండి',

        // Directions & Navigation
        'where is': 'ఎక్కడ ఉంది', 'left': 'ఎడమ', 'right': 'కుడి', 'straight': 'సిద్ధంగా', 'near': 'ఎదురుగా', 
        'far': 'దూరంగా', 'bus stop': 'బస్ స్టాప్', 'train station': 'రైలు స్టేషన్', 'hospital': 'ఆసుపత్రి', 'market': 'బజార్',

        // Health & Emergency
        'doctor': 'డాక్టర్', 'hospital': 'ఆసుపత్రి', 'medicine': 'మందు', 'pain': 'నొప్పి', 'headache': 'తలనొప్పి', 
        'fever': 'జ్వరం', 'ambulance': 'ఆంబులెన్స్', 'police': 'పోలీసు', 'help': 'సహాయం', 'fire': 'ఆగ్ని', 

        // Family & Relationships
        'mother': 'తల్లి', 'father': 'తండ్రి', 'brother': 'సోదరుడు', 'sister': 'సోదరి', 'grandmother': 'నానమ్మ', 
        'grandfather': 'నాన్న', 'friend': 'మిత్రుడు', 'neighbor': 'ఆశుపక్క',

        // Daily Activities
        'water': 'నీరు', 'food': 'ఆహారం', 'breakfast': 'ప్రభాత భోజనం', 'lunch': 'మధ్యాహ్న భోజనం', 
        'dinner': 'రాత్రి భోజనం', 'eat': 'తినండి', 'drink': 'పానీయం', 'sleep': 'నిద్ర',

        // Technology & Communication
        'phone': 'ఫోన్', 'message': 'సందేశం', 'call': 'కాల్', 'internet': 'ఇంటర్నెట్', 'battery': 'బ్యాటరీ',

        // Additional words
        'book': 'పుస్తకం', 'chair': 'కుర్చీ', 'table': 'మేసా', 'light': 'ప్రకాశం', 'door': 'బాట',
        'welcome': 'స్వాగతం', 'goodbye': 'వీడ్కోలు', 'stomach': 'కడుపు'
    }
};

// Function to translate a sentence by breaking it into words
function translateSentence(sentence, from, to) {
    if (!sentence.trim()) return '';
    
    // Split into sentences and translate each
    return sentence.split(/[.!?]+/).map(s => {
        if (!s.trim()) return '';
        
        // Try to translate multi-word phrases first
        const trimmedSentence = s.trim().toLowerCase();
        if (mockTranslations[to]?.[trimmedSentence]) {
            return mockTranslations[to][trimmedSentence];
        }
        
        // Find multi-word phrases in the dictionary
        const phrases = Object.keys(mockTranslations[to] || {})
            .filter(phrase => phrase.includes(' '))
            .sort((a, b) => b.length - a.length); // Longest phrases first
        
        let modifiedSentence = trimmedSentence;
        
        // Replace known phrases with placeholders
        phrases.forEach((phrase, index) => {
            const phraseLower = phrase.toLowerCase();
            if (modifiedSentence.includes(phraseLower)) {
                const translation = mockTranslations[to][phrase];
                // Use a placeholder that won't be in the text
                const placeholder = `__PHRASE${index}__`;
                modifiedSentence = modifiedSentence.replace(
                    new RegExp(phraseLower, 'g'), 
                    placeholder
                );
                // Store the translation in the dictionary with the placeholder as the key
                mockTranslations[to][placeholder] = translation;
            }
        });
        
        // Now translate word by word, respecting the placeholders
        const translatedWords = modifiedSentence.split(' ').map(word => {
            // If it's a placeholder, return the stored translation
            if (word.startsWith('__PHRASE') && word.endsWith('__')) {
                const translation = mockTranslations[to][word];
                // Clean up the temporary entries we added
                delete mockTranslations[to][word];
                return translation;
            }
            
            // Otherwise, look up the single word
            return mockTranslations[to]?.[word] || word;
        });
        
        return translatedWords.join(' ');
    }).join('. ');
}

// Event Listeners
translateBtn.addEventListener('click', translateText);
swapLang.addEventListener('click', swapLanguages);
copyBtn.addEventListener('click', copyTranslation);
speakBtn.addEventListener('click', speakTranslation);
clearBtn.addEventListener('click', clearText);

// Setup quick phrase buttons
document.querySelectorAll('.phrase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        sourceText.value = btn.dataset.text || btn.textContent;
    });
});

// Load last translation when page loads
document.addEventListener('DOMContentLoaded', loadLastTranslation);

// Swap languages
function swapLanguages() {
    const tempLang = fromLang.value;
    fromLang.value = toLang.value;
    toLang.value = tempLang;

    const tempText = sourceText.value;
    sourceText.value = translatedText.textContent;
    translatedText.textContent = tempText;
}

// Translate text
async function translateText() {
    const text = sourceText.value.trim();
    if (!text) {
        showMessage('Please enter text to translate', 'error');
        return;
    }

    const from = fromLang.value;
    const to = toLang.value;

    try {
        translateBtn.disabled = true;
        showMessage('Translating...', 'info');
        
        // Translate the text using the fixed sentence translation function
        const translated = translateSentence(text, from, to);
        
        // Update the output
        translatedText.textContent = translated;
        
        // Save to localStorage
        localStorage.setItem('lastTranslation', JSON.stringify({
            input: text,
            output: translated,
            from: from,
            to: to
        }));
        
        showMessage('Translation complete', 'success');
    } catch (error) {
        console.error('Translation error:', error);
        showMessage('Translation failed. Please try again.', 'error');
    } finally {
        translateBtn.disabled = false;
    }
}

// Copy translation
function copyTranslation() {
    const text = translatedText.textContent;
    if (!text) {
        showMessage('No text to copy', 'error');
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            showMessage('Text copied to clipboard!', 'success');
        })
        .catch(() => {
            showMessage('Failed to copy text', 'error');
        });
}

// Speak translation
function speakTranslation() {
    const text = translatedText.textContent;
    if (!text) {
        showMessage('No text to speak', 'error');
        return;
    }

    // Stop any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = toLang.value;
    utterance.onend = () => {
        speakBtn.disabled = false;
    };
    utterance.onerror = () => {
        speakBtn.disabled = false;
        showMessage('Error playing speech', 'error');
    };

    speakBtn.disabled = true;
    synth.speak(utterance);
}

// Clear text
function clearText() {
    sourceText.value = '';
    sourceText.focus();
}

// Load last translation from localStorage
function loadLastTranslation() {
    const lastTranslation = localStorage.getItem('lastTranslation');
    if (lastTranslation) {
        try {
            const { input, output, from, to } = JSON.parse(lastTranslation);
            sourceText.value = input;
            translatedText.textContent = output;
            fromLang.value = from;
            toLang.value = to;
        } catch (error) {
            console.error('Error loading last translation:', error);
        }
    }
}

// Show status messages
function showMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 3000);
}
