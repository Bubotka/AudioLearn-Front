import { ApiClient } from './api-client';
import { UserService } from './user';
import { SubscriptionService } from './subscription';
import { TranslationService } from './translation';
import { AuthService } from './auth';
import { createSupabaseClient } from '../config/supabase';

export interface Services {
  auth: AuthService;
  user: UserService;
  subscription: SubscriptionService;
  translation: TranslationService;
}

export function createServices(baseUrl: string): Services {
  const supabase = createSupabaseClient();
  const apiClient = new ApiClient(baseUrl, supabase);

  return {
    auth: new AuthService(supabase),
    user: new UserService(apiClient),
    subscription: new SubscriptionService(apiClient),
    translation: new TranslationService(apiClient),
  };
}