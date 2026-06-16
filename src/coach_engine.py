import os

from openai import OpenAI


class CoachEngine:

    def __init__(self):

        self.client = OpenAI(
            api_key=os.getenv("LLM_API_KEY"),
            base_url=os.getenv(
                "LLM_BASE_URL",
                "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1"
            )
        )

        self.model = os.getenv("LLM_MODEL")

    def coach(self, errors):

        system = """Bạn là QC Lead Zalopay. Phản hồi NGẮN GỌN, KHÔNG dùng bảng markdown, KHÔNG format phức tạp.

Cấu trúc bắt buộc (tổng dưới 200 từ):
Lỗi chính: (2-3 dòng mô tả ngắn)
Cách khắc phục:
- (bullet ngắn)
- (bullet ngắn)
- (bullet ngắn)
Ví dụ: (1 câu mẫu phản hồi đúng)"""

        prompt = f"Lỗi cần coaching:\n{errors}"

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=400,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": prompt},
            ]
        )

        return response.choices[0].message.content.strip()