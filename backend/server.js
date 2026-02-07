require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('LeetCode AI Helper Running'));

// --- PROMPTS ---
const SYSTEM_PROMPT = `You are an expert algorithms instructor. Help students learn without giving answers. NEVER provide full code solutions. Explain concepts simply.`;

const PROMPTS = {
    explain: `Explain this LeetCode problem in very simple language. Do NOT mention algorithms or code. Just explain what is being asked. Use bullet points.`,
    syntax: `Check this code for SYNTAX errors only. List errors in plain English. Do NOT fix the code. If no errors, say "No syntax errors found."`,
    logic: `Check this code for LOGICAL errors. Explain WHAT is wrong and WHY. Do NOT write corrected code.`,
    hint: `Give ONE conceptual hint for solving this problem. Do not reveal the solution or give code.`,
    pattern: `Identify the DSA pattern (Sliding Window, Two Pointers, DP, etc). Return ONLY the pattern name.`
};

// OpenRouter FREE API
async function callAI(prompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not found in .env");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
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
        throw new Error(err.error?.message || "API failed");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";
}

// --- ROUTES ---
app.post('/api/explain', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) return res.status(400).json({ error: "Missing data" });
        const result = await callAI(`Problem: ${title}\nDescription: ${description}\n\n${PROMPTS.explain}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/syntax', async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code) return res.status(400).json({ error: "Missing code" });
        const result = await callAI(`Language: ${language}\nCode:\n${code}\n\n${PROMPTS.syntax}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logic', async (req, res) => {
    try {
        const { code, language, title, description } = req.body;
        if (!code) return res.status(400).json({ error: "Missing code" });
        const result = await callAI(`Problem: ${title}\n${description}\nLanguage: ${language}\nCode:\n${code}\n\n${PROMPTS.logic}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hint', async (req, res) => {
    try {
        const { title, description } = req.body;
        const result = await callAI(`Problem: ${title}\n${description}\n\n${PROMPTS.hint}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pattern', async (req, res) => {
    try {
        const { title, description } = req.body;
        const result = await callAI(`Problem: ${title}\n${description}\n\n${PROMPTS.pattern}`);
        res.json({ result: result.trim(), url: `https://yourwebsite.com/patterns/${encodeURIComponent(result.trim())}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
