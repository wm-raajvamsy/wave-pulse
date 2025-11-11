/**
 * Session Logger
 * 
 * Tracks execution state, validates evidence, detects issues, and generates
 * comprehensive logs for debugging and pattern learning.
 * 
 * Enterprise-grade session logging with:
 * - Step-by-step execution tracking
 * - Evidence collection and validation
 * - Issue detection and recommendations
 * - Quality assessment
 * - JSON and Markdown export
 */

import fs from 'fs/promises';
import path from 'path';

export interface Evidence {
  type: 'code' | 'runtime_data' | 'file_content';
  source: string; // file path or tool name
  content: string;
  verified: boolean;
}

export interface ExecutionStep {
  step: number;
  name: string;
  type: 'tool' | 'agent' | 'verification' | 'test';
  reasoning: string;
  duration: number;
  confidence: number;
  whatWeKnow: string[];
  whatWeMissing: string[];
  evidenceFound: Evidence[];
  evidenceMissing: string[];
  result?: string;
  error?: string;
}

export interface IssueDetection {
  issue: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  step?: number;
}

export interface SessionMetrics {
  totalSteps: number;
  totalDuration: number;
  toolsUsed: string[];
  agentsUsed: string[];
  loopsDetected: number;
  evidenceCollected: number;
  evidenceMissing: number;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  evidenceGaps: string[];
  claims: string[];
  claimsVerified: number;
  claimsUnverified: number;
}

export interface TestResult {
  testType: 'navigation' | 'data_binding' | 'function_call' | 'style_application';
  testCode: string;
  success: boolean;
  actualResult?: any;
  error?: string;
  duration: number;
}

export interface SessionLog {
  sessionId: string;
  userQuery: string;
  timestamp: Date;
  queryAnalysis?: any;
  executionSteps: ExecutionStep[];
  finalAnswer: string;
  overallConfidence: number;
  answerQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  issuesDetected: IssueDetection[];
  recommendations: string[];
  metrics: SessionMetrics;
  verificationResult?: VerificationResult;
  testResults?: TestResult[];
  patternMatch?: string;
}

export class SessionLogger {
  public log: SessionLog;
  private logDir: string;
  private sessionFilePath: string;
  private markdownFilePath: string;

  constructor(sessionId: string, userQuery: string, logDir?: string) {
    this.logDir = logDir || path.join(process.cwd(), 'logs', 'agent-sessions');
    
    this.log = {
      sessionId,
      userQuery,
      timestamp: new Date(),
      executionSteps: [],
      finalAnswer: '',
      overallConfidence: 0,
      answerQuality: 'LOW',
      issuesDetected: [],
      recommendations: [],
      metrics: {
        totalSteps: 0,
        totalDuration: 0,
        toolsUsed: [],
        agentsUsed: [],
        loopsDetected: 0,
        evidenceCollected: 0,
        evidenceMissing: 0,
      },
    };

    this.sessionFilePath = path.join(this.logDir, `${sessionId}.json`);
    this.markdownFilePath = path.join(this.logDir, `${sessionId}.md`);
  }

  /**
   * Initialize logger - create log directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      console.log(`[SessionLogger] Initialized log directory: ${this.logDir}`);
    } catch (error) {
      console.error('[SessionLogger] Failed to create log directory:', error);
      throw error;
    }
  }

  /**
   * Log query analysis
   */
  logQueryAnalysis(analysis: any): void {
    this.log.queryAnalysis = analysis;
    this.save();
  }

  /**
   * Log execution step
   */
  logStep(step: ExecutionStep): void {
    this.log.executionSteps.push(step);
    
    // Update metrics
    this.log.metrics.totalSteps = this.log.executionSteps.length;
    this.log.metrics.totalDuration += step.duration;
    
    // Track tools and agents used
    if (step.type === 'tool' && !this.log.metrics.toolsUsed.includes(step.name)) {
      this.log.metrics.toolsUsed.push(step.name);
    } else if (step.type === 'agent' && !this.log.metrics.agentsUsed.includes(step.name)) {
      this.log.metrics.agentsUsed.push(step.name);
    }
    
    // Track evidence
    this.log.metrics.evidenceCollected += step.evidenceFound.length;
    this.log.metrics.evidenceMissing += step.evidenceMissing.length;
    
    // Auto-detect issues
    if (step.confidence < 50) {
      this.detectIssue(`Very low confidence in step ${step.step}: ${step.confidence}%`, 'high', step.step);
    } else if (step.confidence < 70) {
      this.detectIssue(`Low confidence in step ${step.step}: ${step.confidence}%`, 'medium', step.step);
    }
    
    if (step.evidenceMissing.length > 3) {
      this.detectIssue(`Many missing evidence items in step ${step.step}: ${step.evidenceMissing.length} items`, 'medium', step.step);
    }
    
    if (step.error) {
      this.detectIssue(`Error in step ${step.step}: ${step.error}`, 'high', step.step);
    }
    
    this.save();
  }

  /**
   * Detect and log an issue
   */
  detectIssue(issue: string, severity: 'low' | 'medium' | 'high', step?: number): void {
    const existingIssue = this.log.issuesDetected.find(i => i.issue === issue);
    if (existingIssue) {
      return; // Don't log duplicate issues
    }
    
    this.log.issuesDetected.push({
      issue,
      severity,
      detectedAt: new Date(),
      step,
    });
    
    console.log(`[SessionLogger] Issue detected (${severity}): ${issue}`);
    
    // Auto-generate recommendations for common issues
    if (issue.includes('low confidence')) {
      this.addRecommendation('Gather more evidence before generating answer. Use additional tools to verify information.');
    }
    if (issue.includes('missing evidence')) {
      this.addRecommendation('Identify specific evidence gaps and use targeted tools to collect missing information.');
    }
    if (issue.includes('Loop detected')) {
      this.log.metrics.loopsDetected++;
      this.addRecommendation('Avoid repeating the same tool calls. Try a different approach or synthesize answer from existing data.');
    }
    
    this.save();
  }

  /**
   * Add a recommendation
   */
  addRecommendation(recommendation: string): void {
    if (!this.log.recommendations.includes(recommendation)) {
      this.log.recommendations.push(recommendation);
      this.save();
    }
  }

  /**
   * Log verification result
   */
  logVerification(verificationResult: VerificationResult): void {
    this.log.verificationResult = verificationResult;
    
    if (!verificationResult.verified) {
      this.detectIssue(
        `Answer verification failed with ${verificationResult.confidence}% confidence`,
        verificationResult.confidence < 50 ? 'high' : 'medium'
      );
      
      for (const gap of verificationResult.evidenceGaps) {
        this.detectIssue(`Evidence gap: ${gap}`, 'medium');
      }
    }
    
    this.save();
  }

  /**
   * Log test result
   */
  logTestResult(testResult: TestResult): void {
    if (!this.log.testResults) {
      this.log.testResults = [];
    }
    
    this.log.testResults.push(testResult);
    
    if (!testResult.success) {
      this.detectIssue(
        `Test failed for ${testResult.testType}: ${testResult.error || 'Unknown error'}`,
        'high'
      );
      this.addRecommendation(`Revise ${testResult.testType} solution based on test failure.`);
    }
    
    this.save();
  }

  /**
   * Log pattern match
   */
  logPatternMatch(patternId: string): void {
    this.log.patternMatch = patternId;
    this.save();
  }

  /**
   * Finalize session and assess quality
   */
  finalize(answer: string, confidence: number): void {
    this.log.finalAnswer = answer;
    this.log.overallConfidence = confidence;
    this.log.answerQuality = this.assessQuality();
    
    console.log(`[SessionLogger] Session finalized: ${this.log.answerQuality} quality, ${confidence}% confidence`);
    
    this.save();
    this.generateMarkdown();
  }

  /**
   * Assess answer quality based on confidence and issues
   */
  private assessQuality(): 'HIGH' | 'MEDIUM' | 'LOW' {
    const confidence = this.log.overallConfidence;
    const highSeverityIssues = this.log.issuesDetected.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = this.log.issuesDetected.filter(i => i.severity === 'medium').length;
    const totalIssues = this.log.issuesDetected.length;
    
    // Verification failed = automatic LOW
    if (this.log.verificationResult && !this.log.verificationResult.verified && this.log.verificationResult.confidence < 70) {
      return 'LOW';
    }
    
    // Tests failed = automatic LOW
    if (this.log.testResults && this.log.testResults.some(t => !t.success)) {
      return 'LOW';
    }
    
    // HIGH: High confidence, no high-severity issues, max 1 medium issue
    if (confidence >= 85 && highSeverityIssues === 0 && mediumSeverityIssues <= 1) {
      return 'HIGH';
    }
    
    // MEDIUM: Good confidence, few issues
    if (confidence >= 70 && highSeverityIssues === 0 && totalIssues <= 3) {
      return 'MEDIUM';
    }
    
    // LOW: Everything else
    return 'LOW';
  }

  /**
   * Save session log to JSON file
   */
  private async save(): Promise<void> {
    try {
      const jsonContent = JSON.stringify(this.log, null, 2);
      await fs.writeFile(this.sessionFilePath, jsonContent, 'utf8');
    } catch (error) {
      console.error('[SessionLogger] Failed to save session log:', error);
    }
  }

  /**
   * Generate markdown report
   */
  async generateMarkdown(): Promise<string> {
    const md = this.buildMarkdown();
    
    try {
      await fs.writeFile(this.markdownFilePath, md, 'utf8');
      console.log(`[SessionLogger] Markdown report generated: ${this.markdownFilePath}`);
    } catch (error) {
      console.error('[SessionLogger] Failed to generate markdown:', error);
    }
    
    return md;
  }

  /**
   * Build markdown content
   */
  private buildMarkdown(): string {
    const qualityEmoji = this.log.answerQuality === 'HIGH' ? '🟢' : this.log.answerQuality === 'MEDIUM' ? '🟡' : '🔴';
    
    let md = `# Agent Execution Log ${qualityEmoji}

**Session ID**: \`${this.log.sessionId}\`
**Query**: "${this.log.userQuery}"
**Timestamp**: ${this.log.timestamp.toISOString()}
**Quality**: **${this.log.answerQuality}** (${this.log.overallConfidence}% confidence)

---

## Query Analysis

\`\`\`json
${JSON.stringify(this.log.queryAnalysis, null, 2)}
\`\`\`

---

## Execution Steps

${this.log.executionSteps.map((step, idx) => {
  const statusEmoji = step.error ? '❌' : step.confidence >= 80 ? '✅' : step.confidence >= 60 ? '⚠️' : '🔴';
  
  return `### ${statusEmoji} Step ${step.step}: ${step.name} (${step.type})

**Reasoning**: ${step.reasoning}
**Duration**: ${step.duration.toFixed(2)}s
**Confidence**: ${step.confidence}%

**What We Know**:
${step.whatWeKnow.length > 0 ? step.whatWeKnow.map(k => `- ${k}`).join('\n') : '- (nothing yet)'}

**What's Missing**:
${step.whatWeMissing.length > 0 ? step.whatWeMissing.map(m => `- ${m}`).join('\n') : '- (nothing)'}

**Evidence Found**: ${step.evidenceFound.length} items
${step.evidenceFound.length > 0 ? step.evidenceFound.map(e => `- **${e.type}** from \`${e.source}\` ${e.verified ? '✓' : '✗'}`).join('\n') : ''}

**Evidence Missing**: ${step.evidenceMissing.length > 0 ? step.evidenceMissing.join(', ') : 'None'}

${step.error ? `**Error**: ${step.error}\n` : ''}
${step.result ? `**Result Preview**: ${step.result.substring(0, 200)}${step.result.length > 200 ? '...' : ''}\n` : ''}
`;
}).join('\n')}

---

## Final Answer

${this.log.finalAnswer}

---

${this.log.verificationResult ? `## Verification Result

**Verified**: ${this.log.verificationResult.verified ? '✅ Yes' : '❌ No'}
**Confidence**: ${this.log.verificationResult.confidence}%
**Claims**: ${this.log.verificationResult.claims.length} total
- ✅ Verified: ${this.log.verificationResult.claimsVerified}
- ❌ Unverified: ${this.log.verificationResult.claimsUnverified}

${this.log.verificationResult.evidenceGaps.length > 0 ? `**Evidence Gaps**:
${this.log.verificationResult.evidenceGaps.map(g => `- ${g}`).join('\n')}` : ''}

---

` : ''}

${this.log.testResults && this.log.testResults.length > 0 ? `## Test Results

${this.log.testResults.map((test, idx) => `### Test ${idx + 1}: ${test.testType}
**Status**: ${test.success ? '✅ PASSED' : '❌ FAILED'}
**Duration**: ${test.duration.toFixed(2)}s
${test.error ? `**Error**: ${test.error}\n` : ''}
${test.actualResult ? `**Result**: ${JSON.stringify(test.actualResult, null, 2)}\n` : ''}
`).join('\n')}

---

` : ''}

## Issues Detected (${this.log.issuesDetected.length})

${this.log.issuesDetected.length > 0 ? this.log.issuesDetected.map((issue, idx) => {
  const severityEmoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵';
  return `${idx + 1}. ${severityEmoji} **[${issue.severity.toUpperCase()}]** ${issue.issue}${issue.step ? ` (Step ${issue.step})` : ''}`;
}).join('\n') : '_No issues detected_'}

---

## Recommendations (${this.log.recommendations.length})

${this.log.recommendations.length > 0 ? this.log.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n') : '_No recommendations_'}

---

## Metrics

| Metric | Value |
|--------|-------|
| **Total Steps** | ${this.log.metrics.totalSteps} |
| **Total Duration** | ${this.log.metrics.totalDuration.toFixed(2)}s |
| **Tools Used** | ${this.log.metrics.toolsUsed.join(', ') || 'None'} |
| **Agents Used** | ${this.log.metrics.agentsUsed.join(', ') || 'None'} |
| **Evidence Collected** | ${this.log.metrics.evidenceCollected} |
| **Evidence Missing** | ${this.log.metrics.evidenceMissing} |
| **Loops Detected** | ${this.log.metrics.loopsDetected} |
| **Pattern Match** | ${this.log.patternMatch || 'None'} |

---

## Summary

- **Answer Quality**: **${this.log.answerQuality}**
- **Overall Confidence**: **${this.log.overallConfidence}%**
- **Issues**: ${this.log.issuesDetected.length} (${this.log.issuesDetected.filter(i => i.severity === 'high').length} high, ${this.log.issuesDetected.filter(i => i.severity === 'medium').length} medium, ${this.log.issuesDetected.filter(i => i.severity === 'low').length} low)
- **Evidence Quality**: ${this.log.metrics.evidenceCollected} collected, ${this.log.metrics.evidenceMissing} missing
${this.log.verificationResult ? `- **Verification**: ${this.log.verificationResult.verified ? 'PASSED' : 'FAILED'} (${this.log.verificationResult.confidence}%)` : ''}
${this.log.testResults ? `- **Tests**: ${this.log.testResults.filter(t => t.success).length}/${this.log.testResults.length} passed` : ''}
`;

    return md;
  }

  /**
   * Get session file paths
   */
  getFilePaths(): { json: string; markdown: string } {
    return {
      json: this.sessionFilePath,
      markdown: this.markdownFilePath,
    };
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.log.sessionId;
  }
}

