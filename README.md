# 🧠 LLM Hardware Calculator

**Can your machine run it?** — A fast, modern web app that calculates whether your hardware can run local AI/LLM models. Get detailed VRAM, RAM, and CPU offloading breakdowns for any model on any GPU.

---

## ✨ Features

- **2,800+ GPUs** — Searchable database (NVIDIA, AMD, Intel) fetched from [RightNow GPU Database](https://github.com/RightNow-AI/RightNow-GPU-Database)
- **Apple Silicon Support** — M1/M2/M3/M4 unified memory presets with accurate bandwidth estimates
- **Hugging Face Search** — Live search models and auto-parse `config.json` for architecture details
- **Ollama Auto-Detection** — Detects locally installed models when Ollama is running
- **11 Quantization Levels** — FP32 down to Q2_K with industry-standard bits-per-weight values
- **KV Cache Calculation** — Accurate per-layer KV cache memory for context lengths up to 128K
- **CPU Offloading Analysis** — Layer-by-layer breakdown showing what fits on GPU vs CPU
- **Performance Estimates** — Tokens/second estimation based on memory bandwidth
- **Smart Recommendations** — Actionable tips for quantization, context, and model alternatives
- **Compatibility Verdicts** — Full GPU ✅ | Partial Offload ⚡ | CPU Only 🐢 | Cannot Run ❌
- **Offline-Ready Caching** — localStorage with 7-day TTL for GPUs, 24h for HF models

## 🖼️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Vanilla CSS (dark glassmorphism theme) |
| Deployment | Docker / Firebase Hosting |

## 🚀 Quick Start

### Option 1: Docker (Recommended for servers)

Perfect for running on your homelab — Intel N100, Raspberry Pi, or any server.

```bash
# Clone and run
git clone <repo-url>
cd local-modal-hardware-calculator

# Build and start (serves on port 3000)
docker compose up -d

# Open in browser
open http://localhost:3000
```

To change the port:

```bash
PORT=8080 docker compose up -d
```

To rebuild after changes:

```bash
docker compose up -d --build
```

### Option 2: Firebase Hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```

### Option 3: Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Open http://localhost:5173
```

### Option 4: Production Build

```bash
npm run build
npm run preview
```

## 🐳 Docker Details

The Docker setup uses a **multi-stage build** for a tiny final image:

| Stage | Base Image | Purpose |
|-------|-----------|---------|
| Build | `node:22-alpine` | Install deps, compile TypeScript, bundle with Vite |
| Production | `nginx:alpine` | Serve static files (~25MB total image) |

The included `nginx.conf` handles SPA routing, Gzip compression, aggressive caching for hashed assets, and security headers.

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.tsx              # App branding + badges
│   ├── HardwareSelector.tsx    # GPU dropdown, RAM slider, Apple Silicon
│   ├── ModelSelector.tsx       # Model tabs, quantization, context presets
│   ├── ResultsDashboard.tsx    # Verdict, memory bar, layer viz, recs
│   └── ModelComparisonTable.tsx # All models vs hardware at a glance
├── services/
│   ├── gpuService.ts           # RightNow GPU DB integration
│   └── huggingFaceService.ts   # HF Hub API search + config parsing
├── utils/
│   └── calculationEngine.ts    # VRAM/RAM/KV cache/offloading formulas
├── data/
│   ├── popularModels.ts        # ~20 curated seed models (fallback)
│   └── appleSilicon.ts         # M1-M4 chip presets
├── types.ts                    # TypeScript interfaces
├── App.tsx                     # Main shell + state management
├── main.tsx                    # Entry point
└── index.css                   # Premium dark theme + glassmorphism
```

## 🔌 API Integrations

| API | Purpose | Cache TTL |
|-----|---------|-----------
| [RightNow GPU Database](https://github.com/RightNow-AI/RightNow-GPU-Database) | 2,800+ GPU specs (VRAM, bandwidth) | 7 days |
| [Hugging Face Hub](https://huggingface.co/docs/hub/api) | Model search + architecture config | 24 hours |

All APIs are called client-side from the browser. No backend server needed.

## 🧮 How Calculations Work

1. **Model Memory** = `parameters × bits_per_weight / 8` (accounts for quantization)
2. **KV Cache** = `2 × layers × kv_heads × head_dim × context_length × bytes` 
3. **Total Required** = Model Memory + KV Cache + 0.5 GB overhead
4. **Layer Offloading** = When VRAM < total, layers are split between GPU and CPU
5. **Performance** = `memory_bandwidth / (effective_params × 2)` adjusted for offload ratio

MoE models use full parameter count for memory but active parameters for speed estimation.

## 📄 License

MIT
