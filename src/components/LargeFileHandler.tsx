import React, { useState, useEffect } from 'react'
import { 
  validateFileSize, 
  estimateProcessingTime, 
  getOptimizationSuggestions,
  createProgressEstimator,
  FILE_LIMITS
} from '../utils/errorHandling'

interface LargeFileHandlerProps {
  file: File | null
  onProceed: () => void
  onCancel: () => void
  processing?: boolean
  progress?: {
    step: number
    totalSteps: number
    stepName: string
  }
}

export const LargeFileHandler: React.FC<LargeFileHandlerProps> = ({
  file,
  onProceed,
  onCancel,
  processing = false,
  progress
}) => {
  const [progressInfo, setProgressInfo] = useState<any>(null)
    useEffect(() => {
    if (file && progress) {
      const estimator = createProgressEstimator(progress.totalSteps)
      const progressPercent = estimator.getProgress()
      const timeRemaining = estimator.getTimeRemaining(progress.step)
      setProgressInfo({
        elapsed: Math.floor((Date.now() - Date.now()) / 1000), // This would be calculated based on start time
        eta: `${timeRemaining}s remaining`,
        percentage: progressPercent
      })
    }
  }, [file, progress])

  if (!file) return null

  const validation = validateFileSize(file)
  const timeEstimate = estimateProcessingTime(file.size)
  const suggestions = getOptimizationSuggestions(file)

  if (processing && progressInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
        <div className="flex items-center mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <h3 className="ml-3 text-lg font-medium text-blue-900">
            Processing Large File
          </h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>{progressInfo.stepName}</span>
              <span>{progressInfo.progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressInfo.progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-blue-600">
            <span>Elapsed: {progressInfo.elapsed}s</span>
            <span>{progressInfo.eta}</span>
          </div>
          
          <div className="text-sm text-blue-700">
            <strong>File:</strong> {file.name} ({validation.sizeFormatted})
          </div>
          
          <div className="text-xs text-blue-600">
            Large files may take several minutes to process. Please keep this tab open.
          </div>
        </div>
      </div>
    )
  }

  if (!validation.isValid) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-red-900">
              File Too Large
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{validation.error}</p>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-red-800 mb-2">How to fix this:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                <li>Split the file into parts smaller than {FILE_LIMITS.MAX_SIZE_MB}MB</li>
                <li>Remove unnecessary columns or data</li>
                <li>Save as a simpler format without complex formatting</li>
                <li>Contact support if you need to process larger files</li>
              </ul>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={onCancel}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Choose Different File
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (validation.warning) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-yellow-900">
              Large File Detected
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{validation.warning}</p>
            </div>
            
            <div className="mt-3 p-3 bg-yellow-100 rounded border">
              <h4 className="font-medium text-yellow-800 mb-2">Processing Information:</h4>
              <div className="space-y-1 text-sm text-yellow-700">                <div><strong>File Size:</strong> {validation.sizeFormatted}</div>
                <div><strong>Estimated Time:</strong> {timeEstimate.estimated} seconds</div>
                <div><strong>Status:</strong> This file is within limits but may take longer to process</div>
              </div>
            </div>
            
            {suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-yellow-800 mb-2">Optimization Tips:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">                  {suggestions.map((suggestion: any, index: number) => (
                    <li key={index}>
                      <strong>{suggestion.title}:</strong> {suggestion.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={onProceed}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
              >
                Proceed with Processing
              </button>
              <button
                onClick={onCancel}
                className="bg-white text-yellow-700 border border-yellow-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-50"
              >
                Choose Different File
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

interface FileUploadProgressProps {
  file: File
  currentStep: string
  progress: number
  estimatedTimeRemaining?: string
  onCancel: () => void
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  file,
  currentStep,
  progress,
  estimatedTimeRemaining,
  onCancel
}) => {
  const validation = validateFileSize(file)
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <h3 className="ml-2 text-lg font-medium text-blue-900">
            Processing File
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Cancel
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm text-blue-700">
          <strong>File:</strong> {file.name} ({validation.sizeFormatted})
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-blue-700 mb-1">
            <span>{currentStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {estimatedTimeRemaining && (
          <div className="text-xs text-blue-600">
            Estimated time remaining: {estimatedTimeRemaining}
          </div>
        )}
        
        <div className="text-xs text-blue-600">
          Please keep this tab open while processing. Large files may take several minutes.
        </div>
      </div>
    </div>
  )
}

export default LargeFileHandler
