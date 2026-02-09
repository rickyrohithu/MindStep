require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('LeetCode AI Helper Running'));

// --- PROMPTS ---
const SYSTEM_PROMPT = `You are **MindStep AI**, a thinking-first DSA coach. 
Your goal is to help users think, not to solve problems for them.

STRICT OUTPUT RULES:
- Keep responses SHORT, PRECISE, and SCANNABLE.
- Use BULLET POINTS wherever possible.
- HIGHLIGHT all important keywords using **bold**.
- NEVER provide code, pseudocode, or full solutions.
- NEVER reveal final answers.
- Focus on THINKING, not execution.
- TONE: Calm, confident, and mentor-like. Never judgmental. Never verbose.`;

const PROMPTS = {
    explain: `1️⃣ **Understand the Problem**
- Reframe what the problem is REALLY asking.
- Extract key constraints as bullet points.
- Highlight **core insight**.

> "**This problem is not about X — it is about Y.**" (Add this closing line adapted to the problem)`,

    syntax: `2️⃣ **Find Syntax Errors**
- List only syntax or language-level mistakes found in the user's code.
- Use bullet points.
- Do NOT show fixes.
- If no errors, state it clearly as a Win.`,

    logic: `3️⃣ **Why the Code Is Wrong (Hint Only)**
- Identify the logical flaw in the user's current approach.
- Provide a reflective question to guide them.
- Do NOT name the exact data structure or algorithm.

4️⃣ **How to Solve (Step-by-Step Thinking)**
- Numbered steps for mental approach.
- Describe mental steps only.
- No code, no formulas.`,

    hint: `3️⃣ **Why the Code Is Wrong (Hint Only)**
- Provide a reflective question about their current approach.
- Highlight a **hidden detail** they might be missing.
- Describe a mental step for progress.
- No code solutions.`,

    pattern: `5️⃣ **Hidden Pattern**
- Name the pattern (Sliding Window, Two Pointers, etc).
- List pattern signals found in this problem.
- Mention related problems unlocked by this pattern.

> "**This problem is not about X — it is about Y.**"`
};

// OpenRouter FREE API
async function callAI(prompt, userKey) {
    const apiKey = userKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("API Key not provided. Please set it in extension settings.");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/rickyrohithu/LeetCode-AI-Helper',
            'X-Title': 'LeetCode AI Helper'
        },
        body: JSON.stringify({
            model: 'nvidia/nemotron-3-nano-30b-a3b:free',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "AI Provider Error");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";
}

// --- ROUTES ---
app.post('/api/explain', async (req, res) => {
    try {
        const userKey = req.headers['x-api-key'];
        const { title, description } = req.body;
        if (!title || !description) return res.status(400).json({ error: "Missing data" });
        const result = await callAI(`Problem: ${title}\nDescription: ${description}\n\n${PROMPTS.explain}`, userKey);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/syntax', async (req, res) => {
    try {
        const userKey = req.headers['x-api-key'];
        const { code, language } = req.body;
        if (!code) return res.status(400).json({ error: "Missing code" });
        const result = await callAI(`Language: ${language}\nCode:\n${code}\n\n${PROMPTS.syntax}`, userKey);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logic', async (req, res) => {
    try {
        const userKey = req.headers['x-api-key'];
        const { code, language, title, description } = req.body;
        if (!code) return res.status(400).json({ error: "Missing code" });
        const result = await callAI(`Problem: ${title}\n${description}\nLanguage: ${language}\nCode:\n${code}\n\n${PROMPTS.logic}`, userKey);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hint', async (req, res) => {
    try {
        const userKey = req.headers['x-api-key'];
        const { title, description } = req.body;
        const result = await callAI(`Problem: ${title}\n${description}\n\n${PROMPTS.hint}`, userKey);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pattern', async (req, res) => {
    try {
        const userKey = req.headers['x-api-key'];
        const { title, description } = req.body;
        const result = await callAI(`Problem: ${title}\n${description}\n\n${PROMPTS.pattern}`, userKey);
        // Extract pattern name for URL - find the part between ** and **
        const patternName = result.match(/\*\*(.*?)\*\*/) ? result.match(/\*\*(.*?)\*\*/)[1] : result.split('\n')[1] || "Algorithms";
        res.json({ result, url: `https://www.google.com/search?q=LeetCode+${encodeURIComponent(patternName.trim())}+pattern` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
