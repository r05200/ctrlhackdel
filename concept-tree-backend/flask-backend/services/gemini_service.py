"""
Gemini API integration for concept extraction and dependency interpolation
"""
import google.generativeai as genai
import json
import os
from typing import List, Dict, Optional
import re

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class GeminiConceptExtractor:
    """Uses Gemini API to extract concepts and dependencies from text"""
    
    MODEL_NAME = "gemini-3-flash-preview"
    
    @staticmethod
    def extract_concepts_from_text(text: str, category: str = "") -> Dict:
        """
        Parse user-provided text about topics/TOC and extract structured concepts
        
        Args:
            text: Table of contents, topic list, or concept description
            category: Optional category for grouping (e.g., "Linear Algebra")
        
        Returns:
            Dictionary with:
            - concepts: List of concepts with their properties
            - relationships: List of prerequisite/dependency relationships
            - category: Inferred or provided category
            - summary: Human-readable summary
        """
        
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        prompt = GeminiConceptExtractor._build_extraction_prompt(text, category)
        
        try:
            model = genai.GenerativeModel(GeminiConceptExtractor.MODEL_NAME)
            response = model.generate_content(prompt)
            
            # Parse JSON response
            result = GeminiConceptExtractor._parse_gemini_response(response.text)
            return result
            
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    @staticmethod
    def interpolate_prerequisites(concepts: List[Dict]) -> List[Dict]:
        """
        Use Gemini to identify missing intermediate concepts needed for prerequisites
        
        Example: If "L'Hôpital's Rule" is present, ensure "Derivatives" is included
        
        Args:
            concepts: List of concept dictionaries
        
        Returns:
            Augmented list with interpolated concepts
        """
        
        if not GEMINI_API_KEY:
            return concepts
        
        concept_names = [c["title"] for c in concepts]
        concept_str = "\n".join(concept_names)
        
        prompt = f"""
Analyze these mathematical/scientific concepts and identify important prerequisite 
or foundational concepts that are missing but should be learned first:

Concepts:
{concept_str}

Respond with ONLY a valid JSON object (no markdown, no code blocks, starting with {{):
{{
  "missing_concepts": [
    {{
      "title": "concept name",
      "description": "brief description",
      "difficulty_level": 1-10,
      "suggested_prerequisite_for": ["concept_id1", "concept_id2"]
    }}
  ],
  "reasoning": "explanation of what was missing"
}}

Return empty missing_concepts array if nothing is missing.
"""
        
        try:
            model = genai.GenerativeModel(GeminiConceptExtractor.MODEL_NAME)
            response = model.generate_content(prompt)
            
            result = GeminiConceptExtractor._parse_gemini_response(response.text)
            
            # Add missing concepts to list
            if result.get("missing_concepts"):
                for missing in result["missing_concepts"]:
                    # Generate concept_id from title
                    concept_id = GeminiConceptExtractor._generate_concept_id(missing["title"])
                    missing["concept_id"] = concept_id
                    concepts.append(missing)
            
            return concepts
            
        except Exception as e:
            print(f"Warning: Interpolation failed: {str(e)}")
            return concepts
    
    @staticmethod
    def suggest_dependencies(concept_title: str, all_concepts: List[str]) -> List[str]:
        """
        For a given concept, suggest which other concepts are prerequisites
        
        Args:
            concept_title: The concept to analyze
            all_concepts: List of all available concepts
        
        Returns:
            List of prerequisite concept titles
        """
        
        if not GEMINI_API_KEY:
            return []
        
        concepts_str = "\n".join(all_concepts)
        
        prompt = f"""
Given this concept: "{concept_title}"

And these available concepts:
{concepts_str}

Identify which concepts someone MUST understand first before learning "{concept_title}".
Return ONLY a valid JSON object (no markdown, no code blocks):
{{
  "prerequisites": ["concept1", "concept2"],
  "reasoning": "explanation of dependencies"
}}

Prerequisites should only be from the provided list. Return empty array if independent.
"""
        
        try:
            model = genai.GenerativeModel(GeminiConceptExtractor.MODEL_NAME)
            response = model.generate_content(prompt)
            
            result = GeminiConceptExtractor._parse_gemini_response(response.text)
            return result.get("prerequisites", [])
            
        except Exception as e:
            print(f"Warning: Dependency suggestion failed: {str(e)}")
            return []
    
    @staticmethod
    def _build_extraction_prompt(text: str, category: str = "") -> str:
        """Build the Gemini prompt for concept extraction"""
        
        category_hint = f"The concepts are primarily in category: {category}" if category else ""
        
        return f"""
You are an expert educational curriculum designer. Parse the following text about topics, 
table of contents, or concepts someone wants to learn. Extract structured information about 
each concept and their relationships.

{category_hint}

Input Text:
{text}

Analyze this and respond with ONLY a valid JSON object (no markdown, no code blocks, 
starting with {{{{ and ending with }}}}):

{{
  "category": "inferred or provided category name",
  "concepts": [
    {{
      "title": "concept name",
      "description": "1-2 sentence description",
      "concept_id": "snake_case_id",
      "difficulty_level": 1-10,
      "is_fundamental": true/false
    }}
  ],
  "relationships": [
    {{
      "concept": "concept_title",
      "prerequisite": "prerequisite_title",
      "reason": "brief reason why prerequisite is needed"
    }}
  ],
  "summary": "brief summary of the skill tree",
  "learning_path": "suggested order to learn these concepts"
}}

Rules:
1. Infer difficulty levels (1=foundational, 10=advanced specialist)
2. Mark foundational concepts with is_fundamental: true
3. Extract ALL prerequisite relationships from the text
4. Generate sanitized concept_ids in snake_case
5. Ensure the JSON is valid and complete
"""
    
    @staticmethod
    def _parse_gemini_response(response_text: str) -> Dict:
        """Parse and validate Gemini API JSON response"""
        
        # Remove markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            result = json.loads(cleaned)
            return result
        except json.JSONDecodeError as e:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            raise ValueError(f"Could not parse Gemini response as JSON: {str(e)}")
    
    @staticmethod
    def _generate_concept_id(title: str) -> str:
        """Generate a sanitized concept_id from title"""
        # Convert to lowercase, replace spaces/special chars with underscore
        concept_id = re.sub(r'[^a-z0-9\s]', '', title.lower())
        concept_id = re.sub(r'\s+', '_', concept_id)
        return concept_id[:30]  # Limit length


class ConceptInterpolationService:
    """Service to handle intelligent prerequisite interpolation"""
    
    # Domain-specific prerequisite mappings
    MATH_PREREQUISITES = {
        "l'hôpital's rule": ["derivatives", "limits"],
        "derivative": ["limits", "continuity"],
        "integral": ["derivatives", "antiderivatives"],
        "multivariable calculus": ["partial derivatives", "single variable calculus"],
        "matrix transformations": ["matrix multiplication", "vectors"],
        "eigenvalues": ["matrix operations", "determinants", "linear systems"],
        "fourier analysis": ["integration", "complex numbers", "trigonometry"],
        "differential equations": ["derivatives", "integration"],
        "partial derivatives": ["single variable calculus", "limits"],
        "vector fields": ["vectors", "partial derivatives"],
    }
    
    @staticmethod
    def interpolate_with_rules(concepts: List[Dict]) -> List[Dict]:
        """
        Apply domain-specific rules to ensure important prerequisites exist
        
        Args:
            concepts: List of concept dicts
        
        Returns:
            Augmented list with interpolated concepts
        """
        
        concept_titles_lower = {c["title"].lower(): c for c in concepts}
        concept_ids = {c["title"].lower(): c.get("concept_id", 
                      ConceptInterpolationService._generate_id(c["title"])) 
                      for c in concepts}
        
        newly_added = []
        
        for concept in concepts:
            concept_lower = concept["title"].lower()
            
            # Check if this concept has known prerequisites
            for pattern, prerequisites in ConceptInterpolationService.MATH_PREREQUISITES.items():
                if pattern in concept_lower:
                    for prereq in prerequisites:
                        prereq_lower = prereq.lower()
                        
                        # If prerequisite not in list, add it
                        if prereq_lower not in concept_titles_lower:
                            new_concept = {
                                "title": prereq,
                                "description": f"Foundational concept for {concept['title']}",
                                "concept_id": ConceptInterpolationService._generate_id(prereq),
                                "difficulty_level": concept.get("difficulty_level", 3) - 1,
                                "is_fundamental": True
                            }
                            newly_added.append(new_concept)
                            concept_titles_lower[prereq_lower] = new_concept
                            concept_ids[prereq_lower] = new_concept["concept_id"]
        
        return concepts + newly_added
    
    @staticmethod
    def _generate_id(title: str) -> str:
        """Generate concept_id from title"""
        concept_id = re.sub(r'[^a-z0-9\s]', '', title.lower())
        concept_id = re.sub(r'\s+', '_', concept_id)
        return concept_id[:30]
