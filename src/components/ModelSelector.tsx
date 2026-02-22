import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Sparkles, Settings2, ChevronDown } from 'lucide-react';
import type { ModelConfig, QuantizationType } from '../types';
import { QUANTIZATION_OPTIONS } from '../utils/calculationEngine';
import { MODEL_CATEGORIES } from '../data/popularModels';
import { searchHuggingFaceModels } from '../services/huggingFaceService';

interface ModelSelectorProps {
    popularModels: ModelConfig[];
    selectedModel: ModelConfig | null;
    quantization: QuantizationType;
    contextLength: number;
    onModelSelect: (model: ModelConfig) => void;
    onQuantizationChange: (q: QuantizationType) => void;
    onContextLengthChange: (len: number) => void;
}

export default function ModelSelector({
    popularModels,
    selectedModel,
    quantization,
    contextLength,
    onModelSelect,
    onQuantizationChange,
    onContextLengthChange,
}: ModelSelectorProps) {
    const [activeTab, setActiveTab] = useState<string>('popular');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ModelConfig[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showQuantDropdown, setShowQuantDropdown] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            const results = await searchHuggingFaceModels(query);
            setSearchResults(results);
            setIsSearching(false);
        }, 500);
    }, []);

    const tabs = [
        { key: 'popular', label: 'Popular' },
        { key: 'search', label: 'Search HF' },
    ];

    const displayModels = activeTab === 'search'
        ? searchResults
        : popularModels;

    const groupedModels = activeTab === 'popular'
        ? Object.entries(MODEL_CATEGORIES).reduce((acc, [cat, label]) => {
            const models = displayModels.filter((m) => m.category === cat);
            if (models.length > 0) acc.push({ label, models });
            return acc;
        }, [] as { label: string; models: ModelConfig[] }[])
        : [{ label: 'Search Results', models: displayModels }];

    const contextPresets = [2048, 4096, 8192, 16384, 32768, 65536, 131072];

    return (
        <motion.section
            className="card model-selector"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-labelledby="model-heading"
        >
            <div className="card-header">
                <Brain size={20} aria-hidden="true" />
                <h2 id="model-heading">AI Model</h2>
            </div>

            {/* Tabs */}
            <div className="model-tabs" role="tablist" aria-label="Model source">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`model-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        aria-controls={`tabpanel-${tab.key}`}
                        id={`tab-${tab.key}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search (HuggingFace tab) */}
            {activeTab === 'search' && (
                <div className="form-group search-group">
                    <div className="search-input-wrap">
                        <Search size={16} aria-hidden="true" />
                        <input
                            type="search"
                            placeholder="Search Hugging Face models..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="input-field"
                            aria-label="Search Hugging Face models"
                            role="searchbox"
                        />
                        {isSearching && (
                            <div className="search-spinner" role="status" aria-label="Searching">
                                <span className="sr-only">Searching...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Model List */}
            <div
                className="model-list"
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
            >
                {groupedModels.map((group) => (
                    <div key={group.label} className="model-group" role="group" aria-label={group.label}>
                        <div className="model-group-label" role="heading" aria-level={3}>{group.label}</div>
                        {group.models.map((model) => (
                            <motion.button
                                key={model.id}
                                className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
                                onClick={() => onModelSelect(model)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                aria-pressed={selectedModel?.id === model.id}
                                aria-label={`${model.name} by ${model.organization}, ${model.params >= 1 ? `${model.params.toFixed(1)} billion` : `${(model.params * 1000).toFixed(0)} million`} parameters${model.isMoE ? ', Mixture of Experts' : ''}`}
                            >
                                <div className="model-card-header">
                                    <span className="model-name">{model.name}</span>
                                    <span className="model-params" aria-hidden="true">
                                        {model.params >= 1 ? `${model.params.toFixed(1)}B` : `${(model.params * 1000).toFixed(0)}M`}
                                        {model.isMoE && (
                                            <span className="moe-badge">
                                                <Sparkles size={10} aria-hidden="true" />
                                                MoE
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="model-card-meta">
                                    <span className="model-org">{model.organization}</span>
                                    {model.description && (
                                        <span className="model-desc">{model.description}</span>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                ))}
                {activeTab === 'search' && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="model-empty" role="status">No models found. Try a different search term.</div>
                )}
                {activeTab === 'search' && searchQuery.length < 2 && (
                    <div className="model-empty">Type at least 2 characters to search Hugging Face models.</div>
                )}
            </div>

            {/* Quantization */}
            <div className="form-group">
                <label id="quant-label">
                    <Settings2 size={14} aria-hidden="true" />
                    Quantization
                </label>
                <div className="dropdown-container">
                    <button
                        className="dropdown-trigger"
                        onClick={() => setShowQuantDropdown(!showQuantDropdown)}
                        aria-expanded={showQuantDropdown}
                        aria-haspopup="listbox"
                        aria-labelledby="quant-label"
                    >
                        <span>
                            {QUANTIZATION_OPTIONS.find((q) => q.value === quantization)?.label || quantization}
                        </span>
                        <ChevronDown size={16} className={showQuantDropdown ? 'rotated' : ''} aria-hidden="true" />
                    </button>
                    <AnimatePresence>
                        {showQuantDropdown && (
                            <motion.div
                                className="dropdown-menu quant-dropdown"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                role="listbox"
                                aria-label="Quantization options"
                            >
                                <div className="dropdown-list">
                                    {QUANTIZATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`dropdown-item ${quantization === opt.value ? 'selected' : ''}`}
                                            onClick={() => {
                                                onQuantizationChange(opt.value);
                                                setShowQuantDropdown(false);
                                            }}
                                            role="option"
                                            aria-selected={quantization === opt.value}
                                        >
                                            <span className="quant-label">{opt.label}</span>
                                            <span className="quant-desc">{opt.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Context Length */}
            <fieldset className="form-group fieldset-reset">
                <legend className="form-legend">
                    Context Length
                    <span className="label-value">{contextLength.toLocaleString()} tokens</span>
                </legend>
                <div className="context-presets" role="radiogroup" aria-label="Context length">
                    {contextPresets.map((preset) => (
                        <button
                            key={preset}
                            className={`context-btn ${contextLength === preset ? 'active' : ''}`}
                            onClick={() => onContextLengthChange(preset)}
                            role="radio"
                            aria-checked={contextLength === preset}
                            aria-label={`${preset >= 1024 ? `${preset / 1024}K` : preset} tokens`}
                        >
                            {preset >= 1000 ? `${preset / 1024}K` : preset}
                        </button>
                    ))}
                </div>
            </fieldset>
        </motion.section>
    );
}
