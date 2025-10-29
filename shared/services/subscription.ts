import type {
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
} from '../types/subscription';

interface IApiClient {
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getUserSubscription(): Promise<Subscription | null>;
  createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse>;
  cancelSubscription(): Promise<void>;
}

export class SubscriptionService {
  constructor(private apiClient: IApiClient) {}

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.apiClient.getSubscriptionPlans();
  }

  async getCurrentSubscription(): Promise<Subscription | null> {
    return this.apiClient.getUserSubscription();
  }

  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> {
    return this.apiClient.createSubscription(request);
  }

  async cancelSubscription(): Promise<void> {
    return this.apiClient.cancelSubscription();
  }
}