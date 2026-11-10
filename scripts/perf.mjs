#!/usr/bin/env node

import { spawnSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { gzipSync } from "zlib";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(__dirname, "..");

/**
 * Performance script: deterministic static bundle-budget check.
 * Runs `pnpm build`, measures gzip sizes of JS bundles against documented budgets,
 * and writes results to perf/report.json.
 *
 * Budgets (gzipped):
 * - Application entry and shared dependency chunks: < 150 KiB each
 * - Route chunks: < 30 KiB each
 */

const BUDGETS = {
  coreChunk: 150 * 1024, // 150 KiB in bytes
  routeChunk: 30 * 1024, // 30 KiB in bytes
};

async function runPerf() {
  const startTime = new Date().toISOString();
  const nodeVersion = process.version;
  let buildSuccess = true;
  let budgetPass = true;
  const artifacts = [];

  // Step 1: Run pnpm build
  console.log("Running pnpm build...");
  const buildResult = spawnSync("pnpm", ["build"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (buildResult.status !== 0) {
    console.error("Build failed with exit code:", buildResult.status);
    buildSuccess = false;
  }

  // Step 2: Scan dist/assets for JS files and measure gzip sizes
  const distAssetsPath = resolve(repoRoot, "apps/web/dist/assets");
  let jsFiles = [];

  try {
    jsFiles = readdirSync(distAssetsPath)
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({
        name: file,
        path: join(distAssetsPath, file),
      }));
  } catch (error) {
    console.warn(`Warning: Could not read ${distAssetsPath}:`, error.message);
  }

  // Step 3: Measure gzip sizes and check budgets
  for (const file of jsFiles) {
    try {
      const content = readFileSync(file.path);
      const gzipped = gzipSync(content);
      const gzipSize = gzipped.length;
      const gzipSizeKiB = (gzipSize / 1024).toFixed(2);

      // Vite emits the app entry and its shared dependency graph as separate
      // chunks. `src-*` is the shared vendor chunk in this build; it is not a
      // route chunk, so it uses the application/core budget.
      const isCoreChunk =
        file.name.startsWith("index-") || file.name.startsWith("src-");
      const budget = isCoreChunk ? BUDGETS.coreChunk : BUDGETS.routeChunk;
      const pass = gzipSize <= budget;

      const artifact = {
        file: file.name,
        gzipBytes: gzipSize,
        gzipKiB: parseFloat(gzipSizeKiB),
        budget: isCoreChunk ? "application-core" : "route-chunk",
        budgetKiB: budget / 1024,
        pass,
      };

      artifacts.push(artifact);

      if (!pass) {
        budgetPass = false;
        console.error(
          `✗ ${file.name}: ${gzipSizeKiB} KiB (budget: ${budget / 1024} KiB)`
        );
      } else {
        console.log(
          `✓ ${file.name}: ${gzipSizeKiB} KiB (budget: ${budget / 1024} KiB)`
        );
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error.message);
      budgetPass = false;
    }
  }

  // Step 4: Write report
  const report = {
    timestamp: startTime,
    nodeVersion,
    buildSuccess,
    budgetPass,
    pass: buildSuccess && budgetPass,
    artifacts,
  };

  const perfDir = resolve(repoRoot, "perf");
  mkdirSync(perfDir, { recursive: true });
  const reportPath = resolve(perfDir, "report.json");

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${reportPath}`);

  // Step 5: Exit with appropriate code
  if (!buildSuccess || !budgetPass) {
    console.error("\n✗ Performance check failed");
    process.exit(1);
  } else {
    console.log("\n✓ Performance check passed");
    process.exit(0);
  }
}

runPerf().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
