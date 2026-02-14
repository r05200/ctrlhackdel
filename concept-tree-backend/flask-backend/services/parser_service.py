"""
Service layer for parsing text and auto-populating concepts via Gemini API
"""
from services.gemini_service import GeminiConceptExtractor, ConceptInterpolationService
from services.concept_service import ConceptService
from models.concept import Concept
from typing import Dict, List, Optional


class ConceptParserService:
    """Parse text input and automatically create concept trees"""
    
    @staticmethod
    def parse_and_create_concepts(text: str, category: str = "") -> Dict:
        """
        Main entry point: Parse text and create all concepts in database
        
        Args:
            text: User-provided table of contents or topic list
            category: Optional category name
        
        Returns:
            Dictionary with:
            - created_concepts: List of created concepts
            - relationships: List of established relationships
            - interpolated: List of interpolated concepts
            - summary: Human-readable output
        """
        
        # Step 1: Extract concepts from text using Gemini
        extraction_result = GeminiConceptExtractor.extract_concepts_from_text(text, category)
        
        concepts = extraction_result.get("concepts", [])
        relationships = extraction_result.get("relationships", [])
        category = extraction_result.get("category", category or "Uncategorized")
        
        # Step 2: Interpolate missing prerequisites
        concepts = ConceptInterpolationService.interpolate_with_rules(concepts)
        concepts = GeminiConceptExtractor.interpolate_prerequisites(concepts)
        
        # Step 3: Create all concepts in database
        created_concepts = []
        concept_map = {}  # Map title -> concept_id for relationship lookup
        
        # Create fundamental concepts first
        for concept_data in concepts:
            if concept_data.get("is_fundamental", False):
                try:
                    concept = ConceptParserService._create_concept(
                        concept_data, category
                    )
                    created_concepts.append(concept)
                    concept_map[concept_data["title"]] = concept.concept_id
                except Exception as e:
                    print(f"Warning: Could not create concept {concept_data['title']}: {e}")
        
        # Then create dependent concepts
        for concept_data in concepts:
            if not concept_data.get("is_fundamental", False):
                try:
                    concept = ConceptParserService._create_concept(
                        concept_data, category, prerequisite_map=concept_map
                    )
                    created_concepts.append(concept)
                    concept_map[concept_data["title"]] = concept.concept_id
                except Exception as e:
                    print(f"Warning: Could not create concept {concept_data['title']}: {e}")
        
        # Step 4: Process relationships and establish prerequisites
        interpolated = [c for c in concepts if c not in 
                       extraction_result.get("concepts", [])]
        
        established_relationships = ConceptParserService._establish_relationships(
            relationships, concept_map
        )
        
        return {
            "created_count": len(created_concepts),
            "created_concepts": [c.to_dict(include_prerequisites=True) 
                                for c in created_concepts],
            "relationships_count": len(established_relationships),
            "established_relationships": established_relationships,
            "interpolated_count": len(interpolated),
            "interpolated_concepts": [c.get("title") for c in interpolated],
            "category": category,
            "summary": extraction_result.get("summary", ""),
            "learning_path": extraction_result.get("learning_path", "")
        }
    
    @staticmethod
    def _create_concept(concept_data: Dict, category: str, 
                       prerequisite_map: Dict = None) -> Optional[Concept]:
        """Create a single concept in the database"""
        
        if not concept_data.get("concept_id"):
            raise ValueError(f"Concept missing concept_id: {concept_data}")
        
        # Check if concept already exists
        existing = ConceptService.get_concept(concept_data["concept_id"])
        if existing:
            return existing
        
        # Get prerequisites from the map
        prerequisites = []
        if prerequisite_map:
            # Try to find prerequisites by title
            concept_lower = concept_data.get("title", "").lower()
            
            # Get prerequisite titles from Gemini suggestions
            all_titles = list(prerequisite_map.keys())
            prereq_titles = GeminiConceptExtractor.suggest_dependencies(
                concept_data.get("title", ""), 
                all_titles
            )
            
            # Map titles to concept_ids
            for title in prereq_titles:
                if title.lower() in prerequisite_map:
                    prereq_id = prerequisite_map[title.lower()]
                    if prereq_id:
                        prerequisites.append(prereq_id)
        
        # Create concept with prerequisites
        concept = ConceptService.create_concept(
            concept_id=concept_data["concept_id"],
            title=concept_data.get("title", ""),
            description=concept_data.get("description", ""),
            category=category,
            difficulty=concept_data.get("difficulty_level", 1),
            prerequisites=prerequisites
        )
        
        return concept
    
    @staticmethod
    def _establish_relationships(relationships: List[Dict], 
                               concept_map: Dict[str, str]) -> List[Dict]:
        """Establish prerequisite relationships between concepts"""
        
        established = []
        
        for rel in relationships:
            concept_title = rel.get("concept")
            prereq_title = rel.get("prerequisite")
            
            # Find concept IDs
            concept_id = None
            prereq_id = None
            
            for title, cid in concept_map.items():
                if title.lower() == concept_title.lower():
                    concept_id = cid
                if title.lower() == prereq_title.lower():
                    prereq_id = cid
            
            # If both found, establish relationship
            if concept_id and prereq_id:
                try:
                    concept = ConceptService.get_concept(concept_id)
                    prereq_concept = ConceptService.get_concept(prereq_id)
                    
                    if concept and prereq_concept:
                        # Add prerequisite if not already present
                        has_prereq = any(p.concept_id == prereq_id 
                                       for p in concept.prerequisites)
                        
                        if not has_prereq:
                            concept.prerequisites.append(prereq_concept)
                            concept.save()
                            
                            established.append({
                                "concept": concept_id,
                                "prerequisite": prereq_id,
                                "reason": rel.get("reason", "")
                            })
                except Exception as e:
                    print(f"Warning: Could not establish relationship: {e}")
        
        return established
    
    @staticmethod
    def infer_category_from_text(text: str) -> str:
        """Infer the category/domain from text content"""
        
        keywords = {
            "Linear Algebra": ["matrix", "vector", "eigenvalue", "determinant", "linear"],
            "Calculus": ["derivative", "integral", "limit", "continuity", "calculus"],
            "Algebra": ["polynomial", "equation", "quadratic", "factor"],
            "Geometry": ["angle", "triangle", "circle", "polygon", "spatial"],
            "Statistics": ["probability", "distribution", "variance", "mean", "correlation"],
            "Computer Science": ["algorithm", "data structure", "complexity", "graph"],
            "Physics": ["force", "energy", "momentum", "field", "quantum"],
        }
        
        text_lower = text.lower()
        
        # Count keyword matches
        scores = {}
        for category, keywords_list in keywords.items():
            score = sum(1 for kw in keywords_list if kw in text_lower)
            if score > 0:
                scores[category] = score
        
        if scores:
            return max(scores, key=scores.get)
        
        return "General Knowledge"


class ConceptRefineService:
    """Service for refining and improving extracted concept trees"""
    
    @staticmethod
    def validate_and_fix_tree(category: str) -> Dict:
        """
        Validate a fully-created concept tree and suggest/apply fixes
        
        Args:
            category: Category to validate
        
        Returns:
            Validation report with fixes applied
        """
        
        concepts = ConceptService.get_all_concepts(category=category)
        
        issues = []
        fixes_applied = []
        
        # Check for circular dependencies
        for concept in concepts:
            chain = concept.get_dependency_chain()
            if concept.concept_id in chain:
                issues.append({
                    "type": "circular_dependency",
                    "concept": concept.title,
                    "message": f"Circular dependency detected"
                })
        
        # Check for orphaned concepts
        all_concept_ids = {c.concept_id for c in concepts}
        for concept in concepts:
            for prereq in concept.prerequisites:
                if prereq.concept_id not in all_concept_ids:
                    issues.append({
                        "type": "missing_prerequisite",
                        "concept": concept.title,
                        "prerequisite": prereq.title,
                        "message": f"Prerequisite no longer exists"
                    })
        
        # Check for reasonable difficulty progression
        for concept in concepts:
            if concept.prerequisites:
                max_prereq_difficulty = max(
                    (p.difficulty_level for p in concept.prerequisites),
                    default=1
                )
                if concept.difficulty_level <= max_prereq_difficulty:
                    # Adjust difficulty
                    concept.difficulty_level = max_prereq_difficulty + 1
                    concept.save()
                    fixes_applied.append({
                        "type": "difficulty_adjustment",
                        "concept": concept.title,
                        "new_difficulty": concept.difficulty_level
                    })
        
        return {
            "category": category,
            "total_concepts": len(concepts),
            "issues_found": len(issues),
            "issues": issues,
            "fixes_applied": len(fixes_applied),
            "fixes": fixes_applied,
            "validation_status": "passed" if not issues else "has_issues"
        }
