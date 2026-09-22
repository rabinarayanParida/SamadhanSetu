import re
import logging
from app.schemas.challenge import ChallengePayload
from app.schemas.ai_results import ValidationResult
from app.services.openai_client import openai_client
from app.prompts.validation import VALIDATION_SYSTEM_PROMPT, get_validation_user_prompt
from app.utils.safety import format_safe_challenge_xml, contains_prompt_injection_signals

logger = logging.getLogger("sicp_ai.validation")

class ValidationService:
    async def validate(self, payload: ChallengePayload) -> ValidationResult:
        safe_xml = format_safe_challenge_xml(
            title=payload.title,
            description=payload.description,
            citizen_category=payload.citizen_category or "",
            severity=payload.severity or "",
            affected_population=payload.affected_population or "",
            existing_attempts=payload.existing_attempts or "",
            expected_outcome=payload.expected_outcome or "",
            location_context=payload.location_context.dict() if payload.location_context else None
        )

        if openai_client.is_configured():
            try:
                user_prompt = get_validation_user_prompt(safe_xml)
                result_json = await openai_client.call_structured(
                    system_prompt=VALIDATION_SYSTEM_PROMPT,
                    user_prompt=user_prompt
                )
                return ValidationResult(
                    is_valid=bool(result_json.get("is_valid", True)),
                    quality_score=int(result_json.get("quality_score", 75)),
                    confidence=round(float(result_json.get("confidence", 0.88)), 2),
                    missing_information=result_json.get("missing_information", []),
                    warnings=result_json.get("warnings", [])
                )
            except Exception as e:
                logger.warning(f"OpenAI validation failed ({e}). Using local validation engine.")

        # Local deterministic validation assessment
        return self._local_validate(payload)

    def _local_validate(self, payload: ChallengePayload) -> ValidationResult:
        missing_info = []
        warnings = []
        score = 80

        # Check prompt injection signals
        combined_text = f"{payload.title} {payload.description}"
        if contains_prompt_injection_signals(combined_text):
            warnings.append("Potential instruction override pattern detected in text; treated strictly as problem content.")
            score -= 10

        # Check description length
        words = payload.description.split()
        if len(words) < 15:
            missing_info.append("Detailed description of how the issue manifests daily")
            score -= 20
        elif len(words) >= 40:
            score += 5

        # Check location context
        loc = payload.location_context
        if not loc or not (loc.district or loc.village_city or loc.address):
            missing_info.append("Precise location, village name, or landmark")
            score -= 15

        # Check affected population
        if not payload.affected_population or len(payload.affected_population.strip()) < 2:
            missing_info.append("Estimated number of affected community members")
            score -= 10

        # Check existing attempts & expected outcome
        if not payload.existing_attempts or len(payload.existing_attempts.strip()) < 5:
            warnings.append("Prior administrative or community intervention attempts not fully described")
        if not payload.expected_outcome or len(payload.expected_outcome.strip()) < 5:
            warnings.append("Expected specific resolution outcome not detailed")

        # Check media evidence
        if (payload.media_count or 0) == 0:
            warnings.append("No photos or video evidence uploaded; on-ground visual verification recommended")

        # Clamp quality score
        quality_score = max(20, min(95, score))
        is_valid = quality_score >= 35

        return ValidationResult(
            is_valid=is_valid,
            quality_score=quality_score,
            confidence=0.89,
            missing_information=missing_info,
            warnings=warnings
        )

validation_service = ValidationService()
