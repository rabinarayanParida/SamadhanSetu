import re
import logging
from app.schemas.challenge import ChallengePayload
from app.schemas.ai_results import PriorityResult, PriorityFactors
from app.services.openai_client import openai_client
from app.prompts.priority import PRIORITY_SYSTEM_PROMPT, get_priority_user_prompt
from app.utils.safety import format_safe_challenge_xml

logger = logging.getLogger("sicp_ai.priority")

class PriorityService:
    async def prioritize(self, payload: ChallengePayload) -> PriorityResult:
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
                user_prompt = get_priority_user_prompt(safe_xml)
                result_json = await openai_client.call_structured(
                    system_prompt=PRIORITY_SYSTEM_PROMPT,
                    user_prompt=user_prompt
                )
                factors_raw = result_json.get("factors", {})
                factors = PriorityFactors(
                    population_impact=min(25, max(0, int(factors_raw.get("population_impact", 18)))),
                    severity=min(25, max(0, int(factors_raw.get("severity", 18)))),
                    urgency=min(20, max(0, int(factors_raw.get("urgency", 15)))),
                    geographic_impact=min(15, max(0, int(factors_raw.get("geographic_impact", 10)))),
                    feasibility=min(15, max(0, int(factors_raw.get("feasibility", 12))))
                )
                score = factors.population_impact + factors.severity + factors.urgency + factors.geographic_impact + factors.feasibility
                level = "CRITICAL" if score >= 80 else ("HIGH" if score >= 60 else ("MEDIUM" if score >= 40 else "LOW"))

                return PriorityResult(
                    score=score,
                    level=level,
                    confidence=round(float(result_json.get("confidence", 0.88)), 2),
                    factors=factors,
                    explanation=result_json.get("explanation", f"Priority calculated across 5 community impact dimensions resulting in score {score}.")
                )
            except Exception as e:
                logger.warning(f"OpenAI priority scoring failed ({e}). Using local deterministic priority engine.")

        # Local deterministic priority scoring
        return self._local_prioritize(payload)

    def _local_prioritize(self, payload: ChallengePayload) -> PriorityResult:
        text = f"{payload.title} {payload.description} {payload.affected_population or ''}".lower()

        # 1. Population Impact (0 - 25)
        # Parse numbers or population keywords
        pop_score = 12
        numbers = re.findall(r"\b\d+\b", payload.affected_population or "")
        if numbers:
            max_num = max(int(n) for n in numbers)
            if max_num > 1000:
                pop_score = 23
            elif max_num >= 200:
                pop_score = 20
            elif max_num >= 50:
                pop_score = 15
            else:
                pop_score = 10
        elif any(w in text for w in ["entire village", "all residents", "community", "hundreds", "thousands"]):
            pop_score = 21

        # 2. Severity & Harm (0 - 25)
        sev_input = (payload.severity or "medium").lower()
        if sev_input == "critical":
            sev_score = 24
        elif sev_input == "high":
            sev_score = 20
        elif sev_input == "medium":
            sev_score = 14
        else:
            sev_score = 8

        # Severity amplifiers
        if any(w in text for w in ["death", "fatal", "toxic", "poison", "starvation", "outbreak", "epidemic", "electric shock"]):
            sev_score = min(25, sev_score + 4)

        # 3. Urgency & Time-Sensitivity (0 - 20)
        urg_score = 12
        if any(w in text for w in ["immediately", "urgent", "crisis", "emergency", "summer", "monsoon", "flood", "now"]):
            urg_score = 17
        elif sev_input in ["high", "critical"]:
            urg_score = 15

        # 4. Geographic Impact (0 - 15)
        geo_score = 9
        if any(w in text for w in ["block", "district", "regional", "multiple villages", "watershed", "highway"]):
            geo_score = 13
        elif any(w in text for w in ["hamlet", "street", "single well", "one school"]):
            geo_score = 7

        # 5. Feasibility for Technical Intervention (0 - 15)
        # Problems like filtration, solar, school benches, apps, GIS, low-cost repairs are highly feasible
        feas_score = 13
        if any(w in text for w in ["filter", "pump", "solar", "repair", "testing", "monitoring", "training", "water supply"]):
            feas_score = 14

        total_score = min(100, max(0, pop_score + sev_score + urg_score + geo_score + feas_score))
        level = "CRITICAL" if total_score >= 80 else ("HIGH" if total_score >= 60 else ("MEDIUM" if total_score >= 40 else "LOW"))

        factors = PriorityFactors(
            population_impact=pop_score,
            severity=sev_score,
            urgency=urg_score,
            geographic_impact=geo_score,
            feasibility=feas_score
        )

        return PriorityResult(
            score=total_score,
            level=level,
            confidence=0.88,
            factors=factors,
            explanation=f"Evaluated with population impact ({pop_score}/25), severity ({sev_score}/25), urgency ({urg_score}/20), geographic spread ({geo_score}/15), and technical feasibility ({feas_score}/15)."
        )

priority_service = PriorityService()
