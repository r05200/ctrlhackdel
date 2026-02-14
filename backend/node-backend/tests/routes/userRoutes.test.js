/**
 * Tests for User Routes
 */
const request = require('supertest');
const express = require('express');
const userRoutes = require('../../src/routes/userRoutes');
const ConceptService = require('../../src/services/conceptService');
const UserService = require('../../src/services/userService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let testConcept1, testConcept2, testConcept3;

  beforeEach(async () => {
    testConcept1 = await ConceptService.createConcept({
      concept_id: 'basics',
      title: 'Basics',
      category: 'Test',
      difficulty_level: 1
    });

    testConcept2 = await ConceptService.createConcept({
      concept_id: 'intermediate',
      title: 'Intermediate',
      category: 'Test',
      difficulty_level: 2,
      prerequisites: [testConcept1._id]
    });

    testConcept3 = await ConceptService.createConcept({
      concept_id: 'advanced',
      title: 'Advanced',
      category: 'Test',
      difficulty_level: 3
    });
  });

  describe('GET /api/users/:userId/skills', () => {
    beforeEach(async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.updateSkillProgress('user1', 'intermediate', 50);
    });

    test('should return user skill tree', async () => {
      const res = await request(app)
        .get('/api/users/user1/skills')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user_id).toBe('user1');
    });

    test('should include total concepts', async () => {
      const res = await request(app)
        .get('/api/users/user1/skills')
        .expect(200);

      expect(res.body.data).toHaveProperty('total_concepts');
      expect(res.body.data.total_concepts).toBeGreaterThan(0);
    });

    test('should include completion stats', async () => {
      const res = await request(app)
        .get('/api/users/user1/skills')
        .expect(200);

      expect(res.body.data).toHaveProperty('completed');
      expect(res.body.data).toHaveProperty('in_progress');
    });
  });

  describe('GET /api/users/:userId/completed', () => {
    beforeEach(async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.markConceptCompleted('user1', 'advanced');
      await UserService.updateSkillProgress('user1', 'intermediate', 50);
    });

    test('should return completed concepts', async () => {
      const res = await request(app)
        .get('/api/users/user1/completed')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBe(2);
    });

    test('should include concept details', async () => {
      const res = await request(app)
        .get('/api/users/user1/completed')
        .expect(200);

      expect(res.body.data[0]).toHaveProperty('concept_id');
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('completed_at');
    });

    test('should not include in-progress concepts', async () => {
      const res = await request(app)
        .get('/api/users/user1/completed')
        .expect(200);

      const conceptIds = res.body.data.map(c => c.concept_id);
      expect(conceptIds).not.toContain('intermediate');
    });

    test('should return empty array for user with no completions', async () => {
      const res = await request(app)
        .get('/api/users/user-with-nothing/completed')
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/users/:userId/available', () => {
    test('should return available concepts', async () => {
      const res = await request(app)
        .get('/api/users/user1/available')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should include concepts with no prerequisites', async () => {
      const res = await request(app)
        .get('/api/users/user1/available')
        .expect(200);

      const conceptIds = res.body.data.map(c => c.concept_id);
      expect(conceptIds).toContain('basics');
    });

    test('should not include concepts with incomplete prerequisites', async () => {
      const res = await request(app)
        .get('/api/users/user1/available')
        .expect(200);

      const conceptIds = res.body.data.map(c => c.concept_id);
      expect(conceptIds).not.toContain('intermediate');
    });

    test('should include concepts after prerequisites completed', async () => {
      await UserService.markConceptCompleted('user1', 'basics');

      const res = await request(app)
        .get('/api/users/user1/available')
        .expect(200);

      const conceptIds = res.body.data.map(c => c.concept_id);
      expect(conceptIds).toContain('intermediate');
    });

    test('should include concept details', async () => {
      const res = await request(app)
        .get('/api/users/user1/available')
        .expect(200);

      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('concept_id');
        expect(res.body.data[0]).toHaveProperty('title');
        expect(res.body.data[0]).toHaveProperty('difficulty_level');
      }
    });
  });

  describe('POST /api/users/:userId/skills/:conceptId/complete', () => {
    test('should mark concept as completed', async () => {
      const res = await request(app)
        .post('/api/users/user1/skills/basics/complete')
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completed_at).toBeDefined();
    });

    test('should fail for non-existent concept', async () => {
      const res = await request(app)
        .post('/api/users/user1/skills/nonexistent/complete')
        .expect(500);

      expect(res.body.error).toBeDefined();
    });

    test('should return concept details', async () => {
      const res = await request(app)
        .post('/api/users/user1/skills/basics/complete')
        .expect(201);

      expect(res.body.data).toHaveProperty('concept');
      expect(res.body.data.concept.concept_id).toBe('basics');
    });
  });

  describe('PUT /api/users/:userId/skills/:conceptId/progress', () => {
    test('should update skill progress', async () => {
      const res = await request(app)
        .put('/api/users/user1/skills/basics/progress')
        .send({ progress: 75 })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.progress).toBe(75);
      expect(res.body.data.status).toBe('learning');
    });

    test('should fail without progress field', async () => {
      const res = await request(app)
        .put('/api/users/user1/skills/basics/progress')
        .send({})
        .expect(400);

      expect(res.body.error).toContain('progress field required');
    });

    test('should validate progress range', async () => {
      const res = await request(app)
        .put('/api/users/user1/skills/basics/progress')
        .send({ progress: 150 })
        .expect(500);

      expect(res.body.error).toBeDefined();
    });

    test('should mark as completed when progress is 100', async () => {
      const res = await request(app)
        .put('/api/users/user1/skills/basics/progress')
        .send({ progress: 100 })
        .expect(200);

      expect(res.body.data.progress).toBe(100);
      expect(res.body.data.status).toBe('completed');
    });

    test('should fail for non-existent concept', async () => {
      const res = await request(app)
        .put('/api/users/user1/skills/nonexistent/progress')
        .send({ progress: 50 })
        .expect(500);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/users/:userId/export', () => {
    beforeEach(async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.updateSkillProgress('user1', 'intermediate', 60);
    });

    test('should export user skill tree', async () => {
      const res = await request(app)
        .get('/api/users/user1/export')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user_id).toBe('user1');
      expect(res.body.data).toHaveProperty('export_date');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('skills');
    });

    test('should include summary statistics', async () => {
      const res = await request(app)
        .get('/api/users/user1/export')
        .expect(200);

      expect(res.body.data.summary).toHaveProperty('total_concepts');
      expect(res.body.data.summary).toHaveProperty('completed');
      expect(res.body.data.summary).toHaveProperty('in_progress');
      expect(res.body.data.summary).toHaveProperty('percent_complete');
    });

    test('should include skills array', async () => {
      const res = await request(app)
        .get('/api/users/user1/export')
        .expect(200);

      expect(Array.isArray(res.body.data.skills)).toBe(true);
    });
  });

  describe('Multiple users', () => {
    test('should track different users independently', async () => {
      await request(app)
        .post('/api/users/user1/skills/basics/complete')
        .expect(201);

      await request(app)
        .put('/api/users/user2/skills/intermediate/progress')
        .send({ progress: 50 })
        .expect(200);

      const user1Completed = await request(app)
        .get('/api/users/user1/completed')
        .expect(200);

      const user2Completed = await request(app)
        .get('/api/users/user2/completed')
        .expect(200);

      expect(user1Completed.body.data.length).toBe(1);
      expect(user2Completed.body.data.length).toBe(0);
    });
  });

  describe('Error handling', () => {
    test('should handle case-insensitive user IDs', async () => {
      const res1 = await request(app)
        .post('/api/users/USER1/skills/basics/complete')
        .expect(201);

      const res2 = await request(app)
        .get('/api/users/user1/completed')
        .expect(200);

      // Both should reference the same lowercase user_id
      expect(res2.body.data.length).toBeGreaterThan(0);
    });

    test('should return 500 for server errors', async () => {
      const res = await request(app)
        .put('/api/users/user1/skills/basics/progress')
        .send({ progress: 'invalid' })
        .expect(500);

      expect(res.body.error).toBeDefined();
    });
  });
});
