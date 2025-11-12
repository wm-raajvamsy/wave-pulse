// ============================================================================
// EXPORTERS - Central export point for all export formats
// ============================================================================

export type { Exporter, ExportOptions } from './base-exporter';
export { JsonExporter } from './json-exporter';
export { HtmlExporter } from './html-exporter';

// Export format types
export type ExportFormat = 'json' | 'html' | 'csv' | 'pdf';

/**
 * Factory function to get the appropriate exporter
 */
export function getExporter(format: ExportFormat) {
  const { JsonExporter } = require('./json-exporter');
  const { HtmlExporter } = require('./html-exporter');
  
  switch (format) {
    case 'json':
      return new JsonExporter();
    case 'html':
      return new HtmlExporter();
    // Future formats can be added here
    case 'csv':
      throw new Error('CSV exporter not yet implemented');
    case 'pdf':
      throw new Error('PDF exporter not yet implemented');
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

/**
 * Convenience function to export session data
 */
export function exportSession(
  session: any, 
  format: ExportFormat, 
  options?: any
): void {
  const exporter = getExporter(format);
  exporter.export(session, options);
}

