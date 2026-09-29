from typing import Dict, List, Optional
from app.schemas.skin_analysis import (
    CandidateFinding,
    ReferralRecommendation,
    SkinAnalysisResponse,
    ImageQualityMetrics
)
from datetime import datetime, timezone

# Curated, evidence-aligned dermatological educational profiles
DERM_EDUCATIONAL_KNOWLEDGE = {
    "Eczema": {
        "info": "A chronic inflammatory condition marked by dry, itchy, red patches of skin, often associated with atopic tendencies.",
        "features": ["Intense pruritus (itching)", "Dry skin barrier", "Erythematous plaques", "Flexural crease involvement"]
    },
    "Psoriasis": {
        "info": "An autoimmune disorder characterized by rapid skin cell buildup, producing thick silvery scales and localized inflammation.",
        "features": ["Silvery micaceous scaling", "Well-demarcated red plaques", "Common on extensor surfaces (elbows, knees)", "Nail pitting"]
    },
    "Tinea Ringworm": {
        "info": "A contagious superficial fungal infection affecting the top layer of skin, scalp, or groin.",
        "features": ["Annular ring-like lesion", "Active scaly erythematous border", "Central clearing", "Pruritic sensation"]
    },
    "Acne Vulgaris": {
        "info": "A multifactorial disorder of the pilosebaceous unit involving sebum excess, follicular hyperkeratinization, and Cutibacterium acnes.",
        "features": ["Comedones (blackheads/whiteheads)", "Inflammatory papules", "Pustules", "Occasional nodulocystic lesions"]
    },
    "Urticaria": {
        "info": "Transient erythematous, edematous wheals triggered by histamine release from mast cells in response to allergens or physical stimuli.",
        "features": ["Evanescent wheals (individual lesions resolve < 24h)", "Intense itching", "Blanching redness"]
    },
    "Melanocytic Nevi": {
        "info": "Common benign proliferations of pigment-producing melanocytes, varying in color from tan to dark brown.",
        "features": ["Uniform color", "Symmetric border", "Stable diameter < 6mm", "Regular shape"]
    },
    "Normal / Benign": {
        "info": "Skin tissue exhibits typical healthy epithelial morphology without acute signs of active inflammatory dermatosis.",
        "features": ["Intact epidermal barrier", "Even tone without focal inflammation", "Absence of persistent induration"]
    }
}

class ClinicalSafetyLayer:
    """
    Stage 7 & 8 in Skin Analysis Pipeline:
    Converts raw statistical model outputs and quality gate results into
    ethical, harm-reduced, professional healthcare guidance.
    """
    def synthesize_response(
        self,
        status: str,
        quality_metrics: ImageQualityMetrics,
        abstained: bool,
        abstention_reason: Optional[str],
        uncertainty_score: Optional[float],
        calibrated_probs: Optional[Dict[str, float]]
    ) -> SkinAnalysisResponse:
        findings: List[CandidateFinding] = []
        red_flags: List[str] = []

        if not abstained and calibrated_probs:
            # Sort categories by calibrated confidence
            sorted_items = sorted(calibrated_probs.items(), key=lambda x: x[1], reverse=True)
            for cat_name, prob in sorted_items[:3]:
                edu = DERM_EDUCATIONAL_KNOWLEDGE.get(cat_name, {
                    "info": "Dermatological condition requiring clinical evaluation.",
                    "features": ["Requires in-person physical examination"]
                })
                findings.append(
                    CandidateFinding(
                        category_name=cat_name,
                        calibrated_probability=round(prob, 3),
                        general_information=edu["info"],
                        typical_clinical_features=edu["features"]
                    )
                )

        # Formulate triage urgency and referral recommendation
        urgency = "routine"
        timeframe = "Consult a primary doctor or dermatologist at your convenience for routine skin wellness."
        instructions = [
            "Keep the affected area clean, dry, and avoid aggressive scratching.",
            "Do not apply unverified chemical bleach or high-potency steroid creams without a prescription.",
            "Take high-resolution photos over successive days to track any changes for your doctor."
        ]

        if not quality_metrics.is_acceptable:
            urgency = "routine"
            timeframe = "Retake photo following camera clarity instructions before seeking digital triage."
            instructions.insert(0, "Retake photo in natural daylight with steady camera focus.")
        elif status == "MODEL_PENDING_INTEGRATION":
            urgency = "routine"
            timeframe = "Routine physician consultation recommended for accurate in-person diagnosis."
            instructions.append("Our ML model pipeline is in active staging. Please consult a registered dermatologist.")

        referral = ReferralRecommendation(
            urgency=urgency,
            recommended_timeframe=timeframe,
            recommended_specialist="Qualified Dermatologist / Medical Practitioner",
            actionable_instructions=instructions,
            red_flags_present=red_flags
        )

        return SkinAnalysisResponse(
            status=status,
            quality_gate=quality_metrics,
            findings=findings,
            uncertainty_score=uncertainty_score,
            abstained=abstained,
            abstention_reason=abstention_reason,
            referral=referral,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
