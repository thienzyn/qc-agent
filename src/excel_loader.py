from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
import openpyxl

DATA_DIR = Path(__file__).parent.parent / "Data"

P_LEVEL_POINTS: dict[str, int] = {
    "P0": 0,
    "P1": 3,
    "P2": 7,
    "P3": 15,
    "P4": 30,
}

P_LEVEL_LABELS: dict[str, str] = {
    "P0": "Remind (0 pts)",
    "P1": "Light (−3 pts)",
    "P2": "Medium (−7 pts)",
    "P3": "Severe (−15 pts)",
    "P4": "Critical (−30 pts)",
}


@dataclass
class QCRule:
    stt: str
    category: str
    violation_type: str
    p_level: str
    online_indicators: list[str] = field(default_factory=list)
    points_deducted: int = 0


@dataclass
class WritingStyleRule:
    rule_id: str
    avoid: str


@dataclass
class ToneGuideline:
    mood: str
    principle: str


@dataclass
class ExcelData:
    qc_rules: list[QCRule]
    writing_styles: list[WritingStyleRule]
    tone_guidelines: list[ToneGuideline]


def load_excel_data() -> ExcelData:
    qc_rules = _load_qc_rules()
    writing_styles, tone_guidelines = _load_cs_knowledge_base()
    return ExcelData(
        qc_rules=qc_rules,
        writing_styles=writing_styles,
        tone_guidelines=tone_guidelines,
    )


def _clean(value) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text == "None" else text


def _load_qc_rules() -> list[QCRule]:
    wb = openpyxl.load_workbook(DATA_DIR / "QC_Rules.xlsx")
    ws = wb["Sheet1"]

    rules: list[QCRule] = []
    current_stt = ""
    current_category = ""
    current_rule: Optional[QCRule] = None

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < 2:  # skip header rows
            continue

        stt = _clean(row[0])
        category = _clean(row[1])
        violation_type = _clean(row[2])
        p_level = _clean(row[3])
        online_indicator = _clean(row[5])  # "Online (Inapp/Chat)" column

        if stt:
            current_stt = stt
        if category:
            current_category = category

        if violation_type:
            if current_rule is not None:
                rules.append(current_rule)
            current_rule = QCRule(
                stt=current_stt,
                category=current_category,
                violation_type=violation_type,
                p_level=p_level,
                online_indicators=[online_indicator] if online_indicator else [],
                points_deducted=P_LEVEL_POINTS.get(p_level, 0),
            )
        elif current_rule is not None and online_indicator:
            current_rule.online_indicators.append(online_indicator)

    if current_rule is not None:
        rules.append(current_rule)

    return rules


def _load_cs_knowledge_base() -> tuple[list[WritingStyleRule], list[ToneGuideline]]:
    wb = openpyxl.load_workbook(DATA_DIR / "CS_Writing_Knowledge_Base.xlsx")

    writing_styles: list[WritingStyleRule] = []
    ws_style = wb["Writing Style"]
    for row in list(ws_style.iter_rows(values_only=True))[1:]:
        rule_id = _clean(row[0])
        avoid = _clean(row[1])
        if rule_id and avoid:
            writing_styles.append(WritingStyleRule(rule_id=rule_id, avoid=avoid))

    tone_guidelines: list[ToneGuideline] = []
    ws_tone = wb["Tone Guideline"]
    for row in list(ws_tone.iter_rows(values_only=True))[1:]:
        mood = _clean(row[0])
        principle = _clean(row[1])
        if mood and principle:
            tone_guidelines.append(ToneGuideline(mood=mood, principle=principle))

    return writing_styles, tone_guidelines
