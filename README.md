# 🚀 Real-Time DSA Optimizer & AI Mentor

A professional-grade, multi-language Data Structures and Algorithms (DSA) IDE with integrated Artificial Intelligence. Built to enhance coding practice, this platform not only executes C++, Java, and Python code locally but also provides real-time optimization feedback and interactive debugging through an AI Mentor powered by the Google Gemini API.
<img width="1898" height="1079" alt="image" src="https://github.com/user-attachments/assets/68a1b44c-8bc8-4503-b259-df169dc5e3ed" />


## ✨ Key Features

* **🌍 Multi-Language Execution Engine:** Write and run C++, Java, and Python code seamlessly within the browser.
* **🤖 AI Code Optimization:** Instantly get time and space complexity analysis and best-practice recommendations for your logic.
* **💬 Interactive AI Mentor Chat:** A built-in chatbot that understands your current code context to help you debug errors, explain logic, and provide hints without giving away the direct answer.
* **💾 Smart Auto-Save:** Never lose your work. The editor automatically saves your code locally (per language) so it survives accidental page refreshes.
* **⚡ Pro Shortcuts:** Hit `Ctrl + Enter` to run and optimize your code instantly without touching the mouse.
* **📋 Quick Actions:** One-click "Copy to Clipboard" buttons for execution output and AI analysis to streamline your note-taking.
* **🎨 Professional UI:** A sleek, split-screen dark theme interface utilizing the industry-standard Monaco Editor (VS Code engine).

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript, Monaco Editor API, Marked.js (for markdown parsing).
* **Backend:** Node.js, Express.js.
* **Execution Environment:** Node `child_process` for local compilation and execution.
* **AI Integration:** Google GenAI SDK (Gemini 1.5 Flash).

## 📋 Prerequisites

To run this project locally, ensure you have the following installed on your system:
* **Node.js** (v18 or higher)
* **C++ Compiler:** MinGW/g++ (must be added to system PATH)
* **Java:** JDK (must be added to system PATH)
* **Python:** Python 3.x (must be added to system PATH)
* A valid **Google Gemini API Key**

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/dsa-code-optimizer.git](https://github.com/your-username/dsa-code-optimizer.git)
   cd dsa-code-optimizer
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install express cors dotenv @google/genai
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend` directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=5000
   ```

4. **Start the Server:**
   ```bash
   node server.js
   ```

5. **Launch the Frontend:**
   Open the `frontend/index.html` file in your browser directly, or use a tool like Live Server.

## 💡 How to Use

1. Select your preferred programming language from the top dropdown.
2. Write your DSA solution in the Monaco Editor.
3. Press `Ctrl + Enter` or click the **Run & Optimize** button.
4. View the terminal-style output on the right.
5. Scroll down to read the AI's optimization analysis.
6. Stuck on an error? Ask the **AI Mentor Chat** at the bottom right for contextual help!

---
*Designed & Developed by Manish Sharma*
