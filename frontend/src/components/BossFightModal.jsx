import React from 'react';
import './BossFightModal.css';

const BossFightModal = ({ node, onClose, onComplete }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [stage, setStage] = React.useState('intro'); // intro, recording, checking, result

  const handleStartBossFight = () => {
    setStage('recording');
    setIsRecording(true);
    // Simulate recording for demo
    setTimeout(() => {
      setIsRecording(false);
      setStage('checking');
      simulateAICheck();
    }, 3000);
  };

  const simulateAICheck = () => {
    setTimeout(() => {
      setStage('result');
      setFeedback('Excellent explanation! You clearly understand the core concepts.');
      setTranscript('Simulated: Data structures are ways to organize and store data efficiently. Arrays provide O(1) access time...');
    }, 2000);
  };

  const handlePass = () => {
    onComplete(node.id);
    onClose();
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
              "I'm a confused student. Explain <strong>{node.label}</strong> to me like I'm 10 years old. 
              You have 30 seconds. Be clear, or you fail."
            </p>
            <button className="start-btn" onClick={handleStartBossFight}>
              BEGIN ORAL EXAM
            </button>
          </div>
        )}

        {stage === 'recording' && (
          <div className="stage-content">
            <div className="recording-orb pulsing">
              <div className="mic-icon">🎤</div>
            </div>
            <p className="status-text">LISTENING...</p>
            <div className="timer">00:{Math.floor(Math.random() * 30).toString().padStart(2, '0')}</div>
            <div className="waveform">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
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
            <div className="result success">
              <div className="result-icon">✓</div>
              <h3>BOSS DEFEATED!</h3>
              <div className="transcript-box">
                <strong>Your Explanation:</strong>
                <p>{transcript}</p>
              </div>
              <div className="feedback-box">
                <strong>AI Feedback:</strong>
                <p>{feedback}</p>
              </div>
              <button className="complete-btn" onClick={handlePass}>
                CLAIM VICTORY & UNLOCK NEXT NODES
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BossFightModal;
