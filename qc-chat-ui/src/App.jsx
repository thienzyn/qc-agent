import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

// ─── Knowledge Base (embedded từ Zalopay_QC_Knowledge_Base.xlsx) ─────────────
const WRITING_RULES = [
  { id: "S01", avoid: 'Dùng "vui lòng chờ" chung chung', correct: 'Cập nhật tiến độ cụ thể: "Zalopay sẽ phản hồi trong vòng X ngày làm việc"', note: "P1 nếu KH phàn nàn về việc chờ đợi" },
  { id: "S02", avoid: "Copy nguyên template, không cá nhân hóa", correct: "Điều chỉnh theo ngữ cảnh cụ thể của KH, cá nhân hóa ít nhất 1–2 câu", note: "P0 — lỗi thường gặp nhất của CS mới" },
  { id: "S03", avoid: "Đổ lỗi cho khách hàng", correct: 'Dùng cách diễn đạt trung lập: "Để hệ thống xử lý chính xác, bạn vui lòng..."', note: "P3 nếu gây ảnh hưởng cảm xúc KH" },
  { id: "S04", avoid: "Dùng từ phủ định mạnh: không, chưa, không thể", correct: 'Dùng từ khẳng định: "Zalopay sẽ hỗ trợ..." thay vì "Zalopay không thể"', note: "Tránh từ: không, chưa, không thể (trừ khi bắt buộc)" },
  { id: "S05", avoid: "Không có câu đồng cảm từ reply thứ 2 trở lên", correct: 'Mở đầu bằng: "Cảm ơn bạn đã kiên nhẫn chờ đợi" / "Zalopay ghi nhận bạn đã liên hệ lần 2..."', note: "Bắt buộc từ reply lần 2, P2 nếu vi phạm" },
];

const TONE_GUIDE = [
  { mood: "Normal", principle: "Lịch sự, ngắn gọn, đúng trọng tâm. Không cần xin lỗi dài dòng.", example: "Trả lời ngắn gọn, đúng trọng tâm." },
  { mood: "Angry", principle: "Đồng cảm nhiều hơn, mở đầu bằng câu xoa dịu, ưu tiên giải quyết nhanh.", example: 'Mở đầu: "Zalopay rất tiếc vì sự bất tiện này..."' },
  { mood: "Very Angry", principle: "Tránh ngôn ngữ máy móc. Cá nhân hóa cao, chủ động xin lỗi trước.", example: "Tránh dùng template cứng. Xin lỗi trước, giải thích sau." },
  { mood: "Repeat Contact", principle: "Thừa nhận KH đã liên hệ nhiều lần, không bắt giải thích lại từ đầu.", example: '"Zalopay ghi nhận bạn đã liên hệ lần 2 về vấn đề này..."' },
  { mood: "VIP", principle: "Ngôn ngữ trang trọng hơn, ưu tiên xử lý và báo kết quả sớm hơn SLA.", example: "Dùng ngôn ngữ trang trọng. Cam kết thời gian xử lý cụ thể." },
];

const QC_RULES = [
  { group: "Kỹ năng trao đổi", level: "P0", desc: "Giọng điệu/câu văn thiếu chuyên nghiệp, chưa ảnh hưởng KH", deducted: 0 },
  { group: "Kỹ năng trao đổi", level: "P1", desc: "Bố cục/font không đồng nhất, câu văn thiếu chuyên nghiệp có ảnh hưởng KH", deducted: 3 },
  { group: "Kỹ năng trao đổi", level: "P3", desc: "Câu chữ trịch thượng, ngôn từ không đúng mực, dùng từ ngữ gây kích động", deducted: 15 },
  { group: "Kỹ năng đồng cảm", level: "P2", desc: "Không thể hiện sự xin lỗi/xoa dịu với KH khiếu nại hoặc than phiền", deducted: 7 },
  { group: "Kỹ năng đồng cảm", level: "P3", desc: "Sử dụng câu từ bắt bẻ, thể hiện nghi ngờ khách hàng", deducted: 15 },
  { group: "Kỹ năng đồng cảm", level: "P4", desc: "Sử dụng từ ngữ mang tính tiêu cực gây kích động, thách thức KH", deducted: 30 },
  { group: "Cung cấp thông tin", level: "P1", desc: "Cung cấp sai/thiếu thông tin, không ảnh hưởng kết quả hỗ trợ", deducted: 3 },
  { group: "Cung cấp thông tin", level: "P3", desc: "Cung cấp sai/thiếu thông tin gây thiệt hại thời gian thao tác của KH", deducted: 15 },
  { group: "Cung cấp thông tin", level: "P4", desc: "Cung cấp sai thông tin gây thiệt hại tiền bạc, lợi ích của KH", deducted: 30 },
  { group: "Customer Experience", level: "P3", desc: "Case SV tệ do nhân viên hỗ trợ sai quy trình", deducted: 15 },
  { group: "Customer Experience", level: "P4", desc: "Case SV tệ do thái độ của nhân viên", deducted: 30 },
];

const TEMPLATES = [
  { id: 1, title: "Giao dịch không thành công — Hoàn tiền về ví Zalopay", folder: "In App chung", tags: ["hoàn tiền", "giao dịch", "thất bại"], content: `Chào bạn,

Zalopay chân thành xin lỗi vì những bất tiện bạn gặp phải trong quá trình sử dụng dịch vụ.

Qua kiểm tra, giao dịch [MÃ GD] bạn phản ánh không thành công và đã được Zalopay hoàn tiền về số dư tài khoản vào ngày [NGÀY]. Bạn vui lòng kiểm tra lại số dư và lịch sử giao dịch trên ứng dụng Zalopay.

Nếu cần hỗ trợ thêm, bạn vui lòng liên hệ Zalopay qua hotline 1900545436.

Cảm ơn bạn đã quan tâm và sử dụng dịch vụ của Zalopay.` },
  { id: 2, title: "Chuyển tiền ATM thành công — Bên nhận chưa nhận được", folder: "IBFT", tags: ["chuyển tiền", "ngân hàng", "chưa nhận"], content: `Chào bạn,

Cảm ơn bạn đã liên hệ đến trung tâm hỗ trợ Zalopay.

Qua kiểm tra, giao dịch chuyển tiền [MÃ GD] ngày [NGÀY] đã được xử lý thành công tại Zalopay và thông tin đã được chuyển đến ngân hàng thụ hưởng.

Do ngân hàng sẽ ưu tiên hỗ trợ chủ tài khoản, bạn vui lòng đề nghị người nhận liên hệ trực tiếp với ngân hàng để tra soát giao dịch. Trường hợp đã liên hệ ngân hàng nhưng vẫn chưa nhận được tiền, bạn vui lòng phản hồi lại để Zalopay hỗ trợ tiếp tục.

Mong bạn thông cảm vì sự bất tiện này. Chân thành cảm ơn bạn.` },
  { id: 3, title: "Hủy vé máy bay Vietjet — Trong khung 24h trước giờ bay", folder: "Travelling", tags: ["vé máy bay", "vietjet", "hủy vé", "24h"], content: `Chào bạn,

Cảm ơn bạn đã gửi phản hồi đến trung tâm hỗ trợ Zalopay.

Zalopay cần hoàn tất gửi thông tin bảo lưu đến hãng Vietjet trước 24 giờ so với giờ khởi hành chặng bay đầu tiên.

Qua kiểm tra, chuyến bay có mã đặt chỗ [PNR] đã vào khung 24 tiếng so với giờ bay trên vé. Do đó, Zalopay không thể hỗ trợ hủy/bảo lưu vé trong trường hợp này.

Bạn có thể liên hệ trực tiếp với hãng qua số tổng đài Vietjet 19001886 để được tư vấn thêm thông tin.

Mong bạn thông cảm vì sự bất tiện này. Trân trọng cảm ơn.` },
  { id: 4, title: "Số dư sinh lời — Hướng dẫn đăng ký", folder: "SDSL", tags: ["số dư sinh lời", "đăng ký", "infina"], content: `Chào bạn,

Cảm ơn bạn đã quan tâm và sử dụng dịch vụ của Zalopay.

Để mở Số dư sinh lời, tài khoản Zalopay của bạn cần được định danh bằng Căn cước công dân chip và đủ 18 tuổi. Sau khi định danh thành công, bạn thực hiện theo hướng dẫn:

- Bước 1: Chọn mục "Số dư sinh lời" và chọn "Tiếp tục"
- Bước 2: Tham khảo thông tin giới thiệu rồi chọn "Bắt đầu/Đăng ký tài khoản"
- Bước 3: Nhập thông tin giấy tờ theo yêu cầu của hệ thống
- Bước 4: Xác nhận hợp đồng và nạp tiền vào tài khoản

Trường hợp thao tác không thành công, bạn vui lòng chụp lại ảnh từng bước và chi tiết lỗi để Zalopay kiểm tra tiếp tục.

Hy vọng bạn hài lòng với thông tin Zalopay cung cấp. Trân trọng.` },
  { id: 5, title: "Tài khoản trả sau — Hướng dẫn thanh toán dư nợ", folder: "Tài khoản trả sau", tags: ["trả sau", "CIMB", "dư nợ", "thanh toán"], content: `Chào bạn,

Cảm ơn bạn đã sử dụng dịch vụ Tài khoản trả sau của Zalopay.

Để thanh toán dư nợ, bạn thực hiện theo các bước sau:
- Truy cập mục "Tài khoản trả sau"
- Chọn "Dư nợ", nhập số tiền cần thanh toán và chọn phương thức thanh toán

Sau khi thanh toán thành công, CIMB sẽ gạch nợ và trả lại hạn mức trong 5 phút. Bạn cần hoàn tất trước 20:00 ngày 4 hàng tháng để tránh phát sinh phí và lãi.

Zalopay xin chân thành cảm ơn.` },
  { id: 6, title: "Nạp điện thoại thất bại — Hoàn tiền", folder: "Telco", tags: ["nạp điện thoại", "thất bại", "hoàn tiền", "topup"], content: `Chào bạn,

Cảm ơn bạn đã quan tâm và sử dụng dịch vụ Zalopay.

Zalopay kiểm tra giao dịch nạp tiền điện thoại cho số [SĐT] không thành công và số tiền thanh toán đã được hoàn trên hệ thống Zalopay vào ngày [NGÀY].

Bạn vui lòng kiểm tra lại số dư tài khoản. Trường hợp thanh toán bằng thẻ Debit, thời gian hoàn tiền trong vòng 7 ngày làm việc (không tính thứ Bảy, Chủ Nhật và ngày Lễ).

Nếu vẫn có nhu cầu nạp, bạn vui lòng liên hệ nhà mạng để kiểm tra nguyên nhân trước khi thực hiện lại.

Trân trọng.` },
  { id: 7, title: "NFC / Sinh trắc học — Hướng dẫn xác thực", folder: "Xác thực NFC", tags: ["NFC", "sinh trắc học", "xác thực", "căn cước"], content: `Chào bạn,

Cảm ơn bạn đã liên hệ đến trung tâm hỗ trợ Zalopay.

Để thực hiện xác thực sinh trắc học NFC, bạn cần chuẩn bị:
- Ứng dụng Zalopay phiên bản 10.8 trở lên
- Định danh bằng Căn cước công dân gắn chip
- Thiết bị hỗ trợ NFC (iPhone 7 trở lên iOS 13, hoặc Android 8.0 trở lên)

Các bước thực hiện: Tài khoản → Thực hiện Sinh trắc học → Quét ngay → đặt mặt sau CCCD vào vị trí NFC của thiết bị, giữ cố định khoảng 30 giây.

Hy vọng bạn hài lòng với thông tin Zalopay cung cấp. Chân thành cảm ơn bạn.` },
  { id: 8, title: "Khách hàng phủ nhận giao dịch tự động", folder: "Billing", tags: ["tự động", "auto debit", "phủ nhận", "hóa đơn"], content: `Chào bạn,

Zalopay rất tiếc vì những điều không hài lòng bạn gặp phải trong quá trình sử dụng dịch vụ.

Qua kiểm tra, giao dịch bạn đang phản ánh là giao dịch thanh toán tự động. Bạn đã đăng ký thanh toán tự động vào ngày [NGÀY], vì vậy khi hóa đơn phát sinh nợ, Zalopay đã tự động thanh toán từ nguồn tiền bạn đã bật cho phép.

Nếu không có nhu cầu tiếp tục, bạn vui lòng hủy đăng ký tại: Ứng dụng Zalopay → chọn dịch vụ → Hủy thanh toán tự động.

Mong bạn thông cảm vì sự bất tiện này. Chân thành cảm ơn bạn.` },
];

const QUICK_PROMPTS = [
  { label: "Giao dịch không nhận được tiền", text: "Khách báo giao dịch chuyển tiền thành công nhưng bên nhận chưa nhận được tiền, đã chờ 2 ngày" },
  { label: "Khách Very Angry — trừ tiền 2 lần", text: "Khách hàng rất tức giận vì bị trừ tiền 2 lần cho cùng 1 giao dịch nạp điện thoại, đây là lần liên hệ thứ 2" },
  { label: "Hủy vé Vietjet gấp", text: "Khách muốn hủy vé máy bay Vietjet, hiện còn 20 tiếng trước giờ bay, chưa biết có kịp không" },
  { label: "Lỗi đăng ký Số dư sinh lời", text: "Khách hỏi tại sao bấm vào Số dư sinh lời thì bị báo lỗi không đủ điều kiện, tài khoản đã định danh CCCD" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildSystemPrompt() {
  const rules = WRITING_RULES.map(r => `[${r.id}] ❌ ${r.avoid}\n       ✅ ${r.correct}`).join("\n");
  const tones = TONE_GUIDE.map(t => `${t.mood}: ${t.principle} → Ví dụ: "${t.example}"`).join("\n");
  const tmpls = TEMPLATES.map(t => `### [${t.folder}] ${t.title}\n${t.content}`).join("\n\n---\n\n");

  return `Bạn là Bee 🐝 — QC AI Assistant của ZaloPay, hỗ trợ đội CS soạn phản hồi ticket khách hàng chuyên nghiệp.

NHIỆM VỤ:
1. Khi được mô tả tình huống ticket → xác định tâm trạng KH, chọn template phù hợp, cá nhân hóa và gợi ý phản hồi hoàn chỉnh.
2. Khi câu hỏi mơ hồ → hỏi lại đúng 1 câu cụ thể trước khi trả lời.
3. Luôn kết thúc bằng "💡 Lưu ý QC:" ngắn gọn (tối đa 2 dòng) cho CS.

WRITING RULES — BẮT BUỘC TUÂN THỦ:
${rules}

TONE THEO TÂM TRẠNG KHÁCH HÀNG:
${tones}

QUY TRÌNH XỬ LÝ TEMPLATE:
Bước 1 — Xác định loại ticket và tâm trạng KH
Bước 2 — Chọn template phù hợp nhất, giữ nguyên cấu trúc
Bước 3 — Điền thông tin thực tế vào [placeholder]. Nếu chưa có → ghi [cần điền: ...]
Bước 4 — Cá nhân hóa 1–2 câu cho mượt, tự nhiên hơn (không thay đổi nội dung nghiệp vụ)
Bước 5 — Áp dụng tone phù hợp với tâm trạng KH

PHONG CÁCH:
- Xưng "Zalopay" (không xưng "tôi" hay "mình")
- Viết đúng thương hiệu: "Zalopay" — không viết "ZaloPay", "Zalo Pay", "ZALOPAY"
- Văn phong chuyên nghiệp, lịch sự — không phải văn nói, không emoji trong template
- Template gửi KH: thuần text, KHÔNG dùng **in đậm**, KHÔNG bullet
- Placeholder chưa điền được: [cần điền: tên trường]

KHO TEMPLATE:
${tmpls}

Trả lời bằng tiếng Việt.`;
}

function buildReviewPrompt() {
  const rules = QC_RULES.map(r => `[${r.level}] ${r.group}: ${r.desc} — trừ ${r.deducted} điểm`).join("\n");
  const writing = WRITING_RULES.map(r => `[${r.id}] Tránh: ${r.avoid} | Đúng: ${r.correct}`).join("\n");
  const tones = TONE_GUIDE.map(t => `${t.mood}: ${t.principle}`).join("\n");

  return `Bạn là QC Reviewer ZaloPay. Chấm điểm phản hồi CS theo tiêu chí bên dưới.

THANG ĐIỂM: Bắt đầu 100. P0=0đ, P1=trừ 3đ, P2=trừ 7đ, P3=trừ 15đ, P4=trừ 30đ.

TIÊU CHÍ QC:
${rules}

WRITING RULES:
${writing}

TONE GUIDE:
${tones}

Chỉ trả về JSON, không có text thừa:
{"score":100,"violations":[{"category":"Tên nhóm","type":"Loại vi phạm cụ thể","p_level":"P0","desc":"Mô tả chi tiết","deducted":0}],"suggestions":["Gợi ý cải thiện 1","Gợi ý 2"]}`;
}

function pBadgeClass(level) {
  if (level === "P0") return "badge-p0";
  if (level === "P1") return "badge-p1";
  if (level === "P2") return "badge-p2";
  if (level === "P3" || level === "P4") return "badge-p3";
  return "badge-p0";
}

function scoreClass(score) {
  if (score >= 85) return "score-good";
  if (score >= 70) return "score-warn";
  return "score-bad";
}

function now() {
  return new Date().toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ApiKeyModal({ onSave, onClose }) {
  const [val, setVal] = useState("");
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-title">Kết nối Anthropic API</div>
        <p className="modal-desc">
          Bee cần API key để gọi Claude thực. Key chỉ lưu trong bộ nhớ phiên này,
          không được gửi đến bất kỳ server nào khác.
        </p>
        <input
          type="password"
          className="modal-input"
          placeholder="sk-ant-api03-..."
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && val && onSave(val)}
          autoFocus
        />
        <div className="modal-btns">
          <button className="btn-ghost" onClick={onClose}>Bỏ qua</button>
          <button className="btn-primary" onClick={() => val && onSave(val)} disabled={!val}>
            Lưu &amp; kết nối
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`msg ${isUser ? "msg-user" : "msg-bee"}`}>
      <div className={`avatar ${isUser ? "avatar-user" : "avatar-bee"}`}>
        {isUser ? "U" : "B"}
      </div>
      <div className="msg-body">
        <div
          className={`bubble ${isUser ? "bubble-user" : "bubble-bee"} ${msg.typing ? "bubble-typing" : ""}`}
          dangerouslySetInnerHTML={{ __html: msg.html || msg.text.replace(/\n/g, "<br/>") }}
        />
        <div className="msg-meta">{isUser ? "Bạn" : "Bee"} · {msg.time}</div>
      </div>
    </div>
  );
}

function TemplateCard({ tpl, onAsk }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(tpl.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`tpl-card ${open ? "tpl-card-open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="tpl-header">
        <div className="tpl-header-left">
          <div className="tpl-title">{tpl.title}</div>
          <div className="tpl-folder">
            <span className="folder-icon">📁</span> {tpl.folder}
          </div>
        </div>
        <span className={`tpl-chevron ${open ? "tpl-chevron-open" : ""}`}>›</span>
      </div>
      {open && (
        <div className="tpl-body" onClick={e => e.stopPropagation()}>
          <pre className="tpl-content">{tpl.content}</pre>
          <div className="tpl-actions">
            <button className="btn-ghost-sm" onClick={copy}>
              {copied ? "✓ Đã sao chép" : "Sao chép"}
            </button>
            <button className="btn-blue-sm" onClick={() => onAsk(tpl)}>
              Hỏi Bee điều chỉnh ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function ChatPanel({ apiKey, onNeedKey }) {
  const [messages, setMessages] = useState([
    {
      id: 0, role: "bee", time: now(),
      text: "",
      html: `Xin chào! Tôi là <strong>Bee</strong> 🐝 — QC AI Assistant của ZaloPay.<br/><br/>
Tôi có thể giúp bạn:<br/>
• Soạn &amp; chuẩn hóa phản hồi ticket theo chuẩn ZaloPay<br/>
• Gợi ý template phù hợp và áp dụng đúng tone KH<br/>
• Kiểm tra Writing Rules trước khi gửi<br/><br/>
Mô tả tình huống ticket cho tôi nhé!`,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    const userMsg = { id: Date.now(), role: "user", time: now(), text: msg };
    const typingMsg = { id: Date.now() + 1, role: "bee", time: now(), text: "Bee đang soạn phản hồi...", typing: true };
    setMessages(prev => [...prev, userMsg, typingMsg]);

    try {
      let replyHtml = "";
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 1200));
        replyHtml = generateMockReply(msg);
      } else {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1200,
            system: buildSystemPrompt(),
            messages: [{ role: "user", content: msg }],
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        replyHtml = data.content[0].text
          .replace(/\n/g, "<br/>")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      }

      setMessages(prev => prev.map(m =>
        m.id === typingMsg.id
          ? { ...m, html: replyHtml, text: "", typing: false }
          : m
      ));
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === typingMsg.id
          ? { ...m, text: "Lỗi kết nối AI: " + e.message, typing: false }
          : m
      ));
    }
    setLoading(false);
  }

  function generateMockReply(msg) {
    const lower = msg.toLowerCase();
    let tpl = TEMPLATES[0];
    if (lower.includes("vé") && (lower.includes("vietjet") || lower.includes("máy bay"))) tpl = TEMPLATES[2];
    else if (lower.includes("chuyển tiền") || lower.includes("nhận được tiền")) tpl = TEMPLATES[1];
    else if (lower.includes("số dư sinh lời") || lower.includes("sdsl")) tpl = TEMPLATES[3];
    else if (lower.includes("nạp điện thoại") || lower.includes("topup")) tpl = TEMPLATES[5];
    else if (lower.includes("nfc") || lower.includes("sinh trắc")) tpl = TEMPLATES[6];
    else if (lower.includes("tự động") || lower.includes("auto")) tpl = TEMPLATES[7];

    const isAngry = lower.includes("tức") || lower.includes("giận") || lower.includes("angry") || lower.includes("lần 2");
    const toneNote = isAngry
      ? '<span style="color:#993C1D;font-size:12px">Tone: <strong>Angry</strong> → Mở đầu bằng câu đồng cảm mạnh hơn bình thường</span>'
      : '<span style="color:#3B6D11;font-size:12px">Tone: <strong>Normal</strong> → Lịch sự, ngắn gọn, đúng trọng tâm</span>';

    return `${toneNote}<br/><br/><strong>Template gợi ý — ${tpl.folder}:</strong><br/><br/>` +
      tpl.content.replace(/\n/g, "<br/>") +
      `<br/><br/><strong>💡 Lưu ý QC:</strong> Thay thế các [placeholder] bằng thông tin thực tế của ticket. Cá nhân hóa ít nhất 1–2 câu theo tình huống cụ thể (Writing Rule S02).<br/><span style="font-size:11px;color:#888">Nhập API key để nhận phản hồi AI thực từ Claude Sonnet</span>`;
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="panel-inner">
      <div className="chat-msgs" ref={msgsRef}>
        {messages.map(m => <ChatMessage key={m.id} msg={m} />)}
      </div>

      <div className="chat-input-area">
        <div className="quick-chips">
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} className="chip" onClick={() => send(q.text)}>{q.label}</button>
          ))}
        </div>
        <div className="input-row">
          <textarea
            ref={inputRef}
            className="chat-textarea"
            placeholder="Mô tả tình huống ticket… (Enter gửi, Shift+Enter xuống dòng)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? "…" : "↑"}
          </button>
        </div>
        {!apiKey && (
          <div className="api-notice">
            ⚡ Đang chạy demo mode ·{" "}
            <span className="link" onClick={onNeedKey}>Nhập API key để bật AI thực</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewPanel({ apiKey, onNeedKey }) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("Normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runReview() {
    if (!content.trim()) return;
    setLoading(true); setResult(null); setError("");
    try {
      let data;
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 1500));
        data = mockReview(content, mood);
      } else {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            system: buildReviewPrompt(),
            messages: [{ role: "user", content: `Tâm trạng KH: ${mood}\n\nNội dung phản hồi cần review:\n${content}\n\nChỉ trả về JSON.` }],
          }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        const raw = json.content[0].text.replace(/```json?|```/g, "").trim();
        data = JSON.parse(raw);
      }
      setResult(data);
    } catch (e) {
      setError("Lỗi: " + e.message);
    }
    setLoading(false);
  }

  function mockReview(text, selectedMood) {
    const violations = [];
    let score = 100;
    if (text.includes("vui lòng chờ") && !text.includes("ngày làm việc")) {
      violations.push({ category: "Writing Rules", type: "S01 — Thiếu mốc thời gian cụ thể", p_level: "P1", desc: 'Dùng "vui lòng chờ" mà không nêu thời hạn cụ thể cho KH.', deducted: 3 });
      score -= 3;
    }
    if (text.includes("bạn phải") || text.includes("bắt buộc")) {
      violations.push({ category: "Kỹ năng trao đổi", type: "P2 — Ngôn từ ép buộc", p_level: "P2", desc: 'Dùng từ mang tính ép buộc ("phải", "bắt buộc") gây cảm giác không tôn trọng KH.', deducted: 7 });
      score -= 7;
    }
    if ((selectedMood === "Angry" || selectedMood === "Very Angry") && !text.toLowerCase().includes("xin lỗi") && !text.toLowerCase().includes("rất tiếc")) {
      violations.push({ category: "Kỹ năng đồng cảm", type: "P2 — Thiếu câu đồng cảm với KH Angry", p_level: "P2", desc: `Tâm trạng KH là ${selectedMood} nhưng phản hồi thiếu câu xin lỗi hoặc xoa dịu ở đầu.`, deducted: 7 });
      score -= 7;
    }
    if (!text.includes("Chào bạn")) {
      violations.push({ category: "Kỹ năng trao đổi", type: "P0 — Thiếu lời chào đầu", p_level: "P0", desc: 'Không có câu chào đầu theo chuẩn "Chào bạn,".', deducted: 0 });
    }
    const suggestions = [
      "Kiểm tra lại các [placeholder] có được điền đầy đủ chưa trước khi gửi KH.",
      "Đảm bảo cuối phản hồi có hướng dẫn liên hệ tiếp theo (hotline hoặc kênh hỗ trợ).",
      violations.length === 0 ? "Phản hồi đạt chuẩn — cân nhắc cá nhân hóa thêm 1 câu theo đặc thù ticket." : "Cá nhân hóa ít nhất 1–2 câu theo tình huống cụ thể của KH (Writing Rule S02).",
    ];
    return { score: Math.max(score, 0), violations, suggestions };
  }

  return (
    <div className="panel-inner review-panel">
      <div className="review-section">
        <div className="section-label">Nội dung phản hồi cần chấm điểm</div>
        <textarea
          className="review-textarea"
          rows={7}
          placeholder="Dán nội dung phản hồi ticket vào đây để AI chấm điểm theo tiêu chuẩn QC ZaloPay (thang P0→P4)..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      <div className="review-section">
        <div className="section-label">Tâm trạng khách hàng</div>
        <div className="mood-row">
          {TONE_GUIDE.map(t => (
            <button
              key={t.mood}
              className={`mood-btn ${mood === t.mood ? "mood-active" : ""}`}
              onClick={() => setMood(t.mood)}
            >
              {t.mood}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary review-submit"
        onClick={runReview}
        disabled={loading || !content.trim()}
      >
        {loading ? "Đang chấm điểm..." : "Chấm điểm QC"}
      </button>

      {!apiKey && (
        <div className="api-notice">
          ⚡ Demo mode — kết quả mô phỏng ·{" "}
          <span className="link" onClick={onNeedKey}>Nhập API key để bật AI thực</span>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className="review-result">
          <div className="score-card">
            <div className={`score-ring ${scoreClass(result.score)}`}>{Math.round(result.score)}</div>
            <div className="score-info">
              <div className="score-label">
                {result.score >= 85 ? "Đạt chuẩn" : result.score >= 70 ? "Cần cải thiện" : "Chưa đạt"}
              </div>
              <div className="score-sub">
                Trừ {100 - Math.round(result.score)} điểm · {result.violations?.length || 0} vi phạm · KH: {mood}
              </div>
            </div>
          </div>

          {result.violations?.length > 0 && (
            <div className="result-section">
              <div className="section-label">Vi phạm phát hiện</div>
              <div className="violations-list">
                {result.violations.map((v, i) => (
                  <div key={i} className="violation-item">
                    <span className={`p-badge ${pBadgeClass(v.p_level)}`}>{v.p_level}</span>
                    <div>
                      <div className="violation-type">{v.type || v.violation_type}</div>
                      <div className="violation-desc">{v.desc || v.description}</div>
                      {(v.deducted || v.points_deducted) > 0 && (
                        <div className="violation-deducted">Trừ {v.deducted || v.points_deducted} điểm</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.violations?.length === 0 && (
            <div className="no-violations">Không phát hiện vi phạm — phản hồi đạt chuẩn QC</div>
          )}

          {result.suggestions?.length > 0 && (
            <div className="result-section">
              <div className="section-label">Gợi ý cải thiện</div>
              <div className="suggestions-box">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item">
                    <span className="suggestion-icon">💡</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplatePanel({ onAskBee }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [results, setResults] = useState(TEMPLATES);

  const cats = ["all", ...new Set(TEMPLATES.map(t => t.folder))];

  useEffect(() => {
    const q = query.toLowerCase();
    setResults(TEMPLATES.filter(t => {
      const matchCat = cat === "all" || t.folder === cat;
      const matchQ = !q || t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || t.tags.some(g => g.includes(q));
      return matchCat && matchQ;
    }));
  }, [query, cat]);

  return (
    <div className="panel-inner tpl-panel">
      <div className="tpl-search-row">
        <input
          className="tpl-search"
          placeholder="Tìm template… (VD: hoàn tiền, vé máy bay, NFC)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="cat-filters">
        {cats.map(c => (
          <button
            key={c}
            className={`cat-btn ${cat === c ? "cat-active" : ""}`}
            onClick={() => setCat(c)}
          >
            {c === "all" ? "Tất cả" : c}
          </button>
        ))}
      </div>

      <div className="tpl-count">{results.length} template · 815+ mẫu trong Knowledge Base</div>

      <div className="tpl-list">
        {results.length > 0
          ? results.map(t => <TemplateCard key={t.id} tpl={t} onAsk={onAskBee} />)
          : <div className="empty-state">Không tìm thấy template phù hợp với "{query}"</div>
        }
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("chat");
  const [apiKey, setApiKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const chatSendRef = useRef(null);

  function handleAskBee(tpl) {
    setTab("chat");
    setTimeout(() => {
      if (chatSendRef.current) {
        chatSendRef.current(`Hãy giúp tôi điều chỉnh template "${tpl.title}" cho phù hợp với tình huống KH Angry và điền các thông tin mẫu vào placeholder`);
      }
    }, 100);
  }

  return (
    <div className="app">
      {showModal && (
        <ApiKeyModal
          onSave={key => { setApiKey(key); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Topbar */}
      <div className="topbar">
        <div className="logo-area">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#006AF5" />
              <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="sans-serif">B</text>
            </svg>
          </div>
          <div>
            <div className="logo-name">Bee — ZaloPay QC Assistant</div>
            <div className="logo-sub">Powered by Anthropic Claude · AgentBase VNG</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="tabs">
            {[
              { id: "chat", label: "Smart Reply" },
              { id: "review", label: "QC Review" },
              { id: "template", label: "Templates" },
            ].map(t => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? "tab-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={() => setShowModal(true)} title="API Key settings">
            ⚙
          </button>
          <div className="status-pill">
            <span className={`status-dot ${apiKey ? "dot-live" : "dot-demo"}`} />
            {apiKey ? "AI Live" : "Demo"}
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="panels">
        {tab === "chat" && (
          <ChatPanel
            apiKey={apiKey}
            onNeedKey={() => setShowModal(true)}
            sendRef={chatSendRef}
          />
        )}
        {tab === "review" && (
          <ReviewPanel
            apiKey={apiKey}
            onNeedKey={() => setShowModal(true)}
          />
        )}
        {tab === "template" && (
          <TemplatePanel onAskBee={handleAskBee} />
        )}
      </div>
    </div>
  );
}
