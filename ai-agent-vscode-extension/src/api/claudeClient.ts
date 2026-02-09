import Anthropic from '@anthropic-ai/sdk';
import { ClaudeMessage } from '../types';

/**
 * Client for interacting with Claude API
 */
export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(apiKey: string, model?: string, maxTokens?: number) {
    this.client = new Anthropic({ apiKey });
    this.model = model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = maxTokens || 4096;
  }

  /**
   * Send a message to Claude and get response
   */
  async sendMessage(messages: ClaudeMessage[], systemPrompt?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content
        }))
      });

      // Extract text from response
      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock && 'text' in textBlock) {
        return textBlock.text;
      }

      return '';
    } catch (error) {
      throw new Error(`Claude API error: ${error}`);
    }
  }

  /**
   * Send message with tool use support
   */
  async sendMessageWithTools(
    messages: ClaudeMessage[],
    tools: any[],
    systemPrompt?: string
  ): Promise<any> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        tools,
        messages: messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content
        }))
      });

      return response;
    } catch (error) {
      throw new Error(`Claude API error: ${error}`);
    }
  }

  /**
   * Parse structured JSON from Claude response
   */
  extractJSON(response: string): any {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  }
}
