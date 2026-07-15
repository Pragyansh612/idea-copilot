import { fetchWithAuth } from './http';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type PriorityEnum = 'low' | 'medium' | 'high';
export type StatusEnum = 'new' | 'in_progress' | 'completed' | 'archived' | 'paused';
export type SuggestionTypeEnum = 'features' | 'phases' | 'improvements' | 'marketing' | 'validation';
export type RelationTypeEnum = 'related' | 'depends_on' | 'blocks' | 'similar' | 'inspired_by';

// Suggested Item from AI
export interface SuggestedItem {
  title: string
  description: string
  priority?: string
  type: "feature" | "phase"
}

// ==================== RELATED IDEAS TYPES ====================

export interface RelatedIdeaCreate {
  source_idea_id: string;
  target_idea_id: string;
  relation_type?: RelationTypeEnum;
  is_ai_suggested?: boolean;
  confidence_score?: number;
}

export interface RelatedIdeaUpdate {
  relation_type?: RelationTypeEnum;
  is_ai_suggested?: boolean;
}

export interface RelatedIdea {
  id: string;
  source_idea_id: string;
  target_idea_id: string;
  relation_type: RelationTypeEnum;
  is_ai_suggested: boolean;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface RelatedIdeaWithDetails extends RelatedIdea {
  idea: Idea;
}

export interface GraphNode {
  id: string;
  title: string;
  description?: string;
  priority: PriorityEnum;
  status: StatusEnum;
  tags: string[];
  overall_score?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation_type: RelationTypeEnum;
  is_ai_suggested: boolean;
  confidence_score?: number;
}

export interface IdeaGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  center_node_id: string;
}

export interface RecommendationItem {
  idea: Idea;
  similarity_score: number;
  recommended_relation_type: RelationTypeEnum;
  is_already_connected: boolean;
}

export interface RecommendationList {
  recommendations: RecommendationItem[];
  total: number;
  auto_created_count?: number;
}

// ==================== AI TYPES ====================

export interface AIGenerateRequest {
  idea_id: string;
  suggestion_type: SuggestionTypeEnum;
  context?: string;
}

export interface AISuggestion {
  id: string;
  user_id: string;
  idea_id: string;
  suggestion_type: string;
  suggestion_text: string;
  content: string | any;
  context?: string;
  confidence_score?: number;
  is_applied?: boolean;
  created_at: string;
}

export interface AIQueryLog {
  id: string;
  user_id: string;
  idea_id?: string;
  query_type: string;
  query_text: string;
  response_text: string;
  tokens_used?: number;
  created_at: string;
}

export interface CreateFromSuggestionRequest {
  suggestion_id: string
  item_type: "feature" | "phase"
  idea_id: string
  title?: string
  description?: string
  priority?: string
}

export interface CreateFromSuggestionResponse {
  item_type: string
  feature?: Feature
  phase?: Phase
  created_from_suggestion: string
}

// ==================== COMPETITOR TYPES ====================

export interface CompetitorResearch {
  id: string;
  idea_id: string;
  competitor_url: string;
  competitor_name?: string;
  description?: string;
  strengths?: string[];
  weaknesses?: string[];
  differentiation_opportunities?: string[];
  market_position?: string;
  confidence_score?: number;
  /** `null`/`undefined` (pre-scrape-quality rows) should be treated as "ok". */
  scrape_quality?: 'ok' | 'thin' | 'blocked' | 'low_confidence' | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorScrapeRequest {
  idea_id: string;
  urls: string[];
  analyze?: boolean;
}

export interface RejectedCandidate {
  url: string;
  name?: string;
  reason?: string;
}

export interface DiscoverCompetitorsResult {
  success?: boolean;
  discovered?: number;
  competitors?: CompetitorResearch[];
  rejected?: RejectedCandidate[];
  cached?: boolean;
  cache_age_days?: number | null;
  request_id?: string;
}

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  color?: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
  description?: string;
}

// ==================== IDEA TYPES ====================

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_market?: string | null;
  capture_type: string;
  tags: string[];
  category_id?: string;
  priority: PriorityEnum;
  status: StatusEnum;
  effort_score?: number;
  impact_score?: number;
  interest_score?: number;
  overall_score?: number;
  progress_percentage: number;
  is_private: boolean;
  is_archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

/** Matches backend IdeaDetailResponse in API `data`. */
export interface IdeaDetailResponse {
  idea: Idea;
  phases: Phase[];
  features: Feature[];
}

export interface IdeaDetail {
  idea: Idea;
  phases: Phase[];
  features: Feature[];
}

export interface IdeaCreate {
  title: string;
  description?: string;
  target_market?: string;
  tags?: string[];
  category_id?: string;
  priority?: PriorityEnum;
  status?: StatusEnum;
  effort_score?: number;
  impact_score?: number;
  interest_score?: number;
  capture_type?: string;
}

export interface IdeaUpdate {
  title?: string;
  description?: string;
  target_market?: string;
  tags?: string[];
  category_id?: string;
  priority?: PriorityEnum;
  status?: StatusEnum;
  effort_score?: number;
  impact_score?: number;
  interest_score?: number;
  is_archived?: boolean;
}

export interface IdeaListParams {
  limit?: number;
  offset?: number;
  category_id?: string;
  tag?: string;
  priority?: PriorityEnum;
  status?: StatusEnum;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedIdeas {
  ideas: Idea[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface IdeaSearchResult {
  id: string;
  title: string;
  description?: string | null;
  status?: StatusEnum | null;
  created_at?: string | null;
}

// ==================== PHASE TYPES ====================

export interface Phase {
  id: string;
  idea_id: string;
  name: string;
  description?: string;
  order_index: number;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseCreate {
  name: string;
  description?: string;
  order_index?: number;
  due_date?: string;
}

export interface PhaseUpdate {
  name?: string;
  description?: string;
  order_index?: number;
  is_completed?: boolean;
  due_date?: string;
}

// ==================== FEATURE TYPES ====================

export interface Feature {
  id: string;
  idea_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  priority: PriorityEnum;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureCreate {
  title: string;
  description?: string;
  priority?: PriorityEnum;
  order_index?: number;
}

export interface FeatureUpdate {
  title?: string
  description?: string
  is_completed?: boolean
  priority?: PriorityEnum
  order_index?: number
  phase_id?: string
}

// ==================== AUTO-DETECTION TYPES ====================

export interface CommonComponent {
  id: string;
  component_name: string;
  component_type: 'technology' | 'feature' | 'service' | 'integration';
  description?: string;
  used_in_ideas: Array<{ id: string; title: string }>;
  usage_count: number;
  priority_score: number;
  suggested_order: number;
  estimated_effort?: string;
  is_accepted: boolean;
}

export interface BuildStep {
  step_number: number;
  component_name: string;
  component_type: string;
  description: string;
  reason: string;
  dependencies: string[];
  enables_ideas: string[];
  estimated_effort?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface BuildPlan {
  total_steps: number;
  estimated_timeline?: string;
  steps: BuildStep[];
  summary: string;
}

export interface RelationshipSuggestion {
  source_idea_id: string;
  source_idea_title: string;
  target_idea_id: string;
  target_idea_title: string;
  relationship_type: string;
  reason: string;
  confidence_score: number;
  common_components: string[];
}

export interface AutoDetectionResult {
  relationships_detected: number;
  relationships_created: number;
  common_components_found: number;
  build_suggestions: CommonComponent[];
  relationship_suggestions: RelationshipSuggestion[];
  summary: string;
}

// ==================== CATEGORIES API ====================

export class CategoryAPI {
  static async getCategories(): Promise<Category[]> {
    const result = await fetchWithAuth(`${API_URL}/api/categories`);
    return result.data.categories;
  }

  static async createCategory(data: CategoryCreate): Promise<Category> {
    const result = await fetchWithAuth(`${API_URL}/api/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.category;
  }

  static async updateCategory(categoryId: string, data: CategoryUpdate): Promise<Category> {
    const result = await fetchWithAuth(`${API_URL}/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.category;
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }
}

/** Unwrap legacy nested `{ idea: { idea, phases, features } }` from older API responses. */
export function normalizeIdeaDetail(data: Record<string, unknown>): IdeaDetailResponse {
  const nested = data.idea as Record<string, unknown> | undefined
  if (nested && nested.idea && typeof nested.idea === 'object') {
    return {
      idea: nested.idea as Idea,
      phases: (nested.phases as Phase[]) ?? [],
      features: (nested.features as Feature[]) ?? [],
    }
  }
  return {
    idea: data.idea as Idea,
    phases: (data.phases as Phase[]) ?? [],
    features: (data.features as Feature[]) ?? [],
  }
}

// ==================== IDEAS API ====================

export class IdeaAPI {
  static async getIdeas(params?: IdeaListParams): Promise<PaginatedIdeas> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const result = await fetchWithAuth(`${API_URL}/api/ideas?${queryParams}`);
    return result.data;
  }

  static async getIdea(ideaId: string): Promise<IdeaDetailResponse> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}`);
    return normalizeIdeaDetail(result.data);
  }

  static async createIdea(data: IdeaCreate): Promise<Idea> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.idea;
  }

  static async updateIdea(ideaId: string, data: IdeaUpdate): Promise<Idea> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.idea;
  }

  static async deleteIdea(ideaId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}`, {
      method: 'DELETE',
    });
  }

  static async searchIdeas(
    q: string,
    limit = 12,
    offset = 0
  ): Promise<{ ideas: IdeaSearchResult[]; total: number; query: string }> {
    const params = new URLSearchParams({
      q: q.trim(),
      limit: String(limit),
      offset: String(offset),
    });
    const result = await fetchWithAuth(`${API_URL}/api/ideas/search?${params}`);
    const data = result.data as {
      ideas?: IdeaSearchResult[];
      total?: number;
      query?: string;
    };
    return {
      ideas: data.ideas ?? [],
      total: data.total ?? 0,
      query: data.query ?? q.trim(),
    };
  }

  static async getArchivedIdeas(limit = 50, offset = 0): Promise<PaginatedIdeas> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const result = await fetchWithAuth(`${API_URL}/api/ideas/archived?${params}`);
    return result.data;
  }

  static async archiveIdea(ideaId: string): Promise<Idea> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/archive`, {
      method: 'POST',
    });
    return result.data.idea;
  }

  static async restoreIdea(ideaId: string): Promise<Idea> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/restore`, {
      method: 'POST',
    });
    return result.data.idea;
  }

  static async marketGapAnalysis(ideaId: string): Promise<unknown> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/market-gap-analysis`, {
      method: 'POST',
    });
    return result.data.gaps;
  }

  static async discoverCompetitors(ideaId: string): Promise<DiscoverCompetitorsResult> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/discover-competitors`, {
      method: 'POST',
    });
    return result.data;
  }

  static async runCompetitorAnalysis(ideaId: string): Promise<unknown> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/competitor-analysis`, {
      method: 'POST',
    });
    return result.data;
  }
}

// ==================== RELATED IDEAS API ====================

export class RelatedIdeaAPI {
  static async createRelation(data: RelatedIdeaCreate): Promise<RelatedIdea> {
    const result = await fetchWithAuth(`${API_URL}/api/related-ideas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.relation;
  }

  static async getRelatedIdeas(ideaId: string): Promise<RelatedIdeaWithDetails[]> {
    const result = await fetchWithAuth(`${API_URL}/api/related-ideas/${ideaId}`);
    return result.data.related_ideas;
  }

  static async getIdeaGraph(ideaId: string, depth: number = 2): Promise<IdeaGraph> {
    const result = await fetchWithAuth(`${API_URL}/api/related-ideas/graph/${ideaId}?depth=${depth}`);
    return result.data.graph;
  }

  static async updateRelation(relationId: string, data: RelatedIdeaUpdate): Promise<RelatedIdea> {
    const result = await fetchWithAuth(`${API_URL}/api/related-ideas/${relationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.relation;
  }

  static async deleteRelation(relationId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/related-ideas/${relationId}`, {
      method: 'DELETE',
    });
  }

  static async getRecommendations(
    ideaId: string,
    topN: number = 5,
    autoCreate: boolean = false
  ): Promise<RecommendationList> {
    const result = await fetchWithAuth(
      `${API_URL}/api/related-ideas/recommendations/${ideaId}?top_n=${topN}&auto_create=${autoCreate}`
    );
    const data = result.data as RecommendationList | { recommendations?: RecommendationItem[]; total?: number }
    if (data && Array.isArray(data.recommendations)) {
      return data as RecommendationList
    }
    return { recommendations: [], total: 0 }
  }
}

// ==================== PHASES API ====================

export class PhaseAPI {
  static async getPhases(ideaId: string): Promise<Phase[]> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/phases`);
    return result.data.phases;
  }

  static async createPhase(ideaId: string, data: PhaseCreate): Promise<Phase> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/phases`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.phase;
  }

  static async updatePhase(phaseId: string, data: PhaseUpdate): Promise<Phase> {
    const result = await fetchWithAuth(`${API_URL}/api/phases/${phaseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.phase;
  }

  static async deletePhase(phaseId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/phases/${phaseId}`, {
      method: 'DELETE',
    });
  }
}

// ==================== FEATURES API ====================

export class FeatureAPI {
  static async getFeatures(ideaId: string): Promise<Feature[]> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/features`);
    return result.data.features;
  }

  static async createFeatureForIdea(ideaId: string, data: FeatureCreate): Promise<Feature> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/features`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.feature;
  }

  static async createFeatureForPhase(phaseId: string, data: FeatureCreate): Promise<Feature> {
    const result = await fetchWithAuth(`${API_URL}/api/phases/${phaseId}/features`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.feature;
  }

  static async updateFeature(featureId: string, data: FeatureUpdate): Promise<Feature> {
    const result = await fetchWithAuth(`${API_URL}/api/features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.feature;
  }

  static async deleteFeature(featureId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/features/${featureId}`, {
      method: 'DELETE',
    });
  }
}

// ==================== COMPETITOR API ====================

export class CompetitorAPI {
  static async scrapeCompetitors(data: CompetitorScrapeRequest): Promise<any> {
    const result = await fetchWithAuth(`${API_URL}/api/competitor/scrape`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  /** Re-scrape + analyze an existing competitor row (updates in place — does not insert a duplicate). */
  static async analyzeCompetitor(competitorId: string): Promise<any> {
    const result = await fetchWithAuth(`${API_URL}/api/competitor/${competitorId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return result.data;
  }

  static async getCompetitorResearch(ideaId: string): Promise<any> {
    const result = await fetchWithAuth(`${API_URL}/api/competitor/${ideaId}`);
    return result.data;
  }

  static async getCompetitorFeatures(competitorId: string): Promise<{ features: Array<{ id: string; competitor_id: string; feature_name: string; description?: string }>; total: number }> {
    const result = await fetchWithAuth(`${API_URL}/api/competitor/${competitorId}/features`);
    return result.data;
  }
}

// ==================== AI API ====================

export class AIAPI {
  static async generateSuggestions(data: AIGenerateRequest): Promise<AISuggestion> {
    const result = await fetchWithAuth(`${API_URL}/api/ai/suggest`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.suggestion;
  }

  static async getSuggestions(ideaId: string): Promise<AISuggestion[]> {
    const result = await fetchWithAuth(`${API_URL}/api/ai/suggestions/${ideaId}`);
    return result.data.suggestions;
  }

  static async getQueryLogs(limit: number = 50): Promise<AIQueryLog[]> {
    const result = await fetchWithAuth(`${API_URL}/api/ai/logs?limit=${limit}`);
    return result.data.logs;
  }

  static async createFromSuggestion(data: CreateFromSuggestionRequest): Promise<CreateFromSuggestionResponse> {
    const result = await fetchWithAuth(`${API_URL}/api/ai/suggestions/create-item`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }
}

// ==================== AUTO-DETECTION API ====================

export class AutoDetectionAPI {
  static async analyzeAllIdeas(): Promise<AutoDetectionResult> {
    const result = await fetchWithAuth(`${API_URL}/api/auto-detect/analyze-ideas`, {
      method: 'POST',
    });
    return result.data;
  }

  static async getCommonComponents(minUsage: number = 2): Promise<CommonComponent[]> {
    const result = await fetchWithAuth(
      `${API_URL}/api/auto-detect/common-components?min_usage=${minUsage}`
    );
    return result.data.components;
  }

  static async getBuildPlan(): Promise<BuildPlan> {
    const result = await fetchWithAuth(`${API_URL}/api/auto-detect/build-plan`);
    return result.data.plan;
  }

  static async detectForIdea(ideaId: string): Promise<any> {
    const result = await fetchWithAuth(
      `${API_URL}/api/auto-detect/detect-for-idea/${ideaId}`,
      { method: 'POST' }
    );
    return result.data;
  }

  static async acceptSuggestion(suggestionId: string): Promise<void> {
    await fetchWithAuth(
      `${API_URL}/api/auto-detect/accept-suggestion/${suggestionId}`,
      { method: 'POST' }
    );
  }

  static async dismissSuggestion(suggestionId: string): Promise<void> {
    await fetchWithAuth(
      `${API_URL}/api/auto-detect/dismiss-suggestion/${suggestionId}`,
      { method: 'DELETE' }
    );
  }
}