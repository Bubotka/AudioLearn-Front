import { supabase } from '../config/supabase';
import type { AuthResponse } from '../types/auth';

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email || '' }
        : null,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: {
              id: data.user!.id,
              email: data.user!.email || '',
            },
          }
        : null,
      error: error ? { message: error.message, status: error.status } : null,
    };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email || '' }
        : null,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: {
              id: data.user!.id,
              email: data.user!.email || '',
            },
          }
        : null,
      error: error ? { message: error.message, status: error.status } : null,
    };
  },

  async signOut(): Promise<{ error: AuthResponse['error'] }> {
    const { error } = await supabase.auth.signOut();
    return {
      error: error ? { message: error.message, status: error.status } : null,
    };
  },

  async getSession(): Promise<{ session: AuthResponse['session']; error: AuthResponse['error'] }> {
    const { data, error } = await supabase.auth.getSession();

    return {
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: {
              id: data.session.user.id,
              email: data.session.user.email || '',
            },
          }
        : null,
      error: error ? { message: error.message, status: error.status } : null,
    };
  },

  onAuthStateChange(callback: (session: AuthResponse['session']) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(
        session
          ? {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              user: {
                id: session.user.id,
                email: session.user.email || '',
              },
            }
          : null
      );
    });

    return data.subscription;
  },
};
