/**
 * Tests for UserService
 */
const UserService = require('../../src/services/userService');
const ConceptService = require('../../src/services/conceptService');
const UserSkill = require('../../src/models/UserSkill');

describe('UserService', () => {
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

  describe('markConceptCompleted', () => {
    test('should mark concept as completed', async () => {
      const result = await UserService.markConceptCompleted('user1', 'basics');

      expect(result.user_id).toBe('user1');
      expect(result.status).toBe('completed');
      expect(result.completed_at).toBeDefined();
    });

    test('should throw error for non-existent concept', async () => {
      await expect(
        UserService.markConceptCompleted('user1', 'nonexistent')
      ).rejects.toThrow();
    });

    test('should populate concept details in response', async () => {
      const result = await UserService.markConceptCompleted('user1', 'basics');

      expect(result.concept).toBeDefined();
      expect(result.concept.concept_id).toBe('basics');
      expect(result.concept.title).toBe('Basics');
    });
  });

  describe('updateSkillProgress', () => {
    test('should update skill progress', async () => {
      const result = await UserService.updateSkillProgress('user1', 'basics', 75);

      expect(result.progress).toBe(75);
      expect(result.status).toBe('learning');
    });

    test('should mark as completed when progress reaches 100', async () => {
      const result = await UserService.updateSkillProgress('user1', 'basics', 100);

      expect(result.progress).toBe(100);
      expect(result.status).toBe('completed');
    });

    test('should set status to notstarted for zero progress', async () => {
      const result = await UserService.updateSkillProgress('user1', 'basics', 0);

      expect(result.progress).toBe(0);
      expect(result.status).toBe('notstarted');
    });

    test('should validate progress range', async () => {
      await expect(
        UserService.updateSkillProgress('user1', 'basics', 150)
      ).rejects.toThrow('Progress must be between 0 and 100');
    });

    test('should throw error for non-existent concept', async () => {
      await expect(
        UserService.updateSkillProgress('user1', 'nonexistent', 50)
      ).rejects.toThrow();
    });
  });

  describe('getCompletedConcepts', () => {
    beforeEach(async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.markConceptCompleted('user1', 'intermediate');
      await UserService.updateSkillProgress('user1', 'advanced', 50);
    });

    test('should return completed concepts for user', async () => {
      const completed = await UserService.getCompletedConcepts('user1');

      expect(completed.length).toBe(2);
    });

    test('should not include in-progress concepts', async () => {
      const completed = await UserService.getCompletedConcepts('user1');
      const conceptIds = completed.map(c => c.concept_id.concept_id);

      expect(conceptIds).not.toContain('advanced');
    });

    test('should return empty array for user with no completed concepts', async () => {
      const completed = await UserService.getCompletedConcepts('user-with-nothing');

      expect(completed).toEqual([]);
    });
  });

  describe('getAvailableConcepts', () => {
    test('should return concepts with no prerequisites as available', async () => {
      const available = await UserService.getAvailableConcepts('user1');
      const availableIds = available.map(c => c.concept_id);

      expect(availableIds).toContain('basics');
    });

    test('should not return concepts with incomplete prerequisites', async () => {
      const available = await UserService.getAvailableConcepts('user1');
      const availableIds = available.map(c => c.concept_id);

      expect(availableIds).not.toContain('intermediate');
    });

    test('should return concepts after prerequisites are completed', async () => {
      await UserService.markConceptCompleted('user1', 'basics');

      const available = await UserService.getAvailableConcepts('user1');
      const availableIds = available.map(c => c.concept_id);

      expect(availableIds).toContain('intermediate');
    });
  });

  describe('getUserSkillTree', () => {
    beforeEach(async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.updateSkillProgress('user1', 'intermediate', 50);
    });

    test('should return user skill tree', async () => {
      const tree = await UserService.getUserSkillTree('user1');

      expect(tree.user_id).toBe('user1');
      expect(tree.total_concepts).toBeGreaterThan(0);
      expect(tree.completed).toBe(1);
      expect(tree.in_progress).toBe(1);
    });

    test('should include all concepts in tree', async () => {
      const tree = await UserService.getUserSkillTree('user1');

      expect(tree.concepts).toHaveLength(tree.total_concepts);
    });

    test('should include user status for each concept', async () => {
      const tree = await UserService.getUserSkillTree('user1');

      const basics = tree.concepts.find(c => c.concept_id === 'basics');
      expect(basics.user_status).toBe('completed');
    });

    test('should include user progress for each concept', async () => {
      const tree = await UserService.getUserSkillTree('user1');

      const intermediate = tree.concepts.find(c => c.concept_id === 'intermediate');
      expect(intermediate.user_progress).toBe(50);
    });
  });

  describe('exportUserSkillTree', () => {
    beforeEach(async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.updateSkillProgress('user1', 'intermediate', 60);
    });

    test('should export user skill tree with summary', async () => {
      const exported = await UserService.exportUserSkillTree('user1');

      expect(exported.user_id).toBe('user1');
      expect(exported.export_date).toBeDefined();
      expect(exported.summary).toBeDefined();
    });

    test('should calculate completion percentage', async () => {
      const exported = await UserService.exportUserSkillTree('user1');

      expect(exported.summary.percent_complete).toBeGreaterThan(0);
      expect(exported.summary.percent_complete).toBeLessThanOrEqual(100);
    });

    test('should include skills in export', async () => {
      const exported = await UserService.exportUserSkillTree('user1');

      expect(exported.skills).toBeDefined();
      expect(Array.isArray(exported.skills)).toBe(true);
    });

    test('should calculate statistics correctly', async () => {
      const exported = await UserService.exportUserSkillTree('user1');

      expect(exported.summary.total_concepts).toBe(3);
      expect(exported.summary.completed).toBe(1);
      expect(exported.summary.in_progress).toBe(1);
      expect(exported.summary.not_started).toBe(1);
    });
  });

  describe('multiple users', () => {
    test('should track skills independently for different users', async () => {
      await UserService.markConceptCompleted('user1', 'basics');
      await UserService.markConceptCompleted('user2', 'intermediate');

      const user1Completed = await UserService.getCompletedConcepts('user1');
      const user2Completed = await UserService.getCompletedConcepts('user2');

      expect(user1Completed.length).toBe(1);
      expect(user2Completed.length).toBe(1);
      expect(user1Completed[0].concept_id.concept_id).toBe('basics');
      expect(user2Completed[0].concept_id.concept_id).toBe('intermediate');
    });
  });
});
