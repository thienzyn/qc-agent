# QC Agent

Automated Quality Control API for Vietnamese customer service (ZaloPay CS team).  
Powered by **FastAPI** + **Claude (Haiku)** with rules loaded from Excel.

---

## How it works

1. On startup the app loads three Excel files from `Data/`:
   - `QC_Rules.xlsx` — scoring rules with P-level severity (P0–P4)
   - `CS_Writing_Knowledge_Base.xlsx` — writing style & tone guidelines
   - `Template_Master.xlsx` — canned response library (reference)
2. A `POST /review` request sends the CS chat text to Claude with all rules embedded in the system prompt.
3. Claude returns structured violations and a deduction-based score (starts at 100).

### Scoring

| P-Level | Severity | Points deducted |
|---------|----------|-----------------|
| P0      | Remind   | 0               |
| P1      | Light    | 3               |
| P2      | Medium   | 7               |
| P3      | Severe   | 15              |
| P4      | Critical | 30              |

---

## Prerequisites

- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com/)

---

## Local setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your API key
set ANTHROPIC_API_KEY=sk-ant-...        # Windows
export ANTHROPIC_API_KEY=sk-ant-...     # Linux/macOS

# 3. Start the server (from project root)
uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## Docker

```bash
docker build -t qc-agent .
docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 8000:8000 qc-agent
```

---

## API Reference

### GET /health

```http
GET /health
```

**Response**
```json
{ "status": "ok" }
```

---

### POST /review

```http
POST /review
Content-Type: application/json
```

**Request body**
```json
{
  "chat_content": "Chào bạn, tôi cần hỏi về giao dịch của bạn..."
}
```

**Response**
```json
{
  "score": 85,
  "violations": [
    {
      "category": "Kỹ năng trao đổi",
      "violation_type": "Giọng điệu/câu văn thiếu chuyên nghiệp",
      "p_level": "P1",
      "description": "Response uses informal wording without proper closing.",
      "points_deducted": 3
    }
  ],
  "suggestions": [
    "Add a professional closing phrase such as 'Cảm ơn bạn đã liên hệ ZaloPay.'",
    "Address the customer by name when it is available."
  ]
}
```

---

## Project structure

```
qc-agent/
├── Data/
│   ├── QC_Rules.xlsx
│   ├── CS_Writing_Knowledge_Base.xlsx
│   └── Template_Master.xlsx
├── src/
│   ├── __init__.py
│   ├── main.py           # FastAPI app & endpoints
│   ├── excel_loader.py   # Excel parsing & data models
│   └── review_engine.py  # Claude-powered QC review
├── Dockerfile
├── requirements.txt
└── README.md
```
