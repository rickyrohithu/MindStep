document.addEventListener('DOMContentLoaded', () => {
    const buttons = {
        explain: document.getElementById('btn-explain'),
        syntax: document.getElementById('btn-syntax'),
        logic: document.getElementById('btn-logic'),
        hint: document.getElementById('btn-hint'),
        pattern: document.getElementById('btn-pattern'),
        close: document.getElementById('btn-close')
    };

    const outputDiv = document.getElementById('output');
    const loadingDiv = document.getElementById('loading');
    const questionText = document.getElementById('question-text');
    const answerContent = document.getElementById('answer-content');

    // Content Script Logic (Injected via executeScript)
    function extractProblemData() {
        try {
            // 1. Get Title
            let title = document.title.split('-')[0].trim();
            const titleElem = document.querySelector('[data-cy="question-title"]') ||
                document.querySelector('.text-title-large');
            if (titleElem) title = titleElem.innerText;

            // 2. Get Description
            let description = "Description not found.";
            const descElem = document.querySelector('[data-track-load="description_content"]');
            if (descElem) {
                description = descElem.innerText;
            } else {
                // Fallback for new UI
                const metas = document.getElementsByTagName('meta');
                for (let i = 0; i < metas.length; i++) {
                    if (metas[i].getAttribute('name') === 'description') {
                        description = metas[i].getAttribute('content');
                        break;
                    }
                }
            }

            // 3. Get Code
            let code = "";
            const codeLines = document.querySelectorAll('.view-line');
            if (codeLines.length > 0) {
                code = Array.from(codeLines).map(line => line.textContent).join('\n');
            } else {
                const textArea = document.querySelector('.monaco-editor textarea');
                if (textArea) code = textArea.value;
            }

            // 4. Get Language
            let language = "Unknown";
            const langButton = document.querySelector('button[id^="headlessui-listbox-button"]') ||
                document.querySelector('[data-track-load="description_content"] + div button');
            if (langButton) language = langButton.innerText;

            return { title, description, code, language };
        } catch (e) {
            return { error: e.toString() };
        }
    }

    // Helper to toggle visibility
    function showLoading() {
        loadingDiv.classList.remove('hidden');
        outputDiv.classList.add('hidden');
    }

    function showOutput(question, answerText, isHtml = false) {
        loadingDiv.classList.add('hidden');
        outputDiv.classList.remove('hidden');
        questionText.textContent = question;

        if (isHtml) {
            answerContent.innerHTML = answerText;
        } else {
            answerContent.textContent = answerText;
        }
    }

    function showError(msg) {
        showOutput("Error", `<p style="color:red;">${msg}</p>`, true);
    }

    // Main function to handle actions
    async function handleAction(actionType) {
        showLoading();

        try {
            // 1. Get Active Tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                showError("No active tab found.");
                return;
            }

            if (!tab.url.includes("leetcode.com")) {
                showError("Please use this extension on a LeetCode problem page.");
                return;
            }

            // 2. Inject Script to Extract Data
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: extractProblemData
            });

            if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
                showError("Failed to read page content. Please refresh the page.");
                return;
            }

            const data = injectionResults[0].result;

            if (data.error) {
                showError("Extraction Error: " + data.error);
                return;
            }

            // 3. Prepare API payload
            const payload = {
                title: data.title || "Unknown Problem",
                description: data.description || "No description",
                code: data.code || "",
                language: data.language || "Unknown",
                action: actionType
            };

            // Endpoint Selection
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

            // 4. Call Backend
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Backend Server Error");
            }

            const resultData = await response.json();

            // 5. Handle Result
            if (actionType === 'pattern' && resultData.url) {
                chrome.tabs.create({ url: resultData.url });
                showOutput(questionLabel, `Pattern identified: ${resultData.result}\n\nRedirecting...`);
            } else {
                showOutput(questionLabel, resultData.result);
            }

        } catch (err) {
            console.error(err);
            showError("Connection Failed. Is the backend server running?");
        }
    }

    // Event Listeners
    buttons.explain.onclick = () => handleAction('explain');
    buttons.syntax.onclick = () => handleAction('syntax');
    buttons.logic.onclick = () => handleAction('logic');
    buttons.hint.onclick = () => handleAction('hint');
    buttons.pattern.onclick = () => handleAction('pattern');

    if (buttons.close) {
        buttons.close.onclick = () => {
            outputDiv.classList.add('hidden');
        };
    }
});
