export interface UserProfile {
  user_id: string;
  email: string;
  plan: 'free' | 'premium';
  usage: {
    used: number;
    limit: number; // -1 for unlimited
  };
}