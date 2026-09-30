import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck2,
  Upload,
  Camera,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Pill,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Volume2,
  BellRing,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';
import { VoiceAssistButton } from '../common/VoiceAssistButton';
import { api } from '../../services/api';
import {
  PrescriptionAnalysisResponse,
  PrescriptionMedicineItem,
  MedicationReminderItem,
  MedicationScheduleResponse
} from '../../types';

export const PrescriptionModule: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Active view: 'scan' | 'verify' | 'reminders'
  const [activeTab, setActiveTab] = useState<'scan' | 'verify' | 'reminders'>('scan');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active prescription being reviewed
  const [activePrescription, setActivePrescription] = useState<PrescriptionAnalysisResponse | null>(null);
  const [medicines, setMedicines] = useState<PrescriptionMedicineItem[]>([]);

  // Editing single medicine modal/state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<PrescriptionMedicineItem | null>(null);

  // Reminders state
  const [todayReminders, setTodayReminders] = useState<MedicationReminderItem[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<PrescriptionAnalysisResponse[]>([]);

  // Standalone custom reminder creation
  const [isAddingReminder, setIsAddingReminder] = useState<boolean>(false);
  const [newReminderForm, setNewReminderForm] = useState({
    medicine_name: '',
    dosage: '1 tablet',
    scheduled_time: '08:00 AM',
    notes: ''
  });

  useEffect(() => {
    loadRecentPrescriptions();
    loadTodayReminders();
  }, []);

  const loadRecentPrescriptions = async () => {
    try {
      const list = await api.listPrescriptions();
      setRecentPrescriptions(list);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    }
  };

  const loadTodayReminders = async () => {
    try {
      const rems = await api.getTodayReminders();
      setTodayReminders(rems);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  };

  // 1. Prescription Upload & Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t('errors.file_too_large', 'The uploaded file exceeds the 10MB limit.'));
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await api.analyzePrescription(file, i18n.language);
      setActivePrescription(result);
      setMedicines(result.medicines || []);
      setActiveTab('verify');
      await loadRecentPrescriptions();
    } catch (err: any) {
      setErrorMessage(err.message || 'Prescription analysis failed. Please try a clearer photo or PDF.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // 2. Medication Verification Actions
  const handleConfirmMedicine = (index: number) => {
    const updated = [...medicines];
    updated[index] = {
      ...updated[index],
      is_verified: true,
      is_unclear: false,
      unclear_reason: undefined
    };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditFormData({ ...medicines[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editFormData) return;
    const updated = [...medicines];
    updated[editingIndex] = {
      ...editFormData,
      is_verified: true,
      is_unclear: false,
      unclear_reason: undefined
    };
    setMedicines(updated);
    setEditingIndex(null);
    setEditFormData(null);
  };

  const handleAddNewMedicine = () => {
    const newMed: PrescriptionMedicineItem = {
      medicine_name: '',
      dosage: '',
      dosage_unit: '',
      frequency: '',
      timing: [],
      duration: '',
      is_verified: true,
      is_unclear: false
    };
    setMedicines([...medicines, newMed]);
    setEditingIndex(medicines.length);
    setEditFormData(newMed);
  };

  // 3. Confirm Prescription & Generate Medication Schedule
  const handleCreateScheduleAndReminders = async () => {
    if (!activePrescription) return;

    if (medicines.length === 0) {
      setErrorMessage('Please add at least one medication from the prescription.');
      return;
    }

    if (!activePrescription) return;

    // ONLY schedule medicines that the patient has explicitly verified/confirmed
    const medsToSchedule = medicines.filter((m) => m.is_verified);
    if (medsToSchedule.length === 0) {
      setErrorMessage(t('prescription.select_meds_to_schedule') || 'Please click "Confirm Item" on the medication(s) you wish to schedule.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Step A: Save verified medicines to backend
      await api.verifyPrescription(activePrescription.prescription_id, {
        medicines: medicines,
        doctor_name: activePrescription.doctor_name,
        prescription_date: activePrescription.prescription_date,
        general_advice: activePrescription.general_advice
      });

      // Step B: Create Medication Schedules & Reminders using client's exact local date
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const schedulesPayload = medsToSchedule.map((med) => {
        // Derive default sensible times based on timing array or frequency
        let times: string[] = ['08:00 AM'];
        const tLower = (med.timing || []).map((x) => x.toLowerCase());
        const freqLower = (med.frequency || '').toLowerCase();

        if (tLower.includes('night') && tLower.includes('morning')) {
          times = ['08:00 AM', '08:00 PM'];
        } else if (freqLower.includes('twice') || freqLower.includes('bd') || freqLower.includes('bid')) {
          times = ['08:00 AM', '08:00 PM'];
        } else if (freqLower.includes('thrice') || freqLower.includes('tds') || freqLower.includes('tid')) {
          times = ['08:00 AM', '02:00 PM', '08:00 PM'];
        } else if (tLower.includes('night') || freqLower.includes('bedtime') || freqLower.includes('hs')) {
          times = ['09:00 PM'];
        }

        // Parse duration number of days if specified
        let durationDays: number | undefined = undefined;
        if (med.duration) {
          const match = med.duration.match(/\d+/);
          if (match) durationDays = parseInt(match[0], 10);
        }

        return {
          medicine_id: med.id,
          medicine_name: med.medicine_name.trim() || 'Prescribed Medicine',
          dosage: med.dosage?.trim() || '1 dose',
          frequency: med.frequency?.trim() || 'Daily',
          times_of_day: times,
          start_date: todayStr,
          duration_days: durationDays || 7,
          special_instructions: med.special_instructions
        };
      });

      await api.createMedicationSchedules(activePrescription.prescription_id, schedulesPayload);

      setSuccessMessage(t('prescription.reminders_created_success'));
      const freshReminders = await api.getTodayReminders(todayStr);
      setTodayReminders(freshReminders);
      await loadRecentPrescriptions();
      setActiveTab('reminders');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create medication schedule.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Update Reminder Status
  const handleReminderAction = async (reminderId: number, action: 'taken' | 'skipped' | 'snooze') => {
    try {
      const res = await api.updateReminderAction(reminderId, action, 15);
      setSuccessMessage(res.safety_message);
      await loadTodayReminders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update reminder.');
    }
  };

  const handleDeletePrescription = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this prescription and its associated schedules?')) {
      return;
    }
    try {
      await api.deletePrescription(id);
      if (activePrescription?.prescription_id === id) {
        setActivePrescription(null);
        setMedicines([]);
        setActiveTab('scan');
      }
      await loadRecentPrescriptions();
      await loadTodayReminders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete prescription.');
    }
  };

  const handleDeleteReminder = async (reminderId: number, medicineName?: string) => {
    const medPrompt = medicineName ? ` for ${medicineName}` : '';
    const confirmMsg = t('prescription.confirm_delete_reminder') || `Are you sure you want to remove this medication reminder${medPrompt}?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      await api.deleteReminder(reminderId);
      setSuccessMessage(t('prescription.reminder_deleted_success') || 'Medication reminder removed successfully.');
      await loadTodayReminders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove reminder.');
    }
  };

  const handleSaveCustomReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderForm.medicine_name.trim()) return;

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    try {
      await api.createCustomReminder({
        medicine_name: newReminderForm.medicine_name.trim(),
        dosage: newReminderForm.dosage.trim(),
        scheduled_time: newReminderForm.scheduled_time.trim(),
        scheduled_date: todayStr,
        notes: newReminderForm.notes.trim() || undefined
      });
      setSuccessMessage(t('prescription.reminders_created_success') || 'Reminder created successfully!');
      setIsAddingReminder(false);
      setNewReminderForm({ medicine_name: '', dosage: '1 tablet', scheduled_time: '08:00 AM', notes: '' });
      await loadTodayReminders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create reminder.');
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('prescription.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('prescription.subtitle')}</p>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <button
          className={`btn ${activeTab === 'scan' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('scan')}
          style={{ fontSize: '0.88rem', padding: '8px 16px' }}
        >
          <Camera size={16} />
          <span>{t('prescription.tab_scan')}</span>
        </button>
        <button
          className={`btn ${activeTab === 'verify' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('verify')}
          disabled={!activePrescription}
          style={{ fontSize: '0.88rem', padding: '8px 16px' }}
        >
          <FileCheck2 size={16} />
          <span>{t('prescription.tab_verify')}</span>
          {medicines.some((m) => !m.is_verified) && <span className="badge badge-emergency" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>!</span>}
        </button>
        <button
          className={`btn ${activeTab === 'reminders' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('reminders')}
          style={{ fontSize: '0.88rem', padding: '8px 16px' }}
        >
          <BellRing size={16} />
          <span>{t('prescription.tab_schedule')}</span>
          {todayReminders.length > 0 && (
            <span className="badge badge-success" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
              {todayReminders.filter((r) => r.status === 'scheduled').length}
            </span>
          )}
        </button>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div
          className="badge-emergency"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="badge-success"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem'
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isProcessing && (
        <LoadingState
          title={t('prescription.scanning_title')}
          description={t('prescription.scanning_desc')}
        />
      )}

      {/* TAB 1: UPLOAD & SCAN */}
      {!isProcessing && activeTab === 'scan' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center', padding: '32px 20px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('prescription.upload_title')}</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '560px', margin: '0 auto 24px' }}>
              {t('prescription.upload_desc')}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '12px 24px', fontSize: '0.95rem' }}>
                <Upload size={18} />
                <span>{t('prescription.upload_button')}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Safety Mandate Banner */}
            <div
              style={{
                marginTop: '24px',
                padding: '12px 16px',
                backgroundColor: 'hsl(38, 90%, 96%)',
                borderRadius: 'var(--radius-md)',
                color: 'hsl(30, 80%, 20%)',
                fontSize: '0.84rem',
                textAlign: 'left',
                border: '1px solid hsl(38, 90%, 85%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--amber-500)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{t('prescription.medical_mandate')}:</strong> {t('prescription.safety_mandate')}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Prescriptions Section */}
          {recentPrescriptions.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1.02rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={18} style={{ color: 'var(--primary-600)' }} />
                {t('prescription.recent_prescriptions')}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentPrescriptions.map((rx) => (
                  <div
                    key={rx.prescription_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.94rem' }}>{rx.filename}</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {rx.doctor_name || 'Prescription'} {rx.prescription_date ? `• ${rx.prescription_date}` : ''} •{' '}
                        {rx.medicines?.length || 0} medications
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => {
                          setActivePrescription(rx);
                          setMedicines(rx.medicines || []);
                          setActiveTab('verify');
                        }}
                      >
                        {t('prescription.view_details')}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.8rem', padding: '6px 10px', color: 'var(--emergency-600)' }}
                        onClick={() => handleDeletePrescription(rx.prescription_id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFY MEDICINES */}
      {!isProcessing && activeTab === 'verify' && activePrescription && (
        <div className="glass-card" style={{ padding: '24px' }}>
          {/* Top Verification Alert Banner */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'hsl(38, 90%, 96%)',
              border: '2px solid hsl(38, 90%, 75%)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <ShieldAlert size={22} style={{ color: 'hsl(30, 85%, 45%)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.94rem', color: 'hsl(30, 85%, 25%)' }}>
                {t('prescription.verification_notice')}
              </strong>
              <p style={{ fontSize: '0.84rem', color: 'hsl(30, 80%, 25%)', margin: '4px 0 0' }}>
                OCR extraction can mistake handwritten physician notes. Review each item carefully. You can edit,
                confirm, or add medications.
              </p>
            </div>
          </div>

          {/* Prescription Header Details */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                {activePrescription.doctor_name || t('prescription.doctor_heading')}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {activePrescription.clinic_or_hospital || 'Clinic / Hospital'}{' '}
                {activePrescription.prescription_date ? `• ${activePrescription.prescription_date}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge ${activePrescription.status === 'verified' ? 'badge-success' : 'badge-pending'}`}>
                {activePrescription.status === 'verified'
                  ? t('prescription.status_verified')
                  : t('prescription.status_unverified')}
              </span>
              <button
                className="btn btn-outline"
                onClick={handleAddNewMedicine}
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                <Plus size={14} />
                <span>{t('prescription.add_med')}</span>
              </button>
            </div>
          </div>

          {/* Medicines List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {medicines.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-main)',
                  border: item.is_verified
                    ? '1.5px solid var(--emerald-500)'
                    : item.is_unclear
                    ? '2px solid var(--amber-500)'
                    : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill size={18} style={{ color: 'var(--primary-600)' }} />
                    <strong style={{ fontSize: '1.02rem', color: 'var(--text-main)' }}>{item.medicine_name}</strong>
                    {item.strength && <span className="badge badge-neutral">{item.strength}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.is_verified ? (
                      <span className="badge badge-success">
                        <Check size={12} />
                        {t('prescription.confirmed_badge')}
                      </span>
                    ) : item.is_unclear ? (
                      <span className="badge badge-emergency">
                        <AlertTriangle size={12} />
                        {t('prescription.status_unclear')}
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleConfirmMedicine(idx)}
                        style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      >
                        <Check size={13} />
                        <span>{t('prescription.confirm_med')}</span>
                      </button>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() => handleStartEdit(idx)}
                      style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                      title={t('prescription.edit_med')}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      className="btn btn-outline"
                      onClick={() => handleRemoveMedicine(idx)}
                      style={{ fontSize: '0.78rem', padding: '4px 8px', color: 'var(--emergency-600)' }}
                      title={t('prescription.remove_med')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '10px',
                    marginTop: '12px',
                    fontSize: '0.84rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Dose: </span>
                    <strong>{item.dosage || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Frequency: </span>
                    <strong>{item.frequency || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Timing: </span>
                    <strong>{item.timing && item.timing.length > 0 ? item.timing.join(', ') : '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                    <strong>{item.duration || '—'}</strong>
                  </div>
                </div>

                {item.special_instructions && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', margin: '8px 0 0' }}>
                    <strong>Instructions:</strong> {item.special_instructions}
                  </p>
                )}

                {/* Unclear Warning Message */}
                {item.is_unclear && item.unclear_reason && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: 'hsl(30, 85%, 35%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertTriangle size={14} style={{ color: 'var(--amber-500)', flexShrink: 0 }} />
                    <span>{item.unclear_reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* General Advice from slip */}
          {activePrescription.general_advice && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                borderLeft: '4px solid var(--primary-500)',
                fontSize: '0.86rem'
              }}
            >
              <strong>{t('prescription.general_advice_heading')}:</strong> {activePrescription.general_advice}
            </div>
          )}

          {/* Bottom Confirmation Action */}
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleCreateScheduleAndReminders}
              style={{ padding: '12px 28px', fontSize: '1rem', minHeight: '48px' }}
            >
              <CheckCircle2 size={18} />
              <span>{t('prescription.create_reminders_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TODAY'S REMINDERS & SCHEDULE */}
      {!isProcessing && activeTab === 'reminders' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Clock size={20} style={{ color: 'var(--primary-600)' }} />
              {t('prescription.today_reminders_title')}
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsAddingReminder(true)}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Plus size={14} />
                <span>{t('prescription.add_reminder_btn')}</span>
              </button>
              <button
                className="btn btn-outline"
                onClick={loadTodayReminders}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <RotateCcw size={14} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {todayReminders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <Clock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{t('prescription.no_reminders_today')}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAddingReminder(true)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <Plus size={14} />
                  <span>{t('prescription.add_reminder_btn')}</span>
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveTab('scan')}
                  style={{ fontSize: '0.85rem' }}
                >
                  <span>Upload a Prescription</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {todayReminders.map((rem) => (
                <div
                  key={rem.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-main)',
                    border: rem.status === 'taken' ? '1.5px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(14, 116, 144, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: 'var(--primary-700)'
                      }}
                    >
                      {rem.scheduled_time}
                    </div>

                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{rem.medicine_name}</strong>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {rem.dosage} {rem.special_instructions ? `• ${rem.special_instructions}` : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {rem.status === 'taken' ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={13} />
                        {t('prescription.taken_badge')}
                      </span>
                    ) : rem.status === 'skipped' ? (
                      <span className="badge badge-neutral">{t('prescription.skipped_badge')}</span>
                    ) : rem.status === 'snoozed' ? (
                      <span className="badge badge-pending">{t('prescription.snoozed_badge')}</span>
                    ) : null}

                    {rem.status !== 'taken' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleReminderAction(rem.id, 'taken')}
                        style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                      >
                        <Check size={14} />
                        <span>{t('prescription.mark_taken')}</span>
                      </button>
                    )}

                    {rem.status === 'scheduled' && (
                      <>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleReminderAction(rem.id, 'snooze')}
                          style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                        >
                          <Clock size={13} />
                          <span>{t('prescription.snooze')}</span>
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleReminderAction(rem.id, 'skipped')}
                          style={{ fontSize: '0.82rem', padding: '6px 10px', color: 'var(--text-muted)' }}
                        >
                          {t('prescription.mark_skipped')}
                        </button>
                      </>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() => handleDeleteReminder(rem.id, rem.medicine_name)}
                      title={t('prescription.delete_reminder_tooltip') || 'Delete this reminder'}
                      aria-label={t('prescription.delete_reminder') || 'Delete reminder'}
                      style={{
                        fontSize: '0.82rem',
                        padding: '6px 10px',
                        color: 'var(--rose-600, #e11d48)',
                        borderColor: 'var(--rose-200, #fecdd3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} style={{ color: 'var(--rose-600, #e11d48)' }} />
                      <span>{t('prescription.delete_reminder')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missed Dose Neutral Safety Advisory */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--amber-500)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Info size={16} style={{ color: 'var(--amber-500)', flexShrink: 0 }} />
            <span>{t('prescription.missed_dose_advisory')}</span>
          </div>
        </div>
      )}

      {/* EDIT MEDICATION MODAL */}
      {editingIndex !== null && editFormData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
              padding: '24px'
            }}
          >
            <h4 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>{t('prescription.edit_med')}</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Medicine Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.medicine_name}
                  onChange={(e) => setEditFormData({ ...editFormData, medicine_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Strength (e.g. 500mg)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.strength || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, strength: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Dosage (e.g. 1 tablet)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.dosage || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dosage: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Frequency (e.g. Twice daily)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.frequency || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Duration (e.g. 5 days)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.duration || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Special Instructions</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.special_instructions || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, special_instructions: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setEditingIndex(null);
                  setEditFormData(null);
                }}
              >
                {t('prescription.cancel_edits')}
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                {t('prescription.save_edits')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STANDALONE REMINDER MODAL */}
      {isAddingReminder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--primary-600)' }} />
                {t('prescription.create_reminder_title')}
              </h4>
              <button
                className="btn btn-ghost"
                onClick={() => setIsAddingReminder(false)}
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomReminder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>{t('prescription.medicine_name_label')}</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. ALLERCET DC"
                  value={newReminderForm.medicine_name}
                  onChange={(e) => setNewReminderForm({ ...newReminderForm, medicine_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>{t('prescription.dosage_label')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 1 tablet"
                    value={newReminderForm.dosage}
                    onChange={(e) => setNewReminderForm({ ...newReminderForm, dosage: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.84rem' }}>{t('prescription.time_label')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 08:00 AM or 09:00 PM"
                    value={newReminderForm.scheduled_time}
                    onChange={(e) => setNewReminderForm({ ...newReminderForm, scheduled_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>Instructions / Notes (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. After dinner"
                  value={newReminderForm.notes}
                  onChange={(e) => setNewReminderForm({ ...newReminderForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddingReminder(false)}
                >
                  {t('prescription.cancel_edits')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('prescription.save_reminder_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
