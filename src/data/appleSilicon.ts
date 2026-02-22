import type { GPUInfo } from '../types';

/**
 * Apple Silicon GPU presets — no public API exists for these.
 * Unified memory architecture: GPU and CPU share the same memory pool.
 */
export const APPLE_SILICON_PRESETS: GPUInfo[] = [
    // M1
    { name: 'M1 (8GB)', vendor: 'apple', memorySize: 8, memoryType: 'Unified LPDDR4X', memoryBandwidth: 68.25, architecture: 'M1', generation: 'M1' },
    { name: 'M1 (16GB)', vendor: 'apple', memorySize: 16, memoryType: 'Unified LPDDR4X', memoryBandwidth: 68.25, architecture: 'M1', generation: 'M1' },
    { name: 'M1 Pro (16GB)', vendor: 'apple', memorySize: 16, memoryType: 'Unified LPDDR5', memoryBandwidth: 200, architecture: 'M1 Pro', generation: 'M1' },
    { name: 'M1 Pro (32GB)', vendor: 'apple', memorySize: 32, memoryType: 'Unified LPDDR5', memoryBandwidth: 200, architecture: 'M1 Pro', generation: 'M1' },
    { name: 'M1 Max (32GB)', vendor: 'apple', memorySize: 32, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M1 Max', generation: 'M1' },
    { name: 'M1 Max (64GB)', vendor: 'apple', memorySize: 64, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M1 Max', generation: 'M1' },
    { name: 'M1 Ultra (64GB)', vendor: 'apple', memorySize: 64, memoryType: 'Unified LPDDR5', memoryBandwidth: 800, architecture: 'M1 Ultra', generation: 'M1' },
    { name: 'M1 Ultra (128GB)', vendor: 'apple', memorySize: 128, memoryType: 'Unified LPDDR5', memoryBandwidth: 800, architecture: 'M1 Ultra', generation: 'M1' },

    // M2
    { name: 'M2 (8GB)', vendor: 'apple', memorySize: 8, memoryType: 'Unified LPDDR5', memoryBandwidth: 100, architecture: 'M2', generation: 'M2' },
    { name: 'M2 (16GB)', vendor: 'apple', memorySize: 16, memoryType: 'Unified LPDDR5', memoryBandwidth: 100, architecture: 'M2', generation: 'M2' },
    { name: 'M2 (24GB)', vendor: 'apple', memorySize: 24, memoryType: 'Unified LPDDR5', memoryBandwidth: 100, architecture: 'M2', generation: 'M2' },
    { name: 'M2 Pro (16GB)', vendor: 'apple', memorySize: 16, memoryType: 'Unified LPDDR5', memoryBandwidth: 200, architecture: 'M2 Pro', generation: 'M2' },
    { name: 'M2 Pro (32GB)', vendor: 'apple', memorySize: 32, memoryType: 'Unified LPDDR5', memoryBandwidth: 200, architecture: 'M2 Pro', generation: 'M2' },
    { name: 'M2 Max (32GB)', vendor: 'apple', memorySize: 32, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M2 Max', generation: 'M2' },
    { name: 'M2 Max (64GB)', vendor: 'apple', memorySize: 64, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M2 Max', generation: 'M2' },
    { name: 'M2 Max (96GB)', vendor: 'apple', memorySize: 96, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M2 Max', generation: 'M2' },
    { name: 'M2 Ultra (64GB)', vendor: 'apple', memorySize: 64, memoryType: 'Unified LPDDR5', memoryBandwidth: 800, architecture: 'M2 Ultra', generation: 'M2' },
    { name: 'M2 Ultra (128GB)', vendor: 'apple', memorySize: 128, memoryType: 'Unified LPDDR5', memoryBandwidth: 800, architecture: 'M2 Ultra', generation: 'M2' },
    { name: 'M2 Ultra (192GB)', vendor: 'apple', memorySize: 192, memoryType: 'Unified LPDDR5', memoryBandwidth: 800, architecture: 'M2 Ultra', generation: 'M2' },

    // M3
    { name: 'M3 (8GB)', vendor: 'apple', memorySize: 8, memoryType: 'Unified LPDDR5', memoryBandwidth: 100, architecture: 'M3', generation: 'M3' },
    { name: 'M3 (16GB)', vendor: 'apple', memorySize: 16, memoryType: 'Unified LPDDR5', memoryBandwidth: 100, architecture: 'M3', generation: 'M3' },
    { name: 'M3 (24GB)', vendor: 'apple', memorySize: 24, memoryType: 'Unified LPDDR5', memoryBandwidth: 100, architecture: 'M3', generation: 'M3' },
    { name: 'M3 Pro (18GB)', vendor: 'apple', memorySize: 18, memoryType: 'Unified LPDDR5', memoryBandwidth: 150, architecture: 'M3 Pro', generation: 'M3' },
    { name: 'M3 Pro (36GB)', vendor: 'apple', memorySize: 36, memoryType: 'Unified LPDDR5', memoryBandwidth: 150, architecture: 'M3 Pro', generation: 'M3' },
    { name: 'M3 Max (36GB)', vendor: 'apple', memorySize: 36, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M3 Max', generation: 'M3' },
    { name: 'M3 Max (48GB)', vendor: 'apple', memorySize: 48, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M3 Max', generation: 'M3' },
    { name: 'M3 Max (64GB)', vendor: 'apple', memorySize: 64, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M3 Max', generation: 'M3' },
    { name: 'M3 Max (96GB)', vendor: 'apple', memorySize: 96, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M3 Max', generation: 'M3' },
    { name: 'M3 Max (128GB)', vendor: 'apple', memorySize: 128, memoryType: 'Unified LPDDR5', memoryBandwidth: 400, architecture: 'M3 Max', generation: 'M3' },

    // M4
    { name: 'M4 (16GB)', vendor: 'apple', memorySize: 16, memoryType: 'Unified LPDDR5X', memoryBandwidth: 120, architecture: 'M4', generation: 'M4' },
    { name: 'M4 (24GB)', vendor: 'apple', memorySize: 24, memoryType: 'Unified LPDDR5X', memoryBandwidth: 120, architecture: 'M4', generation: 'M4' },
    { name: 'M4 (32GB)', vendor: 'apple', memorySize: 32, memoryType: 'Unified LPDDR5X', memoryBandwidth: 120, architecture: 'M4', generation: 'M4' },
    { name: 'M4 Pro (24GB)', vendor: 'apple', memorySize: 24, memoryType: 'Unified LPDDR5X', memoryBandwidth: 273, architecture: 'M4 Pro', generation: 'M4' },
    { name: 'M4 Pro (48GB)', vendor: 'apple', memorySize: 48, memoryType: 'Unified LPDDR5X', memoryBandwidth: 273, architecture: 'M4 Pro', generation: 'M4' },
    { name: 'M4 Max (36GB)', vendor: 'apple', memorySize: 36, memoryType: 'Unified LPDDR5X', memoryBandwidth: 546, architecture: 'M4 Max', generation: 'M4' },
    { name: 'M4 Max (48GB)', vendor: 'apple', memorySize: 48, memoryType: 'Unified LPDDR5X', memoryBandwidth: 546, architecture: 'M4 Max', generation: 'M4' },
    { name: 'M4 Max (64GB)', vendor: 'apple', memorySize: 64, memoryType: 'Unified LPDDR5X', memoryBandwidth: 546, architecture: 'M4 Max', generation: 'M4' },
    { name: 'M4 Max (128GB)', vendor: 'apple', memorySize: 128, memoryType: 'Unified LPDDR5X', memoryBandwidth: 546, architecture: 'M4 Max', generation: 'M4' },
];
