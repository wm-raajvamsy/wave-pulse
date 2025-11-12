const fs = require('fs');
const path = require('path');

// Directory to store performance session data
// Use process.cwd() which is the directory where the server was started
// This ensures Socket.io and Next.js use the same location
const PROJECT_ROOT = process.cwd();
const SESSIONS_DIR = path.join(PROJECT_ROOT, 'performance-sessions');
const ACTIVE_SESSIONS_DIR = path.join(SESSIONS_DIR, 'active');

console.log('[PerformanceManager] Using SESSIONS_DIR:', SESSIONS_DIR);

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  console.log('[PerformanceManager] Created sessions directory:', SESSIONS_DIR);
}

// Ensure active sessions directory exists
if (!fs.existsSync(ACTIVE_SESSIONS_DIR)) {
  fs.mkdirSync(ACTIVE_SESSIONS_DIR, { recursive: true });
  console.log('[PerformanceManager] Created active sessions directory:', ACTIVE_SESSIONS_DIR);
}

class PerformanceManager {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> session data
    this.sessionMetadata = new Map(); // sessionId -> metadata
    this.loadActiveSessions(); // Load any active sessions from disk
  }

  /**
   * Load active sessions from disk (in case of server restart)
   */
  loadActiveSessions() {
    try {
      if (!fs.existsSync(ACTIVE_SESSIONS_DIR)) return;
      
      const files = fs.readdirSync(ACTIVE_SESSIONS_DIR);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filepath = path.join(ACTIVE_SESSIONS_DIR, file);
            const content = fs.readFileSync(filepath, 'utf-8');
            const session = JSON.parse(content);
            this.activeSessions.set(session.sessionId, session);
            console.log(`[PerformanceManager] Loaded active session: ${session.sessionId} with ${session.events.length} events`);
          } catch (error) {
            console.error(`[PerformanceManager] Error loading active session ${file}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('[PerformanceManager] Error loading active sessions:', error);
    }
  }

  /**
   * Save active session to disk (to survive server restarts)
   */
  saveActiveSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      const filepath = path.join(ACTIVE_SESSIONS_DIR, `${sessionId}.json`);
      fs.writeFileSync(filepath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error(`[PerformanceManager] Error saving active session ${sessionId}:`, error);
    }
  }

  /**
   * Delete active session file
   */
  deleteActiveSession(sessionId) {
    try {
      const filepath = path.join(ACTIVE_SESSIONS_DIR, `${sessionId}.json`);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      console.error(`[PerformanceManager] Error deleting active session ${sessionId}:`, error);
    }
  }

  /**
   * Start a new performance recording session
   */
  startSession(sessionId, metadata = {}) {
    if (this.activeSessions.has(sessionId)) {
      console.warn(`[PerformanceManager] Session ${sessionId} already exists`);
      return this.activeSessions.get(sessionId);
    }

    const session = {
      sessionId,
      startTime: Date.now(),
      endTime: null,
      events: [],
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      }
    };

    this.activeSessions.set(sessionId, session);
    this.sessionMetadata.set(sessionId, session.metadata);
    
    // Save to disk immediately to survive server restarts
    this.saveActiveSession(sessionId);
    
    console.log(`[PerformanceManager] Started session: ${sessionId}`);
    return session;
  }

  /**
   * Add performance events to an active session
   */
  addEvents(sessionId, events) {
    if (!Array.isArray(events)) {
      console.error('[PerformanceManager] Events must be an array');
      return false;
    }

    // If session doesn't exist in memory, try to load from disk first
    if (!this.activeSessions.has(sessionId)) {
      try {
        const activeFilepath = path.join(ACTIVE_SESSIONS_DIR, `${sessionId}.json`);
        if (fs.existsSync(activeFilepath)) {
          const content = fs.readFileSync(activeFilepath, 'utf-8');
          const session = JSON.parse(content);
          this.activeSessions.set(sessionId, session);
          console.log(`[PerformanceManager] Loaded session ${sessionId} from disk with ${session.events.length} events`);
        } else {
          console.log(`[PerformanceManager] Auto-creating new session: ${sessionId}`);
          this.startSession(sessionId);
        }
      } catch (error) {
        console.error(`[PerformanceManager] Error loading session ${sessionId}, auto-creating:`, error);
        this.startSession(sessionId);
      }
    }

    const session = this.activeSessions.get(sessionId);
    session.events.push(...events);
    
    // Save to disk after adding events (to survive server restarts)
    this.saveActiveSession(sessionId);
    
    console.log(`[PerformanceManager] Added ${events.length} events to session ${sessionId} (total: ${session.events.length})`);
    return true;
  }

  /**
   * Stop a recording session and save to file
   */
  stopSession(sessionId) {
    // ALWAYS load from disk to get the latest state (in case Socket.io updated it)
    let session = null;
    
    try {
      const activeFilepath = path.join(ACTIVE_SESSIONS_DIR, `${sessionId}.json`);
      if (fs.existsSync(activeFilepath)) {
        const content = fs.readFileSync(activeFilepath, 'utf-8');
        session = JSON.parse(content);
        console.log(`[PerformanceManager] Loaded session ${sessionId} from disk with ${session.events.length} events`);
      } else {
        // Try memory as fallback
        session = this.activeSessions.get(sessionId);
        if (session) {
          console.log(`[PerformanceManager] Session ${sessionId} found in memory with ${session.events.length} events`);
        } else {
          console.warn(`[PerformanceManager] Session ${sessionId} not found in memory or on disk`);
          return null;
        }
      }
    } catch (error) {
      console.error(`[PerformanceManager] Error loading session ${sessionId} from disk:`, error);
      // Try memory as fallback
      session = this.activeSessions.get(sessionId);
      if (!session) return null;
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Calculate summary
    const summary = this._calculateSummary(session.events);
    session.summary = summary;

    // Create a clean copy of the session for saving
    const sessionToSave = {
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      metadata: session.metadata,
      summary: summary,
      events: session.events
    };

    // Save to completed sessions file
    const filename = `session_${sessionId}_${Date.now()}.json`;
    const filepath = path.join(SESSIONS_DIR, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(sessionToSave, null, 2));
      console.log(`[PerformanceManager] Saved session ${sessionId} with ${sessionToSave.events.length} events`);
      
      // Remove from active sessions (memory and disk)
      this.activeSessions.delete(sessionId);
      this.deleteActiveSession(sessionId);
      
      return {
        sessionId,
        filename,
        filepath,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        summary
      };
    } catch (error) {
      console.error(`[PerformanceManager] Error saving session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Calculate summary statistics from events
   */
  _calculateSummary(events) {
    let renderCount = 0;
    let lifecycleCount = 0;
    let stateUpdateCount = 0;
    let propUpdateCount = 0;
    const uniqueComponents = new Set();

    events.forEach(event => {
      // Extract data - it might be nested in event.data or directly on event
      const eventData = event.data || event;
      
      if (eventData.componentId) {
        uniqueComponents.add(eventData.componentId);
      }
      
      switch (event.type) {
        case 'render':
          renderCount++;
          break;
        case 'lifecycle':
          lifecycleCount++;
          break;
        case 'state':
        case 'state-update':
          stateUpdateCount++;
          break;
        case 'prop':
        case 'prop-update':
          propUpdateCount++;
          break;
      }
    });

    return {
      totalEvents: events.length,
      totalComponents: uniqueComponents.size,
      totalRenders: renderCount,
      totalLifecycleCalls: lifecycleCount,
      totalStateUpdates: stateUpdateCount,
      totalPropUpdates: propUpdateCount
    };
  }

  /**
   * Get all saved sessions
   */
  getAllSessions() {
    try {
      const files = fs.readdirSync(SESSIONS_DIR);
      const sessions = files
        .filter(file => file.startsWith('session_') && file.endsWith('.json'))
        .map(file => {
          const filepath = path.join(SESSIONS_DIR, file);
          try {
            const content = fs.readFileSync(filepath, 'utf-8');
            const session = JSON.parse(content);
            
            // Return summary
            return {
              sessionId: session.sessionId,
              filename: file,
              startTime: session.startTime,
              endTime: session.endTime,
              duration: session.duration,
              eventCount: session.events?.length || 0,
              summary: session.summary,
              metadata: session.metadata
            };
          } catch (error) {
            console.error(`[PerformanceManager] Error reading session file ${file}:`, error);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.startTime - a.startTime); // Sort by most recent first

      return sessions;
    } catch (error) {
      console.error('[PerformanceManager] Error listing sessions:', error);
      return [];
    }
  }

  /**
   * List all sessions (alias for getAllSessions)
   */
  listSessions() {
    return this.getAllSessions();
  }

  /**
   * Get a specific session by ID
   */
  getSession(sessionId, processed = false) {
    try {
      const files = fs.readdirSync(SESSIONS_DIR);
      const sessionFile = files.find(file => file.includes(`session_${sessionId}_`));
      
      if (!sessionFile) {
        // Check if it's an active session
        if (this.activeSessions.has(sessionId)) {
          return this.activeSessions.get(sessionId);
        }
        console.warn(`[PerformanceManager] Session ${sessionId} not found`);
        return null;
      }

      const filepath = path.join(SESSIONS_DIR, sessionFile);
      const content = fs.readFileSync(filepath, 'utf-8');
      const session = JSON.parse(content);
      
      if (processed) {
        return this.getProcessedSession(sessionId);
      }
      
      return session;
    } catch (error) {
      console.error(`[PerformanceManager] Error reading session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get processed/aggregated data for a session
   */
  getProcessedSession(sessionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Process events to calculate statistics
    const componentStats = new Map();
    const renderEvents = [];
    const lifecycleEvents = [];
    const stateUpdateEvents = [];

    session.events.forEach(event => {
      // Extract data - it might be nested in event.data or directly on event
      const eventData = event.data || event;
      const componentId = eventData.componentId;

      if (!componentId) return; // Skip events without componentId

      if (!componentStats.has(componentId)) {
        componentStats.set(componentId, {
          componentId,
          componentName: eventData.componentName,
          widgetName: eventData.widgetName,
          widgetType: eventData.widgetType,
          renderCount: 0,
          totalRenderTime: 0,        // Renamed for UI compatibility
          avgRenderTime: 0,           // Renamed for UI compatibility
          maxRenderTime: 0,           // Renamed for UI compatibility
          minRenderTime: Infinity,    // Renamed for UI compatibility
          lifecycleCalls: [],
          stateUpdates: [],
          propUpdates: [],
          renderReasons: {},
          renders: []
        });
      }

      const stats = componentStats.get(componentId);

      if (event.type === 'render') {
        stats.renderCount++;
        const duration = eventData.duration || 0;
        stats.totalRenderTime += duration;
        stats.maxRenderTime = Math.max(stats.maxRenderTime, duration);
        stats.minRenderTime = Math.min(stats.minRenderTime, duration);
        
        // Track render reasons
        const reason = eventData.reason || 'unknown';
        stats.renderReasons[reason] = (stats.renderReasons[reason] || 0) + 1;
        
        // Store render event for this component
        stats.renders.push(eventData);
        renderEvents.push(eventData);
      } else if (event.type === 'lifecycle') {
        // Store lifecycle event
        stats.lifecycleCalls.push(eventData);
        lifecycleEvents.push(eventData);
      } else if (event.type === 'state' || event.type === 'state-update') {
        // Store state update event
        stats.stateUpdates.push(eventData);
        stateUpdateEvents.push(eventData);
      } else if (event.type === 'prop' || event.type === 'prop-update') {
        // Store prop update event
        stats.propUpdates.push(eventData);
      }
    });

    // Calculate averages
    componentStats.forEach(stats => {
      if (stats.renderCount > 0) {
        stats.avgRenderTime = stats.totalRenderTime / stats.renderCount;
      }
      if (stats.minRenderTime === Infinity) {
        stats.minRenderTime = 0;
      }
    });

    // Convert to array and sort by total render time
    const components = Array.from(componentStats.values())
      .sort((a, b) => b.totalRenderTime - a.totalRenderTime);

    // Find most rendered and slowest component
    let mostRendered = null;
    let slowest = null;
    let totalRenderTime = 0;
    
    components.forEach(comp => {
      totalRenderTime += comp.totalRenderTime;
      if (!mostRendered || comp.renderCount > mostRendered.renderCount) {
        mostRendered = comp;
      }
      if (!slowest || comp.avgRenderTime > slowest.avgRenderTime) {
        slowest = comp;
      }
    });

    return {
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      metadata: session.metadata,
      summary: {
        totalEvents: session.events.length,
        totalComponents: components.length,
        totalRenders: renderEvents.length,
        totalLifecycleCalls: lifecycleEvents.length,
        totalStateUpdates: stateUpdateEvents.length,
        avgRenderTime: renderEvents.length > 0 ? totalRenderTime / renderEvents.length : 0,
        totalRenderTime,
        mostRenderedComponent: mostRendered ? 
          `${mostRendered.widgetName || mostRendered.componentName || mostRendered.componentId} (${mostRendered.renderCount} renders)` : 
          'N/A',
        slowestComponent: slowest ? 
          `${slowest.widgetName || slowest.componentName || slowest.componentId} (${slowest.avgRenderTime.toFixed(2)}ms avg)` : 
          'N/A'
      },
      components,
      timeline: {
        renderEvents: renderEvents.slice(0, 1000), // Limit to first 1000 for performance
        lifecycleEvents: lifecycleEvents.slice(0, 1000),
        stateUpdateEvents: stateUpdateEvents.slice(0, 1000)
      }
    };
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId) {
    try {
      const files = fs.readdirSync(SESSIONS_DIR);
      const sessionFile = files.find(file => file.includes(`session_${sessionId}_`));
      
      if (!sessionFile) {
        console.warn(`[PerformanceManager] Session ${sessionId} not found`);
        return false;
      }

      const filepath = path.join(SESSIONS_DIR, sessionFile);
      fs.unlinkSync(filepath);
      console.log(`[PerformanceManager] Deleted session ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`[PerformanceManager] Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Clear all sessions
   */
  clearAllSessions() {
    try {
      const files = fs.readdirSync(SESSIONS_DIR);
      let deletedCount = 0;
      
      files.forEach(file => {
        if (file.startsWith('session_') && file.endsWith('.json')) {
          const filepath = path.join(SESSIONS_DIR, file);
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      console.log(`[PerformanceManager] Cleared ${deletedCount} sessions`);
      return deletedCount;
    } catch (error) {
      console.error('[PerformanceManager] Error clearing sessions:', error);
      return 0;
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      sessionId: session.sessionId,
      startTime: session.startTime,
      eventCount: session.events.length,
      metadata: session.metadata
    }));
  }
}

// Singleton instance
const performanceManager = new PerformanceManager();

module.exports = { performanceManager, PerformanceManager };

