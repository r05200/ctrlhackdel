/**
 * Tests for Concept Routes
 */
const request = require('supertest');
const express = require('express');
const conceptRoutes = require('../../src/routes/conceptRoutes');
const ConceptService = require('../../src/services/conceptService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/concepts', conceptRoutes);

describe('Concept Routes', () => {
  describe('GET /api/concepts', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'test1',
        title: 'Test Concept 1',
        category: 'Test'
      });

      await ConceptService.createConcept({
        concept_id: 'test2',
        title: 'Test Concept 2',
        category: 'Test'
      });
    });

    test('should return all concepts', async () => {
      const res = await request(app)
        .get('/api/concepts')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/concepts?offset=0&limit=1')
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });

    test('should return formatted concept data', async () => {
      const res = await request(app)
        .get('/api/concepts')
        .expect(200);

      expect(res.body.data[0]).toHaveProperty('concept_id');
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('category');
      expect(res.body.data[0]).toHaveProperty('difficulty_level');
    });
  });

  describe('GET /api/concepts/:conceptId', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'derivatives',
        title: 'Derivatives',
        description: 'Rate of change',
        category: 'Calculus',
        difficulty_level: 5
      });
    });

    test('should return specific concept', async () => {
      const res = await request(app)
        .get('/api/concepts/derivatives')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.concept_id).toBe('derivatives');
      expect(res.body.data.title).toBe('Derivatives');
    });

    test('should return 404 for non-existent concept', async () => {
      const res = await request(app)
        .get('/api/concepts/nonexistent')
        .expect(404);

      expect(res.body.error).toBeDefined();
    });

    test('should include prerequisites', async () => {
      const res = await request(app)
        .get('/api/concepts/derivatives')
        .expect(200);

      expect(res.body.data).toHaveProperty('prerequisites');
      expect(Array.isArray(res.body.data.prerequisites)).toBe(true);
    });
  });

  describe('GET /api/concepts/:conceptId/dependencies', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'limits',
        title: 'Limits',
        category: 'Calculus'
      });

      await ConceptService.createConcept({
        concept_id: 'derivatives',
        title: 'Derivatives',
        category: 'Calculus'
      });

      await ConceptService.addPrerequisite('derivatives', 'limits');
    });

    test('should return concept dependencies', async () => {
      const res = await request(app)
        .get('/api/concepts/derivatives/dependencies')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('prerequisites');
      expect(res.body.data).toHaveProperty('dependents');
    });
  });

  describe('GET /api/concepts/:conceptId/learning-path', () => {
    beforeEach(async () => {
      const c1 = await ConceptService.createConcept({
        concept_id: 'basics',
        title: 'Basics',
        category: 'Test',
        difficulty_level: 1
      });

      const c2 = await ConceptService.createConcept({
        concept_id: 'intermediate',
        title: 'Intermediate',
        category: 'Test',
        difficulty_level: 2,
        prerequisites: [c1._id]
      });

      await ConceptService.createConcept({
        concept_id: 'advanced',
        title: 'Advanced',
        category: 'Test',
        difficulty_level: 3,
        prerequisites: [c2._id]
      });
    });

    test('should return learning path', async () => {
      const res = await request(app)
        .get('/api/concepts/advanced/learning-path')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.learning_path).toBeDefined();
      expect(Array.isArray(res.body.data.learning_path)).toBe(true);
    });

    test('should return concepts in correct order', async () => {
      const res = await request(app)
        .get('/api/concepts/advanced/learning-path')
        .expect(200);

      const path = res.body.data.learning_path;
      expect(path.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.concept_id).toBe('advanced');
    });
  });

  describe('GET /api/concepts/category/:category/tree', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'algebra1',
        title: 'Algebra 1',
        category: 'Algebra'
      });

      await ConceptService.createConcept({
        concept_id: 'algebra2',
        title: 'Algebra 2',
        category: 'Algebra'
      });
    });

    test('should return category tree', async () => {
      const res = await request(app)
        .get('/api/concepts/category/Algebra/tree')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.category).toBe('Algebra');
      expect(res.body.data).toHaveProperty('concept_count');
      expect(res.body.data).toHaveProperty('concepts');
    });
  });

  describe('GET /api/concepts/category/:category', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'calculus1',
        title: 'Calculus 1',
        category: 'Calculus'
      });

      await ConceptService.createConcept({
        concept_id: 'calculus2',
        title: 'Calculus 2',
        category: 'Calculus'
      });
    });

    test('should return all concepts in category', async () => {
      const res = await request(app)
        .get('/api/concepts/category/Calculus')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('POST /api/concepts', () => {
    test('should create new concept', async () => {
      const newConcept = {
        concept_id: 'new-concept',
        title: 'New Concept',
        description: 'A new test concept',
        category: 'Test',
        difficulty_level: 3
      };

      const res = await request(app)
        .post('/api/concepts')
        .send(newConcept)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.concept_id).toBe('new-concept');
      expect(res.body.data.title).toBe('New Concept');
    });

    test('should fail without required fields', async () => {
      const incomplete = {
        title: 'Missing concept_id'
      };

      const res = await request(app)
        .post('/api/concepts')
        .send(incomplete)
        .expect(400);

      expect(res.body.error).toBeDefined();
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/concepts')
        .send({})
        .expect(400);

      expect(res.body.error).toContain('required fields');
    });
  });

  describe('PUT /api/concepts/:conceptId', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'test',
        title: 'Original Title',
        category: 'Test'
      });
    });

    test('should update concept', async () => {
      const res = await request(app)
        .put('/api/concepts/test')
        .send({
          title: 'Updated Title',
          difficulty_level: 7
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.difficulty_level).toBe(7);
    });

    test('should fail for non-existent concept', async () => {
      const res = await request(app)
        .put('/api/concepts/nonexistent')
        .send({ title: 'New Title' })
        .expect(500);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/concepts/:conceptId/prerequisites/:prerequisiteId', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'concept1',
        title: 'Concept 1',
        category: 'Test'
      });

      await ConceptService.createConcept({
        concept_id: 'concept2',
        title: 'Concept 2',
        category: 'Test'
      });
    });

    test('should add prerequisite', async () => {
      const res = await request(app)
        .post('/api/concepts/concept2/prerequisites/concept1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.prerequisites.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/concepts/:conceptId', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'to-delete',
        title: 'To Delete',
        category: 'Test'
      });
    });

    test('should delete concept', async () => {
      const res = await request(app)
        .delete('/api/concepts/to-delete')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.deleted).toBe(true);

      // Verify it's actually deleted
      const checkRes = await request(app)
        .get('/api/concepts/to-delete')
        .expect(404);
    });
  });

  describe('GET /api/concepts/search/:query', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'derivatives',
        title: 'Derivatives',
        description: 'Rate of change in calculus',
        category: 'Calculus'
      });

      await ConceptService.createConcept({
        concept_id: 'integrals',
        title: 'Integrals',
        description: 'Reverse of derivatives',
        category: 'Calculus'
      });
    });

    test('should search concepts by title', async () => {
      const res = await request(app)
        .get('/api/concepts/search/Derivatives')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].concept_id).toBe('derivatives');
    });

    test('should filter by category', async () => {
      const res = await request(app)
        .get('/api/concepts/search/calculus?category=Calculus')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
