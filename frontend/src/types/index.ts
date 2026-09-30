export type SupportedLanguage =
  | 'en' // English
  | 'hi' // Hindi
  | 'mr' // Marathi
  | 'bn' // Bengali
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'ml' // Malayalam
  | 'kn' // Kannada
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'as' // Assamese
  | 'or'; // Odia

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  preferred_language: SupportedLanguage;
  role: string;
}

export interface ImageQualityMetrics {
  is_acceptable: boolean;
  blur_score: number;
  is_blurry: boolean;
  brightness_score: number;
  is_underexposed: boolean;
  is_overexposed: boolean;
  resolution: [number, number];
  feedback_messages: string[];
}

export interface CandidateFinding {
  category_name: string;
  calibrated_probability: number;
  general_information: string;
  typical_clinical_features: string[];
}

export interface ReferralRecommendation {
  urgency: 'routine' | 'prompt_consult' | 'emergency';
  recommended_timeframe: string;
  recommended_specialist: string;
  actionable_instructions: string[];
  red_flags_present: string[];
}

export interface SkinAnalysisResponse {
  status: 'SUCCESS' | 'ABSTAINED_LOW_QUALITY' | 'ABSTAINED_HIGH_UNCERTAINTY' | 'MODEL_PENDING_INTEGRATION';
  quality_gate: ImageQualityMetrics;
  findings: CandidateFinding[];
  uncertainty_score: number | null;
  abstained: boolean;
  abstention_reason: string | null;
  referral: ReferralRecommendation;
  clinical_disclaimer: string;
  timestamp: string;
}

export interface SkinAnalysisMLResponse {
  status: 'MODEL_NOT_AVAILABLE' | 'SUCCESS' | 'ABSTAINED' | string;
  prediction: string | null;
  raw_probability: number | null;
  calibrated_confidence: number | null;
  uncertainty: number | null;
  requires_professional_review: boolean;
  model_version: string | null;
  message: string;
}

export interface SymptomDifferential {
  condition_name: string;
  educational_summary: string;
  relevance_level: 'high' | 'moderate' | 'low';
  common_triggers: string[];
}

export interface SymptomCheckResponse {
  triage_level: 'emergency' | 'prompt_consult' | 'routine';
  differentials: SymptomDifferential[];
  red_flags: string[];
  self_care_precautions: string[];
  referral_guidance: string;
  disclaimer: string;
}

export interface InteractionAlert {
  drugs_involved: string[];
  severity: 'high' | 'moderate' | 'low';
  clinical_effect: string;
  recommendation: string;
}

export interface DrugProfile {
  name: string;
  category: string;
  common_skin_uses: string;
  general_safety_precautions: string[];
  potential_side_effects: string[];
}

export interface DrugSafetyResponse {
  safe_to_combine: boolean;
  interaction_alerts: InteractionAlert[];
  allergy_warnings: string[];
  condition_precautions: string[];
  identified_drugs: DrugProfile[];
  clinical_disclaimer: string;
}

export interface HerbGuidance {
  herb_name: string;
  sanskrit_name: string;
  skin_benefits: string;
  usage_guidance: string;
  safety_precautions: string;
}

export interface LifestyleGuidanceResponse {
  concern_analysis: string;
  ayurvedic_perspective: string;
  dietary_recommendations: string[];
  lifestyle_practices: string[];
  traditional_topical_care: HerbGuidance[];
  evidence_based_prevention: string[];
  cautionary_note: string;
}

export interface EmergencyContact {
  name: string;
  contact_number: string;
  description: string;
}

export interface EmergencyAssessmentResponse {
  is_emergency: boolean;
  triage_priority: 'IMMEDIATE_EMERGENCY' | 'URGENT_EVALUATION' | 'ROUTINE';
  clinical_rationale: string;
  immediate_actions: string[];
  emergency_contacts: EmergencyContact[];
  do_not_do_list: string[];
  disclaimer: string;
}

export interface HealthcareFacility {
  facility_name: string;
  type: string;
  city: string;
  address: string;
  teleconsult_available: boolean;
  ayushman_bharat_empanelled: boolean;
}

export interface AbnormalValue {
  parameter: string;
  value: string;
  reference_range?: string;
  status: 'abnormal' | 'high' | 'low' | 'critical' | 'normal';
  clinical_significance?: string;
}

export interface MedicalReportAnalysisResponse {
  success: boolean;
  report_title: string;
  report_type: string;
  test_date?: string;
  patient_summary: string;
  key_findings: string[];
  abnormal_values: AbnormalValue[];
  normal_values: string[];
  doctor_questions: string[];
  urgency_level: 'routine' | 'monitor' | 'consult_doctor' | 'emergency';
  conclusion?: string;
  clinical_notes?: string;
  clinical_disclaimer: string;
  timestamp: string;
}

export interface ReportAnalyzerStatus {
  gemini_configured: boolean;
  model: string;
  supported_formats: string[];
  max_upload_size_mb: number;
}

export interface PrescriptionMedicineItem {
  id?: number;
  medicine_name: string;
  strength?: string;
  dosage?: string;
  dosage_unit?: string;
  frequency?: string;
  route?: string;
  timing: string[];
  duration?: string;
  quantity?: string;
  special_instructions?: string;
  is_verified: boolean;
  is_unclear: boolean;
  unclear_reason?: string;
}

export interface PrescriptionAnalysisResponse {
  status: string;
  prescription_id: number;
  filename: string;
  requires_user_confirmation: boolean;
  doctor_name?: string;
  clinic_or_hospital?: string;
  prescription_date?: string;
  patient_name?: string;
  diagnosis_or_symptoms?: string;
  medicines: PrescriptionMedicineItem[];
  general_advice?: string;
  confidence_notes?: string;
  clinical_safety_notice: string;
  timestamp: string;
}

export interface MedicationScheduleResponse {
  id: number;
  prescription_id?: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  times_of_day: string[];
  start_date: string;
  end_date?: string;
  duration_days?: number;
  special_instructions?: string;
  is_active: boolean;
  created_at: string;
}

export interface MedicationReminderItem {
  id: number;
  schedule_id: number;
  prescription_id?: number;
  medicine_name: string;
  dosage: string;
  scheduled_time: string;
  scheduled_date: string;
  status: 'scheduled' | 'taken' | 'skipped' | 'snoozed' | 'missed';
  action_timestamp?: string;
  special_instructions?: string;
}

export interface ReminderActionResponse {
  success: boolean;
  reminder_id: number;
  status: string;
  safety_message: string;
  action_timestamp: string;
}


