document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');

    const buttons = {
        explain: document.getElementById('btn-explain'),
        syntax: document.getElementById('btn-syntax'),
        logic: document.getElementById('btn-logic'),
        hint: document.getElementById('btn-hint'),
        pattern: document.getElementById('btn-pattern'),
        settings: document.getElementById('btn-settings'),
        back: document.getElementById('btn-back'),
        save: document.getElementById('btn-save-key')
    };

    const apiKeyInput = document.getElementById('api-key');
    const loadingDiv = document.getElementById('loading');
    const outputDiv = document.getElementById('output');
    const questionText = document.getElementById('question-text');
    const answerContent = document.getElementById('answer-content');

    // Load saved API key
    chrome.storage.local.get(['openrouter_api_key'], (result) => {
        if (result.openrouter_api_key) {
            apiKeyInput.value = result.openrouter_api_key;
        }
    });

    // Navigation
    buttons.settings.onclick = () => {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    };

    buttons.back.onclick = () => {
        mainView.classList.remove('hidden');
        settingsView.classList.add('hidden');
    };

    buttons.save.onclick = () => {
        const key = apiKeyInput.value.trim();
        chrome.storage.local.set({ 'openrouter_api_key': key }, () => {
            alert('Settings saved!');
            mainView.classList.remove('hidden');
            settingsView.classList.add('hidden');
        });
    };

    // Helper to toggle visibility
    function showLoading() {
        loadingDiv.classList.remove('hidden');
        document.querySelector('.buttons-grid').classList.add('hidden');
    }

    function hideLoading() {
        loadingDiv.classList.add('hidden');
        document.querySelector('.buttons-grid').classList.remove('hidden');
    }

    function showError(msg) {
        alert("Error: " + msg);
        hideLoading();
    }

    // Extraction function (ran in content script)
    function extractProblemData() {
        // Reuse existing logic from content.js since we call it via executeScript if message fails
        // But we already have a persistent content script listening, so we just message it.
        return null;
    }

    // Main function to handle actions
    async function handleAction(actionType) {
        // 0. Check API Key
        const storage = await chrome.storage.local.get(['openrouter_api_key']);
        const userKey = storage.openrouter_api_key;

        if (!userKey) {
            alert("Please set your OpenRouter API Key in Settings first!");
            buttons.settings.click();
            return;
        }

        showLoading();

        try {
            // 1. Get Active Tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.url.includes("leetcode.com")) {
                showError("Please open a LeetCode problem page.");
                return;
            }

            // 2. Show Loading in Modal
            try {
                await chrome.tabs.sendMessage(tab.id, { action: "showLoading", label: "Analysing..." });
            } catch (e) {
                showError("Please refresh LeetCode page first.");
                return;
            }

            // 3. Get Data from Content Script
            const data = await chrome.tabs.sendMessage(tab.id, { action: "getData" });

            if (!data) {
                showError("Failed to extract problem data.");
                return;
            }

            // 4. Prepare API payload
            const payload = {
                ...data,
                action: actionType
            };

            const endpoints = {
                explain: '/api/explain',
                syntax: '/api/syntax',
                logic: '/api/logic',
                hint: '/api/hint',
                pattern: '/api/pattern'
            };

            const labels = {
                explain: "Problem Explanation",
                syntax: "Syntax Analysis",
                logic: "Logic Analysis",
                hint: "Hint",
                pattern: "Pattern Recognition"
            };

            const endpoint = endpoints[actionType];
            const questionLabel = labels[actionType];

            // 5. Call Backend
            const BASE_URL = 'http://localhost:3000'; // Change to Vercel later
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': userKey // Send the user's key!
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Backend Server Error");
            }

            const resultData = await response.json();

            // 6. Handle Result in Modal
            if (actionType === 'pattern' && resultData.url) {
                chrome.tabs.create({ url: resultData.url });
                await chrome.tabs.sendMessage(tab.id, {
                    action: "showResult",
                    label: questionLabel,
                    result: `Pattern identified: **${resultData.result}**\n\nRedirecting...`
                });
            } else {
                await chrome.tabs.sendMessage(tab.id, {
                    action: "showResult",
                    label: questionLabel,
                    result: resultData.result
                });
            }

            window.close(); // Close popup after success

        } catch (err) {
            console.error(err);
            showError(err.message);
        }
    }

    // Event Listeners
    buttons.explain.onclick = () => handleAction('explain');
    buttons.syntax.onclick = () => handleAction('syntax');
    buttons.logic.onclick = () => handleAction('logic');
    buttons.hint.onclick = () => handleAction('hint');
    buttons.pattern.onclick = () => handleAction('pattern');
});
