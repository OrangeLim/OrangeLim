
let audioContext;
let audioBuffer;
let audioSource;

function loadAudio(url) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
            audioBuffer = buffer;
        })
        .catch(console.error);
}

function playAudio() {
    if (audioBuffer && audioContext) {
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        audioSource.start(0);
    }
}

function stopAudio() {
    if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
    }
}

// Export the functions if using a module system
export { loadAudio, playAudio, stopAudio };
