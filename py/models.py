"""
Collection of models for various use cases
"""

MODEL_NAMES = ["llama3", "mixtral8x7b", "not-found-model"]

MODEL_DESCRIPTIONS = {
    "llama3": {
        "description": "Llama 3 by Meta - Latest iteration with 8B and 70B variants",
        "category": "llama",
        "developer": "meta",
        "license": "llama2",
        "parameters": "8B, 70B",
        "knowledge cutoff": "2023-12",
        "multilingual": True,
        "temperature": 0.8,
        "max_tokens": 8192,
        "available": True,
        "openai_model": False,
    },
    "mixtral8x7b": {
        "description": "Mixtral 8x7b - MoE model with 41B parameters",
        "category": "mixtral",
        "developer": "mistralai",
        "license": "mit",
        "parameters": "41B",
        "knowledge cutoff": "2023-11",
        "multilingual": True,
        "temperature": 0.8,
        "max_tokens": 32768,
        "available": True,
        "openai_model": False,
    },
    "not-found-model": {
        "description": "Not found model placeholder",
        "category": "placeholder",
        "developer": "unknown",
        "license": "unknown",
        "parameters": "unknown",
        "knowledge cutoff": "unknown",
        "multilingual": False,
        "temperature": 0.5,
        "max_tokens": 4096,
        "available": False,
        "openai_model": False,
    },
}
