from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LocationContext(BaseModel):
    district: Optional[str] = None
    block: Optional[str] = None
    village_city: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CandidateChallenge(BaseModel):
    challenge_id: str
    challenge_code: Optional[str] = None
    title: str
    description: str
    category: Optional[str] = None
    embedding: Optional[List[float]] = None

class ChallengePayload(BaseModel):
    challenge_id: str
    challenge_code: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=500)
    description: str = Field(..., min_length=10)
    citizen_category: Optional[str] = None
    severity: Optional[str] = None
    affected_population: Optional[str] = None
    existing_attempts: Optional[str] = None
    expected_outcome: Optional[str] = None
    location_context: Optional[LocationContext] = None
    media_count: Optional[int] = 0
    candidate_pool: Optional[List[CandidateChallenge]] = Field(default_factory=list)

class EmbeddingRequest(BaseModel):
    text: str = Field(..., min_length=1)

class SimilarityRequest(BaseModel):
    source_embedding: List[float]
    candidate_embeddings: List[Dict[str, Any]]
