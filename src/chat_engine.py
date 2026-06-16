import os
from openai import OpenAI
from .excel_loader import ExcelData

MAX_TOKENS = 2000


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

        # Tone Guide — mood + principle (tối đa 10 dòng)
        tone = ""
        if hasattr(data, "tone_guide") and data.tone_guide:
            lines = []
            for t in data.tone_guide[:10]:
                mood = str(t.get("Tâm Trạng Khách Hàng", "")).strip()
                prin = str(t.get("Nguyên Tắc Xử Lý", "")).strip()
                if mood and mood != "nan":
                    lines.append(f"{mood}: {prin[:80]}")
            tone = "\n".join(lines)

        # Lưu ý QC — tối đa 10 dòng
        luu_y_qc = ""
        if hasattr(data, "writing_rules") and data.writing_rules:
            lines = []
            for w in data.writing_rules[:10]:
                avoid = str(w.get("❌ Điều Cần Tránh", "")).strip()
                ok    = str(w.get("✅ Cách Làm Đúng", "")).strip()
                if avoid and avoid != "nan":
                    if ok and ok != "nan":
                        lines.append(f"❌ {avoid[:60]} → ✅ {ok[:60]}")
                    else:
                        lines.append(f"❌ {avoid[:80]}")
            luu_y_qc = "\n".join(lines)

        # Templates — 1 mẫu mỗi folder, tối đa 100 ký tự nội dung, tối đa 15 folders
        templates = ""
        if hasattr(data, "templates") and data.templates:
            lines = []
            seen_folders = set()
            for t in data.templates:
                title   = str(t.get("Tiêu Đề Template", "")).strip()
                content = str(t.get("Nội Dung Phản Hồi", "")).strip()
                folder  = str(t.get("Thư Mục", "")).strip()
                if title and content and title != "nan" and content != "nan":
                    if folder not in seen_folders:
                        seen_folders.add(folder)
                        lines.append(f"[{folder}] {title}: {content[:100]}")
                        if len(seen_folders) >= 15:
                            break
            templates = "\n".join(lines)

        return f"""Bee 🐝 — CS Bot Zalopay. Phản hồi NHANH, NGẮN, đúng trọng tâm.

QUY TẮC:
- Xưng "Zalopay". Không emoji trong nội dung phản hồi.
- Dùng template phù hợp, điền [placeholder], cá nhân hóa.
- Cuối phản hồi LUÔN có phần: 💡 Lưu ý QC: (1-2 dòng ngắn nhắc điều cần tránh)
- Nếu không đủ thông tin → hỏi đúng 1 câu ngắn

TONE THEO TÂM TRẠNG KHÁCH HÀNG:
{tone}

LƯU Ý QC — ĐIỀU CẦN TRÁNH:
{luu_y_qc}

TEMPLATES THAM KHẢO:
{templates}""".strip()

    def chat(self, message: str, history: list[dict] | None = None) -> str:
        messages = [{"role": "system", "content": self._system_prompt}]

        # Chỉ lấy 2 turn gần nhất để giảm context
        if history:
            for turn in history[-2:]:
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

        return response.choices[0].message.content.strip().replace("$\\rightarrow$", "→")
