import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Table, ArrowUpDown } from 'lucide-react';
import type { ModelConfig, HardwareConfig, QuantizationType, CompatibilityVerdict } from '../types';
import { quickCheck } from '../utils/calculationEngine';

interface ModelComparisonTableProps {
    models: ModelConfig[];
    hardware: HardwareConfig;
    quantization: QuantizationType;
    onModelSelect: (model: ModelConfig) => void;
}

const VERDICT_CONFIG: Record<CompatibilityVerdict, { emoji: string; label: string; className: string }> = {
    full_gpu: { emoji: '✅', label: 'Full GPU', className: 'verdict-green' },
    partial_offload: { emoji: '⚡', label: 'Partial', className: 'verdict-yellow' },
    cpu_only: { emoji: '🐢', label: 'CPU Only', className: 'verdict-orange' },
    cannot_run: { emoji: '❌', label: 'No', className: 'verdict-red' },
};

export default function ModelComparisonTable({
    models,
    hardware,
    quantization,
    onModelSelect,
}: ModelComparisonTableProps) {
    const results = useMemo(() => {
        return models.map((model) => {
            const { verdict, vramNeeded } = quickCheck(model, hardware, quantization);
            return { model, verdict, vramNeeded };
        }).sort((a, b) => {
            const order: Record<CompatibilityVerdict, number> = { full_gpu: 0, partial_offload: 1, cpu_only: 2, cannot_run: 3 };
            return order[a.verdict] - order[b.verdict] || a.vramNeeded - b.vramNeeded;
        });
    }, [models, hardware, quantization]);

    if (!hardware.gpu) {
        return (
            <motion.section
                className="card comparison-table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                aria-labelledby="comparison-heading"
            >
                <div className="card-header">
                    <Table size={20} aria-hidden="true" />
                    <h2 id="comparison-heading">Model Compatibility Overview</h2>
                </div>
                <div className="table-empty" role="status">Select your hardware to see model compatibility.</div>
            </motion.section>
        );
    }

    const canRunCount = results.filter((r) => r.verdict === 'full_gpu').length;
    const partialCount = results.filter((r) => r.verdict === 'partial_offload').length;

    return (
        <motion.section
            className="card comparison-table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            aria-labelledby="comparison-heading-full"
        >
            <div className="card-header">
                <Table size={20} aria-hidden="true" />
                <h2 id="comparison-heading-full">Model Compatibility Overview</h2>
                <div className="table-summary" aria-label={`${canRunCount} fully runnable models, ${partialCount} with partial offload`}>
                    <span className="summary-badge green">{canRunCount} runnable</span>
                    <span className="summary-badge yellow">{partialCount} partial</span>
                </div>
            </div>

            <div className="table-scroll" tabIndex={0} role="region" aria-label="Model comparison table">
                <table aria-label="Model compatibility comparison">
                    <thead>
                        <tr>
                            <th scope="col"><ArrowUpDown size={12} aria-hidden="true" /> Model</th>
                            <th scope="col">Params</th>
                            <th scope="col">VRAM Needed</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(({ model, verdict, vramNeeded }) => {
                            const cfg = VERDICT_CONFIG[verdict];
                            return (
                                <motion.tr
                                    key={model.id}
                                    className={`table-row ${cfg.className}`}
                                    onClick={() => onModelSelect(model)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onModelSelect(model);
                                        }
                                    }}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                    style={{ cursor: 'pointer' }}
                                    tabIndex={0}
                                    role="row"
                                    aria-label={`${model.name}: ${cfg.label}, needs ${vramNeeded.toFixed(1)} GB VRAM`}
                                >
                                    <td>
                                        <div className="table-model-name">
                                            {model.name}
                                            {model.isMoE && <span className="moe-mini" aria-label="Mixture of Experts">MoE</span>}
                                        </div>
                                        <span className="table-model-org">{model.organization}</span>
                                    </td>
                                    <td className="table-params">
                                        {model.params >= 1 ? `${model.params.toFixed(1)}B` : `${(model.params * 1000).toFixed(0)}M`}
                                    </td>
                                    <td className="table-vram">{vramNeeded.toFixed(1)} GB</td>
                                    <td>
                                        <span className={`table-verdict ${cfg.className}`}>
                                            <span aria-hidden="true">{cfg.emoji}</span> {cfg.label}
                                        </span>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.section>
    );
}
