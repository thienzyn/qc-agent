from dotenv import load_dotenv

load_dotenv()

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


# =====================================================
# Lifespan
# =====================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global _engine
    global _chat_engine
    global _coach_engine
    global _improve_engine

    data = load_excel_data()

    _engine = ReviewEngine(data)
    _chat_engine = ChatEngine(data)
    _coach_engine = CoachEngine()
    _improve_engine = ImproveEngine()

    yield

    _engine = None
    _chat_engine = None
    _coach_engine = None
    _improve_engine = None


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


class ChatRequest(BaseModel):
    message: str


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
        request.chat_content
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
        request.message
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