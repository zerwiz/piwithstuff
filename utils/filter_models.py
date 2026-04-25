#!/usr/bin/env python3
"""
Model Filter Script
Excludes OpenAI models from model list display

Filter Rules:
- Exclude: models starting with "openai", "gpt-"
- Include: Ollama local models, Ollama registry, OpenRouter, HuggingFace
- Show filtered model counts
"""

import logging
from typing import List, Dict, Any, Tuple

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def is_openai_model(model_name: str) -> bool:
    """
    Check if a model is an OpenAI model that should be filtered out.
    
    Args:
        model_name: The model name to check
        
    Returns:
        True if the model should be filtered (openai or gpt- prefix)
    """
    model_name_lower = model_name.lower()
    return model_name_lower.startswith("openai") or model_name_lower.startswith("gpt-")


def is_supported_model(model_name: str) -> bool:
    """
    Check if a model is a supported model that should be included.
    
    Args:
        model_name: The model name to check
        
    Returns:
        True if the model should be included (not an OpenAI model to be filtered)
    """
    return not is_openai_model(model_name)


def filter_models(model_list: List[Dict[str, Any]], verbose: bool = True) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Filter out OpenAI models from the model list.
    
    Args:
        model_list: List of model dictionaries
        verbose: If True, log filtered models
        
    Returns:
        Tuple of (filtered model list, filtered counts)
    """
    filtered_models = []
    filtered_counts = {
        'excluded_openai': 0,
        'included_ollama_local': 0,
        'included_ollama_remote': 0,
        'included_openrouter': 0,
        'included_huggingface': 0,
        'included_other': 0
    }
    
    for model in model_list:
        # Get model name from various possible keys
        model_name = model.get('name', model.get('model', model.get('id', '')))
        
        if not model_name:
            logger.warning(f"Model without name field: {model}")
            continue  # Keep models without names to avoid breaking the list
            
        should_filter = is_openai_model(model_name)
        
        if should_filter and verbose:
            source = model.get('source', model.get('provider', model.get('registry', 'unknown')))
            logger.warning(
                f"Filtering out OpenAI model: {model_name} - "
                f"Source: {source} - Reason: Contains 'openai' or 'gpt-' prefix"
            )
        
        # Don't filter out models that don't have openai/gpt- prefix
        if not should_filter:
            filtered_models.append(model)
            
            # Categorize included models by source
            source = model.get('source', model.get('provider', model.get('registry', 'unknown')))
            source_lower = source.lower() if source else ''
            
            if 'ollama' in source_lower:
                if 'local' in source_lower or 'registry' not in source_lower:
                    filtered_counts['included_ollama_local'] += 1
                else:
                    filtered_counts['included_ollama_remote'] += 1
            elif 'openrouter' in source_lower:
                filtered_counts['included_openrouter'] += 1
            elif 'huggingface' in source_lower:
                filtered_counts['included_huggingface'] += 1
            else:
                filtered_counts['included_other'] += 1
    
    return filtered_models, filtered_counts


def get_model_filter_status(model_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Get the filtering status and statistics for a model list.
    
    Args:
        model_list: List of model dictionaries
        
    Returns:
        Dictionary with filtering statistics
    """
    if not model_list:
        return {
            'total_models': 0,
            'filtered_models': 0,
            'stats': {}
        }
    
    filtered_models, filtered_counts = filter_models(model_list, verbose=False)
    
    stats = {
        'total_models': len(model_list),
        'filtered_models': len(model_list) - len(filtered_models),
        'remaining_models': len(filtered_models),
        'stats': filtered_counts
    }
    
    return stats


def log_model_filtering(model_list: List[Dict[str, Any]]) -> int:
    """
    Log all filtered models and return the count.
    
    Args:
        model_list: List of model dictionaries
        
    Returns:
        Number of models filtered out
    """
    # Get only models that would be filtered
    filtered_list = [m for m in model_list if is_openai_model(m.get('name', m.get('model', '')))]
    
    filtered_count = len(filtered_list)
    
    if filtered_count > 0 and logger.isEnabledFor(logging.WARNING):
        logger.warning(
            f"OpenAI models filtered: {filtered_count} "
            f"models removed from display.\n"
            f"Reason: Models starting with 'openai' or 'gpt-' are excluded. "
            f"Supported sources: Ollama (local/remote), OpenRouter, HuggingFace."
        )
    elif filtered_count > 0:
        # Log with higher level if warnings are disabled
        logger.info(
            f"OpenAI models filtered: {filtered_count} models removed."
        )
    
    return filtered_count


def main():
    """Main function to test the filter_models script."""
    # Sample model list for testing
    sample_models = [
        {'name': 'llama3.2:1b', 'source': 'ollama'},
        {'name': 'gpt-4o', 'source': 'openai'},
        {'name': 'phi-4:70b', 'source': 'ollama'},
        {'name': 'mistral-large', 'source': 'openrouter'},
        {'name': 'openai/text-davinci-003', 'source': 'openai'},
        {'name': 'codellama-7b', 'source': 'ollama'},
        {'name': 'quantos', 'source': 'ollama'},
    ]
    
    print("\n" + "="*50)
    print("Model Filter Script - Test Run")
    print("="*50 + "\n")
    
    filtered_models, filtered_counts = filter_models(sample_models, verbose=True)
    
    print("\nFiltered models (remaining):")
    for model in filtered_models:
        source = model.get('source', 'unknown')
        print(f"  - {model['name']} (Source: {source})")
    
    print("\nFiltering Statistics:")
    print(f"  Total models: {len(sample_models)}")
    print(f"  Remaining models: {len(filtered_models)}")
    print(f"  Excluded (OpenAI): {filtered_counts['excluded_openai']}")
    print(f"  Included - Ollama Local: {filtered_counts['included_ollama_local']}")
    print(f"  Included - Ollama Remote/Registry: {filtered_counts['included_ollama_remote']}")
    print(f"  Included - OpenRouter: {filtered_counts['included_openrouter']}")
    print(f"  Included - HuggingFace: {filtered_counts['included_huggingface']}")
    print(f"  Included - Other: {filtered_counts['included_other']}")


if __name__ == '__main__':
    main()

EOF