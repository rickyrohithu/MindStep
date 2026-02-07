// content.js

function getProblemData() {
    // 1. Get Title
    let title = "Unknown Problem";
    const titleElem = document.querySelector('.text-title-large') ||
        document.querySelector('div.flex.h-full.items-center span.text-label-1') ||
        document.querySelector('a[href^="/problems/"]');
    if (titleElem) title = titleElem.innerText;

    // 2. Get Description
    let description = "No description found.";
    const descElem = document.querySelector('[data-track-load="description_content"]') ||
        document.querySelector('.elfjS'); // Old class fallback
    if (descElem) description = descElem.innerText;

    // 3. Get Code
    let code = "";
    const codeLines = document.querySelectorAll('.view-line');
    if (codeLines.length > 0) {
        // Monaco editor renders lines as separate divs
        code = Array.from(codeLines).map(line => line.textContent).join('\n');
    } else {
        // Fallback: Try to get text from a textarea if present (usually hidden in Monaco)
        const textArea = document.querySelector('.monaco-editor textarea');
        if (textArea) code = textArea.value;
    }

    // 4. Get Language
    let language = "Unknown";
    const langElem = document.querySelector('#headlessui-listbox-button-:r0:') || // This ID changes often
        document.querySelector('button.flex.items-center.whitespace-nowrap'); // Generic button near code editor
    if (langElem) language = langElem.innerText;

    return { title, description, code, language };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getData") {
        const data = getProblemData();
        sendResponse(data);
    }
});
