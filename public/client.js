// Make connection (individual client's socket)
let socket = io.connect();
let clientHandle = "";
let clientResponses = [];
let score = 0;
let usersToGuess = [];
let responsesToGuess = [];
let currentGuessIndex = 0;
let numGuesses = 5;
let qIndex = 0;

let questions = [
    "Tell us about an interesting holiday you had.",
    "What was the most embarrassing thing you did as a child?",
    "Say something random!"
];

// Query DOM
// Entry
let entry = document.querySelector("#entry");
let handle = document.querySelector("#handle");
let entryBtn = document.querySelector("#submit-handle");

// User info
let username = document.querySelector("#username");

// Q&A section
let main = document.querySelector("#main");
let qText = document.querySelector("#qText");
let answer = document.querySelector("#answer");
let sendBtn = document.querySelector("#send");

// Guess section
let responses = document.querySelector("#responses");
let guess = document.querySelector("#guess");
let guessVal = document.querySelector("#guess-user");
let guessBtn = document.querySelector("#guess-btn");
let affirmation = document.querySelector("#affirmation");
let scoreText = document.querySelector("#score");

// Errors
let errors = document.querySelector("#errors");

// Other users
let users = document.querySelector("#users-list");

// Entry
entryBtn.addEventListener('click', () => {
    if(handle.value.trim() == '') {
        errors.innerHTML = "Input a valid username!";
        return;
    } else {
        entry.classList.add("hide");
        main.classList.remove("hide");
        clientHandle = handle.value;
        username.innerHTML = "Hello, " + clientHandle;
        qText.innerHTML = questions[qIndex++];
    }
    socket.emit('new-client', {
        client: clientHandle
    });
});

// Update GUI: New user joined
socket.on('new-client', (data) => {
    users.innerHTML = users.innerHTML + "<p>" + data.client + " has joined</p>";
});

socket.on('client-exist', (data) => {
    errors.innerHTML = "Sorry, that username is already taken, try again!";
});

// Process user's response
sendBtn.addEventListener('click', () => {
    if (answer.value.trim() != '') {
        clientResponses.push(answer.value);
        errors.innerHTML = "";
    } else {
        errors.innerHTML = "Input a valid answer!";
        return;
    }
    answer.value = '';
    if (qIndex < questions.length) {
        qText.innerHTML = questions[qIndex++];
    } else {
        main.classList.add("hide");
        responses.classList.remove("hide");
        
        socket.emit('client-complete', {
            client: clientHandle,
            responses: clientResponses
        });
    }
});

// Update GUI: Client is single player
socket.on('client-alone', (data) => {
    username.innerHTML = "Poor, " + data + ", you're all alone, there's nothing to proceed to.";
});

// Inform server: User left
socket.on('disconnect', (reason) => {
    socket.emit('client-left', {
        client: clientHandle
    });
});

// Update GUI: User left
socket.on('client-left', (data) => {
    users.innerHTML = users.innerHTML + "<p>" + data.client + " has left</p>";
});

// Update GUI: User completed questions
socket.on('client-complete', (data) => {
    if (clientHandle.trim() == '') return;
    users.innerHTML = users.innerHTML + "<p>" + data.client + " has completed all questions</p>";
})

// Update GUI: All users completed questions
socket.on('all-complete', (data) => {
    if (clientHandle.trim() == '') return;
    users.innerHTML = users.innerHTML + "<p>Everyone has answered!</p>";
    let allResponses = data.allResponses;

    // Remove client's own key from list of keys
    let keys = Object.keys(allResponses);
    let indexToRemove = keys.indexOf(clientHandle);
    if (indexToRemove > -1) {
        keys.splice(indexToRemove, 1);
    }

    generateGuesses(allResponses, keys);
    nextGuess();
    guess.classList.remove("hide");
});

// Update GUI: End guess, score
socket.on('client-guess-end', (data) => {
    if (clientHandle.trim() == '') return;
    users.innerHTML = users.innerHTML + "<p>" + data.client + " has scored " + score + "</p>";
});

// Update GUI: Scoreboard
socket.on('all-guesses-complete', (data) => {
    console.log("All done!");
    if (clientHandle.trim() == '') return;
    responses.classList.add("hide");
    guess.classList.add("hide");
    scoreboard.classList.remove("hide");

    scores = data.scoreboard;
    let maxScore = findMax(scores);

    users.innerHTML = users.innerHTML + "<p>" + maxScore + " wins by finishing first with a total of " + scores[maxScore] + " points</p>";
});

// Display if user's guess was right / wrong
guessBtn.addEventListener('click', () => {
    if (clientHandle.trim() == '') return;
    if (guessVal.value.toLowerCase().trim() == usersToGuess[currentGuessIndex].toLowerCase().trim()) {
        affirmation.innerHTML = "Correct!";
        score++;
        currentGuessIndex++;
        updateScore();
        nextGuess();
    } else {
        affirmation.innerHTML = "Wrong! The correct answer is " + usersToGuess[currentGuessIndex];
        currentGuessIndex++;
        nextGuess();
    }
});

function generateGuesses(allResponses, keys) {
    for (let i = 0; i < numGuesses; i++) {
        let randomKey = keys.length * Math.random() << 0;
        let randomResponseIndex = questions.length * Math.random() << 0;
        usersToGuess[i] = keys[randomKey];
        responsesToGuess[i] = allResponses[keys[randomKey]][randomResponseIndex];
    }
}

function nextGuess() {
    if (clientHandle.trim() == '') return;
    if (currentGuessIndex < numGuesses) {
        responses.innerHTML = "<p>Guess who said this: " + responsesToGuess[currentGuessIndex] + "</p>";
    } else {
        socket.emit('client-guess-end', {
            client: clientHandle,
            score: score
        });
    }
}

function updateScore() {
    if (clientHandle.trim() == '') return;
    scoreText.innerHTML = "<p>Score: " + score + "</p>";
}

function findMax(scores) {
    let maxKey, maxValue = 0;

    for(const [key, value] of Object.entries(scores)) {
            if(value > max) {
            maxValue = value;
            maxKey = key;
        }
    }

    return maxKey;
}
