"""
Prompt Template Library for Local Model Usage.

This module provides a collection of pre-built prompt templates
optimized for local models like Llama 2, Mistral, Qwen, etc.
"""

from typing import Dict, List, Optional, Any
import logging

# Configure logging
logger = logging.getLogger(__name__)


class PromptTemplate:
    """
    A prompt template with slots for variable substitution.
    """
    
    def __init__(self, name: str, template: str, description: str = ""):
        self.name = name
        self.template = template
        self.description = description
        
    def render(self, **variables) -> str:
        """
        Render the template with provided variables.
        
        Args:
            **variables: Template variables
            
        Returns:
            Rendered prompt string
        """
        return self.template.format(**variables)


class TemplateLibrary:
    """
    Library of prompt templates for different use cases.
    """
    
    def __init__(self):
        self.templates: Dict[str, PromptTemplate] = {}
        
    def add_template(self, name: str, template: str, description: str = "") -> PromptTemplate:
        """
        Add a new template to the library.
        
        Args:
            name: Unique template name
            template: Template string
            description: Optional description
            
        Returns:
            Created PromptTemplate object
        """
        template_obj = PromptTemplate(name, template, description)
        self.templates[name] = template_obj
        logger.info(f"Added template: {name}")
        return template_obj
        
    def get_template(self, name: str) -> Optional[PromptTemplate]:
        """
        Get a template by name.
        
        Args:
            name: Template name
            
        Returns:
            PromptTemplate or None if not found
        """
        return self.templates.get(name)
        
    def get_all_templates(self) -> List[Dict[str, Any]]:
        """
        Get all templates as dictionaries.
        
        Returns:
            List of template dictionaries
        """
        return [
            {"name": t.name, "description": t.description}
            for t in self.templates.values()
        ]
        
    def get_template_names(self) -> List[str]:
        """
        Get list of template names.
        
        Returns:
            List of template names
        """
        return list(self.templates.keys())


# Default prompt templates
DEFAULT_TEMPLATES = {
    "general_question": PromptTemplate(
        name="general_question",
        template="""You are a helpful assistant. Please answer the following question:

Question: {question}

Please provide a helpful and accurate response.""",
        description="General question answering"
    ),
    
    "creative_story": PromptTemplate(
        name="creative_story",
        template="""You are a creative writer. Write a short story based on this prompt:

Story Idea: {prompt}

Style: {style} - {length}
Continue the story naturally.""",
        description="Creative story generation"
    ),
    
    "code_generation": PromptTemplate(
        name="code_generation",
        template="""You are a coding assistant. Write code for the following task:

Task: {task}
Requirements: {requirements}
Language/Style: {language}

Example (if helpful):
{example}

Write the code:""",
        description="Code generation and debugging"
    ),
    
    "explanation": PromptTemplate(
        name="explanation",
        template="""Explain the following concept clearly:

Concept: {concept}

Target audience: {audience}
Depth: {depth} level

Provide a clear, easy-to-understand explanation.""",
        description="Concept explanation and teaching"
    ),
    
    "translation": PromptTemplate(
        name="translation",
        template="""Translate the following text from {source_language} to {target_language}:

Text to translate:
{text}

Additional instructions: {instructions}""",
        description="Text translation"
    ),
    
    "critique": PromptTemplate(
        name="critique",
        template="""Critique and provide feedback on this text or draft:

Content: {content}

Focus areas: {focus}
Tone: {tone}

Provide constructive, actionable feedback.""",
        description="Critique and feedback"
    ),
    
    "summarize": PromptTemplate(
        name="summarize",
        template="""Summarize the following text:

Text:
{text}

Target length: {length}
Key points to include: {points}
""",
        description="Text summarization"
    ),
    
    "format_data": PromptTemplate(
        name="format_data",
        template="""Format the following information into {format_type}:

Data:
{data}

Output format: {format_type}
Constraints: {constraints}
""",
        description="Data formatting and structuring"
    ),
    
    "brainstorm": PromptTemplate(
        name="brainstorm",
        template="""Help me brainstorm ideas about:

Topic: {topic}
Context: {context}
Constraints: {constraints}

Generate diverse, creative ideas.""",
        description="Idea generation and brainstorming"
    )
}

# Initialize library with default templates
default_lib = TemplateLibrary()
for name, template in DEFAULT_TEMPLATES.items():
    default_lib.add_template(
        name=name,
        template=template.template,
        description=template.description
    )


def get_default_templates() -> TemplateLibrary:
    """
    Get the default template library.
    
    Returns:
        TemplateLibrary instance with default templates
    """
    return default_lib


def create_custom_template(
    name: str,
    template: str,
    description: str = ""
) -> PromptTemplate:
    """
    Create a custom prompt template.
    
    Args:
        name: Template name
        template: Template string
        description: Optional description
        
    Returns:
        PromptTemplate object
    """
    template_obj = PromptTemplate(name, template, description)
    return template_obj


if __name__ == "__main__":
    # Usage example
    library = get_default_templates()
    
    # List available templates
    templates = library.get_all_templates()
    print(f"Available templates: {len(templates)}")
    for t in templates:
        print(f"  - {t['name']}: {t['description']}")
    
    # Render a template
    rendered = library.get_template("general_question").render
(
        question="What is quantum computing?"
    )
    print(f"\nRendered prompt:\n{rendered}")
