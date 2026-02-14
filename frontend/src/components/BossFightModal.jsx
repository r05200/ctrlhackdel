import React from 'react';
import './BossFightModal.css';
import apiService from '../services/api';

const BossFightModal = ({ node, onClose, onComplete }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [score, setScore] = React.useState(0);
  const [stage, setStage] = React.useState('intro'); // intro, recording, checking, result, failed
  const [explanationText, setExplanationText] = React.useState('');
  const [passed, setPassed] = React.useState(false);

  const handleStartBossFight = () => {
    setStage('recording');
    setIsRecording(true);
    // Simulate recording for 30 seconds
    setTimeout(async () => {
      setIsRecording(false);
      setStage('checking');
      await verifyExplanation();
    }, 3000);
  };

  const verifyExplanation = async () => {
    try {
      // Simulate a transcript by generating sample text for demo
      const sampleExplanations = {
        'data-structures': `${node.label} are ways to organize and store data efficiently. For example, arrays provide fast access time of O(1) for reading elements. Linked lists are useful when we need frequent insertions and deletions. Hash tables allow us to store key-value pairs and retrieve them quickly using a hash function. Different data structures are optimized for different use cases and operations.`,
        'algorithms': `Algorithms are step-by-step procedures to solve problems efficiently. For example, sorting algorithms like merge sort and quick sort organize data. Searching algorithms like binary search help us find elements quickly. We analyze algorithm efficiency using Big O notation. Time and space complexity are important factors in choosing the right algorithm for a problem.`,
        'neural-networks': `Neural networks are inspired by how biological brains work. They consist of interconnected nodes that process information. Each connection has a weight that gets adjusted during training. The network learns by propagating errors backwards through the network in a process called backpropagation. This allows the network to improve its predictions over time.`,
      };

      // Use a sample explanation or generate a simple one
      let explanation = sampleExplanations[node.id] || 
        `${node.label} is an important concept in computer science. It involves understanding the core principles and being able to explain them clearly. The ability to articulate complex ideas simply is a crucial skill in learning and teaching.`;

      setExplanationText(explanation);
      
      // Call the backend API to verify the explanation
      const response = await apiService.verifyExplanation(node.id, explanation, null);
      
      setTimeout(() => {
        setStage('result');
        setFeedback(response.feedback || response.message);
        setTranscript(explanation);
        setScore(response.score || 0);
        setPassed(response.passed);
      }, 1500);
    } catch (error) {
      console.error('Error verifying explanation:', error);
      setTimeout(() => {
        setStage('result');
        setFeedback('Error checking your explanation. Please try again.');
        setPassed(false);
        setScore(0);
      }, 1500);
    }
  };

  const handlePass = () => {
    if (passed) {
      onComplete(node.id);
      onClose();
    }
  };

  const handleRetry = () => {
    setStage('intro');
    setTranscript('');
    setFeedback('');
    setScore(0);
    setExplanationText('');
    setPassed(false);
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
            {passed ? (
              <div className="result success">
                <div className="result-icon">✓</div>
                <h3>BOSS DEFEATED!</h3>
                <div className="score-display">
                  <p className="score-text">SCORE: <span className="score-value">{score}%</span></p>
                </div>
                <div className="transcript-box">
                  <strong>Your Explanation:</strong>
                  <p>{transcript}</p>
                </div>
                <div className="feedback-box success-feedback">
                  <strong>AI Feedback:</strong>
                  <p>{feedback}</p>
                </div>
                <button className="complete-btn" onClick={handlePass}>
                  CLAIM VICTORY & UNLOCK NEXT NODES
                </button>
              </div>
            ) : (
              <div className="result failed">
                <div className="result-icon">✗</div>
                <h3>BOSS VICTORY DENIED!</h3>
                <div className="score-display">
                  <p className="score-text">SCORE: <span className="score-value">{score}%</span></p>
                </div>
                <div className="transcript-box">
                  <strong>Your Explanation:</strong>
                  <p>{transcript}</p>
                </div>
                <div className="feedback-box failed-feedback">
                  <strong>AI Feedback:</strong>
                  <p>{feedback}</p>
                </div>
                <div className="suggestions">
                  <strong>Try again! Tips:</strong>
                  <ul>
                    <li>Explain concepts more clearly and in detail</li>
                    <li>Use specific examples</li>
                    <li>Show deep understanding of the fundamentals</li>
                  </ul>
                </div>
                <button className="retry-btn" onClick={handleRetry}>
                  TRY AGAIN
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BossFightModal;
