# LeetCode AI Helper - Chrome Extension 🚀

A premium full-stack assistant for LeetCode. Get hints, explanations, and logic checks without spoilers, delivered via a sleek embedded UI.

## ✨ Features
- **Embedded Modal UI**: Results appear directly on your LeetCode screen in a beautiful, draggable window.
- **BYOK (Bring Your Own Key)**: Use your own OpenRouter API key for privacy and unlimited usage.
- **Explain Problem**: Conceptual breakdowns without code.
- **Logic & Syntax Check**: Find bugs in your code without being given the answer.
- **Dark Mode**: Designed to match the LeetCode dark theme perfectly.

## 📂 Project Structure
```
LeetCode_AI_Helper_System/
├── backend/                  # Node.js + Express Backend (Host on Vercel)
│   ├── server.js             # API Logic & Prompts
│   └── vercel.json           # Hosting Config
└── extension/                # Chrome Extension
    ├── manifest.json         # Extension Config
    ├── content.js            # Injected Modal & Scraper
    ├── modal.css             # Embedded UI Styling
    ├── popup.html            # Control Panel UI
    └── popup.js              # Settings & Communication
```

## 🚀 Setup & Hosting

### 1. Host the Backend (Vercel)
1. Go to [Vercel](https://vercel.com/) and Import this project.
2. Set **Root Directory** to `backend`.
3. Add `OPENROUTER_API_KEY` (Optional fallback) in Environment Variables.
4. Deploy and copy your brand new **Production URL**.

### 2. Configure Extension
1. Open `extension/popup.js`.
2. Update `const BASE_URL = 'http://localhost:3000';` with your Vercel URL.

### 3. Install Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. Click the extension icon, go to **Settings (⚙️)**, and paste your [OpenRouter API Key](https://openrouter.ai/).

## 🔒 Security
- Your API key is stored **locally** in your browser's `chrome.storage`.
- Requests are sent securely to your hosted backend.
- No solutions are ever auto-submitted.
