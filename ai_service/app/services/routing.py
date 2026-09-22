import logging
from app.schemas.challenge import ChallengePayload
from app.schemas.ai_results import RoutingResult
from app.services.openai_client import openai_client
from app.prompts.routing import ROUTING_SYSTEM_PROMPT, get_routing_user_prompt
from app.utils.safety import format_safe_challenge_xml

logger = logging.getLogger("sicp_ai.routing")

class RoutingService:
    async def recommend_routing(self, payload: ChallengePayload, ai_category: str = "") -> RoutingResult:
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
                user_prompt = get_routing_user_prompt(safe_xml)
                result_json = await openai_client.call_structured(
                    system_prompt=ROUTING_SYSTEM_PROMPT,
                    user_prompt=user_prompt
                )
                return RoutingResult(
                    domain=result_json.get("domain", "General Rural & Community Development"),
                    confidence=round(float(result_json.get("confidence", 0.90)), 2),
                    explanation=result_json.get("explanation", "Recommended domain based on core societal challenge characteristics.")
                )
            except Exception as e:
                logger.warning(f"OpenAI routing recommendation failed ({e}). Using local routing engine.")

        # Local deterministic routing engine
        return self._local_route(payload, ai_category)

    def _local_route(self, payload: ChallengePayload, ai_category: str) -> RoutingResult:
        category = ai_category or payload.citizen_category or "Other"

        domain_mappings = {
            "Water Resources": (
                "Drinking Water & Sanitation / Rural Development Department",
                "Primary mandate involves rural drinking water, groundwater recharge, and handpump/borewell maintenance."
            ),
            "Healthcare": (
                "Department of Health, Medical Education & Family Welfare",
                "Concerns primary health centers, medical staffing, and disease mitigation in rural communities."
            ),
            "Agriculture": (
                "Department of Agriculture, Animal Husbandry & Co-operative",
                "Pertains to crop protection, soil health, irrigation channels, and farmer livelihoods."
            ),
            "Sanitation": (
                "Urban Local Bodies / Swachh Bharat Mission (Gramin)",
                "Responsible for municipal solid waste management, sewage clearance, and sanitation infrastructure."
            ),
            "Education": (
                "Department of School Education & Literacy",
                "Governs public school buildings, student amenities, and rural educational resources."
            ),
            "Energy": (
                "Jharkhand Renewable Energy Development Agency (JREDA) / Department of Energy",
                "Oversees rural electrification, solar installations, and grid transformer maintenance."
            ),
            "Urban Development": (
                "Urban Development & Housing Department / Road Construction",
                "Handles urban civic roads, street lighting, storm water drainage, and public utilities."
            ),
            "Rural Livelihoods": (
                "Jharkhand State Livelihood Promotion Society (JSLPS) / Rural Development",
                "Supports women's SHGs, artisan clusters, and local employment initiatives."
            ),
            "Environment": (
                "Department of Forest, Environment & Climate Change",
                "Mandated for forest conservation, industrial pollution regulation, and ecological balance."
            ),
            "Accessibility": (
                "Department of Women, Child Development & Social Security",
                "Addresses disability accessibility guidelines and welfare infrastructure in public facilities."
            ),
            "Public Administration": (
                "Department of Personnel, Administrative Reforms & Rajbhasha",
                "Focuses on civic grievance redressal, transparency, and public service delivery."
            ),
            "Other": (
                "General Rural & Community Development / District Administration",
                "Cross-departmental community challenge requiring coordination by District Collectorate."
            )
        }

        domain, explanation = domain_mappings.get(category, domain_mappings["Other"])

        return RoutingResult(
            domain=domain,
            confidence=0.91,
            explanation=explanation
        )

routing_service = RoutingService()
