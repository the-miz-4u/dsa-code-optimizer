// ==========================================
// 1. Monaco Editor Initialization & Config
// ==========================================
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});

let myEditor;

// Default code boilerplates for different languages
const boilerplates = {
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "Hello World!" << endl;\n    return 0;\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        System.out.println("Hello World!");\n    }\n}`,
    python: `def main():\n    # Write your code here\n    print("Hello World!")\n\nif __name__ == "__main__":\n    main()`
};

require(['vs/editor/editor.main'], function() {
    // Check karna ki kya pehle se koi C++ code save hai
    const savedCode = localStorage.getItem('dsa_code_cpp');

    myEditor = monaco.editor.create(document.getElementById('editor-container'), {
        value: savedCode || boilerplates['cpp'], // Agar saved hai toh wo, warna default C++
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 16
    });

    // Jaise hi user kuch type kare, usko turant LocalStorage mein save kar do
    myEditor.onDidChangeModelContent(() => {
        const currentLang = document.getElementById('language-select').value;
        localStorage.setItem(`dsa_code_${currentLang}`, myEditor.getValue());
    });
});


// ==========================================
// 2. Language Change & Auto-Boilerplate
// ==========================================
function changeLanguage() {
    const lang = document.getElementById('language-select').value;
    
    if (myEditor) {
        // 1. Monaco editor ki language highlight change karna
        const model = myEditor.getModel();
        monaco.editor.setModelLanguage(model, lang);
        
        // 2. Boilerplate generate karne ka logic
        const currentCode = myEditor.getValue().trim();
        const isCodeEmpty = currentCode === "";
        
        // Check karna ki kya current code kisi purane boilerplate se match karta hai
        const isOldBoilerplate = Object.values(boilerplates).map(b => b.trim()).includes(currentCode);

        if (isCodeEmpty || isOldBoilerplate) {
            // Agar khali hai ya purana boilerplate hai, toh bina pooche naya daal do
            myEditor.setValue(boilerplates[lang]);
        } else {
            // Agar user ne apna kuch custom code likha hai, toh permission lo
            const confirmChange = confirm(`Load default template for ${lang.toUpperCase()}? This will erase your current code.`);
            if (confirmChange) {
                myEditor.setValue(boilerplates[lang]);
            }
        }
    }
}


// ==========================================
// 3. Run Code & AI Analysis (With Hint Mode)
// ==========================================
async function runCode() {
    if (!myEditor) {
        alert("Editor abhi load nahi hua hai. Please wait.");
        return;
    }

    const code = myEditor.getValue();
    if (!code.trim()) {
        alert("Please write some code first!");
        return;
    }

    const runBtn = document.getElementById('run-btn');
    const responseContent = document.getElementById('ai-response-content');
    const execOutputBox = document.getElementById('execution-output') || document.getElementById('output'); // Fallback ID
    const selectedLang = document.getElementById('language-select').value; 
    
    // Hint Mode Checkbox Status
    const hintModeCheckbox = document.getElementById('hint-mode');
    const isHintMode = hintModeCheckbox ? hintModeCheckbox.checked : false;

    // AI Prompt Setup (Hint Mode vs Full Solution)
    let aiPrompt = "";
    if (isHintMode) {
        aiPrompt = `Act as an expert DSA Mentor. Analyze this code. Provide ONLY hints, logical approach, and Time/Space complexity. STRICT RULE: DO NOT provide the full code solution. Guide the user to solve it themselves.\n\nCode:\n${code}`;
    } else {
        aiPrompt = `Act as an expert DSA Mentor. Analyze this code. Provide the complete optimized code solution along with a detailed explanation of the logic and Time/Space complexity.\n\nCode:\n${code}`;
    }

    // UI Loading state
    runBtn.innerText = "Processing...";
    runBtn.disabled = true;
    if(responseContent) responseContent.innerHTML = "<p><em>AI is analyzing your code... Please wait.</em></p>";
    
    if(execOutputBox) {
        execOutputBox.innerHTML = "Executing code...";
        execOutputBox.style.color = "#d4d4d4";
    }

    try {
        const response = await fetch('http://localhost:5000/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code: code, 
                language: selectedLang,
                customPrompt: aiPrompt // Backend ko prompt bhej rahe hain
            }) 
        });

        const data = await response.json();
        
        if (data.success) {
            // Execution Output Dikhana
            if (execOutputBox) {
                if (data.execution && data.execution.success) {
                    execOutputBox.innerHTML = data.execution.output || "Code executed successfully, but no output was printed.";
                    execOutputBox.style.color = "#00ff00"; // Green for success
                } else if (data.execution && !data.execution.success) {
                    execOutputBox.innerHTML = data.execution.output || "Execution failed!";
                    execOutputBox.style.color = "#ff4c4c"; // Red for errors
                } else {
                    execOutputBox.innerHTML = "Execution data not found.";
                }
            }

            // AI Analysis Dikhana (Markdown to HTML)
            if(responseContent) responseContent.innerHTML = marked.parse(data.analysis);
        } else {
            if(responseContent) responseContent.innerHTML = `<p style="color: #f44336;">Error: ${data.message}</p>`;
            if(execOutputBox) execOutputBox.innerHTML = "";
        }

    } catch (error) {
        console.error("Error connecting to backend:", error);
        if(responseContent) responseContent.innerHTML = `<p style="color: #f44336;">Backend se connect nahi ho paya. Kya server running hai?</p>`;
        if(execOutputBox) execOutputBox.innerHTML = "Connection Error";
    } finally {
        runBtn.innerText = "Run & Optimize";
        runBtn.disabled = false;
    }
}


// ==========================================
// 4. AI Mentor Chat Logic
// ==========================================
async function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const question = inputField.value.trim();
    const chatBox = document.getElementById('chat-box');
    
    if (!question) return;

    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-message user-msg';
    userMsgDiv.innerHTML = `<strong>You:</strong> ${question}`;
    chatBox.appendChild(userMsgDiv);
    
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    const currentCode = myEditor ? myEditor.getValue() : "";
    const selectedLang = document.getElementById('language-select').value;

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: currentCode, question: question, language: selectedLang })
        });

        const data = await response.json();
        const aiMsgDiv = document.createElement('div');
        aiMsgDiv.className = 'chat-message ai-msg';
        
        if (data.success) {
            aiMsgDiv.innerHTML = `<strong>AI Mentor:</strong><br/> ${marked.parse(data.reply)}`;
        } else {
            aiMsgDiv.innerHTML = `<strong>AI Mentor:</strong> Sorry, I encountered an error.`;
            aiMsgDiv.style.borderLeftColor = "#f44336"; 
        }
        
        chatBox.appendChild(aiMsgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; 

    } catch (error) {
        console.error("Chat Error:", error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-message ai-msg';
        errorDiv.style.borderLeftColor = "#f44336";
        errorDiv.innerHTML = `<strong>AI Mentor:</strong> Server is not responding. Check if backend is running.`;
        chatBox.appendChild(errorDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}


// ==========================================
// 5. Utility & UI Functions (Quick Wins)
// ==========================================

// Copy Content Box
function copyContent(elementId, btnElement) {
    const content = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(content).then(() => {
        const originalText = btnElement.innerText;
        btnElement.innerText = "Copied! ✅";
        btnElement.style.backgroundColor = "#4caf50";
        btnElement.style.color = "white";
        btnElement.style.borderColor = "#4caf50";
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = "";
            btnElement.style.color = "";
            btnElement.style.borderColor = "";
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        alert("Copy failed. Please check browser permissions.");
    });
}

// Keyboard Shortcut (Ctrl + Enter) to Run Code
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault(); 
        runCode(); 
    }
});

// Download Code File
function downloadCode() {
    const code = myEditor ? myEditor.getValue() : "";
    if (!code.trim()) {
        alert("Editor is empty! Write some code to download.");
        return;
    }

    const selectedLang = document.getElementById('language-select').value;
    let extension = "txt";
    if (selectedLang === "cpp") extension = "cpp";
    else if (selectedLang === "java") extension = "java";
    else if (selectedLang === "python") extension = "py";

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_solution.${extension}`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Auto-Format Code (Prettier)
function formatCode() {
    if (myEditor) {
        myEditor.getAction('editor.action.formatDocument').run();
    }
}

// Font Size Adjuster (Zoom In/Out)
let currentFontSize = 16;
function changeFontSize(step) {
    if (myEditor) {
        currentFontSize += step;
        if (currentFontSize < 8) currentFontSize = 8;
        if (currentFontSize > 40) currentFontSize = 40;
        myEditor.updateOptions({ fontSize: currentFontSize });
    }
}

// Light/Dark Theme Switcher
let isDarkMode = true;
function toggleTheme() {
    isDarkMode = !isDarkMode;
    const themeBtn = document.getElementById('theme-btn');
    
    if (isDarkMode) {
        document.body.classList.remove('light-mode');
        monaco.editor.setTheme('vs-dark'); 
        if(themeBtn) themeBtn.innerText = '☀️';
    } else {
        document.body.classList.add('light-mode');
        monaco.editor.setTheme('vs'); 
        if(themeBtn) themeBtn.innerText = '🌙';
    }
}

// Clear Output & AI Analysis
function clearOutput() {
    const execOutputBox = document.getElementById('execution-output') || document.getElementById('output');
    const aiAnalysis = document.getElementById('ai-response-content') || document.getElementById('ai-response');
    
    if (execOutputBox) {
        execOutputBox.innerHTML = "Output cleared. Ready for next execution...";
        execOutputBox.style.color = "#888"; 
    }
    
    if (aiAnalysis) {
        aiAnalysis.innerHTML = "AI Analysis cleared.";
        aiAnalysis.style.color = "#888";
    }
}