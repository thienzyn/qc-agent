from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .excel_loader import load_excel_data
from .review_engine import ReviewEngine
from .chat_engine import ChatEngine
from .coach_engine import CoachEngine
from .improve_engine import ImproveEngine


# =====================================================
# Global engines
# =====================================================

_engine = None
_chat_engine = None
_coach_engine = None
_improve_engine = None
_data = None


# =====================================================
# Lifespan
# =====================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global _engine
    global _chat_engine
    global _coach_engine
    global _improve_engine
    global _data

    _data = load_excel_data()

    _engine = ReviewEngine(_data)
    _chat_engine = ChatEngine(_data)
    _coach_engine = CoachEngine()
    _improve_engine = ImproveEngine()

    yield

    _engine = None
    _chat_engine = None
    _coach_engine = None
    _improve_engine = None
    _data = None


# =====================================================
# App
# =====================================================

app = FastAPI(
    title="QC AI Assistant",
    version="1.0.0",
    lifespan=lifespan
)

# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# Schemas
# =====================================================

class ReviewRequest(BaseModel):
    chat_content: str
    mood: str = "Normal"


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class CoachRequest(BaseModel):
    errors: str


class ImproveRequest(BaseModel):
    text: str


# =====================================================
# Health
# =====================================================

@app.get("/health")
def health():

    return {
        "status": "ok"
    }


# =====================================================
# Templates
# =====================================================

@app.get("/templates")
def get_templates():

    if _data is None:
        raise HTTPException(status_code=503, detail="Data not loaded.")

    return {
        "templates": _data.templates
    }


# =====================================================
# Review
# =====================================================

@app.post("/review")
def review(request: ReviewRequest):

    if _engine is None:
        raise HTTPException(
            status_code=503,
            detail="Review engine not initialized."
        )

    result = _engine.review(
        request.chat_content,
        request.mood
    )

    return {
        "score": result.score,
        "violations": result.violations,
        "suggestions": result.suggestions
    }


# =====================================================
# Chat
# =====================================================

@app.post("/chat")
def chat(request: ChatRequest):

    if _chat_engine is None:
        raise HTTPException(
            status_code=503,
            detail="Chat engine not initialized."
        )

    answer = _chat_engine.chat(
        request.message,
        request.history
    )

    return {
        "answer": answer
    }


# =====================================================
# Coach
# =====================================================

@app.post("/coach")
def coach(request: CoachRequest):

    if _coach_engine is None:
        raise HTTPException(
            status_code=503,
            detail="Coach engine not initialized."
        )

    result = _coach_engine.coach(
        request.errors
    )

    return {
        "answer": result
    }


# =====================================================
# Improve
# =====================================================

@app.post("/improve")
def improve(request: ImproveRequest):

    if _improve_engine is None:
        raise HTTPException(
            status_code=503,
            detail="Improve engine not initialized."
        )

    result = _improve_engine.improve(
        request.text
    )

    return {
        "answer": result
    }
