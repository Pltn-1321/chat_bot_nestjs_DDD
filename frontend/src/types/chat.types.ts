/**
 * Types pour le chat
 */

export type MessageRole = 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | null;
  toolCalls?: ToolCall[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string | null;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  conversationId: string;
  response: ChatMessage;
  toolResults?: ToolResult[];
}
