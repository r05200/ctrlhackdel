import React, { useEffect, useMemo, useState } from 'react';
import { fetchUserProgress, fetchPastConstellations } from '../services/api';
import './ProfileView.css';

export default function ProfileView() {
  const [progress, setProgress] = useState(null);
  const [pastConstellations, setPastConstellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [progressData, pastData] = await Promise.all([
          fetchUserProgress(),
          fetchPastConstellations()
        ]);
        setProgress(progressData?.stats || null);
        setPastConstellations(Array.isArray(pastData) ? pastData : []);
        setError(null);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
        setError(err.message || 'Failed to load profile stats');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const uniqueTags = useMemo(() => {
    const set = new Set();
    pastConstellations.forEach((item) => (item.tags || []).forEach((tag) => set.add(tag)));
    return set.size;
  }, [pastConstellations]);

  if (loading) {
    return <div className="profile-view">Loading profile...</div>;
  }

  return (
    <div className="profile-view">
      <div className="profile-header">
        <h2 className="profile-title">Profile</h2>
        <p className="profile-subtitle">Your learning progress at a glance.</p>
      </div>

      {error && <div className="profile-error">{error}</div>}

      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-label">Nodes Completed</div>
          <div className="profile-stat-value">{progress?.mastered ?? 0}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Nodes Active</div>
          <div className="profile-stat-value">{progress?.active ?? 0}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Nodes Locked</div>
          <div className="profile-stat-value">{progress?.locked ?? 0}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Completion</div>
          <div className="profile-stat-value">{progress?.percentage ?? 0}%</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Saved Constellations</div>
          <div className="profile-stat-value">{pastConstellations.length}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Unique Tags</div>
          <div className="profile-stat-value">{uniqueTags}</div>
        </div>
      </div>
    </div>
  );
}
