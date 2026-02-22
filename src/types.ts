// ============================================================================
// Types for the Local AI Model Hardware Calculator
// ============================================================================

export interface ModelConfig {
  id: string;
  name: string;
  organization: string;
  params: number; // billions
  layers: number;
  numAttentionHeads: number;
  numKVHeads: number;
  hiddenSize: number;
  intermediateSize: number;
  maxContextLength: number;
  isMoE: boolean;
  activeParams?: number; // billions, for MoE
  numExperts?: number;
  numActiveExperts?: number;
  category: ModelCategory;
  source: 'huggingface' | 'seed' | 'custom';
  huggingFaceId?: string;
  description?: string;
}

export type ModelCategory = 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'moe';

export interface GPUInfo {
  name: string;
  vendor: 'nvidia' | 'amd' | 'intel' | 'apple';
  memorySize: number; // GB
  memoryType: string;
  memoryBandwidth: number; // GB/s
  architecture?: string;
  generation?: string;
  tdp?: number;
}

export interface HardwareConfig {
  gpu: GPUInfo | null;
  gpuCount: number;
  systemRAM: number; // GB
  isAppleSilicon: boolean;
  appleSiliconModel?: string;
  customVRAM?: number; // GB, override
}

export type QuantizationType =
  | 'FP32'
  | 'FP16'
  | 'Q8_0'
  | 'Q6_K'
  | 'Q5_K_M'
  | 'Q5_0'
  | 'Q4_K_M'
  | 'Q4_0'
  | 'Q3_K_M'
  | 'Q3_K_S'
  | 'Q2_K';

export type CompatibilityVerdict = 'full_gpu' | 'partial_offload' | 'cpu_only' | 'cannot_run';

export interface CalculationResult {
  verdict: CompatibilityVerdict;
  verdictLabel: string;
  verdictEmoji: string;

  // Memory breakdown (GB)
  modelMemoryGB: number;
  kvCacheMemoryGB: number;
  systemOverheadGB: number;
  totalRequiredGB: number;
  availableVRAM: number;
  availableRAM: number;

  // Layer offloading
  totalLayers: number;
  layersOnGPU: number;
  layersOnCPU: number;
  offloadPercentage: number;

  // Performance estimates
  estimatedTokensPerSec: number;
  speedCategory: 'fast' | 'moderate' | 'slow' | 'very_slow';

  // Recommendations
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'quantization' | 'context' | 'hardware' | 'model' | 'tip';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}
