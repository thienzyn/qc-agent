import pandas as pd


class ExcelData:

    def __init__(self):
        self.qc_rules     = []
        self.templates    = []
        self.writing_rules = []
        self.tone_guide   = []
        self.good_cases   = []


def _clean(value) -> str:
    """Chuyển giá trị pandas về string, bỏ 'nan'."""
    s = str(value).strip()
    return "" if s.lower() == "nan" else s


def load_excel_data(data_folder: str = "Data") -> ExcelData:

    file_path = f"{data_folder}/Zalopay_QC_Knowledge_Base.xlsx"
    all_sheets = pd.read_excel(file_path, sheet_name=None, header=None)

    data = ExcelData()

    # ── QC Rules ──────────────────────────────────────────────────────────────
    if "🎯 QC Rules" in all_sheets:
        df = all_sheets["🎯 QC Rules"]
        # Tìm hàng header thực sự (hàng đầu tiên có "#" hoặc "Nhóm")
        header_row = _find_header_row(df, keywords=["Nhóm Tiêu Chí", "Biểu Hiện Lỗi", "P-Level"])
        if header_row is not None:
            df.columns = df.iloc[header_row]
            df = df.iloc[header_row + 1:].reset_index(drop=True)
        df.columns = [str(c).strip() for c in df.columns]
        data.qc_rules = [
            {k: _clean(v) for k, v in row.items()}
            for row in df.to_dict(orient="records")
            if any(_clean(v) for v in row.values())
        ]

    # ── CS Templates ──────────────────────────────────────────────────────────
    if "💬 CS Templates" in all_sheets:
        df = all_sheets["💬 CS Templates"]
        header_row = _find_header_row(df, keywords=["Tiêu Đề Template", "Nội Dung Phản Hồi"])
        if header_row is not None:
            df.columns = df.iloc[header_row]
            df = df.iloc[header_row + 1:].reset_index(drop=True)
        df.columns = [str(c).strip() for c in df.columns]

        # Chuẩn hoá tên cột linh hoạt
        col_map = _build_col_map(df.columns, {
            "Tiêu Đề Template": ["Tiêu Đề Template", "Title", "Tiêu đề"],
            "Nội Dung Phản Hồi": ["Nội Dung Phản Hồi", "Content", "Nội dung"],
            "Thư Mục":           ["Thư Mục", "Folder Name", "Folder"],
            "Phạm Vi":           ["Phạm Vi", "Scope"],
            "Nhóm":              ["Nhóm", "Group"],
        })

        records = []
        for row in df.to_dict(orient="records"):
            title   = _clean(row.get(col_map.get("Tiêu Đề Template", ""), ""))
            content = _clean(row.get(col_map.get("Nội Dung Phản Hồi", ""), ""))
            if title and content:
                records.append({
                    "Tiêu Đề Template": title,
                    "Nội Dung Phản Hồi": content,
                    "Thư Mục": _clean(row.get(col_map.get("Thư Mục", ""), "")),
                    "Phạm Vi": _clean(row.get(col_map.get("Phạm Vi", ""), "")),
                    "Nhóm":    _clean(row.get(col_map.get("Nhóm", ""), "")),
                })
        data.templates = records

    # ── Writing Rules ─────────────────────────────────────────────────────────
    if "✍️ Writing Rules" in all_sheets:
        df = all_sheets["✍️ Writing Rules"]
        header_row = _find_header_row(df, keywords=["Mã", "Điều Cần Tránh"])
        if header_row is not None:
            df.columns = df.iloc[header_row]
            df = df.iloc[header_row + 1:].reset_index(drop=True)
        df.columns = [str(c).strip() for c in df.columns]

        col_map = _build_col_map(df.columns, {
            "Mã":               ["Mã", "ID", "Rule_ID"],
            "❌ Điều Cần Tránh": ["❌ Điều Cần Tránh", "Điều Cần Tránh", "Avoid"],
            "✅ Cách Làm Đúng":  ["✅ Cách Làm Đúng", "Cách Làm Đúng", "Correct"],
            "Ghi Chú":          ["Ghi Chú", "Note"],
        })

        data.writing_rules = [
            {
                "Mã":               _clean(row.get(col_map.get("Mã", ""), "")),
                "❌ Điều Cần Tránh": _clean(row.get(col_map.get("❌ Điều Cần Tránh", ""), "")),
                "✅ Cách Làm Đúng":  _clean(row.get(col_map.get("✅ Cách Làm Đúng", ""), "")),
                "Ghi Chú":          _clean(row.get(col_map.get("Ghi Chú", ""), "")),
            }
            for row in df.to_dict(orient="records")
            if _clean(row.get(col_map.get("Mã", ""), ""))
        ]

    # ── Tone Guide ────────────────────────────────────────────────────────────
    if "📖 Tone Guide" in all_sheets:
        df = all_sheets["📖 Tone Guide"]
        header_row = _find_header_row(df, keywords=["Tâm Trạng", "Nguyên Tắc"])
        if header_row is not None:
            df.columns = df.iloc[header_row]
            df = df.iloc[header_row + 1:].reset_index(drop=True)
        df.columns = [str(c).strip() for c in df.columns]

        col_map = _build_col_map(df.columns, {
            "Tâm Trạng Khách Hàng": ["Tâm Trạng Khách Hàng", "Customer Mood", "Tâm Trạng"],
            "Nguyên Tắc Xử Lý":     ["Nguyên Tắc Xử Lý", "Nguyên Tắc", "Principle"],
            "Ví Dụ Áp Dụng":        ["Ví Dụ Áp Dụng", "Example", "Ví dụ"],
        })

        data.tone_guide = [
            {
                "Tâm Trạng Khách Hàng": _clean(row.get(col_map.get("Tâm Trạng Khách Hàng", ""), "")),
                "Nguyên Tắc Xử Lý":     _clean(row.get(col_map.get("Nguyên Tắc Xử Lý", ""), "")),
                "Ví Dụ Áp Dụng":        _clean(row.get(col_map.get("Ví Dụ Áp Dụng", ""), "")),
            }
            for row in df.to_dict(orient="records")
            if _clean(row.get(col_map.get("Tâm Trạng Khách Hàng", ""), ""))
        ]

    # ── Good Cases ────────────────────────────────────────────────────────────
    if "⭐ Good Cases" in all_sheets:
        df = all_sheets["⭐ Good Cases"]
        header_row = _find_header_row(df, keywords=["Domain", "Phản Hồi Agent", "Điểm Mạnh"])
        if header_row is not None:
            df.columns = df.iloc[header_row]
            df = df.iloc[header_row + 1:].reset_index(drop=True)
        df.columns = [str(c).strip() for c in df.columns]

        col_map = _build_col_map(df.columns, {
            "Domain":       ["Domain"],
            "Tâm Trạng KH": ["Tâm Trạng KH", "Customer Mood", "Mood"],
            "Lần Reply":    ["Lần Reply", "Reply Count"],
            "Phản Hồi Agent": ["Phản Hồi Agent", "Agent Reply"],
            "Điểm Mạnh":    ["Điểm Mạnh", "Strengths"],
        })

        data.good_cases = [
            {
                "Domain":         _clean(row.get(col_map.get("Domain", ""), "")),
                "Tâm Trạng KH":   _clean(row.get(col_map.get("Tâm Trạng KH", ""), "")),
                "Lần Reply":      _clean(row.get(col_map.get("Lần Reply", ""), "")),
                "Phản Hồi Agent": _clean(row.get(col_map.get("Phản Hồi Agent", ""), "")),
                "Điểm Mạnh":      _clean(row.get(col_map.get("Điểm Mạnh", ""), "")),
            }
            for row in df.to_dict(orient="records")
            if any(_clean(v) for v in row.values())
        ]

    return data


# ── Helpers ───────────────────────────────────────────────────────────────────

def _find_header_row(df: pd.DataFrame, keywords: list[str]) -> int | None:
    """
    Tìm index của hàng đầu tiên có chứa ít nhất 1 keyword trong keywords.
    Dùng để bỏ qua các hàng title/merge phía trên header thực sự.
    """
    for i, row in df.iterrows():
        row_values = [str(v).strip() for v in row.values]
        if any(kw in row_values for kw in keywords):
            return i
    return None


def _build_col_map(columns: list, mapping: dict[str, list[str]]) -> dict[str, str]:
    """
    Với mỗi field cần, tìm tên cột thực tế trong DataFrame dựa trên danh sách alias.
    Trả về dict {field_name: actual_column_name}.
    """
    col_set = set(columns)
    result = {}
    for field, aliases in mapping.items():
        for alias in aliases:
            if alias in col_set:
                result[field] = alias
                break
    return result
