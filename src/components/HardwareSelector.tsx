import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Search, ChevronDown, Apple, Server } from 'lucide-react';
import type { GPUInfo, HardwareConfig } from '../types';

interface HardwareSelectorProps {
    gpus: GPUInfo[];
    gpuLoading: boolean;
    hardware: HardwareConfig;
    onHardwareChange: (hardware: HardwareConfig) => void;
}

export default function HardwareSelector({
    gpus,
    gpuLoading,
    hardware,
    onHardwareChange,
}: HardwareSelectorProps) {
    const [gpuSearch, setGpuSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeVendor, setActiveVendor] = useState<string>('all');

    const filteredGPUs = useMemo(() => {
        let filtered = gpus;
        if (activeVendor !== 'all') {
            filtered = filtered.filter((g) => g.vendor === activeVendor);
        }
        if (gpuSearch) {
            const q = gpuSearch.toLowerCase();
            filtered = filtered.filter(
                (g) =>
                    g.name.toLowerCase().includes(q) ||
                    g.vendor.toLowerCase().includes(q)
            );
        }
        return filtered.slice(0, 50);
    }, [gpus, gpuSearch, activeVendor]);

    const vendors = [
        { key: 'all', label: 'All' },
        { key: 'nvidia', label: 'NVIDIA' },
        { key: 'amd', label: 'AMD' },
        { key: 'intel', label: 'Intel' },
        { key: 'apple', label: 'Apple' },
    ];

    const handleGPUSelect = (gpu: GPUInfo) => {
        const isApple = gpu.vendor === 'apple';
        onHardwareChange({
            ...hardware,
            gpu,
            isAppleSilicon: isApple,
            gpuCount: isApple ? 1 : hardware.gpuCount,
            systemRAM: isApple ? gpu.memorySize : hardware.systemRAM,
        });
        setShowDropdown(false);
        setGpuSearch('');
    };

    const ramInputId = 'hardware-ram-slider';
    const vramInputId = 'hardware-vram-override';
    const gpuSearchId = 'gpu-search-input';

    return (
        <motion.section
            className="card hardware-selector"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            aria-labelledby="hardware-heading"
        >
            <div className="card-header">
                <Monitor size={20} aria-hidden="true" />
                <h2 id="hardware-heading">Your Hardware</h2>
            </div>

            {/* GPU Selection */}
            <div className="form-group">
                <label id="gpu-label">GPU / Chip</label>
                <div className="dropdown-container">
                    <button
                        className="dropdown-trigger"
                        onClick={() => setShowDropdown(!showDropdown)}
                        aria-expanded={showDropdown}
                        aria-haspopup="listbox"
                        aria-labelledby="gpu-label"
                    >
                        <span className={hardware.gpu ? '' : 'placeholder'}>
                            {hardware.gpu ? (
                                <>
                                    <span className={`vendor-dot ${hardware.gpu.vendor}`} aria-hidden="true" />
                                    {hardware.gpu.name}
                                    <span className="gpu-vram">{hardware.gpu.memorySize}GB</span>
                                </>
                            ) : gpuLoading ? (
                                'Loading GPUs...'
                            ) : (
                                'Select your GPU'
                            )}
                        </span>
                        <ChevronDown size={16} className={showDropdown ? 'rotated' : ''} aria-hidden="true" />
                    </button>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                className="dropdown-menu"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                role="listbox"
                                aria-label="GPU options"
                            >
                                <div className="dropdown-search">
                                    <Search size={14} aria-hidden="true" />
                                    <input
                                        id={gpuSearchId}
                                        type="text"
                                        placeholder="Search GPUs..."
                                        value={gpuSearch}
                                        onChange={(e) => setGpuSearch(e.target.value)}
                                        autoFocus
                                        aria-label="Search GPUs"
                                    />
                                </div>

                                <div className="vendor-tabs" role="tablist" aria-label="Filter by vendor">
                                    {vendors.map((v) => (
                                        <button
                                            key={v.key}
                                            className={`vendor-tab ${activeVendor === v.key ? 'active' : ''}`}
                                            onClick={() => setActiveVendor(v.key)}
                                            role="tab"
                                            aria-selected={activeVendor === v.key}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="dropdown-list">
                                    {filteredGPUs.length === 0 ? (
                                        <div className="dropdown-empty" role="alert">No GPUs found</div>
                                    ) : (
                                        filteredGPUs.map((gpu, i) => (
                                            <button
                                                key={`${gpu.vendor}-${gpu.name}-${i}`}
                                                className="dropdown-item"
                                                onClick={() => handleGPUSelect(gpu)}
                                                role="option"
                                                aria-selected={hardware.gpu?.name === gpu.name}
                                            >
                                                <span className={`vendor-dot ${gpu.vendor}`} aria-hidden="true" />
                                                <span className="gpu-name">{gpu.name}</span>
                                                <span className="gpu-vram">{gpu.memorySize}GB</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Apple Silicon indicator */}
            {hardware.isAppleSilicon && (
                <motion.div
                    className="apple-notice"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    role="note"
                >
                    <Apple size={16} aria-hidden="true" />
                    <span>Unified Memory — GPU and CPU share the same memory pool</span>
                </motion.div>
            )}

            {/* GPU Count (non-Apple only) */}
            {!hardware.isAppleSilicon && (
                <fieldset className="form-group fieldset-reset">
                    <legend className="form-legend">
                        <Server size={14} aria-hidden="true" />
                        Number of GPUs
                    </legend>
                    <div className="gpu-count-selector" role="radiogroup" aria-label="Number of GPUs">
                        {[1, 2, 3, 4, 8].map((n) => (
                            <button
                                key={n}
                                className={`count-btn ${hardware.gpuCount === n ? 'active' : ''}`}
                                onClick={() => onHardwareChange({ ...hardware, gpuCount: n })}
                                role="radio"
                                aria-checked={hardware.gpuCount === n}
                                aria-label={`${n} GPU${n > 1 ? 's' : ''}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}

            {/* System RAM */}
            <div className="form-group">
                <label htmlFor={ramInputId}>
                    System RAM
                    <span className="label-value">{hardware.systemRAM} GB</span>
                </label>
                <input
                    id={ramInputId}
                    type="range"
                    min={4}
                    max={512}
                    step={4}
                    value={hardware.systemRAM}
                    onChange={(e) =>
                        onHardwareChange({ ...hardware, systemRAM: parseInt(e.target.value) })
                    }
                    className="slider"
                    aria-valuemin={4}
                    aria-valuemax={512}
                    aria-valuenow={hardware.systemRAM}
                    aria-valuetext={`${hardware.systemRAM} gigabytes`}
                />
                <div className="slider-labels" aria-hidden="true">
                    <span>4 GB</span>
                    <span>512 GB</span>
                </div>
            </div>

            {/* Custom VRAM Override */}
            <div className="form-group">
                <label htmlFor={vramInputId}>
                    Custom VRAM Override
                    <span className="label-hint">(optional)</span>
                </label>
                <input
                    id={vramInputId}
                    type="number"
                    placeholder="Leave empty to use GPU spec"
                    min={0}
                    max={1000}
                    value={hardware.customVRAM || ''}
                    onChange={(e) =>
                        onHardwareChange({
                            ...hardware,
                            customVRAM: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                    }
                    className="input-field"
                    aria-describedby="vram-hint"
                />
                <span id="vram-hint" className="sr-only">Leave empty to automatically use the VRAM from your selected GPU</span>
            </div>
        </motion.section>
    );
}
