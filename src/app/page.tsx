import UrlHealthCheck from '@/components/UrlHealthCheck';

export default function Home() {
  return (
    <main className="container mx-auto px-4 pt-24 pb-8 min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-[#E3CF20] mb-4">Nuro URL Health Monitor</h1>
          <p className="text-xl text-gray-300">Monitor your website uptime and performance with ease</p>
        </div>
        
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-lg shadow-md p-8">
          <UrlHealthCheck />
        </div>
      </div>
    </main>
  );
}
