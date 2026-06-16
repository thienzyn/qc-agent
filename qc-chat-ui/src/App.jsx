import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const BACKEND = "https://endpoint-392cf668-0694-4044-a478-9839029a4c9c.agentbase-runtime.aiplatform.vngcloud.vn";

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
      html += `<p class="list-item">- ${content}</p>`;
    } else if (/^[-•]\s+/.test(line)) {
      const content = line.replace(/^[-•]\s+/, "").replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      html += `<p class="list-item">- ${content}</p>`;
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

// ── TEMPLATES DATA ────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 1, title: "Giao dịch không thành công — Hoàn tiền về ví", folder: "In App chung", tags: ["hoàn tiền", "giao dịch", "thất bại"], content: `Chào bạn,\n\nZalopay chân thành xin lỗi vì những bất tiện bạn gặp phải trong quá trình sử dụng dịch vụ.\n\nQua kiểm tra, giao dịch [MÃ GD] bạn phản ánh không thành công và đã được Zalopay hoàn tiền về số dư tài khoản vào ngày [NGÀY]. Bạn vui lòng kiểm tra lại số dư và lịch sử giao dịch trên ứng dụng Zalopay.\n\nNếu cần hỗ trợ thêm, bạn vui lòng liên hệ Zalopay qua hotline 1900545436.\n\nCảm ơn bạn đã quan tâm và sử dụng dịch vụ của Zalopay.` },
  { id: 2, title: "Chuyển tiền ATM — Bên nhận chưa nhận được", folder: "IBFT", tags: ["chuyển tiền", "ngân hàng", "chưa nhận"], content: `Chào bạn,\n\nCảm ơn bạn đã liên hệ đến trung tâm hỗ trợ Zalopay.\n\nQua kiểm tra, giao dịch chuyển tiền [MÃ GD] ngày [NGÀY] đã được xử lý thành công tại Zalopay và thông tin đã được chuyển đến ngân hàng thụ hưởng.\n\nDo ngân hàng sẽ ưu tiên hỗ trợ chủ tài khoản, bạn vui lòng đề nghị người nhận liên hệ trực tiếp với ngân hàng để tra soát giao dịch. Trường hợp đã liên hệ ngân hàng nhưng vẫn chưa nhận được tiền, bạn vui lòng phản hồi lại để Zalopay hỗ trợ tiếp tục.\n\nMong bạn thông cảm vì sự bất tiện này. Chân thành cảm ơn bạn.` },
  { id: 3, title: "Hủy vé máy bay Vietjet — Trong khung 24h", folder: "Travelling", tags: ["vé máy bay", "vietjet", "hủy vé"], content: `Chào bạn,\n\nCảm ơn bạn đã gửi phản hồi đến trung tâm hỗ trợ Zalopay.\n\nZalopay cần hoàn tất gửi thông tin bảo lưu đến hãng Vietjet trước 24 giờ so với giờ khởi hành chặng bay đầu tiên.\n\nQua kiểm tra, chuyến bay có mã đặt chỗ [PNR] đã vào khung 24 tiếng so với giờ bay trên vé. Do đó, Zalopay không thể hỗ trợ hủy/bảo lưu vé trong trường hợp này.\n\nBạn có thể liên hệ trực tiếp với hãng qua số tổng đài Vietjet 19001886 để được tư vấn thêm.\n\nMong bạn thông cảm vì sự bất tiện này. Trân trọng cảm ơn.` },
  { id: 4, title: "Số dư sinh lời — Hướng dẫn đăng ký", folder: "SDSL", tags: ["số dư sinh lời", "đăng ký", "infina"], content: `Chào bạn,\n\nCảm ơn bạn đã quan tâm và sử dụng dịch vụ của Zalopay.\n\nĐể mở Số dư sinh lời, tài khoản Zalopay của bạn cần được định danh bằng Căn cước công dân chip và đủ 18 tuổi. Sau khi định danh thành công, bạn thực hiện theo hướng dẫn:\n\n- Bước 1: Chọn mục "Số dư sinh lời" và chọn "Tiếp tục"\n- Bước 2: Tham khảo thông tin giới thiệu rồi chọn "Bắt đầu/Đăng ký tài khoản"\n- Bước 3: Nhập thông tin giấy tờ theo yêu cầu của hệ thống\n- Bước 4: Xác nhận hợp đồng và nạp tiền vào tài khoản\n\nTrường hợp thao tác không thành công, bạn vui lòng chụp lại ảnh từng bước và chi tiết lỗi để Zalopay kiểm tra tiếp tục.\n\nHy vọng bạn hài lòng với thông tin Zalopay cung cấp. Trân trọng.` },
  { id: 5, title: "Tài khoản trả sau — Thanh toán dư nợ", folder: "Tài khoản trả sau", tags: ["trả sau", "CIMB", "dư nợ"], content: `Chào bạn,\n\nCảm ơn bạn đã sử dụng dịch vụ Tài khoản trả sau của Zalopay.\n\nĐể thanh toán dư nợ, bạn thực hiện theo các bước sau:\n- Truy cập mục "Tài khoản trả sau"\n- Chọn "Dư nợ", nhập số tiền cần thanh toán và chọn phương thức thanh toán\n\nSau khi thanh toán thành công, CIMB sẽ gạch nợ và trả lại hạn mức trong 5 phút. Bạn cần hoàn tất trước 20:00 ngày 4 hàng tháng để tránh phát sinh phí và lãi.\n\nZalopay xin chân thành cảm ơn.` },
  { id: 6, title: "Nạp điện thoại thất bại — Hoàn tiền", folder: "Telco", tags: ["nạp điện thoại", "thất bại", "hoàn tiền"], content: `Chào bạn,\n\nCảm ơn bạn đã quan tâm và sử dụng dịch vụ Zalopay.\n\nZalopay kiểm tra giao dịch nạp tiền điện thoại cho số [SĐT] không thành công và số tiền thanh toán đã được hoàn trên hệ thống Zalopay vào ngày [NGÀY].\n\nBạn vui lòng kiểm tra lại số dư tài khoản. Trường hợp thanh toán bằng thẻ Debit, thời gian hoàn tiền trong vòng 7 ngày làm việc (không tính thứ Bảy, Chủ Nhật và ngày Lễ).\n\nTrân trọng.` },
  { id: 7, title: "NFC / Sinh trắc học — Hướng dẫn xác thực", folder: "Xác thực NFC", tags: ["NFC", "sinh trắc học", "xác thực"], content: `Chào bạn,\n\nCảm ơn bạn đã liên hệ đến trung tâm hỗ trợ Zalopay.\n\nĐể thực hiện xác thực sinh trắc học NFC, bạn cần chuẩn bị:\n- Ứng dụng Zalopay phiên bản 10.8 trở lên\n- Định danh bằng Căn cước công dân gắn chip\n- Thiết bị hỗ trợ NFC (iPhone 7 trở lên iOS 13, hoặc Android 8.0 trở lên)\n\nCách thực hiện: Tài khoản → Thực hiện Sinh trắc học → Quét ngay → đặt mặt sau CCCD vào vị trí NFC của thiết bị, giữ cố định khoảng 30 giây.\n\nHy vọng bạn hài lòng với thông tin Zalopay cung cấp. Chân thành cảm ơn bạn.` },
  { id: 8, title: "Khách phủ nhận giao dịch thanh toán tự động", folder: "Billing", tags: ["tự động", "auto debit", "hóa đơn"], content: `Chào bạn,\n\nZalopay rất tiếc vì những điều không hài lòng bạn gặp phải.\n\nQua kiểm tra, giao dịch bạn đang phản ánh là giao dịch thanh toán tự động. Bạn đã đăng ký thanh toán tự động vào ngày [NGÀY], vì vậy khi hóa đơn phát sinh nợ, Zalopay đã tự động thanh toán từ nguồn tiền bạn đã bật cho phép.\n\nNếu không có nhu cầu tiếp tục, bạn vui lòng hủy đăng ký tại: Ứng dụng Zalopay → chọn dịch vụ → Hủy thanh toán tự động.\n\nMong bạn thông cảm vì sự bất tiện này. Chân thành cảm ơn bạn.` },
];

const WRITING_RULES = [
  { id: "S01", avoid: 'Dùng "vui lòng chờ" chung chung', correct: 'Cập nhật tiến độ cụ thể: "Zalopay sẽ phản hồi trong vòng X ngày làm việc"' },
  { id: "S02", avoid: "Copy nguyên template, không cá nhân hóa", correct: "Điều chỉnh theo ngữ cảnh cụ thể của KH, cá nhân hóa ít nhất 1–2 câu" },
  { id: "S03", avoid: "Đổ lỗi cho khách hàng", correct: 'Dùng cách diễn đạt trung lập: "Để hệ thống xử lý chính xác, bạn vui lòng..."' },
  { id: "S04", avoid: "Dùng từ phủ định mạnh: không, chưa, không thể", correct: 'Dùng từ khẳng định: "Zalopay sẽ hỗ trợ..."' },
  { id: "S05", avoid: "Không có câu đồng cảm từ reply thứ 2 trở lên", correct: '"Cảm ơn bạn đã kiên nhẫn chờ đợi..."' },
];

const TONE_GUIDE = [
  { mood: "Normal", desc: "Lịch sự, ngắn gọn, đúng trọng tâm. Không cần xin lỗi dài dòng." },
  { mood: "Angry", desc: 'Mở đầu bằng câu đồng cảm: "Zalopay rất tiếc vì sự bất tiện này..."' },
  { mood: "Very Angry", desc: "Tránh ngôn ngữ máy móc. Cá nhân hóa cao, chủ động xin lỗi trước." },
  { mood: "Repeat Contact", desc: "Thừa nhận KH đã liên hệ nhiều lần, không bắt giải thích lại từ đầu." },
  { mood: "VIP", desc: "Ngôn ngữ trang trọng hơn, ưu tiên xử lý và báo kết quả sớm hơn SLA." },
];

// ── QC REVIEW PANEL ───────────────────────────────────────────────────────────
function ReviewPanel() {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function runReview() {
    if (!content.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${BACKEND}/chat`, {
        message: `Hãy chấm điểm QC đoạn phản hồi sau theo tiêu chuẩn Zalopay. Tâm trạng khách hàng: ${mood}.\n\nNội dung cần review:\n${content}\n\nTrả về:\n1. Điểm số (thang 100)\n2. Các vi phạm phát hiện (nếu có)\n3. Gợi ý cải thiện`
      });
      setResult(res.data.answer);
    } catch {
      setResult("Lỗi kết nối backend. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  return (
    <div className="panel-review">
      <div className="review-intro">
        <h2>Chấm điểm QC phản hồi</h2>
        <p>Dán nội dung phản hồi ticket vào đây để AI đánh giá theo tiêu chuẩn Zalopay (thang P0→P4, 100 điểm)</p>
      </div>

      <div className="review-form">
        <label className="review-label">Nội dung phản hồi cần chấm</label>
        <textarea
          className="review-textarea"
          rows={7}
          placeholder="Dán nội dung phản hồi ticket vào đây..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <label className="review-label">Tâm trạng khách hàng</label>
        <div className="mood-row">
          {TONE_GUIDE.map(t => (
            <button
              key={t.mood}
              className={`mood-btn ${mood === t.mood ? "mood-btn--active" : ""}`}
              onClick={() => setMood(t.mood)}
              title={t.desc}
            >
              {t.mood}
            </button>
          ))}
        </div>

        <button className="review-submit" onClick={runReview} disabled={loading || !content.trim()}>
          {loading ? <span className="spinner" /> : "Chấm điểm QC"}
        </button>
      </div>

      {result && (
        <div className="review-result">
          <div className="review-result-header">Kết quả đánh giá</div>
          <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
        </div>
      )}

      <div className="writing-rules">
        <div className="rules-title">Writing Rules — 5 nguyên tắc cốt lõi</div>
        {WRITING_RULES.map(r => (
          <div key={r.id} className="rule-item">
            <span className="rule-id">{r.id}</span>
            <div>
              <div className="rule-avoid">❌ {r.avoid}</div>
              <div className="rule-correct">✅ {r.correct}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TEMPLATES PANEL ───────────────────────────────────────────────────────────
function TemplatesPanel({ onUseTemplate }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);

  const cats = ["all", ...new Set(TEMPLATES.map(t => t.folder))];

  const filtered = TEMPLATES.filter(t => {
    const matchCat = cat === "all" || t.folder === cat;
    const q = query.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.tags.some(g => g.includes(q)) || t.content.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  function copy(tpl) {
    navigator.clipboard.writeText(tpl.content);
    setCopied(tpl.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="panel-templates">
      <div className="tpl-intro">
        <h2>Kho Template</h2>
        <p>815+ mẫu phản hồi chuẩn Zalopay — tìm nhanh, copy hoặc hỏi Bee điều chỉnh</p>
      </div>

      <div className="tpl-search-wrap">
        <input
          className="tpl-search"
          placeholder="Tìm template... (VD: hoàn tiền, vé máy bay, NFC)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="tpl-cats">
        {cats.map(c => (
          <button
            key={c}
            className={`chip ${cat === c ? "chip--active" : ""}`}
            onClick={() => setCat(c)}
          >
            {c === "all" ? "Tất cả" : c}
          </button>
        ))}
      </div>

      <div className="tpl-count">{filtered.length} template hiển thị</div>

      <div className="tpl-list">
        {filtered.length === 0 && (
          <div className="tpl-empty">Không tìm thấy template phù hợp với "{query}"</div>
        )}
        {filtered.map(tpl => (
          <div key={tpl.id} className={`tpl-card ${expanded === tpl.id ? "tpl-card--open" : ""}`}>
            <div className="tpl-card-header" onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}>
              <div>
                <div className="tpl-card-title">{tpl.title}</div>
                <div className="tpl-card-folder">📁 {tpl.folder}</div>
              </div>
              <span className="tpl-chevron">{expanded === tpl.id ? "▲" : "▼"}</span>
            </div>
            {expanded === tpl.id && (
              <div className="tpl-card-body">
                <pre className="tpl-content">{tpl.content}</pre>
                <div className="tpl-card-actions">
                  <button className="chip" onClick={() => copy(tpl)}>
                    {copied === tpl.id ? "✓ Đã sao chép" : "Sao chép"}
                  </button>
                  <button className="chip chip--blue" onClick={() => onUseTemplate(tpl)}>
                    Hỏi Bee điều chỉnh ↗
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("chat");
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
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }
  }

  function clearChat() {
    setMessages([]);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  async function sendMessage(overrideMsg) {
    const userMsg = (overrideMsg || message).trim();
    if (!userMsg || loading) return;
    const time = getTime();
    setMessage(""); setCharCount(0);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages(prev => [...prev, { role: "user", text: userMsg, time }]);
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/chat`, { message: userMsg });
      setMessages(prev => [...prev, { role: "ai", text: res.data.answer, time: getTime() }]);
    } catch (err) {
      const errMsg = err.response ? "Lỗi từ server: " + JSON.stringify(err.response.data) : "Lỗi kết nối: " + err.message;
      setMessages(prev => [...prev, { role: "ai", text: errMsg, isError: true, time: getTime() }]);
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

  function useTemplate(tpl) {
    setTab("chat");
    const msg = `Hãy giúp tôi điều chỉnh template "${tpl.title}" cho phù hợp với tình huống khách hàng Angry và điền thông tin mẫu vào các placeholder`;
    setMessage(msg);
    setCharCount(msg.length);
    setTimeout(() => textareaRef.current?.focus(), 100);
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

          <nav className="header-tabs">
            <button className={`header-tab ${tab === "chat" ? "header-tab--active" : ""}`} onClick={() => setTab("chat")}>Smart Reply</button>
            <button className={`header-tab ${tab === "review" ? "header-tab--active" : ""}`} onClick={() => setTab("review")}>QC Review</button>
            <button className={`header-tab ${tab === "template" ? "header-tab--active" : ""}`} onClick={() => setTab("template")}>Templates</button>
          </nav>

          <div className="header-right">
            <div className="status-pill">
              <span className="status-dot" />
              Đang hoạt động
            </div>
            {tab === "chat" && messages.length > 0 && (
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

      {tab === "chat" && (
        <>
          <main className="chat-area">
            {messages.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon-wrap">🐝</div>
                <h2>Xin chào! Tôi là Bee 🐝</h2>
                <p>Chú ong template của Zalopay — gợi ý cách xử lý tình huống khách hàng nhanh, chuyên nghiệp và tránh mắc lỗi QC.</p>
                <div className="suggestions">
                  {quickSuggestions.map(s => (
                    <button key={s} className="chip" onClick={() => {
                      const clean = s.replace(/^.{2}/, "").trim();
                      setMessage(clean); setCharCount(clean.length);
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
                      <div className="bubble-sender">BEE 🐝</div>
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

            {suggestions.length > 0 && !loading && (
              <div className="follow-up">
                <span className="follow-up-label">Hỏi tiếp:</span>
                {suggestions.map(s => (
                  <button key={s} className="chip chip--small" onClick={() => {
                    setMessage(s); setCharCount(s.length);
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
                  onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tình huống khách hàng..."
                  rows={1}
                />
                <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !message.trim()}>
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
        </>
      )}

      {tab === "review" && <ReviewPanel />}
      {tab === "template" && <TemplatesPanel onUseTemplate={useTemplate} />}
    </div>
  );
}
 
