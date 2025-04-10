export interface UrlMonitor {
  _id: string;
  url: string;
  userId: string;
  logs: MonitorLog[];
}

export type MonitorLog = {
  timestamp: string;
  status: string;
  responseTime: number;
  interval: number;
}
