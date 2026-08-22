// 1. Monaco Editor ko CDN se load karne ki configuration
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});

let myEditor;

// 2. Editor ko initialize karna
require(['vs/editor/editor.main'], function() {
    myEditor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '// Write your DSA code here...\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Optimization!" << endl;\n    return 0;\n}',
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 16
    });
});

async function runCode() {
    if (!myEditor) {
        alert("Editor abhi load nahi hua hai. Please wait.");
        return;
    }

    const code = myEditor.getValue();
    const runBtn = document.getElementById('run-btn');
    const responseContent = document.getElementById('ai-response-content');
    
    // UI Loading state
    runBtn.innerText = "Processing...";
    runBtn.disabled = true;
    responseContent.innerHTML = "<p><em>AI is analyzing your code... Please wait.</em></p>";

    try {
        const response = await fetch('http://localhost:5000/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, language: 'cpp' })
        });

        const data = await response.json();
        
        if (data.success) {
            // marked.parse() AI ke raw markdown ko beautiful HTML me convert kar dega
            responseContent.innerHTML = marked.parse(data.analysis);
        } else {
            responseContent.innerHTML = `<p style="color: #f44336;">Error: ${data.message}</p>`;
        }

    } catch (error) {
        console.error("Error connecting to backend:", error);
        responseContent.innerHTML = `<p style="color: #f44336;">Backend se connect nahi ho paya. Kya server running hai?</p>`;
    } finally {
        runBtn.innerText = "Run & Optimize";
        runBtn.disabled = false;
    }
}