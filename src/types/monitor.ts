export interface UrlMonitor {
  _id: string;
  url: string;
  userId: string;
  interval: number;
  logs: MonitorLog[];
}

export type MonitorLog = {
  timestamp: string;
  status: string;
  responseTime: number;
  interval: number;
}
