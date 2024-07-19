let audioContext;
let audioBuffer;
let audioSource;

export function initializeAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioContext.state === 'suspended') {
        audioContext.resume().catch(console.error);
    }
}

export function loadAudio(url) {
    initializeAudioContext();
    
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
            audioBuffer = buffer;
        })
        .catch(console.error);
}

export function playAudio() {
    initializeAudioContext();
    if (audioBuffer && audioContext) {
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        audioSource.start(0);
    }
}

export function stopAudio() {
    if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
    }
}
