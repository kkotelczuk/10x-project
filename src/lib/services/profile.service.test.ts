import { describe, expect, it, vi } from "vitest";
import { ProfileService } from "@/lib/services/profile.service";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

const createSupabaseStub = (overrides: Partial<import("@/db/supabase.client").SupabaseClient> = {}) =>
  ({
    from: vi.fn(),
    ...overrides,
  }) as unknown as import("@/db/supabase.client").SupabaseClient;

describe("ProfileService", () => {
  it("returns null when profile is not found", async () => {
    const supabase = createSupabaseStub();
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });

    supabase.from = vi.fn().mockReturnValue({ select });

    const service = new ProfileService(supabase);
    const result = await service.getProfile("user-1");

    expect(result).toBeNull();
  });

  it("maps allergens and dislikes into flat arrays", async () => {
    const supabase = createSupabaseStub();
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        display_name: "User",
        diet_id: "Vegan",
        terms_accepted_at: "2024-01-01T00:00:00.000Z",
        created_at: "2024-01-01T00:00:00.000Z",
        profile_allergens: [{ allergen_id: "gluten" }],
        profile_dislikes: [{ ingredient_id: "cebula" }],
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });

    supabase.from = vi.fn().mockReturnValue({ select });

    const service = new ProfileService(supabase);
    const result = await service.getProfile("user-1");

    expect(result).toEqual({
      id: "user-1",
      display_name: "User",
      diet_id: "Vegan",
      terms_accepted_at: "2024-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      allergens: ["gluten"],
      dislikes: ["cebula"],
    });
  });

  it("rejects new profile upsert without terms acceptance", async () => {
    const supabase = createSupabaseStub();
    const service = new ProfileService(supabase);
    vi.spyOn(service, "getProfile").mockResolvedValueOnce(null);

    await expect(
      service.upsertProfile("user-1", {
        display_name: "User",
        diet_id: "Vegan",
        accept_terms: false,
        allergen_ids: [],
        dislike_ids: [],
      })
    ).rejects.toThrow("Terms acceptance is required for new profiles.");
  });

  it("upserts profile and updates relations for new user", async () => {
    const supabase = createSupabaseStub();
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const clearAllergensEq = vi.fn().mockResolvedValue({ error: null });
    const clearDislikesEq = vi.fn().mockResolvedValue({ error: null });
    const insertAllergens = vi.fn().mockResolvedValue({ error: null });
    const insertDislikes = vi.fn().mockResolvedValue({ error: null });

    supabase.from = vi.fn((table: string) => {
      if (table === "profiles") {
        return { upsert };
      }
      if (table === "profile_allergens") {
        return {
          delete: vi.fn().mockReturnValue({ eq: clearAllergensEq }),
          insert: insertAllergens,
        };
      }
      if (table === "profile_dislikes") {
        return {
          delete: vi.fn().mockReturnValue({ eq: clearDislikesEq }),
          insert: insertDislikes,
        };
      }
      return {};
    });

    const service = new ProfileService(supabase);
    vi.spyOn(service, "getProfile")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "user-1",
        display_name: "User",
        diet_id: "Vegan",
        terms_accepted_at: "2024-01-01T00:00:00.000Z",
        created_at: "2024-01-01T00:00:00.000Z",
        allergens: ["gluten"],
        dislikes: ["cebula"],
      });

    const result = await service.upsertProfile("user-1", {
      display_name: "User",
      diet_id: "Vegan",
      accept_terms: true,
      allergen_ids: ["gluten"],
      dislike_ids: ["cebula"],
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(insertAllergens).toHaveBeenCalledWith([{ profile_id: "user-1", allergen_id: "gluten" }]);
    expect(insertDislikes).toHaveBeenCalledWith([{ profile_id: "user-1", ingredient_id: "cebula" }]);
    expect(result.allergens).toEqual(["gluten"]);
    expect(result.dislikes).toEqual(["cebula"]);
  });
});
