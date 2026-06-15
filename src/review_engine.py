import json
import os
from dataclasses import dataclass

from openai import OpenAI

from .excel_loader import ExcelData, P_LEVEL_LABELS

MAX_TOKENS = 1500


@dataclass
class ReviewResult:
    score: float
    violations: list[dict]
    suggestions: list[str]


class ReviewEngine:
    def __init__(self, data: ExcelData):
        self.data = data
        api_key = os.getenv("LLM_API_KEY")
        model = os.getenv("LLM_MODEL")
        base_url = os.getenv("LLM_BASE_URL", "https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1")
        if not api_key:
            raise EnvironmentError("LLM_API_KEY environment variable is not set.")
        if not model:
            raise EnvironmentError("LLM_MODEL environment variable is not set.")
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self._system_prompt = self._build_system_prompt()

    # ------------------------------------------------------------------
    # Prompt construction
    # ------------------------------------------------------------------

    def _build_system_prompt(self) -> str:
        rules_block = self._format_qc_rules()
        writing_block = "\n".join(
            f"- {r.rule_id}: {r.avoid}" for r in self.data.writing_styles
        )
        tone_block = "\n".join(
            f"- {t.mood}: {t.principle}" for t in self.data.tone_guidelines
        )

        return f"""You are a Quality Control (QC) Agent for a Vietnamese customer service team at ZaloPay.
Your task is to review a CS agent's chat/email response and identify quality violations.

## SCORING SYSTEM
Start at 100 points and deduct based on violation severity:
- P0 (Remind):   0 pts deducted — note only
- P1 (Light):    3 pts deducted
- P2 (Medium):   7 pts deducted
- P3 (Severe):  15 pts deducted
- P4 (Critical): 30 pts deducted (may trigger incident report)
Final score is clamped to [0, 100].

## QC RULES
{rules_block}

## WRITING STYLE RULES (avoid these)
{writing_block}

## TONE GUIDELINES BY CUSTOMER MOOD
{tone_block}

## INSTRUCTIONS
1. Read the provided chat content carefully.
2. Identify every rule violation present in the text.
3. Calculate the final score (100 minus sum of deductions, min 0).
4. List concrete, actionable suggestions for improvement.

## OUTPUT FORMAT
Respond ONLY with valid JSON — no markdown, no explanation — in this exact shape:
{{
  "score": <integer 0-100>,
  "violations": [
    {{
      "category": "<Tên tiêu chí>",
      "violation_type": "<Biểu hiện lỗi>",
      "p_level": "<P0|P1|P2|P3|P4>",
      "description": "<specific evidence from the text>",
      "points_deducted": <integer>
    }}
  ],
  "suggestions": [
    "<actionable improvement>"
  ]
}}
"""

    def _format_qc_rules(self) -> str:
        lines: list[str] = []
        current_category = ""
        for rule in self.data.qc_rules:
            if rule.category != current_category:
                current_category = rule.category
                lines.append(f"\n### {rule.stt}. {rule.category}")
            label = P_LEVEL_LABELS.get(rule.p_level, rule.p_level)
            indicators = "; ".join(rule.online_indicators[:4]) if rule.online_indicators else "—"
            lines.append(f"  [{label}] {rule.violation_type}: {indicators}")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Review
    # ------------------------------------------------------------------

    def review(self, chat_content: str) -> ReviewResult:
        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=MAX_TOKENS,
            messages=[
                {"role": "system", "content": self._system_prompt},
                {
                    "role": "user",
                    "content": (
                        "Please review the following CS chat content and return a JSON result:\n\n"
                        f"{chat_content}"
                    ),
                },
            ],
        )

        raw = response.choices[0].message.content.strip()
        raw = _strip_code_fence(raw)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Model returned invalid JSON: {exc}\nRaw: {raw[:300]}") from exc

        score = max(0, min(100, int(data.get("score", 100))))
        violations = data.get("violations", [])
        suggestions = data.get("suggestions", [])

        return ReviewResult(score=score, violations=violations, suggestions=suggestions)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _strip_code_fence(text: str) -> str:
    if text.startswith("```"):
        lines = text.splitlines()
        # drop opening fence line
        lines = lines[1:]
        # drop closing fence if present
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return text
