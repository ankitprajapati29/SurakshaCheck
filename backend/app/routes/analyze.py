
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.gemini_service import analyze_with_gemini

router = APIRouter(prefix="/api", tags=["Analysis"])


class AnalyzeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)


class AnalyzeResponse(BaseModel):
    analysis: str


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_message(request: AnalyzeRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide a non-empty message.",
        )

    try:
        result = analyze_with_gemini(request.message)
        return AnalyzeResponse(analysis=result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        # Avoid returning API keys or internal exception details.
        print(f"Gemini analysis failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Gemini analysis failed. Check the backend configuration and API access.",
        ) from exc
