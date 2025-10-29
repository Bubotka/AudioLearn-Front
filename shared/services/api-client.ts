import { supabase } from '../config/supabase';

export class ApiClient {
  constructor(private baseUrl: string) {}

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

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
  
  async getUserProfile() {
    return this.get('/api/auth/me');
  }

  async getSubscriptionPlans() {
    return this.get('/api/v1/subscriptions/plans');
  }

  async getUserSubscription() {
    return this.get('/api/v1/subscriptions/me');
  }

  async createSubscription(data: unknown) {
    return this.post('/api/v1/subscriptions', data);
  }

  async cancelSubscription() {
    return this.delete('/api/v1/subscriptions/me');
  }

  async translate(data: unknown) {
    return this.post('/api/translate', data);
  }
}

export const apiClient = new ApiClient('http://localhost:8080');