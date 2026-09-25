const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_KEY_HERE";

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Sardar AI Server is running!');
});

app.post('/chat', async (req, res) => {
    try {
        const messages = req.body.messages;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // سیستم پرامپت
        const systemPrompt = {
            role: 'system',
            content: 'Your name is SardarNikzad. You are a friendly, helpful AI assistant. Always reply in the same language the user writes in (Persian/Dari or English). Be natural, warm, and helpful. Remember everything the user tells you in this conversation.'
        };

        // ساخت آرایه پیام‌ها برای Groq
        const groqMessages = [systemPrompt];

        // تبدیل پیام‌های اپ به فرمت Groq
        messages.forEach(msg => {
            groqMessages.push({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
            });
        });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: groqMessages
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Groq error:', data.error.message);
            return res.status(500).json({ error: data.error.message });
        }

        const aiReply = data.choices[0].message.content;
        res.json({ reply: aiReply });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sardar AI Server is running on port ${PORT}`);
});
