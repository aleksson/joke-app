let isSpeaking, isLocal, offline = false;
const emoji = document.getElementById('emoji');
const setup = document.getElementById('setup');
const punchline = document.getElementById('punchline');
const speakButton = document.getElementById('speakButton');
const locale = new Intl.Locale(navigator.language);
const localButton = document.getElementById('local-button');

(function(){
    initLocalButton();
    
    const hash = location.hash.slice(1);
    const jokeId = hash ? hash : null;
    
    if(!jokeId) return getJoke();
    else getJoke(null, false, jokeId);

})();

function initLocalButton(){
    //localButton.style.display = 'none';
    localButton.textContent = `Translate to Local Language (${locale.language.toUpperCase()})`;
    /** TODO: Check if local language is supported by browser / SpeechSynthesisVoice */
}

async function getJoke(category = 'random', local = false, id = null) {

    // First stop previous speech
    isSpeaking = false;
    window.speechSynthesis.cancel();
    
    // if offline, get local jokes
    if(offline) return getLocalJoke(category);

    if(local) { // Translate joke to local language
        const textToSpeak = `${setup.textContent}|${punchline.textContent}`;
        return translateJoke(textToSpeak, 'en', locale.language);
    }

    try {
        let url = `https://official-joke-api.appspot.com/jokes/`;
        if(!id) url += `${ category == 'random' ? 'random' : `${category}/random` }`;
        else url += `${id}`;
        
        const response = await fetch(url);
        let joke = await response.json();

        if(Array.isArray(joke)) joke = joke[0];

        location.hash = joke.id;
        setup.textContent = joke.setup;
        punchline.textContent = joke.punchline;

        offline = false;
        speakJoke();

    } catch (error) {
        offline = true;
        console.error('Error fetching joke:', error);
        //setup.textContent = 'Oops! Failed to fetch joke.';
        //punchline.textContent = 'Please try again later.';

        // If offline then run get local jokes
        return getLocalJoke(category);
    }
}

function getLocalJoke(category){
    const categoryJokes = window.jokes.filter(joke => (category == 'random' ? joke : joke.type == category));
    const randomJoke = categoryJokes[Math.floor(Math.random() * categoryJokes.length)];
    
    setup.textContent = randomJoke.setup;
    punchline.textContent = randomJoke.punchline;
    
    return speakJoke();
}

async function translateJoke(inputText, from = 'en', to = 'sv'){
    isLocal = true;
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${from}|${to}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.responseData) {
                const translatedText = data.responseData.translatedText;
                const textParts = translatedText.split('|');
                setup.textContent = textParts[0];
                punchline.textContent = textParts[1];
            }
        })
        .catch(error => console.error('Error fetching translation:', error));

}

function speakJoke() {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakButton.classList.remove('speaking');
        return;
    }

    const textToSpeak = `${setup.textContent}...,...,${punchline.textContent}`;
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
    
    /*const localVoice = voices.find(voice => voice.lang.startsWith(`${locale.language}-`));
    if(isLocal && localVoice) {
        utterance.rate = .6; // Speed of speech
        utterance.voice = localVoice;
    }*/

    utterance.onstart = () => {
        isSpeaking = true;
        speakButton.classList.add('speaking');
    };

    utterance.onend = () => {
        isSpeaking = false;
        isLocal = false;
        speakButton.classList.remove('speaking');
        shakeEmoji();
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

function shakeEmoji(){
    emoji.classList.add('shake');
    emoji.style.opacity = 1;

    setTimeout(() => {
        emoji.classList.remove('shake');
        emoji.style.opacity = 0;
    }, 2000);
}
