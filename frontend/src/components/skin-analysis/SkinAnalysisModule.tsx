import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { SkinAnalysisResponse } from '../../types';
import { VoiceAssistButton } from '../common/VoiceAssistButton';
import { AIProcessingState } from '../common/AIProcessingState';
import { UncertaintyState } from '../common/UncertaintyState';
import { ErrorState } from '../common/ErrorState';

type PipelineStep = 'upload' | 'preview_quality' | 'processing' | 'result';

export const SkinAnalysisModule: React.FC<{ onNavigateToClinics?: () => void }> = ({ onNavigateToClinics }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<PipelineStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera stream
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep('preview_quality');
      setErrorMessage(null);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setErrorMessage('Camera access was denied or is not supported. Please select a photo from your device.');
      setIsCameraActive(false);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'skin_photo.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
          setStep('preview_quality');
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const resetFlow = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setStep('upload');
  };

  const executePipeline = async () => {
    if (!selectedFile) return;
    setStep('processing');
    setErrorMessage(null);

    try {
      const response = await api.analyzeSkinImage(selectedFile, i18n.language);
      setAnalysisResult(response);
      setStep('result');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to clinical pipeline.');
      setStep('preview_quality');
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Step Indicator Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('skin.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('skin.subtitle')}</p>

        {/* Progress Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <span className={`badge ${step === 'upload' ? 'badge-pending' : 'badge-success'}`}>
            {t('skin.step_1_title')}
          </span>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
          <span className={`badge ${step === 'preview_quality' ? 'badge-pending' : step === 'result' ? 'badge-success' : ''}`}>
            {t('skin.step_2_title')}
          </span>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
          <span className={`badge ${step === 'result' ? 'badge-pending' : ''}`}>
            {t('skin.step_3_title')}
          </span>
        </div>
      </div>

      {/* STEP 1: UPLOAD / CAMERA */}
      {step === 'upload' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{t('skin.upload_heading')}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {t('skin.upload_instruction')}
          </p>

          {isCameraActive ? (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  maxHeight: '360px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#000'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={captureFrame}
                  style={{ minHeight: '48px', padding: '12px 24px' }}
                >
                  <Camera size={20} />
                  <span>Snap Photo</span>
                </button>
                <button
                  className="btn btn-outline"
                  onClick={stopCamera}
                  style={{ minHeight: '48px', padding: '12px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-main)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <Camera size={32} />
              </div>

              <h4 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>
                Select Photo or Use Camera
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '22px' }}>
                JPEG, PNG, WebP up to 10MB • Clear focus & bright indirect daylight
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <label
                  htmlFor="skin-file-picker"
                  className="btn btn-primary"
                  style={{ minHeight: '48px', padding: '12px 24px', cursor: 'pointer' }}
                >
                  <Upload size={18} />
                  <span>{t('skin.choose_file')}</span>
                </label>
                <input
                  id="skin-file-picker"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <button
                  className="btn btn-outline"
                  onClick={startCamera}
                  style={{ minHeight: '48px', padding: '12px 24px' }}
                >
                  <Camera size={18} />
                  <span>{t('skin.take_photo')}</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ marginTop: '16px' }}>
              <ErrorState title="Camera Error" description={errorMessage} onRetry={() => setErrorMessage(null)} />
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PREVIEW & IMAGE QUALITY GUIDANCE */}
      {step === 'preview_quality' && previewUrl && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.25s ease' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Image Preview & Quality Verification</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Check clarity, lighting, and centering before running the clinical pipeline.
          </p>

          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <img
              src={previewUrl}
              alt="Skin Preview"
              style={{
                maxHeight: '280px',
                maxWidth: '100%',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: '#000'
              }}
            />
          </div>

          {/* Quality Guidance Checklist */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '22px'
            }}
          >
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
              Pre-Flight Clarity Checklist
            </h4>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>✓ Is the skin mark in sharp focus without hand motion blur?</li>
              <li>✓ Is there even lighting without harsh flash glare?</li>
              <li>✓ Is the lesion centered without covering clothing or jewelry?</li>
            </ul>
          </div>

          {errorMessage && (
            <div style={{ marginBottom: '16px' }}>
              <ErrorState title="Analysis Failed" description={errorMessage} onRetry={executePipeline} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={resetFlow}
              style={{ minHeight: '48px', padding: '12px 20px' }}
            >
              <RefreshCw size={18} />
              <span>Retake Photo</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={executePipeline}
              style={{ minHeight: '48px', padding: '12px 28px', fontSize: '1rem' }}
            >
              <Sparkles size={18} />
              <span>Run 8-Stage Safety Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING */}
      {step === 'processing' && <AIProcessingState />}

      {/* STEP 4: RESULT / UNCERTAINTY / REFERRAL */}
      {step === 'result' && analysisResult && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className={`badge ${analysisResult.abstained ? 'badge-pending' : 'badge-success'}`}>
                {analysisResult.status}
              </span>
              <h3 style={{ marginTop: '6px' }}>Clinical Assessment & Referral</h3>
            </div>

            <VoiceAssistButton
              textToSpeak={`${analysisResult.abstention_reason || ''}. Referral timeframe: ${analysisResult.referral.recommended_timeframe}. Specialist: ${analysisResult.referral.recommended_specialist}`}
            />
          </div>

          {/* Quality Gate Verification Scorecard */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}
          >
            <h4 style={{ fontSize: '0.92rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: analysisResult.quality_gate.is_acceptable ? 'var(--emerald-500)' : 'var(--rose-500)' }} />
              {t('skin.quality_metrics')} ({analysisResult.quality_gate.resolution[0]}x{analysisResult.quality_gate.resolution[1]} px)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '0.86rem' }}>
              <div><strong>{t('skin.clarity')}:</strong> {analysisResult.quality_gate.blur_score}</div>
              <div><strong>{t('skin.lighting')}:</strong> {analysisResult.quality_gate.brightness_score}/255</div>
            </div>
            <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {analysisResult.quality_gate.feedback_messages.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>

          {/* If Abstained / Model in Staging / Uncertainty */}
          {analysisResult.abstained && (
            <UncertaintyState
              reason={analysisResult.abstention_reason}
              onRetake={resetFlow}
              onConsultDoctor={onNavigateToClinics || (() => alert('Directing to registered clinics directory.'))}
            />
          )}

          {/* Clinical Findings ONLY if model was available and confidence was calibrated (Strictly non-diagnostic) */}
          {!analysisResult.abstained && analysisResult.findings.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <h4>{t('skin.findings_heading')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {analysisResult.findings.map((f, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{f.category_name}</strong>
                      <span className="badge badge-pending">Calibrated: {(f.calibrated_probability * 100).toFixed(1)}%</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{f.general_information}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referral & Safe Action Recommendations */}
          <div
            style={{
              padding: '18px',
              backgroundColor: 'hsl(210, 40%, 98%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}
          >
            <h4 style={{ color: 'var(--primary-700)', marginBottom: '8px' }}>{t('skin.referral_heading')}</h4>
            <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '8px' }}>
              {t('skin.timeframe')}: {analysisResult.referral.recommended_timeframe}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('skin.specialist')}: {analysisResult.referral.recommended_specialist}
            </p>

            <h5 style={{ fontSize: '0.86rem', marginBottom: '6px' }}>{t('skin.instructions')}</h5>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {analysisResult.referral.actionable_instructions.map((inst, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{inst}</li>
              ))}
            </ul>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={resetFlow}
              style={{ minHeight: '48px', padding: '12px 24px' }}
            >
              <RefreshCw size={18} />
              <span>Start New Photo Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
