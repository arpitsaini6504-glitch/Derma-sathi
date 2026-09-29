// Local caching layer for low-connectivity environments
export interface OfflineEmergencyRecord {
  timestamp: string;
  numbers: { name: string; number: string; desc: string }[];
  firstAidGuidelines: string[];
}

const OFFLINE_GUIDELINES_KEY = 'dermasathi_offline_guidelines';
const OFFLINE_HISTORY_KEY = 'dermasathi_offline_history';

export const offlineStorage = {
  saveOfflineGuidelines(data: OfflineEmergencyRecord) {
    try {
      localStorage.setItem(OFFLINE_GUIDELINES_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not cache offline emergency data:', e);
    }
  },

  getOfflineGuidelines(): OfflineEmergencyRecord {
    try {
      const stored = localStorage.getItem(OFFLINE_GUIDELINES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error retrieving offline data:', e);
    }

    // Default static fallback for zero-connectivity
    return {
      timestamp: new Date().toISOString(),
      numbers: [
        { name: "National Emergency / Ambulance", number: "112 / 108", desc: "Pan-India 24x7 immediate medical dispatch" },
        { name: "National Health Helpline", number: "1075", desc: "Toll-free government medical advisory" },
        { name: "AIIMS Poison Center", number: "1800-116-117", desc: "Toxic chemical or drug adverse reaction" }
      ],
      firstAidGuidelines: [
        "If experiencing mouth/throat swelling or breathing difficulty, call 112 immediately.",
        "Do not puncture blisters or peel off skin sheets.",
        "Keep burns or raw dermatitis clean, covered with sterile gauze, and avoid applying turmeric/toothpaste on open raw lesions.",
        "Hydrate with oral rehydration solution (ORS) or boiled lukewarm water."
      ]
    };
  },

  cacheConsultation(summary: any) {
    try {
      const existing = this.getCachedConsultations();
      existing.unshift({
        ...summary,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(OFFLINE_HISTORY_KEY, JSON.stringify(existing.slice(0, 10)));
    } catch (e) {
      console.warn('Error saving local consultation:', e);
    }
  },

  getCachedConsultations(): any[] {
    try {
      const stored = localStorage.getItem(OFFLINE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
};
