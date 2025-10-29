export interface PlanFeatures {
  maxBooks: number;
  paragraphsPerDay: number; // -1 = unlimited
  wordsPerTranslation: number; // -1 = unlimited
  hasAds: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  periodicity: string;
  features: PlanFeatures;
  displayPriceHint: string;
  provider: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'failed';
  provider: string;
  providerSubId: string;
  startDate: string;
  endDate: string | null;
  cancelledAt: string | null;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  currency: string;
  email: string;
  provider?: string;
  payment_method?: string;
  buyer_language?: string;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  paymentUrl: string;
  status: string;
}
