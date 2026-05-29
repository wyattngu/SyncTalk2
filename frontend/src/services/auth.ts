import browserClient, { apiPost } from "@/lib/api-client";
import { apiPaths } from "@/constants";
import type { AuthUser } from "@/lib/auth-store";

export type { AuthUser };

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: (email: string, password: string) =>
    apiPost<{ email: string; password: string }, LoginResult>(
      browserClient,
      apiPaths.LOGIN,
      { email, password }
    ),

  register: (username: string, email: string, password: string) =>
    apiPost<
      { username: string; email: string; password: string },
      AuthUser
    >(browserClient, apiPaths.REGISTER, { username, email, password }),
};
