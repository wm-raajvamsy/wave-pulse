// ============================================================================
// JSON EXPORTER - Export session data as JSON
// ============================================================================

import { Exporter, ExportOptions, downloadFile, generateFilename } from './base-exporter';

export class JsonExporter implements Exporter {
  export(session: any, options?: ExportOptions): void {
    const filename = options?.filename || generateFilename(
      session.sessionId, 
      this.getFileExtension()
    );
    
    // Prepare data for export
    const exportData = this.prepareData(session, options);
    
    // Convert to formatted JSON
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    // Trigger download
    downloadFile(jsonContent, filename, this.getMimeType());
  }
  
  getFileExtension(): string {
    return 'json';
  }
  
  getMimeType(): string {
    return 'application/json';
  }
  
  /**
   * Prepare session data for JSON export
   */
  private prepareData(session: any, options?: ExportOptions): any {
    const data: any = {
      exportedAt: new Date().toISOString(),
      exportFormat: 'json',
      session: {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        summary: session.summary
      }
    };
    
    // Include component data
    if (session.components && session.components.length > 0) {
      data.components = session.components.map((comp: any) => ({
        componentId: comp.componentId,
        componentName: comp.componentName,
        widgetName: comp.widgetName,
        widgetType: comp.widgetType,
        renderCount: comp.renderCount,
        totalRenderTime: comp.totalRenderTime,
        avgRenderTime: comp.avgRenderTime,
        minRenderTime: comp.minRenderTime,
        maxRenderTime: comp.maxRenderTime,
        renderReasons: comp.renderReasons,
        lifecycleCallsCount: comp.lifecycleCalls?.length || 0,
        stateUpdatesCount: comp.stateUpdates?.length || 0,
        propUpdatesCount: comp.propUpdates?.length || 0,
        // Include raw data if requested
        ...(options?.includeRawData && {
          renders: comp.renders,
          lifecycleCalls: comp.lifecycleCalls,
          stateUpdates: comp.stateUpdates,
          propUpdates: comp.propUpdates
        })
      }));
    }
    
    // Include timeline data if available and raw data is requested
    if (options?.includeRawData && session.timeline) {
      data.timeline = {
        renderEvents: session.timeline.renderEvents,
        lifecycleEvents: session.timeline.lifecycleEvents,
        stateUpdateEvents: session.timeline.stateUpdateEvents
      };
    }
    
    return data;
  }
}

