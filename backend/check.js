require('dotenv').config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log("Error: API Key nahi mili. Kya .env file mein GEMINI_API_KEY sahi se set hai?");
        return;
    }

    console.log("Fetching available models from Google Servers...\n");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.log("Google API Error:", data.error.message);
            return;
        }

        console.log("✅ Aapki API key ke liye yeh models available hain (Inme se koi ek use karein):\n");
        
        data.models.forEach(model => {
            // Hum sirf wo model dekhna chahte hain jo text generation support karte hain
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                // 'models/' prefix hata kar sirf naam print kar rahe hain
                console.log(`👉 ${model.name.replace('models/', '')}`);
            }
        });

    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

checkModels();