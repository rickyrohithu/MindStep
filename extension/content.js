// content.js

function getProblemData() {
    let title = "Unknown Problem";
    const titleElem = document.querySelector('.text-title-large') ||
        document.querySelector('div.flex.h-full.items-center span.text-label-1');
    if (titleElem) title = titleElem.innerText.trim();

    let description = "No description found.";
    const descElem = document.querySelector('[data-track-load="description_content"]');
    if (descElem) description = descElem.innerText.trim();

    let code = "";
    const codeLines = document.querySelectorAll('.view-line');
    if (codeLines.length > 0) {
        code = Array.from(codeLines).map(line => line.textContent).join('\n');
    } else {
        const textArea = document.querySelector('.monaco-editor textarea');
        if (textArea) code = textArea.value;
    }

    let language = "Unknown";
    const langButton = document.querySelector('button[id^="headlessui-listbox-button"]');
    if (langButton) language = langButton.innerText.trim();

    return { title, description, code, language };
}

// Modal UI Logic
let modalInstance = null;

function createModal() {
    if (modalInstance) return modalInstance;

    const modal = document.createElement('div');
    modal.id = 'leetcode-ai-helper-modal';
    modal.classList.add('hidden');

    modal.innerHTML = `
        <div class="ai-header">
            <div class="ai-header-left">
                <button class="ai-header-btn" title="Back">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button class="ai-header-btn" title="Forward">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
            <div class="ai-header-right">
                <button class="ai-header-btn" id="ai-modal-copy">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button class="ai-header-btn" id="ai-modal-close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
        <div class="ai-body" id="ai-modal-body">
            <!-- Content will be injected here -->
        </div>
    `;

    document.body.appendChild(modal);

    // Draggable Logic
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    const header = modal.querySelector('.ai-header');

    header.onmousedown = (e) => {
        isDragging = true;
        offset = {
            x: modal.offsetLeft - e.clientX,
            y: modal.offsetTop - e.clientY
        };
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        modal.style.right = 'auto'; // Disable right alignment
        modal.style.left = (e.clientX + offset.x) + 'px';
        modal.style.top = (e.clientY + offset.y) + 'px';
    };

    document.onmouseup = () => {
        isDragging = false;
    };

    modal.querySelector('#ai-modal-close').onclick = () => {
        modal.classList.add('hidden');
    };

    modalInstance = modal;
    return modal;
}

function parseMarkdown(text) {
    // Very simple parser for lists and code blocks
    let html = text;

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `
            <div class="ai-code-wrapper">
                <div class="ai-code-header">
                    <span>${lang || 'code'}</span>
                    <button class="ai-header-btn" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)">Copy</button>
                </div>
                <div class="ai-code-content">${code.trim()}</div>
            </div>
        `;
    });

    // Sections with icons (Question, Answer, Steps)
    // We'll look for keywords the AI usually returns
    html = html.replace(/\*\*Understand the Problem\*\*/g, '<div class="ai-section-title"><span>1️⃣</span> Understand the Problem</div>');
    html = html.replace(/\*\*Find Syntax Errors\*\*/g, '<div class="ai-section-title"><span>2️⃣</span> Find Syntax Errors</div>');
    html = html.replace(/\*\*Why the Code Is Wrong.*?\*\*/g, '<div class="ai-section-title"><span>3️⃣</span> Why the Code Is Wrong</div>');
    html = html.replace(/\*\*How to Solve.*?\*\*/g, '<div class="ai-section-title"><span>4️⃣</span> How to Solve</div>');
    html = html.replace(/\*\*Hidden Pattern\*\*/g, '<div class="ai-section-title"><span>5️⃣</span> Hidden Pattern</div>');

    // Bullet points
    html = html.replace(/^\s*[\-\*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Fix nested ULs if any
    html = html.replace(/<\/ul>\n<ul>/g, '');

    return `<div class="ai-content">${html}</div>`;
}

function showLoadingInModal(label) {
    const modal = createModal();
    const body = modal.querySelector('#ai-modal-body');
    modal.classList.remove('hidden');
    body.innerHTML = `
        <div class="ai-section">
            <div class="ai-section-title">${label}</div>
            <div class="ai-content">
                <div style="display: flex; gap: 8px; align-items: center; color: #888;">
                    <svg class="ai-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Thinking and analyzing code...
                </div>
            </div>
        </div>
    `;
}

function showResultInModal(actionLabel, resultText) {
    const modal = createModal();
    const body = modal.querySelector('#ai-modal-body');

    modal.classList.remove('hidden');

    // Create a section for this specific action
    const sectionHtml = `
        <div class="ai-section">
            <div class="ai-section-title">${actionLabel}</div>
            <div class="ai-content">${parseMarkdown(resultText)}</div>
        </div>
    `;

    body.innerHTML = sectionHtml;
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getData") {
        sendResponse(getProblemData());
    } else if (request.action === "showLoading") {
        showLoadingInModal(request.label);
    } else if (request.action === "showResult") {
        showResultInModal(request.label, request.result);
    }
});
