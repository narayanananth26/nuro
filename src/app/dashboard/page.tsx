import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UrlMonitorForm from '@/components/UrlMonitorForm';
import MonitorsTable from '@/components/MonitorsTable';
import './dashboard.css';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">        
        <div className="space-y-8">
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Add New Website to Monitor</h2>
            <UrlMonitorForm />
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[#333333] rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Your Monitored Websites</h2>
            <MonitorsTable />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
