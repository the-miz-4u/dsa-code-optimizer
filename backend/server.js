const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 

// Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.send('DSA Optimizer API is running...');
});

// Endpoint for Code Optimization
app.post('/api/optimize', async (req, res) => {
    const { code, language } = req.body;

    // Agar editor khali hai ya code nahi aaya
    if (!code) {
        return res.status(400).json({ success: false, message: "Code cannot be empty!" });
    }

    try {
        console.log(`Analyzing ${language} code...`);

        // Gemini Model Initialize karna
        
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" }); 
        // Note: Agar 'gemini-1.5-pro' bhi 404 de, toh 'gemini-pro' try karna.

        // Prompt Engineering: AI ko batana hai ki use kya aur kaise respond karna hai
        const prompt = `
        You are an expert Data Structures and Algorithms (DSA) mentor.
        Analyze the following ${language} code and provide the output strictly in this format:

        **1. Time Complexity:** Explain the Big-O time complexity.
        **2. Space Complexity:** Explain the Big-O space complexity.
        **3. Optimization Suggestions:** If the code can be optimized (e.g., from O(N^2) to O(N log N)), provide the logic. If it is already optimal, mention that.
        
        Do not provide the full rewritten code yet, just the explanation.
        
        Code:
        ${code}
        `;

        // AI se response generate karwana
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        console.log("AI Analysis Complete!");

        // Frontend ko AI ka analysis bhejna
        res.json({
            success: true,
            analysis: aiResponse
        });

    } catch (error) {
        console.error("Error with Gemini API:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to analyze code due to server error." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});