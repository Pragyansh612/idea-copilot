import { fetchWithAuth } from './http';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  xp_awarded: number;
  unlocked_at: string;
  related_idea_id?: string | null;
}

export interface AchievementDefinition {
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  xp_awarded: number;
  unlock_condition: string;
}

export interface AchievementResponse extends Achievement {
  // All fields are already included from Achievement
}

export class AchievementAPI {
  static async getUserAchievements(): Promise<AchievementResponse[]> {
    const result = await fetchWithAuth(`${API_URL}/api/achievements`);
    return result.data.achievements;
  }

  static async getAllAchievements(): Promise<AchievementDefinition[]> {
    const result = await fetchWithAuth(`${API_URL}/api/achievements/all`);
    return result.data.achievements;
  }
}