from typing import List, Dict
from app.schemas.emergency import (
    EmergencyAssessmentRequest,
    EmergencyAssessmentResponse,
    EmergencyFacilityContact
)

INDIAN_HEALTH_EMERGENCY_CONTACTS = [
    EmergencyFacilityContact(
        name="National Emergency Ambulance Helpline (India)",
        contact_number="112 / 108",
        description="All-in-one national emergency number for immediate ambulance dispatch and trauma care."
    ),
    EmergencyFacilityContact(
        name="National Health Helpline (Ministry of Health & Family Welfare)",
        contact_number="1075 (Toll Free)",
        description="Government health advisory, communicable disease reporting, and emergency guidance."
    ),
    EmergencyFacilityContact(
        name="Poison Information Centre (AIIMS New Delhi)",
        contact_number="1800-116-117 / 011-26589391",
        description="24x7 expert toxicology guidance on acute medication poisoning, overdoses, or chemical reactions."
    )
]

SAMPLE_HEALTHCARE_FACILITIES = [
    {
        "facility_name": "Government Medical College & District Hospital",
        "type": "Public Tertiary Hospital / Dermatology OPD",
        "city": "Pan-India District Level",
        "address": "Nearest District Civil Hospital",
        "teleconsult_available": True,
        "ayushman_bharat_empanelled": True
    },
    {
        "facility_name": "Ayushman Arogya Mandir (Health & Wellness Centre)",
        "type": "Primary Health Centre (PHC)",
        "city": "Sub-district / Rural",
        "address": "Community Primary Care Center",
        "teleconsult_available": True,
        "ayushman_bharat_empanelled": True
    },
    {
        "facility_name": "eSanjeevani National Teleconsultation Service",
        "type": "Government Official Telemedicine",
        "city": "National / Online",
        "address": "https://esanjeevani.mohfw.gov.in",
        "teleconsult_available": True,
        "ayushman_bharat_empanelled": True
    }
]

class TriageService:
    @staticmethod
    def assess_emergency(req: EmergencyAssessmentRequest) -> EmergencyAssessmentResponse:
        actions: List[str] = []
        do_nots: List[str] = []
        is_emergency = False
        priority = "ROUTINE"
        rationale_parts: List[str] = []

        # 1. Critical Red Flag: Anaphylaxis / Angioedema
        if req.has_facial_swelling or req.has_breathing_difficulty:
            is_emergency = True
            priority = "IMMEDIATE_EMERGENCY"
            rationale_parts.append("Facial swelling with respiratory difficulty indicates potential anaphylaxis or severe angioedema.")
            actions.append("Call 112 or 108 immediately or have someone drive you to the nearest emergency department.")
            actions.append("Sit upright to maintain an open airway.")
            do_nots.append("Do not lie flat if breathing is labored.")
            do_nots.append("Do not ingest solid food or oral medications if throat is swelling.")

        # 2. Critical Red Flag: Stevens-Johnson Syndrome (SJS) / Toxic Epidermal Necrolysis (TEN)
        if req.has_peeling_or_mucosal_involvement or req.has_rapid_blistering:
            is_emergency = True
            priority = "IMMEDIATE_EMERGENCY"
            rationale_parts.append(
                "Mucosal involvement (eyes, mouth, genitals) combined with skin peeling or rapid blistering "
                "is a potential hallmark of severe cutaneous adverse reactions (SCARs such as SJS/TEN)."
            )
            actions.append("Go to the nearest emergency trauma center or burn unit immediately.")
            actions.append("Bring all medications, supplements, or antibiotics taken in the past 60 days.")
            do_nots.append("Do not pull or peel off loose skin sheets.")
            do_nots.append("Do not apply topical ointments, home oils, or bandages without emergency doctor supervision.")

        # 3. High Fever with Pain
        if req.has_high_fever and req.has_severe_uncontrollable_pain:
            if not is_emergency:
                priority = "URGENT_EVALUATION"
            rationale_parts.append("High systemic fever with severe localized pain may signify acute necrotizing infection or cellulitis.")
            actions.append("Seek clinical evaluation at an urgent care clinic or hospital OPD within 4-12 hours.")

        if not is_emergency and priority == "ROUTINE":
            rationale_parts.append("No immediate life-threatening emergency dermatological red flags detected.")
            actions.append("Schedule a standard appointment with a board-certified dermatologist.")
            actions.append("Track symptoms with daily photos and notes.")

        do_nots.extend([
            "Do not self-prescribe strong over-the-counter corticosteroid creams without an official doctor review.",
            "Do not scratch or puncture blisters to prevent secondary bacterial superinfections."
        ])

        return EmergencyAssessmentResponse(
            is_emergency=is_emergency,
            triage_priority=priority,
            clinical_rationale=" ".join(rationale_parts),
            immediate_actions=actions,
            emergency_contacts=INDIAN_HEALTH_EMERGENCY_CONTACTS,
            do_not_do_list=list(set(do_nots))
        )

    @staticmethod
    def get_healthcare_access() -> List[Dict]:
        return SAMPLE_HEALTHCARE_FACILITIES
