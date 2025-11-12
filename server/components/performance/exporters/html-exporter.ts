// ============================================================================
// HTML EXPORTER - Export session data as interactive HTML
// ============================================================================

import { Exporter, ExportOptions, downloadFile, generateFilename } from './base-exporter';

export class HtmlExporter implements Exporter {
  export(session: any, options?: ExportOptions): void {
    const filename = options?.filename || generateFilename(
      session.sessionId, 
      this.getFileExtension()
    );
    
    // Generate complete HTML document
    const htmlContent = this.generateHTML(session);
    
    // Trigger download
    downloadFile(htmlContent, filename, this.getMimeType());
  }
  
  getFileExtension(): string {
    return 'html';
  }
  
  getMimeType(): string {
    return 'text/html';
  }
  
  /**
   * Generate complete HTML document
   */
  private generateHTML(session: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Report - ${session.sessionId}</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  ${this.getStyles()}
</head>
<body>
  <div class="container">
    ${this.generateHeader(session)}
    ${this.generateTabs(session)}
  </div>
  
  <!-- Component Details Modal -->
  <div id="component-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title"></h3>
        <button onclick="closeModal()" class="close-btn">×</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
    </div>
  </div>
  
  ${this.getScripts(session)}
</body>
</html>`;
  }
  
  /**
   * Generate CSS styles (embedded Tailwind-like styles)
   */
  private getStyles(): string {
    return `<style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    /* Header */
    .header {
      padding: 20px;
      border-bottom: 2px solid #e5e7eb;
      background: #f9fafb;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .header .session-id {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }
    
    .header .timestamp {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }
    
    /* Tabs */
    .tabs {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      padding: 0 20px;
      background: white;
    }
    
    .tab {
      padding: 12px 24px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      transition: all 0.2s;
    }
    
    .tab:hover {
      color: #111827;
      background: #f9fafb;
    }
    
    .tab.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }
    
    .tab-content {
      display: none;
      padding: 20px;
    }
    
    .tab-content.active {
      display: block;
    }
    
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
    }
    
    /* Section */
    .section {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #374151;
    }
    
    .section.insights {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    
    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    th {
      text-align: left;
      padding: 8px 12px;
      background: #f9fafb;
      font-weight: 600;
      font-size: 11px;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    /* Colors */
    .text-green { color: #16a34a; }
    .text-orange { color: #ea580c; }
    .text-red { color: #dc2626; }
    .text-gray { color: #6b7280; }
    
    .font-mono {
      font-family: monospace;
    }
    
    .font-semibold {
      font-weight: 600;
    }
    
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      font-size: 13px;
    }
    
    .info-item {
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    
    .info-label {
      color: #6b7280;
      margin-bottom: 4px;
      font-size: 11px;
    }
    
    .info-value {
      font-weight: 700;
      color: #111827;
    }
    
    /* Insights */
    .insights-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 13px;
    }
    
    .insight-item {
      display: flex;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1px solid #bfdbfe;
    }
    
    .insight-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .insight-label {
      font-weight: 600;
      color: #1e40af;
    }
    
    .insight-value {
      color: #374151;
    }
    
    /* Modal */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 20px 25px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
    }
    
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }
    
    .modal-header h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    .close-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }
    
    .modal-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
    }
    
    .stat-row:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      font-weight: 500;
      color: #6b7280;
      flex: 1;
    }
    
    .stat-value {
      color: #374151;
      font-weight: 600;
      text-align: right;
      font-size: 13px;
    }
    
    .modal-stats {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .modal-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f3f4f6;
    }
    
    .modal-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .modal-section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    /* Accordion */
    .accordion {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      margin-bottom: 6px;
      overflow: hidden;
      background: white;
    }
    
    .accordion-header {
      padding: 10px 12px;
      background: #f9fafb;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      user-select: none;
      transition: background 0.15s;
      border-bottom: 1px solid transparent;
    }
    
    .accordion-header:hover {
      background: #f3f4f6;
    }
    
    .accordion-header.active {
      background: #eff6ff;
      border-bottom-color: #e5e7eb;
    }
    
    .accordion-icon {
      font-size: 10px;
      transition: transform 0.2s;
      color: #9ca3af;
    }
    
    .accordion-icon.open {
      transform: rotate(90deg);
    }
    
    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background: white;
    }
    
    .accordion-content.open {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .accordion-body {
      padding: 8px 12px;
      font-size: 11px;
    }
    
    .render-item {
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
      margin-bottom: 6px;
      background: #fafafa;
    }
    
    .render-item:last-child {
      margin-bottom: 0;
    }
    
    .render-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .render-reason {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: lowercase;
    }
    
    .render-reason.mount {
      background: #dcfce7;
      color: #16a34a;
    }
    
    .render-reason.state {
      background: #dbeafe;
      color: #2563eb;
    }
    
    .render-reason.props {
      background: #fed7aa;
      color: #ea580c;
    }
    
    .render-reason.parent {
      background: #e9d5ff;
      color: #9333ea;
    }
    
    .render-detail {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 2px;
    }
    
    .render-props {
      margin-top: 6px;
      padding: 6px 8px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
      font-size: 10px;
    }
    
    .render-props-title {
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 2px;
      font-size: 10px;
    }
    
    /* Clickable rows */
    .clickable-row {
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .clickable-row:hover {
      background: #f9fafb;
    }
    
    /* Flame Graph Container */
    #flame-graph-container {
      width: 100%;
      height: 600px;
      position: relative;
      overflow: visible;
    }
    
    #flame-graph-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    
    .flame-tooltip {
      position: absolute;
      background: white;
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      border-radius: 6px;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-size: 12px;
      line-height: 1.5;
      display: none;
    }
    
    .flame-tooltip.active {
      display: block;
    }
    
    /* Timeline Waterfall */
    .timeline-bar-container {
      position: relative;
      height: 24px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    
    .timeline-bar {
      position: absolute;
      height: 16px;
      top: 3px;
      border-radius: 2px;
      border: 2px solid;
      min-width: 2px;
    }
    
    .timeline-bar.fast {
      background: #dcfce7;
      border-color: #16a34a;
    }
    
    .timeline-bar.moderate {
      background: #fed7aa;
      border-color: #ea580c;
    }
    
    .timeline-bar.slow {
      background: #fecaca;
      border-color: #dc2626;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
      
      .tabs {
        display: none;
      }
      
      .tab-content {
        display: block !important;
        page-break-after: always;
      }
      
      .modal {
        display: none !important;
      }
    }
  </style>`;
  }
  
  /**
   * Generate header section
   */
  private generateHeader(session: any): string {
    const startDate = new Date(session.startTime).toLocaleString();
    const exportDate = new Date().toLocaleString();
    
    return `
    <div class="header">
      <h1>⚡ Performance Report</h1>
      <div class="session-id">Session ID: ${session.sessionId}</div>
      <div class="timestamp">Session Started: ${startDate} | Exported: ${exportDate}</div>
    </div>`;
  }
  
  /**
   * Generate tabs structure
   */
  private generateTabs(session: any): string {
    return `
    <div class="tabs">
      <div class="tab active" onclick="switchTab('overview')">Overview</div>
      <div class="tab" onclick="switchTab('components')">Components</div>
      <div class="tab" onclick="switchTab('timeline')">Timeline</div>
      <div class="tab" onclick="switchTab('flame')">Flame Graph</div>
    </div>
    
    <div id="overview" class="tab-content active">
      ${this.generateOverviewTab(session)}
    </div>
    
    <div id="components" class="tab-content">
      ${this.generateComponentsTab(session)}
    </div>
    
    <div id="timeline" class="tab-content">
      ${this.generateTimelineTab(session)}
    </div>
    
    <div id="flame" class="tab-content">
      ${this.generateFlameGraphTab(session)}
    </div>`;
  }
  
  /**
   * Generate Overview tab content
   */
  private generateOverviewTab(session: any): string {
    const summary = session.summary || {};
    
    return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Components</div>
        <div class="stat-value">${summary.totalComponents || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Renders</div>
        <div class="stat-value">${summary.totalRenders || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Render Time</div>
        <div class="stat-value">${(summary.totalRenderTime || 0).toFixed(2)}ms</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Session Duration</div>
        <div class="stat-value">${session.duration ? (session.duration / 1000).toFixed(2) + 's' : 'N/A'}</div>
      </div>
    </div>
    
    <div class="section insights">
      <div class="section-title">🎯 Performance Insights</div>
      <div class="insights-list">
        <div class="insight-item">
          <span class="insight-label">Most Rendered:</span>
          <span class="insight-value">${summary.mostRenderedComponent || 'N/A'}</span>
        </div>
        <div class="insight-item">
          <span class="insight-label">Slowest Component:</span>
          <span class="insight-value">${summary.slowestComponent || 'N/A'}</span>
        </div>
        <div class="insight-item">
          <span class="insight-label">Avg Render Time:</span>
          <span class="insight-value">${(summary.avgRenderTime || 0).toFixed(2)}ms</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📊 Timeline Statistics</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Total Events</div>
          <div class="info-value">${summary.totalRenders || 0}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Avg Render Time</div>
          <div class="info-value">${(summary.avgRenderTime || 0).toFixed(2)}ms</div>
        </div>
        <div class="info-item">
          <div class="info-label">State Updates</div>
          <div class="info-value">${summary.totalStateUpdates || 0}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Prop Updates</div>
          <div class="info-value">${summary.totalPropUpdates || 0}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Lifecycle Calls</div>
          <div class="info-value">${summary.totalLifecycleCalls || 0}</div>
        </div>
      </div>
    </div>`;
  }
  
  /**
   * Generate Components tab content
   */
  private generateComponentsTab(session: any): string {
    const components = (session.components || [])
      .sort((a: any, b: any) => b.renderCount - a.renderCount);
    
    if (components.length === 0) {
      return '<div class="section">No component data available</div>';
    }
    
    const rows = components.map((comp: any, idx: number) => {
      const timeColor = this.getTimeColor(comp.avgRenderTime || 0);
      const compData = JSON.stringify(comp).replace(/"/g, '&quot;');
      return `
      <tr class="clickable-row" onclick='showComponentDetails(${compData})'>
        <td>
          <div class="font-semibold">${comp.widgetName || comp.componentName || comp.componentId}</div>
          ${comp.widgetType ? `<div class="text-gray" style="font-size: 11px;">${comp.widgetType}</div>` : ''}
        </td>
        <td>${comp.renderCount}</td>
        <td class="${timeColor}">${(comp.totalRenderTime || 0).toFixed(2)}ms</td>
        <td>${(comp.avgRenderTime || 0).toFixed(2)}ms</td>
        <td>${(comp.minRenderTime || 0).toFixed(2)}ms</td>
        <td>${(comp.maxRenderTime || 0).toFixed(2)}ms</td>
        <td>${comp.stateUpdates?.length || 0}</td>
        <td>${comp.propUpdates?.length || 0}</td>
      </tr>`;
    }).join('');
    
    return `
    <div class="section">
      <div class="section-title">📦 All Components (${components.length})</div>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Renders</th>
            <th>Total Time</th>
            <th>Avg Time</th>
            <th>Min Time</th>
            <th>Max Time</th>
            <th>State</th>
            <th>Props</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
  }
  
  /**
   * Generate Timeline tab content
   */
  private generateTimelineTab(session: any): string {
    const components = session.components || [];
    
    // Flatten all renders into a timeline
    const timelineEvents: any[] = [];
    components.forEach((comp: any) => {
      if (comp.renders && comp.renders.length > 0) {
        comp.renders.forEach((render: any, idx: number) => {
          timelineEvents.push({
            componentName: comp.widgetName || comp.componentName || comp.componentId,
            widgetType: comp.widgetType,
            renderIndex: idx + 1,
            timestamp: render.timestamp,
            duration: render.duration,
            reason: render.reason || 'unknown'
          });
        });
      }
    });
    
    // Sort by timestamp
    timelineEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    if (timelineEvents.length === 0) {
      return '<div class="section">No timeline data available</div>';
    }
    
    // Take first 100 events for HTML export
    const displayEvents = timelineEvents.slice(0, 100);
    
    // Calculate time range
    const minTime = Math.min(...displayEvents.map(e => e.timestamp - session.startTime));
    const maxTime = Math.max(...displayEvents.map(e => (e.timestamp - session.startTime) + e.duration));
    const timeRange = maxTime - minTime;
    
    const rows = displayEvents.map((event: any) => {
      const timeColor = this.getTimeColor(event.duration);
      const relativeTime = event.timestamp - session.startTime;
      
      // Calculate bar position and width
      const barLeft = ((relativeTime - minTime) / timeRange) * 100;
      const barWidth = Math.max((event.duration / timeRange) * 100, 0.5);
      const barClass = event.duration < 16 ? 'fast' : event.duration < 50 ? 'moderate' : 'slow';
      
      return `
      <tr>
        <td>
          <div class="font-semibold">${event.componentName}</div>
          ${event.widgetType ? `<div class="text-gray" style="font-size: 11px;">${event.widgetType}</div>` : ''}
        </td>
        <td>${event.renderIndex}</td>
        <td><span class="font-mono">${event.reason}</span></td>
        <td>${relativeTime.toFixed(1)}ms</td>
        <td class="${timeColor} font-semibold">${event.duration.toFixed(2)}ms</td>
        <td style="min-width: 300px;">
          <div class="timeline-bar-container">
            <div class="timeline-bar ${barClass}" style="left: ${barLeft}%; width: ${barWidth}%;" 
                 title="${event.componentName}: ${event.duration.toFixed(2)}ms at ${relativeTime.toFixed(1)}ms"></div>
          </div>
        </td>
      </tr>`;
    }).join('');
    
    return `
    <div class="section">
      <div class="section-title">⏱️ Render Timeline (First 100 events of ${timelineEvents.length})</div>
      <p style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">
        Timeline range: ${minTime.toFixed(1)}ms - ${maxTime.toFixed(1)}ms
      </p>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Render #</th>
            <th>Reason</th>
            <th>Start Time</th>
            <th>Duration</th>
            <th style="min-width: 300px;">Timeline</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
  }
  
  /**
   * Generate Flame Graph tab content
   */
  private generateFlameGraphTab(session: any): string {
    return `
    <div class="section">
      <div class="section-title">🔥 Flame Graph</div>
      <p style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">
        Size & Color: Total render time (larger/redder = slower) | Hover for details
      </p>
      <div id="flame-graph-container">
        <svg id="flame-graph-svg"></svg>
      </div>
      <div id="flame-tooltip" class="flame-tooltip"></div>
    </div>`;
  }
  
  /**
   * Get color class based on render time
   */
  private getTimeColor(time: number): string {
    if (time < 16) return 'text-green';
    if (time < 50) return 'text-orange';
    return 'text-red';
  }
  
  /**
   * Generate JavaScript for interactivity
   */
  private getScripts(session: any): string {
    return `
  <script>
    // Store session data
    const sessionData = ${JSON.stringify(session, null, 2)};
    
    // Tab switching
    function switchTab(tabName) {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Show selected tab
      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');
      
      // Render flame graph when tab is activated
      if (tabName === 'flame' && !window.flameGraphRendered) {
        renderFlameGraph();
        window.flameGraphRendered = true;
      }
    }
    
    // Modal functions
    function showComponentDetails(component) {
      const modal = document.getElementById('component-modal');
      const title = document.getElementById('modal-title');
      const body = document.getElementById('modal-body');
      
      const componentName = component.widgetName || component.componentName || component.componentId || 'Unknown';
      title.textContent = componentName;
      
      // Generate modal content
      const renderCount = component.renderCount || 0;
      const totalTime = (component.totalRenderTime || 0).toFixed(2);
      const avgTime = (component.avgRenderTime || 0).toFixed(2);
      const minTime = (component.minRenderTime || 0).toFixed(2);
      const maxTime = (component.maxRenderTime || 0).toFixed(2);
      const stateUpdates = component.stateUpdates?.length || 0;
      const propUpdates = component.propUpdates?.length || 0;
      const lifecycleCalls = component.lifecycleCalls?.length || 0;
      const renders = component.renders || [];
      
      let html = \`
        <div class="modal-stats">
          <div class="stat-row">
            <span class="stat-label">Total Renders</span>
            <span class="stat-value">\${renderCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Total Render Time</span>
            <span class="stat-value">\${totalTime}ms</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Min</span>
            <span class="stat-value">\${minTime}ms</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Max</span>
            <span class="stat-value">\${maxTime}ms</span>
          </div>
          <div class="stat-row" style="border-bottom: none;">
            <span class="stat-label">Avg</span>
            <span class="stat-value">\${avgTime}ms</span>
          </div>
        </div>
      \`;
      
      // Add Renders Accordion
      html += \`
        <div class="accordion">
          <div class="accordion-header" onclick="toggleAccordion(event, 'renders-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}')">
            <span>Renders (\${renders.length})</span>
            <span class="accordion-icon">▶</span>
          </div>
          <div id="renders-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}" class="accordion-content">
            <div class="accordion-body">
      \`;
      
      if (renders.length > 0) {
        renders.forEach((render, idx) => {
          const reason = render.reason || 'unknown';
          const duration = (render.duration || 0).toFixed(2);
          const timestamp = new Date(render.timestamp).toLocaleTimeString();
          const durationNum = parseFloat(duration);
          const colorClass = durationNum < 16 ? 'text-green' : durationNum < 50 ? 'text-orange' : 'text-red';
          const reasonClass = reason.includes('mount') ? 'mount' : 
                              reason.includes('state') ? 'state' : 
                              reason.includes('prop') ? 'props' : 
                              reason.includes('parent') ? 'parent' : 'mount';
          
          html += \`
            <div class="render-item">
              <div class="render-header">
                <span class="render-reason \${reasonClass}">\${reason}</span>
                <span class="\${colorClass}" style="font-weight: 600; font-size: 11px;">\${duration}ms</span>
              </div>
              <div class="render-detail">\${timestamp}</div>
          \`;
          
          // Add changed props if available
          if (render.changedProps && render.changedProps.length > 0) {
            html += \`
              <div class="render-props">
                <div class="render-props-title">Props:</div>
                <div style="color: #6b7280; font-size: 10px;">\${render.changedProps.join(', ')}</div>
              </div>
            \`;
          }
          
          // Add changed state if available
          if (render.changedState && render.changedState.length > 0) {
            html += \`
              <div class="render-props">
                <div class="render-props-title">State:</div>
                <div style="color: #6b7280; font-size: 10px;">\${render.changedState.join(', ')}</div>
              </div>
            \`;
          }
          
          html += \`</div>\`;
        });
      } else {
        html += \`<div style="color: #9ca3af; font-size: 11px; padding: 8px;">No render data</div>\`;
      }
      
      html += \`
              </div>
            </div>
          </div>
        </div>
      \`;
      
      // Add Lifecycle Calls Accordion
      html += \`
        <div class="accordion">
          <div class="accordion-header" onclick="toggleAccordion(event, 'lifecycle-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}')">
            <span>Lifecycle Calls (\${lifecycleCalls})</span>
            <span class="accordion-icon">▶</span>
          </div>
          <div id="lifecycle-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}" class="accordion-content">
            <div class="accordion-body">
      \`;
      
      if (component.lifecycleCalls && component.lifecycleCalls.length > 0) {
        component.lifecycleCalls.forEach(call => {
          const method = call.method || call.lifecycle || 'unknown';
          // Lifecycle calls might not have duration, show timestamp instead
          const timestamp = new Date(call.timestamp).toLocaleTimeString();
          
          html += \`
            <div class="render-item">
              <div class="render-header">
                <span style="font-weight: 600; color: #374151; font-size: 11px;">\${method}</span>
              </div>
              <div class="render-detail">\${timestamp}</div>
            </div>
          \`;
        });
      } else {
        html += \`<div style="color: #9ca3af; font-size: 11px; padding: 8px;">No lifecycle calls</div>\`;
      }
      
      html += \`
              </div>
            </div>
          </div>
        </div>
      \`;
      
      // Add State Updates Accordion
      html += \`
        <div class="accordion">
          <div class="accordion-header" onclick="toggleAccordion(event, 'state-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}')">
            <span>State Updates (\${stateUpdates})</span>
            <span class="accordion-icon">▶</span>
          </div>
          <div id="state-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}" class="accordion-content">
            <div class="accordion-body">
      \`;
      
      if (component.stateUpdates && component.stateUpdates.length > 0) {
        component.stateUpdates.forEach(update => {
          const timestamp = new Date(update.timestamp).toLocaleTimeString();
          const keys = update.stateKeys?.join(', ') || update.keys?.join(', ') || 'N/A';
          
          html += \`
            <div class="render-item">
              <div class="render-detail">\${timestamp}</div>
              <div class="render-props">
                <div class="render-props-title">Keys:</div>
                <div style="color: #6b7280; font-size: 10px;">\${keys}</div>
              </div>
            </div>
          \`;
        });
      } else {
        html += \`<div style="color: #9ca3af; font-size: 11px; padding: 8px;">No state updates</div>\`;
      }
      
      html += \`
              </div>
            </div>
          </div>
        </div>
      \`;
      
      // Add Prop Updates Accordion
      html += \`
        <div class="accordion">
          <div class="accordion-header" onclick="toggleAccordion(event, 'props-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}')">
            <span>Prop Updates (\${propUpdates})</span>
            <span class="accordion-icon">▶</span>
          </div>
          <div id="props-\${componentName.replace(/[^a-zA-Z0-9]/g, '')}" class="accordion-content">
            <div class="accordion-body">
      \`;
      
      if (component.propUpdates && component.propUpdates.length > 0) {
        component.propUpdates.forEach(update => {
          const timestamp = new Date(update.timestamp).toLocaleTimeString();
          const props = update.changedProps?.join(', ') || update.props?.join(', ') || 'N/A';
          
          html += \`
            <div class="render-item">
              <div class="render-detail">\${timestamp}</div>
              <div class="render-props">
                <div class="render-props-title">Props:</div>
                <div style="color: #6b7280; font-size: 10px;">\${props}</div>
              </div>
            </div>
          \`;
        });
      } else {
        html += \`<div style="color: #9ca3af; font-size: 11px; padding: 8px;">No prop updates</div>\`;
      }
      
      html += \`
              </div>
            </div>
          </div>
        </div>
      \`;
      
      body.innerHTML = html;
      modal.classList.add('active');
    }
    
    function closeModal() {
      const modal = document.getElementById('component-modal');
      modal.classList.remove('active');
    }
    
    // Accordion toggle function
    function toggleAccordion(event, contentId) {
      event.stopPropagation();
      const header = event.currentTarget;
      const content = document.getElementById(contentId);
      const icon = header.querySelector('.accordion-icon');
      
      // Toggle this accordion
      const isOpen = content.classList.contains('open');
      
      if (isOpen) {
        content.classList.remove('open');
        icon.classList.remove('open');
        header.classList.remove('active');
      } else {
        content.classList.add('open');
        icon.classList.add('open');
        header.classList.add('active');
      }
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
      const modal = document.getElementById('component-modal');
      if (event.target === modal) {
        closeModal();
      }
    });
    
    // Flame Graph using D3
    function renderFlameGraph() {
      if (typeof d3 === 'undefined') {
        console.error('D3.js not loaded');
        return;
      }
      
      const components = sessionData.components || [];
      if (components.length === 0) {
        document.getElementById('flame-graph-container').innerHTML = 
          '<div style="text-align: center; padding: 40px; color: #6b7280;">No component data available</div>';
        return;
      }
      
      // Prepare data for treemap
      const data = {
        name: 'Root',
        children: components
          .filter(c => c.renderCount > 0)
          .map(c => ({
            name: c.widgetName || c.componentName || c.componentId || 'Unknown',
            value: c.totalRenderTime || 0,
            renderCount: c.renderCount || 0,
            avgTime: c.avgRenderTime || 0,
            widgetType: c.widgetType || 'N/A'
          }))
          .sort((a, b) => b.value - a.value)
      };
      
      const width = 900;
      const height = 600;
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      
      const svg = d3.select('#flame-graph-svg')
        .attr('width', width)
        .attr('height', height);
      
      const g = svg.append('g')
        .attr('transform', \`translate(\${margin.left},\${margin.top})\`);
      
      // Create hierarchy
      const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0));
      
      // Create treemap
      d3.treemap()
        .size([chartWidth, chartHeight])
        .padding(1)
        .round(true)
        (root);
      
      // Color scale
      const maxValue = d3.max(data.children, d => d.value) || 1;
      const colorScale = d3.scaleSequential()
        .domain([0, maxValue])
        .interpolator(d3.interpolateRgbBasis(['#bbf7d0', '#86efac', '#fde68a', '#fdba74', '#fca5a5', '#f87171']));
      
      // Tooltip
      const tooltip = d3.select('#flame-tooltip');
      
      // Create cells
      const cell = g.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => \`translate(\${d.x0},\${d.y0})\`);
      
      // Add rectangles
      cell.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => d.data.renderCount ? colorScale(d.data.value) : '#f3f4f6')
        .attr('stroke', d => {
          const ratio = d.data.value / maxValue;
          if (ratio < 0.33) return '#16a34a';
          if (ratio < 0.67) return '#ea580c';
          return '#dc2626';
        })
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('stroke', '#000')
            .attr('stroke-width', 3);
          
          tooltip.classed('active', true)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px')
            .html(\`
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">\${d.data.name}</div>
              \${d.data.widgetType !== 'N/A' ? \`<div style="color: #9ca3af; font-size: 10px; margin-bottom: 4px;">\${d.data.widgetType}</div>\` : ''}
              <div style="color: #6b7280;">Total Time: <strong>\${d.data.value.toFixed(2)}ms</strong></div>
              <div style="color: #6b7280;">Avg Time: <strong>\${d.data.avgTime.toFixed(2)}ms</strong></div>
              <div style="color: #6b7280;">Renders: <strong>\${d.data.renderCount}×</strong></div>
            \`);
        })
        .on('mouseout', function(event, d) {
          const ratio = d.data.value / maxValue;
          let strokeColor = '#16a34a';
          if (ratio >= 0.33 && ratio < 0.67) strokeColor = '#ea580c';
          else if (ratio >= 0.67) strokeColor = '#dc2626';
          
          d3.select(this)
            .attr('stroke', strokeColor)
            .attr('stroke-width', 2);
          
          tooltip.classed('active', false);
        });
      
      // Add clip paths for text
      cell.append('clipPath')
        .attr('id', (d, i) => \`clip-\${i}\`)
        .append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0 - 4))
        .attr('height', d => Math.max(0, d.y1 - d.y0 - 4))
        .attr('x', 2)
        .attr('y', 2);
      
      // Add text labels (only if space permits)
      cell.append('text')
        .attr('x', 4)
        .attr('y', 16)
        .attr('fill', '#1f2937')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('clip-path', (d, i) => \`url(#clip-\${i})\`)
        .style('pointer-events', 'none')
        .text(d => {
          const width = d.x1 - d.x0;
          if (width < 60) return '';
          const maxChars = Math.floor(width / 7);
          const name = d.data.name;
          return name.length > maxChars ? name.slice(0, maxChars - 3) + '...' : name;
        });
      
      // Add metrics (if space permits)
      cell.append('text')
        .attr('x', 4)
        .attr('y', 30)
        .attr('fill', '#6b7280')
        .attr('font-size', '10px')
        .attr('clip-path', (d, i) => \`url(#clip-\${i})\`)
        .style('pointer-events', 'none')
        .text(d => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          return (width >= 60 && height >= 40) ? \`\${d.data.renderCount}× | \${d.data.value.toFixed(1)}ms\` : '';
        });
    }
    
    // Initialize
    console.log('Performance Report Loaded:', sessionData);
    
    // Render flame graph if on that tab
    if (window.location.hash === '#flame') {
      setTimeout(renderFlameGraph, 100);
      window.flameGraphRendered = true;
    }
  </script>`;
  }
}

