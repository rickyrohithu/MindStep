# LeetCode AI Helper - Chrome Extension

A full-stack Chrome Extension that acts as an AI pair programmer for LeetCode, focusing on educational value without giving away solutions.

## 📂 Project Structure

```
LeetCode_AI_Helper_System/
├── backend/                  # Node.js + Express Backend
│   ├── .env                  # Environment keys (OpenAI)
│   ├── package.json          # Dependencies
│   └── server.js             # API Logic & Prompts
├── extension/                # Chrome Extension
│   ├── manifest.json         # Extension Config
│   ├── content.js            # DOM Scraper for LeetCode
│   ├── popup.html            # Extension UI
│   ├── popup.css             # UI Styling
│   └── popup.js              # Logic & API Communication
└── README.md                 # Setup Instructions
```

## 🚀 Setup Instructions

### 1. Backend Setup
1.  Open a terminal and navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your OpenAI API Key:
    - Open the `.env` file in the `backend` folder.
    - Replace `your_openai_api_key_here` with your actual OpenAI API Key.
    ```
    OPENAI_API_KEY=sk-proj-...
    PORT=3000
    ```
4.  Start the server:
    ```bash
    npm start
    ```
    You should see: `Server running on port 3000`.

### 2. Chrome Extension Setup
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Toggle **Developer mode** (top right corner).
3.  Click **Load unpacked**.
4.  Select the `extension` folder from this project (`LeetCode_AI_Helper_System/extension`).
5.  The extension "LeetCode AI Helper" should appear in your list.

### 3. Usage
1.  Go to any LeetCode problem page (e.g., [Two Sum](https://leetcode.com/problems/two-sum/)).
2.  Refresh the page if you just installed the extension.
3.  Click the extension icon in the toolbar.
4.  Click any button:
    - **Explain Problem**: Get a simple conceptual explanation.
    - **Syntax Check**: Analyzes code currently in the Monaco editor.
    - **Logic Check**: Finds logical errors in your approach.
    - **Get Hint**: Provides a gentle nudge.
    - **Identify Pattern**: Links you to the pattern guide.
    
    *Note: Ensure you have selected a language and typed some code for Syntax/Logic checks.*

## 🔒 Security & Privacy
- Your OpenAI API Key is stored securely on your local backend (`.env`).
- The extension communicates only with `localhost:3000`.
- No code is auto-submitted to LeetCode.
