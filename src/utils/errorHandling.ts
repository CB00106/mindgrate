export interface ErrorInfo {
  message: string;
  code?: string;
  timestamp: Date;
}

export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB in bytes
  CHUNK_SIZE_MB: 2,
  WARNING_SIZE_MB: 5
};

export interface FileValidation {
  isValid: boolean;
  warning?: string;
  error?: string;
  size: number;
  sizeFormatted: string;
}

export interface ProcessingTimeEstimate {
  estimated: number; // in seconds
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface OptimizationSuggestion {
  type: 'compression' | 'chunking' | 'format' | 'filtering';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ProgressEstimator {
  getCurrentStep: () => number;
  getTotalSteps: () => number;
  getProgress: () => number;
  getTimeRemaining: (currentStep: number) => number;
}

export const createError = (message: string, code?: string): ErrorInfo => ({
  message,
  code,
  timestamp: new Date()
});

export const validateFileSize = (file: File): FileValidation => {
  const sizeInMB = file.size / (1024 * 1024);
  const sizeFormatted = `${sizeInMB.toFixed(2)} MB`;

  if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the maximum limit of ${FILE_LIMITS.MAX_SIZE_MB}MB`,
      size: file.size,
      sizeFormatted
    };
  }

  if (sizeInMB > FILE_LIMITS.WARNING_SIZE_MB) {
    return {
      isValid: true,
      warning: `Large file detected (${sizeFormatted}). Processing may take longer.`,
      size: file.size,
      sizeFormatted
    };
  }

  return {
    isValid: true,
    size: file.size,
    sizeFormatted
  };
};

export const estimateProcessingTime = (fileSizeBytes: number): ProcessingTimeEstimate => {
  const sizeInMB = fileSizeBytes / (1024 * 1024);
  
  // Base estimation: 1MB = ~2-5 seconds processing time
  let baseTime = sizeInMB * 3;
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  const factors: string[] = [];

  if (sizeInMB < 1) {
    baseTime = Math.max(1, baseTime);
    confidence = 'high';
    factors.push('Small file - fast processing');
  } else if (sizeInMB < 5) {
    confidence = 'high';
    factors.push('Medium file - normal processing');
  } else if (sizeInMB < 10) {
    baseTime *= 1.5;
    confidence = 'medium';
    factors.push('Large file - extended processing time');
  } else {
    baseTime *= 2;
    confidence = 'low';
    factors.push('Very large file - processing time may vary significantly');
  }

  return {
    estimated: Math.round(baseTime),
    confidence,
    factors
  };
};

export const getOptimizationSuggestions = (file: File): OptimizationSuggestion[] => {
  const suggestions: OptimizationSuggestion[] = [];
  const sizeInMB = file.size / (1024 * 1024);

  if (sizeInMB > FILE_LIMITS.WARNING_SIZE_MB) {
    suggestions.push({
      type: 'chunking',
      title: 'Split into smaller chunks',
      description: `Divide the file into chunks of ${FILE_LIMITS.CHUNK_SIZE_MB}MB or less for faster processing`,
      impact: 'high'
    });
  }

  if (file.type === 'text/csv' && sizeInMB > 2) {
    suggestions.push({
      type: 'filtering',
      title: 'Filter unnecessary columns',
      description: 'Remove columns that are not needed for your analysis to reduce file size',
      impact: 'medium'
    });
  }

  if (file.type.includes('image') && sizeInMB > 1) {
    suggestions.push({
      type: 'compression',
      title: 'Compress images',
      description: 'Reduce image quality or dimensions to decrease file size',
      impact: 'high'
    });
  }

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    suggestions.push({
      type: 'format',
      title: 'Convert to CSV',
      description: 'CSV files are generally smaller and process faster than Excel files',
      impact: 'medium'
    });
  }

  return suggestions;
};

export const createProgressEstimator = (totalSteps: number): ProgressEstimator => {
  let startTime = Date.now();
  
  return {
    getCurrentStep: () => 0, // This would be updated by the component
    getTotalSteps: () => totalSteps,
    getProgress: () => 0, // This would be calculated based on current step
    getTimeRemaining: (currentStep: number) => {
      if (currentStep === 0) return 0;
      
      const elapsed = (Date.now() - startTime) / 1000;
      const avgTimePerStep = elapsed / currentStep;
      const remainingSteps = totalSteps - currentStep;
      
      return Math.round(avgTimePerStep * remainingSteps);
    }
  };
};

export const handleFileError = (error: any): ErrorInfo => {
  if (error.message.includes('too large')) {
    return createError('El archivo es demasiado grande. Por favor, selecciona un archivo menor a 10MB.', 'FILE_TOO_LARGE');
  }
  
  if (error.message.includes('not supported')) {
    return createError('Tipo de archivo no soportado. Por favor, sube archivos CSV, TXT, JSON, PDF, DOCX o XLSX.', 'UNSUPPORTED_FILE_TYPE');
  }
  
  return createError('Error procesando el archivo. Por favor, inténtalo de nuevo.', 'FILE_PROCESSING_ERROR');
};

export default {
  createError,
  handleFileError,
  validateFileSize,
  estimateProcessingTime,
  getOptimizationSuggestions,
  createProgressEstimator,
  FILE_LIMITS
};