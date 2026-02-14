/**
 * Tests for Concept Model
 */
const Concept = require('../../src/models/Concept');

describe('Concept Model', () => {
  describe('Schema Validation', () => {
    test('should create a concept with valid data', async () => {
      const conceptData = {
        concept_id: 'derivatives',
        title: 'Derivatives',
        description: 'Rate of change',
        category: 'Calculus',
        difficulty_level: 5
      };

      const concept = await Concept.create(conceptData);

      expect(concept.concept_id).toBe('derivatives');
      expect(concept.title).toBe('Derivatives');
      expect(concept.category).toBe('Calculus');
      expect(concept.difficulty_level).toBe(5);
    });

    test('should fail to create concept without required fields', async () => {
      const invalidData = {
        title: 'Missing concept_id'
      };

      await expect(Concept.create(invalidData)).rejects.toThrow();
    });

    test('should convert concept_id to lowercase', async () => {
      const conceptData = {
        concept_id: 'DERIVATIVES',
        title: 'Derivatives',
        category: 'Calculus'
      };

      const concept = await Concept.create(conceptData);
      expect(concept.concept_id).toBe('derivatives');
    });

    test('should enforce unique concept_id', async () => {
      const conceptData = {
        concept_id: 'limits',
        title: 'Limits',
        category: 'Calculus'
      };

      await Concept.create(conceptData);

      await expect(Concept.create(conceptData)).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const conceptData = {
        concept_id: 'test-concept',
        title: 'Test Concept',
        category: 'Test'
      };

      const concept = await Concept.create(conceptData);

      expect(concept.difficulty_level).toBe(1);
      expect(concept.description).toBe('');
      expect(concept.prerequisites).toEqual([]);
    });

    test('should validate difficulty_level range', async () => {
      const invalidData = {
        concept_id: 'invalid-difficulty',
        title: 'Test',
        category: 'Test',
        difficulty_level: 15
      };

      await expect(Concept.create(invalidData)).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should set created_at and updated_at timestamps', async () => {
      const concept = await Concept.create({
        concept_id: 'timestamps-test',
        title: 'Timestamps Test',
        category: 'Test'
      });

      expect(concept.created_at).toBeDefined();
      expect(concept.updated_at).toBeDefined();
    });
  });

  describe('Prerequisites', () => {
    test('should add prerequisites to concept', async () => {
      const prereq = await Concept.create({
        concept_id: 'functions',
        title: 'Functions',
        category: 'Algebra'
      });

      const concept = await Concept.create({
        concept_id: 'derivatives',
        title: 'Derivatives',
        category: 'Calculus',
        prerequisites: [prereq._id]
      });

      const populated = await Concept.findById(concept._id).populate('prerequisites');
      expect(populated.prerequisites.length).toBe(1);
      expect(populated.prerequisites[0].concept_id).toBe('functions');
    });

    test('should allow multiple prerequisites', async () => {
      const prereq1 = await Concept.create({
        concept_id: 'limits',
        title: 'Limits',
        category: 'Calculus'
      });

      const prereq2 = await Concept.create({
        concept_id: 'continuity',
        title: 'Continuity',
        category: 'Calculus'
      });

      const concept = await Concept.create({
        concept_id: 'differentiability',
        title: 'Differentiability',
        category: 'Calculus',
        prerequisites: [prereq1._id, prereq2._id]
      });

      const populated = await Concept.findById(concept._id).populate('prerequisites');
      expect(populated.prerequisites.length).toBe(2);
    });
  });

  describe('Queries', () => {
    beforeEach(async () => {
      await Concept.create({
        concept_id: 'algebra-basics',
        title: 'Algebra Basics',
        category: 'Algebra',
        difficulty_level: 1
      });

      await Concept.create({
        concept_id: 'algebra-advanced',
        title: 'Advanced Algebra',
        category: 'Algebra',
        difficulty_level: 5
      });

      await Concept.create({
        concept_id: 'calculus-basics',
        title: 'Calculus Basics',
        category: 'Calculus',
        difficulty_level: 3
      });
    });

    test('should find concept by concept_id', async () => {
      const concept = await Concept.findOne({ concept_id: 'algebra-basics' });
      expect(concept).toBeDefined();
      expect(concept.title).toBe('Algebra Basics');
    });

    test('should find all concepts in category', async () => {
      const concepts = await Concept.find({ category: 'Algebra' });
      expect(concepts.length).toBe(2);
    });

    test('should find concepts by difficulty level', async () => {
      const concepts = await Concept.find({
        category: 'Algebra',
        difficulty_level: { $lte: 3 }
      });
      expect(concepts.length).toBe(1);
    });
  });
});
