class ImproveEngine:

    def improve(
        self,
        content: str
    ) -> str:

        prompt = f"""
Viết lại nội dung sau theo phong cách CS của ZaloPay.

Nội dung:

{content}

Yêu cầu:

- Lịch sự
- Đồng cảm
- Chuyên nghiệp
- Không đổ lỗi
- Có lời chào đầu
- Có lời cảm ơn cuối
- Chỉ ra điểm chưa tốt.
- Viết lại chuyên nghiệp hơn.
- Đảm bảo đúng tone của ZaloPay.

Trả về phiên bản tốt hơn.
"""

        return prompt