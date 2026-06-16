import os
from openai import OpenAI

from .excel_loader import ExcelData

MAX_TOKENS = 700


class ChatEngine:

    def __init__(self, data: ExcelData):
        api_key  = os.getenv("LLM_API_KEY")
        model    = os.getenv("LLM_MODEL")
        base_url = os.getenv("LLM_BASE_URL", "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1")

        if not api_key:
            raise EnvironmentError("LLM_API_KEY environment variable is not set.")
        if not model:
            raise EnvironmentError("LLM_MODEL environment variable is not set.")

        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model  = model
        self._system_prompt = self._build_system_prompt(data)

    def _build_system_prompt(self, data: ExcelData) -> str:

        # Writing Rules — gọn
        writing = ""
        if hasattr(data, "writing_rules") and data.writing_rules:
            lines = []
            for w in data.writing_rules:
                rid   = str(w.get("Mã", "")).strip()
                avoid = str(w.get("❌ Điều Cần Tránh", "")).strip()
                ok    = str(w.get("✅ Cách Làm Đúng", "")).strip()
                if rid and rid != "nan":
                    lines.append(f"[{rid}] Tránh: {avoid} → Đúng: {ok}")
            writing = "\n".join(lines)

        # Tone Guide — gọn
        tone = ""
        if hasattr(data, "tone_guide") and data.tone_guide:
            lines = []
            for t in data.tone_guide:
                mood = str(t.get("Tâm Trạng Khách Hàng", "")).strip()
                prin = str(t.get("Nguyên Tắc Xử Lý", "")).strip()
                if mood and mood != "nan":
                    lines.append(f"{mood}: {prin}")
            tone = "\n".join(lines)

        # Templates — 500 ký tự mỗi mẫu
        templates = ""
        if hasattr(data, "templates") and data.templates:
            lines = []
            for t in data.templates:
                title   = str(t.get("Tiêu Đề Template", "")).strip()
                content = str(t.get("Nội Dung Phản Hồi", "")).strip()
                folder  = str(t.get("Thư Mục", "")).strip()
                if title and content and title != "nan" and content != "nan":
                    lines.append(f"[{folder}] {title}\n{content[:500]}")
            templates = "\n---\n".join(lines)

        return f"""Bạn là Bee 🐝 — CS Assistant của Zalopay. Soạn phản hồi ticket nhanh, chuẩn, chuyên nghiệp.

QUY TẮC CỐT LÕI:
1. Xác định tâm trạng KH → chọn template phù hợp → cá nhân hóa 1-2 câu → áp dụng tone đúng
2. Xưng "Zalopay". Không emoji trong template. Không copy nguyên mẫu (vi phạm S02)
3. Trả lời ngắn gọn, đúng trọng tâm. Câu hỏi mơ hồ → hỏi lại 1 câu
4. Cuối mỗi phản hồi: 💡 Lưu ý QC: (1 dòng)

WRITING RULES:
{writing}

TONE KH:
{tone}

TEMPLATES:
{templates}""".strip()

    def chat(self, message: str, history: list[dict] | None = None) -> str:
        messages = [{"role": "system", "content": self._system_prompt}]

        if history:
            for turn in history[-4:]:
                role    = turn.get("role", "user")
                content = str(turn.get("content", "")).strip()
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=MAX_TOKENS,
            messages=messages
        )

        return response.choices[0].message.content.strip()
