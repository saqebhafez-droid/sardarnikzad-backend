const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_KEY_HERE";

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => {
    res.send('Sardar AI Server is running!');
});

// ═══════════════════════════════════════════
// چت متنی (با حافظه)
// ═══════════════════════════════════════════
app.post('/chat', async (req, res) => {
    try {
        const messages = req.body.messages;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const systemPrompt = {
            role: 'system',
            content: 'Your name is SardarNikzad. You are a friendly, helpful AI assistant. Always reply in the same language the user writes in (Persian/Dari or English). Be natural, warm, and helpful. Remember everything the user tells you in this conversation.'
        };

        const groqMessages = [systemPrompt];

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

// ═══════════════════════════════════════════
// تولید عکس با Pollinations.ai (رایگان)
// ═══════════════════════════════════════════
app.post('/generate-image', async (req, res) => {
    try {
        const prompt = req.body.prompt;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Pollinations.ai - ساخت URL عکس بر اساس متن
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;

        res.json({ imageUrl: imageUrl });

    } catch (error) {
        console.error('Image error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ═══════════════════════════════════════════
// دیدن عکس با Groq Vision
// ═══════════════════════════════════════════
app.post('/vision', async (req, res) => {
    try {
        const imageBase64 = req.body.image;
        const question = req.body.question || 'این عکس چیه؟ به فارسی توضیح بده.';

        if (!imageBase64) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: question },
                            {
                                type: 'image_url',
                                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                            }
                        ]
                    }
                ],
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Vision error:', data.error.message);
            return res.status(500).json({ error: data.error.message });
        }

        const aiReply = data.choices[0].message.content;
        res.json({ reply: aiReply });

    } catch (error) {
        console.error('Vision error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sardar AI Server is running on port ${PORT}`);
});
