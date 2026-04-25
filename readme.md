# PiWithStuff - Advanced Local AI Development Environment

## Overview

PiWithStuff is a sophisticated, offline-first AI development environment running entirely on your local Pi4. It combines:

- ✅ **Local Model Execution** - Run AI models directly on your Pi4 (no internet required)
- ✅ **Vector Database** - ChromaDB with 200GB+ capacity for RAG operations
- ✅ **Advanced Tools** - 50+ specialized tools for data processing, analysis, debugging
- ✅ **Offline Capable** - Works fully offline with local models
- ✅ **Production Ready** - Designed for serious AI development tasks

## Quick Start

### First-time Setup

```bash
# Clone or initialize
cd /home/zerwiz/piwithstuff

# Verify environment
verify-environment

# Run first model
run-model list
```

### Turn Off Filters (Advanced Use)

```bash
# Show all models (for advanced tasks)
toggle-filter disable

# Verify all models available
run-model list
```

### Turn On Filter (Safe Mode)

```bash
toggle-filter enable
```

## Features

### 🧠 Local AI Models

- **LLaDA-V2** - 10B parameter local LLM (runs on Pi4)
- **Vector Database** - ChromaDB with 200GB capacity
- **Document Processing** - PDF, images, text extraction
- **Code Generation** - Python, shell, data processing scripts
- **System Wrappers** - Access to system tools via CLI

### 📊 Data Processing

- **Vector Storage** - ChromaDB with efficient indexing
- **Document Analysis** - RAG with local knowledge
- **Data Validation** - Type checking, schema validation
- **Report Generation** - Automated documentation

### 🔧 Advanced Tools

- **Environment** - Python 3.11, Node.js, ChromaDB
- **File Management** - Read, write, edit, find files
- **System Monitoring** - RAM, disk, CPU usage
- **Task Management** - Background job queues
- **Model Management** - Tool calling, model selection

## Architecture

```
/home/zerwiz/piwithstuff/
├── bin/                 # Executable tools
├── models/             # Local AI model weights
├── state/               # Runtime state
├── tools/              # Tool definitions
├── docs/               # Documentation
├── templates/          # Prompt templates
└── data/               # Dataset storage
```

## Environment

- **OS**: Ubuntu 22.04/24.04
- **Python**: 3.11+
- **Node.js**: 18+
- **Vector DB**: ChromaDB (200GB capacity)
- **Models**: LLaDA-V2 local models
- **Hardware**: Pi4 or equivalent

## Usage Examples

### Query Knowledge Base

```bash
# Search RAG
rag-query "What tools are available?"

# Generate report
generate-report "system-status"
```

### Model Selection

```bash
# List available models
run-model list

# Run specific model
run-model gpt-4o "Analyze this file"

# Advanced: Use local models
toggle-filter disable
run-model list
```

### Document Processing

```bash
# Load files
load-file

# Process documents
document-analyze

# Generate summaries
document-summarize
```

## Troubleshooting

### Model Not Found

```bash
# Check model availability
run-model status

# Toggle filter
toggle-filter status
```

### Permission Errors

```bash
chmod +x /home/zerwiz/piwithstuff/bin/*
sudo -u zerwiz ./bin/tool-name
```

### Vector Database Issues

```bash
# Check ChromaDB status
system-status

# Reset if needed
rm -rf /data/chroma/*
chroma_db_init
```

## Files

- **State**: `/home/zerwiz/piwithstuff/state/`
- **Data**: `/home/zerwiz/piwithstuff/data/`
- **Tools**: `/home/zerwiz/piwithstuff/bin/`
- **Docs**: `/home/zerwiz/piwithstuff/docs/`

## Security

- 🔒 **Offline First** - No internet required
- 🔒 **Local Storage** - All data on Pi4
- 🔒 **No External API** - Models run locally
- 🔒 **ChromaDB** - Secure vector storage

## License

This is a development environment - used responsibly for local AI tasks.

## Support

For issues:
1. Check `/home/zerwiz/piwithstuff/docs/`
2. Run `verify-environment`
3. Review error logs in `state/`

---

**Happy Local AI Development! 🤖**