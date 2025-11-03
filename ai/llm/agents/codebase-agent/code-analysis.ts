/**
 * Code Analysis Engine
 * Analyzes code files and extracts meaningful insights
 */

import { readFile } from 'fs/promises';
import { FileMatch, CodeAnalysis, FileAnalysis, CodeSnippet } from './types';

export class CodeAnalysisEngine {
  /**
   * Analyzes code files and extracts insights
   */
  async analyzeCode(files: FileMatch[], query: string): Promise<CodeAnalysis> {
    const analysis: CodeAnalysis = {
      files: [],
      relationships: [],
      patterns: [],
      insights: []
    };
    
    for (const file of files.slice(0, 10)) { // Limit to top 10 files
      try {
        const fileAnalysis = await this.analyzeFile(file.path, query);
        analysis.files.push(fileAnalysis);
        
        // Extract relationships
        analysis.relationships.push(...fileAnalysis.relationships);
        
        // Extract patterns
        analysis.patterns.push(...fileAnalysis.patterns);
      } catch (error) {
        // Skip files that can't be analyzed
        console.warn(`Failed to analyze ${file.path}:`, error);
      }
    }
    
    // Generate insights
    analysis.insights = this.generateInsights(analysis, query);
    
    return analysis;
  }
  
  /**
   * Analyzes individual file
   */
  private async analyzeFile(filePath: string, query: string): Promise<FileAnalysis> {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
    
    const ast = this.parseAST(content);
    
    return {
      path: filePath,
      size: content.length,
      lines: content.split('\n').length,
      classes: this.extractClasses(ast),
      interfaces: this.extractInterfaces(ast),
      functions: this.extractFunctions(ast),
      imports: this.extractImports(ast),
      exports: this.extractExports(ast),
      relationships: this.extractRelationships(ast),
      patterns: this.identifyPatterns(ast),
      relevantSnippets: this.findRelevantSnippets(content, query)
    };
  }
  
  /**
   * Finds relevant code snippets based on query
   */
  private findRelevantSnippets(content: string, query: string): CodeSnippet[] {
    const snippets: CodeSnippet[] = [];
    const lines = content.split('\n');
    const keywords = this.extractKeywords(query);
    
    lines.forEach((line, index) => {
      const relevance = this.calculateRelevance(line, keywords);
      if (relevance > 0.5) {
        // Include context lines
        const start = Math.max(0, index - 5);
        const end = Math.min(lines.length, index + 10);
        
        snippets.push({
          startLine: start + 1,
          endLine: end + 1,
          code: lines.slice(start, end).join('\n'),
          relevance
        });
      }
    });
    
    return snippets.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }
  
  /**
   * Simple AST parsing (basic implementation)
   */
  private parseAST(content: string): any {
    // Simplified AST representation
    return {
      content,
      lines: content.split('\n')
    };
  }
  
  /**
   * Extracts class information from AST
   */
  private extractClasses(ast: any): any[] {
    const classes: any[] = [];
    const classRegex = /(?:export\s+)?(?:default\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let match;
    
    while ((match = classRegex.exec(ast.content)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2] || undefined
      });
    }
    
    return classes;
  }
  
  /**
   * Extracts interface information
   */
  private extractInterfaces(ast: any): any[] {
    const interfaces: any[] = [];
    const interfaceRegex = /interface\s+(\w+)/g;
    let match;
    
    while ((match = interfaceRegex.exec(ast.content)) !== null) {
      interfaces.push({
        name: match[1],
        properties: []
      });
    }
    
    return interfaces;
  }
  
  /**
   * Extracts function information
   */
  private extractFunctions(ast: any): any[] {
    const functions: any[] = [];
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    let match;
    
    while ((match = functionRegex.exec(ast.content)) !== null) {
      functions.push({
        name: match[1],
        parameters: []
      });
    }
    
    return functions;
  }
  
  /**
   * Extracts imports
   */
  private extractImports(ast: any): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    let match;
    
    while ((match = importRegex.exec(ast.content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }
  
  /**
   * Extracts exports
   */
  private extractExports(ast: any): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:class|interface|function|const|let|var)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(ast.content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }
  
  /**
   * Extracts relationships
   */
  private extractRelationships(ast: any): any[] {
    const relationships: any[] = [];
    
    // Extract extends relationships
    const extendsRegex = /class\s+(\w+)\s+extends\s+(\w+)/g;
    let match;
    
    while ((match = extendsRegex.exec(ast.content)) !== null) {
      relationships.push({
        type: 'extends',
        source: match[1],
        target: match[2]
      });
    }
    
    return relationships;
  }
  
  /**
   * Identifies patterns
   */
  private identifyPatterns(ast: any): any[] {
    const patterns: any[] = [];
    const content = ast.content;
    
    // Check for Observer pattern (event listeners)
    if (content.includes('addEventListener') || content.includes('on(') || content.includes('subscribe')) {
      patterns.push({
        type: 'Observer',
        location: ast.path || 'unknown',
        description: 'Uses Observer pattern for event handling'
      });
    }
    
    // Check for Factory pattern
    if (content.includes('create') && content.includes('Factory') || content.match(/create\w+\(/)) {
      patterns.push({
        type: 'Factory',
        location: ast.path || 'unknown',
        description: 'Uses Factory pattern for object creation'
      });
    }
    
    return patterns;
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
   * Calculates relevance score for a line
   */
  private calculateRelevance(line: string, keywords: string[]): number {
    const lowerLine = line.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      if (lowerLine.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    return Math.min(score / keywords.length, 1);
  }
  
  /**
   * Generates insights from analysis
   */
  private generateInsights(analysis: CodeAnalysis, query: string): string[] {
    const insights: string[] = [];
    
    // Pattern-based insights
    if (analysis.patterns.some(p => p.type === 'Observer')) {
      insights.push('Uses Observer pattern for event handling');
    }
    
    if (analysis.patterns.some(p => p.type === 'Factory')) {
      insights.push('Uses Factory pattern for object creation');
    }
    
    // Relationship-based insights
    const relationships = analysis.relationships;
    if (relationships.some(r => r.type === 'extends' && r.target === 'BaseComponent')) {
      insights.push('Components extend BaseComponent for consistent lifecycle');
    }
    
    // Architecture insights
    if (query.toLowerCase().includes('how')) {
      insights.push(...this.generateHowInsights(analysis));
    }
    
    if (query.toLowerCase().includes('why')) {
      insights.push(...this.generateWhyInsights(analysis));
    }
    
    return insights;
  }
  
  /**
   * Generates "how" insights
   */
  private generateHowInsights(analysis: CodeAnalysis): string[] {
    const insights: string[] = [];
    
    if (analysis.files.length > 0) {
      insights.push(`Found ${analysis.files.length} relevant implementation files`);
    }
    
    if (analysis.relationships.length > 0) {
      insights.push(`Identified ${analysis.relationships.length} code relationships`);
    }
    
    return insights;
  }
  
  /**
   * Generates "why" insights
   */
  private generateWhyInsights(analysis: CodeAnalysis): string[] {
    const insights: string[] = [];
    
    if (analysis.patterns.length > 0) {
      insights.push(`Uses ${analysis.patterns.length} design pattern(s)`);
    }
    
    return insights;
  }
}

