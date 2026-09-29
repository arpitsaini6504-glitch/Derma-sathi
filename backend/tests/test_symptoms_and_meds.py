from app.services.symptom_service import SymptomService
from app.schemas.symptoms import SymptomCheckRequest
from app.services.medication_service import MedicationService
from app.schemas.medications import DrugInteractionRequest

def test_symptom_service_detects_emergency_red_flags():
    req = SymptomCheckRequest(
        symptoms=["rapid spreading red rash", "high fever", "pain"],
        has_fever=True,
        has_rapid_spread=True,
        has_pain_or_bleeding=True,
        severity="severe"
    )
    res = SymptomService.evaluate(req)
    assert res.triage_level == "emergency"
    assert len(res.red_flags) >= 1
    assert "immediate hospital emergency" in res.referral_guidance.lower()

def test_symptom_service_routine_assessment():
    req = SymptomCheckRequest(
        symptoms=["itching", "dry skin on elbows"],
        has_fever=False,
        has_rapid_spread=False,
        has_pain_or_bleeding=False,
        severity="mild"
    )
    res = SymptomService.evaluate(req)
    assert res.triage_level == "routine"
    assert len(res.red_flags) == 0
    assert any("Eczema" in diff.condition_name for diff in res.differentials)

def test_medication_service_flags_contraindicated_pair():
    # Isotretinoin + Doxycycline combo (Pseudotumor cerebri risk)
    req = DrugInteractionRequest(
        medications=["isotretinoin 20mg", "doxycycline 100mg"]
    )
    res = MedicationService.check_safety(req)
    assert res.safe_to_combine is False
    assert len(res.interaction_alerts) >= 1
    alert = res.interaction_alerts[0]
    assert alert.severity == "high"
    assert "pseudotumor" in alert.clinical_effect.lower()

def test_medication_service_pregnancy_warning():
    req = DrugInteractionRequest(
        medications=["isotretinoin"],
        patient_conditions=["pregnancy"]
    )
    res = MedicationService.check_safety(req)
    assert len(res.condition_precautions) >= 1
    assert any("teratogenic" in p.lower() for p in res.condition_precautions)
