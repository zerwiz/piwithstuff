"""
Model resolver with OpenAI model filtering.

This module handles filtering out OpenAI models (any starting with "openai" or "gpt-")
from the available model list.
"""

import logging
import re
from typing import List, Optional, Set, Tuple

# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


def is_openai_model(model_name: str) -> bool:
    """
    Check if a model name corresponds to an OpenAI model.
    
    Args:
        model_name: The name of the model to check
        
    Returns:
        True if the model is an OpenAI model (starts with "openai" or "gpt-"), False otherwise
    """
    # Check if model name starts with "openai" (case-insensitive)
    if model_name.lower().startswith("openai"):
        return True
    
    # Check if model name starts with "gpt-"
    if model_name.lower().startswith("gpt-"):
        return True
    
    return False


def filter_openai_models(
    model_list: List[dict], 
    model_names: List[str]
) -> tuple[List[dict], List[str], Set[str]]:
    """
    Filter out all OpenAI models from the model list.
    
    Args:
        model_list: List of available models with their metadata
        model_names: List of model names to process
        
    Returns:
        Tuple of (filtered model list, filtered names, rejected names)
    """
    # Track which models are rejected
    rejected_models: Set[str] = set()
    
    # Process model list and filter OpenAI models
    filtered_models = []
    filtered_names = []
    
    for model in model_list:
        name = model.get("name", "unknown")
        
        # Check if this is an OpenAI model
        if any(is_openai_model(n) for n in [name, model.get("id", "")]):
            # Mark OpenAI models as "not found" in availability
            availability = model.get("availability", "available")
            if availability == "available":
                availability = "not found"
            
            # Add warning log
            logger.warning(
                f"OpenAI model '{name}' filtered: marking as not found in availability"
            )
            
            # Update availability status
            model["availability"] = "not found"
            
            # Add to rejected set
            rejected_models.add(name)
        else:
            # Keep non-OpenAI models as is
            filtered_models.append(model)
            filtered_names.append(name)
    
    return filtered_models, filtered_names, rejected_models


def update_model_list_for_openai_hiding(
    model_list: List[dict]
) -> Tuple[List[dict], List[str], Set[str]]:
    """
    Update model list to exclude OpenAI entries and apply filtering.
    
    Args:
        model_list: List of model dictionaries from sources
        
    Returns:
        Tuple of (filtered model list, filtered names, rejected model names)
    """
    # Extract model names for checking
    raw_names = [m.get("name", "") for m in model_list]
    
    # Apply filtering
    filtered_models, filtered_names, rejected = (
        filter_openai_models(model_list, raw_names)
    )
    
    return filtered_models, filtered_names, rejected


def get_available_models(
    model_list: List[dict]
) -> List[dict]:
    """
    Get only available models (excluding OpenAI and marked "not found").
    
    Args:
        model_list: List of models after OpenAI filtering
        
    Returns:
        List of models that are actually available
    """
    return [
        model for model in model_list
        if model.get("availability", "not found") != "not found"
    ]
