export interface LocalRuntimeDefaults {
  webBaseUrl: string;
  apiBaseUrl: string;
  docsDevPort: number;
}

export interface RuntimeUrlOverrides {
  APP_URL?: string;
  API_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
  WEB_URL?: string;
  PLAYWRIGHT_BASE_URL?: string;
}

export interface HealthResponse {
  status: 'healthy';
  timestamp: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export interface GoogleOAuthCallbackQuery {
  code?: string;
  state?: string;
}

export interface RedirectResponse {
  location: string;
}
