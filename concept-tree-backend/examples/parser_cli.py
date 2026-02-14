#!/usr/bin/env python3
"""
CLI tool for testing the Gemini-powered concept parser
"""
import requests
import json
import sys
import os
from typing import Optional

API_URL = os.getenv('API_URL', 'http://localhost:5000')


class ParserCLI:
    """Command-line interface for the concept parser"""
    
    @staticmethod
    def parse_from_file(filepath: str, category: str = "") -> bool:
        """Parse concepts from a text file"""
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return False
        
        with open(filepath, 'r') as f:
            text = f.read()
        
        return ParserCLI.parse_text(text, category)
    
    @staticmethod
    def parse_text(text: str, category: str = "") -> bool:
        """Parse concepts from text string"""
        
        print("🔄 Connecting to Flask backend...")
        
        try:
            response = requests.post(
                f"{API_URL}/api/parser/parse",
                json={"text": text, "category": category},
                timeout=30
            )
            
            if response.status_code == 503:
                print("❌ Gemini API not configured")
                print("Set GEMINI_API_KEY environment variable")
                return False
            
            if response.status_code != 201:
                print(f"❌ Parsing failed: {response.status_code}")
                print(response.json())
                return False
            
            result = response.json()
            ParserCLI._print_result(result['data'])
            return True
            
        except requests.exceptions.ConnectionError:
            print(f"❌ Could not connect to {API_URL}")
            print("Make sure Flask backend is running: python flask-backend/app.py")
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False
    
    @staticmethod
    def validate_category(category: str) -> bool:
        """Validate a created concept tree"""
        
        print(f"🔍 Validating category: {category}")
        
        try:
            response = requests.get(
                f"{API_URL}/api/parser/validate/{category}",
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ Validation failed: {response.status_code}")
                return False
            
            result = response.json()
            
            print(f"\n{'='*60}")
            print(f"Validation Report: {category}")
            print(f"{'='*60}")
            print(f"Total Concepts: {result['total_concepts']}")
            print(f"Issues Found: {result['issues_found']}")
            print(f"Fixes Applied: {result['fixes_applied']}")
            print(f"Status: {result['validation_status'].upper()}")
            
            if result.get('issues'):
                print(f"\n⚠️  Issues:")
                for issue in result['issues']:
                    print(f"  - [{issue['type']}] {issue['message']}")
            
            if result.get('fixes'):
                print(f"\n✅ Fixes Applied:")
                for fix in result['fixes']:
                    print(f"  - [{fix['type']}] {fix.get('concept', '')}")
            
            print(f"{'='*60}\n")
            return True
            
        except requests.exceptions.ConnectionError:
            print(f"❌ Could not connect to {API_URL}")
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False
    
    @staticmethod
    def infer_category(text: str) -> Optional[str]:
        """Infer category from text"""
        
        try:
            response = requests.post(
                f"{API_URL}/api/parser/infer-category",
                json={"text": text},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                category = result['inferred_category']
                print(f"📂 Inferred Category: {category}")
                return category
            
        except Exception as e:
            print(f"Warning: Could not infer category: {str(e)}")
        
        return None
    
    @staticmethod
    def get_examples() -> bool:
        """Show example inputs"""
        
        try:
            response = requests.get(
                f"{API_URL}/api/parser/examples",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("\n📚 Example Inputs:\n")
                for name, text in result['examples'].items():
                    print(f"Example: {name}")
                    print(f"{'-'*40}")
                    print(text.strip())
                    print()
                
                return True
                
        except Exception as e:
            print(f"Error: {str(e)}")
        
        return False
    
    @staticmethod
    def _print_result(result: dict) -> None:
        """Pretty print parsing result"""
        
        print(f"\n{'='*70}")
        print(f"✅ Parsing Complete!")
        print(f"{'='*70}\n")
        
        print(f"📊 Statistics:")
        print(f"  Created Concepts: {result['created_count']}")
        print(f"  Interpolated: {result['interpolated_count']}")
        print(f"  Relationships: {result['relationships_count']}")
        print(f"  Category: {result['category']}")
        
        print(f"\n📖 Summary:")
        print(f"  {result['summary']}")
        
        if result.get('learning_path'):
            print(f"\n🛤️  Suggested Learning Path:")
            print(f"  {result['learning_path']}")
        
        if result.get('interpolated_concepts'):
            print(f"\n🔧 Interpolated Concepts (automatically added):")
            for concept in result['interpolated_concepts']:
                print(f"  - {concept}")
        
        print(f"\n📝 Created Concepts:")
        for i, concept in enumerate(result['created_concepts'][:10], 1):
            prereq_str = ""
            if concept.get('prerequisites'):
                prereq_str = f" (requires: {', '.join(concept['prerequisites'])})"
            print(f"  {i}. {concept['title']} [Difficulty: {concept.get('difficulty_level', 'N/A')}]{prereq_str}")
        
        if len(result['created_concepts']) > 10:
            print(f"  ... and {len(result['created_concepts']) - 10} more")
        
        print(f"\n{'='*70}\n")


def main():
    """Main CLI entry point"""
    
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Gemini-powered Concept Parser CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python parser_cli.py --text "1. Limits\\n2. Derivatives\\n3. Integration"
  python parser_cli.py --file table_of_contents.txt
  python parser_cli.py --file toc.txt --category "Calculus"
  python parser_cli.py --validate "Linear Algebra"
  python parser_cli.py --examples
        """
    )
    
    parser.add_argument('--text', help='Text to parse (TOC or concept list)')
    parser.add_argument('--file', help='Text file to parse')
    parser.add_argument('--category', help='Category name (optional)', default='')
    parser.add_argument('--validate', help='Validate a category after parsing')
    parser.add_argument('--examples', action='store_true', help='Show example inputs')
    parser.add_argument('--api-url', help='API URL', default=API_URL)
    
    args = parser.parse_args()
    
    # Update API URL if provided
    if args.api_url != API_URL:
        globals()['API_URL'] = args.api_url
        ParserCLI.API_URL = args.api_url
    
    if args.examples:
        ParserCLI.get_examples()
    
    elif args.file:
        ParserCLI.parse_from_file(args.file, args.category)
    
    elif args.text:
        # Infer category if not provided
        if not args.category:
            args.category = ParserCLI.infer_category(args.text) or ""
        
        ParserCLI.parse_text(args.text, args.category)
    
    elif args.validate:
        ParserCLI.validate_category(args.validate)
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
