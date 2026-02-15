import React from 'react';
import './BossFightModal.css';

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

function buildGauntletPrompts(nodes) {
  const safeNodes = Array.isArray(nodes) ? nodes.filter((node) => node && isMasteredNode(node)) : [];
  const shuffled = shuffle(safeNodes);
  const chosen = shuffled.slice(0, 5);
  while (chosen.length < 5 && safeNodes.length > 0) {
    chosen.push(safeNodes[chosen.length % safeNodes.length]);
  }
  return chosen.map((node, idx) => {
    const topic = String(node.label || node.id || 'Topic').replace(/\n/g, ' ');
    if (idx === 0) {
      return {
        id: `g-${idx}-${node.id || topic}`,
        type: 'explanation',
        node,
        prompt: `Explain ${topic} clearly in your own words.`
      };
    }
    return {
      id: `g-${idx}-${node.id || topic}`,
      type: 'critical',
      node,
      prompt: `Apply ${topic} to a concrete scenario and justify your choices.`
    };
  });
}

function scoreAnswer(answer, type) {
  const text = String(answer || '').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (!text) return 0;
  if (type === 'explanation') {
    if (words >= 30) return 92;
    if (words >= 20) return 82;
    if (words >= 12) return 70;
    return 55;
  }
  if (words >= 24) return 90;
  if (words >= 15) return 78;
  if (words >= 9) return 66;
  return 52;
}

export default function StarGauntletModal({ graphData, onClose, onComplete }) {
  const [stage, setStage] = React.useState('intro');
  const [error, setError] = React.useState('');
  const [prompts, setPrompts] = React.useState([]);
  const [answersById, setAnswersById] = React.useState({});
  const [result, setResult] = React.useState(null);

  const masteredNodes = React.useMemo(
    () => (Array.isArray(graphData?.nodes) ? graphData.nodes.filter((node) => isMasteredNode(node)) : []),
    [graphData]
  );
  const canStart = masteredNodes.length > 0;

  const begin = () => {
    if (!canStart) {
      setError('No constellation nodes available for gauntlet.');
      return;
    }
    const generated = buildGauntletPrompts(masteredNodes);
    setPrompts(generated);
    setAnswersById(Object.fromEntries(generated.map((q) => [q.id, ''])));
    setError('');
    setStage('input');
  };

  const submit = () => {
    const unanswered = prompts.some((q) => String(answersById[q.id] || '').trim().length < 8);
    if (unanswered) {
      setError('Please answer all 5 prompts (at least 8 chars each).');
      return;
    }

    const questionScores = prompts.map((q) => ({
      id: q.id,
      type: q.type,
      score: scoreAnswer(answersById[q.id], q.type)
    }));
    const total = questionScores.reduce((acc, item) => acc + item.score, 0);
    const overallScore = Math.round(total / questionScores.length);

    const allMastered = graphData.nodes.every((node) => normalizeNodeStatus(node) === 'mastered');
    const nextResult = {
      score: overallScore,
      passed: overallScore >= 70,
      allMastered,
      questionScores
    };

    setResult(nextResult);
    setStage('result');
    onComplete?.(nextResult);
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

        {stage === 'input' && (
          <div className="stage-content">
            <div className="trial-question-list">
              {prompts.map((q, idx) => (
                <div className="trial-question-card" key={q.id}>
                  <div className="trial-question-title">
                    {idx === 0 ? 'Explanation Prompt' : `Critical Prompt ${idx}`}
                  </div>
                  <p className="trial-question-text">{q.prompt}</p>
                  <textarea
                    className="trial-answer-input"
                    rows={idx === 0 ? 4 : 3}
                    value={answersById[q.id] || ''}
                    onChange={(e) => setAnswersById((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Your answer..."
                  />
                </div>
              ))}
            </div>
            {error && <div className="trial-error">{error}</div>}
            <button className="start-btn" onClick={submit} style={{ marginTop: 14 }}>
              SUBMIT STAR GAUNTLET
            </button>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="stage-content">
            <div className={`result ${result.passed ? 'success' : 'failure'}`}>
              <div className="result-icon">{result.passed ? '✓' : '!'}</div>
              <h3>{result.passed ? 'GAUNTLET COMPLETE' : 'GAUNTLET INCOMPLETE'}</h3>
              <div className="result-score">Score: {result.score}%</div>
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
