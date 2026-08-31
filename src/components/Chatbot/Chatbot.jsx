import React, { useEffect, useRef, useState } from "react";
import { FaCompass } from "react-icons/fa";
import "./Chatbot.css";
import PackageCard from "../Common/PackageCard";
import { chatbotApi } from "../../utils/api";

const getSessionId = () => {
  const existing = localStorage.getItem("chatbotSessionId");
  if (existing) return existing;
  const next = `CHAT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  localStorage.setItem("chatbotSessionId", next);
  return next;
};

const getStoredPosition = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved;
  } catch {
    // A malformed local preference must not prevent the assistant loading.
  }
  return null;
};

const positionStyle = (position) => (position ? {
  left: `${position.x}px`,
  top: `${position.y}px`,
  right: "auto",
  bottom: "auto",
} : undefined);

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
  const fabRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const [fabPosition, setFabPosition] = useState(() => getStoredPosition("atlasChatFabPosition"));
  const [panelPosition, setPanelPosition] = useState(() => getStoredPosition("atlasChatPanelPosition"));
  const [messages, setMessages] = useState([
    { sender: "chatbot-bot", text: "Hi. Tell me where you want to travel." }
  ]);

  useEffect(() => {
    localStorage.setItem("chatbotOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (fabPosition) localStorage.setItem("atlasChatFabPosition", JSON.stringify(fabPosition));
  }, [fabPosition]);

  useEffect(() => {
    if (panelPosition) localStorage.setItem("atlasChatPanelPosition", JSON.stringify(panelPosition));
  }, [panelPosition]);

  useEffect(() => {
    const move = (event) => {
      const drag = dragRef.current;
      if (!drag) return;

      const nextPosition = {
        x: Math.max(8, Math.min(event.clientX - drag.offsetX, window.innerWidth - drag.width - 8)),
        y: Math.max(8, Math.min(event.clientY - drag.offsetY, window.innerHeight - drag.height - 8)),
      };
      if (Math.abs(nextPosition.x - drag.startX) > 3 || Math.abs(nextPosition.y - drag.startY) > 3) {
        draggedRef.current = true;
      }
      if (drag.target === "fab") setFabPosition(nextPosition);
      else setPanelPosition(nextPosition);
    };
    const stop = () => { dragRef.current = null; };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, []);

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
      const response = await chatbotApi.post("/chatbot/query", {
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

  const startDrag = (event, target) => {
    if (event.button !== 0 || (target === "panel" && event.target.closest("button"))) return;
    const element = target === "fab" ? fabRef.current : panelRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    dragRef.current = {
      target,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      startX: bounds.left,
      startY: bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
    draggedRef.current = false;
  };

  const openAssistant = (event) => {
    if (draggedRef.current) {
      event.preventDefault();
      draggedRef.current = false;
      return;
    }
    setIsOpen(true);
  };

  const closeAfterMobilePackageNavigation = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          ref={fabRef}
          type="button"
          className="chatbot-fab"
          style={positionStyle(fabPosition)}
          onPointerDown={(event) => startDrag(event, "fab")}
          onClick={openAssistant}
          aria-label="Open ATLAS travel assistant. Drag to move."
          title="Open ATLAS — drag to move"
        >
          <span className="chatbot-fab__mark" aria-hidden="true"><FaCompass /></span>
          <span className="chatbot-fab__copy">
            <strong>ATLAS</strong>
            <small>Travel assistant</small>
          </span>
          <span className="chatbot-fab__pulse" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div ref={panelRef} className="chatbot-container" style={positionStyle(panelPosition)}>
          <div className="chatbot-header" onPointerDown={(event) => startDrag(event, "panel")} title="Drag to move ATLAS">
            <div className="chatbot-header-content">
              <div className="chatbot-header-title">ATLAS</div>
              <div className="chatbot-header-subtitle">
                Advanced Travel &amp; Location Assistance System
              </div>
            </div>

            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close ATLAS assistant"
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
                            onPackageOpen={closeAfterMobilePackageNavigation}
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
