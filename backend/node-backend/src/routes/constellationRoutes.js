const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const router = express.Router();
const STORE_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(STORE_DIR, 'constellations.json');

const createId = () => `const_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

async function ensureStore() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify({ items: [] }, null, 2), 'utf-8');
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, 'utf-8');
  const data = JSON.parse(raw);
  return { items: Array.isArray(data.items) ? data.items : [] };
}

async function writeStore(data) {
  await ensureStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

router.get('/', async (req, res) => {
  try {
    const { q = '', tag = '' } = req.query;
    const query = String(q || '').trim().toLowerCase();
    const matchTag = String(tag || '').trim().toLowerCase();
    const store = await readStore();

    let items = [...store.items];
    if (query) {
      items = items.filter((item) => {
        const title = String(item.title || '').toLowerCase();
        const sourceQuery = String(item.query || '').toLowerCase();
        return title.includes(query) || sourceQuery.includes(query);
      });
    }
    if (matchTag) {
      items = items.filter((item) =>
        Array.isArray(item.tags) &&
        item.tags.some((t) => String(t).toLowerCase() === matchTag)
      );
    }
    items.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error loading constellations:', error);
    res.status(500).json({ success: false, message: 'Failed to load constellations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, query, tags = [], graph } = req.body || {};
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
      return res.status(400).json({ success: false, message: 'graph with nodes and links is required' });
    }

    const cleanTags = Array.isArray(tags)
      ? [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))]
      : [];

    const now = new Date().toISOString();
    const item = {
      id: createId(),
      title: String(title || query || 'Untitled Constellation').trim(),
      query: String(query || '').trim(),
      tags: cleanTags,
      graph,
      createdAt: now,
      updatedAt: now
    };

    const store = await readStore();
    store.items.push(item);
    await writeStore(store);
    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Error saving constellation:', error);
    res.status(500).json({ success: false, message: 'Failed to save constellation' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body || {};
    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'tags array is required' });
    }

    const cleanTags = [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
    const store = await readStore();
    const index = store.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Constellation not found' });
    }

    store.items[index].tags = cleanTags;
    store.items[index].updatedAt = new Date().toISOString();
    await writeStore(store);
    res.json({ success: true, item: store.items[index] });
  } catch (error) {
    console.error('Error updating constellation:', error);
    res.status(500).json({ success: false, message: 'Failed to update constellation' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const store = await readStore();
    const nextItems = store.items.filter((item) => item.id !== id);
    if (nextItems.length === store.items.length) {
      return res.status(404).json({ success: false, message: 'Constellation not found' });
    }

    store.items = nextItems;
    await writeStore(store);
    res.json({ success: true, message: 'Constellation deleted' });
  } catch (error) {
    console.error('Error deleting constellation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete constellation' });
  }
});

module.exports = router;
