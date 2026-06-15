from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .excel_loader import load_excel_data
from .review_engine import ReviewEngine

# ------------------------------------------------------------------
# App state
# ------------------------------------------------------------------

_engine: ReviewEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _engine
    data = load_excel_data()
    _engine = ReviewEngine(data)
    yield
    _engine = None


app = FastAPI(
    title="QC Agent API",
    description="Automated Quality Control agent for Vietnamese CS chat responses.",
    version="1.0.0",
    lifespan=lifespan,
)


# ------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------

class ReviewRequest(BaseModel):
    chat_content: str


class ViolationItem(BaseModel):
    category: str
    violation_type: str
    p_level: str
    description: str
    points_deducted: int


class ReviewResponse(BaseModel):
    score: float
    violations: list[dict]
    suggestions: list[str]


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/review", response_model=ReviewResponse)
def review(request: ReviewRequest):
    if _engine is None:
        raise HTTPException(status_code=503, detail="Review engine not initialised.")

    if not request.chat_content.strip():
        raise HTTPException(status_code=422, detail="chat_content must not be empty.")

    try:
        result = _engine.review(request.chat_content)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return ReviewResponse(
        score=result.score,
        violations=result.violations,
        suggestions=result.suggestions,
    )
