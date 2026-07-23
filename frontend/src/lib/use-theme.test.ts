import { describe, it, expect } from "vitest";
import { resolveTheme } from "./use-theme";

describe("resolveTheme", () => {
  it("preference=light, system=light → light", () => {
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("preference=light, system=dark → light（用户显式锁定浅色）", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("preference=dark, system=light → dark（用户显式锁定深色）", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("preference=dark, system=dark → dark", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("preference=system, system=light → light", () => {
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("preference=system, system=dark → dark", () => {
    expect(resolveTheme("system", true)).toBe("dark");
  });
});
