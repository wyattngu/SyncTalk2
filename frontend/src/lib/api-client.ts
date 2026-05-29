import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosInstance,
} from "axios"
import Cookies from 'js-cookie'
import { apiPaths } from '@/constants/api-paths'

export function createBrowserApiClient(
  getToken?: () => Promise<string | null>
): AxiosInstance {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://synctalk-backend-ky7f.onrender.com";

    const client = axios.create({
        baseURL,
        withCredentials: false,
    });

  client.interceptors.request.use(async (config) => {
    const token = Cookies.get('token')

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Only redirect to sign-in on 401 if it's NOT a login request.
      // This allows the login form to show the "Incorrect password" error message.
      const isLoginRequest = error.config?.url?.includes(apiPaths.LOGIN);
      
      if (error.response?.status === 401 && !isLoginRequest) {
        Cookies.remove('token')
        window.location.href = '/sign-in'
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export async function apiGet<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await client.get<{ data: T }>(url, config);

  return response.data.data;
}
export async function apiPost<TBody, TResponse>(
  client: AxiosInstance,
  url: string,
  body: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await client.post<{ data: TResponse }>(url, body, config);
  return res.data.data;
}

export async function apiPatch<TBody, TResponse>(
  client: AxiosInstance,
  url: string,
  body: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const res = await client.patch<{ data: TResponse }>(url, body, config);

  return res.data.data;
}

export async function apiDelete<TResponse>(
    client: AxiosInstance,
    url: string,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const res = await client.delete<{ data: TResponse }>(url, config)
    return res.data.data
}

const browserClient = createBrowserApiClient(() => Promise.resolve(null))
export default browserClient

export async function getAIChatHistory(): Promise<Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>> {
    try {
        const res = await browserClient.get<{ data: any[] }>('/api/ai/chatbot/history');
        return res.data.data;
    } catch (err) {
        console.error('[getAIChatHistory] error:', err);
        return [];
    }
}

export async function askAI(
    question: string,
    context?: Array<{ role: 'user' | 'assistant'; content: string }>,
    receiverId?: string
): Promise<{ answer: string; id?: string }> {
    try {
        const res = await browserClient.post<{ data: { answer: string; id?: string } }>(
            apiPaths.AI_CHAT,
            { question, context: context ?? [], receiver_id: receiverId ?? null }
        )
        return res.data.data
    } catch (err: any) {
        console.error('[askAI] error:', err);
        const status = err.response?.status;
        const serverError = err.response?.data?.message;

        if (!err.response) {
            return { answer: 'Connection error: Unable to reach the AI server. Please check your network.' };
        }

        if (status === 429) {
            return { answer: serverError || 'You have reached the AI usage limit. Please try again later.' };
        }

        return { answer: serverError || 'Sorry, the AI service is experiencing technical difficulties.' };
    }
}
