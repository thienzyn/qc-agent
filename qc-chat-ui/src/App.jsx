import React, { useState, useRef, useEffect } from "react";
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

// ── HARDCODED TEMPLATE FALLBACK ───────────────────────────────────────────────
const FALLBACK_TEMPLATES = [
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

const P_COLORS = {
  P0: { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB" },
  P1: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  P2: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  P3: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
  P4: { bg: "#4B0082", color: "#fff",    border: "#7C3AED" },
};

// ── QC REVIEW PANEL ───────────────────────────────────────────────────────────
function ReviewPanel() {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveResult, setImproveResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  async function runReview() {
    if (!content.trim()) return;
    setLoading(true); setResult(null); setImproveResult(null); setApiError(null);
    try {
      const res = await axios.post(`${BACKEND}/review`, {
        chat_content: content,
        mood: mood
      });
      setResult(res.data);
    } catch {
      setApiError("Lỗi kết nối backend. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  async function runImprove() {
    if (!content.trim()) return;
    setImproveLoading(true); setImproveResult(null);
    try {
      const res = await axios.post(`${BACKEND}/improve`, { text: content });
      setImproveResult(res.data.answer);
    } catch {
      setImproveResult("Lỗi kết nối. Vui lòng thử lại.");
    }
    setImproveLoading(false);
  }

  const score = result?.score ?? null;
  const scoreColor = score === null ? "#0068FF" : score >= 80 ? "#00B14F" : score >= 60 ? "#F59E0B" : "#E53935";
  const scoreLabel = score === null ? "" : score >= 80 ? "Đạt chuẩn" : score >= 60 ? "Cần cải thiện" : "Không đạt";

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

        <div style={{display:"flex", gap:"8px", flexWrap:"wrap"}}>
          <button className="review-submit" onClick={runReview} disabled={loading || !content.trim()}>
            {loading ? <span className="spinner" /> : "Chấm điểm QC"}
          </button>
          <button className="review-submit review-submit--secondary" onClick={runImprove} disabled={improveLoading || !content.trim()}>
            {improveLoading ? <span className="spinner" /> : "✨ Cải thiện văn bản"}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="review-result" style={{borderColor:"#FECACA",background:"#FFF0F0"}}>
          <p style={{color:"#C62828",fontSize:"14px"}}>{apiError}</p>
        </div>
      )}

      {result && (
        <div className="review-result">
          <div className="score-row">
            <div className="score-circle" style={{borderColor: scoreColor, color: scoreColor}}>
              <div className="score-number">{score}</div>
              <div className="score-label">/100</div>
            </div>
            <div>
              <div className="score-status" style={{color: scoreColor}}>{scoreLabel}</div>
              <div className="score-summary">
                {result.violations.length === 0
                  ? "Không phát hiện vi phạm"
                  : `${result.violations.length} vi phạm · trừ ${result.violations.reduce((s, v) => s + (v.points_deducted || 0), 0)} điểm`}
              </div>
            </div>
          </div>

          {result.violations.length > 0 && (
            <div className="violations-section">
              <div className="violations-title">Vi phạm phát hiện</div>
              {result.violations.map((v, i) => {
                const pc = P_COLORS[v.p_level] || P_COLORS.P0;
                return (
                  <div key={i} className="violation-item">
                    <span className="p-badge" style={{background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`}}>
                      {v.p_level}
                    </span>
                    <div className="violation-body">
                      <div className="violation-category">{v.category}{v.violation_type ? ` · ${v.violation_type}` : ""}</div>
                      <div className="violation-desc">{v.description}</div>
                    </div>
                    {v.points_deducted > 0 && (
                      <div className="violation-pts">-{v.points_deducted}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="suggestions-section">
              <div className="suggestions-title">Gợi ý cải thiện</div>
              {result.suggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className="suggestion-bullet">→</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {improveResult && (
        <div className="review-result">
          <div className="review-result-header">✨ Phiên bản cải thiện</div>
          <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(improveResult) }} />
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
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    axios.get(`${BACKEND}/templates`)
      .then(res => {
        const raw = res.data.templates || [];
        if (raw.length > 0) {
          const mapped = raw.map((t, i) => ({
            id: i + 1,
            title: t["Tiêu Đề Template"] || "",
            folder: t["Thư Mục"] || t["Nhóm"] || "Khác",
            tags: [],
            content: t["Nội Dung Phản Hồi"] || "",
          })).filter(t => t.title && t.content);
          setTemplates(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTpl(false));
  }, []);

  const cats = ["all", ...new Set(templates.map(t => t.folder))];

  const filtered = templates.filter(t => {
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
        <p>
          {loadingTpl
            ? "Đang tải template từ knowledge base..."
            : `${templates.length} mẫu phản hồi chuẩn Zalopay — tìm nhanh, copy hoặc hỏi Bee điều chỉnh`}
        </p>
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
        {loadingTpl && (
          <div className="tpl-empty" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
            <span className="spinner" style={{borderTopColor:"#0068FF",borderColor:"rgba(0,104,255,0.2)"}} />
            Đang tải...
          </div>
        )}
        {!loadingTpl && filtered.length === 0 && (
          <div className="tpl-empty">Không tìm thấy template phù hợp với "{query}"</div>
        )}
        {!loadingTpl && filtered.map(tpl => (
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

// ── COACH PANEL ───────────────────────────────────────────────────────────────
function CoachPanel() {
  const [errors, setErrors] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function runCoach() {
    if (!errors.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${BACKEND}/coach`, { errors });
      setResult(res.data.answer);
    } catch {
      setResult("Lỗi kết nối backend. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  const exampleErrors = `P2 - Không có câu đồng cảm khi KH phản ánh lần 2
P1 - Dùng từ "không thể" thay vì cách diễn đạt tích cực
P3 - Đổ lỗi cho hệ thống ngân hàng`;

  return (
    <div className="panel-review">
      <div className="review-intro">
        <h2>AI Coaching Plan</h2>
        <p>Nhập danh sách lỗi QC của agent — AI sẽ phân tích nguyên nhân, đưa coaching plan và action plan 2 tuần</p>
      </div>

      <div className="review-form">
        <label className="review-label">Danh sách lỗi QC</label>
        <textarea
          className="review-textarea"
          rows={6}
          placeholder={`Ví dụ:\n${exampleErrors}`}
          value={errors}
          onChange={e => setErrors(e.target.value)}
        />

        <button className="review-submit" onClick={runCoach} disabled={loading || !errors.trim()}>
          {loading ? <span className="spinner" /> : "Tạo Coaching Plan"}
        </button>
      </div>

      {result && (
        <div className="review-result">
          <div className="review-result-header">📋 Coaching Plan</div>
          <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
        </div>
      )}

      <div className="writing-rules" style={{marginTop:"4px"}}>
        <div className="rules-title">Coaching dùng khi nào?</div>
        <div className="rule-item">
          <span className="rule-id" style={{background:"#FEF2F2",color:"#B91C1C",borderColor:"#FECACA"}}>P3+</span>
          <div>
            <div className="rule-avoid" style={{color:"var(--text)"}}>Agent liên tục vi phạm ≥ P3 trong 1 tháng</div>
            <div className="rule-correct" style={{color:"var(--text-muted)",fontSize:"12px"}}>Cần coaching 1:1 + action plan cụ thể</div>
          </div>
        </div>
        <div className="rule-item">
          <span className="rule-id" style={{background:"#FFF7ED",color:"#C2410C",borderColor:"#FED7AA"}}>P2</span>
          <div>
            <div className="rule-avoid" style={{color:"var(--text)"}}>Cùng 1 loại lỗi lặp lại ≥ 3 lần trong tuần</div>
            <div className="rule-correct" style={{color:"var(--text-muted)",fontSize:"12px"}}>Coaching nhóm hoặc reminder quy trình</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

function IntroScreen({ onEnter }) {
  const [entered, setEntered] = React.useState(false);

  function handleEnter() {
    setEntered(true);
    setTimeout(() => onEnter(), 400);
  }

  return (
    <div style={{
      width:"100vw", height:"100vh", background:"#EEF4FF",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", position:"fixed", inset:0,
      fontFamily:"inherit", overflow:"hidden", zIndex:999,
      opacity: entered ? 0 : 1, transition:"opacity 0.4s ease"
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:"linear-gradient(90deg,#0068FF 0%,#00B14F 50%,#0068FF 100%)",backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite"}} />

      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(0,104,255,0.06) 1px,transparent 1px)",backgroundSize:"28px 28px"}} />

      <div style={{position:"absolute",top:"8%",left:"5%",width:"300px",height:"300px",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,104,255,0.12) 0%,transparent 70%)",animation:"breathe 4s ease-in-out infinite"}} />
      <div style={{position:"absolute",bottom:"10%",right:"5%",width:"260px",height:"260px",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,180,84,0.1) 0%,transparent 70%)",animation:"breathe 4s ease-in-out 2s infinite"}} />
      <div style={{position:"absolute",top:"45%",right:"8%",width:"150px",height:"150px",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,104,255,0.08) 0%,transparent 70%)",animation:"breathe 3s ease-in-out 1s infinite"}} />

      {[200,300,420].map((s,i)=>(
        <div key={i} style={{
          position:"absolute",top:"50%",left:"50%",
          width:s+"px",height:s+"px",
          marginTop:-(s/2)+"px",marginLeft:-(s/2)+"px",
          borderRadius:"50%",
          border:`1px solid rgba(0,104,255,${0.12 - i*0.03})`,
          animation:`expandRing 3s ease-out ${i*1.1}s infinite`
        }}/>
      ))}

      <div style={{position:"absolute",top:"15%",left:"12%",width:"40px",height:"1px",background:"rgba(0,104,255,0.3)"}} />
      <div style={{position:"absolute",top:"15%",left:"calc(12% + 40px)",width:"1px",height:"30px",background:"rgba(0,104,255,0.3)"}} />
      <div style={{position:"absolute",bottom:"20%",right:"12%",width:"40px",height:"1px",background:"rgba(0,104,255,0.3)"}} />
      <div style={{position:"absolute",bottom:"20%",right:"12%",width:"1px",height:"30px",background:"rgba(0,104,255,0.3)"}} />

      {[
        {top:"25%",left:"10%",s:4,d:"0s"},
        {top:"60%",left:"7%",s:3,d:"1s"},
        {top:"35%",right:"9%",s:5,d:"0.5s"},
        {top:"70%",right:"12%",s:3,d:"1.5s"},
        {top:"15%",left:"40%",s:4,d:"0.8s"},
      ].map((p,i)=>(
        <div key={i} style={{
          position:"absolute",width:p.s+"px",height:p.s+"px",
          borderRadius:"50%",background:"#0068FF",opacity:.3,
          top:p.top,left:p.left,right:p.right,
          animation:`float 3s ease-in-out ${p.d} infinite`
        }}/>
      ))}

      <div style={{position:"absolute",top:"16px",left:"24px",zIndex:10}}>
        <span style={{fontSize:"20px",fontWeight:800,letterSpacing:"-0.5px"}}>
          <span style={{color:"#0033CC"}}>Zalo</span><span style={{color:"#00B14F"}}>pay</span>
        </span>
      </div>

      <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#fff",border:"1px solid #C0D4FF",borderRadius:"99px",padding:"5px 14px",fontSize:"12px",color:"#0052CC",fontWeight:500,marginBottom:"20px",position:"relative",zIndex:10,boxShadow:"0 2px 12px rgba(0,104,255,0.12)"}}>
        <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#00B14F",display:"inline-block",animation:"pulse 2s infinite"}}></span>
        AI Agent · Zalopay QC Platform
      </div>

      <div style={{position:"relative",zIndex:10,marginBottom:"16px"}}>
        <div style={{
          position:"absolute",inset:"-12px",borderRadius:"36px",
          background:"rgba(0,104,255,0.06)",
          animation:"outerGlow 2s ease-in-out infinite"
        }}/>
        <div style={{
          width:"100px",height:"100px",borderRadius:"24px",
          background:"linear-gradient(135deg,#EBF2FF 0%,#E8F8EF 100%)",
          border:"2px solid #C0D4FF",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"54px",animation:"waggle 2s ease-in-out infinite",
          boxShadow:"0 12px 40px rgba(0,104,255,0.18), 0 0 0 6px rgba(0,104,255,0.06)",
          position:"relative"
        }}>🐝</div>
        <div style={{
          position:"absolute",bottom:"-6px",right:"-6px",
          width:"26px",height:"26px",borderRadius:"50%",
          background:"#00B14F",border:"2px solid #EEF4FF",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"13px",color:"#fff",fontWeight:700,
          boxShadow:"0 2px 8px rgba(0,180,84,0.4)"
        }}>✓</div>
      </div>

      <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"0 24px",maxWidth:"500px",width:"100%"}}>
        <h1 style={{fontSize:"38px",fontWeight:800,color:"#0A1929",letterSpacing:"-0.5px",lineHeight:1.2,marginBottom:"10px"}}>
          Chăm như <span style={{color:"#0068FF",position:"relative"}}>Ong,</span><br/>
          ngọt như <span style={{color:"#00B14F"}}>Mật</span>
        </h1>
        <p style={{fontSize:"15px",color:"#4A6080",lineHeight:1.7,maxWidth:"380px",margin:"0 auto 22px"}}>
          Bee là AI Agent QC của Zalopay — phân tích ticket, gợi ý template chuẩn, chấm điểm tự động theo tiêu chuẩn P0→P4.
        </p>

        <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap",marginBottom:"26px"}}>
          {["⚡ Smart Reply","🔍 QC Review","📋 Templates","🎯 AI Coach"].map(t=>(
            <span key={t} style={{background:"#fff",color:"#0052CC",fontSize:"12px",fontWeight:500,padding:"5px 14px",borderRadius:"99px",border:"1px solid #C0D4FF",boxShadow:"0 2px 8px rgba(0,104,255,0.1)"}}>{t}</span>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"center",marginBottom:"24px"}}>
          <button onClick={handleEnter} style={{
            display:"inline-flex",alignItems:"center",gap:"10px",
            background:"#0068FF",color:"#fff",border:"none",
            borderRadius:"12px",padding:"14px 32px",fontSize:"15px",
            fontWeight:700,cursor:"pointer",fontFamily:"inherit",
            boxShadow:"0 4px 24px rgba(0,104,255,0.4), 0 1px 3px rgba(0,104,255,0.2)",
            transition:"all .2s", animation:"ctaPulse 2s ease-in-out infinite"
          }}
            onMouseEnter={e=>{e.currentTarget.style.background="#0052CC";e.currentTarget.style.transform="translateY(-2px) scale(1.02)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="#0068FF";e.currentTarget.style.transform="translateY(0) scale(1)"}}
          >
            <span style={{fontSize:"20px"}}>🐝</span>
            Vào tổ làm việc thôi
          </button>
        </div>

        <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
          {[["815+","mẫu phản hồi","#0068FF"],["P0→P4","chấm điểm QC","#0068FF"],["5","cấp tâm trạng","#00B14F"]].map(([n,l,c])=>(
            <div key={l} style={{textAlign:"center",background:"#fff",borderRadius:"12px",padding:"10px 18px",border:"1px solid #EBF2FF",boxShadow:"0 4px 12px rgba(0,104,255,0.08)"}}>
              <div style={{fontSize:"22px",fontWeight:800,color:c}}>{n}</div>
              <div style={{fontSize:"11px",color:"#8CA8C5",marginTop:"2px"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes waggle{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) translateY(-8px)}}
        @keyframes expandRing{0%{opacity:.6;transform:translate(-50%,-50%) scale(.85)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.2)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}
        @keyframes breathe{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes outerGlow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes ctaPulse{0%,100%{box-shadow:0 4px 24px rgba(0,104,255,0.4)}50%{box-shadow:0 4px 32px rgba(0,104,255,0.6)}}
        @keyframes shimmer{0%{background-position:0% 0%}100%{background-position:200% 0%}}
      `}</style>
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
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
    setChatHistory([]);
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

    const historyToSend = chatHistory.slice(-6);

    try {
      const res = await axios.post(`${BACKEND}/chat`, {
        message: userMsg,
        history: historyToSend
      });
      const aiText = res.data.answer;
      setMessages(prev => [...prev, { role: "ai", text: aiText, time: getTime() }]);
      setChatHistory(prev => [
        ...prev,
        { role: "user", content: userMsg },
        { role: "assistant", content: aiText }
      ]);
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

  function getSuggestions(userMsg, aiText) {
    if (!userMsg && !aiText) return [];
    const src = (userMsg + " " + aiText).toLowerCase();
    if (/ibft|liên ngân hàng|chuyển tiền atm/.test(src)) return ["Thời gian hoàn tiền IBFT là bao lâu?", "KH yêu cầu bằng chứng giao dịch?", "Cần thông tin gì để tra soát?"];
    if (/khóa|mở khóa|block/.test(src)) return ["Cần giấy tờ gì để mở khóa?", "Thời gian xử lý mở khóa?", "KH bị khóa do nghi ngờ gian lận?"];
    if (/hoàn tiền|chuyển nhầm|refund/.test(src)) return ["Quy trình hoàn tiền bao lâu?", "KH chuyển nhầm số tài khoản xử lý thế nào?", "Cần thông tin gì để tra soát?"];
    if (/otp|mã xác nhận/.test(src)) return ["KH không nhận được OTP lần 2?", "Thay đổi số điện thoại nhận OTP?", "OTP hết hạn xử lý thế nào?"];
    if (/vé|vietjet|bamboo|vietnam airlines|travelling/.test(src)) return ["Hủy vé trong 24h trước giờ bay?", "Hoàn tiền vé máy bay mất bao lâu?", "Đổi tên trên vé xử lý thế nào?"];
    if (/nạp|topup|điện thoại|telco/.test(src)) return ["Nạp thất bại hoàn tiền bao lâu?", "KH nạp sai số điện thoại?", "Nạp thành công nhưng chưa nhận?"];
    if (/số dư sinh lời|sdsl|infina/.test(src)) return ["Điều kiện mở Số dư sinh lời?", "Rút tiền từ SDSL mất phí không?", "Lỗi đăng ký SDSL xử lý thế nào?"];
    if (/nfc|sinh trắc|căn cước|cccd/.test(src)) return ["Thiết bị nào hỗ trợ NFC?", "Lỗi quét NFC xử lý thế nào?", "Sinh trắc học để làm gì?"];
    if (/trả sau|cimb|dư nợ/.test(src)) return ["Ngày đóng tiền trả sau là khi nào?", "Quá hạn trả sau có phí không?", "Tăng hạn mức trả sau thế nào?"];
    if (/angry|gay gắt|tức|lần 2|repeat/.test(src)) return ["Template cho KH Very Angry?", "KH đã liên hệ lần 3 xử lý thế nào?", "Cần xin lỗi thêm gì không?"];
    return ["Tình huống KH Angry cần xử lý thế nào?", "Có template nào phù hợp hơn không?", "Cần cá nhân hóa thêm gì?"];
  }

  const lastAiMsg = [...messages].reverse().find(m => m.role === "ai");
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  const suggestions = lastAiMsg ? getSuggestions(lastUserMsg?.text || "", lastAiMsg.text) : [];

  const quickSuggestions = [
    "💬 Khách hàng gay gắt về giao dịch IBFT?",
    "💸 Làm sao hoàn tiền khi chuyển nhầm?",
    "🔒 Tài khoản bị khóa xử lý thế nào?",
    "📱 Khách không nhận được mã OTP?",
  ];

  if (showIntro) return <IntroScreen onEnter={() => setShowIntro(false)} />;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="zp-zalo">Zalo</span><span className="zp-pay">pay</span>
          </div>
          <div className="header-divider" />

          <nav className="header-tabs">
            <button className={`header-tab ${tab === "chat" ? "header-tab--active" : ""}`} onClick={() => setTab("chat")}>Smart Reply</button>
            <button className={`header-tab ${tab === "review" ? "header-tab--active" : ""}`} onClick={() => setTab("review")}>QC Review</button>
            <button className={`header-tab ${tab === "template" ? "header-tab--active" : ""}`} onClick={() => setTab("template")}>Templates</button>
            <button className={`header-tab ${tab === "coach" ? "header-tab--active" : ""}`} onClick={() => setTab("coach")}>AI Coach</button>
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
              <div className="input-inner" style={{alignItems:"center"}}>
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
      {tab === "coach" && <CoachPanel />}
    </div>
  );
}
