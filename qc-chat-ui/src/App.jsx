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
    // Highlight Zalopay
    line = line.replace(/(Zalopay)/g, '<span class="brand">$1</span>');

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
      // skip
    } else {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      if (/🐝|💡/.test(line) || /Lưu ý QC/i.test(line)) {
        const qcFormatted = formatted.replace(/(Lưu ý QC:?)/gi, '<span class="qc-label">$1</span>');
        html += `<p class="qc-note">${qcFormatted}</p>`;
      } else if (line.startsWith('(') || /^Áp dụng/i.test(line)) {
        html += `<p class="note-italic">${formatted}</p>`;
      } else {
        html += `<p>${formatted}</p>`;
      }
    }
  }
  return html;
}

function getTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="msg-row msg-row--ai">
      <AIAvatar />
      <div className="bubble bubble--ai bubble--typing">
        <div className="shimmer-dots">
          <span /><span /><span />
        </div>
        <span className="typing-text">Bee đang soạn...</span>
      </div>
    </div>
  );
}

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [charCount, setCharCount] = useState(0);
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

  function clearChat() {
    setMessages([]);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    const time = getTime();
    setMessage("");
    setCharCount(0);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", text: userMsg, time }]);
    setLoading(true);
    try {
      const res = await axios.post("https://endpoint-392cf668-0694-4044-a478-9839029a4c9c.agentbase-runtime.aiplatform.vngcloud.vn/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "ai", text: res.data.answer, time: getTime() }]);
    } catch (err) {
      const errMsg = err.response ? "Lỗi từ server: " + JSON.stringify(err.response.data) : "Lỗi kết nối: " + err.message;
      setMessages((prev) => [...prev, { role: "ai", text: errMsg, isError: true, time: getTime() }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function copyText(text, idx) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  function getSuggestions(text) {
    if (!text) return [];
    if (/IBFT|liên ngân hàng/i.test(text)) return ["Thời gian hoàn tiền IBFT?", "Khách yêu cầu bằng chứng giao dịch?"];
    if (/khóa|mở khóa/i.test(text)) return ["Cần giấy tờ gì để mở khóa?", "Thời gian xử lý mở khóa?"];
    if (/hoàn tiền|chuyển nhầm/i.test(text)) return ["Quy trình hoàn tiền bao lâu?", "Cần thông tin gì để tra soát?"];
    if (/OTP/i.test(text)) return ["Khách không nhận được OTP lần 2?", "Thay đổi số điện thoại nhận OTP?"];
    return ["Tình huống khách gay gắt hơn?", "Cần template phản hồi email?"];
  }

  const lastAiMsg = [...messages].reverse().find(m => m.role === "ai");
  const suggestions = lastAiMsg ? getSuggestions(lastAiMsg.text) : [];

  const quickSuggestions = [
    "💬 Khách hàng gay gắt về giao dịch IBFT?",
    "💸 Làm sao hoàn tiền khi chuyển nhầm?",
    "🔒 Tài khoản bị khóa xử lý thế nào?",
    "📱 Khách không nhận được mã OTP?",
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="zp-zalo">Zalo</span><span className="zp-pay">pay</span>
          </div>
          <div className="header-divider" />
          <span className="header-product">Bee - Chú Ong Template</span>
          <div className="header-right">
            <div className="status-pill">
              <span className="status-dot" />
              Đang hoạt động
            </div>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={clearChat} title="Làm mới cuộc trò chuyện">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.49"/>
                </svg>
                Làm mới
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="chat-area">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon-wrap">🐝</div>
            <h2>Xin chào! Tôi là Bee 🐝</h2>
            <p>Chú ong template của Zalopay — gợi ý cách xử lý tình huống khách hàng nhanh, chuyên nghiệp và tránh mắc lỗi QC.</p>
            <div className="suggestions">
              {quickSuggestions.map((s) => (
                <button key={s} className="chip" onClick={() => {
                  const clean = s.replace(/^.{2}/, "").trim();
                  setMessage(clean);
                  setCharCount(clean.length);
                  textareaRef.current?.focus();
                }}>{s}</button>
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
                    <div className="bubble-footer">
                      <span className="msg-time">{msg.time}</span>
                      <button className="copy-btn" onClick={() => copyText(msg.text, i)}>
                        {copied === i ? (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép</>
                        ) : (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Sao chép</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {msg.text}
                  <div className="msg-time msg-time--user">{msg.time}</div>
                </>
              )}
            </div>
            {msg.role === "user" && <div className="avatar-user">Bạn</div>}
          </div>
        ))}

        {loading && <TypingIndicator />}

        {/* Gợi ý tiếp theo */}
        {suggestions.length > 0 && !loading && (
          <div className="follow-up">
            <span className="follow-up-label">Hỏi tiếp:</span>
            {suggestions.map((s) => (
              <button key={s} className="chip chip--small" onClick={() => {
                setMessage(s);
                setCharCount(s.length);
                textareaRef.current?.focus();
              }}>{s}</button>
            ))}
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
              onChange={(e) => { setMessage(e.target.value); setCharCount(e.target.value.length); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tình huống khách hàng..."
              rows={1}
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading || !message.trim()}>
              {loading ? <span className="spinner" /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <div className="input-meta">
            <span className="input-hint">Enter để gửi · Shift+Enter xuống dòng</span>
            <span className={`char-count ${charCount > 400 ? "char-count--warn" : ""}`}>{charCount}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}
