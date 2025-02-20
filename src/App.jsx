import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import chatbotIcon from './assets/chatbot.png';
import { FaMicrophone } from 'react-icons/fa';
import PaytmButton from "./paytmButton/paytmButton";

function App() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatWindowRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [useVoiceResponse, setUseVoiceResponse] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const micButtonRef = useRef(null);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => {
      setIsListening(true);
      setUseVoiceResponse(true);
      setMicActive(true);
      if (micButtonRef.current) {
        micButtonRef.current.classList.add('clicked');
      }
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      generateAnswer(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
      setMicActive(false);
      if (micButtonRef.current) {
        micButtonRef.current.classList.remove('clicked');
      }
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
      setIsListening(false);
      setMicActive(false);
      if (micButtonRef.current) {
        micButtonRef.current.classList.remove('clicked');
      }
    };
    recognition.start();
  };

  async function generateAnswer(userInput = question) {
    if (!userInput.trim()) return;

    setIsChatting(true);
    const userMessage = { sender: 'You', text: userInput, time: getCurrentTime() };
    setChatHistory((prevHistory) => [...prevHistory, userMessage]);
    setQuestion('');

    try {
      const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCURgurmnEInS_6S99uWsaIJhPUp0V0V0s', {
        contents: [{
          parts: [{
            text: "You are an empathetic, helpful, and respectful senior general practitioner in this conversation. You will be talking to a user who is having some symptoms and wants clarity on what's happening and what they can do to improve their condition.\n\nUser: " + userInput
          }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        throw new Error('Invalid response from Gemini API');
      }

      let botResponse = response.data.candidates[0].content.parts[0].text;
      botResponse = botResponse.replace(/^DocBuddy[:,]? /i, '')
        .replace(/\n\n/g, '\n- ')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\b(age|gender|medical history|chief complaint|duration|severity|related symptoms|symptoms|possible diagnoses|care plan)\b/gi, '<strong>$1</strong>');

      const botMessage = { sender: 'DocBuddy', text: botResponse, time: getCurrentTime() };
      setChatHistory((prevHistory) => [...prevHistory, botMessage]);

      if (useVoiceResponse) {
        speak(botResponse);
        setUseVoiceResponse(false);
      }
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred while fetching the response';
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: 'DocBuddy', text: errorMessage, time: getCurrentTime() },
      ]);
    } finally {
      setIsChatting(false);
    }
  }

  const speak = (text) => {
    speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text.replace(/<\/?[^>]+(>|$)/g, "").replace(/\*/g, " "));
      utterance.lang = 'en-US';

      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        const preferredVoices = voices.filter(voice =>
          voice.name.includes("Google UK English Female") ||
          voice.name.includes("Microsoft Zira") ||
          voice.name.includes("Microsoft Cortana")
        );

        utterance.voice = preferredVoices.length > 0 ? preferredVoices[0] : voices.find(voice => voice.lang === 'en-US') || voices[0];
        utterance.rate = 1.25;
        utterance.pitch = 1;
        utterance.volume = 1;
        speechSynthesis.speak(utterance);
      };

      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = loadVoices;
      } else {
        loadVoices();
      }
    }, 100);
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({ top: chatWindowRef.current.scrollHeight, behavior: 'smooth' });
    }
    speechSynthesis.cancel();
  }, [chatHistory]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isChatting) {
      event.preventDefault();
      generateAnswer();
    }
  };

  return (
    <div className="app-container">
      <div className="chatbot-icon-wrapper">
        <img src={chatbotIcon} alt="Chatbot" className="chatbot-icon" />
        <span className="ai-doctor-logo">DocBuddy</span>
      </div>

      <div className="chat-container">
        <div className="chat-window" ref={chatWindowRef}>
          {chatHistory.map((msg, index) => (
            <div key={index} className={msg.sender === 'You' ? 'user-box' : 'bot-box'}>
              <strong>{msg.sender}:</strong>
              <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }} />
              <div className="timestamp">{msg.time}</div>
            </div>
          ))}
        </div>

        <div className="input-container">
          <textarea
            className="chat-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your symptoms..."
          ></textarea>

          <div className="button-group">
            <button
              className={`mic-button ${micActive ? 'active' : ''}`}
              ref={micButtonRef}
              onClick={() => {
                if (isListening) {
                  setMicActive(false);
                  if (micButtonRef.current) {
                    micButtonRef.current.classList.remove('clicked');
                  }
                } else {
                  startListening();
                }
              }}
            >
              <FaMicrophone />
            </button>

            <PaytmButton />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;