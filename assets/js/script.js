document.addEventListener('DOMContentLoaded', function () {
    const easyTexts = [
        "The cat sat on the mat.",
        "A quick brown fox jumps over the lazy dog.",
        "She sells seashells by the seashore."
    ];

    const mediumTexts = [
        "To be or not to be, that is the question.",
        "All that glitters is not gold.",
        "A journey of a thousand miles begins with a single step."
    ];

    const hardTexts = [
        "It was the best of times, it was the worst of times.",
        "In the beginning God created the heavens and the earth.",
        "The only thing we have to fear is fear itself."
    ];

    const difficultySelect = document.getElementById('difficulty');
    const sampleTextDiv = document.getElementById('sample-text');
    const startButton = document.getElementById('start-btn');
    const stopButton = document.getElementById('stop-btn');
    const timeDisplay = document.getElementById('time');
    const userInput = document.getElementById('user-input');
    const levelDisplay = document.getElementById('level');
    const wpmDisplay = document.getElementById('wpm');

    let startTime;
    let endTime;
    let testStarted = false;

    function getRandomText(textArray) {
        const randomIndex = Math.floor(Math.random() * textArray.length);
        return textArray[randomIndex];
    }

    function wrapWordsInSpans(text) {
        return text.split(' ').map(word => 
            `<span class="word-span pending">${word}</span>`
        ).join(' ');
    }

    function updateSampleText() {
        let selectedDifficulty = difficultySelect.value;
        let selectedText;

        if (selectedDifficulty === 'easy') {
            selectedText = getRandomText(easyTexts);
        } else if (selectedDifficulty === 'medium') {
            selectedText = getRandomText(mediumTexts);
        } else if (selectedDifficulty === 'hard') {
            selectedText = getRandomText(hardTexts);
        }

        sampleTextDiv.innerHTML = wrapWordsInSpans(selectedText);
    }

    function checkTypingAccuracy() {
        const sampleWords = sampleTextDiv.textContent.trim().split(/\s+/);
        const userWords = userInput.value.trim().split(/\s+/);
        const wordSpans = sampleTextDiv.getElementsByClassName('word-span');

        // Reset all words to pending state
        Array.from(wordSpans).forEach(span => {
            span.className = 'word-span pending';
        });

        // Update colors based on current input
        userWords.forEach((word, index) => {
            if (index < wordSpans.length) {
                if (word === sampleWords[index]) {
                    wordSpans[index].className = 'word-span correct';
                } else {
                    wordSpans[index].className = 'word-span incorrect';
                }
            }
        });

        // Check if test is complete
        if (userWords.length === sampleWords.length) {
            const isComplete = userWords.every((word, index) => word === sampleWords[index]);
            if (isComplete) {
                stopTest();
            }
        }
    }

    function startTest() {
        if (!testStarted) {
            startTime = new Date();
            startButton.disabled = true;
            stopButton.disabled = false;
            testStarted = true;
            
            // Reset all words to pending state
            const wordSpans = sampleTextDiv.getElementsByClassName('word-span');
            Array.from(wordSpans).forEach(span => {
                span.className = 'word-span pending';
            });
        }
    }

    function initializeTest() {
        testStarted = false;
        userInput.disabled = false;
        userInput.value = '';
        userInput.focus();
        startButton.disabled = true;
        stopButton.disabled = false;
        
        // Reset all words to pending state
        const wordSpans = sampleTextDiv.getElementsByClassName('word-span');
        Array.from(wordSpans).forEach(span => {
            span.className = 'word-span pending';
        });
    }

    function stopTest() {
        endTime = new Date();
        const timeTaken = (endTime - startTime) / 1000; // time in seconds
        const wpm = calculateWPM(timeTaken);
        
        displayResults(timeTaken, wpm);

        startButton.disabled = false;
        stopButton.disabled = true;
        userInput.disabled = true;
        testStarted = false;
    }

    function calculateWPM(timeTaken) {
        const sampleText = sampleTextDiv.textContent.trim();
        const userText = userInput.value.trim();
        const sampleWords = sampleText.split(" ");
        const userWords = userText.split(" ");
    
        let correctWords = 0;
        for (let i = 0; i < userWords.length; i++) {
            if (userWords[i] === sampleWords[i]) {
                correctWords++;
            }
        }
    
        return Math.round((correctWords / timeTaken) * 60);
    }

    function displayResults(timeTaken, wpm) {
        timeDisplay.textContent = timeTaken.toFixed(2);
        wpmDisplay.textContent = wpm;
        const selectedDifficulty = difficultySelect.value;
        levelDisplay.textContent = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    }

    difficultySelect.addEventListener('change', () => {
        updateSampleText();
        initializeTest();
    });
    
    startButton.addEventListener('click', initializeTest);
    stopButton.addEventListener('click', stopTest);
    
    userInput.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
            startTest();
        }
        checkTypingAccuracy();
    });

    // Initialize on page load
    updateSampleText();
    initializeTest();
});