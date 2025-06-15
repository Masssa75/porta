import ProjectSearch from '@/components/ProjectSearch'
import ProjectList from '@/components/ProjectList'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            PortA
          </h1>
          <p className="text-xl text-gray-400">Crypto Portfolio Monitor</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ProjectSearch />
          </div>
          <div>
            <ProjectList />
          </div>
        </div>
      </div>
    </main>
  )
}