import logging
from fastapi import FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas.challenge import ChallengePayload, EmbeddingRequest, SimilarityRequest
from app.schemas.ai_results import FullAIAnalysisResponse
from app.services.pipeline import pipeline
from app.services.embeddings import embedding_service
from app.utils.similarity import rank_candidates

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sicp_ai")

app = FastAPI(
    title="SICP AI Problem Intelligence Engine",
    version=settings.PIPELINE_VERSION,
    description="Microservice providing AI classification, prioritization, quality validation, semantic duplicate detection, and routing recommendations for the Societal Innovation & Collaboration Portal."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_internal_token(x_internal_key: str = Header(None)):
    """Verifies service-to-service key if configured."""
    if settings.INTERNAL_SERVICE_KEY and x_internal_key:
        if x_internal_key != settings.INTERNAL_SERVICE_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid internal service key."
            )

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "sicp-ai-problem-intelligence",
        "version": settings.PIPELINE_VERSION,
        "model": settings.AI_MODEL,
        "embedding_model": settings.AI_EMBEDDING_MODEL,
        "openai_connected": bool(settings.OPENAI_API_KEY)
    }

@app.post("/process", response_model=FullAIAnalysisResponse)
async def process_challenge_endpoint(
    payload: ChallengePayload,
    x_internal_key: str = Header(None)
):
    """
    Main AI Problem Intelligence Pipeline endpoint.
    Performs classification, validation, priority, routing, embeddings, and duplicate detection.
    """
    verify_internal_token(x_internal_key)
    result = await pipeline.process_challenge(payload)
    return result

@app.post("/embed")
async def generate_embedding_endpoint(
    req: EmbeddingRequest,
    x_internal_key: str = Header(None)
):
    """Generates an embedding vector for arbitrary text."""
    verify_internal_token(x_internal_key)
    vec = await embedding_service.generate_embedding(req.text)
    return {
        "embedding": vec,
        "dimension": len(vec),
        "model": settings.AI_EMBEDDING_MODEL
    }

@app.post("/similarity")
async def compute_similarity_endpoint(
    req: SimilarityRequest,
    x_internal_key: str = Header(None)
):
    """Computes cosine similarity ranking for candidates."""
    verify_internal_token(x_internal_key)
    ranked = rank_candidates(
        source_embedding=req.source_embedding,
        candidates=req.candidate_embeddings,
        high_threshold=settings.SIMILARITY_HIGH_THRESHOLD,
        medium_threshold=settings.SIMILARITY_MEDIUM_THRESHOLD,
        min_threshold=settings.SIMILARITY_LOW_THRESHOLD
    )
    return {"candidates": ranked}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
