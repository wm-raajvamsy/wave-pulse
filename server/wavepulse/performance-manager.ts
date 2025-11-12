import fs from 'fs-extra';
import path from 'path';

interface PerformanceEvent {
  type: 'render' | 'lifecycle' | 'state' | 'prop';
  data: any;
  timestamp: number;
}

interface ComponentData {
  componentId: string;
  componentName: string;
  widgetName?: string;
  widgetType?: string;
  renderCount: number;
  renders: any[];
  lifecycleCalls: any[];
  stateUpdates: any[];
  propUpdates: any[];
  totalRenderTime: number;
  avgRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
}

interface PerformanceSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata: any;
  components: Map<string, ComponentData>;
  events: PerformanceEvent[];
  summary?: {
    totalComponents: number;
    totalRenders: number;
    avgRenderTime: number;
    mostRenderedComponent: string;
    slowestComponent: string;
    totalRenderTime: number;
  };
}

export class PerformanceDataManager {
  private sessions = new Map<string, PerformanceSession>();
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'performance');
    fs.ensureDirSync(this.dataDir);
  }

  startSession(sessionId: string, metadata: any): PerformanceSession {
    const session: PerformanceSession = {
      sessionId,
      startTime: Date.now(),
      metadata,
      components: new Map(),
      events: []
    };

    this.sessions.set(sessionId, session);
    console.log(`[PerformanceManager] Session started: ${sessionId}`);
    return session;
  }

  addEvents(sessionId: string, events: PerformanceEvent[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[PerformanceManager] Session not found: ${sessionId}`);
      return;
    }

    events.forEach(event => {
      session.events.push(event);
      this.processEvent(session, event);
    });

    console.log(`[PerformanceManager] Added ${events.length} events to session ${sessionId}`);
  }

  private processEvent(session: PerformanceSession, event: PerformanceEvent): void {
    const { componentId, componentName, widgetName, widgetType } = event.data;

    if (!componentId) return;

    if (!session.components.has(componentId)) {
      session.components.set(componentId, {
        componentId,
        componentName: componentName || 'Unknown',
        widgetName,
        widgetType,
        renderCount: 0,
        renders: [],
        lifecycleCalls: [],
        stateUpdates: [],
        propUpdates: [],
        totalRenderTime: 0,
        avgRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0
      });
    }

    const component = session.components.get(componentId)!;

    switch (event.type) {
      case 'render':
        component.renderCount++;
        component.renders.push(event.data);
        
        const duration = event.data.duration || 0;
        component.totalRenderTime += duration;
        component.avgRenderTime = component.totalRenderTime / component.renderCount;
        component.minRenderTime = Math.min(component.minRenderTime, duration);
        component.maxRenderTime = Math.max(component.maxRenderTime, duration);
        break;

      case 'lifecycle':
        component.lifecycleCalls.push(event.data);
        break;

      case 'state':
        component.stateUpdates.push(event.data);
        break;

      case 'prop':
        component.propUpdates.push(event.data);
        break;
    }
  }

  async stopSession(sessionId: string): Promise<PerformanceSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[PerformanceManager] Session not found: ${sessionId}`);
      return null;
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Calculate summary
    session.summary = this.calculateSummary(session);

    // Save to file
    await this.saveToFile(session);

    this.sessions.delete(sessionId);
    console.log(`[PerformanceManager] Session stopped and saved: ${sessionId}`);
    
    return session;
  }

  private calculateSummary(session: PerformanceSession) {
    const components = Array.from(session.components.values());

    if (components.length === 0) {
      return {
        totalComponents: 0,
        totalRenders: 0,
        avgRenderTime: 0,
        mostRenderedComponent: 'N/A',
        slowestComponent: 'N/A',
        totalRenderTime: 0
      };
    }

    let totalRenders = 0;
    let totalRenderTime = 0;
    let mostRenderedComponent = '';
    let slowestComponent = '';
    let maxRenders = 0;
    let maxAvgRenderTime = 0;

    components.forEach(comp => {
      totalRenders += comp.renderCount;
      totalRenderTime += comp.totalRenderTime;

      if (comp.renderCount > maxRenders) {
        maxRenders = comp.renderCount;
        mostRenderedComponent = comp.widgetName || comp.componentName;
      }

      if (comp.avgRenderTime > maxAvgRenderTime) {
        maxAvgRenderTime = comp.avgRenderTime;
        slowestComponent = comp.widgetName || comp.componentName;
      }
    });

    return {
      totalComponents: components.length,
      totalRenders,
      avgRenderTime: totalRenders > 0 ? totalRenderTime / totalRenders : 0,
      mostRenderedComponent,
      slowestComponent,
      totalRenderTime
    };
  }

  private async saveToFile(session: PerformanceSession): Promise<string> {
    const filename = `performance-${session.sessionId}.json`;
    const filepath = path.join(this.dataDir, filename);

    const data = {
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      metadata: session.metadata,
      summary: session.summary,
      components: Array.from(session.components.values()).map(comp => ({
        ...comp,
        // Convert Infinity to null for JSON serialization
        minRenderTime: comp.minRenderTime === Infinity ? 0 : comp.minRenderTime
      }))
    };

    await fs.writeJson(filepath, data, { spaces: 2 });
    console.log(`[PerformanceManager] Session saved to: ${filepath}`);
    return filepath;
  }

  async getSession(sessionId: string): Promise<any | null> {
    // Check in-memory first
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      return {
        ...session,
        components: Array.from(session.components.values())
      };
    }

    // Load from file
    const filename = `performance-${sessionId}.json`;
    const filepath = path.join(this.dataDir, filename);

    if (await fs.pathExists(filepath)) {
      return await fs.readJson(filepath);
    }

    return null;
  }

  async listSessions(): Promise<any[]> {
    const files = await fs.readdir(this.dataDir);
    const sessions: any[] = [];

    for (const file of files) {
      if (file.startsWith('performance-') && file.endsWith('.json')) {
        const filepath = path.join(this.dataDir, file);
        try {
          const data = await fs.readJson(filepath);
          sessions.push({
            sessionId: data.sessionId,
            startTime: data.startTime,
            endTime: data.endTime,
            duration: data.duration,
            summary: data.summary
          });
        } catch (error) {
          console.error(`[PerformanceManager] Error reading file ${file}:`, error);
        }
      }
    }

    // Sort by start time, newest first
    return sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const filename = `performance-${sessionId}.json`;
    const filepath = path.join(this.dataDir, filename);

    if (await fs.pathExists(filepath)) {
      await fs.remove(filepath);
      console.log(`[PerformanceManager] Session deleted: ${sessionId}`);
      return true;
    }

    return false;
  }
}

export const performanceManager = new PerformanceDataManager();

