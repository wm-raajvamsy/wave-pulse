/**
 * Response Validator
 * Validates responses for accuracy and completeness
 */

import { readFile } from 'fs/promises';
import { AgentResponse, ValidationResult, ValidationIssue } from './types';

export class ResponseValidator {
  /**
   * Validates agent response
   */
  async validate(response: AgentResponse, query: string): Promise<ValidationResult> {
    const validations: ValidationIssue[] = [];
    
    // Validate source citations
    validations.push(...await this.validateSources(response.sources));
    
    // Validate code snippets
    validations.push(...await this.validateCodeSnippets(response.response));
    
    // Validate completeness
    validations.push(...await this.validateCompleteness(response, query));
    
    // Validate consistency
    validations.push(...await this.validateConsistency(response));
    
    return {
      valid: validations.filter(v => v.severity === 'error').length === 0,
      issues: validations,
      confidence: this.calculateConfidence(validations)
    };
  }
  
  /**
   * Validates source file citations
   */
  private async validateSources(sources: any[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    for (const source of sources) {
      // Check if file exists
      try {
        await readFile(source.path, 'utf-8');
      } catch (error) {
        issues.push({
          type: 'source',
          severity: 'error',
          message: `Source file not found: ${source.path}`,
          source
        });
        continue;
      }
      
      // Verify line numbers are valid
      if (source.lineStart) {
        try {
          const content = await readFile(source.path, 'utf-8');
          const fileLines = content.split('\n').length;
          
          if (source.lineStart > fileLines || (source.lineEnd && source.lineEnd > fileLines)) {
            issues.push({
              type: 'source',
              severity: 'warning',
              message: `Line numbers out of range for ${source.path}`,
              source
            });
          }
        } catch (error) {
          // Skip if file can't be read
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Validates code snippets in response
   */
  private async validateCodeSnippets(response: string | any): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const responseText = typeof response === 'string' ? response : JSON.stringify(response);
    const codeBlocks = this.extractCodeBlocks(responseText);
    
    for (const block of codeBlocks) {
      // Basic syntax check (check for common issues)
      if (block.code.includes('undefined') && !block.code.includes('//')) {
        // This is a heuristic - could be improved
        issues.push({
          type: 'code',
          severity: 'warning',
          message: `Potential undefined reference in code snippet`,
          code: block.code.substring(0, 100)
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validates response completeness
   */
  private async validateCompleteness(
    response: AgentResponse,
    query: string
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const queryKeywords = this.extractKeywords(query);
    
    const responseText = typeof response.response === 'string'
      ? response.response
      : JSON.stringify(response.response);
    
    const missingKeywords = queryKeywords.filter(
      keyword => !responseText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (missingKeywords.length > 0) {
      issues.push({
        type: 'completeness',
        severity: 'warning',
        message: `Response may not address: ${missingKeywords.join(', ')}`,
        missingKeywords
      });
    }
    
    // Check if response has sufficient detail
    if (responseText.length < 100) {
      issues.push({
        type: 'completeness',
        severity: 'warning',
        message: 'Response may be too brief',
        responseLength: responseText.length
      });
    }
    
    return issues;
  }
  
  /**
   * Validates consistency
   */
  private async validateConsistency(response: AgentResponse): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    // Check if sources match response content
    const responseText = typeof response.response === 'string'
      ? response.response
      : JSON.stringify(response.response);
    
    // Basic consistency check
    if (response.sources && response.sources.length === 0 && responseText.length > 500) {
      issues.push({
        type: 'consistency',
        severity: 'warning',
        message: 'Response is detailed but lacks source citations'
      });
    }
    
    return issues;
  }
  
  /**
   * Extracts code blocks from response
   */
  private extractCodeBlocks(response: string): Array<{ code: string; sourcePath?: string }> {
    const blocks: Array<{ code: string; sourcePath?: string }> = [];
    
    // Match code blocks (```language ... ```)
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      blocks.push({
        code: match[1]
      });
    }
    
    return blocks;
  }
  
  /**
   * Extracts keywords from query
   */
  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'how', 'what', 'where', 'why', 'does', 'do', 'to', 'in', 'on', 'at'];
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }
  
  /**
   * Calculates confidence score
   */
  private calculateConfidence(issues: ValidationIssue[]): number {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    // Base confidence
    let confidence = 1.0;
    
    // Deduct for errors
    confidence -= errorCount * 0.2;
    
    // Deduct for warnings
    confidence -= warningCount * 0.05;
    
    return Math.max(0, Math.min(1, confidence));
  }
}

