import type { GPUInfo, CacheEntry } from '../types';
import { APPLE_SILICON_PRESETS } from '../data/appleSilicon';

const CACHE_KEY = 'gpu_database_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const GPU_URLS: Record<string, string> = {
    nvidia: 'https://raw.githubusercontent.com/RightNow-AI/RightNow-GPU-Database/main/data/nvidia/all.json',
    amd: 'https://raw.githubusercontent.com/RightNow-AI/RightNow-GPU-Database/main/data/amd/all.json',
    intel: 'https://raw.githubusercontent.com/RightNow-AI/RightNow-GPU-Database/main/data/intel/all.json',
};

interface RawGPU {
    name: string;
    vendor?: string;
    memorySize?: number;
    memoryType?: string;
    memoryBandwidth?: number;
    architecture?: string;
    generation?: string;
    tdp?: number;
}

function getCache(): GPUInfo[] | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const entry: CacheEntry<GPUInfo[]> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > entry.ttl) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCache(data: GPUInfo[]): void {
    try {
        const entry: CacheEntry<GPUInfo[]> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
        // localStorage might be full
    }
}

function mapRawGPU(raw: RawGPU, vendor: string): GPUInfo | null {
    // Only include GPUs that have VRAM info and are consumer/professional cards
    if (!raw.memorySize || raw.memorySize <= 0) return null;

    return {
        name: raw.name,
        vendor: vendor as GPUInfo['vendor'],
        memorySize: raw.memorySize,
        memoryType: raw.memoryType || 'Unknown',
        memoryBandwidth: raw.memoryBandwidth || 0,
        architecture: raw.architecture,
        generation: raw.generation,
        tdp: raw.tdp,
    };
}

/**
 * Filter to only include GPUs relevant for AI inference
 * (modern consumer and professional GPUs with >= 4GB VRAM)
 */
function filterRelevantGPUs(gpus: GPUInfo[]): GPUInfo[] {
    return gpus
        .filter((gpu) => gpu.memorySize >= 4) // At least 4GB VRAM
        .sort((a, b) => b.memorySize - a.memorySize); // Sort by VRAM descending
}

export async function fetchGPUs(): Promise<GPUInfo[]> {
    // Check cache first
    const cached = getCache();
    if (cached) {
        return [...cached, ...APPLE_SILICON_PRESETS];
    }

    const allGPUs: GPUInfo[] = [];

    const fetches = Object.entries(GPU_URLS).map(async ([vendor, url]) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const rawGPUs: RawGPU[] = await response.json();
            const mapped = rawGPUs
                .map((raw) => mapRawGPU(raw, vendor))
                .filter((gpu): gpu is GPUInfo => gpu !== null);
            return mapped;
        } catch (err) {
            console.warn(`Failed to fetch ${vendor} GPUs:`, err);
            return [];
        }
    });

    const results = await Promise.all(fetches);
    results.forEach((gpus) => allGPUs.push(...gpus));

    const filtered = filterRelevantGPUs(allGPUs);

    // Cache the fetched data (not Apple Silicon, those are static)
    if (filtered.length > 0) {
        setCache(filtered);
    }

    return [...filtered, ...APPLE_SILICON_PRESETS];
}

export function getGPUsByVendor(gpus: GPUInfo[]): Record<string, GPUInfo[]> {
    const grouped: Record<string, GPUInfo[]> = {
        nvidia: [],
        amd: [],
        intel: [],
        apple: [],
    };

    for (const gpu of gpus) {
        if (grouped[gpu.vendor]) {
            grouped[gpu.vendor].push(gpu);
        }
    }

    return grouped;
}

export function searchGPUs(gpus: GPUInfo[], query: string): GPUInfo[] {
    const q = query.toLowerCase().trim();
    if (!q) return gpus;
    return gpus.filter(
        (gpu) =>
            gpu.name.toLowerCase().includes(q) ||
            gpu.vendor.toLowerCase().includes(q) ||
            (gpu.architecture && gpu.architecture.toLowerCase().includes(q))
    );
}
