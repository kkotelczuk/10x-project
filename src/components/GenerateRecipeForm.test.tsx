import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerateRecipeForm } from "./GenerateRecipeForm";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockFetch = (response: { ok: boolean; status: number; json: () => Promise<unknown> }) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("GenerateRecipeForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits and calls onSuccess for ok response", async () => {
    const recipe = { id: "recipe-1" };
    const onSuccess = vi.fn();
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ recipe }),
    });

    render(<GenerateRecipeForm onSuccess={onSuccess} />);

    const textarea = screen.getByLabelText("Na co masz ochotę?");
    const button = screen.getByRole("button", { name: "Generuj Przepis" });

    await userEvent.type(textarea, "Szybki obiad z kurczakiem");
    await userEvent.click(button);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(recipe));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Na co masz ochotę?")).toHaveValue("");
  });

  it("shows user-friendly error on 401 response", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<GenerateRecipeForm />);

    const textarea = screen.getByLabelText("Na co masz ochotę?");
    const button = screen.getByRole("button", { name: "Generuj Przepis" });

    await userEvent.type(textarea, "Coś wegańskiego");
    await userEvent.click(button);

    expect(await screen.findByText("Musisz być zalogowany, aby generować przepisy.")).toBeInTheDocument();
  });
});
