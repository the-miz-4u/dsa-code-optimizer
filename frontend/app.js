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

// 3. Backend se connect karne wala function
async function runCode() {
    // Check if editor is loaded before trying to get value
    if (!myEditor) {
        alert("Editor abhi load nahi hua hai. Please wait.");
        return;
    }

    const code = myEditor.getValue();
    const runBtn = document.getElementById('run-btn');
    
    runBtn.innerText = "Processing...";
    runBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                language: 'cpp' 
            })
        });

        const data = await response.json();
        
        console.log("Backend Response:", data);
        alert(data.message); 

    } catch (error) {
        console.error("Error connecting to backend:", error);
        alert("Backend se connect nahi ho paya. Kya server running hai?");
    } finally {
        runBtn.innerText = "Run & Optimize";
        runBtn.disabled = false;
    }
}