# 🚀 1 Billion Challenge

A high-performance Node.js benchmark suite that tests various approaches to process 1 billion numbers efficiently.

## 🎯 One-Command Installation

### Linux/macOS:

```bash
curl -sSL https://benchmark.isaksweb.xyz/install.sh | bash
```

### Windows (Git Bash/WSL):

```bash
curl -sSL https://benchmark.isaksweb.xyz/install.sh | bash
```

### Alternative with wget:

```bash
wget -qO- https://benchmark.isaksweb.xyz/install.sh | bash
```

## 🏃 Quick Start

After installation:

```bash
cd billion-challenge
pnpm test          # Quick test (100M numbers, ~30s)
pnpm full          # Full challenge (1B numbers, ~5min)
pnpm benchmark     # Detailed profiling with memory tracking
```

## 🏆 Expected Performance Ranking

1. **🥇 Mathematical Formula**: ~0.001ms (O(1) complexity)
2. **🥈 Assembly Style Loop**: ~2-5 seconds
3. **🥉 Parallel Workers**: ~1-3 seconds (depends on CPU cores)
4. **📊 Other Optimizations**: ~3-8 seconds

## 💡 Optimization Techniques Tested

- **Mathematical formulas** (O(1) complexity)
- **Loop unrolling** and SIMD-style processing
- **Worker thread parallelization** (uses all CPU cores)
- **Memory-efficient typed arrays** with batching
- **Cache-friendly data access** patterns
- **V8 JIT optimization** strategies

## 🛠️ Manual Installation

If you prefer to inspect before running:

```bash
# Download the installer
curl -O https://benchmark.isaksweb.xyz/install.sh
chmod +x install.sh

# Review the script
cat install.sh

# Run manually
./install.sh
```

## 📊 System Requirements

- **Node.js 18+** (required)
- **4GB+ RAM** (recommended for full challenge)
- **Multi-core CPU** (for parallel processing tests)
- **Internet connection** (for dependency installation)

## 🔧 Advanced Usage

### Custom Installation Directory

```bash
curl -sSL https://benchmark.isaksweb.xyz/install.sh | bash -s -- --dir=my-benchmark
```

### Development Mode

```bash
# After installation
cd billion-challenge
pnpm dev           # Run with TypeScript directly
pnpm build:dev     # Development build with sourcemaps
```

### Profiling and Analysis

```bash
pnpm benchmark     # Full profiling with GC tracking
pnpm profile       # V8 profiling (creates .prof files)

# Analyze V8 profile
node --prof-process isolate-*.log > profile.txt
```

## 📈 Sample Output

```
🏆 PERFORMANCE RANKING:
Rank | Method                | Time        | Ops/Second  | Memory   | Speedup
   1 │ 🏆Mathematical Formula  │      0.01ms │   1.00e+13  │   0.0MB  │   1.00x
   2 │   Assembly Style Loop   │   2,134.56ms │   4.68e+08  │  15.2MB  │   0.47x
   3 │   Parallel Workers      │   1,847.32ms │   5.41e+08  │  45.3MB  │   0.54x
```

## 🤝 Contributing

Found a faster algorithm? Submit a PR!

1. Fork this repository
2. Add your optimization to `src/billion-challenge.ts`
3. Test with `pnpm benchmark`
4. Submit a pull request with benchmark results

## 📝 License

MIT License - Feel free to use in your projects!

---

Built with ❤️ using TypeScript + esbuild for maximum performance
