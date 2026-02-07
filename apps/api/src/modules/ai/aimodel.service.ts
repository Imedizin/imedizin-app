import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * AI model service for chat completions. Uses OpenAI-compatible API (OpenAI, Groq, Ollama).
 * Config via OPENAI_BASE_URL, OPENAI_MODEL, OPENAI_API_KEY or GROQ_API_KEY.
 */
@Injectable()
export class AIModelService {
  private readonly client: OpenAI | null = null;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>("OPENAI_BASE_URL");
    const isGroq = baseURL?.includes("groq.com");
    const apiKey = isGroq
      ? this.configService.get<string>("GROQ_API_KEY")
      : this.configService.get<string>("OPENAI_API_KEY");
    this.defaultModel =
      this.configService.get<string>("OPENAI_MODEL") ?? "gpt-4o-mini";

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
      });
    }
  }

  /**
   * Send messages and return the assistant reply as plain text.
   */
  async complete(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<string> {
    if (!this.client) {
      const baseURL = this.configService.get<string>("OPENAI_BASE_URL");
      const hint = baseURL?.includes("groq.com")
        ? "Set GROQ_API_KEY for Groq (see https://console.groq.com)."
        : "Set OPENAI_API_KEY in .env.";
      throw new Error(`AI API key is not set. ${hint}`);
    }

    const {
      maxTokens = 2048,
      temperature = 0.2,
      model = this.defaultModel,
    } = options;

    const completion = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      temperature,
    });

    const content = completion.choices[0]?.message?.content;
    if (content == null) {
      throw new Error("Completion returned no content");
    }
    return content;
  }
}
