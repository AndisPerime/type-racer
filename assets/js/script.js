document.addEventListener('DOMContentLoaded', function () {
    const API_URL = "https://api.quotable.io/random"; // Using Quotable API instead as ZenQuotes has strict rate limits
    let quotesCache = {
        easy: [],
        medium: [],
        hard: []
    };

    const difficultySelect = document.getElementById('difficulty');
    const sampleTextDiv = document.getElementById('sample-text');
    const startButton = document.getElementById('start-btn');
    const stopButton = document.getElementById('stop-btn');
    const timeDisplay = document.getElementById('time');
    const userInput = document.getElementById('user-input');
    const levelDisplay = document.getElementById('level');
    const wpmDisplay = document.getElementById('wpm');
    const retryButton = document.getElementById('retry-btn');
    const instructionsBtn = document.getElementById('instructions-btn');
    const instructionsModal = new bootstrap.Modal(document.getElementById('instructionsModal'));

    let startTime;
    let endTime;
    let testStarted = false;

    async function fetchQuote() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.content;
        } catch (error) {
            console.error('Error fetching quote:', error);
            return getBackupQuote(); // Fallback to backup quotes
        }
    }

    function getBackupQuote() {
        const backupQuotes = {
            easy: [
                "The cat sat on the mat.",
                "Life is what happens to you while you're busy making other plans.",
                "Keep it simple, silly."
            ],
            medium: [
                "To be or not to be, that is the question.",
                "All that glitters is not gold, but it sure is shiny.",
                "A journey of a thousand miles begins with a single step forward."
            ],
            hard: [
                "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "In the end, it's not the years in your life that count, it's the life in your years.",
                "The only way to do great work is to love what you do and never give up."
            ]
        };

        const difficulty = difficultySelect.value;
        const quotes = backupQuotes[difficulty];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    async function getQuoteForDifficulty(difficulty) {
        let maxAttempts = 3;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const quote = await fetchQuote();
            const wordCount = quote.split(' ').length;

            if ((difficulty === 'easy' && wordCount <= 8) ||
                (difficulty === 'medium' && wordCount > 8 && wordCount <= 15) ||
                (difficulty === 'hard' && wordCount > 15)) {
                return quote;
            }
            attempts++;
        }

        // If we couldn't get an appropriate quote after max attempts, use backup
        return getBackupQuote();
    }

    function wrapWordsInSpans(text) {
        return text.split(' ').map(word => 
            `<span class="word-span pending">${word}</span>`
        ).join(' ');
    }

    async function updateSampleText() {
        const selectedDifficulty = difficultySelect.value;
        
        sampleTextDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        userInput.disabled = true;

        try {
            const quote = await getQuoteForDifficulty(selectedDifficulty);
            sampleTextDiv.innerHTML = wrapWordsInSpans(quote);
        } catch (error) {
            console.error('Error updating sample text:', error);
            const fallbackQuote = getBackupQuote();
            sampleTextDiv.innerHTML = wrapWordsInSpans(fallbackQuote);
        }

        userInput.disabled = false;
        initializeTest();
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

    async function retryTest() {
        // Reset all displays
        timeDisplay.textContent = '0';
        wpmDisplay.textContent = '0';
        
        // Get a new random text
        await updateSampleText();
    }

    difficultySelect.addEventListener('change', () => {
        updateSampleText();
    });
    
    startButton.addEventListener('click', initializeTest);
    stopButton.addEventListener('click', stopTest);
    retryButton.addEventListener('click', retryTest);
    instructionsBtn.addEventListener('click', () => {
        instructionsModal.show();
    });
    
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