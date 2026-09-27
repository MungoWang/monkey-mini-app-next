/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest"

import { cn } from "../../src/lib/utils"

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})
