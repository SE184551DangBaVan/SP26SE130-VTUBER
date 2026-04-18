"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import "./ChatBot.css";
import {useAuth} from "@/functions/Auth/useAuth.jsx";
import { getChatMessages, sendChatMessage } from "@/services/ChatMessageController";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INITIAL_PAGE_SIZE = 7;
const LOAD_MORE_PAGE_SIZE = 10;

export default function ChatBot() {
  const { loading, userAuth } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousScrollHeightRef = useRef(0);

  if (loading) return null;
  if (!userAuth) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initial load - scroll to bottom
  useEffect(() => {
    if (hasLoadedMessages && messages.length > 0) {
      scrollToBottom();
    }
  }, [hasLoadedMessages, messages.length]);

  // Load initial messages when chatbot is first opened
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (isOpen && !hasLoadedMessages) {
        const result = await getChatMessages(0, INITIAL_PAGE_SIZE);
        if (result?.success && result?.data?.data) {
          const formattedMessages = result.data.data.map((msg) => ({
            id: msg.id,
            type: msg.senderRole === "USER" ? "user" : "bot",
            text: msg.content,
            createdAt: msg.createdAt,
            thought: msg.thought,
            metadataResponse: msg.metadataResponse,
          })).reverse(); // Reverse to show oldest first
          
          setMessages(formattedMessages);
          setCurrentPage(0);
          setHasMoreMessages(result.data.hasNext);
          setHasLoadedMessages(true);
        }
      }
    };

    loadInitialMessages();
  }, [isOpen, hasLoadedMessages]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMoreMessages || isLoadingMore) return;

    // Check if user scrolled to top
    if (container.scrollTop === 0) {
      setIsLoadingMore(true);
      previousScrollHeightRef.current = container.scrollHeight;

      const nextPage = currentPage + 1;
      const result = await getChatMessages(nextPage, LOAD_MORE_PAGE_SIZE);
      
      if (result?.success && result?.data?.data) {
        const newMessages = result.data.data.map((msg) => ({
          id: msg.id,
          type: msg.senderRole === "USER" ? "user" : "bot",
          text: msg.content,
          createdAt: msg.createdAt,
          thought: msg.thought,
          metadataResponse: msg.metadataResponse,
        })).reverse();

        setMessages((prev) => [...newMessages, ...prev]);
        setCurrentPage(nextPage);
        setHasMoreMessages(result.data.hasNext);

        // Maintain scroll position after adding messages
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeightRef.current;
        });
      }

      setIsLoadingMore(false);
    }
  }, [currentPage, hasMoreMessages, isLoadingMore]);


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

    try {
      const result = await sendChatMessage(inputValue);
      
      if (result?.success && result?.data) {
        const botMessage = {
          id: result.data.id,
          type: "bot",
          text: result.data.content,
          createdAt: result.data.createdAt,
          thought: result.data.thought,
          metadataResponse: result.data.metadataResponse,
        };
        
        // Remove temporary user message and add both with proper IDs
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== userMessage.id);
          return [...filtered, userMessage, botMessage];
        });

        // If metadataResponse exists and is POST, handle auto-navigation
        if (result.data.metadataResponse?.metadataType === "POST") {
          const navMessageId = Date.now() + 1;
          const navMessage = {
            id: navMessageId,
            type: "bot",
            text: "Navigating user to returned post...",
            isSystem: true
          };
          
          setMessages(prev => [...prev, navMessage]);
          
          setTimeout(() => {
            router.push(`/posts?id=${result.data.metadataResponse.postId}`);
            // Remove the system message after navigation
            setMessages(prev => prev.filter(m => m.id !== navMessageId));
          }, 1000);
        }
      } else {
        // Remove user message if send failed
        setMessages((prev) => prev.filter(m => m.id !== userMessage.id));
        alert(result?.message || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter(m => m.id !== userMessage.id));
      alert("Failed to send message. Please try again.");
    } finally {
      setIsTyping(false);
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

          <div className="chatbot-messages" ref={messagesContainerRef} onScroll={handleScroll}>
            {isLoadingMore && (
              <div className="message bot-message">
                <div className="message-bubble loading-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type === "user" ? "user-message" : "bot-message"}`}
              >
                {message.type === "bot" && !message.isSystem && (
                  <img
                    src="/mambo.webp"
                    alt="Bot Avatar"
                    className="message-avatar"
                  />
                )}
                <div className={`message-bubble ${message.isSystem ? "system-message" : ""}`}>
                  {message.text}
                  {message.metadataResponse && message.metadataResponse.metadataType === "POST" && (
                    <div className="post-preview-container">
                      <Link 
                        href={`/posts?id=${message.metadataResponse.postId}`}
                        className="post-preview-link"
                      >
                        {message.metadataResponse.imagePreviewUrl && (
                          <img 
                            src={message.metadataResponse.imagePreviewUrl} 
                            alt="Post Preview" 
                            className="post-preview-image"
                          />
                        )}
                        <div className="post-preview-content">
                          <div className="post-preview-title">{message.metadataResponse.postTitle}</div>
                          {message.metadataResponse.postContent && (
                            <div className="post-preview-text">{message.metadataResponse.postContent}</div>
                          )}
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
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
