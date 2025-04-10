export interface HealthCheckResult {
  status: number;
  responseTime: number;
  timestamp: string;
}

export async function performHealthCheck(url: string): Promise<HealthCheckResult> {
  const response = await fetch('/api/health-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to check URL health');
  }

  return response.json();
}
