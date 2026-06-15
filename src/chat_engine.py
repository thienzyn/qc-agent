import os
from openai import OpenAI

from .excel_loader import ExcelData

MAX_TOKENS = 2000


class ChatEngine:

    def __init__(self, data: ExcelData):

        api_key = os.getenv("LLM_API_KEY")
        model = os.getenv("LLM_MODEL")
        base_url = os.getenv(
            "LLM_BASE_URL",
            "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1"
        )

        if not api_key:
            raise EnvironmentError(
                "LLM_API_KEY environment variable is not set."
            )

        if not model:
            raise EnvironmentError(
                "LLM_MODEL environment variable is not set."
            )

        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )

        self.model = model
        self._system_prompt = self._build_system_prompt(data)


    def _build_system_prompt(self, data: ExcelData) -> str:

        # ── QC Rules ──────────────────────────────────────────────────────────
        qc_section = ""
        if hasattr(data, "qc_rules") and data.qc_rules:
            qc_lines = []
            for rule in data.qc_rules:
                line = f"- [{rule.get('P-Level', '')}] {rule.get('Tên tiêu chí', '')}: {rule.get('Biểu hiện lỗi', '')}"
                if rule.get('Điểm trừ'):
                    line += f" (Điểm trừ: {rule.get('Điểm trừ')})"
                qc_lines.append(line)
            qc_section = "\n".join(qc_lines)

        # ── Templates ─────────────────────────────────────────────────────────
        template_section = ""
        if hasattr(data, "templates") and data.templates:
            tmpl_lines = []
            for t in data.templates:
                title   = t.get("Title", "")
                content = t.get("Content", "")
                folder  = t.get("Folder Name", "")
                if title and content:
                    tmpl_lines.append(
                        f"### [{folder}] {title}\n{content[:600]}"
                    )
            template_section = "\n\n".join(tmpl_lines)

        # ── Tone Guide ────────────────────────────────────────────────────────
        tone_section = ""
        if hasattr(data, "tone_guide") and data.tone_guide:
            tone_lines = []
            for t in data.tone_guide:
                mood      = t.get("Customer Mood", "")
                principle = t.get("Nguyên tắc", "")
                tone_lines.append(f"- {mood}: {principle}")
            tone_section = "\n".join(tone_lines)

        # ── Writing Rules ─────────────────────────────────────────────────────
        writing_section = ""
        if hasattr(data, "writing_rules") and data.writing_rules:
            writing_lines = []
            for w in data.writing_rules:
                rule_id = w.get("Rule_ID", "")
                avoid   = w.get("Điều cần tránh", "")
                writing_lines.append(f"- [{rule_id}] {avoid}")
            writing_section = "\n".join(writing_lines)

        # ── Assemble prompt ───────────────────────────────────────────────────
        return f"""
Bạn là QC AI Assistant của Zalopay — trợ lý thông minh hỗ trợ đội ngũ chăm sóc khách hàng.

=== NHIỆM VỤ ===
1. Tìm và gợi ý template phản hồi phù hợp với tình huống.
2. Soạn hoặc điều chỉnh phản hồi theo ngữ cảnh cụ thể.
3. Nhắc nhở các lỗi QC cần tránh.
4. Viết đúng văn phong và tông giọng Zalopay.
5. Luôn trả lời bằng tiếng Việt.

=== NGUYÊN TẮC GIAO TIẾP ===
- Đồng cảm với khách hàng, không tranh cãi, không đổ lỗi.
- Luôn có lời chào đầu ("Chào bạn") và lời kết thúc.
- Gọi thương hiệu đúng: "Zalopay" (chữ p thường).
- Không dùng "ZaloPay", "Zalo Pay" hay "ZALOPAY".
- Mỗi ý xuống dòng riêng, không canh giữa.
- Ngắn gọn, rõ ràng, dễ hiểu.

=== ĐỊNH DẠNG PHẢN HỒI (BẮT BUỘC) ===
Khi soạn phản hồi cho nhân viên CS, luôn tuân theo cấu trúc sau:

1. Dùng ## cho tiêu đề tình huống, ### cho từng trường hợp.
2. TUYỆT ĐỐI KHÔNG dùng **in đậm** trong nội dung template gửi khách hàng — viết thuần text.
3. Chỉ được dùng **in đậm** trong phần ghi chú cho nhân viên (không phải template), tối đa 1-2 cụm từ.
4. KHÔNG dùng màu, KHÔNG bold placeholder [...], KHÔNG bold tên hành động thông thường.
5. Mỗi trường hợp thêm dòng 💡 Lưu ý QC ở cuối.
6. Không dùng dấu > để trích dẫn.

=== TIÊU CHÍ QC (cần tuân thủ & nhắc nhở) ===
{qc_section if qc_section else "Chưa có dữ liệu QC Rules."}

=== TONE GIỌNG THEO TÂM TRẠNG KHÁCH HÀNG ===
{tone_section if tone_section else "Chưa có dữ liệu Tone Guide."}

=== QUY TẮC VIẾT — ĐIỀU CẦN TRÁNH ===
{writing_section if writing_section else "Chưa có dữ liệu Writing Rules."}

=== KHO TEMPLATE PHẢN HỒI ===
Khi được hỏi về tình huống cụ thể, hãy ưu tiên dùng hoặc điều chỉnh template phù hợp dưới đây:

{template_section if template_section else "Chưa có dữ liệu Template."}
""".strip()


    def chat(self, message: str) -> str:

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=MAX_TOKENS,
            messages=[
                {
                    "role": "system",
                    "content": self._system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        )

        return response.choices[0].message.content.strip()
