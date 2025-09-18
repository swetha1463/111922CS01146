import axios, { AxiosResponse } from 'axios';

interface LogEntry {
  stack: 'frontend' | 'backend';
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  package: string;
  message: string;
}

class Logger {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string = 'http://20.244.56.144/evaluation-service') {
    this.baseUrl = baseUrl;
    this.authToken = '';
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async sendLog(logData: LogEntry): Promise<void> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/logs`,
        logData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          timeout: 5000
        }
      );
      
      if (response.status === 200) {
        console.log('Log sent successfully:', response.data);
      }
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  private validatePackage(stack: 'frontend' | 'backend', packageName: string): boolean {
    const frontendPackages = ['api', 'component', 'hook', 'page', 'state', 'style'];
    const backendPackages = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
    const universalPackages = ['auth', 'config', 'middleware', 'utils'];

    const validPackages = stack === 'frontend' ? [...frontendPackages, ...universalPackages] : [...backendPackages, ...universalPackages];
    return validPackages.includes(packageName);
  }

  async log(stack: 'frontend' | 'backend', level: LogEntry['level'], packageName: string, message: string): Promise<void> {
    if (!this.validatePackage(stack, packageName)) {
      console.error(`Invalid package name for ${stack}: ${packageName}`);
      return;
    }

    await this.sendLog({
      stack,
      level,
      package: packageName,
      message
    });
  }

  // Convenience methods for frontend
  async logComponent(level: LogEntry['level'], message: string): Promise<void> {
    await this.log('frontend', level, 'component', message);
  }

  async logPage(level: LogEntry['level'], message: string): Promise<void> {
    await this.log('frontend', level, 'page', message);
  }

  async logApi(level: LogEntry['level'], message: string): Promise<void> {
    await this.log('frontend', level, 'api', message);
  }

  async logHook(level: LogEntry['level'], message: string): Promise<void> {
    await this.log('frontend', level, 'hook', message);
  }

  async logState(level: LogEntry['level'], message: string): Promise<void> {
    await this.log('frontend', level, 'state', message);
  }

  async logStyle(level: LogEntry['level'], message: string): Promise<void> {
    await this.log('frontend', level, 'style', message);
  }
}

export { Logger };
export default new Logger();