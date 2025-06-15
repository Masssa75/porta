export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          PortA
        </h1>
        <p className="text-xl text-gray-400 mb-8">Crypto Portfolio Monitor</p>
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="ml-2 text-green-400 font-semibold">Live</p>
          </div>
          <p className="text-lg">✨ Autonomous deployment successful!</p>
          <p className="mt-4 text-gray-400">
            This project was deployed completely automatically using API integrations.
          </p>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>✅ GitHub repository created</p>
            <p>✅ Supabase backend configured</p>
            <p>✅ Deployed to Vercel</p>
            <p>✅ Environment variables set</p>
          </div>
        </div>
      </div>
    </main>
  )
}