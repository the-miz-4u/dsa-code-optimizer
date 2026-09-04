// 1. Monaco Editor ko CDN se load karne ki configuration
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});

let myEditor;

// Default code templates for different languages
const codeTemplates = {
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Optimization!" << endl;\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Optimization!");\n    }\n}',
    python: 'print("Hello, Optimization!")'
};

// 2. Editor ko initialize karna
require(['vs/editor/editor.main'], function() {
    // Check karna ki kya pehle se koi C++ code save hai
    const savedCode = localStorage.getItem('dsa_code_cpp');

    myEditor = monaco.editor.create(document.getElementById('editor-container'), {
        value: savedCode || codeTemplates['cpp'], // Agar saved hai toh wo, warna default
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


// 3. Dropdown change hone par yeh function chalega
function changeLanguage() {
    const lang = document.getElementById('language-select').value;
    
    // Monaco editor ki language (syntax highlighting) update karna
    monaco.editor.setModelLanguage(myEditor.getModel(), lang);
    
    // Us language ka saved code dhoondhna
    const savedCode = localStorage.getItem(`dsa_code_${lang}`);
    
    // Editor mein saved code daalna, agar nahi hai toh default template daalna
    myEditor.setValue(savedCode || codeTemplates[lang]);
}

// 4. Code ko backend par bhejkar execute aur AI se analyze karwana
async function runCode() {
    if (!myEditor) {
        alert("Editor abhi load nahi hua hai. Please wait.");
        return;
    }

    const code = myEditor.getValue();
    const runBtn = document.getElementById('run-btn');
    const responseContent = document.getElementById('ai-response-content');
    const execOutputBox = document.getElementById('execution-output');
    
    // Dropdown se selected language nikalna
    const selectedLang = document.getElementById('language-select').value; 
    
    // UI Loading state
    runBtn.innerText = "Processing...";
    runBtn.disabled = true;
    responseContent.innerHTML = "<p><em>AI is analyzing your code... Please wait.</em></p>";
    
    if(execOutputBox) {
        execOutputBox.innerHTML = "Executing code...";
        execOutputBox.style.color = "#d4d4d4";
    }

    try {
        const response = await fetch('http://localhost:5000/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, language: selectedLang }) // Dynamic language bhej rahe hain
        });

        const data = await response.json();
        
        if (data.success) {
            // 1. Execution Output Dikhana
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

            // 2. AI Analysis Dikhana (Markdown to HTML)
            responseContent.innerHTML = marked.parse(data.analysis);
        } else {
            responseContent.innerHTML = `<p style="color: #f44336;">Error: ${data.message}</p>`;
            if(execOutputBox) execOutputBox.innerHTML = "";
        }

    } catch (error) {
        console.error("Error connecting to backend:", error);
        responseContent.innerHTML = `<p style="color: #f44336;">Backend se connect nahi ho paya. Kya server running hai?</p>`;
        if(execOutputBox) execOutputBox.innerHTML = "Connection Error";
    } finally {
        runBtn.innerText = "Run & Optimize";
        runBtn.disabled = false;
    }
}
// 5. AI Mentor Chat Logic
async function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const question = inputField.value.trim();
    const chatBox = document.getElementById('chat-box');
    
    if (!question) return;

    // User ka message UI mein dikhana
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-message user-msg';
    userMsgDiv.innerHTML = `<strong>You:</strong> ${question}`;
    chatBox.appendChild(userMsgDiv);
    
    // Input field clear karna aur scroll ko sabse neeche lana
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Current code aur language nikalna
    const currentCode = myEditor ? myEditor.getValue() : "";
    const selectedLang = document.getElementById('language-select').value;

    try {
        // Backend ko question bhejna
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: currentCode, question: question, language: selectedLang })
        });

        const data = await response.json();

        // AI ka reply UI mein dikhana
        const aiMsgDiv = document.createElement('div');
        aiMsgDiv.className = 'chat-message ai-msg';
        
        if (data.success) {
            // marked.parse ka use kar rahe hain taaki AI ka bold/code format sahi se dikhe
            aiMsgDiv.innerHTML = `<strong>AI Mentor:</strong><br/> ${marked.parse(data.reply)}`;
        } else {
            aiMsgDiv.innerHTML = `<strong>AI Mentor:</strong> Sorry, I encountered an error.`;
            aiMsgDiv.style.borderLeftColor = "#f44336"; // Error ke liye red border
        }
        
        chatBox.appendChild(aiMsgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Naya message aane par auto-scroll

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

// Enter press karne par message send karna
function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}