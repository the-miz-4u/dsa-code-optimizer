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
    myEditor = monaco.editor.create(document.getElementById('editor-container'), {
        value: codeTemplates['cpp'], // Default code C++ ka set hoga
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 16
    });
});

// 3. Dropdown change hone par yeh function chalega
function changeLanguage() {
    const lang = document.getElementById('language-select').value;
    
    // Monaco editor ki language (syntax highlighting) update karna
    monaco.editor.setModelLanguage(myEditor.getModel(), lang);
    
    // Editor mein us language ka default code daalna
    myEditor.setValue(codeTemplates[lang]);
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