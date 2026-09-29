from typing import List, Dict
from app.schemas.medications import (
    DrugInteractionRequest,
    DrugSafetyResponse,
    InteractionAlert,
    DrugProfile
)

DRUG_DATABASE: Dict[str, Dict] = {
    "isotretinoin": {
        "category": "Oral Retinoid",
        "uses": "Severe nodular or recalcitrant acne.",
        "precautions": ["Absolute contraindication in pregnancy (teratogenic)", "Monitor lipid panel and liver enzymes", "Strict sun avoidance"],
        "side_effects": ["Severe dryness of lips/mucosa", "Photosensitivity", "Elevated triglycerides"]
    },
    "hydrocortisone": {
        "category": "Mild Topical Corticosteroid",
        "uses": "Temporary relief of itching and mild dermatitis.",
        "precautions": ["Do not use for more than 7-14 consecutive days without medical supervision", "Avoid applying near eyelids/eyes"],
        "side_effects": ["Skin thinning (atrophy) with prolonged misuse", "Telangiectasia", "Steroid rebound"]
    },
    "clobetasol": {
        "category": "Super-Potent Topical Corticosteroid",
        "uses": "Short-term treatment of inflammatory and pruritic manifestations of moderate-to-severe dermatoses (e.g. plaque psoriasis).",
        "precautions": ["Never apply to the face, groin, or axillae", "Never use under occlusion without physician advice", "Limit use to 2 consecutive weeks"],
        "side_effects": ["Hypothalamic-pituitary-adrenal axis suppression", "Striae", "Skin atrophy"]
    },
    "doxycycline": {
        "category": "Oral Tetracycline Antibiotic",
        "uses": "Moderate-to-severe inflammatory acne vulgaris, rosacea.",
        "precautions": ["High photosensitivity risk - use broad-spectrum sunscreen", "Do not take concurrently with oral retinoids (risk of pseudotumor cerebri)", "Take with full glass of water sitting upright"],
        "side_effects": ["Esophageal irritation", "Sunburn susceptibility", "Nausea"]
    },
    "benzoyl peroxide": {
        "category": "Topical Antimicrobial & Keratolytic",
        "uses": "Mild to moderate acne vulgaris.",
        "precautions": ["May bleach clothing, towels, and hair", "Can cause significant skin dryness and irritation in early weeks"],
        "side_effects": ["Erythema", "Contact dermatitis", "Peeling"]
    },
    "ketoconazole": {
        "category": "Topical/Oral Antifungal",
        "uses": "Cutaneous candidiasis, tinea corporis, seborrheic dermatitis.",
        "precautions": ["For topical formulations, avoid contact with conjunctiva"],
        "side_effects": ["Mild burning sensation", "Pruritus"]
    }
}

INTERACTION_RULES = [
    {
        "pair": {"isotretinoin", "doxycycline"},
        "severity": "high",
        "clinical_effect": "Combining oral retinoids (isotretinoin) and tetracyclines (doxycycline) dramatically increases the risk of benign intracranial hypertension (Pseudotumor Cerebri).",
        "recommendation": "DO NOT combine these medications. This combination is strictly contraindicated."
    },
    {
        "pair": {"tretinoin", "benzoyl peroxide"},
        "severity": "moderate",
        "clinical_effect": "Co-applying standard tretinoin and benzoyl peroxide simultaneously can degrade tretinoin molecules and exacerbate severe irritant contact dermatitis.",
        "recommendation": "Separate application times: Apply benzoyl peroxide in the morning and tretinoin at bedtime, or consult your dermatologist for micro-encapsulated formulations."
    }
]

class MedicationService:
    @staticmethod
    def check_safety(req: DrugInteractionRequest) -> DrugSafetyResponse:
        input_drugs = [d.lower().strip() for d in req.medications]
        matched_profiles: List[DrugProfile] = []
        interaction_alerts: List[InteractionAlert] = []
        allergy_warnings: List[str] = []
        condition_precautions: List[str] = []

        # Find profiles
        for drug_name in input_drugs:
            for db_key, db_val in DRUG_DATABASE.items():
                if db_key in drug_name or drug_name in db_key:
                    matched_profiles.append(
                        DrugProfile(
                            name=db_key.capitalize(),
                            category=db_val["category"],
                            common_skin_uses=db_val["uses"],
                            general_safety_precautions=db_val["precautions"],
                            potential_side_effects=db_val["side_effects"]
                        )
                    )

        # Check interactions
        for rule in INTERACTION_RULES:
            rule_pair = rule["pair"]
            # Check if all drugs in pair are present in user list
            found_count = 0
            for r_drug in rule_pair:
                if any(r_drug in d for d in input_drugs):
                    found_count += 1
            if found_count == len(rule_pair):
                interaction_alerts.append(
                    InteractionAlert(
                        drugs_involved=list(rule_pair),
                        severity=rule["severity"],
                        clinical_effect=rule["clinical_effect"],
                        recommendation=rule["recommendation"]
                    )
                )

        # Check allergies
        for allergy in req.allergies:
            al_clean = allergy.lower().strip()
            for drug_name in input_drugs:
                if al_clean and (al_clean in drug_name or drug_name in al_clean):
                    allergy_warnings.append(
                        f"CRITICAL: You reported an allergy to '{allergy}', which matches your medication '{drug_name}'."
                    )

        # Check pregnancy precautions
        is_pregnant = any("pregnan" in c.lower() for c in req.patient_conditions)
        if is_pregnant:
            for drug_name in input_drugs:
                if "isotretinoin" in drug_name or "retin" in drug_name:
                    condition_precautions.append(
                        "CRITICAL CONTRAINDICATION: Retinoids are teratogenic and strictly contraindicated during pregnancy or planned pregnancy."
                    )

        safe_to_combine = len(interaction_alerts) == 0 and len(allergy_warnings) == 0

        return DrugSafetyResponse(
            safe_to_combine=safe_to_combine,
            interaction_alerts=interaction_alerts,
            allergy_warnings=allergy_warnings,
            condition_precautions=condition_precautions,
            identified_drugs=matched_profiles
        )
