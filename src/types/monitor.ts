export interface UrlMonitor {
  _id: string;
  url: string;
  userId: string;
  interval: number;
  logs: MonitorLog[];
}

export type MonitorLog = {
  _id?: string;
  timestamp: string;
  status: string;
  responseTime: number;
  interval: number;
}
