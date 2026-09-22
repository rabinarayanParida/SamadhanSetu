import re
import logging
from app.schemas.challenge import ChallengePayload
from app.schemas.ai_results import ClassificationResult
from app.services.openai_client import openai_client
from app.prompts.classification import CLASSIFICATION_SYSTEM_PROMPT, get_classification_user_prompt
from app.utils.safety import format_safe_challenge_xml

logger = logging.getLogger("sicp_ai.classification")

VALID_CATEGORIES = [
    "Education", "Healthcare", "Agriculture", "Water Resources", "Sanitation",
    "Environment", "Energy", "Urban Development", "Rural Livelihoods",
    "Accessibility", "Public Administration", "Other"
]

class ClassificationService:
    async def classify(self, payload: ChallengePayload) -> ClassificationResult:
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
                user_prompt = get_classification_user_prompt(safe_xml)
                result_json = await openai_client.call_structured(
                    system_prompt=CLASSIFICATION_SYSTEM_PROMPT,
                    user_prompt=user_prompt
                )
                
                cat = result_json.get("category", "Other")
                if cat not in VALID_CATEGORIES:
                    # Match closest or fallback to Other
                    cat = "Other"
                    
                return ClassificationResult(
                    category=cat,
                    subcategory=result_json.get("subcategory", "General Community Need"),
                    confidence=round(float(result_json.get("confidence", 0.85)), 2)
                )
            except Exception as e:
                logger.warning(f"OpenAI classification failed ({e}). Using local classification engine.")

        # Local deterministic classification engine
        return self._local_classify(payload)

    def _local_classify(self, payload: ChallengePayload) -> ClassificationResult:
        text = f"{payload.title} {payload.description}".lower()

        keywords = {
            "Water Resources": [
                ("Drinking Water Shortage", ["drinking water", "potable water", "hand pump", "borewell", "fluoride", "tap water", "water tanker", "handpump", "well water", "no water"]),
                ("Irrigation Water", ["canal", "irrigation", "dam", "groundwater level", "water catchment"])
            ],
            "Healthcare": [
                ("Rural Primary Healthcare", ["phc", "health center", "dispensary", "doctor", "medicine", "clinic", "hospital", "ambulance"]),
                ("Maternal & Child Health", ["maternal", "infant", "malnutrition", "vaccination", "immunization"]),
                ("Disease Outbreak", ["fever", "dengue", "malaria", "epidemic", "infection", "contaminated water illness"])
            ],
            "Agriculture": [
                ("Crop & Soil Management", ["crop", "paddy", "soil", "fertilizer", "pest", "farmer", "seeds", "harvest"]),
                ("Agricultural Storage & Market Access", ["mandi", "cold storage", "produce", "grain storage"])
            ],
            "Sanitation": [
                ("Solid Waste Management", ["garbage", "dump", "trash", "waste collection", "plastic waste"]),
                ("Sewage & Drainage", ["drainage", "sewer", "open defecation", "toilet", "hygiene", "clogged drain"])
            ],
            "Education": [
                ("School Infrastructure", ["school", "classroom", "blackboard", "desk", "toilet in school", "roof leaking school"]),
                ("Teacher Availability & Learning", ["teacher", "student", "literacy", "books", "attendance", "computer lab"])
            ],
            "Energy": [
                ("Rural Electrification", ["electricity", "power outage", "transformer", "pole", "blackout", "load shedding"]),
                ("Renewable Energy", ["solar", "solar lamp", "microgrid", "wind"])
            ],
            "Urban Development": [
                ("Civic Infrastructure & Roads", ["road", "pothole", "street light", "streetlight", "traffic", "bridge", "connectivity"])
            ],
            "Rural Livelihoods": [
                ("Artisan & Skill Development", ["handloom", "weaver", "artisan", "self-help", "shg", "employment", "livelihood", "rural employment"])
            ],
            "Environment": [
                ("Pollution & Forest Conservation", ["pollution", "forest", "tree", "river pollution", "smoke", "factory waste", "soil erosion"])
            ],
            "Accessibility": [
                ("Disability Access & Public Amenities", ["disability", "wheelchair", "ramp", "accessible", "blind", "differently abled"])
            ],
            "Public Administration": [
                ("Public Service Delivery & Governance", ["ration", "pension", "bribes", "panchayat", "caste certificate", "schemes", "delay"])
            ]
        }

        # Check matched domains
        best_category = "Other"
        best_subcategory = "General Societal Issue"
        best_matches = 0

        for cat, subcats in keywords.items():
            for subcat, terms in subcats:
                matches = sum(1 for term in terms if term in text)
                if matches > best_matches:
                    best_matches = matches
                    best_category = cat
                    best_subcategory = subcat

        # If citizen category was already supplied and has some plausibility, consider it
        confidence = 0.92 if best_matches >= 2 else (0.80 if best_matches == 1 else 0.65)
        if best_matches == 0 and payload.citizen_category and payload.citizen_category in VALID_CATEGORIES:
            best_category = payload.citizen_category
            best_subcategory = f"Community {payload.citizen_category}"
            confidence = 0.70

        return ClassificationResult(
            category=best_category,
            subcategory=best_subcategory,
            confidence=confidence
        )

classification_service = ClassificationService()
