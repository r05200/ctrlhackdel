import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchPastConstellations,
  updatePastConstellationTags,
  updatePastConstellationTitle,
  deletePastConstellation
} from '../services/api';
import './PastConstellationsView.css';

function normalizeTag(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function isMasteredStatus(status) {
  if (typeof status === 'number') return status > 0;
  return String(status || '').trim().toLowerCase() === 'mastered';
}

function getCompletionPercent(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  if (!nodes.length) return 0;
  const masteredCount = nodes.filter((node) => isMasteredStatus(node.status)).length;
  return Math.round((masteredCount / nodes.length) * 100);
}

export default function PastConstellationsView({ onOpenConstellation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [tagDraftById, setTagDraftById] = useState({});
  const [titleDraftById, setTitleDraftById] = useState({});
  const [isSavingTitleById, setIsSavingTitleById] = useState({});
  const [openingId, setOpeningId] = useState(null);
  const cardRefs = useRef({});

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await fetchPastConstellations();
      setItems(Array.isArray(result) ? result : []);
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
    const safeItems = Array.isArray(items) ? items : [];
    const pool = new Set();
    safeItems.forEach((item) => (item.tags || []).forEach((tag) => pool.add(tag)));
    return [...pool].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const q = query.trim().toLowerCase();
    return safeItems.filter((item) => {
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

  const handleSaveTitle = async (item) => {
    const nextTitle = String(titleDraftById[item.id] ?? item.title ?? '').trim();
    const currentTitle = String(item.title || '').trim();
    if (!nextTitle || nextTitle === currentTitle) return;

    try {
      setIsSavingTitleById((prev) => ({ ...prev, [item.id]: true }));
      const response = await updatePastConstellationTitle(item.id, nextTitle);
      const updated = response.item;
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
      setTitleDraftById((prev) => ({ ...prev, [item.id]: updated.title || nextTitle }));
    } catch (err) {
      console.error('Failed to update title:', err);
      alert(err.message || 'Failed to update title');
    } finally {
      setIsSavingTitleById((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const buildPreviewStars = (seedKey, count = 16) => {
    const seedString = String(seedKey || 'constellation');
    let seed = 0;
    for (let i = 0; i < seedString.length; i += 1) {
      seed = (seed * 31 + seedString.charCodeAt(i)) >>> 0;
    }
    const next = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967295;
    };

    return Array.from({ length: count }).map((_, idx) => ({
      id: `${seedKey}-star-${idx}`,
      x: 7 + next() * 86,
      y: 12 + next() * 74,
      size: 1.6 + next() * 2.6,
      delayMs: Math.round(next() * 650)
    }));
  };

  const handleOpen = (item) => {
    if (!item?.graph?.nodes || !item?.graph?.links || openingId) return;

    const cardElement = cardRefs.current[item.id];
    const rect = cardElement?.getBoundingClientRect?.();
    const originRect = rect
      ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      : null;

    setOpeningId(item.id);
    onOpenConstellation?.(item, {
      originRect,
      previewStars: buildPreviewStars(item.id, 18)
    });
  };

  if (loading) {
    return <div className="past-constellations-view">Loading past constellations...</div>;
  }

  return (
    <div className="past-constellations-view">
      <div className="past-constellations-head">
        <h2 className="past-constellations-title">Galaxy</h2>
        <p className="past-constellations-subtitle">Rename, tag, open, and delete saved maps.</p>
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
          {filtered.map((item) => {
            const completionPercent = getCompletionPercent(item.graph);
            const isComplete = completionPercent === 100;

            return (
              <div
                key={item.id}
                className={`past-card ${openingId === item.id ? 'is-opening' : ''} ${isComplete ? 'is-complete' : ''}`}
                ref={(node) => {
                  if (node) cardRefs.current[item.id] = node;
                  else delete cardRefs.current[item.id];
                }}
              >
              <div className="past-card-preview" aria-hidden="true">
                {buildPreviewStars(item.id, 16).map((star) => (
                  <span
                    key={star.id}
                    className="past-card-star"
                    style={{
                      left: `${star.x}%`,
                      top: `${star.y}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      animationDelay: `${star.delayMs}ms`
                    }}
                  />
                ))}
              </div>
              <div className="past-card-top">
                <div>
                  <div className="past-title-row">
                    <input
                      className="past-title-input"
                      value={titleDraftById[item.id] ?? item.title ?? ''}
                      onChange={(e) => setTitleDraftById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => handleSaveTitle(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      maxLength={120}
                    />
                    <button
                      type="button"
                      className="past-rename-btn"
                      onClick={() => handleSaveTitle(item)}
                      disabled={!!isSavingTitleById[item.id]}
                    >
                      {isSavingTitleById[item.id] ? 'Saving...' : 'Rename'}
                    </button>
                  </div>
                  <div className="past-card-query">Query: {item.query || '-'}</div>
                  <div className="past-card-time">
                    Updated: {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                  </div>
                  <div className={`past-card-progress ${isComplete ? 'complete' : ''}`}>
                    Complete: {completionPercent}%
                  </div>
                  {Number.isFinite(Number(item.gauntletBestScore)) && (
                    <div className="past-card-gauntlet-best">
                      Star Gauntlet PB: {Math.round(Number(item.gauntletBestScore))}%
                    </div>
                  )}
                </div>
                <div className="past-card-actions">
                  <button type="button" onClick={() => handleOpen(item)} className="past-open-btn" disabled={!!openingId}>
                    Open
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} className="past-delete-btn" disabled={!!openingId}>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
