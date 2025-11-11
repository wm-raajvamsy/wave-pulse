/**
 * Pattern Store
 * 
 * Learns from successful and failed query patterns to improve future responses.
 * Stores patterns in JSON files and provides matching functionality.
 * 
 * Features:
 * - Store successful patterns (high quality answers)
 * - Store failure patterns to avoid
 * - Match new queries to existing patterns
 * - Track pattern usage and success rates
 * - Update patterns based on outcomes
 */

import fs from 'fs/promises';
import path from 'path';
import { SessionLog } from './session-logger';

export interface QueryPattern {
  id: string;
  queryType: string; // 'navigation', 'data', 'style', 'error', 'code'
  intent: string; // 'how', 'what', 'where', 'why'
  keywords: string[];
  successfulSteps: string[]; // Names of tools/agents used
  toolSequence: string[]; // Specific order of tools
  averageConfidence: number;
  usageCount: number;
  successCount: number;
  failureCount: number;
  lastUsed: Date;
  created: Date;
  exampleQuery: string;
  evidenceTypes: string[]; // Types of evidence collected
}

export class PatternStore {
  private patternsDir: string;
  private successfulPatternsFile: string;
  private failedPatternsFile: string;
  
  private successfulPatterns: QueryPattern[] = [];
  private failedPatterns: QueryPattern[] = [];
  
  constructor(patternsDir?: string) {
    this.patternsDir = patternsDir || path.join(process.cwd(), 'logs', 'patterns');
    this.successfulPatternsFile = path.join(this.patternsDir, 'successful-patterns.json');
    this.failedPatternsFile = path.join(this.patternsDir, 'failed-patterns.json');
  }

  /**
   * Initialize pattern store
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.patternsDir, { recursive: true });
      
      // Load existing patterns
      await this.loadPatterns();
      
      console.log(`[PatternStore] Initialized with ${this.successfulPatterns.length} successful and ${this.failedPatterns.length} failed patterns`);
    } catch (error) {
      console.error('[PatternStore] Initialization error:', error);
    }
  }

  /**
   * Load patterns from disk
   */
  private async loadPatterns(): Promise<void> {
    try {
      const successfulData = await fs.readFile(this.successfulPatternsFile, 'utf8');
      this.successfulPatterns = JSON.parse(successfulData);
    } catch (error) {
      // File doesn't exist yet or is invalid
      this.successfulPatterns = [];
    }
    
    try {
      const failedData = await fs.readFile(this.failedPatternsFile, 'utf8');
      this.failedPatterns = JSON.parse(failedData);
    } catch (error) {
      // File doesn't exist yet or is invalid
      this.failedPatterns = [];
    }
  }

  /**
   * Save patterns to disk
   */
  private async savePatterns(): Promise<void> {
    try {
      await fs.writeFile(
        this.successfulPatternsFile,
        JSON.stringify(this.successfulPatterns, null, 2),
        'utf8'
      );
      
      await fs.writeFile(
        this.failedPatternsFile,
        JSON.stringify(this.failedPatterns, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('[PatternStore] Error saving patterns:', error);
    }
  }

  /**
   * Store a successful pattern from a session
   */
  async storeSuccessfulPattern(sessionLog: SessionLog): Promise<void> {
    console.log('[PatternStore] Storing successful pattern from session:', sessionLog.sessionId);
    
    const pattern = this.extractPattern(sessionLog);
    
    // Check if similar pattern already exists
    const existingPattern = this.findSimilarPattern(pattern, this.successfulPatterns);
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      existingPattern.successCount++;
      existingPattern.lastUsed = new Date();
      
      // Update average confidence
      existingPattern.averageConfidence = Math.round(
        (existingPattern.averageConfidence * (existingPattern.usageCount - 1) + sessionLog.overallConfidence) /
        existingPattern.usageCount
      );
      
      console.log(`[PatternStore] Updated existing pattern ${existingPattern.id}`);
    } else {
      // Add new pattern
      pattern.id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      pattern.created = new Date();
      pattern.lastUsed = new Date();
      pattern.usageCount = 1;
      pattern.successCount = 1;
      pattern.failureCount = 0;
      pattern.averageConfidence = sessionLog.overallConfidence;
      
      this.successfulPatterns.push(pattern);
      
      console.log(`[PatternStore] Stored new successful pattern ${pattern.id}`);
    }
    
    await this.savePatterns();
  }

  /**
   * Store a failure pattern from a session
   */
  async storeFailurePattern(sessionLog: SessionLog): Promise<void> {
    console.log('[PatternStore] Storing failure pattern from session:', sessionLog.sessionId);
    
    const pattern = this.extractPattern(sessionLog);
    
    // Check if similar pattern already exists
    const existingPattern = this.findSimilarPattern(pattern, this.failedPatterns);
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.usageCount++;
      existingPattern.failureCount++;
      existingPattern.lastUsed = new Date();
      
      console.log(`[PatternStore] Updated existing failure pattern ${existingPattern.id}`);
    } else {
      // Add new failure pattern
      pattern.id = `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      pattern.created = new Date();
      pattern.lastUsed = new Date();
      pattern.usageCount = 1;
      pattern.successCount = 0;
      pattern.failureCount = 1;
      pattern.averageConfidence = sessionLog.overallConfidence;
      
      this.failedPatterns.push(pattern);
      
      console.log(`[PatternStore] Stored new failure pattern ${pattern.id}`);
    }
    
    await this.savePatterns();
  }

  /**
   * Find a matching pattern for a new query
   */
  async findMatchingPattern(query: string, queryAnalysis?: any): Promise<QueryPattern | null> {
    console.log('[PatternStore] Finding matching pattern for query:', query.substring(0, 50));
    
    const queryKeywords = this.extractKeywords(query);
    const queryType = this.determineQueryType(query, queryAnalysis);
    const intent = queryAnalysis?.intent || this.determineIntent(query);
    
    // Find best matching successful pattern
    let bestMatch: QueryPattern | null = null;
    let bestScore = 0;
    
    for (const pattern of this.successfulPatterns) {
      const score = this.calculateMatchScore(
        { queryType, intent, keywords: queryKeywords },
        pattern
      );
      
      if (score > bestScore && score >= 0.6) { // Require at least 60% match
        bestScore = score;
        bestMatch = pattern;
      }
    }
    
    // Check if this pattern is in failed patterns (avoid it)
    if (bestMatch) {
      const failureMatch = this.findSimilarPattern(bestMatch, this.failedPatterns);
      if (failureMatch && failureMatch.failureCount > failureMatch.successCount) {
        console.log('[PatternStore] Pattern found in failures, skipping');
        return null;
      }
    }
    
    if (bestMatch) {
      console.log(`[PatternStore] Found matching pattern ${bestMatch.id} with score ${bestScore.toFixed(2)}`);
    } else {
      console.log('[PatternStore] No matching pattern found');
    }
    
    return bestMatch;
  }

  /**
   * Update pattern success/failure
   */
  async updatePatternSuccess(patternId: string, success: boolean): Promise<void> {
    const pattern = this.successfulPatterns.find(p => p.id === patternId);
    
    if (pattern) {
      pattern.usageCount++;
      if (success) {
        pattern.successCount++;
      } else {
        pattern.failureCount++;
      }
      pattern.lastUsed = new Date();
      
      await this.savePatterns();
      
      console.log(`[PatternStore] Updated pattern ${patternId}: success=${success}`);
    }
  }

  /**
   * Extract pattern from session log
   */
  private extractPattern(sessionLog: SessionLog): QueryPattern {
    const keywords = this.extractKeywords(sessionLog.userQuery);
    const queryType = this.determineQueryType(sessionLog.userQuery, sessionLog.queryAnalysis);
    const intent = sessionLog.queryAnalysis?.intent || this.determineIntent(sessionLog.userQuery);
    
    const successfulSteps = sessionLog.executionSteps
      .filter(step => !step.error)
      .map(step => step.name);
    
    const toolSequence = sessionLog.executionSteps
      .filter(step => step.type === 'tool')
      .map(step => step.name);
    
    const evidenceTypes = [
      ...new Set(
        sessionLog.executionSteps.flatMap(step =>
          step.evidenceFound.map(e => e.type)
        )
      )
    ];
    
    return {
      id: '',
      queryType,
      intent,
      keywords,
      successfulSteps,
      toolSequence,
      averageConfidence: sessionLog.overallConfidence,
      usageCount: 0,
      successCount: 0,
      failureCount: 0,
      lastUsed: new Date(),
      created: new Date(),
      exampleQuery: sessionLog.userQuery,
      evidenceTypes,
    };
  }

  /**
   * Find similar pattern in a list
   */
  private findSimilarPattern(pattern: QueryPattern, patterns: QueryPattern[]): QueryPattern | null {
    for (const existing of patterns) {
      const score = this.calculateMatchScore(pattern, existing);
      if (score >= 0.8) { // 80% similarity
        return existing;
      }
    }
    return null;
  }

  /**
   * Calculate match score between two patterns
   */
  private calculateMatchScore(
    query: { queryType: string; intent: string; keywords: string[] },
    pattern: QueryPattern
  ): number {
    let score = 0;
    
    // Query type match (30%)
    if (query.queryType === pattern.queryType) {
      score += 0.3;
    }
    
    // Intent match (20%)
    if (query.intent === pattern.intent) {
      score += 0.2;
    }
    
    // Keyword overlap (50%)
    const keywordOverlap = this.calculateKeywordOverlap(query.keywords, pattern.keywords);
    score += keywordOverlap * 0.5;
    
    return score;
  }

  /**
   * Calculate keyword overlap between two sets
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }
    
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    
    let overlap = 0;
    for (const keyword of set1) {
      if (set2.has(keyword)) {
        overlap++;
      }
    }
    
    return overlap / Math.max(set1.size, set2.size);
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'can', 'to', 'in', 'on', 'at', 'for', 'with',
      'how', 'what', 'where', 'when', 'why', 'which', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    
    const words = query.toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 2 && !stopWords.has(w));
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Determine query type
   */
  private determineQueryType(query: string, queryAnalysis?: any): string {
    if (queryAnalysis?.domain) {
      const domain = Array.isArray(queryAnalysis.domain)
        ? queryAnalysis.domain[0]
        : queryAnalysis.domain;
      
      if (domain === 'fragment' || /navigate|page|route/.test(query)) return 'navigation';
      if (domain === 'variable' || /data|variable|value/.test(query)) return 'data';
      if (domain === 'style' || /style|color|appearance/.test(query)) return 'style';
      if (/error|issue|problem|bug/.test(query)) return 'error';
    }
    
    const queryLower = query.toLowerCase();
    if (/navigate|go to|open|route/.test(queryLower)) return 'navigation';
    if (/how many|count|list|show|display|data/.test(queryLower)) return 'data';
    if (/style|color|size|font|appearance/.test(queryLower)) return 'style';
    if (/error|issue|problem|bug|fix/.test(queryLower)) return 'error';
    if (/function|method|handler|code/.test(queryLower)) return 'code';
    
    return 'general';
  }

  /**
   * Determine query intent
   */
  private determineIntent(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (/how|what.*do|how.*work/.test(queryLower)) return 'how';
    if (/what is|what are|define/.test(queryLower)) return 'what';
    if (/where|which file|location/.test(queryLower)) return 'where';
    if (/why|reason|purpose/.test(queryLower)) return 'why';
    
    return 'general';
  }

  /**
   * Get all successful patterns
   */
  getSuccessfulPatterns(): QueryPattern[] {
    return [...this.successfulPatterns];
  }

  /**
   * Get all failed patterns
   */
  getFailedPatterns(): QueryPattern[] {
    return [...this.failedPatterns];
  }
}

