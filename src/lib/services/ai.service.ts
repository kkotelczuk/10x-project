import type { ProfileDTO, RecipeIngredientJson, RecipeInstructionJson } from "@/types";

export interface GeneratedRecipeData {
  title: string;
  ingredients: RecipeIngredientJson[];
  instructions: RecipeInstructionJson[];
  prep_time_minutes: number;
  calories: number;
  diet_label: string;
}

interface RawRecipeData {
  title?: unknown;
  ingredients?: unknown;
  instructions?: unknown;
  prep_time_minutes?: unknown;
  calories?: unknown;
  diet_label?: unknown;
}

interface RawIngredient {
  item?: unknown;
  amount?: unknown;
  unit?: unknown;
}

interface RawInstruction {
  step?: unknown;
  text?: unknown;
}

export class AIService {
  private apiKey: string;
  private apiUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor() {
    // Accessing environment variable
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
  }

  /**
   * Generates a recipe based on the original text and user profile.
   * @param originalText The input text or dish name.
   * @param profile The user's profile data for personalization.
   * @returns Parsed generated recipe data.
   */
  async generateRecipe(originalText: string, profile: ProfileDTO | null): Promise<GeneratedRecipeData> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API Key is missing");
    }

    const systemPrompt = this.constructSystemPrompt(profile);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": import.meta.env.SITE || "http://localhost:4321", // Optional: for OpenRouter rankings
          "X-Title": "10x-project", // Optional: for OpenRouter rankings
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-70b-instruct:free", // Using a capable free model or configured one
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Generate a recipe for: ${originalText}`,
            },
          ],
          response_format: { type: "json_object" }, // Enforce JSON if supported, otherwise rely on prompt
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from AI");
      }

      const parsedData = JSON.parse(content);
      return this.validateAndSanitize(parsedData);
    } catch (error) {
      console.error("AI Generation failed:", error);
      throw error;
    }
  }

  private constructSystemPrompt(profile: ProfileDTO | null): string {
    let dietConstraints = "";
    if (profile) {
      if (profile.diet_id) {
        dietConstraints += `\n- Follow the ${profile.diet_id} diet rules.`;
      }
      if (profile.allergens && profile.allergens.length > 0) {
        dietConstraints += `\n- STRICTLY EXCLUDE these allergens: ${profile.allergens.join(", ")}.`;
      }
      if (profile.dislikes && profile.dislikes.length > 0) {
        dietConstraints += `\n- Avoid these ingredients if possible: ${profile.dislikes.join(", ")}.`;
      }
    }

    return `You are a professional chef and nutritionist.
    Your goal is to generate a structured recipe JSON based on the user's request.
    
    IMPORTANT: Detect the language of the user's input request and generate the recipe content (title, ingredients items, instructions text) in the SAME language.
    
    Constraints:${dietConstraints}
    
    Output strictly valid JSON with the following structure:
    {
      "title": "string",
      "ingredients": [{ "item": "string", "amount": number, "unit": "string" }],
      "instructions": [{ "step": number, "text": "string" }],
      "prep_time_minutes": number,
      "calories": number,
      "diet_label": "string"
    }
    
    - "amount" should be a number. If it's "to taste", use 0.
    - "calories" should be an estimated total number for the recipe (integer).
    - "diet_label" should be one of: Balanced, Low-Carb, Low-Fat, High-Protein, Vegan, Vegetarian.
    `;
  }

  private validateAndSanitize(data: unknown): GeneratedRecipeData {
    // Basic validation to ensure required fields exist
    if (!data || typeof data !== "object") {
      throw new Error("Invalid JSON structure from AI: Data is not an object");
    }

    const raw = data as RawRecipeData;

    if (typeof raw.title !== "string" || !Array.isArray(raw.ingredients) || !Array.isArray(raw.instructions)) {
      throw new Error("Invalid JSON structure from AI: Missing required fields");
    }

    return {
      title: raw.title.substring(0, 100),
      ingredients: raw.ingredients.map((ing: unknown) => {
        const i = ing as RawIngredient;
        return {
          item: String(i?.item || ""),
          amount: Number(i?.amount) || 0,
          unit: String(i?.unit || ""),
        };
      }),
      instructions: raw.instructions.map((inst: unknown) => {
        const i = inst as RawInstruction;
        return {
          step: Number(i?.step || 0),
          text: String(i?.text || ""),
        };
      }),
      prep_time_minutes: Number(raw.prep_time_minutes) || 15,
      calories: Number(raw.calories) || 0,
      diet_label: String(raw.diet_label || "Balanced"),
    };
  }
}
