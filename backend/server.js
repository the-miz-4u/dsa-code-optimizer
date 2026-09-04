const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 

// ... Iske baad aapka baaki ka code (GenAI setup, executeCpp function, etc.)
// Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.send('DSA Optimizer API is running...');
});

// Function to execute C++, Java, and Python code locally
const executeCode = (code, language) => {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        let filePath, command, cleanupDir;

        try {
            if (language === 'cpp') {
                const fileName = `temp_${timestamp}.cpp`;
                const outName = `out_${timestamp}.exe`;
                filePath = path.join(__dirname, fileName);
                const outPath = path.join(__dirname, outName);
                fs.writeFileSync(filePath, code);
                command = `g++ ${filePath} -o ${outPath} && ${outPath}`;
                
                // Cleanup logic attached to the process
                cleanupDir = () => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
                };
            } 
            else if (language === 'python') {
                const fileName = `temp_${timestamp}.py`;
                filePath = path.join(__dirname, fileName);
                fs.writeFileSync(filePath, code);
                command = `python ${filePath}`; 
                
                cleanupDir = () => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                };
            } 
            else if (language === 'java') {
                // Java needs the filename to match the public class (Main.java).
                // We create a unique folder so multiple users don't overwrite Main.java
                const dirPath = path.join(__dirname, `java_${timestamp}`);
                fs.mkdirSync(dirPath);
                filePath = path.join(dirPath, `Main.java`);
                fs.writeFileSync(filePath, code);
                command = `cd ${dirPath} && javac Main.java && java Main`;
                
                cleanupDir = () => {
                    if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
                };
            }

            // Command execute karna
            exec(command, (error, stdout, stderr) => {
                cleanupDir(); // Execution ke baad kachra saaf karna
                
                if (error) {
                    resolve({ success: false, output: stderr || error.message });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        } catch (err) {
            resolve({ success: false, output: `Server setup error: ${err.message}` });
        }
    });
};

// Endpoint for Code Optimization
app.post('/api/optimize', async (req, res) => {
    const { code, language } = req.body;

    // Agar editor khali hai ya code nahi aaya
    if (!code) {
        return res.status(400).json({ success: false, message: "Code cannot be empty!" });
    }

    try {
        console.log(`Executing ${language} code locally...`);
        const executionResult = await executeCode(code, req.body.language);

        console.log(`Analyzing ${language} code...`);

        // Gemini Model Initialize karna
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" }); 
        
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

        // Frontend ko AI ka analysis aur execution output bhejna
        res.json({
            success: true,
            analysis: aiResponse,
            execution: executionResult // <-- Yahan comma lagana zaroori tha
        });

    } catch (error) {
        console.error("Error connecting to backend:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to analyze code due to server error." 
        });
    }
});
// AI Mentor Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { code, question, language } = req.body;

    if (!question) {
        return res.status(400).json({ success: false, message: "Question is required." });
    }

    try {
        console.log(`Received chat question: ${question}`);
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" }); 
        
        // AI ko context dena ki user kis code ke baare mein pooch raha hai
        const prompt = `
        You are an expert, friendly Data Structures and Algorithms (DSA) mentor.
        The student is writing ${language} code. 
        
        Here is their current code:
        ${code || "No code provided yet."}
        
        Student's Question: "${question}"
        
        Provide a helpful, encouraging, and concise response. Do not just give the direct answer or full code; guide them to understand the logic or fix the error. Use formatting (like bolding or inline code) where appropriate.
        `;

        const result = await model.generateContent(prompt);
        const aiReply = result.response.text();

        res.json({ success: true, reply: aiReply });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ success: false, message: "Failed to get response from AI Mentor." });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});