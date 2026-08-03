import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";
import PackageCard from "../Common/PackageCard";
import api from "../../utils/api";

const getSessionId = () => {
  const existing = localStorage.getItem("chatbotSessionId");
  if (existing) return existing;
  const next = `CHAT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  localStorage.setItem("chatbotSessionId", next);
  return next;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("chatbotOpen");
    return saved ? JSON.parse(saved) : true;
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(() => getSessionId());
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    { sender: "chatbot-bot", text: "Hi. Tell me where you want to travel." }
  ]);

  useEffect(() => {
    localStorage.setItem("chatbotOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const sendMessage = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { sender: "chatbot-user", text: trimmed }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await api.post("/chatbot/query", {
        message: trimmed,
        sessionId,
      });

      if (response?.sessionId && response.sessionId !== sessionId) {
        localStorage.setItem("chatbotSessionId", response.sessionId);
        setSessionId(response.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        { sender: "chatbot-bot", text: response.answer || "I could not prepare an answer right now." },
        ...(response.packages?.length ? [{ sender: "chatbot-bot", type: "packages", data: response.packages }] : []),
        ...(response.quickReplies?.length ? [{ sender: "chatbot-bot", type: "quickReplies", data: response.quickReplies }] : [])
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "chatbot-bot",
          text: "I am unable to reach the travel assistant right now. Please try again or contact +91 884 7755 042."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "right" ? 200 : -200,
      behavior: "smooth"
    });
  };

  return (
    <>
      {!isOpen && (
        <button type="button" className="chatbot-fab" onClick={() => setIsOpen(true)} aria-label="Open travel assistant">
          <img src="/chat-bot.png" alt="Route Icon" className="chatbot-fab-icon" />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-header-title">ORIX by STARRY NIGHTS</div>
              <div className="chatbot-header-subtitle">
                Optimized Route & Itinerary eXpert by Starry Nights
              </div>
            </div>

            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close ORIX assistant"
            >
              X
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => {
              if (msg.type === "packages") {
                return (
                  <div className="chatbot-packages" key={i}>
                    <button
                      type="button"
                      className="chatbot-scroll-btn left"
                      onClick={() => scroll("left")}
                      aria-label="Show previous recommended packages"
                      title="Previous packages"
                    >
                      <span aria-hidden="true">‹</span>
                    </button>
                    <div className="chatbot-packages-row" ref={scrollRef}>
                      {msg.data.map((pkg) => (
                        <div className="chatbot-card-wrapper" key={pkg.packageCode || pkg.code || pkg.id}>
                          <PackageCard
                            image={pkg.image}
                            name={pkg.name || pkg.title}
                            packageCode={pkg.packageCode || pkg.code}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="chatbot-scroll-btn right"
                      onClick={() => scroll("right")}
                      aria-label="Show more recommended packages"
                      title="More packages"
                    >
                      <span aria-hidden="true">›</span>
                    </button>
                  </div>
                );
              }

              if (msg.type === "quickReplies") {
                return (
                  <div className="chatbot-quick-replies" key={i}>
                    {msg.data.map((reply) => (
                      <button type="button" key={reply} onClick={() => sendMessage(reply)}>
                        {reply}
                      </button>
                    ))}
                  </div>
                );
              }

              return <div key={i} className={msg.sender}>{msg.text}</div>;
            })}
            {isSending && <div className="chatbot-bot chatbot-loading">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              className="chatbot-input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Ask about trips..."
              disabled={isSending}
            />
            <button className="chatbot-input-button" onClick={() => sendMessage()} disabled={isSending}>
              {isSending ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
