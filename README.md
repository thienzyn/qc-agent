# 🐝 QC Agent — Trợ Lý QC Thông Minh cho Zalopay

> **GreenNode Claw-a-thon 2026** · Team: thienzyn

---

## 📌 Giới Thiệu

**QC Agent** là hệ thống AI hỗ trợ nhân viên QC (Quality Control) của Zalopay trong việc chấm điểm case, gợi ý phản hồi chuẩn và huấn luyện kỹ năng viết.

Theo xu hướng hiện nay, việc hỗ trợ khách hàng qua tổng đài và call center đã dần nhường chỗ cho các kênh văn bản — chat trong app, email, tin nhắn. Điều này khiến **chất lượng soạn thảo phản hồi trở thành yếu tố sống còn**: một câu trả lời sai, thiếu chuẩn mực hoặc không đúng tình huống có thể gây rủi ro cho cả doanh nghiệp lẫn trải nghiệm khách hàng.

**QC Agent (Bee 🐝)** giúp mỗi nhân viên — kể cả người mới — soạn phản hồi chuẩn xác, đúng quy trình và phù hợp từng khách hàng cụ thể, thay vì mất 5–10 phút tra cứu template thủ công.

---

## 🎯 Vấn Đề Được Giải Quyết

Khi CSKH chuyển dịch sang kênh văn bản, nhân viên phải đối mặt với:

- **Rủi ro soạn sai:** Một câu trả lời không đúng chuẩn có thể gây hiểu nhầm, khiếu nại, hoặc ảnh hưởng uy tín thương hiệu
- **Khó onboard người mới:** Nhân viên mới cần thời gian dài để thuộc 815+ template, hàng chục quy tắc viết và quy trình xử lý từng loại case
- **Tra cứu thủ công mất thời gian:** Tìm template đúng trong file Excel, điều chỉnh cho phù hợp tình huống mất 5–10 phút mỗi case
- **Thiếu nhất quán:** Mỗi người viết một kiểu, khó đảm bảo chất lượng đồng đều giữa các agent

---

## 👤 Người Dùng Mục Tiêu

- **QC Agent / QC Lead** tại Zalopay Customer Service
- **Nhân viên CS mới** cần học nhanh quy trình, template và chuẩn viết
- **Nhân viên CS kỳ cựu** cần tra cứu và soạn phản hồi nhanh hơn trong lúc chat với khách

---

## 🤖 Cách Agent Hoạt Động

### Smart Reply (Bee AI)
- **Input:** Nhân viên nhập tình huống khách hàng bằng ngôn ngữ tự nhiên
- **Xử lý:** Bee AI (Gemma-4-31b) phân tích tình huống, tra cứu knowledge base gồm 815+ template và bộ quy tắc viết chuẩn Zalopay, cá nhân hóa phản hồi cho từng tình huống cụ thể
- **Output:** 2 phương án phản hồi hoàn chỉnh (Tư vấn / Hỗ trợ) + lưu ý QC + nhắc nhở chuẩn viết — sẵn sàng copy ngay

### Kho Template
- Tìm kiếm toàn văn trong 815+ mẫu phản hồi chuẩn
- Lọc theo nhóm/folder
- Copy 1 click hoặc gửi cho Bee điều chỉnh theo tình huống cụ thể

### AI Coach
- Nhập danh sách lỗi QC của nhân viên
- Agent tạo coaching plan 2 tuần chi tiết: phân tích nguyên nhân gốc rễ, lộ trình cải thiện từng ngày, câu mẫu đúng/sai, KPI đánh giá

---

## 🏗️ Kiến Trúc Hệ Thống

```
qc-chat-ui (React/Vite)  ←→  qc-agent (Python FastAPI)
                                      ↓
                         VNG MaaS API (Gemma-4-31b-it)
                                      ↓
                         Knowledge Base (Excel: 815 templates + writing rules)
```

### Tech Stack
- **Frontend:** React + Vite, deploy trên GreenNode AgentBase
- **Backend:** Python FastAPI, deploy trên GreenNode AgentBase
- **Model:** `google/gemma-4-31b-it` qua VNG MaaS
- **Knowledge Base:** Excel file chứa templates, writing rules, QC criteria

---

## 📁 Cấu Trúc Project

```
├── src/                    # Python FastAPI backend
│   ├── main.py             # API endpoints
│   ├── chat_engine.py      # Smart Reply AI engine
│   ├── coach_engine.py     # AI Coaching engine
│   ├── review_engine.py    # QC Review engine
│   ├── template_engine.py  # Template search engine
│   └── improve_engine.py   # Improve suggestion engine
├── qc-chat-ui/             # React frontend
│   └── src/
│       ├── App.jsx         # Main app component
│       └── App.css         # Styles
├── Data/                   # Knowledge base (Excel)
├── Dockerfile              # Docker config
└── requirements.txt        # Python dependencies
```

---

## 🚀 Chạy Local

### Prerequisites
- Docker
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd qc-agent
pip install -r requirements.txt
cp env .env  # cấu hình API key
uvicorn src.main:app --reload
```

### Frontend
```bash
cd qc-chat-ui
npm install
npm run dev
```

### Docker
```bash
docker build -t qc-agent .
docker run -p 8000:8000 --env-file .env qc-agent
```

---

## ⚙️ Environment Variables

```env
LLM_API_KEY=your_vng_maas_api_key
LLM_BASE_URL=https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1
LLM_MODEL=google/gemma-4-31b-it
BACKEND_URL=your_backend_endpoint
```

---

## 💡 Giá Trị Mang Lại

| Trước | Sau |
|-------|-----|
| 5–10 phút tra template thủ công | < 30 giây có phản hồi hoàn chỉnh |
| Rủi ro soạn sai, thiếu chuẩn mực | AI áp dụng 100% quy tắc chuẩn Zalopay |
| Người mới mất nhiều tuần để thuộc quy trình | Bee hướng dẫn từng bước ngay lập tức |
| Coaching tốn nhiều thời gian soạn | Coaching plan 2 tuần tạo tự động |
| Khó tìm template đúng tình huống | Tìm kiếm full-text 815+ mẫu |
| Chất lượng phản hồi không đồng đều | Chuẩn hóa toàn bộ team |

---

## 👥 Team

- **thienzyn** — Developer & QC Domain Expert

---

*Được xây dựng cho GreenNode Claw-a-thon 2026 · Powered by VNG MaaS + GreenNode AgentBase*
