let jokeObject, isSpeaking, isLocal, offline = false;
const emoji = document.getElementById('emoji');
const setup = document.getElementById('setup');
const punchline = document.getElementById('punchline');
const speakButton = document.getElementById('speakButton');
const locale = new Intl.Locale(navigator.language);
const localButton = document.getElementById('local-button');
const punchlinePause = 3000;

(function(){
    //preCheck();
    //initLocalButton();
    
    const hash = location.hash.slice(1);
    const jokeId = hash ? hash : null;
    
    if(!jokeId) return getJoke();
    else getJoke(null, false, jokeId);

})();

function initLocalButton(){
    localButton.style.display = 'none';
    localButton.textContent = `Translate to Local Language (${locale.language.toUpperCase()})`;
    //speakButton.style.display = "block";
}

// function preCheck(){
//     let vo = window.speechSynthesis.getVoices();
//     const check = {
//         v : vo.find(v => v.lang.startsWith(`${locale.language}-`))
//     };
// }

async function getJoke(category = 'random', local = false, id = null) {
    //console.log('getJoke', {category , local, id});

    // First stop previous speech
    isSpeaking = false;
    window.speechSynthesis.cancel();
    
    setup.textContent = '...';
    punchline.textContent = '...';
    
    // if offline, get local jokes
    if(offline) return getLocalJoke(category);

    if(local === true) { // Translate joke to local language
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

        offline = false;
        jokeObject = joke;
        location.hash = joke.id;
        renderJokeOutputWithDelay();

    } catch (error) {
        offline = true;
        console.error('Error fetching joke, using local jokes:', error);
        //setup.textContent = 'Oops! Failed to fetch joke.';
        //punchline.textContent = 'Please try again later.';

        // If offline then run get local jokes
        getLocalJoke(category);
    }
}

function getLocalJoke(category){
    if(!category) category = 'random';
    const categoryJokes = window.jokes.filter(joke => (category == 'random' ? joke : joke.type == category));
    const randomJoke = categoryJokes[Math.floor(Math.random() * categoryJokes.length)];
    
    jokeObject = randomJoke;
    renderJokeOutputWithDelay();
}

function renderJokeOutputWithDelay(){
    setup.textContent = jokeObject.setup;
    speakJoke(jokeObject);
}

function renderPunchline(pl, speak = true){
    // Wait a bit before displaying punchline
    setTimeout(() => {
        punchline.textContent = pl;
        if(!speak) return shakeEmoji();

        speakJoke(pl)
        shakeEmoji();
    },punchlinePause);
}

// async function translateJoke(inputText, from = 'en', to = 'sv'){
//     isLocal = true;
//     const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${from}|${to}`;
//     fetch(apiUrl)
//         .then(response => response.json())
//         .then(data => {
//             if (data.responseData) {
//                 const translatedText = data.responseData.translatedText;
//                 const textParts = translatedText.split('|');
//                 setup.textContent = textParts[0];
//                 punchline.textContent = textParts[1];
//             }
//         })
//         .catch(error => console.error('Error fetching translation:', error));
// }

function speakJoke(content) {

    let utterance;
    if(content['setup']) utterance = new SpeechSynthesisUtterance(content.setup)
    else utterance = new SpeechSynthesisUtterance(content);

    // Configure speech settings
    utterance.rate = 1; // Speed of speech
    utterance.pitch = 1; // Pitch of voice
    utterance.volume = 1; // Volume
    
    // Get available voices and set to a English voice if available
    let voices = speechSynthesis.getVoices();
    
    let englishVoice;
    englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    //englishVoice = voices.findLast(voice => voice.lang.startsWith('en-'));
    

    if(!englishVoice){
        // hide plackback btn if english voice is not present
        // then just display the punshline 
        speakButton.style.display = "none"
        renderPunchline(jokeObject.punchline, false);
    }

    else if (englishVoice) {
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

        // render punchline after setup is spoken
        if(content.punchline) renderPunchline(content.punchline);
    };

    utterance.onerror = (e) => {
        isSpeaking = false;
        speakButton.classList.remove('speaking');
        // render punchline after setup is spoken
        if(content.punchline) renderPunchline(content.punchline);
    };

    if(englishVoice){
        window.speechSynthesis.speak(utterance);
    }
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
    }, 3000);
}

function playJoke(){
    speakJoke(jokeObject);
}