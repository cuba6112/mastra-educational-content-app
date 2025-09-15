'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle, Clock, Download, FileText, Search, Edit, BookOpen, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiUrl } from '@/lib/api'

export interface WorkflowStep {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  startTime?: string
  endTime?: string
  details?: string
  error?: string
  progress?: number
  substeps?: Array<{
    name: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    details?: string
  }>
}

export interface WorkflowResult {
  contentUrl?: string
  pdfUrl?: string
  wordCount?: number
  completedAt?: string
}

export interface WorkflowProgress {
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  steps: WorkflowStep[]
  progress: number
  currentStep?: string
  startTime: string
  endTime?: string
  result?: WorkflowResult
}

interface WorkflowProgressProps {
  workflowId: string
  onComplete?: (result: WorkflowResult) => void
  onError?: (error: string) => void
}

export function WorkflowProgress({ workflowId, onComplete, onError }: WorkflowProgressProps) {
  const [progress, setProgress] = useState<WorkflowProgress | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds <= 0 || Number.isNaN(totalSeconds)) return '0s'
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`)
    return parts.join(' ')
  }

  const activeStep = useMemo(() => {
    if (!progress) return null
    return (
      progress.steps.find((step) => step.status === 'in_progress') ||
      progress.steps.find((step) => step.status === 'pending') ||
      null
    )
  }, [progress])

  // Poll for progress updates
  useEffect(() => {
    if (!workflowId || !isPolling) return

    const pollProgress = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/workflows/${workflowId}/progress`)
        )
        
        if (response.ok) {
          const progressData: WorkflowProgress = await response.json()
          setProgress(progressData)
          
          // Stop polling if workflow is complete or failed
          if (progressData.status === 'completed' || progressData.status === 'failed') {
            setIsPolling(false)
            
            if (progressData.status === 'completed' && progressData.result) {
              onComplete?.(progressData.result)
            } else if (progressData.status === 'failed') {
              const failedStep = progressData.steps.find(step => step.status === 'failed')
              onError?.(failedStep?.error || 'Workflow failed')
            }
          }
        } else if (response.status === 404) {
          // Workflow not found yet, keep polling
          console.log('Workflow not found yet, continuing to poll...')
        } else {
          console.error('Error fetching progress:', response.status)
        }
      } catch (error) {
        console.error('Error polling progress:', error)
      }
    }

    // Initial fetch
    pollProgress()
    
    // Set up polling interval
    intervalRef.current = setInterval(pollProgress, 2000) // Poll every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [workflowId, isPolling, onComplete, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!progress) return

    const startTimeMs = new Date(progress.startTime).getTime()
    const endTimeMs = progress.endTime ? new Date(progress.endTime).getTime() : null

    const updateElapsed = () => {
      const now = endTimeMs ?? Date.now()
      const seconds = Math.max(0, Math.floor((now - startTimeMs) / 1000))
      setElapsedSeconds(seconds)
    }

    updateElapsed()

    if (progress.status === 'running') {
      const timer = setInterval(updateElapsed, 1000)
      return () => clearInterval(timer)
    }

    return undefined
  }, [progress])

  if (!progress) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing workflow...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStepIcon = (step: WorkflowStep) => {
    // Use specific icons based on step name
    const getStepTypeIcon = () => {
      const name = step.name.toLowerCase()
      if (name.includes('research') || name.includes('gathering')) return Search
      if (name.includes('outline') || name.includes('planning')) return FileText
      if (name.includes('writing') || name.includes('generating')) return Edit
      if (name.includes('review') || name.includes('refining')) return BookOpen
      if (name.includes('pdf') || name.includes('format')) return Zap
      return FileText
    }
    
    const IconComponent = getStepTypeIcon()
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <IconComponent className="h-4 w-4 animate-pulse text-blue-500" />
      default:
        return <IconComponent className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="text-blue-600">Running</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      case 'failed':
        return <Badge variant="outline" className="text-red-600">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Workflow Progress</CardTitle>
            <CardDescription>ID: {workflowId}</CardDescription>
          </div>
          {getStatusBadge(progress.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span>Overall Progress</span>
              {activeStep?.name && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {activeStep.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="font-semibold text-blue-600">{Math.round(progress.progress)}%</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Elapsed {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress.progress} className="w-full h-3 overflow-hidden" />
            <div className="grid grid-cols-4 gap-1 text-xs text-gray-500">
              <div className="text-center">Start</div>
              <div className="text-center">25%</div>
              <div className="text-center">75%</div>
              <div className="text-center">Complete</div>
            </div>
          </div>
        </div>

        {/* Current Step */}
        {progress.currentStep && progress.status === 'running' && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div className="absolute inset-0 h-5 w-5 rounded-full border-2 border-blue-200 animate-ping"></div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Currently Processing</span>
                  <p className="text-xs text-blue-600 dark:text-blue-300">This may take a few minutes...</p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Active
              </Badge>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{progress.currentStep}</p>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">Workflow Steps</h4>
            <div className="text-xs text-gray-500">
              {progress.steps.filter(s => s.status === 'completed').length} of {progress.steps.length} completed
            </div>
          </div>
          {activeStep && (
            <div className="text-xs text-blue-600 dark:text-blue-300">
              Currently processing: {activeStep.name}
            </div>
          )}
          
          <div className="space-y-3">
            {progress.steps.map((step, index) => {
              const isActive = step.status === 'in_progress'
              const isCompleted = step.status === 'completed'
              const isFailed = step.status === 'failed'
              
              return (
                <div 
                  key={step.id} 
                  className={`relative p-4 rounded-lg border transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-md' 
                      : isCompleted 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : isFailed 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Step number indicator */}
                  <div className="absolute -left-2 top-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white animate-pulse' :
                      isFailed ? 'bg-red-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 ml-4">
                    {getStepIcon(step)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-semibold ${isActive ? 'text-blue-800 dark:text-blue-200' : ''}`}>
                          {step.name}
                        </p>
                        <Badge 
                          variant={step.status === 'completed' ? 'default' : 
                                   step.status === 'failed' ? 'destructive' : 
                                   step.status === 'in_progress' ? 'outline' : 'secondary'}
                          className={`text-xs ${
                            step.status === 'in_progress' ? 'border-blue-500 text-blue-600 animate-pulse' : ''
                          }`}
                        >
                          {step.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {/* Step progress bar */}
                      {step.progress !== undefined && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Step Progress</span>
                            <span>{Math.round(step.progress)}%</span>
                          </div>
                          <Progress value={step.progress} className="h-2" />
                        </div>
                      )}
                      
                      {step.details && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 leading-relaxed">
                          {step.details}
                        </p>
                      )}
                      
                      {/* Substeps */}
                      {step.substeps && step.substeps.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Substeps:</p>
                          {step.substeps.map((substep, subIndex) => (
                            <div key={subIndex} className="flex items-center space-x-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${
                                substep.status === 'completed' ? 'bg-green-500' :
                                substep.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                                substep.status === 'failed' ? 'bg-red-500' :
                                'bg-gray-300'
                              }`}></div>
                              <span className="text-gray-600 dark:text-gray-400">{substep.name}</span>
                              {substep.details && (
                                <span className="text-gray-500 dark:text-gray-500">- {substep.details}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium">Error:</p>
                          <p className="text-xs text-red-600 dark:text-red-400">{step.error}</p>
                        </div>
                      )}
                      
                      {/* Timing info */}
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        {step.startTime && (
                          <span>Started: {new Date(step.startTime).toLocaleTimeString()}</span>
                        )}
                        {step.endTime && step.startTime && (
                          <span className="font-medium">
                            Duration: {Math.round((new Date(step.endTime).getTime() - new Date(step.startTime).getTime()) / 1000)}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Results Section */}
        {progress.status === 'completed' && progress.result && (
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
                  Content Generated Successfully!
                </h4>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Your educational content is ready for download
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {progress.result.wordCount && (
                <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Word Count:</span>
                  </div>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {progress.result.wordCount.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {progress.result.contentUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(progress.result!.contentUrl!, 'educational-content.md')}
                    className="flex items-center justify-center space-x-2 p-3 h-auto border-green-300 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Markdown Content</div>
                      <div className="text-xs text-gray-600">Raw text format (.md)</div>
                    </div>
                  </Button>
                )}
                
                {progress.result.pdfUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(progress.result!.pdfUrl!, 'educational-content.pdf')}
                    className="flex items-center justify-center space-x-2 p-3 h-auto border-green-300 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">PDF Document</div>
                      <div className="text-xs text-gray-600">Formatted document (.pdf)</div>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timing Information */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timing Information</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Started: {new Date(progress.startTime).toLocaleString()}</span>
            </div>
            {progress.endTime && (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Completed: {new Date(progress.endTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 sm:col-span-2">
                  <Zap className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">
                    Total Duration: {formatDuration(Math.floor((new Date(progress.endTime).getTime() - new Date(progress.startTime).getTime()) / 1000))}
                  </span>
                </div>
              </>
            )}
            {!progress.endTime && progress.status === 'running' && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span>Running for {formatDuration(elapsedSeconds)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
