import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchPastConstellations,
  updatePastConstellationTags,
  deletePastConstellation
} from '../services/api';
import './PastConstellationsView.css';

function normalizeTag(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export default function PastConstellationsView({ onOpenConstellation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [tagDraftById, setTagDraftById] = useState({});

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await fetchPastConstellations();
      setItems(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load past constellations:', err);
      setError(err.message || 'Failed to load past constellations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const allTags = useMemo(() => {
    const pool = new Set();
    items.forEach((item) => (item.tags || []).forEach((tag) => pool.add(tag)));
    return [...pool].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const sourceQuery = String(item.query || '').toLowerCase();
      const matchesQuery = !q || title.includes(q) || sourceQuery.includes(q);
      const matchesTag = !activeTag || (item.tags || []).includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [items, query, activeTag]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this constellation?')) return;
    try {
      await deletePastConstellation(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete constellation:', err);
      alert(err.message || 'Failed to delete constellation');
    }
  };

  const updateTags = async (item, tags) => {
    const response = await updatePastConstellationTags(item.id, tags);
    const updated = response.item;
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
  };

  const handleAddTag = async (item) => {
    const draft = tagDraftById[item.id] || '';
    const normalized = normalizeTag(draft);
    if (!normalized) return;
    if ((item.tags || []).includes(normalized)) {
      setTagDraftById((prev) => ({ ...prev, [item.id]: '' }));
      return;
    }
    try {
      await updateTags(item, [...(item.tags || []), normalized]);
      setTagDraftById((prev) => ({ ...prev, [item.id]: '' }));
    } catch (err) {
      console.error('Failed to add tag:', err);
      alert(err.message || 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (item, tagToRemove) => {
    try {
      await updateTags(item, (item.tags || []).filter((tag) => tag !== tagToRemove));
    } catch (err) {
      console.error('Failed to remove tag:', err);
      alert(err.message || 'Failed to remove tag');
    }
  };

  if (loading) {
    return <div className="past-constellations-view">Loading past constellations...</div>;
  }

  return (
    <div className="past-constellations-view">
      <div className="past-constellations-head">
        <h2 className="past-constellations-title">Past Constellations</h2>
        <p className="past-constellations-subtitle">Query, tag, open, and delete saved maps.</p>
      </div>

      <div className="past-toolbar">
        <input
          className="past-query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or source query"
        />
        <div className="past-tag-filter-row">
          <button
            type="button"
            className={`past-tag-filter ${activeTag === '' ? 'active' : ''}`}
            onClick={() => setActiveTag('')}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`past-tag-filter ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="past-error">{error}</div>}

      {filtered.length === 0 ? (
        <div className="past-empty">No constellations match your filters.</div>
      ) : (
        <div className="past-list">
          {filtered.map((item) => (
            <div key={item.id} className="past-card">
              <div className="past-card-top">
                <div>
                  <div className="past-card-title">{item.title || 'Untitled Constellation'}</div>
                  <div className="past-card-query">Query: {item.query || '-'}</div>
                  <div className="past-card-time">
                    Updated: {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="past-card-actions">
                  <button type="button" onClick={() => onOpenConstellation?.(item)} className="past-open-btn">
                    Open
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} className="past-delete-btn">
                    Delete
                  </button>
                </div>
              </div>

              <div className="past-tags-row">
                {(item.tags || []).map((tag) => (
                  <button
                    type="button"
                    key={`${item.id}-${tag}`}
                    className="past-tag-chip"
                    onClick={() => handleRemoveTag(item, tag)}
                    title="Remove tag"
                  >
                    #{tag} x
                  </button>
                ))}
              </div>

              <div className="past-tag-editor">
                <input
                  className="past-tag-input"
                  value={tagDraftById[item.id] || ''}
                  onChange={(e) => setTagDraftById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(item);
                    }
                  }}
                  placeholder="add-tag"
                />
                <button type="button" className="past-add-tag-btn" onClick={() => handleAddTag(item)}>
                  Add Tag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
