# 🌱 Pi with Stuff - Local-First AI Development

<div align="center">
  <p><strong>Showcasing that small local models work best for local programming</strong></p>
  <p>
    ⚡ Small Models | 🔒 Privacy-First | 🏠 No Cloud Dependencies | 💾 Self-Contained
  </p>
</div>

---

## 🎯 Why This Project?

This repository is a comprehensive demonstration showing why **small local language models** are ideal for local development workflows. By running models locally, you maintain full control over your data, reduce latency, and eliminate cloud API costs.

> "The right tool for the job doesn't require infinite compute power—sometimes small is perfectly powerful."

---

## 🙏 Credits & Attribution

### Project Updates
**Based on:** [IndyDevDans - Pi vs Claude Code](https://github.com/disler/pi-vs-claude-code)

### Base Project
**Origin:** Built on top of [www.pi.dev](https://www.pi.dev) by **[Mario Zechner](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)**

### Project Author
Made by **[zerwiz](https://github.com/zerwiz/piwithstuff)**
  - 🌐 Website: [https://whynotproductions.netlify.app](https://whynotproductions.netlify.app)
  - 💻 GitHub: [https://github.com/zerwiz/piwithstuff](https://github.com/zerwiz/piwithstuff)

> 📜 Attribution:
> - **Pi vs Claude Code** - Original project by IndyDevDan
> - **www.pi.dev** - Base technology built by Mario Zechner
> - **piwithstuff** - Update/mod made by Zerwiz

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/zerwiz/piwithstuff
cd piwithstuff

# Install dependencies
pip install -r requirements.txt

# Pull local models (configurable per model)
python models/pull_all.py
```

### Environment Variables
```bash
# Optional configuration
export MODEL_PATH=./models
export API_KEY=""  # Leave empty for truly local execution
```

---

## 📚 Usage Examples

### Basic Code Completion
```bash
# Use your local model for code suggestions
python complete.py --file="main.py" --prompt="def main():"
```

### Context-Aware Analysis
```bash
# Analyze your entire project structure locally
python analyze.py --context="./src/" --model="phi-2"
```

### Interactive Shell
```bash
# Start local AI assistant shell
./run-assistant.sh --model="llama-3.1-8b"
```

---

## 📁 Project Structure

```
piwithstuff/
├── 📄 README.md              # This file
├── 📄 LICENSE                # License information
├── 📄 requirements.txt       # Python dependencies
├── 📄 config.yaml            # Model configuration
├── 🧠 models/                # Local model storage
│   ├── phi-2/               # Microsoft Phi-2
│   ├── tinyllama/           # Tiny Llama
│   └── llama-3.1-8b/        # Llama 3.1 8B (quantized)
├── 🔧 utils/
│   └── completion.py        # Code completion engine
└── 🤖 examples/
    └── complete.py          # Usage demonstrations
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Ensure all models load correctly** before making test commits
3. **Run tests** using `python tests/run_tests.py`
4. **Update documentation** for any new features
5. **Sign the contributors** guide (TODO: add)
6. Submit a **pull request** with detailed changes

**Code of Conduct:** Be respectful. We appreciate constructive feedback!

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

Models included in the repository may have their own licenses. Please review their individual license files.

**Note:** Local models are loaded with respect to their respective licenses. Always comply with model EULAs.

---

## 📊 Performance Characteristics

| Model | Size | Speed (tokens/s) | VRAM Required |
|-------|------|------------------|---------------|
| Phi-2 | ~2.7 GB | ~50-100 | ~4 GB |
| TinyLlama | ~3.2 GB | ~40-80 | ~4 GB |
| Llama 3.1-8B | ~5.5 GB (q4) | ~15-30 | ~8 GB |

*Speed benchmarks vary by hardware configuration.*

---

## 🔒 Privacy First Philosophy

This project adheres to core local-first principles:
- ✅ **No data leaves your machine**
- ✅ **No API calls to external services**
- ✅ **Complete control over your codebase**
- ✅ **Full offline capability**

---

## 🌐 Resources

- [📖 Model Hub](https://huggingface.co/models) - Access all available models
- [🔧 Configuration Guide](./docs/config.md) - Deep dive into settings
- [🎥 Video Tutorial](./docs/video-tutorial.md) - Visual walkthrough

---

## 📞 Support & Discussion

- **Issues:** [Report a bug](https://github.com/zerwiz/piwithstuff/issues)
- **Questions:** [Open a discussion](https://github.com/zerwiz/piwithstuff/discussions)
- **Feedback:** Reach out on [GitHub Issues](https://github.com/zerwiz/piwithstuff/issues)

---

<div align="center" >
  Made with ❤️ by zerwiz | Original: Pi vs Claude Code by IndyDevDan | Base: Pi.dev by Mario Zechner
</div>
