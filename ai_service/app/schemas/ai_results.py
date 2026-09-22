from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ClassificationResult(BaseModel):
    category: str
    subcategory: str
    confidence: float = Field(..., ge=0.0, le=1.0)

class ValidationResult(BaseModel):
    is_valid: bool
    quality_score: int = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0.0, le=1.0)
    missing_information: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class PriorityFactors(BaseModel):
    population_impact: int = Field(..., ge=0, le=25)
    severity: int = Field(..., ge=0, le=25)
    urgency: int = Field(..., ge=0, le=20)
    geographic_impact: int = Field(..., ge=0, le=15)
    feasibility: int = Field(..., ge=0, le=15)

class PriorityResult(BaseModel):
    score: int = Field(..., ge=0, le=100)
    level: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    confidence: float = Field(..., ge=0.0, le=1.0)
    factors: PriorityFactors
    explanation: str

class RoutingResult(BaseModel):
    domain: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: str

class DuplicateCandidateResult(BaseModel):
    candidate_id: str
    candidate_code: Optional[str] = None
    title: Optional[str] = None
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    match_tier: str = Field(..., pattern="^(HIGH|MEDIUM|LOW)$")

class FullAIAnalysisResponse(BaseModel):
    challenge_id: str
    status: str = Field(..., pattern="^(COMPLETED|FAILED)$")
    classification: Optional[ClassificationResult] = None
    validation: Optional[ValidationResult] = None
    priority: Optional[PriorityResult] = None
    routing: Optional[RoutingResult] = None
    duplicate_candidates: List[DuplicateCandidateResult] = Field(default_factory=list)
    embedding: Optional[List[float]] = None
    model_name: str
    prompt_version: str
    pipeline_version: str
    processing_duration_ms: int = 0
    error_message: Optional[str] = None
