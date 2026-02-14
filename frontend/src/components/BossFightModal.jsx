import React from 'react';
import './BossFightModal.css';
import { verifyExplanation } from '../services/api';

const BossFightModal = ({ node, onClose, onComplete }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [stage, setStage] = React.useState('intro'); // intro, input, checking, result
  const [userExplanation, setUserExplanation] = React.useState('');
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleStartBossFight = () => {
    setStage('input');
  };

  const handleSubmitExplanation = async () => {
    if (!userExplanation.trim()) {
      alert('Please provide an explanation before submitting.');
      return;
    }

    setStage('checking');
    setError(null);

    try {
      // Call backend API to verify the explanation
      const result = await verifyExplanation(node.id, userExplanation);
      
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

  const handlePass = () => {
    onComplete(node.id, userExplanation);
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
            <textarea
              className="explanation-input"
              value={userExplanation}
              onChange={(e) => setUserExplanation(e.target.value)}
              placeholder="Type your explanation here... (minimum 20 words recommended)"
              rows="6"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'vertical',
                marginTop: '15px'
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
            <button 
              className="start-btn" 
              onClick={handleSubmitExplanation}
              style={{ marginTop: '15px' }}
            >
              SUBMIT EXPLANATION
            </button>
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
