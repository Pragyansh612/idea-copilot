import { fetchWithAuth } from './http';
import type { SuggestedItem } from './idea'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatRequest {
  query: string;
  idea_id?: string;
  feature_id?: string;
  phase_id?: string;
  competitor_id?: string;
}

export interface ChatResponse {
  response: string;
  context_used: {
    idea?: any;
    feature?: any;
    phase?: any;
    competitor?: any;
    ideas?: any[];
    features?: any[];
    competitors?: any[];
  };
  query_type: string;
  tokens_used?: number;
  response_time_ms: number;
  suggested_items?: SuggestedItem[];
}

export interface ChatHistoryItem {
  id: string;
  user_id: string;
  idea_id?: string;
  query_type: string;
  user_prompt: string;
  ai_response: string;
  ai_model?: string;
  tokens_used?: number;
  response_time_ms?: number;
  context_data?: {
    query_type?: string;
    context_entities?: string[];
    matched_contexts?: any;
  };
  created_at: string;
}

export interface ChatHistoryResponse {
  logs: ChatHistoryItem[];
  total: number;
  limit: number;
  skip: number;
}

export class CopilotAPI {
  static async chat(data: ChatRequest): Promise<ChatResponse> {
    const result = await fetchWithAuth(`${API_URL}/api/copilot/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  static async getHistory(limit: number = 50, skip: number = 0): Promise<ChatHistoryResponse> {
    const result = await fetchWithAuth(`${API_URL}/api/copilot/history?limit=${limit}&skip=${skip}`);
    return result.data;
  }
}