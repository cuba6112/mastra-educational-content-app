'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { BookOpen, Sparkles, Users, Target, Loader2 } from 'lucide-react'
import { WorkflowProgress, type WorkflowResult } from '@/components/WorkflowProgress'
import { apiUrl } from '@/lib/api'
// import { ContentPreview } from '@/components/ContentPreview'

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    targetAudience: '',
    targetWordCount: 5000
  })

  const startWorkflowSequence = async () => {
    setIsGenerating(true)
    setErrorMessage(null)
    setWorkflowResult(null)
    setCurrentWorkflowId(null)

    try {
      const startWorkflow = async () => {
        const maxAttempts = 3
        let lastError: string | null = null

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const response = await fetch(
              apiUrl('/api/workflows/improvedEducationalContentWorkflow/start-async'),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  inputData: formData,
                  runtimeContext: {}
                })
              }
            )

            if (response.ok) {
              const data = await response.json()
              return { data }
            }

            // Retry on gateway/server warmup errors
            if ([502, 503, 504].includes(response.status)) {
              lastError = `Backend is still warming up (HTTP ${response.status}).`
              await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
              continue
            }

            const errorText = await response.text()
            throw new Error(errorText || `Failed with status ${response.status}`)
          } catch (error) {
            lastError = error instanceof Error ? error.message : String(error)
            if (attempt === maxAttempts) {
              break
            }
            await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
          }
        }

        return { error: lastError || 'Failed to start workflow' }
      }

      const startResult = await startWorkflow()
      if ('error' in startResult) {
        setErrorMessage(startResult.error)
        setShowProgress(false)
        return
      }

      const result = startResult.data

      console.log('Workflow started:', result)
      const workflowId = result.workflowId || result.id || `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setCurrentWorkflowId(workflowId)
      setShowProgress(true)
    } catch (error) {
      console.error('Error:', error)
      const friendlyMessage =
        error instanceof Error
          ? error.message
          : 'Unable to reach the backend service. Please try again.'
      setErrorMessage(friendlyMessage)
      setShowProgress(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await startWorkflowSequence()
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
                setShowProgress(false)
              }}
              onError={(error) => {
                console.error('Workflow failed:', error)
                setIsGenerating(false)
                setErrorMessage(error)
              }}
            />
          </div>
        )}

        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
              <p className="font-medium">Unable to start content generation</p>
              <p className="text-sm mt-1">
                {errorMessage.includes('warming up')
                  ? `${errorMessage} The workflow engine may still be starting—please retry in a few seconds.`
                  : errorMessage}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void startWorkflowSequence()
                  }}
                >
                  Try Again
                </Button>
                <span className="text-xs text-red-500 dark:text-red-300">
                  Ensure the backend at {process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001'} is running.
                </span>
              </div>
            </div>
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
                      setWorkflowResult(null)
                      setErrorMessage(null)
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
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Content Generated Successfully
                  </h3>
                  {workflowResult.wordCount && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Generated {workflowResult.wordCount.toLocaleString()} words of educational material.
                    </p>
                  )}
                  {workflowResult.completedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Completed at {new Date(workflowResult.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {workflowResult.pdfUrl && (
                    <a
                      href={workflowResult.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Download PDF
                    </a>
                  )}
                  {workflowResult.contentUrl && (
                    <a
                      href={workflowResult.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      View Content
                    </a>
                  )}
                </div>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Looking for your files? Generated PDFs are stored under <code>generated_books/</code> on the backend.
              </p>
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
