/**
 * Tests for UserSkill Model
 */
const UserSkill = require('../../src/models/UserSkill');
const Concept = require('../../src/models/Concept');

describe('UserSkill Model', () => {
  let testConcept;

  beforeEach(async () => {
    testConcept = await Concept.create({
      concept_id: 'test-concept',
      title: 'Test Concept',
      category: 'Test'
    });
  });

  describe('Schema Validation', () => {
    test('should create user skill with valid data', async () => {
      const skillData = {
        user_id: 'user123',
        concept_id: testConcept._id,
        status: 'learning',
        progress: 50
      };

      const skill = await UserSkill.create(skillData);

      expect(skill.user_id).toBe('user123');
      expect(skill.status).toBe('learning');
      expect(skill.progress).toBe(50);
    });

    test('should fail without required fields', async () => {
      await expect(
        UserSkill.create({ user_id: 'user123' })
      ).rejects.toThrow();
    });

    test('should convert user_id to lowercase', async () => {
      const skill = await UserSkill.create({
        user_id: 'USER123',
        concept_id: testConcept._id
      });

      expect(skill.user_id).toBe('user123');
    });

    test('should set default status to notstarted', async () => {
      const skill = await UserSkill.create({
        user_id: 'user123',
        concept_id: testConcept._id
      });

      expect(skill.status).toBe('notstarted');
    });

    test('should set default progress to 0', async () => {
      const skill = await UserSkill.create({
        user_id: 'user123',
        concept_id: testConcept._id
      });

      expect(skill.progress).toBe(0);
    });

    test('should validate progress range', async () => {
      await expect(
        UserSkill.create({
          user_id: 'user123',
          concept_id: testConcept._id,
          progress: 150
        })
      ).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      await expect(
        UserSkill.create({
          user_id: 'user123',
          concept_id: testConcept._id,
          status: 'invalid-status'
        })
      ).rejects.toThrow();
    });

    test('should enforce unique user_id and concept_id combination', async () => {
      await UserSkill.create({
        user_id: 'user123',
        concept_id: testConcept._id
      });

      await expect(
        UserSkill.create({
          user_id: 'user123',
          concept_id: testConcept._id
        })
      ).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should set created_at and updated_at', async () => {
      const skill = await UserSkill.create({
        user_id: 'user123',
        concept_id: testConcept._id
      });

      expect(skill.created_at).toBeDefined();
      expect(skill.updated_at).toBeDefined();
    });
  });

  describe('Completed Status', () => {
    test('should set completed_at when status is completed', async () => {
      const skill = await UserSkill.create({
        user_id: 'user123',
        concept_id: testConcept._id,
        status: 'completed',
        completed_at: new Date()
      });

      expect(skill.completed_at).toBeDefined();
    });

    test('should have null completed_at for non-completed skills', async () => {
      const skill = await UserSkill.create({
        user_id: 'user123',
        concept_id: testConcept._id,
        status: 'learning'
      });

      expect(skill.completed_at).toBeNull();
    });
  });

  describe('Queries', () => {
    beforeEach(async () => {
      const concept1 = await Concept.create({
        concept_id: 'concept1',
        title: 'Concept 1',
        category: 'Test'
      });

      const concept2 = await Concept.create({
        concept_id: 'concept2',
        title: 'Concept 2',
        category: 'Test'
      });

      await UserSkill.create({
        user_id: 'user1',
        concept_id: concept1._id,
        status: 'completed'
      });

      await UserSkill.create({
        user_id: 'user1',
        concept_id: concept2._id,
        status: 'learning',
        progress: 50
      });

      await UserSkill.create({
        user_id: 'user2',
        concept_id: concept1._id,
        status: 'notstarted'
      });
    });

    test('should find all skills for a user', async () => {
      const skills = await UserSkill.find({ user_id: 'user1' });
      expect(skills.length).toBe(2);
    });

    test('should find skills by status', async () => {
      const completed = await UserSkill.find({ status: 'completed' });
      expect(completed.length).toBe(1);
    });

    test('should find user skills in category', async () => {
      const skills = await UserSkill.find({ user_id: 'user1' });
      expect(skills.length).toBe(2);
    });
  });
});
