import pandas as pd


class ExcelData:

    def __init__(self):
        self.qc_rules = []
        self.templates = []
        self.writing_rules = []
        self.tone_guide = []
        self.good_cases = []


def load_excel_data(data_folder="Data"):

    file_path = f"{data_folder}/Zalopay_QC_Knowledge_Base.xlsx"

    all_sheets = pd.read_excel(file_path, sheet_name=None)

    data = ExcelData()

    # ── QC Rules ──────────────────────────────────────────────────────────────
    if "🎯 QC Rules" in all_sheets:
        qc_df = all_sheets["🎯 QC Rules"]
        data.qc_rules = [
            row for row in qc_df.to_dict(orient="records")
            if any(str(v).strip() not in ("", "nan") for v in row.values())
        ]

    # ── Templates ─────────────────────────────────────────────────────────────
    if "💬 CS Templates" in all_sheets:
        tm_df = all_sheets["💬 CS Templates"]
        data.templates = [
            row for row in tm_df.to_dict(orient="records")
            if str(row.get("Tiêu Đề Template", "")).strip() not in ("", "nan")
        ]

    # ── Writing Rules ─────────────────────────────────────────────────────────
    if "✍️ Writing Rules" in all_sheets:
        wr_df = all_sheets["✍️ Writing Rules"]
        data.writing_rules = [
            row for row in wr_df.to_dict(orient="records")
            if str(row.get("Mã", "")).strip() not in ("", "nan")
        ]

    # ── Tone Guide ────────────────────────────────────────────────────────────
    if "📖 Tone Guide" in all_sheets:
        tg_df = all_sheets["📖 Tone Guide"]
        data.tone_guide = [
            row for row in tg_df.to_dict(orient="records")
            if str(row.get("Tâm Trạng Khách Hàng", "")).strip() not in ("", "nan")
        ]

    # ── Good Cases ────────────────────────────────────────────────────────────
    if "⭐ Good Cases" in all_sheets:
        gc_df = all_sheets["⭐ Good Cases"]
        data.good_cases = [
            row for row in gc_df.to_dict(orient="records")
            if any(str(v).strip() not in ("", "nan") for v in row.values())
        ]

    return data
