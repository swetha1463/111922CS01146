export interface UrlRequest {
  url: string;
  validityMinutes?: number;
  customCode?: string;
}

export interface ShortenedUrl {
  id: string;
  shortUrl: string;
  originalUrl: string;
  shortCode: string;
  expiresAt: string;
  createdAt: string;
  clickCount: number;
  clicks: ClickData[];
}

export interface ClickData {
  id: string;
  timestamp: string;
  source: string;
  location: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}