import { fetchWithAuth } from './http';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  ideas_created: number;
  ideas_completed: number;
  ai_suggestions_applied: number;
  collaborations_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserStatsUpdate {
  total_ideas?: number;
  ideas_this_month?: number;
  ideas_completed?: number;
  ideas_in_progress?: number;
  total_features?: number;
  features_completed?: number;
  total_phases?: number;
  phases_completed?: number;
  total_categories?: number;
  ai_suggestions_generated?: number;
  current_streak?: number;
  longest_streak?: number;
  total_xp?: number;
  current_level?: number;
}

export interface StatsIncrement {
  field: string;
  amount: number;
}

export class UserAPI {
  static async getProfile(): Promise<UserProfile> {
    const result = await fetchWithAuth(`${API_URL}/api/profile`);
    return result.data.profile;
  }

  // Fixed: Correct endpoint is /api/stats (not /api/stats/stats)
  static async getStats(): Promise<UserStats> {
    const result = await fetchWithAuth(`${API_URL}/api/stats`);
    return result.data.stats;
  }

  static async updateProfile(data: UserProfileUpdate): Promise<UserProfile> {
    const result = await fetchWithAuth(`${API_URL}/api/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.profile;
  }

  static async updateStats(data: UserStatsUpdate): Promise<UserStats> {
    const result = await fetchWithAuth(`${API_URL}/api/stats/update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.stats;
  }

  static async incrementStat(field: string, amount: number = 1): Promise<UserStats> {
    const result = await fetchWithAuth(`${API_URL}/api/stats/increment`, {
      method: 'POST',
      body: JSON.stringify({ field, amount }),
    });
    return result.data.stats;
  }

  // Fixed: xp_amount should be in body, not query params
  static async awardXP(xpAmount: number): Promise<UserStats> {
    const result = await fetchWithAuth(`${API_URL}/api/stats/award-xp`, {
      method: 'POST',
      body: JSON.stringify(xpAmount), // Send as integer in body
    });
    return result.data.stats;
  }
}