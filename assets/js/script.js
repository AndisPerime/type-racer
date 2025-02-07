document.addEventListener('DOMContentLoaded', function () {
    const API_URL = "https://zenquotes.io/api/random";
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
    const authorDisplay = document.getElementById('author');

    let startTime;
    let endTime;
    let testStarted = false;

    // Add cache management
    const MAX_CACHE_SIZE = 10; // Maximum quotes per difficulty level

    function addToCache(difficulty, quote) {
        if (!quotesCache[difficulty].some(q => q.text === quote.text)) {
            quotesCache[difficulty].push(quote);
            if (quotesCache[difficulty].length > MAX_CACHE_SIZE) {
                quotesCache[difficulty].shift(); // Remove oldest quote if cache is full
            }
        }
    }

    function getRandomCachedQuote(difficulty) {
        if (quotesCache[difficulty].length > 0) {
            const randomIndex = Math.floor(Math.random() * quotesCache[difficulty].length);
            return quotesCache[difficulty][randomIndex];
        }
        return null;
    }

    async function fetchQuote() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // Add validation for the API response
            if (!Array.isArray(data) || !data[0] || !data[0].q || !data[0].a) {
                throw new Error('Invalid API response format');
            }
            return {
                text: data[0].q,
                author: data[0].a
            };
        } catch (error) {
            console.error('Error fetching quote:', error);
            return null; // Return null instead of directly calling getBackupQuote
        }
    }

    function getBackupQuote() {
        const backupQuotes = {
            easy: [
                { text: "The cat sat on the mat.", author: "Anonymous" },
                { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
                { text: "Keep it simple, silly.", author: "Unknown" }
            ],
            medium: [
                { text: "To be or not to be, that is the question.", author: "William Shakespeare" },
                { text: "All that glitters is not gold, but it sure is shiny.", author: "Unknown" },
                { text: "A journey of a thousand miles begins with a single step forward.", author: "Lao Tzu" }
            ],
            hard: [
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { text: "In the end, it's not the years in your life that count, it's the life in your years.", author: "Abraham Lincoln" },
                { text: "The only way to do great work is to love what you do and never give up.", author: "Steve Jobs" }
            ]
        };

        const difficulty = difficultySelect.value;
        const quotes = backupQuotes[difficulty];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    async function getQuoteForDifficulty(difficulty) {
        // First try cache if available
        if (quotesCache[difficulty].length > 0 && Math.random() < 0.3) {
            return getRandomCachedQuote(difficulty);
        }

        let maxAttempts = 3;
        let attempts = 0;
        let quote = null;

        while (attempts < maxAttempts && !quote) {
            const fetchedQuote = await fetchQuote();
            if (fetchedQuote) {
                const wordCount = fetchedQuote.text.split(' ').length;
                if ((difficulty === 'easy' && wordCount <= 8) ||
                    (difficulty === 'medium' && wordCount > 8 && wordCount <= 15) ||
                    (difficulty === 'hard' && wordCount > 15)) {
                    quote = fetchedQuote;
                    addToCache(difficulty, quote);
                }
            }
            attempts++;
            
            // Add small delay between attempts
            if (!quote && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // If no suitable quote found, try cache again
        if (!quote && quotesCache[difficulty].length > 0) {
            quote = getRandomCachedQuote(difficulty);
        }

        // Finally, fallback to backup quotes if needed
        return quote || getBackupQuote();
    }

    function wrapWordsInSpans(text) {
        return text.split(' ').map(word => 
            `<span class="word-span pending">${word}</span>`
        ).join(' ');
    }

    async function updateSampleText() {
        const selectedDifficulty = difficultySelect.value;
        
        try {
            sampleTextDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            authorDisplay.textContent = 'Loading...';
            userInput.disabled = true;

            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 5000)
            );

            const quote = await Promise.race([
                getQuoteForDifficulty(selectedDifficulty),
                timeoutPromise
            ]);

            if (!quote) {
                throw new Error('Failed to fetch quote');
            }

            sampleTextDiv.innerHTML = wrapWordsInSpans(quote.text);
            authorDisplay.textContent = quote.author || 'Unknown';
            
        } catch (error) {
            console.error('Error updating sample text:', error);
            const fallbackQuote = getBackupQuote();
            sampleTextDiv.innerHTML = wrapWordsInSpans(fallbackQuote.text);
            authorDisplay.textContent = fallbackQuote.author;
        } finally {
            userInput.disabled = false;
            initializeTest();
        }
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