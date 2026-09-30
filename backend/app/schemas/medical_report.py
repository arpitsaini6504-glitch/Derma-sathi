from pydantic import BaseModel, Field
from typing import List, Optional

class AbnormalValue(BaseModel):
    parameter: str = Field(..., description="Name of the clinical test parameter")
    value: str = Field(..., description="Observed value and units")
    reference_range: Optional[str] = Field(None, description="Normal reference interval")
    status: str = Field("abnormal", description="'high', 'low', 'abnormal', 'critical', 'normal'")
    clinical_significance: Optional[str] = Field(None, description="Interpretation and context")

class MedicalReportAnalysisResponse(BaseModel):
    success: bool = True
    report_title: str = Field(..., description="Identified report heading or investigation title")
    report_type: str = Field("Diagnostic Lab Report", description="Category of report")
    test_date: Optional[str] = Field(None, description="Investigation date if identified")
    patient_summary: str = Field(..., description="Patient-friendly executive summary")
    key_findings: List[str] = Field(default_factory=list, description="Primary clinical observations")
    abnormal_values: List[AbnormalValue] = Field(default_factory=list, description="Out-of-range parameters")
    normal_values: List[str] = Field(default_factory=list, description="Parameters within safe thresholds")
    doctor_questions: List[str] = Field(default_factory=list, description="Recommended questions for treating doctor")
    urgency_level: str = Field("monitor", description="'routine', 'monitor', 'consult_doctor', 'emergency'")
    conclusion: Optional[str] = Field(None, description="Comprehensive clinical conclusion summarizing key findings and actionable next steps")
    clinical_notes: Optional[str] = Field(None, description="Additional lifestyle or safety guidance")
    clinical_disclaimer: str = (
        "DERMASATHIAI Report Analysis is an assistive AI educational tool and strictly NOT a formal diagnostic evaluation. "
        "Always share this report with your qualified treating physician or dermatologist for clinical interpretation and prescriptions."
    )
    timestamp: str
