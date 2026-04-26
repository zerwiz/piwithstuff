"""
Model Selection System with Local Model Integration.

This module provides a comprehensive model selection system that integrates
with local model stores and provides user-friendly selection interfaces.
"""

from typing import Dict, List, Optional, Any, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelSelector:
    """
    Model selection class that handles all model selection logic.
    """
    
    def __init__(self):
        self.available_models: List[Dict[str, Any]] = []
        self.local_models: Dict[str, Any] = {}
        self.model_registry: Dict[str, Any] = {}
        
    def register_local_model(self, name: str, path: str, size_gb: float) -> None:
        """
        Register a local model.
        
        Args:
            name: Model name/identifier
            path: Local path to model files
            size_gb: Model size in gigabytes
        """
        self.local_models[name] = {
            "name": name,
            "path": path,
            "size_gb": size_gb,
            "type": "local",
            "status": "ready"
        }
        logger.info(f"Registered local model: {name} ({size_gb} GB)")
        
    def add_cloud_model(self, name: str, endpoint: str, version: str = "latest") -> None:
        """
        Add a cloud/model service model.
        
        Args:
            name: Model name
            endpoint: Cloud API endpoint (e.g., Ollama, API)
            version: Model version
        """
        self.model_registry[name] = {
            "name": name,
            "endpoint": endpoint,
            "version": version,
            "type": "cloud",
            "status": "available"
        }
        logger.info(f"Registered cloud model: {name}")
        
    def get_models(self, exclude_cloud: bool = False) -> List[Dict[str, Any]]:
        """
        Get available model list.
        
        Args:
            exclude_cloud: If True, only return local models
            
        Returns:
            List of available model dictionaries
        """
        models = []
        
        # Add local models
        for name, info in self.local_models.items():
            if not exclude_cloud or info["type"] == "local":
                models.append(info)
                
        # Add cloud models if not excluded
        if not exclude_cloud:
            for name, info in self.model_registry.items():
                models.append(info)
                
        return models
        
    def select_best_model(
        self, 
        task_type: str = "general",
        priority: str = "fastest"
    ) -> Dict[str, Any]:
        """
        Select the best model for a given task type and priority.
        
        Args:
            task_type: Type of task (general, creative, technical, etc.)
            priority: Priority level (fastest, smallest, or balance)
            
        Returns:
            Selected model info dictionary
        """
        available = self.get_models()
        
        if not available:
            logger.warning("No models available")
            return None
            
        # Default selection (local models preferred)
        return available[0] if available else None
        
    def get_model_summary(self) -> Dict[str, Any]:
        """
        Get summary of all models including local and cloud models.
        
        Returns:
            Dictionary containing model summary information
        """
        total_models = len(self.local_models) + len(self.model_registry)
        total_local = len(self.local_models)
        total_cloud = len(self.model_registry)
        total_size_gb = sum(
            m["size_gb"] for m in self.local_models.values()
        )
        
        return {
            "total_models": total_models,
            "local_models": total_local,
            "cloud_models": total_cloud,
            "total_size_gb": total_size_gb,
            "models": self.get_models()
        }
        
    def is_model_available(self, name: str) -> bool:
        """
        Check if a specific model is available.
        
        Args:
            name: Model name to check
            
        Returns:
            True if model is available, False otherwise
        """
        # Check local models
        if name in self.local_models:
            return True
            
        # Check cloud models
        if name in self.model_registry:
            return True
            
        return False
        
    def set_preferred_model(
        self, 
        name: str,
        priority: str = "default"
    ) -> bool:
        """
        Set a preferred model for default selections.
        
        Args:
            name: Model name to prefer
            priority: Priority override level
            
        Returns:
            True if model was set, False otherwise
        """
        if not self.is_model_available(name):
            logger.error(f"Model '{name}' not available")
            return False
            
        self.local_models[name]["priority"] = priority
        return True


def get_default_model_path() -> str:
    """
    Get the default path for model storage.
    
    Returns:
        Path string for model storage
    """
    import os
    # Default to ~/.ollama/models or similar location
    return os.path.expanduser("~/.ollama/models")


def load_model_registry(path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load model registry from file.
    
    Args:
        path: Path to registry file (optional)
        
    Returns:
        Loaded registry dictionary
    """
    registry = {
        "local": {},
        "cloud": {}
    }
    
    # If path provided and file exists, could load from there
    # For now, return empty registry
    return registry


# Example initialization
if __name__ == "__main__":
    selector = ModelSelector()
    
    # Register some example models
    selector.register_local_model(
        name="llama2",
        path="/path/to/llama2",
        size_gb=7
    )
    
    selector.add_cloud_model(
        name="qwen",
        endpoint="ollama",
        version="latest"
    )
    
    # Get model list
    models = selector.get_models()
    print(f"Available models: {len(models)}")
    
    # Get summary
    summary = selector.get_model_summary()
    print(f"Summary: {summary}")
