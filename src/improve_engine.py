import os
from openai import OpenAI

MAX_TOKENS = 800


class ImproveEngine:

    def __init__(self):
        api_key = os.getenv("LLM_API_KEY")
        model = os.getenv("LLM_MODEL")
        base_url = os.getenv("LLM_BASE_URL", "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1")

        if not api_key:
            raise EnvironmentError("LLM_API_KEY environment variable is not set.")
        if not model:
            raise EnvironmentError("LLM_MODEL environment variable is not set.")

        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    def improve(self, content: str) -> str:

        prompt = f"""Bạn là QC Lead Zalopay. Hãy cải thiện đoạn phản hồi CS sau.

Nội dung gốc:
{content}

Yêu cầu:
- Lịch sự, đồng cảm, chuyên nghiệp
- Không đổ lỗi cho khách hàng
- Xưng "Zalopay", gọi "bạn"
- Có lời chào đầu, lời cảm ơn cuối
- Ngắn gọn, đúng trọng tâm

Trả về:
1. Điểm chưa tốt (2-3 gạch đầu dòng ngắn)
2. Phiên bản cải thiện (viết lại hoàn chỉnh)"""

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content.strip()
