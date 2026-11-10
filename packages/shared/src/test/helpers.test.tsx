import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useApi } from "../api/api-provider";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { createTestQueryClient, deferred, renderWithProviders } from ".";
import { renderHook, act } from "@testing-library/react";

function ApiProbe() {
  const api = useApi();
  return <p>{typeof api.listUsers}</p>;
}

describe("test helpers", () => {
  it("A-4: renderWithProviders injects a fresh in-memory API", async () => {
    const first = renderWithProviders(<ApiProbe />);
    expect(screen.getByText("function")).toBeInTheDocument();
    const user = await first.api.createUser({ username: "fresh-one" });
    first.unmount();
    const second = renderWithProviders(<ApiProbe />);
    const page = await second.api.listUsers({ search: user.username });
    expect(page.items).toEqual([]);
  });

  it("A-4: useApi throws outside ApiProvider", () => {
    expect(() => renderHook(() => useApi())).toThrow(/ApiProvider/);
  });

  it("createTestQueryClient disables retries and garbage collection", () => {
    const client = createTestQueryClient();
    expect(client.getDefaultOptions().queries?.retry).toBe(false);
    expect(client.getDefaultOptions().queries?.gcTime).toBe(Infinity);
  });

  it("deferred settles from outside", async () => {
    const gate = deferred<string>();
    gate.resolve("ok");
    await expect(gate.promise).resolves.toBe("ok");
  });
});

describe("useDebouncedValue", () => {
  it("Q2: emits the latest value only after the delay", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 20),
      { initialProps: { value: "a" } }
    );
    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current).toBe("a");
    await waitFor(() => {
      expect(result.current).toBe("abc");
    });
    act(() => undefined);
  });
});
