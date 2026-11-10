// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "../..");
const repoRoot = resolve(__dirname, "../..");

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

function getPackageJson(pkgPath: string): PackageJson | null {
  try {
    const content = readFileSync(join(repoRoot, pkgPath, "package.json"), "utf-8");
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

function walkSourceFiles(srcPath: string): string[] {
  const fullPath = join(repoRoot, srcPath);
  const files: string[] = [];

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullEntry = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullEntry);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
        ) {
          files.push(fullEntry);
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  walk(fullPath);
  return files;
}

function fileImportsFrom(filePath: string, importTarget: string): boolean {
  try {
    const content = readFileSync(filePath, "utf-8");
    const importRegex = new RegExp(
      `\\b(import|from)\\s+['"']${importTarget}['"]`,
    );
    return importRegex.test(content);
  } catch {
    return false;
  }
}

function findQueryKeyLiterals(): string[] {
  const patterns = [
    /queryKey:\s*\[/,
    /invalidateQueries\(\{\s*queryKey:\s*\[/,
  ];
  const results: string[] = [];

  const searchPaths = ["packages", "apps/web/src"];

  for (const searchPath of searchPaths) {
    const files = walkSourceFiles(searchPath);

    for (const file of files) {
      if (
        file.includes(".test.ts") ||
        file.includes(".test.tsx") ||
        file.includes("/keys/")
      ) {
        continue;
      }

      try {
        const content = readFileSync(file, "utf-8");
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            const relativePath = file.replace(repoRoot, "");
            results.push(relativePath);
          }
        }
      } catch {
        // File read error
      }
    }
  }

  return results;
}

function getExportedNames(indexPath: string): string[] {
  try {
    const content = readFileSync(indexPath, "utf-8");
    // Match export { ... } or export type { ... } blocks and extract names from within
    const exportBlockRegex = /export\s+(?:type\s+)?\{([^}]+)\}/gs;
    const names: string[] = [];
    let match;

    while ((match = exportBlockRegex.exec(content)) !== null) {
      const blockContent = match[1];
      if (!blockContent) continue;
      // Extract identifiers from the block, excluding 'as' keywords and aliases
      const identifierRegex = /\b([a-zA-Z_$][\w$]*)\b/g;
      let idMatch;

      while ((idMatch = identifierRegex.exec(blockContent)) !== null) {
        const name = idMatch[1];
        if (!name) continue;
        // Skip common keywords
        if (name !== "as" && name !== "type") {
          names.push(name);
        }
      }
    }

    return [...new Set(names)];
  } catch {
    return [];
  }
}

describe("Architecture requirements", () => {
  it("A-2: packages/users/package.json and packages/todos/package.json do not list each other in dependencies", () => {
    const usersPkg = getPackageJson("packages/users");
    const todosPkg = getPackageJson("packages/todos");

    if (usersPkg) {
      const usersDeps: Record<string, string> = {
        ...usersPkg.dependencies,
        ...usersPkg.devDependencies,
      };
      expect(usersDeps).not.toHaveProperty("@app/todos");
    }

    if (todosPkg) {
      const todosDeps: Record<string, string> = {
        ...todosPkg.dependencies,
        ...todosPkg.devDependencies,
      };
      expect(todosDeps).not.toHaveProperty("@app/users");
    }
  });

  it("A-2: no source file under packages/users/src imports from @app/todos and none under packages/todos/src imports from @app/users", () => {
    const usersFiles = walkSourceFiles("packages/users/src");
    for (const file of usersFiles) {
      expect(
        fileImportsFrom(file, "@app/todos"),
        `${file} should not import from @app/todos`,
      ).toBe(false);
    }

    const todosFiles = walkSourceFiles("packages/todos/src");
    for (const file of todosFiles) {
      expect(
        fileImportsFrom(file, "@app/users"),
        `${file} should not import from @app/users`,
      ).toBe(false);
    }
  });

  it("A-7/D-3: no queryKey: [ and no invalidateQueries({ queryKey: [ literals anywhere in packages/*/src or apps/web/src (excluding *.test.ts(x) and paths containing /keys/)", () => {
    const foundFiles = findQueryKeyLiterals();
    expect(
      foundFiles,
      `Found queryKey literals in: ${foundFiles.join(", ")}`,
    ).toEqual([]);
  });

  it("A-6: packages/users/src/index.ts exports useCreateUser, useUser, useUsersInfinite", () => {
    const exports = getExportedNames(
      join(repoRoot, "packages/users/src/index.ts"),
    );

    expect(exports, "Should export useCreateUser").toContain("useCreateUser");
    expect(exports, "Should export useUser").toContain("useUser");
    expect(exports, "Should export useUsersInfinite").toContain(
      "useUsersInfinite",
    );
  });
});
