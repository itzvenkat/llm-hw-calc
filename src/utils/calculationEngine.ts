import type {
    ModelConfig,
    HardwareConfig,
    QuantizationType,
    CalculationResult,
    CompatibilityVerdict,
    Recommendation,
} from '../types';

// ============================================================================
// Quantization multipliers (relative to FP16)
// ============================================================================

const QUANTIZATION_BPW: Record<QuantizationType, number> = {
    FP32: 32,
    FP16: 16,
    Q8_0: 8.5,
    Q6_K: 6.57,
    Q5_K_M: 5.69,
    Q5_0: 5.5,
    Q4_K_M: 4.85,
    Q4_0: 4.5,
    Q3_K_M: 3.91,
    Q3_K_S: 3.5,
    Q2_K: 3.35,
};

export const QUANTIZATION_OPTIONS: { value: QuantizationType; label: string; description: string }[] = [
    { value: 'FP32', label: 'FP32 (Full)', description: 'Full precision — best quality, most memory' },
    { value: 'FP16', label: 'FP16 (Half)', description: 'Half precision — standard baseline' },
    { value: 'Q8_0', label: 'Q8_0', description: '8-bit — near-lossless quality' },
    { value: 'Q6_K', label: 'Q6_K', description: '6-bit — excellent quality' },
    { value: 'Q5_K_M', label: 'Q5_K_M', description: '5-bit — very good quality' },
    { value: 'Q5_0', label: 'Q5_0', description: '5-bit — good quality' },
    { value: 'Q4_K_M', label: 'Q4_K_M ★', description: '4-bit — best balance of quality and size' },
    { value: 'Q4_0', label: 'Q4_0', description: '4-bit — good balance' },
    { value: 'Q3_K_M', label: 'Q3_K_M', description: '3-bit — noticeable quality loss' },
    { value: 'Q3_K_S', label: 'Q3_K_S', description: '3-bit small — significant quality loss' },
    { value: 'Q2_K', label: 'Q2_K', description: '2-bit — extreme compression, poor quality' },
];

// ============================================================================
// Constants
// ============================================================================

const GPU_FRAMEWORK_OVERHEAD_GB = 0.5; // CUDA/Metal/ROCm framework
const APPLE_SILICON_USABLE_RATIO = 0.75; // ~75% of unified memory usable for ML
const CPU_SPEED_PENALTY = 4; // CPU inference is ~4x slower than GPU

// ============================================================================
// Core calculations
// ============================================================================

/**
 * Calculate model weight memory in GB
 */
function calcModelMemory(model: ModelConfig, quantization: QuantizationType): number {
    const bpw = QUANTIZATION_BPW[quantization];
    const effectiveParams = model.isMoE && model.activeParams
        ? model.params // MoE: full model must be in memory
        : model.params;
    return (effectiveParams * 1e9 * bpw) / 8 / 1e9;
}

/**
 * Calculate KV cache memory for a given context length
 * KV cache = 2 × layers × kv_heads × head_dim × context × bytes_per_element
 */
function calcKVCache(model: ModelConfig, contextLength: number, kvQuantBits: number = 16): number {
    const headDim = model.hiddenSize / model.numAttentionHeads;
    const bytesPerElement = kvQuantBits / 8;
    const kvCacheBytes =
        2 * model.layers * model.numKVHeads * headDim * contextLength * bytesPerElement;
    return kvCacheBytes / 1e9; // GB
}

/**
 * Get available VRAM based on hardware config
 */
function getAvailableVRAM(hardware: HardwareConfig): number {
    if (hardware.customVRAM) return hardware.customVRAM;

    if (hardware.isAppleSilicon && hardware.gpu) {
        return hardware.gpu.memorySize * APPLE_SILICON_USABLE_RATIO;
    }

    if (hardware.gpu) {
        return hardware.gpu.memorySize * hardware.gpuCount;
    }

    return 0;
}

/**
 * Estimate tokens per second based on hardware
 */
function estimateTokensPerSec(
    hardware: HardwareConfig,
    model: ModelConfig,
    layersOnGPU: number,
    totalLayers: number
): number {
    const gpuRatio = layersOnGPU / totalLayers;
    const effectiveParams = model.isMoE && model.activeParams ? model.activeParams : model.params;

    // Base estimate: bandwidth / model_size gives rough tok/s
    let bandwidth = hardware.gpu?.memoryBandwidth || 50;

    if (hardware.isAppleSilicon) {
        // Apple Silicon is competitive for its bandwidth
        bandwidth = hardware.gpu?.memoryBandwidth || 100;
    }

    // Very rough: tok/s ≈ bandwidth / (effective_params * 2 bytes)
    const baseTokensPerSec = bandwidth / (effectiveParams * 2);
    const adjustedTokensPerSec = baseTokensPerSec * gpuRatio + (baseTokensPerSec / CPU_SPEED_PENALTY) * (1 - gpuRatio);

    // Clamp to reasonable range
    return Math.max(0.5, Math.min(200, Math.round(adjustedTokensPerSec * 10) / 10));
}

function getSpeedCategory(tokPerSec: number): CalculationResult['speedCategory'] {
    if (tokPerSec >= 30) return 'fast';
    if (tokPerSec >= 10) return 'moderate';
    if (tokPerSec >= 3) return 'slow';
    return 'very_slow';
}

function generateRecommendations(
    model: ModelConfig,
    hardware: HardwareConfig,
    quantization: QuantizationType,
    verdict: CompatibilityVerdict,
    contextLength: number,
    totalRequired: number,
    availableVRAM: number,
): Recommendation[] {
    const recs: Recommendation[] = [];

    if (verdict === 'cannot_run') {
        recs.push({
            type: 'model',
            title: 'Try a smaller model',
            description: `This model requires ${totalRequired.toFixed(1)}GB but you only have ${(availableVRAM + hardware.systemRAM).toFixed(1)}GB total. Consider a smaller model.`,
            impact: 'high',
        });
    }

    if (verdict !== 'full_gpu' && quantization !== 'Q4_K_M' && quantization !== 'Q3_K_M' && quantization !== 'Q2_K') {
        const q4Memory = calcModelMemory(model, 'Q4_K_M') + calcKVCache(model, contextLength);
        recs.push({
            type: 'quantization',
            title: 'Use Q4_K_M quantization',
            description: `Switching to Q4_K_M would reduce memory to ~${q4Memory.toFixed(1)}GB with minimal quality loss.`,
            impact: 'high',
        });
    }

    if (contextLength > 4096 && verdict !== 'full_gpu') {
        const reducedKV = calcKVCache(model, 4096);
        const currentKV = calcKVCache(model, contextLength);
        const savings = currentKV - reducedKV;
        if (savings > 0.5) {
            recs.push({
                type: 'context',
                title: 'Reduce context length',
                description: `Reducing from ${contextLength.toLocaleString()} to 4,096 tokens saves ~${savings.toFixed(1)}GB of KV cache.`,
                impact: 'medium',
            });
        }
    }

    if (verdict === 'partial_offload') {
        recs.push({
            type: 'tip',
            title: 'CPU offloading active',
            description: 'Some model layers will run on CPU, which is slower. Consider a GPU with more VRAM for full speed.',
            impact: 'medium',
        });
    }

    if (hardware.isAppleSilicon) {
        recs.push({
            type: 'tip',
            title: 'Apple Silicon unified memory',
            description: `Your ${hardware.gpu?.name || 'Mac'} uses unified memory. ~${(APPLE_SILICON_USABLE_RATIO * 100).toFixed(0)}% of total RAM is usable for ML inference.`,
            impact: 'low',
        });
    }

    return recs;
}

// ============================================================================
// Main calculation function
// ============================================================================

export function calculateCompatibility(
    model: ModelConfig,
    hardware: HardwareConfig,
    quantization: QuantizationType,
    contextLength: number,
): CalculationResult {
    // Calculate memory requirements
    const modelMemoryGB = calcModelMemory(model, quantization);
    const kvCacheMemoryGB = calcKVCache(model, contextLength);
    const systemOverheadGB = GPU_FRAMEWORK_OVERHEAD_GB;
    const totalRequiredGB = modelMemoryGB + kvCacheMemoryGB + systemOverheadGB;

    // Available resources
    const availableVRAM = getAvailableVRAM(hardware);
    const availableRAM = hardware.systemRAM;
    const totalAvailable = availableVRAM + availableRAM;

    // Layer offloading calculation
    const totalLayers = model.layers;
    let layersOnGPU: number;
    let layersOnCPU: number;

    if (availableVRAM <= systemOverheadGB) {
        // No GPU memory available
        layersOnGPU = 0;
        layersOnCPU = totalLayers;
    } else {
        const vramForModel = availableVRAM - systemOverheadGB;
        const memoryPerLayer = modelMemoryGB / totalLayers;
        const kvPerLayer = kvCacheMemoryGB / totalLayers;
        const totalPerLayer = memoryPerLayer + kvPerLayer;

        layersOnGPU = Math.min(totalLayers, Math.floor(vramForModel / totalPerLayer));
        layersOnCPU = totalLayers - layersOnGPU;
    }

    const offloadPercentage = (layersOnCPU / totalLayers) * 100;

    // Determine verdict
    let verdict: CompatibilityVerdict;
    let verdictLabel: string;
    let verdictEmoji: string;

    if (totalRequiredGB <= availableVRAM) {
        verdict = 'full_gpu';
        verdictLabel = 'Full GPU';
        verdictEmoji = '✅';
    } else if (totalRequiredGB <= totalAvailable && layersOnGPU > 0) {
        verdict = 'partial_offload';
        verdictLabel = 'Partial Offload';
        verdictEmoji = '⚡';
    } else if (totalRequiredGB <= availableRAM) {
        verdict = 'cpu_only';
        verdictLabel = 'CPU Only';
        verdictEmoji = '🐢';
    } else {
        verdict = 'cannot_run';
        verdictLabel = 'Cannot Run';
        verdictEmoji = '❌';
    }

    // Performance estimate
    const estimatedTokensPerSec = estimateTokensPerSec(hardware, model, layersOnGPU, totalLayers);
    const speedCategory = getSpeedCategory(estimatedTokensPerSec);

    // Recommendations
    const recommendations = generateRecommendations(
        model, hardware, quantization, verdict, contextLength, totalRequiredGB, availableVRAM
    );

    return {
        verdict,
        verdictLabel,
        verdictEmoji,
        modelMemoryGB: Math.round(modelMemoryGB * 100) / 100,
        kvCacheMemoryGB: Math.round(kvCacheMemoryGB * 100) / 100,
        systemOverheadGB,
        totalRequiredGB: Math.round(totalRequiredGB * 100) / 100,
        availableVRAM: Math.round(availableVRAM * 100) / 100,
        availableRAM,
        totalLayers,
        layersOnGPU,
        layersOnCPU,
        offloadPercentage: Math.round(offloadPercentage),
        estimatedTokensPerSec,
        speedCategory,
        recommendations,
    };
}

/**
 * Quick compatibility check for comparison table
 */
export function quickCheck(
    model: ModelConfig,
    hardware: HardwareConfig,
    quantization: QuantizationType,
): { verdict: CompatibilityVerdict; vramNeeded: number } {
    const modelMem = calcModelMemory(model, quantization);
    const kvMem = calcKVCache(model, Math.min(model.maxContextLength, 4096));
    const total = modelMem + kvMem + GPU_FRAMEWORK_OVERHEAD_GB;
    const vram = getAvailableVRAM(hardware);
    const ram = hardware.systemRAM;

    let verdict: CompatibilityVerdict;
    if (total <= vram) verdict = 'full_gpu';
    else if (total <= vram + ram) verdict = 'partial_offload';
    else if (total <= ram) verdict = 'cpu_only';
    else verdict = 'cannot_run';

    return { verdict, vramNeeded: Math.round(total * 100) / 100 };
}
