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

        prompt = f"""
Bạn là QC Lead của ZaloPay.

Dựa trên các lỗi sau:

{errors}

Hãy:

1. Phân tích nguyên nhân.
2. Đưa ra coaching plan.
3. Đưa ví dụ đúng.
4. Đưa action plan trong 2 tuần.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.choices[0].message.content