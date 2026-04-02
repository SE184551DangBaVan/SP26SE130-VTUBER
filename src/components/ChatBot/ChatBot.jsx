"use client";
import { useState, useRef, useEffect } from "react";
import "./ChatBot.css";
import {useAuth} from "@/functions/Auth/useAuth.jsx";
import { getChatMessages } from "@/services/ChatMessageController";
import {
  connectWebSocket,
  subscribeToMessages,
  sendWebSocketMessage,
} from "@/services/WebSocketConfig";

export default function ChatBot() {
  const { loading, userAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  if (loading) return null;
  if (!userAuth) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to WebSocket when chatbot is first opened
  useEffect(() => {
    const initWebSocket = async () => {
      if (isOpen && !isConnected) {
        try {
          const client = await connectWebSocket();
          setIsConnected(true);

          // Small delay to ensure STOMP broker is fully ready
          await new Promise(resolve => setTimeout(resolve, 50));

          // Subscribe to messages
          subscriptionRef.current = subscribeToMessages((response) => {
            // Handle both APIResponse wrapper and raw MessageResponse
            const newMessage = response.data || response;
            if (newMessage.id && newMessage.content) {
              setMessages((prev) => [...prev, {
                id: newMessage.id,
                type: newMessage.senderRole === "USER" ? "user" : "bot",
                text: newMessage.content,
                createdAt: newMessage.createdAt,
                thought: newMessage.thought,
              }]);
              setIsTyping(false);
            }
          });
        } catch (error) {
          console.error("Failed to connect WebSocket:", error);
          setIsConnected(false);
        }
      }
    };

    initWebSocket();

    // Cleanup on unmount OR when chatbot is closed
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isOpen]);

  // Load messages when chatbot is first opened
  useEffect(() => {
    const loadMessages = async () => {
      if (isOpen && !hasLoadedMessages) {
        const result = await getChatMessages();
        if (result?.success && result?.data) {
          const formattedMessages = result.data.map((msg) => ({
            id: msg.id,
            type: msg.senderRole === "USER" ? "user" : "bot",
            text: msg.content,
            createdAt: msg.createdAt,
            thought: msg.thought,
          }));
          setMessages(formattedMessages);
          setHasLoadedMessages(true);
        }
      }
    };

    loadMessages();
  }, [isOpen, hasLoadedMessages]);


  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputValue,
    };

    // Add temporary message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Send message via WebSocket
    try {
      await sendWebSocketMessage({
        content: inputValue,
        thought: null
      });
      // Response will be handled by WebSocket subscription callback
    } catch (error) {
      console.error("Failed to send message via WebSocket:", error);
      setIsTyping(false);
      // Fallback to HTTP if WebSocket fails
      setMessages((prev) => prev.filter(m => m.id !== userMessage.id));
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button className="chatbot-toggle-btn" onClick={toggleChat}>
        <img
          src="/mambo.webp"
          alt="Chat Bot"
          className="chatbot-toggle-icon"
        />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <img
                src="/mambo.webp"
                alt="Mambo Avatar"
                className="chatbot-avatar"
              />
              <span className="chatbot-name">MatikanetannhauserAI</span>
            </div>
            <div className="chatbot-header-right">
              <button className="chatbot-settings-btn" title="Settings">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button className="chatbot-close-btn" onClick={toggleChat} title="Close">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type === "user" ? "user-message" : "bot-message"}`}
              >
                {message.type === "bot" && (
                  <img
                    src="/mambo.webp"
                    alt="Bot Avatar"
                    className="message-avatar"
                  />
                )}
                <div className="message-bubble">{message.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot-message">
                <img
                  src="/mambo.webp"
                  alt="Bot Avatar"
                  className="message-avatar"
                />
                <div className="message-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask Mambo something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
      )}
    </>
  );
}
