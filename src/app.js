import React from "react";
import "./App.css";
import chatbotIcon from "./assets/chatbot-icon.png"; // Added import for chatbotIcon

function App() {
  return (
    <div className="app-container">
      <header className="navbar">
        <div className="fixed-logo">
          <img src={chatbotIcon} alt="Chatbot" />
        </div>
        <div className="logo-text">DocBuddy</div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main className="content">
        <section className="hero">
          <h1>Welcome to DocBuddy</h1>
          <p>Your AI-powered healthcare assistant</p>
        </section>

        <section className="chat-section">
          <div className="chat-box">
            <input type="text" placeholder="Ask a question..." />
            <button className="btn">Submit</button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2025 DocBuddy. All rights reserved.</p>
      </footer>
    </div>


  );
}

export default App;
