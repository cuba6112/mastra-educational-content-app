'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { BookOpen, Sparkles, Users, Target, Loader2 } from 'lucide-react'
import { WorkflowProgress } from '@/components/WorkflowProgress'
// import { ContentPreview } from '@/components/ContentPreview'

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [workflowResult, setWorkflowResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    topic: '',
    targetAudience: '',
    targetWordCount: 5000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      // API call to backend
      const response = await fetch('http://localhost:5001/api/workflows/improvedEducationalContentWorkflow/start-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputData: formData,
          runtimeContext: {}
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Workflow started:', result)
        
        // Extract workflow ID from result or generate one
        const workflowId = result.workflowId || result.id || `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setCurrentWorkflowId(workflowId)
        setShowProgress(true)
      } else {
        console.error('Failed to start workflow')
        alert('Failed to start content generation. Please check if the backend is running.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error connecting to backend. Please ensure it is running on port 5001.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4">
              <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Educational Content Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create comprehensive, professional educational materials in minutes using advanced AI technology.
          </p>
        </div>

        {/* Progress Section */}
        {showProgress && currentWorkflowId && (
          <div className="max-w-4xl mx-auto mb-8">
            <WorkflowProgress
              workflowId={currentWorkflowId}
              onComplete={(result) => {
                console.log('Workflow completed:', result)
                setWorkflowResult(result)
                setIsGenerating(false)
                alert('Content generation completed successfully!')
              }}
              onError={(error) => {
                console.error('Workflow failed:', error)
                setIsGenerating(false)
                alert(`Content generation failed: ${error}`)
              }}
            />
          </div>
        )}

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <Sparkles className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Generate Content
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Fill in the details below to create your educational content
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Content Topic
                </label>
                <Input
                  placeholder="e.g., Advanced JavaScript Programming, Machine Learning Basics"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  required
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  Target Audience
                </label>
                <Input
                  placeholder="e.g., Intermediate developers, College students, Beginners"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  required
                />
              </div>

              {/* Word Count */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="h-4 w-4 mr-2" />
                  Target Word Count
                </label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.targetWordCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWordCount: parseInt(e.target.value) || 5000 }))}
                  min={1000}
                  max={100000}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recommended: 5,000-10,000 words for comprehensive guides
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1 h-12 text-lg"
                  disabled={isGenerating}
                >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Content
                  </>
                )}
                </Button>
                
                {showProgress && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-6"
                    onClick={() => {
                      setShowProgress(false)
                      setCurrentWorkflowId(null)
                      setIsGenerating(false)
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>

            {/* Info */}
            <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
              <p>Content generation typically takes 5-15 minutes depending on length</p>
            </div>
          </div>
        </div>

        {/* Content Preview Section */}
        {workflowResult && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                Content Generated Successfully!
              </h3>
              {workflowResult.wordCount && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Generated {workflowResult.wordCount.toLocaleString()} words of educational content.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Comprehensive Content</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Generate complete educational materials with structured chapters and examples.
            </p>
          </div>
          <div className="text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Content generation typically completes in 5-15 minutes.
            </p>
          </div>
          <div className="text-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Targeted Content</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Content adapts to your specified audience and difficulty level.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
