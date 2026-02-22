import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import HardwareSelector from './components/HardwareSelector';
import ModelSelector from './components/ModelSelector';
import ResultsDashboard from './components/ResultsDashboard';
import ModelComparisonTable from './components/ModelComparisonTable';
import type { ModelConfig, HardwareConfig, QuantizationType, GPUInfo } from './types';
import { calculateCompatibility } from './utils/calculationEngine';
import { POPULAR_MODELS } from './data/popularModels';
import { fetchGPUs } from './services/gpuService';

function App() {
  // ── Data state ──
  const [gpus, setGpus] = useState<GPUInfo[]>([]);
  const [gpuLoading, setGpuLoading] = useState(true);

  // ── User selections ──
  const [hardware, setHardware] = useState<HardwareConfig>({
    gpu: null,
    gpuCount: 1,
    systemRAM: 16,
    isAppleSilicon: false,
  });
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [quantization, setQuantization] = useState<QuantizationType>('Q4_K_M');
  const [contextLength, setContextLength] = useState(4096);

  // ── Derived ──
  const result = useMemo(() => {
    if (!selectedModel || !hardware.gpu) return null;
    return calculateCompatibility(selectedModel, hardware, quantization, contextLength);
  }, [selectedModel, hardware, quantization, contextLength]);

  // ── Load data on mount ──
  useEffect(() => {
    async function loadGPUs() {
      setGpuLoading(true);
      try {
        const data = await fetchGPUs();
        setGpus(data);
      } catch (err) {
        console.error('Failed to load GPUs:', err);
      } finally {
        setGpuLoading(false);
      }
    }

    loadGPUs();
  }, []);

  return (
    <div className="app">
      {/* Skip to content link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Header />

      <main id="main-content" className="main-content" role="main">
        <div className="config-panels">
          <HardwareSelector
            gpus={gpus}
            gpuLoading={gpuLoading}
            hardware={hardware}
            onHardwareChange={setHardware}
          />
          <ModelSelector
            popularModels={POPULAR_MODELS}
            selectedModel={selectedModel}
            quantization={quantization}
            contextLength={contextLength}
            onModelSelect={setSelectedModel}
            onQuantizationChange={setQuantization}
            onContextLengthChange={setContextLength}
          />
        </div>

        <AnimatePresence mode="wait">
          {result && selectedModel && (
            <ResultsDashboard
              key={`${selectedModel.id}-${quantization}-${contextLength}`}
              result={result}
              modelName={selectedModel.name}
            />
          )}
        </AnimatePresence>

        <ModelComparisonTable
          models={POPULAR_MODELS}
          hardware={hardware}
          quantization={quantization}
          onModelSelect={setSelectedModel}
        />
      </main>

      <footer className="footer" role="contentinfo">
        <p>
          GPU data from <a href="https://github.com/RightNow-AI/RightNow-GPU-Database" target="_blank" rel="noopener noreferrer">RightNow GPU Database</a>
          {' · '}
          Models from <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">Hugging Face</a>
          {' · '}
          Estimates are approximate — actual performance varies
        </p>
      </footer>
    </div>
  );
}

export default App;
