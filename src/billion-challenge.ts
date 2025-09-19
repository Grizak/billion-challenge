#!/usr/bin/env node

/**
 * 1 Billion Challenge - Node.js Performance Suite
 *
 * This script tests various approaches to process 1 billion numbers
 * and find the most efficient method in Node.js environment.
 *
 * Usage:
 *   pnpm setup && pnpm start
 *   pnpm full (for 1 billion numbers)
 *   pnpm benchmark (with detailed profiling)
 */

import { performance } from "perf_hooks";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import * as os from "os";
import { fileURLToPath } from "url";

// Handle both ES modules and CommonJS contexts
let __filename: string;

if (typeof import.meta !== "undefined" && import.meta.url) {
  // ES modules
  __filename = fileURLToPath(import.meta.url);
} else {
  // CommonJS fallback (shouldn't be needed but adds safety)
  __filename = process.argv[1] || "";
}

// Configuration interface
interface BenchmarkConfig {
  warmupRuns: number;
  testRuns: number;
  maxNumber: number;
  enableMemoryTracking: boolean;
  enableProgressReporting: boolean;
  progressInterval: number;
  batchSize: number;
}

// Enhanced configuration
const config: BenchmarkConfig = {
  warmupRuns: 3,
  testRuns: 5,
  maxNumber: 1_000_000_000,
  enableMemoryTracking: true,
  enableProgressReporting: true,
  progressInterval: 50_000_000,
  batchSize: 10_000_000,
};

// Command line argument parsing
const args = process.argv.slice(2);
const isFullTest = args.includes("--full");
const isVerbose = args.includes("--verbose");
const isDevelopment = args.includes("--dev");

// Benchmark result interface
interface BenchmarkResult {
  name: string;
  time: number;
  result: number | bigint;
  memoryUsed: number;
  opsPerSecond: number;
  error?: string;
}

// Performance utilities
class PerformanceUtils {
  static getMemoryUsage(): number {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }

  static reportProgress(current: number, total: number, method: string): void {
    if (!config.enableProgressReporting || !isVerbose) return;

    const percentage = ((current / total) * 100).toFixed(1);
    const barLength = 40;
    const filled = Math.floor((current / total) * barLength);
    const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

    process.stdout.write(`\r  ${method}: [${bar}] ${percentage}%`);
  }

  static formatNumber(num: number | bigint): string {
    if (typeof num === "bigint") {
      return num.toString();
    }
    return num.toLocaleString();
  }

  static formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// Enhanced benchmark implementations
class BillionChallenge {
  /**
   * Mathematical formula - O(1) complexity
   */
  static mathFormula(n: number): number {
    return (n * (n - 1)) / 2;
  }

  /**
   * BigInt mathematical formula for handling potential overflow
   */
  static mathFormulaBigInt(n: number): bigint {
    const bigN = BigInt(n);
    return (bigN * (bigN - 1n)) / 2n;
  }

  /**
   * Highly optimized loop with minimal overhead
   */
  static optimizedLoop(n: number): number {
    let sum = 0;
    const limit = n;

    for (let i = 0; i < limit; ++i) {
      sum += i;

      if (isVerbose && i % config.progressInterval === 0) {
        PerformanceUtils.reportProgress(i, n, "Optimized Loop");
      }
    }

    if (isVerbose) console.log();
    return sum;
  }

  /**
   * Assembly-style optimized loop with aggressive unrolling
   */
  static assemblyStyleLoop(n: number): number {
    let sum = 0;
    let i = 0;
    const unrollFactor = 16;
    const limit = Math.floor(n / unrollFactor) * unrollFactor;

    // Unroll loop by 16
    while (i < limit) {
      sum +=
        i +
        (i + 1) +
        (i + 2) +
        (i + 3) +
        (i + 4) +
        (i + 5) +
        (i + 6) +
        (i + 7) +
        (i + 8) +
        (i + 9) +
        (i + 10) +
        (i + 11) +
        (i + 12) +
        (i + 13) +
        (i + 14) +
        (i + 15);
      i += unrollFactor;

      if (isVerbose && i % config.progressInterval === 0) {
        PerformanceUtils.reportProgress(i, n, "Assembly Style");
      }
    }

    // Handle remaining elements
    while (i < n) {
      sum += i++;
    }

    if (isVerbose) console.log();
    return sum;
  }

  /**
   * Typed array approach with optimal batching
   */
  static typedArrayOptimal(n: number): number {
    let sum = 0;
    const batchSize = Math.min(config.batchSize, n);
    const batches = Math.ceil(n / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, n);
      const currentSize = end - start;

      const arr = new Uint32Array(currentSize);

      // Fill and sum in single pass
      for (let i = 0; i < currentSize; i++) {
        const value = start + i;
        arr[i] = value;
        sum += value;
      }

      if (isVerbose && batch % 10 === 0) {
        PerformanceUtils.reportProgress(end, n, "Typed Array");
      }
    }

    if (isVerbose) console.log();
    return sum;
  }

  /**
   * SIMD-style processing (simulated)
   */
  static simdStyle(n: number): number {
    let sum = 0;
    let i = 0;
    const vectorSize = 8;
    const limit = Math.floor(n / vectorSize) * vectorSize;

    // Simulate SIMD operations
    while (i < limit) {
      const base = i;
      // Process 8 consecutive numbers as a "vector"
      sum += base * 8 + (0 + 1 + 2 + 3 + 4 + 5 + 6 + 7);
      i += vectorSize;

      if (isVerbose && i % config.progressInterval === 0) {
        PerformanceUtils.reportProgress(i, n, "SIMD Style");
      }
    }

    // Handle remaining elements
    while (i < n) {
      sum += i++;
    }

    if (isVerbose) console.log();
    return sum;
  }

  /**
   * Worker threads for parallel processing
   */
  static async parallelWorkers(n: number): Promise<number> {
    const numWorkers = os.cpus().length;
    const chunkSize = Math.ceil(n / numWorkers);
    const promises: Promise<number>[] = [];

    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, n);

      if (start >= n) break;

      promises.push(BillionChallenge.createWorker(start, end));
    }

    const results = await Promise.all(promises);
    return results.reduce((sum, result) => sum + result, 0);
  }

  /**
   * Create optimized worker
   */
  private static createWorker(start: number, end: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { start, end, isWorker: true },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error("Worker timeout"));
      }, 300000); // 5 minute timeout

      worker.on("message", (result) => {
        clearTimeout(timeout);
        resolve(result);
      });

      worker.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.on("exit", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Cache-friendly chunked processing
   */
  static cacheFriendly(n: number): number {
    let sum = 0;
    const cacheLineSize = 64; // Typical cache line size in bytes
    const intsPerCacheLine = cacheLineSize / 4; // 4 bytes per int32
    const chunkSize = intsPerCacheLine * 1000; // Process 1000 cache lines at a time

    for (let chunk = 0; chunk < n; chunk += chunkSize) {
      const chunkEnd = Math.min(chunk + chunkSize, n);

      for (let i = chunk; i < chunkEnd; i++) {
        sum += i;
      }

      if (isVerbose && chunk % config.progressInterval === 0) {
        PerformanceUtils.reportProgress(chunk, n, "Cache Friendly");
      }
    }

    if (isVerbose) console.log();
    return sum;
  }

  /**
   * Tail-recursive approach (limited by call stack)
   */
  static tailRecursive(n: number, sum = 0, current = 0): number {
    if (current >= n) return sum;
    return this.tailRecursive(n, sum + current, current + 1);
  }

  async realisticStressTest(size: number) {
    console.log(
      `\n🏋️ Running Realistic Node.js Stress Test (${size.toLocaleString()} items)`
    );

    const startMem = process.memoryUsage().heapUsed / 1024 / 1024;
    const startTime = performance.now();

    // Step 1: Create large array with random numbers
    const arr = new Array(size).fill(0).map(() => Math.random());

    // Step 2: Map operation (CPU-heavy)
    const squares = arr.map((x) => x * x);

    // Step 3: Reduce operation (CPU-heavy)
    const sum = squares.reduce((a, b) => a + b, 0);

    // Step 4: Sort operation (CPU + memory)
    arr.sort((a, b) => a - b);

    // Step 5: JSON serialization (memory + CPU)
    const json = JSON.stringify(arr.slice(0, 1000)); // slice to avoid huge string in memory

    // Step 6: JSON deserialization
    const parsed = JSON.parse(json);
    if (isVerbose)
      console.log(`Parsed JSON sample: ${parsed.slice(0, 5).join(", ")}`);

    // Final memory and time report
    const endTime = performance.now();
    const endMem = process.memoryUsage().heapUsed / 1024 / 1024;

    console.log(`✅ Realistic Test Complete`);
    console.log(`Time: ${(endTime - startTime).toFixed(2)} ms`);
    console.log(`Memory Used: ${(endMem - startMem).toFixed(2)} MB`);
    console.log(
      `Sum (dummy result to prevent optimizations): ${sum.toFixed(2)}`
    );
  }
}

// Worker thread implementation
if (!isMainThread && parentPort && workerData?.isWorker) {
  const { start, end } = workerData;
  let sum = 0;

  // Optimized worker calculation
  for (let i = start; i < end; i++) {
    sum += i;
  }

  parentPort.postMessage(sum);
  process.exit(0);
}

// Enhanced benchmark runner
async function runBenchmark(
  name: string,
  fn: (n: number) => number | bigint | Promise<number>,
  n: number
): Promise<BenchmarkResult> {
  console.log(`\n🚀 Running ${name}...`);

  const times: number[] = [];
  let finalResult: number | bigint = 0;
  let error: string | undefined;

  try {
    // Warmup runs
    if (!isDevelopment) {
      console.log("  Warming up JIT...");
      const warmupSize = Math.min(n / 100, 1_000_000);
      for (let i = 0; i < config.warmupRuns; i++) {
        await fn(warmupSize);
      }
    }

    // Actual benchmark runs
    console.log("  Running benchmark...");
    const memoryBefore = PerformanceUtils.getMemoryUsage();

    for (let run = 0; run < config.testRuns; run++) {
      // Force garbage collection if available
      if (global.gc && !isDevelopment) {
        global.gc();
        global.gc(); // Double GC to ensure clean state
      }

      const start = performance.now();
      finalResult = await fn(n);
      const end = performance.now();

      const time = end - start;
      times.push(time);
      console.log(
        `    Run ${run + 1}/${config.testRuns}: ${PerformanceUtils.formatTime(
          time
        )}`
      );
    }

    const memoryAfter = PerformanceUtils.getMemoryUsage();
    const avgTime = times.reduce((a, b) => a + b) / times.length;

    return {
      name,
      time: avgTime,
      result: finalResult,
      memoryUsed: memoryAfter - memoryBefore,
      opsPerSecond: n / (avgTime / 1000),
    };
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.log(`    ❌ Error: ${error}`);

    return {
      name,
      time: Infinity,
      result: 0,
      memoryUsed: 0,
      opsPerSecond: 0,
      error,
    };
  }
}

// Enhanced results formatter
function formatResults(results: BenchmarkResult[]): void {
  console.log("\n" + "=".repeat(100));
  console.log("📊 BENCHMARK RESULTS");
  console.log("=".repeat(100));

  // Filter out failed benchmarks
  const validResults = results.filter((r) => !r.error);
  const failedResults = results.filter((r) => r.error);

  if (validResults.length === 0) {
    console.log("❌ No successful benchmarks to display");
    return;
  }

  // Sort by time (fastest first)
  const sortedResults = [...validResults].sort((a, b) => a.time - b.time);
  const fastest = sortedResults[0];

  if (!fastest) {
    console.log("❌ No valid benchmark results to display");
    return;
  }

  console.log("\n🏆 PERFORMANCE RANKING:");
  console.log("-".repeat(100));
  console.log(
    "Rank | Method                | Time        | Ops/Second  | Memory   | Speedup | Result"
  );
  console.log("-".repeat(100));

  sortedResults.forEach((result, index) => {
    const speedup = fastest.time / result.time;
    const rank = (index + 1).toString().padStart(4);
    const method = result.name.padEnd(20);
    const time = PerformanceUtils.formatTime(result.time).padStart(11);
    const ops = result.opsPerSecond.toExponential(2).padStart(11);
    const memory = `${result.memoryUsed.toFixed(1)}MB`.padStart(8);
    const speedupStr = `${speedup.toFixed(2)}x`.padStart(7);
    const resultStr = PerformanceUtils.formatNumber(result.result);

    const trophy = index === 0 ? "🏆" : "  ";
    console.log(
      `${rank} │ ${trophy}${method} │ ${time} │ ${ops} │ ${memory} │ ${speedupStr} │ ${resultStr}`
    );
  });

  if (failedResults.length > 0) {
    console.log("\n❌ FAILED BENCHMARKS:");
    console.log("-".repeat(60));
    failedResults.forEach((result) => {
      console.log(`• ${result.name}: ${result.error}`);
    });
  }

  console.log("\n🎯 SUMMARY:");
  console.log(`   Winner: ${fastest.name}`);
  console.log(`   Best Time: ${PerformanceUtils.formatTime(fastest.time)}`);
  console.log(`   Operations/sec: ${fastest.opsPerSecond.toExponential(2)}`);
  console.log(`   Memory Usage: ${fastest.memoryUsed.toFixed(2)}MB`);

  // Verification
  const uniqueResults = new Set(validResults.map((r) => r.result.toString()));
  if (uniqueResults.size === 1) {
    console.log("✅ All results verified as correct!");
  } else {
    console.log(
      "⚠️  Results verification failed - algorithms produced different results"
    );
  }
}

// Main execution function
async function main(): Promise<void> {
  console.log("🎯 1 BILLION CHALLENGE - NODE.JS PERFORMANCE SUITE");
  console.log("=".repeat(80));
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${os.platform()} ${os.arch()}`);
  console.log(
    `CPUs: ${os.cpus().length} (${os.cpus()[0]?.model || "Unknown"})`
  );
  console.log(
    `Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB total`
  );
  console.log(`V8 Version: ${process.versions.v8}`);
  console.log("=".repeat(80));

  const testSize = isFullTest ? config.maxNumber : 100_000_000;
  console.log(
    `🔢 Testing with ${PerformanceUtils.formatNumber(testSize)} numbers`
  );
  console.log(
    `⚙️  Mode: ${isFullTest ? "FULL CHALLENGE" : "DEVELOPMENT TEST"}`
  );
  console.log(
    `🔧 Warmup runs: ${config.warmupRuns}, Test runs: ${config.testRuns}`
  );

  // Define benchmarks in order of expected performance
  const benchmarks: Array<
    [string, (n: number) => number | bigint | Promise<number>]
  > = [
    ["Mathematical Formula", BillionChallenge.mathFormula],
    ["BigInt Math Formula", BillionChallenge.mathFormulaBigInt],
    ["Assembly Style Loop", BillionChallenge.assemblyStyleLoop],
    ["SIMD Style Processing", BillionChallenge.simdStyle],
    ["Optimized Loop", BillionChallenge.optimizedLoop],
    ["Cache Friendly", BillionChallenge.cacheFriendly],
    ["Typed Array Optimal", BillionChallenge.typedArrayOptimal],
    ["Parallel Workers", BillionChallenge.parallelWorkers],
    [
      "Realistic Stress Test",
      async (n) => {
        const challenge = new BillionChallenge();
        await challenge.realisticStressTest(Math.min(n, 10_000_000));
        return 0; // Dummy return
      },
    ],
  ];

  // Add tail recursive only for smaller tests
  if (testSize <= 10_000) {
    benchmarks.push([
      "Tail Recursive",
      (n) => BillionChallenge.tailRecursive(n),
    ]);
  }

  const results: BenchmarkResult[] = [];
  const startTime = performance.now();

  for (let i = 0; i < benchmarks.length; i++) {
    const benchmark = benchmarks[i];
    if (!benchmark) continue;
    const [name, fn] = benchmark;
    console.log(`\n[${i + 1}/${benchmarks.length}] ${name}`);

    try {
      const result = await runBenchmark(name, fn, testSize);
      results.push(result);

      // Memory management between benchmarks
      if (global.gc && !isDevelopment) {
        global.gc();
      }

      // Brief pause between benchmarks
      await new Promise((resolve) =>
        setTimeout(resolve, isDevelopment ? 100 : 1000)
      );
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  }

  const totalTime = performance.now() - startTime;

  formatResults(results);

  console.log(
    `\n⏱️  Total benchmark time: ${PerformanceUtils.formatTime(totalTime)}`
  );
  console.log("\n💡 OPTIMIZATION TIPS:");
  console.log("  • Mathematical approaches beat loops by orders of magnitude");
  console.log("  • Loop unrolling can provide 2-4x improvements");
  console.log("  • Memory-efficient approaches scale better");
  console.log("  • Parallel processing helps for CPU-bound tasks");
  console.log("  • V8 JIT optimization is crucial for hot loops");

  if (!isFullTest) {
    console.log("\n🚀 Ready for the full challenge? Run: pnpm full");
  }
}

// Error handling and graceful shutdown
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Unhandled rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ Uncaught exception:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n\n👋 Benchmark interrupted by user");
  process.exit(0);
});

// Main execution
if (isMainThread) {
  main().catch(console.error);
}
