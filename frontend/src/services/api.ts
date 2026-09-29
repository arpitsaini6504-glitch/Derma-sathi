import {
  SkinAnalysisResponse,
  ImageQualityMetrics,
  SymptomCheckResponse,
  DrugSafetyResponse,
  LifestyleGuidanceResponse,
  EmergencyAssessmentResponse,
  HealthcareFacility,
  User
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('dermasathi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  async getHealthStatus() {
    try {
      const res = await fetch(`${API_BASE}/health/status`);
      return await res.json();
    } catch (e) {
      return { status: 'offline', message: 'Backend unreachable' };
    }
  },

  async login(email: string, password: string):Promise<{ access_token: string; user: User }> {
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
  }
};
