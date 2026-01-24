import { describe, expect, it, vi } from "vitest";
import { DietService } from "@/lib/services/diet.service";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("DietService", () => {
  it("returns diets from the database", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "vegan", label: "Vegan" }],
          error: null,
        }),
      }),
    } as unknown as import("@/db/supabase.client").SupabaseClient;

    const service = new DietService(supabase);
    const result = await service.getAllDiets();

    expect(result).toEqual([{ id: "vegan", label: "Vegan" }]);
  });

  it("throws a friendly error when query fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("db failed"),
        }),
      }),
    } as unknown as import("@/db/supabase.client").SupabaseClient;

    const service = new DietService(supabase);

    await expect(service.getAllDiets()).rejects.toThrow("Failed to fetch diets");
  });
});
