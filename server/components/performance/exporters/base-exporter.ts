// ============================================================================
// BASE EXPORTER - Abstract interface for all export formats
// ============================================================================

export interface ExportOptions {
  filename?: string;
  includeRawData?: boolean;
  compressData?: boolean;
}

export interface Exporter {
  /**
   * Export session data in the specified format
   */
  export(session: any, options?: ExportOptions): void;
  
  /**
   * Get the file extension for this export format
   */
  getFileExtension(): string;
  
  /**
   * Get the MIME type for this export format
   */
  getMimeType(): string;
}

/**
 * Utility function to trigger file download in browser
 */
export function downloadFile(
  content: string | Blob, 
  filename: string, 
  mimeType: string
): void {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: mimeType });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  sessionId: string, 
  format: string, 
  customName?: string
): string {
  if (customName) {
    return customName;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const shortId = sessionId.substring(0, 20);
  return `performance-${shortId}-${timestamp}.${format}`;
}

