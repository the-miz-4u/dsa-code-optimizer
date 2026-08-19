const express = require('express');
const cors = require('cors');
require('dotenv').config(); // .env file se variables load karne ke liye

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors()); // Frontend ko allow karne ke liye
app.use(express.json()); // JSON data parse karne ke liye

// Basic test route
app.get('/', (req, res) => {
    res.send('DSA Optimizer API is running...');
});

// Endpoint jahan frontend se code aayega
app.post('/api/optimize', (req, res) => {
    const { code, language } = req.body;

    console.log(`Received ${language} code:\n`, code);

    // Abhi ke liye hum sirf ek success message bhej rahe hain
    // Aage chal kar yahan Gemini API ya Code Execution logic aayega
    res.json({
        success: true,
        message: "Code backend par successfully receive ho gaya!",
        receivedCodeLength: code.length
    });
});

// Server start karna
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});