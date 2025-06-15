'use client'

import { useEffect, useState } from 'react'
import { supabase, type Project } from '@/lib/supabase'

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()

    // Set up real-time subscription
    const subscription = supabase
      .channel('projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched projects:', data)
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <p className="text-gray-400">Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <p className="text-gray-400">No projects added yet. Search and add some projects to monitor!</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your Projects</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {project.name} <span className="text-gray-400">({project.symbol})</span>
                </h3>
                <p className="text-sm text-gray-400">
                  Alert threshold: {project.alert_threshold}/10
                </p>
                {project.twitter_handle && (
                  <p className="text-sm text-gray-400">
                    Twitter: @{project.twitter_handle}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(project.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}