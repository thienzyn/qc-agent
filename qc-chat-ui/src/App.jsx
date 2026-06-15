import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";



const AIAvatar = () => (
  <div className="avatar-ai">
    <span style={{fontSize:"20px", lineHeight:1}}>🐝</span>
  </div>
);

function renderMarkdown(text) {
  const lines = text.split("\n");
  let html = "";

  for (let line of lines) {
    line = line.replace(/^>\s*/, "");

    if (/^### (.+)/.test(line)) {
      html += `<h3>${line.replace(/^### /, "")}</h3>`;
    } else if (/^## (.+)/.test(line)) {
      html += `<h2>${line.replace(/^## /, "")}</h2>`;
    } else if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, "").replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      html += `<p class="list-item">• ${content}</p>`;
    } else if (/^[-•]\s+/.test(line)) {
      const content = line.replace(/^[-•]\s+/, "").replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      html += `<p class="list-item">• ${content}</p>`;
    } else if (line.trim() === "---") {
      html += '<hr/>';
    } else if (line.trim() === "") {
      // dòng trống — bỏ qua, margin của p đã tạo khoảng cách
    } else {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      if (/💡/.test(line) || /Luưu ý QC/i.test(line)) {
        html += `<p class="qc-note">${formatted}</p>`;
      } else {
        html += `<p>${formatted}</p>`;
      }
    }
  }
  return html;
}

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function autoResize() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await axios.post("https://endpoint-392cf668-0694-4044-a478-9839029a4c9c.agentbase-runtime.aiplatform.vngcloud.vn/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "ai", text: res.data.answer }]);
    } catch (err) {
      const errMsg = err.response
        ? "Lỗi từ server: " + JSON.stringify(err.response.data)
        : "Lỗi kết nối: " + err.message;
      setMessages((prev) => [...prev, { role: "ai", text: errMsg, isError: true }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function copyText(text, idx) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  const suggestions = [
    "💬 Khách hàng gay gắt về giao dịch IBFT?",
    "💸 Làm sao hoàn tiền khi chuyển nhầm?",
    "🔒 Tài khoản bị khóa xử lý thế nào?",
    "📱 Khách không nhận được mã OTP?",
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <span className="header-brand">
            <span className="zp-zalo">Zalo</span><span className="zp-pay">pay</span>
          </span>
          <div className="header-divider" />
          <span className="header-product">Bee - Chú Ong Template</span>
          <div className="header-right">
            <div className="status-pill">
              <span className="status-dot" />
              Đang hoạt động
            </div>
          </div>
        </div>
      </header>

      <main className="chat-area">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>Xin chào! Tôi là Bee 🐝</h2>
            <p>Chú ong template của Zalopay — gợi ý cách xử lý tình huống khách hàng nhanh, chuyên nghiệp và tránh mắc lỗi QC.</p>
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s} className="chip" onClick={() => {
                  setMessage(s.replace(/^.{2}/, "").trim());
                  textareaRef.current?.focus();
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role === "user" ? "msg-row--user" : "msg-row--ai"}`}>
            {msg.role === "ai" && <AIAvatar />}
            <div className={`bubble ${msg.role === "user" ? "bubble--user" : "bubble--ai"} ${msg.isError ? "bubble--error" : ""}`}>
              {msg.role === "ai" ? (
                <>
                  <div className="bubble-sender">Bee 🐝</div>
                  <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                  {!msg.isError && (
                    <button className="copy-btn" onClick={() => copyText(msg.text, i)}>
                      {copied === i ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                          Sao chép
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : msg.text}
            </div>
            {msg.role === "user" && <div className="avatar-user">Bạn</div>}
          </div>
        ))}

        {loading && (
          <div className="msg-row msg-row--ai">
            <AIAvatar />
            <div className="bubble bubble--ai bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <div className="input-bar">
        <div className="input-wrap">
          <div className="input-inner">
            <textarea
              ref={textareaRef}
              className="textarea"
              value={message}
              onChange={(e) => { setMessage(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tình huống khách hàng..."
              rows={1}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !message.trim()}
            >
              {loading ? <span className="spinner" /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p className="input-hint">Enter để gửi · Shift+Enter xuống dòng</p>
        </div>
      </div>
    </div>
  );
}
