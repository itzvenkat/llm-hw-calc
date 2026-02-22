import { motion } from 'framer-motion';
import { Shield, Gauge, Layers, Lightbulb, AlertTriangle, Zap, Clock } from 'lucide-react';
import type { CalculationResult } from '../types';

interface ResultsDashboardProps {
    result: CalculationResult;
    modelName: string;
}

const VERDICT_STYLES: Record<string, { color: string; bg: string; glow: string }> = {
    full_gpu: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', glow: '0 0 40px rgba(34,197,94,0.3)' },
    partial_offload: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', glow: '0 0 40px rgba(245,158,11,0.3)' },
    cpu_only: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', glow: '0 0 40px rgba(249,115,22,0.3)' },
    cannot_run: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', glow: '0 0 40px rgba(239,68,68,0.3)' },
};

const SPEED_LABELS: Record<string, { label: string; color: string }> = {
    fast: { label: 'Fast', color: '#22c55e' },
    moderate: { label: 'Moderate', color: '#f59e0b' },
    slow: { label: 'Slow', color: '#f97316' },
    very_slow: { label: 'Very Slow', color: '#ef4444' },
};

export default function ResultsDashboard({ result, modelName }: ResultsDashboardProps) {
    const style = VERDICT_STYLES[result.verdict];
    const speed = SPEED_LABELS[result.speedCategory];

    const totalBar = Math.max(result.totalRequiredGB, result.availableVRAM + result.availableRAM);
    const modelPct = (result.modelMemoryGB / totalBar) * 100;
    const kvPct = (result.kvCacheMemoryGB / totalBar) * 100;
    const overheadPct = (result.systemOverheadGB / totalBar) * 100;
    const vramPct = (result.availableVRAM / totalBar) * 100;

    return (
        <motion.section
            className="results-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            aria-labelledby="results-heading"
            aria-live="polite"
        >
            <h2 id="results-heading" className="sr-only">Compatibility Results for {modelName}</h2>

            {/* Verdict Badge */}
            <motion.div
                className="verdict-badge"
                style={{ backgroundColor: style.bg, boxShadow: style.glow, borderColor: style.color }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                role="status"
                aria-label={`Verdict: ${result.verdictLabel} for ${modelName}`}
            >
                <span className="verdict-emoji" aria-hidden="true">{result.verdictEmoji}</span>
                <div className="verdict-text">
                    <span className="verdict-label" style={{ color: style.color }}>
                        {result.verdictLabel}
                    </span>
                    <span className="verdict-model">{modelName}</span>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="stats-grid" role="list" aria-label="Calculation statistics">
                <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} role="listitem">
                    <div className="stat-icon" aria-hidden="true"><Shield size={18} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{result.totalRequiredGB.toFixed(1)} GB</span>
                        <span className="stat-label">Total Required</span>
                    </div>
                </motion.div>

                <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} role="listitem">
                    <div className="stat-icon" aria-hidden="true"><Gauge size={18} /></div>
                    <div className="stat-content">
                        <span className="stat-value" style={{ color: speed.color }}>
                            ~{result.estimatedTokensPerSec} tok/s
                        </span>
                        <span className="stat-label">Speed ({speed.label})</span>
                    </div>
                </motion.div>

                <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} role="listitem">
                    <div className="stat-icon" aria-hidden="true"><Layers size={18} /></div>
                    <div className="stat-content">
                        <span className="stat-value">{result.layersOnGPU} / {result.totalLayers}</span>
                        <span className="stat-label">Layers on GPU</span>
                    </div>
                </motion.div>

                <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} role="listitem">
                    <div className="stat-icon" aria-hidden="true">{result.offloadPercentage > 0 ? <AlertTriangle size={18} /> : <Zap size={18} />}</div>
                    <div className="stat-content">
                        <span className="stat-value">{result.offloadPercentage}%</span>
                        <span className="stat-label">CPU Offload</span>
                    </div>
                </motion.div>
            </div>

            {/* Memory Breakdown */}
            <motion.div
                className="memory-breakdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                aria-label={`Memory breakdown: model weights ${result.modelMemoryGB.toFixed(1)}GB, KV cache ${result.kvCacheMemoryGB.toFixed(2)}GB, overhead ${result.systemOverheadGB}GB. Available VRAM: ${result.availableVRAM.toFixed(1)}GB`}
            >
                <h3><Clock size={16} aria-hidden="true" /> Memory Breakdown</h3>
                <div className="memory-bar-container" role="img" aria-label={`Memory usage bar: ${result.totalRequiredGB.toFixed(1)}GB required out of ${result.availableVRAM.toFixed(1)}GB VRAM available`}>
                    <div className="memory-bar">
                        <motion.div
                            className="memory-segment model-weights"
                            style={{ width: `${modelPct}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${modelPct}%` }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        />
                        <motion.div
                            className="memory-segment kv-cache"
                            style={{ width: `${kvPct}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${kvPct}%` }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        />
                        <motion.div
                            className="memory-segment overhead"
                            style={{ width: `${overheadPct}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${overheadPct}%` }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                        />
                    </div>
                    <div className="vram-marker" style={{ left: `${vramPct}%` }} aria-hidden="true">
                        <div className="vram-line" />
                        <span className="vram-label">VRAM: {result.availableVRAM.toFixed(1)}GB</span>
                    </div>
                </div>
                <div className="memory-legend" aria-hidden="true">
                    <span className="legend-item"><span className="legend-dot model-weights" /> Model Weights ({result.modelMemoryGB.toFixed(1)} GB)</span>
                    <span className="legend-item"><span className="legend-dot kv-cache" /> KV Cache ({result.kvCacheMemoryGB.toFixed(2)} GB)</span>
                    <span className="legend-item"><span className="legend-dot overhead" /> Overhead ({result.systemOverheadGB} GB)</span>
                </div>
            </motion.div>

            {/* Layer Offloading Visualization */}
            {result.totalLayers > 0 && (
                <motion.div
                    className="layer-viz"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3><Layers size={16} aria-hidden="true" /> Layer Distribution</h3>
                    <div
                        className="layer-bar"
                        role="img"
                        aria-label={`${result.layersOnGPU} of ${result.totalLayers} layers on GPU, ${result.layersOnCPU} on CPU`}
                    >
                        {Array.from({ length: Math.min(result.totalLayers, 80) }).map((_, i) => {
                            const isGPU = i < result.layersOnGPU;
                            return (
                                <motion.div
                                    key={i}
                                    className={`layer-block ${isGPU ? 'gpu' : 'cpu'}`}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.7 + i * 0.01 }}
                                    aria-hidden="true"
                                />
                            );
                        })}
                    </div>
                    <div className="layer-legend" aria-hidden="true">
                        <span className="legend-item"><span className="legend-dot gpu-dot" /> GPU ({result.layersOnGPU})</span>
                        <span className="legend-item"><span className="legend-dot cpu-dot" /> CPU ({result.layersOnCPU})</span>
                    </div>
                </motion.div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
                <motion.div
                    className="recommendations"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <h3><Lightbulb size={16} aria-hidden="true" /> Recommendations</h3>
                    <ul className="rec-list" role="list">
                        {result.recommendations.map((rec, i) => (
                            <motion.li
                                key={i}
                                className={`rec-card rec-${rec.impact}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.1 }}
                            >
                                <div className="rec-header">
                                    <span className={`rec-impact ${rec.impact}`} aria-label={`${rec.impact} impact`}>{rec.impact}</span>
                                    <span className="rec-title">{rec.title}</span>
                                </div>
                                <p className="rec-desc">{rec.description}</p>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </motion.section>
    );
}
