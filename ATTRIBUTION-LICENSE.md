# 📜 Project Attribution & Lineage Documentation

---

## 🎯 Executive Summary

This document provides **complete transparency** regarding the origins, relationships, and attributions between interconnected projects in this ecosystem. All upstream contributions are properly acknowledged and licensed.

---

## 🌳 Project Lineage Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                              ROOT SOURCE                              │
│                   www.pi.dev by Mario Zechner                        │
│                    (Base Platform / Infrastructure)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌───────────────────────────┐        ┌────────────────────────┐
│      Original Project      │        ┌────────────────────────┐
│  "Pi vs Claude Code"      │        │   Enhancement Project   │
│  by IndyDevDans           │        │   "Pi-with-Stuff"       │
└───────────────────────────┘        │  by Zerwiz (This Repo)   │
                                     └────────────────────────┘
```

---

## 📋 Project Catalog

### 1️⃣ 🏗️ Pi.dev Platform
| Attribute | Details |
|-----------|---------|
| **Creator** | Mario Zechner |
| **Website** | [www.pi.dev](https://www.pi.dev) |
| **GitHub** | (https://github.com/badlogic/pi-mono/tree/main) |
| **Role** | Base Platform & Infrastructure |
| **License** | TBD (Contact Mario for details) |
| **Contribution** | Core platform technology enabling local model execution |

**Description:** The foundational infrastructure that enables running local language models. Provides the base technology stack that all downstream projects build upon.

---

### 2️⃣ 🐙 Pi vs Claude Code
| Attribute | Details |
|-----------|---------|
| **Creator** | IndyDevDans |
| **GitHub** | [`IndyDevDans/pi-vs-claude-code`](https://github.com/IndyDevDans/pi-vs-claude-code) |
| **Role** | Original Showcase Project |
| **License** | MIT License (or as stated in project) |
| **Contribution** | First comprehensive comparison/implementation using Pi.dev |
| **GitHub** | - |

**Description:** The original project demonstrating local model execution against cloud-based alternatives. Serves as the **immediate upstream dependency** for this repository. Provides the core workflow and comparison framework.

---

### 3️⃣ 🚀 Pi-with-Stuff (This Project)
| Attribute | Details |
|-----------|---------|
| **Creator** | Zerwiz |
| **GitHub** | [`zerwiz/piwithstuff`](https://github.com/zerwiz/piwithstuff) |
| **Role** | Enhancement & Expansion Project |
| **License** | MIT License |
| **Contribution** | Adds missing features, improvements, and local-first optimizations |
| **Website** | - |

**Description:** An **enhancement and expansion** of the Pi vs Claude Code project. This repository adds critical missing features, documentation, and local-first optimizations to make the project more complete and accessible.

---

## 🔄 How Projects Build On Each Other

### ⬆️ Pi.dev → Pi vs Claude Code
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Pi.dev provides the base platform infrastructure for running local     │
│  models. IndyDevDans built upon this foundation to create the           │
│  comparison showcase between local models and cloud APIs.               │
└─────────────────────────────────────────────────────────────────────────┘
```

**What they provide:**
- Model loading and execution framework
- Code completion API integration
- Local-first architecture

### ⬇️ Pi vs Claude Code → Pi-with-Stuff (This Project)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Pi vs Claude Code provided the initial implementation. This project    │
│  significantly enhances it by:                                           │
│  • Adding comprehensive documentation                                    │
│  • Fixing bugs and improving stability                                   │
│  • Adding new model support                                               │
│  • Implementing better error handling                                     │
│  • Creating visual guides and tutorials                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**What it adds:**
- 📚 **Documentation:** Complete README, user guides, and troubleshooting
- 🛠️ **Stability:** Bug fixes and performance improvements
- 🎨 **UI/UX:** Better organization and code structure
- 💾 **Models:** Includes multiple local models (Phi-2, Llama 3.1-8B, TinyLlama)
- 📖 **Guides:** Installation, configuration, and usage walkthroughs

---

## ⚖️ License Compatibility

### ✅ License Chain: Compatible

```
         ┌─────────────────────────────────┐
         │    [Original: Pi vs Claude]     │
         │    License: MIT                 │
         │    Status: ✅ Permissive        │
         └───────────────┬─────────────────┘
                         │
                         ▼  ✅ INHERITABLE
         ┌─────────────────────────────────┐
         │  [This: Pi-with-Stuff]          │
         │  License: MIT                   │
         │  Compatible & Extensible        │
         └─────────────────────────────────┘
```

### 📄 Full License Notices

#### MIT License (This Project)

```
Copyright © 2024 Zerwiz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### Attribution Requirements

This project **requires** the following attributions in derivative works:

1. **Must include**: "Built on Pi vs Claude Code by IndyDevDans"
2. **Must include**: "Originally based on www.pi.dev by Mario Zechner"
3. **Recommended**: Link to original projects in documentation

**Do not remove:** These attribution lines from README, release notes, or public-facing materials.

---

## 🎯 Key Improvements Made

### 🚀 From Pi vs Claude Code → Pi-with-Stuff

| Area | Original | This Enhancement |
|------|----------|------------------|
| **Documentation** | Minimal | ✅ Comprehensive README + guides |
| **Model Selection** | Limited | ✅ Multiple models (Phi-2, Llama 3.1 8B) |
| **Installation** | Manual | ✅ Automated scripts + env vars |
| **Error Handling** | Basic | ✅ Enhanced with user-friendly messages |
| **Organization** | Loose structure | ✅ Clean, logical directory layout |
| **Examples** | Few | ✅ Multiple practical use cases |
| **Privacy** | Stated | ✅ Emphasized with dedicated section |
| **Performance** | Good | ✅ Optimized models + benchmarks |

### 🔧 Technical Enhancements

1. **Model Management**
   - Added model downloader script
   - Supports multiple model formats
   - Includes quantization options

2. **Configuration**
   - Environment variable support
   - Configurable API endpoints
   - Model path customization

3. **Documentation**
   - Installation guide
   - Usage walkthrough
   - Troubleshooting tips
   - FAQ section

---

## 📞 Contact Information

| Project | Point of Contact |
|---------|------------------|
| Pi.dev | Mario Zechner (contact via website) |
| Pi vs Claude | IndyDevDans (GitHub) |
| Pi-with-Stuff | Zerwiz (GitHub / zerwiz) |

---

## 🙏 Acknowledgements

**Special thanks to:**
- @Mario Zechner for creating Pi.dev as an excellent foundation
- @IndyDevDans for the Pi vs Claude Code comparison project
- The open-source community for enabling this work

**This project stands on the shoulders of giants!**

---

## ⚠️ Disclaimer

This documentation is provided for **attribution purposes only**. The original projects should be consulted for their **primary license terms**. This document serves as a **record of attribution** and does not modify the legal status of any upstream project.

When using these tools publicly, ensure you comply with:
- ✅ Original project licenses
- ✅ Model EULAs (End User License Agreements)
- ✅ Your local jurisdiction's laws

---

<div align="center">

### 🌟 All projects serve the same goal: **Local-first, privacy-respecting development**

</div>

<div align="center">
  Made with ❤️ • Attribution • Transparency
</div>

---

**Generated:** [`ATTRIBUTION-LICENSE.md`](./ATTRIBUTION-LICENSE.md)
**Last Updated:** 2024
**License:** MIT
