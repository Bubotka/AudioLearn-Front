import type { TranslateRequest, TranslateResponse } from '../types/translation';
import type { UserProfile } from '../types/user';
import type {
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
} from '../types/subscription';

interface ISupabaseClient {
  auth: {
    getSession(): Promise<{
      data: { session: { access_token: string } | null };
    }>;
  };
}

export class ApiClient {
  constructor(
    private baseUrl: string,
    private supabase: ISupabaseClient
  ) {}

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async post<T>(endpoint: string, data: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
  
  async getUserProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/auth/me');
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.get<SubscriptionPlan[]>('/api/v1/subscriptions/plans');
  }

  async getUserSubscription(): Promise<Subscription | null> {
    return this.get<Subscription | null>('/api/v1/subscriptions/me');
  }

  async createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> {
    return this.post<CreateSubscriptionResponse>('/api/v1/subscriptions', data);
  }

  async cancelSubscription(): Promise<void> {
    return this.delete<void>('/api/v1/subscriptions/me');
  }

  async translate(data: TranslateRequest): Promise<TranslateResponse> {
    return this.post('/api/translate', data);
  }
}