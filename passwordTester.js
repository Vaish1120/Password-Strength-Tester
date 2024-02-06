document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.querySelector("input[type='text']");
    const resultDiv = document.querySelector(".result");
    const requirementsList = document.querySelector(".requirements");
    const progressBar = document.querySelector(".progress-bar");

    passwordInput.addEventListener("input", async () => {
        const password = passwordInput.value.trim();
        if (password === "") {
            resetUI();
        } else {
            progressBar.style.display = "block";
            const validationResult = await validatePassword(password);
            updateUI(validationResult);
        }
    });

    function resetUI() {
        resultDiv.textContent = "";
        requirementsList.innerHTML = "";
        progressBar.style.display = "none"; 
        resultDiv.style.display = "none"; 
        requirementsList.style.display = "none"; 
    }
    
    function calculateProgress(unfulfilledCount) {
        const totalRequirements = 9;
        const fulfilledRequirements = totalRequirements - unfulfilledCount;
        return (fulfilledRequirements / totalRequirements) * 100;
    }
    
    function updateUI(validationResult) {
        const { count, unfulfilled } = validationResult;
        const progressPercent = calculateProgress(unfulfilled.length);
        updateProgressBar(progressPercent);
    

        progressBar.style.display = "block";
        resultDiv.style.display = "block";
        requirementsList.style.display = "block";
    
        if (count === 0) {
            resultDiv.textContent = "*** STRONG PASSWORD ***";
            resultDiv.style.color = "green";
            requirementsList.innerHTML = "";
        } else {
            resultDiv.textContent = count < 5 ? "MEDIUM STRENGTH PASSWORD" : "WEAK PASSWORD.";
            resultDiv.style.color = count < 5 ? "Green" : "Yellow";
            requirementsList.style.color = count < 5 ? "Green" : "yellow";
            requirementsList.innerHTML = unfulfilled.map(req => `<li>${req}</li>`).join("");
        }
    }
    
    function updateProgressBar(percent) {
        const progressBar = document.querySelector(".progress-fill");
        const passwordField = document.getElementById("passwordField");
    
        progressBar.style.width = percent + "%";
    
        let borderColor = "#FFFFFF";
    
        if (percent <= 25) {
            progressBar.style.backgroundColor = "#FF0000"; 
            borderColor = "#FF0000";
        } else if (percent <= 50) {
            progressBar.style.backgroundColor = "#FFFF00"; 
            borderColor = "#FFFF00"; 
        } else if (percent <= 75) {
            progressBar.style.backgroundColor = "#008000"; 
            borderColor = "#008000"; 
        } else {
            progressBar.style.backgroundColor = "#0000FF"; 
            borderColor = "#0000FF"; 
        }
        passwordField.style.borderWidth = "5px";
        
        passwordField.style.borderColor = borderColor;
        
    }
    
    
});

async function validatePassword(password) {
    const unfulfilled = [];
    let count = 0;

    if (password.length < 16) {
        unfulfilled.push("Password must be at least 16 characters long.");
        count++;
    }

    const capitalLetters = (password.match(/[A-Z]/g) || []).length;
    if (capitalLetters < 3) {
        unfulfilled.push("Password must have at least 3 capital letters.");
        count++;
    }

    const uniqueNumbers = new Set(password.match(/\d/g)).size;
    if (uniqueNumbers < 3) {
        unfulfilled.push("Password must have at least 3 different numbers.");
        count++;
    }

    const uniqueSpecialChars = new Set(password.match(/[^\w\s]/g)).size;
    if (uniqueSpecialChars < 3) {
        unfulfilled.push("Password must have at least 3 different special characters.");
        count++;
    }

    if (/^[0-9]|[0-9\W]$/.test(password)) {
        unfulfilled.push("Password cannot start or end with a number or special character.");
        count++;
    }    

    const words = password.split(/[^a-zA-Z]/);
    for (const word of words) {
        const isEnglishWord = await checkIsEnglishWord(word);
        if (isEnglishWord) {
            unfulfilled.push("Password cannot contain full English words");
            count++;
            break;
        }
    }

    const isPwnedPassword = await checkPwnedPassword(password);
    if (isPwnedPassword) {
        unfulfilled.push("Password has been compromised.");
        count++;
    }

    if ((() => {
        const len = password.length;
        for (let windowSize = 1; windowSize <= len / 2; windowSize++) {
            for (let i = 0; i <= len - 2 * windowSize; i++) {
                const sequence = password.substr(i, windowSize);
                const restOfString = password.substr(i + windowSize);
                if (restOfString.includes(sequence)) {
                    return true;
                }
            }
        }
        return false;
    })()) {
        unfulfilled.push("Password cannot have repeated sequences.");
        count++;
    }

    const birthDatePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
    if (birthDatePattern.test(password)) {
        unfulfilled.push("Password cannot resemble a birth date.");
        count++;
    }

    return { count, unfulfilled };
}


async function checkIsEnglishWord(word) {
    if (word.length <= 2) {
        return false;
    }
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) {
        return false;
    }
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
}

async function checkPwnedPassword(password) {
    const sha1Password = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);
    const prefix = sha1Password.slice(0, 5);
    const suffix = sha1Password.slice(5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
        return false;
    }
    const data = await response.text();
    const hashes = data.split('\r\n').map(line => line.split(':'));
    return hashes.some(([hash, count]) => hash.toLowerCase() === suffix);
}

async function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    let capitalLetters, uniqueNumbers, uniqueSpecialChars, birthDatePattern, repeatedSequence, isEnglishWord;

    while (true) {
        password = '';
        for (let i = 0; i < 16; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }

        capitalLetters = (password.match(/[A-Z]/g) || []).length;
        uniqueNumbers = new Set(password.match(/\d/g)).size;
        uniqueSpecialChars = new Set(password.match(/[^\w\s]/g)).size;
        birthDatePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;

        repeatedSequence = false;
        const len = password.length;
        for (let windowSize = 1; windowSize <= len / 2; windowSize++) {
            for (let i = 0; i <= len - 2 * windowSize; i++) {
                const sequence = password.substr(i, windowSize);
                const restOfString = password.substr(i + windowSize);
                if (restOfString.includes(sequence)) {
                    repeatedSequence = true;
                    break;
                }
            }
            if (repeatedSequence) break;
        }

        isEnglishWord = false;
        const words = password.split(/[^a-zA-Z]/);
        for (const word of words) {
            isEnglishWord = await checkIsEnglishWord(word);
            if (isEnglishWord) {
                break;
            }
        }

        if (password.length >= 16 &&
            capitalLetters > 0 &&
            uniqueNumbers >= 3 &&
            uniqueSpecialChars >= 3 &&
            !/^[0-9\s\W]|[\s\W]$/.test(password) &&
            !birthDatePattern.test(password) &&
            !repeatedSequence &&
            !isEnglishWord) {
            break;
        }
    }

    return password;
}

document.getElementById('generateButton').addEventListener('click', async function() {
    const button = document.getElementById('generateButton');
    const passwordField = document.getElementById('passwordField');

    
    button.disabled = true;

    
    passwordField.value = await generatePassword();

    
    button.disabled = false;
});

