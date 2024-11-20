let isSpeaking = false;
const emoji = document.getElementById('emoji');
const setup = document.getElementById('setup');
const punchline = document.getElementById('punchline');
const speakButton = document.getElementById('speakButton');

async function getJoke() {
    try {
        const response = await fetch('https://official-joke-api.appspot.com/jokes/random');
        const joke = await response.json();
        
        setup.textContent = joke.setup;
        punchline.textContent = joke.punchline;

        speakJoke();

    } catch (error) {
        console.error('Error fetching joke:', error);
        setup.textContent = 'Oops! Failed to fetch joke.';
        punchline.textContent = 'Please try again later.';
    }
}

function speakJoke() {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakButton.classList.remove('speaking');
        return;
    }

    const textToSpeak = `${setup.textContent}... ... ${punchline.textContent}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Configure speech settings
    utterance.rate = .8; // Speed of speech
    utterance.pitch = .8; // Pitch of voice
    utterance.volume = 1; // Volume
    
    // Get available voices and set to a English voice if available
    let voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    // Add event listeners
    utterance.onstart = () => {
        isSpeaking = true;
        speakButton.classList.add('speaking');
    };

    utterance.onend = () => {
        isSpeaking = false;
        speakButton.classList.remove('speaking');

        // Trigger emoji animation
        emoji.classList.add('shake');
        emoji.style.opacity = 1;

        // Remove animation class after it ends
        setTimeout(() => {
            emoji.classList.remove('shake');
            emoji.style.opacity = 0;
        }, 2000);
    };

    utterance.onerror = () => {
        isSpeaking = false;
        speakButton.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded
window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
};

// Load initial joke when page loads
getJoke();