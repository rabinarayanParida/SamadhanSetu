import time
import logging
from typing import List, Dict, Any
from app.config import settings
from app.schemas.challenge import ChallengePayload
from app.schemas.ai_results import (
    FullAIAnalysisResponse,
    DuplicateCandidateResult
)
from app.services.classification import classification_service
from app.services.validation import validation_service
from app.services.priority import priority_service
from app.services.routing import routing_service
from app.services.embeddings import embedding_service
from app.utils.similarity import rank_candidates

logger = logging.getLogger("sicp_ai.pipeline")

class AIPipeline:
    async def process_challenge(self, payload: ChallengePayload) -> FullAIAnalysisResponse:
        start_time = time.time()
        logger.info(f"Starting AI pipeline for challenge ID: {payload.challenge_id}")

        try:
            # 1. Classification & Sub-category
            classification = await classification_service.classify(payload)

            # 2. Validation & Quality Assessment
            validation = await validation_service.validate(payload)

            # 3. Deterministic Priority Scoring
            priority = await priority_service.prioritize(payload)

            # 4. Routing Domain Recommendation
            routing = await routing_service.recommend_routing(payload, ai_category=classification.category)

            # 5. Semantic Embedding Generation
            # Combine title, description, and location for maximum semantic representation
            loc_str = ""
            if payload.location_context:
                d = payload.location_context.district or ""
                v = payload.location_context.village_city or ""
                loc_str = f" {d} {v}".strip()

            embedding_text = f"{payload.title}. {payload.description}. {loc_str}"
            embedding = await embedding_service.generate_embedding(embedding_text)

            # 6. Duplicate Candidate Detection
            duplicate_candidates: List[DuplicateCandidateResult] = []
            if payload.candidate_pool:
                candidates_dicts = [
                    {
                        "challenge_id": c.challenge_id,
                        "challenge_code": c.challenge_code,
                        "title": c.title,
                        "description": c.description,
                        "embedding": c.embedding if c.embedding else (await embedding_service.generate_embedding(f"{c.title}. {c.description}"))
                    }
                    for c in payload.candidate_pool
                    if c.challenge_id != payload.challenge_id  # Prevent self-match
                ]

                ranked = rank_candidates(
                    source_embedding=embedding,
                    candidates=candidates_dicts,
                    high_threshold=settings.SIMILARITY_HIGH_THRESHOLD,
                    medium_threshold=settings.SIMILARITY_MEDIUM_THRESHOLD,
                    min_threshold=settings.SIMILARITY_LOW_THRESHOLD
                )

                for r in ranked:
                    duplicate_candidates.append(
                        DuplicateCandidateResult(
                            candidate_id=r["candidate_id"],
                            candidate_code=r.get("candidate_code"),
                            title=r.get("title"),
                            similarity_score=r["similarity_score"],
                            match_tier=r["match_tier"]
                        )
                    )

            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"AI pipeline finished for {payload.challenge_id} in {duration_ms}ms with {len(duplicate_candidates)} duplicate candidates.")

            return FullAIAnalysisResponse(
                challenge_id=payload.challenge_id,
                status="COMPLETED",
                classification=classification,
                validation=validation,
                priority=priority,
                routing=routing,
                duplicate_candidates=duplicate_candidates,
                embedding=embedding,
                model_name=settings.AI_MODEL,
                prompt_version=settings.PROMPT_VERSION,
                pipeline_version=settings.PIPELINE_VERSION,
                processing_duration_ms=duration_ms,
                error_message=None
            )

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"AI pipeline failed for {payload.challenge_id}: {e}", exc_info=True)
            return FullAIAnalysisResponse(
                challenge_id=payload.challenge_id,
                status="FAILED",
                model_name=settings.AI_MODEL,
                prompt_version=settings.PROMPT_VERSION,
                pipeline_version=settings.PIPELINE_VERSION,
                processing_duration_ms=duration_ms,
                error_message=str(e)
            )

pipeline = AIPipeline()
