/**
 * Tests for ConceptService
 */
const ConceptService = require('../../src/services/conceptService');
const Concept = require('../../src/models/Concept');

describe('ConceptService', () => {
  describe('createConcept', () => {
    test('should create a new concept', async () => {
      const data = {
        concept_id: 'limits',
        title: 'Limits',
        category: 'Calculus',
        difficulty_level: 3
      };

      const concept = await ConceptService.createConcept(data);

      expect(concept.concept_id).toBe('limits');
      expect(concept.title).toBe('Limits');
      expect(concept.category).toBe('Calculus');
    });

    test('should return existing concept if already exists', async () => {
      const data = {
        concept_id: 'derivatives',
        title: 'Derivatives',
        category: 'Calculus'
      };

      const concept1 = await ConceptService.createConcept(data);
      const concept2 = await ConceptService.createConcept(data);

      expect(concept1._id).toEqual(concept2._id);
    });

    test('should set default difficulty level', async () => {
      const data = {
        concept_id: 'test',
        title: 'Test',
        category: 'Test'
      };

      const concept = await ConceptService.createConcept(data);
      expect(concept.difficulty_level).toBe(1);
    });
  });

  describe('getConceptById', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'functions',
        title: 'Functions',
        category: 'Algebra'
      });
    });

    test('should retrieve concept by concept_id', async () => {
      const concept = await ConceptService.getConceptById('functions');
      expect(concept).toBeDefined();
      expect(concept.title).toBe('Functions');
    });

    test('should return null for non-existent concept', async () => {
      const concept = await ConceptService.getConceptById('nonexistent');
      expect(concept).toBeNull();
    });
  });

  describe('getConceptsByCategory', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'algebra-basics',
        title: 'Algebra Basics',
        category: 'Algebra',
        difficulty_level: 1
      });

      await ConceptService.createConcept({
        concept_id: 'algebra-advanced',
        title: 'Advanced Algebra',
        category: 'Algebra',
        difficulty_level: 5
      });

      await ConceptService.createConcept({
        concept_id: 'calculus-intro',
        title: 'Introduction to Calculus',
        category: 'Calculus',
        difficulty_level: 3
      });
    });

    test('should return all concepts in a category', async () => {
      const concepts = await ConceptService.getConceptsByCategory('Algebra');
      expect(concepts.length).toBe(2);
    });

    test('should sort concepts by difficulty level', async () => {
      const concepts = await ConceptService.getConceptsByCategory('Algebra');
      expect(concepts[0].difficulty_level).toBeLessThanOrEqual(concepts[1].difficulty_level);
    });

    test('should return empty array for non-existent category', async () => {
      const concepts = await ConceptService.getConceptsByCategory('NonExistent');
      expect(concepts).toEqual([]);
    });
  });

  describe('getConceptsByDifficulty', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'easy',
        title: 'Easy',
        category: 'Test',
        difficulty_level: 2
      });

      await ConceptService.createConcept({
        concept_id: 'medium',
        title: 'Medium',
        category: 'Test',
        difficulty_level: 5
      });

      await ConceptService.createConcept({
        concept_id: 'hard',
        title: 'Hard',
        category: 'Test',
        difficulty_level: 8
      });
    });

    test('should filter by difficulty range', async () => {
      const concepts = await ConceptService.getConceptsByDifficulty('Test', 3, 7);
      expect(concepts.length).toBe(1);
      expect(concepts[0].concept_id).toBe('medium');
    });
  });

  describe('getCategoryTree', () => {
    beforeEach(async () => {
      const prereq = await ConceptService.createConcept({
        concept_id: 'limits',
        title: 'Limits',
        category: 'Calculus',
        difficulty_level: 1
      });

      await ConceptService.createConcept({
        concept_id: 'derivatives',
        title: 'Derivatives',
        category: 'Calculus',
        difficulty_level: 2,
        prerequisites: [prereq._id]
      });
    });

    test('should return category tree with concepts', async () => {
      const tree = await ConceptService.getCategoryTree('Calculus');

      expect(tree.category).toBe('Calculus');
      expect(tree.concept_count).toBe(2);
      expect(tree.concepts).toHaveLength(2);
    });

    test('should include prerequisites in tree', async () => {
      const tree = await ConceptService.getCategoryTree('Calculus');
      const derivatives = tree.concepts.find(c => c.concept_id === 'derivatives');

      expect(derivatives.prerequisites).toHaveLength(1);
      expect(derivatives.prerequisites[0].concept_id).toBe('limits');
    });
  });

  describe('getAllConcepts', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await ConceptService.createConcept({
          concept_id: `concept-${i}`,
          title: `Concept ${i}`,
          category: 'Test'
        });
      }
    });

    test('should retrieve all concepts with pagination', async () => {
      const concepts = await ConceptService.getAllConcepts(0, 100);
      expect(concepts.length).toBe(5);
    });

    test('should respect offset and limit', async () => {
      const concepts = await ConceptService.getAllConcepts(2, 2);
      expect(concepts.length).toBe(2);
    });
  });

  describe('updateConcept', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'test',
        title: 'Original Title',
        category: 'Test'
      });
    });

    test('should update concept properties', async () => {
      const updated = await ConceptService.updateConcept('test', {
        title: 'New Title',
        difficulty_level: 5
      });

      expect(updated.title).toBe('New Title');
      expect(updated.difficulty_level).toBe(5);
    });

    test('should throw error for non-existent concept', async () => {
      await expect(
        ConceptService.updateConcept('nonexistent', { title: 'New' })
      ).rejects.toThrow();
    });
  });

  describe('addPrerequisite', () => {
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

    test('should add prerequisite to concept', async () => {
      const updated = await ConceptService.addPrerequisite('concept2', 'concept1');
      expect(updated.prerequisites.length).toBe(1);
    });

    test('should not add duplicate prerequisites', async () => {
      await ConceptService.addPrerequisite('concept2', 'concept1');
      const updated = await ConceptService.addPrerequisite('concept2', 'concept1');
      expect(updated.prerequisites.length).toBe(1);
    });
  });

  describe('removePrerequisite', () => {
    beforeEach(async () => {
      const concept1 = await ConceptService.createConcept({
        concept_id: 'concept1',
        title: 'Concept 1',
        category: 'Test'
      });

      await ConceptService.createConcept({
        concept_id: 'concept2',
        title: 'Concept 2',
        category: 'Test',
        prerequisites: [concept1._id]
      });
    });

    test('should remove prerequisite from concept', async () => {
      const updated = await ConceptService.removePrerequisite('concept2', 'concept1');
      expect(updated.prerequisites.length).toBe(0);
    });
  });

  describe('deleteConcept', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'to-delete',
        title: 'To Delete',
        category: 'Test'
      });
    });

    test('should delete concept', async () => {
      const result = await ConceptService.deleteConcept('to-delete');
      expect(result.deleted).toBe(true);
      expect(result.concept_id).toBe('to-delete');

      const deleted = await ConceptService.getConceptById('to-delete');
      expect(deleted).toBeNull();
    });

    test('should throw error for non-existent concept', async () => {
      await expect(
        ConceptService.deleteConcept('nonexistent')
      ).rejects.toThrow();
    });
  });

  describe('getLearningPath', () => {
    beforeEach(async () => {
      const concept1 = await ConceptService.createConcept({
        concept_id: 'basics',
        title: 'Basics',
        category: 'Test',
        difficulty_level: 1
      });

      const concept2 = await ConceptService.createConcept({
        concept_id: 'intermediate',
        title: 'Intermediate',
        category: 'Test',
        difficulty_level: 2,
        prerequisites: [concept1._id]
      });

      await ConceptService.createConcept({
        concept_id: 'advanced',
        title: 'Advanced',
        category: 'Test',
        difficulty_level: 3,
        prerequisites: [concept2._id]
      });
    });

    test('should return learning path in correct order', async () => {
      const path = await ConceptService.getLearningPath('advanced');

      expect(path.length).toBeGreaterThanOrEqual(1);
      expect(path[path.length - 1].concept_id).toBe('advanced');
    });
  });

  describe('searchConcepts', () => {
    beforeEach(async () => {
      await ConceptService.createConcept({
        concept_id: 'search-derivatives',
        title: 'Derivatives Search Test',
        description: 'Rate of change in calculus',
        category: 'Calculus'
      });

      await ConceptService.createConcept({
        concept_id: 'search-integrals',
        title: 'Integrals Search Test',
        description: 'Reverse of derivatives',
        category: 'Calculus'
      });
    });

    test('should search by title', async () => {
      const results = await ConceptService.searchConcepts('Derivatives Search Test');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.concept_id === 'search-derivatives')).toBe(true);
    });

    test('should search by description', async () => {
      const results = await ConceptService.searchConcepts('calculus');
      expect(results.length).toBeGreaterThan(0);
    });

    test('should search case-insensitive', async () => {
      const results = await ConceptService.searchConcepts('derivatives search test');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.concept_id === 'search-derivatives')).toBe(true);
    });

    test('should filter by category', async () => {
      const results = await ConceptService.searchConcepts('', 'Calculus');
      expect(results.length).toBe(2);
    });
  });
});
