import type { ModelConfig, CacheEntry } from '../types';

const CACHE_KEY_PREFIX = 'hf_model_cache_';
const SEARCH_CACHE_KEY = 'hf_search_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface HFModelListItem {
    _id: string;
    id: string;
    modelId: string;
    downloads: number;
    likes: number;
    pipeline_tag?: string;
    tags?: string[];
}

interface HFConfig {
    num_hidden_layers?: number;
    num_attention_heads?: number;
    num_key_value_heads?: number;
    hidden_size?: number;
    intermediate_size?: number;
    max_position_embeddings?: number;
    model_type?: string;
    num_local_experts?: number;
    num_experts_per_tok?: number;
    vocab_size?: number;
    // Some models use different keys
    n_layer?: number;
    n_head?: number;
    n_embd?: number;
}

function getCacheEntry<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCacheEntry<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: CACHE_TTL };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage might be full
    }
}

function estimateParams(config: HFConfig): number {
    const layers = config.num_hidden_layers || config.n_layer || 32;
    const hidden = config.hidden_size || config.n_embd || 4096;
    const intermediate = config.intermediate_size || hidden * 4;
    const vocab = config.vocab_size || 32000;
    const heads = config.num_attention_heads || config.n_head || 32;
    const headDim = hidden / heads;
    const kvHeads = config.num_key_value_heads || heads;

    // Approximate: attention weights + MLP weights + embedding
    const attentionParams = layers * (hidden * hidden + hidden * headDim * kvHeads * 2 + hidden * hidden);
    const mlpParams = layers * (hidden * intermediate * 3); // gate, up, down projections
    const embeddingParams = vocab * hidden * 2; // input + output embeddings

    let totalParams = attentionParams + mlpParams + embeddingParams;

    // MoE: multiply MLP by number of experts
    if (config.num_local_experts && config.num_local_experts > 1) {
        totalParams = attentionParams + mlpParams * config.num_local_experts + embeddingParams;
    }

    return totalParams / 1e9; // billions
}

function categorizeModel(params: number, isMoE: boolean): ModelConfig['category'] {
    if (isMoE) return 'moe';
    if (params <= 3) return 'small';
    if (params <= 10) return 'medium';
    if (params <= 20) return 'large';
    if (params <= 40) return 'xl';
    return 'xxl';
}

function configToModelConfig(hfId: string, config: HFConfig): ModelConfig {
    const layers = config.num_hidden_layers || config.n_layer || 32;
    const heads = config.num_attention_heads || config.n_head || 32;
    const hidden = config.hidden_size || config.n_embd || 4096;
    const kvHeads = config.num_key_value_heads || heads;
    const intermediate = config.intermediate_size || hidden * 4;
    const maxContext = config.max_position_embeddings || 4096;
    const isMoE = (config.num_local_experts || 0) > 1;
    const numExperts = config.num_local_experts || 1;
    const numActiveExperts = config.num_experts_per_tok || 1;

    const totalParams = estimateParams(config);
    let activeParams = totalParams;
    if (isMoE && numExperts > 1) {
        // Active params = attention + active_experts_MLP + embedding
        const mlpPerExpert = layers * (hidden * intermediate * 3) / 1e9;
        const totalMLP = mlpPerExpert * numExperts;
        const activeMLP = mlpPerExpert * numActiveExperts;
        activeParams = totalParams - totalMLP + activeMLP;
    }

    const parts = hfId.split('/');
    const org = parts.length > 1 ? parts[0] : 'Unknown';
    const name = parts.length > 1 ? parts[1] : hfId;

    return {
        id: hfId.replace(/\//g, '-').toLowerCase(),
        name: name,
        organization: org,
        params: Math.round(totalParams * 100) / 100,
        layers,
        numAttentionHeads: heads,
        numKVHeads: kvHeads,
        hiddenSize: hidden,
        intermediateSize: intermediate,
        maxContextLength: maxContext,
        isMoE,
        activeParams: isMoE ? Math.round(activeParams * 100) / 100 : undefined,
        numExperts: isMoE ? numExperts : undefined,
        numActiveExperts: isMoE ? numActiveExperts : undefined,
        category: categorizeModel(isMoE ? activeParams : totalParams, isMoE),
        source: 'huggingface',
        huggingFaceId: hfId,
    };
}

export async function searchHuggingFaceModels(query: string): Promise<ModelConfig[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = SEARCH_CACHE_KEY + query.toLowerCase();
    const cached = getCacheEntry<ModelConfig[]>(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=text-generation&sort=downloads&direction=-1&limit=20`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const items: HFModelListItem[] = await response.json();

        // Fetch configs in parallel (max 10)
        const modelPromises = items.slice(0, 10).map(async (item) => {
            try {
                return await fetchModelConfig(item.id);
            } catch {
                return null;
            }
        });

        const models = (await Promise.all(modelPromises)).filter(
            (m): m is ModelConfig => m !== null
        );

        setCacheEntry(cacheKey, models);
        return models;
    } catch (err) {
        console.warn('HuggingFace search failed:', err);
        return [];
    }
}

export async function fetchModelConfig(hfId: string): Promise<ModelConfig | null> {
    const cacheKey = CACHE_KEY_PREFIX + hfId;
    const cached = getCacheEntry<ModelConfig>(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://huggingface.co/${hfId}/resolve/main/config.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const config: HFConfig = await response.json();

        const model = configToModelConfig(hfId, config);
        setCacheEntry(cacheKey, model);
        return model;
    } catch (err) {
        console.warn(`Failed to fetch config for ${hfId}:`, err);
        return null;
    }
}
