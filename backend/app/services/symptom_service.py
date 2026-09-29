from typing import List
from app.schemas.symptoms import SymptomCheckRequest, SymptomCheckResponse, SymptomDifferential

SYMPTOM_KNOWLEDGE_BASE = [
    {
        "name": "Contact / Atopic Dermatitis (Eczema)",
        "keywords": ["itching", "redness", "dryness", "scaling", "flaking", "cracking"],
        "summary": "Inflammatory reaction triggered by irritants, allergens, or skin barrier breakdown.",
        "triggers": ["Soaps", "Detergents", "Fragrances", "Weather changes", "Stress"],
        "relevance": "high"
    },
    {
        "name": "Tinea Corporis / Cruris (Fungal Ringworm)",
        "keywords": ["ring", "annular", "itching", "red border", "groin", "sweat"],
        "summary": "Fungal skin infection prevalent in warm, humid climates.",
        "triggers": ["Excessive perspiration", "Tight synthetic clothing", "Sharing towels/linen"],
        "relevance": "moderate"
    },
    {
        "name": "Psoriasis (Plaque)",
        "keywords": ["silvery scales", "thick patches", "elbows", "knees", "scalp", "itching"],
        "summary": "Autoimmune condition accelerating skin cellular turnover.",
        "triggers": ["Infections", "Cold weather", "Skin injury (Koebner)", "Stress"],
        "relevance": "moderate"
    },
    {
        "name": "Urticaria (Hives)",
        "keywords": ["welts", "wheals", "swelling", "sudden itching", "transient"],
        "summary": "Allergic or idiopathic histamine release leading to raised itchy swellings.",
        "triggers": ["Food allergies", "Medications", "Insect bites", "Heat/cold exposure"],
        "relevance": "moderate"
    }
]

class SymptomService:
    @staticmethod
    def evaluate(req: SymptomCheckRequest) -> SymptomCheckResponse:
        red_flags: List[str] = []
        triage_level = "routine"

        # Check Red Flags
        if req.has_fever and req.has_rapid_spread:
            red_flags.append("High fever accompanying rapid skin spread may signify systemic infection (e.g. cellulitis or erysipelas).")
            triage_level = "emergency"

        if req.has_pain_or_bleeding:
            red_flags.append("Severe pain, ulceration, or spontaneous bleeding requires prompt clinical inspection.")
            if triage_level != "emergency":
                triage_level = "prompt_consult"

        if req.severity == "severe":
            if triage_level != "emergency":
                triage_level = "prompt_consult"

        # Match differentials
        matched_differentials: List[SymptomDifferential] = []
        user_symptoms_lower = [s.lower().strip() for s in req.symptoms]

        for item in SYMPTOM_KNOWLEDGE_BASE:
            score = 0
            for kw in item["keywords"]:
                if any(kw in sym for sym in user_symptoms_lower):
                    score += 1
            if score > 0:
                matched_differentials.append(
                    SymptomDifferential(
                        condition_name=item["name"],
                        educational_summary=item["summary"],
                        relevance_level="high" if score >= 2 else "moderate",
                        common_triggers=item["triggers"]
                    )
                )

        if not matched_differentials:
            matched_differentials.append(
                SymptomDifferential(
                    condition_name="Nonspecific Dermatitis / Pruritus",
                    educational_summary="General skin irritation requiring clinical dermatological evaluation.",
                    relevance_level="moderate",
                    common_triggers=["Environmental allergens", "Skin barrier dryness", "Friction"]
                )
            )

        precautions = [
            "Avoid scratching or rubbing to protect the skin barrier from secondary bacterial infection.",
            "Use lukewarm water rather than hot water when washing the area.",
            "Apply a plain, fragrance-free emollient or moisturizer immediately after bathing.",
            "Avoid applying unprescribed potent corticosteroid creams or home concoctions."
        ]

        if triage_level == "emergency":
            referral = "Immediate hospital emergency department evaluation is recommended due to systemic red flags."
        elif triage_level == "prompt_consult":
            referral = "In-person consultation with a qualified dermatologist within 24-48 hours is recommended."
        else:
            referral = "Schedule a routine consultation with your primary healthcare provider or dermatologist."

        return SymptomCheckResponse(
            triage_level=triage_level,
            differentials=matched_differentials,
            red_flags=red_flags,
            self_care_precautions=precautions,
            referral_guidance=referral
        )
