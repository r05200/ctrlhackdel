import React from 'react';
import './BossFightModal.css';
import { verifyExplanation, transcribeAudio } from '../services/api';

// ── MediaRecorder mime negotiation ──
function pickMime() {
  for (const m of ['audio/webm;codecs=opus', 'audio/webm']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined; // let browser pick default
}

const BossFightModal = ({ node, onClose, onComplete }) => {
  const [transcript, setTranscript] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [stage, setStage] = React.useState('intro'); // intro, input, checking, result
  const [userExplanation, setUserExplanation] = React.useState('');
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  // ── Mic‑mode state ──
  const [inputMode, setInputMode] = React.useState('type'); // 'type' | 'mic'
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [micStatus, setMicStatus] = React.useState(''); // user‑facing status line
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  const handleStartBossFight = () => {
    setStage('input');
  };

  // ── Recording helpers ──
  const startRecording = async () => {
    setError(null);
    setMicStatus('Requesting microphone…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setMicStatus('Recording saved. You can play it back or submit.');
        // stop mic tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setMicStatus('🔴 Recording… click Stop when done.');
    } catch (err) {
      console.error('Mic error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please allow access and try again.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }
      setMicStatus('');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setMicStatus('Discarded. Record again when ready.');
    setError(null);
  };

  // ── Submit flows ──

  // Typed mode (unchanged logic)
  const handleSubmitExplanation = async () => {
    if (!userExplanation.trim()) {
      alert('Please provide an explanation before submitting.');
      return;
    }

    console.log('🎯 FRONTEND: Submitting explanation');
    console.log('  Node ID:', node.id);
    console.log('  Explanation length:', userExplanation.length);
    console.log('  Explanation:', userExplanation);

    setStage('checking');
    setError(null);

    try {
      const result = await verifyExplanation(node.id, userExplanation, null, node);
      setVerificationResult(result);
      setFeedback(result.feedback || result.message);
      setTranscript(userExplanation);
      setStage('result');
    } catch (err) {
      console.error('Error verifying explanation:', err);
      setError('Failed to verify explanation. Please try again.');
      setStage('input');
    }
  };

  // Mic mode: transcribe → verify
  const handleSubmitRecording = async () => {
    if (!audioBlob) return;
    setError(null);
    setIsTranscribing(true);
    setMicStatus('Transcribing audio…');

    try {
      const text = await transcribeAudio(audioBlob);
      setMicStatus('Transcript received. Grading…');
      setUserExplanation(text);
      setStage('checking');

      const result = await verifyExplanation(node.id, text, null, node);
      setVerificationResult(result);
      setFeedback(result.feedback || result.message);
      setTranscript(text);
      setStage('result');
    } catch (err) {
      console.error('Mic submit error:', err);
      setError(err.message || 'Transcription / grading failed. You can retry.');
      setMicStatus('');
      setStage('input');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePass = () => {
    onComplete(node.id, userExplanation, verificationResult);
    onClose();
  };

  const handleRetry = () => {
    setUserExplanation('');
    setStage('input');
    setVerificationResult(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>🎯 BOSS FIGHT</h2>
          <h3>{node.label}</h3>
          <p className="description">{node.description}</p>
        </div>

        {stage === 'intro' && (
          <div className="stage-content">
            <div className="boss-avatar">
              <div className="ai-orb"></div>
            </div>
            <p className="ai-message">
              "I'm a confused student. Explain <strong>{node.label}</strong> to me clearly. 
              Show me you truly understand this concept."
            </p>
            <button className="start-btn" onClick={handleStartBossFight}>
              BEGIN EXPLANATION
            </button>
          </div>
        )}

        {stage === 'input' && (
          <div className="stage-content">
            <div className="boss-avatar">
              <div className="ai-orb"></div>
            </div>
            <p className="ai-message">
              "Explain <strong>{node.label}</strong> in your own words:"
            </p>

            {/* ── Type / Mic toggle ── */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '0', margin: '12px 0',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', overflow: 'hidden', width: 'fit-content', alignSelf: 'center', marginLeft: 'auto', marginRight: 'auto'
            }}>
              {['type', 'mic'].map((m) => (
                <button key={m} onClick={() => { setInputMode(m); setError(null); }}
                  style={{
                    padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    border: 'none', color: 'white',
                    background: inputMode === m ? 'rgba(138,43,226,0.6)' : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.2s'
                  }}>
                  {m === 'type' ? '⌨️ Type' : '🎤 Mic'}
                </button>
              ))}
            </div>

            {/* ── TYPE MODE ── */}
            {inputMode === 'type' && (
              <>
                <textarea
                  className="explanation-input"
                  value={userExplanation}
                  onChange={(e) => {
                    console.log('📝 Textarea changed:', e.target.value.length, 'chars');
                    setUserExplanation(e.target.value);
                  }}
                  placeholder="Type your explanation here… (minimum 20 words recommended)"
                  rows="6"
                  style={{
                    width: '100%', padding: '12px',
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px', color: 'white', fontFamily: 'monospace',
                    fontSize: '14px', resize: 'vertical', marginTop: '15px'
                  }}
                />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                  Words: {userExplanation.split(/\s+/).filter(w => w).length}
                </div>
                {error && (
                  <div style={{ color: '#ff4444', marginTop: '10px', fontSize: '14px' }}>
                    ⚠️ {error}
                  </div>
                )}
                <button className="start-btn" onClick={handleSubmitExplanation} style={{ marginTop: '15px' }}>
                  SUBMIT EXPLANATION
                </button>
              </>
            )}

            {/* ── MIC MODE ── */}
            {inputMode === 'mic' && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {/* controls row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {!isRecording && !audioBlob && (
                    <button className="start-btn" onClick={startRecording} style={{ fontSize: '14px', padding: '10px 20px' }}>
                      🎤 Start Recording
                    </button>
                  )}
                  {isRecording && (
                    <button className="start-btn" onClick={stopRecording}
                      style={{ fontSize: '14px', padding: '10px 20px', background: 'rgba(255,60,60,0.6)' }}>
                      ⏹ Stop Recording
                    </button>
                  )}
                  {audioBlob && !isRecording && (
                    <>
                      <button className="start-btn" onClick={discardRecording}
                        style={{ fontSize: '14px', padding: '10px 20px', background: 'rgba(255,255,255,0.12)' }}>
                        🔄 Re‑record
                      </button>
                      <button className="start-btn" onClick={handleSubmitRecording}
                        disabled={isTranscribing}
                        style={{ fontSize: '14px', padding: '10px 20px', opacity: isTranscribing ? 0.5 : 1 }}>
                        {isTranscribing ? '⏳ Processing…' : '🚀 Submit Recording'}
                      </button>
                    </>
                  )}
                </div>

                {/* playback */}
                {audioUrl && !isRecording && (
                  <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '400px', marginTop: '4px' }} />
                )}

                {/* status */}
                {micStatus && (
                  <div style={{ fontSize: '13px', color: '#ccc', textAlign: 'center' }}>{micStatus}</div>
                )}
                {error && (
                  <div style={{ color: '#ff4444', fontSize: '14px', textAlign: 'center' }}>⚠️ {error}</div>
                )}
              </div>
            )}
          </div>
        )}

        {stage === 'checking' && (
          <div className="stage-content">
            <div className="analyzing">
              <div className="spinner"></div>
              <p className="status-text">ANALYZING YOUR EXPLANATION...</p>
              <div className="scan-lines"></div>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="stage-content">
            <div className={`result ${verificationResult?.passed ? 'success' : 'failure'}`}>
              <div className="result-icon">
                {verificationResult?.passed ? '✓' : '✗'}
              </div>
              <h3>{verificationResult?.passed ? 'BOSS DEFEATED!' : 'NOT QUITE THERE YET'}</h3>
              
              {verificationResult?.score && (
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  margin: '15px 0',
                  color: verificationResult.passed ? '#00ff88' : '#ff4444'
                }}>
                  Score: {verificationResult.score}/100
                </div>
              )}

              {verificationResult && verificationResult.previousBestScore !== null && verificationResult.previousBestScore !== undefined && (
                <div style={{ marginBottom: '12px', color: '#d1d5db', fontSize: '14px' }}>
                  Previous Best: {verificationResult.previousBestScore}/100 | Best Now: {verificationResult.bestScore}/100 | Change: {(verificationResult.scoreDeltaPercent >= 0 ? '+' : '') + verificationResult.scoreDeltaPercent}%
                </div>
              )}

              <div className="transcript-box">
                <strong>Your Explanation:</strong>
                <p>{transcript}</p>
              </div>
              
              <div className="feedback-box">
                <strong>AI Feedback:</strong>
                <p>{feedback}</p>
              </div>

              {verificationResult?.suggestions && verificationResult.suggestions.length > 0 && (
                <div className="feedback-box" style={{ marginTop: '10px', background: 'rgba(255,200,0,0.1)' }}>
                  <strong>💡 Suggestions:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    {verificationResult.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationResult?.passed ? (
                <button className="complete-btn" onClick={handlePass}>
                  CLAIM VICTORY & UNLOCK NEXT NODES
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="start-btn" onClick={handleRetry} style={{ flex: 1 }}>
                    TRY AGAIN
                  </button>
                  <button 
                    className="close-btn" 
                    onClick={onClose}
                    style={{ 
                      flex: 1, 
                      background: 'rgba(100,100,100,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    EXIT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BossFightModal;
