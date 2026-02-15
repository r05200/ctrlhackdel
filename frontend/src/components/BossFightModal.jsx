import React from 'react';
import './BossFightModal.css';
import { verifyExplanation, transcribeAudio, generateStarTrialQuestions } from '../services/api';

function pickMime() {
  for (const m of ['audio/webm;codecs=opus', 'audio/webm']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

const BossFightModal = ({ node, onClose, onComplete }) => {
  const [transcript, setTranscript] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [stage, setStage] = React.useState('intro'); // intro, loadingQuestions, input, checking, result
  const [userExplanation, setUserExplanation] = React.useState('');
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [inputMode, setInputMode] = React.useState('type');

  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [micStatus, setMicStatus] = React.useState('');
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const [trialQuestions, setTrialQuestions] = React.useState([]);
  const [trialAnswers, setTrialAnswers] = React.useState({});

  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  React.useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const getNormalizedAnswers = React.useCallback(() => (
    trialQuestions.map((q) => ({
      id: q.id,
      answer: String(trialAnswers[q.id] || '').trim()
    }))
  ), [trialAnswers, trialQuestions]);

  const allCriticalAnswersPresent = React.useCallback(() => {
    const answers = getNormalizedAnswers();
    return answers.length === 2 && answers.every((entry) => entry.answer.length >= 8);
  }, [getNormalizedAnswers]);

  const loadTrialQuestions = React.useCallback(async () => {
    const response = await generateStarTrialQuestions(node.id, node);
    const questions = Array.isArray(response?.questions) ? response.questions.slice(0, 2) : [];
    if (questions.length !== 2) {
      throw new Error('Failed to load Star Trial critical-thinking questions.');
    }
    setTrialQuestions(questions);
    setTrialAnswers((prev) => {
      const next = { ...prev };
      questions.forEach((q) => {
        if (!Object.prototype.hasOwnProperty.call(next, q.id)) next[q.id] = '';
      });
      return next;
    });
  }, [node]);

  const handleStartStarTrial = async () => {
    setError(null);
    setStage('loadingQuestions');
    try {
      await loadTrialQuestions();
      setStage('input');
    } catch (err) {
      setError(err.message || 'Could not start Star Trial. Please retry.');
      setStage('intro');
    }
  };

  const startRecording = async () => {
    setError(null);
    setMicStatus('Requesting microphone...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setMicStatus('Recording saved. Review and submit when ready.');
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setMicStatus('Recording...');
    } catch (err) {
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
    setMicStatus('Recording discarded.');
    setError(null);
  };

  const submitForVerification = async (explanationText) => {
    if (!String(explanationText || '').trim()) {
      setError('Please provide your explanation.');
      return;
    }
    if (!allCriticalAnswersPresent()) {
      setError('Please answer both critical-thinking prompts (at least 8 characters each).');
      return;
    }

    setStage('checking');
    setError(null);

    try {
      const criticalAnswers = getNormalizedAnswers();
      const result = await verifyExplanation(
        node.id,
        explanationText,
        null,
        node,
        criticalAnswers,
        trialQuestions
      );
      setVerificationResult(result);
      setFeedback(result.feedback || result.message);
      setTranscript(explanationText);
      setStage('result');
    } catch (err) {
      setError(err.message || 'Failed to verify. Please try again.');
      setStage('input');
    }
  };

  const handleSubmitTyped = async () => {
    await submitForVerification(userExplanation);
  };

  const handleSubmitRecording = async () => {
    if (!audioBlob) return;
    if (!allCriticalAnswersPresent()) {
      setError('Please answer both critical-thinking prompts before submitting.');
      return;
    }

    setError(null);
    setIsTranscribing(true);
    setMicStatus('Transcribing audio...');

    try {
      const text = await transcribeAudio(audioBlob);
      setUserExplanation(text);
      setMicStatus('Transcript received. Grading...');
      await submitForVerification(text);
    } catch (err) {
      setError(err.message || 'Transcription or grading failed.');
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
    setFeedback('');
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>x</button>

        <div className="modal-header">
          <h2>STAR TRIAL</h2>
          <h3>{node.label}</h3>
          <p className="description">{node.description}</p>
        </div>

        {stage === 'intro' && (
          <div className="stage-content">
            <div className="boss-avatar">
              <div className="ai-orb" />
            </div>
            <p className="ai-message">
              Explain <strong>{node.label}</strong> clearly, then solve two critical-thinking prompts.
            </p>
            {error && <div className="trial-error">{error}</div>}
            <button className="start-btn" onClick={handleStartStarTrial}>
              START STAR TRIAL
            </button>
          </div>
        )}

        {stage === 'loadingQuestions' && (
          <div className="stage-content">
            <div className="analyzing">
              <div className="spinner" />
              <p className="status-text">PREPARING STAR TRIAL...</p>
            </div>
          </div>
        )}

        {stage === 'input' && (
          <div className="stage-content">
            <div className="boss-avatar">
              <div className="ai-orb" />
            </div>
            <p className="ai-message">
              Explain <strong>{node.label}</strong>, then answer the two prompts below.
            </p>

            <div className="mode-toggle">
              {['type', 'mic'].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setInputMode(m);
                    setError(null);
                  }}
                  className={`mode-btn ${inputMode === m ? 'active' : ''}`}
                >
                  {m === 'type' ? 'Type' : 'Mic'}
                </button>
              ))}
            </div>

            {inputMode === 'type' && (
              <>
                <textarea
                  className="explanation-input"
                  value={userExplanation}
                  onChange={(e) => setUserExplanation(e.target.value)}
                  placeholder="Type your explanation here... (minimum 20 words recommended)"
                  rows="6"
                />
                <div className="word-count">
                  Words: {userExplanation.split(/\s+/).filter(Boolean).length}
                </div>
              </>
            )}

            {inputMode === 'mic' && (
              <div className="mic-block">
                <div className="mic-actions">
                  {!isRecording && !audioBlob && (
                    <button className="start-btn" onClick={startRecording}>Start Recording</button>
                  )}
                  {isRecording && (
                    <button className="start-btn danger" onClick={stopRecording}>Stop Recording</button>
                  )}
                  {audioBlob && !isRecording && (
                    <>
                      <button className="start-btn secondary" onClick={discardRecording}>Re-record</button>
                      <button className="start-btn" onClick={handleSubmitRecording} disabled={isTranscribing}>
                        {isTranscribing ? 'Processing...' : 'Submit Recording'}
                      </button>
                    </>
                  )}
                </div>
                {audioUrl && !isRecording && (
                  <audio controls src={audioUrl} style={{ width: '100%', marginTop: 8 }} />
                )}
                {micStatus && <div className="mic-status">{micStatus}</div>}
              </div>
            )}

            <div className="trial-question-list">
              {trialQuestions.map((q, idx) => (
                <div className="trial-question-card" key={q.id}>
                  <div className="trial-question-title">Critical Prompt {idx + 1}</div>
                  <p className="trial-question-text">{q.prompt}</p>
                  <textarea
                    className="trial-answer-input"
                    rows="3"
                    value={trialAnswers[q.id] || ''}
                    onChange={(e) => setTrialAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Your reasoning..."
                  />
                </div>
              ))}
            </div>

            {error && <div className="trial-error">{error}</div>}
            {inputMode === 'type' && (
              <button className="start-btn" onClick={handleSubmitTyped} style={{ marginTop: 14 }}>
                SUBMIT STAR TRIAL
              </button>
            )}
            {inputMode === 'mic' && (
              <button
                className="start-btn"
                onClick={handleSubmitRecording}
                disabled={!audioBlob || isRecording || isTranscribing}
                style={{ marginTop: 14 }}
              >
                {isTranscribing ? 'PROCESSING...' : 'SUBMIT STAR TRIAL'}
              </button>
            )}
          </div>
        )}

        {stage === 'checking' && (
          <div className="stage-content">
            <div className="analyzing">
              <div className="spinner" />
              <p className="status-text">EVALUATING STAR TRIAL...</p>
              <div className="scan-lines" />
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="stage-content">
            <div className={`result ${verificationResult?.passed ? 'success' : 'failure'}`}>
              <div className="result-icon">{verificationResult?.passed ? '✓' : '!'}</div>
              <h3>{verificationResult?.passed ? 'STAR TRIAL PASSED' : 'STAR TRIAL INCOMPLETE'}</h3>

              {verificationResult?.score !== undefined && (
                <div className="result-score">Score: {verificationResult.score}/100</div>
              )}

              <div className="transcript-box">
                <strong>Your Explanation</strong>
                <p>{transcript}</p>
              </div>

              <div className="feedback-box">
                <strong>AI Feedback</strong>
                <p>{feedback}</p>
              </div>

              {Array.isArray(verificationResult?.trialReview) && verificationResult.trialReview.length > 0 && (
                <div className="feedback-box">
                  <strong>Critical Thinking Review</strong>
                  <ul className="trial-review-list">
                    {verificationResult.trialReview.map((item) => (
                      <li key={item.id}>
                        {item.id.toUpperCase()}: {item.feedback || 'Reviewed'}{typeof item.score === 'number' ? ` (${item.score}/100)` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationResult?.passed ? (
                <button className="complete-btn" onClick={handlePass}>
                  COMPLETE STAR TRIAL
                </button>
              ) : (
                <div className="result-actions">
                  <button className="start-btn" onClick={handleRetry}>TRY AGAIN</button>
                  <button className="start-btn secondary" onClick={onClose}>EXIT</button>
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
