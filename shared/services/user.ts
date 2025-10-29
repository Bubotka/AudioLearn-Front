import type { UserProfile } from '../types/user';

interface IApiClient {
  getUserProfile(): Promise<UserProfile>;
}

export class UserService {
  constructor(private apiClient: IApiClient) {}

  async getUserProfile(): Promise<UserProfile> {
    return this.apiClient.getUserProfile();
  }
}