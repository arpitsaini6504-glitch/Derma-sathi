import {
  SkinAnalysisResponse,
  ImageQualityMetrics,
  SymptomCheckResponse,
  DrugSafetyResponse,
  LifestyleGuidanceResponse,
  EmergencyAssessmentResponse,
  HealthcareFacility,
  User,
  MedicalReportAnalysisResponse,
  ReportAnalyzerStatus,
  PrescriptionAnalysisResponse,
  MedicationScheduleResponse,
  MedicationReminderItem,
  ReminderActionResponse,
  PrescriptionMedicineItem
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('dermasathi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getLanguageHeader(): Record<string, string> {
  const lang = localStorage.getItem('dermasathi_preferred_language') || 'en';
  return { 'Accept-Language': lang };
}

function getStandardHeaders(isJson: boolean = true): Record<string, string> {
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeader(),
    ...getLanguageHeader()
  };
}

export const api = {
  async getHealthStatus() {
    try {
      const res = await fetch(`${API_BASE}/health/status`, {
        headers: getLanguageHeader()
      });
      return await res.json();
    } catch (e) {
      return { status: 'offline', message: 'Backend unreachable' };
    }
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(email: string, password: string, fullName: string, language: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, preferred_language: language })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  async analyzeSkinImage(file: File, language: string = 'en'): Promise<SkinAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/skin-analysis/analyze-image`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Skin image analysis failed' }));
      throw new Error(err.detail || 'Analysis request failed');
    }
    return res.json();
  },

  async analyzeSkinWithMLService(file: File): Promise<import('../types').SkinAnalysisMLResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/skin/analyze`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'ML analysis endpoint failed' }));
      throw new Error(err.detail || 'Analysis request failed');
    }
    return res.json();
  },

  async checkImageQuality(file: File): Promise<ImageQualityMetrics> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/skin-analysis/quality-check`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error('Quality check failed');
    }
    return res.json();
  },

  async checkSymptoms(data: {
    symptoms: string[];
    duration_days?: number;
    severity: string;
    has_fever: boolean;
    has_rapid_spread: boolean;
    has_pain_or_bleeding: boolean;
    language: string;
  }): Promise<SymptomCheckResponse> {
    const res = await fetch(`${API_BASE}/symptoms/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Symptom triage request failed');
    return res.json();
  },

  async checkMedications(data: {
    medications: string[];
    allergies: string[];
    patient_conditions: string[];
    language: string;
  }): Promise<DrugSafetyResponse> {
    const res = await fetch(`${API_BASE}/medications/check-safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Medication verification request failed');
    return res.json();
  },

  async getWellnessGuidance(data: {
    skin_concern: string;
    season: string;
    language: string;
  }): Promise<LifestyleGuidanceResponse> {
    const res = await fetch(`${API_BASE}/wellness/guidance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Wellness guidance request failed');
    return res.json();
  },

  async assessEmergency(data: {
    symptoms_description: string;
    has_facial_swelling: boolean;
    has_breathing_difficulty: boolean;
    has_peeling_or_mucosal_involvement: boolean;
    has_high_fever: boolean;
    has_rapid_blistering: boolean;
    has_severe_uncontrollable_pain: boolean;
    language: string;
  }): Promise<EmergencyAssessmentResponse> {
    const res = await fetch(`${API_BASE}/emergency/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Emergency assessment request failed');
    return res.json();
  },

  async getHealthcareFacilities(): Promise<HealthcareFacility[]> {
    const res = await fetch(`${API_BASE}/healthcare-access/facilities`);
    if (!res.ok) throw new Error('Healthcare facilities request failed');
    return res.json();
  },

  async getReportAnalyzerStatus(): Promise<ReportAnalyzerStatus> {
    try {
      const res = await fetch(`${API_BASE}/reports/status`);
      if (!res.ok) throw new Error('Status failed');
      return await res.json();
    } catch {
      return {
        gemini_configured: false,
        model: 'gemini-1.5-flash',
        supported_formats: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
        max_upload_size_mb: 10
      };
    }
  },

  async analyzeMedicalReport(
    file: File,
    language: string = 'en',
    apiKey?: string
  ): Promise<MedicalReportAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    if (apiKey && apiKey.trim()) {
      formData.append('gemini_api_key', apiKey.trim());
    }

    const headers: Record<string, string> = {
      ...getAuthHeader()
    };
    if (apiKey && apiKey.trim()) {
      headers['X-Gemini-API-Key'] = apiKey.trim();
    }

    const res = await fetch(`${API_BASE}/reports/analyze`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Medical report analysis failed' }));
      throw new Error(err.detail || 'Medical report analysis failed');
    }
    return res.json();
  },

  async analyzePrescription(file: File, language: string = 'en'): Promise<PrescriptionAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/prescriptions/analyze`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prescription analysis failed' }));
      throw new Error(err.detail || 'Prescription analysis failed');
    }
    return res.json();
  },

  async verifyPrescription(
    prescriptionId: number,
    data: {
      medicines: PrescriptionMedicineItem[];
      doctor_name?: string;
      prescription_date?: string;
      general_advice?: string;
    }
  ): Promise<{ success: boolean; prescription_id: number; status: string; verified_medicines: PrescriptionMedicineItem[] }> {
    const res = await fetch(`${API_BASE}/prescriptions/${prescriptionId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prescription verification failed' }));
      throw new Error(err.detail || 'Prescription verification failed');
    }
    return res.json();
  },

  async createMedicationSchedules(
    prescriptionId: number,
    schedules: Array<{
      medicine_id?: number;
      medicine_name: string;
      dosage: string;
      frequency: string;
      times_of_day: string[];
      start_date: string;
      duration_days?: number;
      special_instructions?: string;
    }>
  ): Promise<MedicationScheduleResponse[]> {
    const res = await fetch(`${API_BASE}/prescriptions/${prescriptionId}/create-schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ schedules })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create medication schedules' }));
      throw new Error(err.detail || 'Failed to create medication schedules');
    }
    return res.json();
  },

  async getTodayReminders(clientDate?: string): Promise<MedicationReminderItem[]> {
    const dateParam = clientDate || (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const res = await fetch(`${API_BASE}/prescriptions/reminders/today?date=${dateParam}`, {
      headers: { ...getAuthHeader() }
    });

    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async updateReminderAction(
    reminderId: number,
    action: 'taken' | 'skipped' | 'snooze',
    snoozeMinutes?: number
  ): Promise<ReminderActionResponse> {
    const res = await fetch(`${API_BASE}/prescriptions/reminders/${reminderId}/action`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ action, snooze_minutes: snoozeMinutes })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update reminder' }));
      throw new Error(err.detail || 'Failed to update reminder');
    }
    return res.json();
  },

  async listPrescriptions(): Promise<PrescriptionAnalysisResponse[]> {
    const res = await fetch(`${API_BASE}/prescriptions`, {
      headers: { ...getAuthHeader() }
    });

    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async getPrescription(prescriptionId: number): Promise<PrescriptionAnalysisResponse> {
    const res = await fetch(`${API_BASE}/prescriptions/${prescriptionId}`, {
      headers: { ...getAuthHeader() }
    });

    if (!res.ok) {
      throw new Error('Prescription not found');
    }
    return res.json();
  },

  async deletePrescription(prescriptionId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/prescriptions/${prescriptionId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });

    if (!res.ok) {
      throw new Error('Failed to delete prescription');
    }
  },

  async createCustomReminder(data: {
    medicine_name: string;
    dosage: string;
    scheduled_time: string;
    scheduled_date?: string;
    notes?: string;
  }): Promise<MedicationReminderItem> {
    const res = await fetch(`${API_BASE}/prescriptions/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create reminder' }));
      throw new Error(err.detail || 'Failed to create reminder');
    }
    return res.json();
  },

  async deleteReminder(reminderId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/prescriptions/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });

    if (!res.ok) {
      throw new Error('Failed to delete reminder');
    }
  }
};
