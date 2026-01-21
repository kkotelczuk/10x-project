import type {
  OpenRouterChatCompletionInput,
  OpenRouterChatCompletionResponse,
  OpenRouterMessage,
  OpenRouterParams,
  OpenRouterStructuredResponseInput,
} from "@/types";

export interface OpenRouterServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultParams?: OpenRouterParams;
  timeoutMs?: number;
  appId?: string;
  appName?: string;
  logger?: Pick<Console, "error" | "warn" | "info">;
}

export class OpenRouterServiceError extends Error {
  public readonly errorCode: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(options: { errorCode: string; message: string; status?: number; details?: unknown }) {
    super(options.message);
    this.name = "OpenRouterServiceError";
    this.errorCode = options.errorCode;
    this.status = options.status ?? 500;
    this.details = options.details;
  }
}

export class OpenRouterService {
  public readonly defaultModel: string;
  public readonly defaultParams: OpenRouterParams;
  public readonly baseUrl: string;

  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly appId?: string;
  private readonly appName?: string;
  private readonly logger?: Pick<Console, "error" | "warn" | "info">;

  constructor(config: OpenRouterServiceConfig = {}) {
    const apiKey = config.apiKey ?? import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OpenRouter API key is missing.");
    }

    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl ?? "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel ?? "openai/gpt-4o-mini";
    this.defaultParams = config.defaultParams ?? {
      temperature: 0.2,
      max_tokens: 800,
      top_p: 0.9,
    };
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.appId = config.appId;
    this.appName = config.appName;
    this.logger = config.logger;

    this.validateConfig();
  }

  public async createChatCompletion(
    input: OpenRouterChatCompletionInput
  ): Promise<OpenRouterChatCompletionResponse | ReadableStream<Uint8Array>> {
    if (!input.messages || input.messages.length === 0) {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_INPUT",
        message: "Messages cannot be empty.",
        status: 400,
      });
    }

    const invalidMessage = input.messages.find(
      (message) => !message.role || typeof message.content !== "string" || !message.content.trim()
    );

    if (invalidMessage) {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_INPUT",
        message: "Every message must include a non-empty role and content.",
        status: 400,
      });
    }

    const model = this.resolveModel(input.model);
    const params = this.resolveParams(input.params);
    const payload: Record<string, unknown> = {
      model,
      messages: input.messages,
      ...params,
      stream: Boolean(input.stream),
    };

    if (input.response_format) {
      payload.response_format = input.response_format;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.appId ?? import.meta.env.SITE ?? "http://localhost:4321",
          "X-Title": this.appName ?? "10x-project",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.handleOpenRouterError(response);
      }

      if (input.stream) {
        if (!response.body) {
          throw new OpenRouterServiceError({
            errorCode: "STREAM_ERROR",
            message: "Stream body is missing.",
            status: 502,
          });
        }

        return response.body;
      }

      const data = (await response.json()) as OpenRouterChatCompletionResponse;

      if (!data?.choices?.length) {
        throw new OpenRouterServiceError({
          errorCode: "INVALID_RESPONSE",
          message: "OpenRouter response is missing choices.",
          status: 502,
        });
      }

      return data;
    } catch (error) {
      throw await this.handleOpenRouterError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async createStructuredResponse(input: OpenRouterStructuredResponseInput): Promise<Record<string, unknown>> {
    if (!input.schemaName?.trim()) {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_INPUT",
        message: "Schema name is required.",
        status: 400,
      });
    }

    if (!input.schemaObject || typeof input.schemaObject !== "object") {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_INPUT",
        message: "Schema object is required.",
        status: 400,
      });
    }

    const responseFormat = this.buildResponseFormat(input.schemaName, input.schemaObject);

    const response = await this.createChatCompletion({
      messages: input.messages,
      model: input.model,
      params: input.params,
      response_format: responseFormat,
      stream: false,
    });

    if ("getReader" in response) {
      throw new OpenRouterServiceError({
        errorCode: "STREAM_NOT_SUPPORTED",
        message: "Structured responses do not support streaming.",
        status: 400,
      });
    }

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_RESPONSE",
        message: "OpenRouter response content is missing.",
        status: 502,
      });
    }

    return this.parseJsonContent(content);
  }

  public validateConfig(): void {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key is missing.");
    }

    if (!this.baseUrl) {
      throw new Error("OpenRouter base URL is missing.");
    }

    if (!this.defaultModel) {
      throw new Error("OpenRouter default model is missing.");
    }
  }

  private buildMessages(
    systemMessage?: string,
    userMessage?: string,
    history: OpenRouterMessage[] = []
  ): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    if (systemMessage?.trim()) {
      messages.push({
        role: "system",
        content: systemMessage.trim(),
      });
    }

    if (history.length > 0) {
      messages.push(...history);
    }

    if (userMessage?.trim()) {
      messages.push({
        role: "user",
        content: userMessage.trim(),
      });
    }

    return messages;
  }

  private buildResponseFormat(schemaName: string, schemaObject: Record<string, unknown>) {
    if (!schemaName?.trim()) {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_INPUT",
        message: "Schema name is required.",
        status: 400,
      });
    }

    if (!schemaObject || typeof schemaObject !== "object") {
      throw new OpenRouterServiceError({
        errorCode: "INVALID_INPUT",
        message: "Schema object is required.",
        status: 400,
      });
    }

    return {
      type: "json_schema",
      json_schema: {
        name: schemaName.trim(),
        strict: true,
        schema: schemaObject,
      },
    } as const;
  }

  private resolveModel(modelOverride?: string): string {
    if (modelOverride?.trim()) {
      return modelOverride.trim();
    }

    return this.defaultModel;
  }

  private resolveParams(paramsOverride?: OpenRouterParams): OpenRouterParams {
    if (!paramsOverride) {
      return { ...this.defaultParams };
    }

    return {
      ...this.defaultParams,
      ...paramsOverride,
    };
  }

  private parseJsonContent(content: string): Record<string, unknown> {
    const trimmed = content.trim();
    const candidates: string[] = [trimmed];
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

    if (codeBlockMatch?.[1]) {
      candidates.unshift(codeBlockMatch[1].trim());
    }

    const braceStart = trimmed.indexOf("{");
    const braceEnd = trimmed.lastIndexOf("}");

    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      candidates.unshift(trimmed.slice(braceStart, braceEnd + 1).trim());
    }

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate) as Record<string, unknown>;
      } catch {
        const sanitized = candidate
          .split("")
          .map((char) => (char.charCodeAt(0) < 32 ? " " : char))
          .join("");
        try {
          return JSON.parse(sanitized) as Record<string, unknown>;
        } catch {
          continue;
        }
      }
    }

    this.logger?.error("OpenRouter response JSON parse failed.", {
      contentPreview: trimmed.slice(0, 500),
    });

    throw new OpenRouterServiceError({
      errorCode: "INVALID_JSON",
      message: "OpenRouter response is not valid JSON.",
      status: 502,
    });
  }

  private async handleOpenRouterError(error: unknown): Promise<OpenRouterServiceError> {
    if (error instanceof OpenRouterServiceError) {
      return error;
    }

    if (error instanceof Response) {
      const status = error.status;
      const text = await error.text();
      const errorCode = this.mapStatusToErrorCode(status);
      const message = text || "OpenRouter request failed.";

      this.logger?.error("OpenRouter HTTP error.", { status, errorCode });

      return new OpenRouterServiceError({
        errorCode,
        message,
        status,
        details: text,
      });
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      return new OpenRouterServiceError({
        errorCode: "TIMEOUT",
        message: "OpenRouter request timed out.",
        status: 504,
      });
    }

    this.logger?.error("OpenRouter unexpected error.", error);

    return new OpenRouterServiceError({
      errorCode: "UNKNOWN_ERROR",
      message: "Unexpected OpenRouter error.",
      status: 500,
    });
  }

  private mapStatusToErrorCode(status: number): string {
    if (status === 401 || status === 403) {
      return "UNAUTHORIZED";
    }

    if (status === 400) {
      return "BAD_REQUEST";
    }

    if (status === 404) {
      return "NOT_FOUND";
    }

    if (status === 429) {
      return "RATE_LIMITED";
    }

    if (status >= 500) {
      return "UPSTREAM_ERROR";
    }

    return "HTTP_ERROR";
  }
}
