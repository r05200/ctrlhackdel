import React from 'react';
import './BossFightModal.css';
import { evaluateStarGauntletAnswer, generateStarTrialQuestions, transcribeAudio } from '../services/api';

function pickMime() {
  for (const m of ['audio/webm;codecs=opus', 'audio/webm']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

function normalizeNodeStatus(node) {
  if (typeof node?.status === 'number') {
    if (node.status > 0) return 'mastered';
    if (node.status === 0) return 'active';
    return 'locked';
  }
  return String(node?.status || '').toLowerCase();
}

function isMasteredNode(node) {
  return normalizeNodeStatus(node) === 'mastered';
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StarGauntletModal({ graphData, onClose, onComplete }) {
  const [stage, setStage] = React.useState('intro');
  const [error, setError] = React.useState('');
  const [prompts, setPrompts] = React.useState([]);
  const [answersById, setAnswersById] = React.useState({});
  const [result, setResult] = React.useState(null);
  const [inputMode, setInputMode] = React.useState('type');
  const [activePromptId, setActivePromptId] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [micStatus, setMicStatus] = React.useState('');
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const masteredNodes = React.useMemo(
    () => (Array.isArray(graphData?.nodes) ? graphData.nodes.filter((node) => isMasteredNode(node)) : []),
    [graphData]
  );
  const canStart = masteredNodes.length > 0;

  React.useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const begin = async () => {
    if (!canStart) {
      setError('No constellation nodes available for gauntlet.');
      return;
    }

    setError('');
    setStage('loadingQuestions');
    try {
      const shuffled = shuffle(masteredNodes);
      const chosen = shuffled.slice(0, 5);
      while (chosen.length < 5 && masteredNodes.length > 0) {
        chosen.push(masteredNodes[chosen.length % masteredNodes.length]);
      }

      const firstNode = chosen[0];
      const firstTopic = String(firstNode?.label || firstNode?.id || 'Topic').replace(/\n/g, ' ');
      const generatedPrompts = [{
        id: `g-0-${firstNode?.id || 'topic'}`,
        type: 'explanation',
        node: firstNode,
        prompt: `Explain ${firstTopic} clearly in your own words.`
      }];

      const criticalNodes = chosen.slice(1);
      const criticalPrompts = await Promise.all(
        criticalNodes.map(async (node, idx) => {
          const response = await generateStarTrialQuestions(node.id, node);
          const questions = Array.isArray(response?.questions) ? response.questions : [];
          const pick = questions.length > 0 ? questions[idx % questions.length] : null;
          const fallbackTopic = String(node?.label || node?.id || 'this concept').replace(/\n/g, ' ');

          return {
            id: `g-${idx + 1}-${node?.id || idx + 1}`,
            type: 'critical',
            node,
            prompt: String(
              pick?.prompt ||
              `How would you apply ${fallbackTopic} in a realistic scenario, and why?`
            )
          };
        })
      );

      const allPrompts = [...generatedPrompts, ...criticalPrompts];
      setPrompts(allPrompts);
      setAnswersById(Object.fromEntries(allPrompts.map((item) => [item.id, ''])));
      setActivePromptId(allPrompts[0]?.id || '');
      setInputMode('type');
      setAudioBlob(null);
      setAudioUrl(null);
      setMicStatus('');
      setStage('input');
    } catch (err) {
      setError(err?.message || 'Failed to prepare Star Gauntlet prompts.');
      setStage('intro');
    }
  };

  const startRecording = async () => {
    setError('');
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
        setMicStatus('Recording saved. Transcribe to selected prompt.');
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
  };

  const transcribeToSelectedPrompt = async () => {
    if (!audioBlob) return;
    if (!activePromptId) {
      setError('Select a prompt target before transcription.');
      return;
    }
    setError('');
    setIsTranscribing(true);
    setMicStatus('Transcribing audio...');
    try {
      const text = await transcribeAudio(audioBlob);
      setAnswersById((prev) => ({ ...prev, [activePromptId]: text }));
      setMicStatus('Transcript inserted into selected prompt.');
    } catch (err) {
      setError(err?.message || 'Transcription failed.');
      setMicStatus('');
    } finally {
      setIsTranscribing(false);
    }
  };

  const submit = async () => {
    const unanswered = prompts.some((item) => String(answersById[item.id] || '').trim().length < 8);
    if (unanswered) {
      setError('Please answer all 5 prompts (at least 8 chars each).');
      return;
    }

    setError('');
    setStage('checking');
    try {
      const evaluations = await Promise.all(
        prompts.map(async (item) => {
          const response = await evaluateStarGauntletAnswer({
            nodeId: item.node?.id,
            nodeData: item.node,
            prompt: item.prompt,
            answer: answersById[item.id],
            type: item.type
          });
          return {
            id: item.id,
            type: item.type,
            score: Number(response?.score) || 0,
            passed: Boolean(response?.passed),
            feedback: String(response?.feedback || '')
          };
        })
      );

      const overallScore = Math.round(
        evaluations.reduce((sum, item) => sum + item.score, 0) / Math.max(1, evaluations.length)
      );
      const allMastered = Array.isArray(graphData?.nodes)
        ? graphData.nodes.every((node) => normalizeNodeStatus(node) === 'mastered')
        : false;
      const nextResult = {
        score: overallScore,
        passed: overallScore >= 70,
        allMastered,
        questionScores: evaluations
      };

      setResult(nextResult);
      setStage('result');
      onComplete?.(nextResult);
    } catch (err) {
      setError(err?.message || 'Failed to evaluate Star Gauntlet answers.');
      setStage('input');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>x</button>
        <div className="modal-header">
          <h2>STAR GAUNTLET</h2>
          <p className="description">1 explanation + 4 critical-thinking prompts</p>
        </div>

        {stage === 'intro' && (
          <div className="stage-content">
            <div className="boss-avatar"><div className="ai-orb" /></div>
            <p className="ai-message">
              Review 5 random constellation topics. Complete all prompts to get your gauntlet score.
            </p>
            {error && <div className="trial-error">{error}</div>}
            <button className="start-btn" onClick={begin}>START STAR GAUNTLET</button>
          </div>
        )}

        {stage === 'loadingQuestions' && (
          <div className="stage-content">
            <div className="analyzing">
              <div className="spinner" />
              <p className="status-text">PREPARING STAR GAUNTLET...</p>
            </div>
          </div>
        )}

        {stage === 'input' && (
          <div className="stage-content">
            <div className="mode-toggle">
              {['type', 'mic'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setInputMode(mode);
                    if (mode === 'mic' && prompts[0]?.id) {
                      setActivePromptId(prompts[0].id);
                    }
                    setError('');
                  }}
                  className={`mode-btn ${inputMode === mode ? 'active' : ''}`}
                >
                  {mode === 'type' ? 'Type' : 'Mic (Explanation)'}
                </button>
              ))}
            </div>

            {inputMode === 'mic' && (
              <div className="mic-block" style={{ marginBottom: 12 }}>
                <div className="word-count" style={{ marginBottom: 8 }}>
                  Mic target: Explanation Prompt
                </div>
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
                      <button className="start-btn" onClick={transcribeToSelectedPrompt} disabled={isTranscribing}>
                        {isTranscribing ? 'Processing...' : 'Transcribe to Prompt'}
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
              {prompts.map((item, idx) => (
                <div className="trial-question-card" key={item.id}>
                  <div className="trial-question-title">
                    {idx === 0 ? 'Explanation Prompt' : `Critical Prompt ${idx}`}
                  </div>
                  <p className="trial-question-text">{item.prompt}</p>
                  {!(idx === 0 && inputMode === 'mic') && (
                    <textarea
                      className="trial-answer-input"
                      rows={idx === 0 ? 4 : 3}
                      value={answersById[item.id] || ''}
                      onChange={(e) => setAnswersById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Your answer..."
                    />
                  )}
                </div>
              ))}
            </div>
            {error && <div className="trial-error">{error}</div>}
            <button className="start-btn" onClick={submit} style={{ marginTop: 14 }}>
              SUBMIT STAR GAUNTLET
            </button>
          </div>
        )}

        {stage === 'checking' && (
          <div className="stage-content">
            <div className="analyzing">
              <div className="spinner" />
              <p className="status-text">EVALUATING STAR GAUNTLET...</p>
              <div className="scan-lines" />
            </div>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="stage-content">
            <div className={`result ${result.passed ? 'success' : 'failure'}`}>
              <div className="result-icon">{result.passed ? 'PASS' : '!'}</div>
              <h3>{result.passed ? 'GAUNTLET COMPLETE' : 'GAUNTLET INCOMPLETE'}</h3>
              <div className="result-score">Score: {result.score}%</div>
              {Array.isArray(result.questionScores) && result.questionScores.length > 0 && (
                <div className="feedback-box">
                  <strong>Gemini Review</strong>
                  <ul className="trial-review-list">
                    {result.questionScores.map((item, idx) => (
                      <li key={item.id}>
                        Q{idx + 1}: {item.score}/100 - {item.feedback || (item.passed ? 'Passed' : 'Needs more depth')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!result.allMastered && (
                <div className="trial-error" style={{ marginBottom: 10 }}>
                  Personal best is only tracked after all constellation Star Trials are completed.
                </div>
              )}
              <button className="complete-btn" onClick={onClose}>CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
