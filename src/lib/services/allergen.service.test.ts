import { describe, expect, it, vi } from "vitest";
import { AllergenService } from "@/lib/services/allergen.service";

describe("AllergenService", () => {
  it("returns allergens from the database", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "gluten", label: "Gluten" }],
          error: null,
        }),
      }),
    } as unknown as import("@/db/supabase.client").SupabaseClient;

    const service = new AllergenService(supabase);
    const result = await service.getAllAllergens();

    expect(result).toEqual([{ id: "gluten", label: "Gluten" }]);
  });

  it("propagates database errors", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("db failed"),
        }),
      }),
    } as unknown as import("@/db/supabase.client").SupabaseClient;

    const service = new AllergenService(supabase);

    await expect(service.getAllAllergens()).rejects.toThrow("db failed");
  });
});
