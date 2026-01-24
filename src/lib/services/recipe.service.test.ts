import { describe, expect, it, vi } from "vitest";
import { RecipeService } from "@/lib/services/recipe.service";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

const createSupabaseStub = () =>
  ({
    from: vi.fn(),
  }) as unknown as import("@/db/supabase.client").SupabaseClient;

const validRecipeResponse = {
  title: "Szybka sałatka",
  ingredients: [{ item: "pomidor", amount: 2, unit: "szt" }],
  instructions: [{ step: 1, text: "Pokrój i wymieszaj." }],
  prep_time_minutes: 10,
  calories: 250,
  diet_label: "Vegan",
};

describe("RecipeService", () => {
  it("throws when OpenRouter service is missing", async () => {
    const supabase = createSupabaseStub();
    const service = new RecipeService(supabase);

    await expect(service.generateRecipe("test", null)).rejects.toThrow("OpenRouter service is not configured");
  });

  it("normalizes AI response and enforces schema", async () => {
    const supabase = createSupabaseStub();
    const openRouterService = {
      createStructuredResponse: vi.fn().mockResolvedValue({
        title: "A".repeat(120),
        ingredients: [{ item: "  pomidor  ", amount: "2", unit: " szt " }],
        instructions: [{ step: "1", text: "  Pokrój  " }],
        prep_time_minutes: "20",
        calories: "100",
        diet_label: "Vegan",
      }),
    };
    const service = new RecipeService(supabase, openRouterService as never);

    const result = await service.generateRecipe("test", null);

    expect(openRouterService.createStructuredResponse).toHaveBeenCalledTimes(1);
    expect(result.title).toHaveLength(100);
    expect(result.ingredients[0]).toEqual({ item: "pomidor", amount: 2, unit: "szt" });
    expect(result.instructions[0]).toEqual({ step: 1, text: "Pokrój" });
    expect(result.prep_time_minutes).toBe(20);
    expect(result.calories).toBe(100);
    expect(result.diet_label).toBe("Vegan");
  });

  it("throws for missing required fields", async () => {
    const supabase = createSupabaseStub();
    const openRouterService = {
      createStructuredResponse: vi.fn().mockResolvedValue({}),
    };
    const service = new RecipeService(supabase, openRouterService as never);

    await expect(service.generateRecipe("test", null)).rejects.toThrow(
      "Invalid JSON structure from AI: Missing required fields"
    );
  });

  it("throws for schema violations after normalization", async () => {
    const supabase = createSupabaseStub();
    const openRouterService = {
      createStructuredResponse: vi.fn().mockResolvedValue({
        ...validRecipeResponse,
        ingredients: [],
      }),
    };
    const service = new RecipeService(supabase, openRouterService as never);

    await expect(service.generateRecipe("test", null)).rejects.toThrow(
      "Invalid JSON structure from AI: Schema validation failed"
    );
  });

  it("enforces daily limit when remaining credits are zero", async () => {
    const supabase = createSupabaseStub();
    const service = new RecipeService(supabase, {} as never);
    vi.spyOn(service, "getDailyUsage").mockResolvedValue({ remaining: 0, limit: 3 });

    await expect(service.checkDailyLimit("user-1")).rejects.toThrow("Daily generation limit reached");
  });

  it("includes profile constraints in the system prompt", async () => {
    const supabase = createSupabaseStub();
    const openRouterService = {
      createStructuredResponse: vi.fn().mockResolvedValue(validRecipeResponse),
    };
    const service = new RecipeService(supabase, openRouterService as never);

    await service.generateRecipe("test", {
      id: "user-1",
      display_name: "User",
      diet_id: "Vegan",
      terms_accepted_at: "2024-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      allergens: ["orzechy", "gluten"],
      dislikes: ["cebula"],
    });

    const call = openRouterService.createStructuredResponse.mock.calls[0]?.[0];
    const systemMessage = call?.messages?.find((message: { role: string }) => message.role === "system")?.content;
    expect(systemMessage).toContain("Follow the Vegan diet rules.");
    expect(systemMessage).toContain("STRICTLY EXCLUDE these allergens: orzechy, gluten.");
    expect(systemMessage).toContain("Avoid these ingredients if possible: cebula.");
  });
});
