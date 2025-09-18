export interface UrlRequest {
  url: string;
  customCode?: string;
  validityMinutes?: number;
}

export interface Click {
  id: string;
  timestamp: string;
  source: string;
  location: string;
}

export interface ShortenedUrl {
  id: string;
  shortUrl: string;
  originalUrl: string;
  shortCode: string;
  expiresAt: string;
  createdAt: string;
  clickCount: number;
  clicks: Click[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
