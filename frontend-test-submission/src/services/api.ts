import { UrlRequest, ShortenedUrl, ApiResponse } from '../types';
import logger from '../../../logging-middleware/src/logger';

// Mock backend since you're frontend-only
class MockBackend {
  private urls: Map<string, ShortenedUrl> = new Map();
  private urlCounter = 1;

  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async shortenUrls(requests: UrlRequest[]): Promise<ShortenedUrl[]> {
    await logger.logApi('info', `Processing ${requests.length} URL shortening requests`);
    
    const results: ShortenedUrl[] = [];
    
    for (const request of requests) {
      const shortCode = request.customCode || this.generateShortCode();
      const createdAt = new Date();
      const validityMinutes = request.validityMinutes || 30;
      const expiresAt = new Date(createdAt.getTime() + validityMinutes * 60000);
      
      const shortenedUrl: ShortenedUrl = {
        id: String(this.urlCounter++),
        shortUrl: `http://localhost:3000/${shortCode}`,
        originalUrl: request.url,
        shortCode,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        clickCount: 0,
        clicks: []
      };
      
      this.urls.set(shortCode, shortenedUrl);
      results.push(shortenedUrl);
    }
    
    await logger.logApi('info', `Successfully created ${results.length} shortened URLs`);
    return results;
  }

  async getAllUrls(): Promise<ShortenedUrl[]> {
    await logger.logApi('info', 'Fetching all URLs for statistics');
    return Array.from(this.urls.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async recordClick(shortCode: string): Promise<void> {
    const url = this.urls.get(shortCode);
    if (url) {
      url.clickCount++;
      url.clicks.push({
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        source: window.location.href,
        location: navigator.userAgent
      });
      await logger.logApi('info', `Recorded click for ${shortCode}`);
    }
  }
}

const mockBackend = new MockBackend();

export const apiService = {
  async shortenUrls(requests: UrlRequest[]): Promise<ApiResponse<ShortenedUrl[]>> {
    try {
      await logger.logApi('info', 'API call: shortenUrls');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await mockBackend.shortenUrls(requests);
      return { data };
    } catch (error: any) {
      await logger.logApi('error', `Failed to shorten URLs: ${error.message}`);
      return { error: error.message || 'Failed to shorten URLs' };
    }
  },

  async getAllUrls(): Promise<ApiResponse<ShortenedUrl[]>> {
    try {
      await logger.logApi('info', 'API call: getAllUrls');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const data = await mockBackend.getAllUrls();
      return { data };
    } catch (error: any) {
      await logger.logApi('error', `Failed to fetch URLs: ${error.message}`);
      return { error: error.message || 'Failed to fetch URLs' };
    }
  },

  async recordClick(shortCode: string): Promise<void> {
    try {
      await mockBackend.recordClick(shortCode);
    } catch (error: any) {
      await logger.logApi('error', `Failed to record click: ${error.message}`);
    }
  }
};