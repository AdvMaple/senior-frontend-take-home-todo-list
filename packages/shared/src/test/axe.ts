import { axe } from "vitest-axe";

type AxeResults = Awaited<ReturnType<typeof axe>>;

/** Runs axe on `container` and returns the violations (color contrast is off in jsdom). */
export async function findAxeViolations(
  container: Element
): Promise<AxeResults["violations"]> {
  const results = await axe(container);
  return results.violations;
}
