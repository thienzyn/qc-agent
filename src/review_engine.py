import json
import os
from dataclasses import dataclass

from openai import OpenAI

from .excel_loader import ExcelData

MAX_TOKENS = 1500


@dataclass
class ReviewResult:
    score: float
    violations: list[dict]
    suggestions: list[str]


class ReviewEngine:

    def __init__(self, data: ExcelData):

        self.data = data

        api_key = os.getenv("LLM_API_KEY")
        model = os.getenv("LLM_MODEL")
        base_url = os.getenv(
            "LLM_BASE_URL",
            "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1"
        )

        if not api_key:
            raise EnvironmentError("LLM_API_KEY environment variable is not set.")

        if not model:
            raise EnvironmentError("LLM_MODEL environment variable is not set.")

        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self._system_prompt = self._build_system_prompt()

    # ── Prompt ───────────────────────────────────────────────────────────────

    def _build_system_prompt(self):

        rules_block = self._format_qc_rules()

        writing_block = "\n".join(
            f"- [{row.get('Mã', '')}] {row.get('❌ Điều Cần Tránh', '')}"
            for row in self.data.writing_rules
            if str(row.get('Mã', '')).strip() not in ("", "nan")
        )

        tone_block = "\n".join(
            f"- {row.get('Tâm Trạng Khách Hàng', '')}: {row.get('Nguyên Tắc Xử Lý', '')}"
            for row in self.data.tone_guide
            if str(row.get('Tâm Trạng Khách Hàng', '')).strip() not in ("", "nan")
        )

        return f"""
Bạn là QC Reviewer của Zalopay — chuyên đánh giá chất lượng phản hồi chăm sóc khách hàng.

THANG ĐIỂM:
- Bắt đầu từ 100 điểm.
- P0 = nhắc nhở (trừ 0 điểm)
- P1 = nhẹ (trừ 3 điểm)
- P2 = trung bình (trừ 7 điểm)
- P3 = nặng (trừ 15 điểm)
- P4 = rất nặng (trừ 30 điểm)

TIÊU CHÍ QC:
{rules_block}

QUY TẮC VIẾT — ĐIỀU CẦN TRÁNH:
{writing_block}

TONE GIỌNG THEO TÂM TRẠNG KHÁCH HÀNG:
{tone_block}

HƯỚNG DẪN:
1. Đọc kỹ đoạn chat được cung cấp.
2. Phát hiện tất cả vi phạm dựa trên tiêu chí QC.
3. Trừ điểm tương ứng.
4. Chỉ trả về JSON, không có text thừa.

FORMAT JSON:
{{
    "score": 100,
    "violations": [
        {{
            "category": "Tên nhóm tiêu chí",
            "violation_type": "Loại vi phạm",
            "p_level": "P0/P1/P2/P3/P4",
            "description": "Mô tả vi phạm cụ thể",
            "points_deducted": 0
        }}
    ],
    "suggestions": [
        "Gợi ý cải thiện 1",
        "Gợi ý cải thiện 2"
    ]
}}
""".strip()

    def _format_qc_rules(self):

        lines = []
        current_category = ""

        for rule in self.data.qc_rules:
            category   = str(rule.get("Nhóm Tiêu Chí", "")).strip()
            bieu_hien  = str(rule.get("Biểu Hiện Lỗi", "")).strip()
            p_level    = str(rule.get("P-Level", "")).strip()

            if not bieu_hien or bieu_hien == "nan":
                continue

            if category and category != "nan" and category != current_category:
                current_category = category
                lines.append(f"\n### {category}")

            lines.append(f"  [{p_level}] {bieu_hien}")

        return "\n".join(lines)

    # ── Review ────────────────────────────────────────────────────────────────

    def review(self, chat_content: str, mood: str = "Normal"):

        user_content = f"Tâm trạng khách hàng: {mood}\n\n{chat_content}" if mood and mood != "Normal" else chat_content

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=MAX_TOKENS,
            messages=[
                {"role": "system", "content": self._system_prompt},
                {"role": "user",   "content": user_content}
            ]
        )

        raw = response.choices[0].message.content.strip()
        raw = self._strip_code_fence(raw)

        try:
            data = json.loads(raw)
        except Exception as exc:
            raise ValueError(f"Model returned invalid JSON:\n{raw}") from exc

        return ReviewResult(
            score=data.get("score", 100),
            violations=data.get("violations", []),
            suggestions=data.get("suggestions", [])
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _strip_code_fence(self, text):
        if text.startswith("```"):
            lines = text.splitlines()[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            return "\n".join(lines)
        return text
