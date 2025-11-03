/**
 * File Discovery Engine
 * Finds relevant files based on query intent using multiple strategies
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { FileMatch, BasePaths } from './types';

const execAsync = promisify(exec);

export class FileDiscoveryEngine {
  private basePaths: BasePaths;
  
  constructor(channelId: string) {
    this.basePaths = {
      runtime: `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/app-rn-runtime`,
      codegen: `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/rn-codegen`
    };
  }
  
  /**
   * Discovers files relevant to query
   */
  async discoverFiles(query: string, domain: string[], basePath: string): Promise<FileMatch[]> {
    const matches: FileMatch[] = [];
    
    // Strategy 1: Direct file name matching
    matches.push(...await this.findByName(query, basePath));
    
    // Strategy 2: Content-based search
    matches.push(...await this.findByContent(query, basePath));
    
    // Strategy 3: Symbol-based search
    matches.push(...await this.findBySymbol(query, basePath));
    
    // Strategy 4: Dependency tracing
    matches.push(...await this.findByDependency(query, basePath));
    
    // Deduplicate and rank
    return this.rankAndDeduplicate(matches);
  }
  
  /**
   * Finds files by name patterns
   */
  private async findByName(query: string, basePath: string): Promise<FileMatch[]> {
    const patterns = this.extractNamePatterns(query);
    const matches: FileMatch[] = [];
    
    for (const pattern of patterns) {
      try {
        const result = await execAsync(`find ${basePath} -name "*${pattern}*" -type f 2>/dev/null | head -20`);
        const files = result.stdout.split('\n').filter(f => f.trim());
        
        files.forEach(file => {
          matches.push({
            path: file,
            matchType: 'name',
            confidence: this.calculateConfidence(pattern, file),
            context: this.extractContext(file)
          });
        });
      } catch (error) {
        // Ignore errors, continue with other patterns
      }
    }
    
    return matches;
  }
  
  /**
   * Finds files by content search
   */
  private async findByContent(query: string, basePath: string): Promise<FileMatch[]> {
    const keywords = this.extractKeywords(query);
    const matches: FileMatch[] = [];
    
    for (const keyword of keywords) {
      try {
        const result = await execAsync(
          `grep -r -l --include="*.ts" --include="*.tsx" --include="*.js" "${keyword}" ${basePath} 2>/dev/null | head -20`
        );
        
        const files = result.stdout.split('\n').filter(f => f.trim());
        
        files.forEach(file => {
          matches.push({
            path: file,
            matchType: 'content',
            confidence: this.calculateContentConfidence(keyword, file),
            context: this.extractContext(file)
          });
        });
      } catch (error) {
        // Ignore errors, continue with other keywords
      }
    }
    
    return matches;
  }
  
  /**
   * Finds files by symbol/class/function names
   */
  private async findBySymbol(query: string, basePath: string): Promise<FileMatch[]> {
    const symbols = this.extractSymbols(query);
    const matches: FileMatch[] = [];
    
    for (const symbol of symbols) {
      try {
        // Search for class declarations
        const classResult = await execAsync(
          `grep -r -l "class ${symbol}" ${basePath} --include="*.ts" --include="*.tsx" 2>/dev/null | head -10`
        );
        
        // Search for interface declarations
        const interfaceResult = await execAsync(
          `grep -r -l "interface ${symbol}" ${basePath} --include="*.ts" --include="*.tsx" 2>/dev/null | head -10`
        );
        
        // Search for type declarations
        const typeResult = await execAsync(
          `grep -r -l "type ${symbol}" ${basePath} --include="*.ts" --include="*.tsx" 2>/dev/null | head -10`
        );
        
        const allFiles = [
          ...classResult.stdout.split('\n'),
          ...interfaceResult.stdout.split('\n'),
          ...typeResult.stdout.split('\n')
        ].filter(f => f.trim());
        
        allFiles.forEach(file => {
          matches.push({
            path: file,
            matchType: 'symbol',
            confidence: 0.9, // High confidence for symbol matches
            context: this.extractContext(file)
          });
        });
      } catch (error) {
        // Ignore errors, continue with other symbols
      }
    }
    
    return matches;
  }
  
  /**
   * Traces dependencies to find related files
   */
  private async findByDependency(query: string, basePath: string): Promise<FileMatch[]> {
    const initialFiles = await this.findByName(query, basePath);
    const matches: FileMatch[] = [];
    
    for (const file of initialFiles.slice(0, 5)) { // Limit to top 5
      try {
        // Extract imports from file
        const imports = await this.extractImports(file.path);
        
        for (const importPath of imports.slice(0, 10)) { // Limit imports
          const resolvedPath = this.resolveImportPath(importPath, file.path, basePath);
          if (resolvedPath && await this.fileExists(resolvedPath)) {
            matches.push({
              path: resolvedPath,
              matchType: 'dependency',
              confidence: 0.7,
              context: `Imported by ${file.path}`
            });
          }
        }
      } catch (error) {
        // Ignore errors, continue with other files
      }
    }
    
    return matches;
  }
  
  /**
   * Extracts name patterns from query
   */
  private extractNamePatterns(query: string): string[] {
    const patterns: string[] = [];
    
    // Extract component/widget names (WmButton -> button)
    const componentMatch = query.match(/\bWm([A-Z]\w+)\b/);
    if (componentMatch) {
      const name = componentMatch[1];
      patterns.push(name.charAt(0).toLowerCase() + name.slice(1));
      patterns.push(name.toLowerCase());
    }
    
    // Extract class names
    const classMatch = query.match(/\b([A-Z][a-z]+)\b/g);
    if (classMatch) {
      patterns.push(...classMatch.map(c => c.toLowerCase()));
    }
    
    // Extract keywords
    const keywords = this.extractKeywords(query);
    patterns.push(...keywords.slice(0, 5));
    
    return [...new Set(patterns)];
  }
  
  /**
   * Extracts keywords from query
   */
  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'how', 'what', 'where', 'why', 'does', 'do', 'to', 'in', 'on', 'at', 'for', 'of', 'with'];
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }
  
  /**
   * Extracts symbols (class/interface names) from query
   */
  private extractSymbols(query: string): string[] {
    const symbols: string[] = [];
    
    // Match PascalCase names
    const pascalCase = query.match(/\b[A-Z][a-zA-Z0-9]+\b/g);
    if (pascalCase) {
      symbols.push(...pascalCase);
    }
    
    return [...new Set(symbols)];
  }
  
  /**
   * Calculates confidence score for file match
   */
  private calculateConfidence(pattern: string, file: string): number {
    const lowerFile = file.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    
    // Exact match
    if (lowerFile.includes(lowerPattern)) {
      return 0.9;
    }
    
    // Partial match
    const patternWords = lowerPattern.split(/[-_]/);
    const matchCount = patternWords.filter(word => lowerFile.includes(word)).length;
    return matchCount / patternWords.length * 0.7;
  }
  
  /**
   * Calculates confidence for content matches
   */
  private calculateContentConfidence(keyword: string, file: string): number {
    const lowerFile = file.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    
    // Check if keyword appears in path
    if (lowerFile.includes(lowerKeyword)) {
      return 0.8;
    }
    
    return 0.6;
  }
  
  /**
   * Extracts context from file path
   */
  private extractContext(file: string): string {
    const parts = file.split('/');
    const fileName = parts[parts.length - 1];
    const directory = parts[parts.length - 2] || '';
    return `${directory}/${fileName}`;
  }
  
  /**
   * Extracts imports from TypeScript/JavaScript file
   */
  private async extractImports(filePath: string): Promise<string[]> {
    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(filePath, 'utf-8');
      const imports: string[] = [];
      
      // Match import statements
      const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      return imports;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Resolves import path to actual file path
   */
  private resolveImportPath(importPath: string, fromFile: string, basePath: string): string | null {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      const resolved = importPath.replace(/^\./, fromDir);
      return resolved.endsWith('.ts') || resolved.endsWith('.tsx') ? resolved : `${resolved}.ts`;
    }
    
    // Handle package imports (@wavemaker/...)
    if (importPath.startsWith('@wavemaker/')) {
      const packageName = importPath.split('/')[1];
      const rest = importPath.split('/').slice(2).join('/');
      return `${basePath}/src/${rest}`;
    }
    
    return null;
  }
  
  /**
   * Checks if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const { access } = await import('fs/promises');
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Ranks and deduplicates file matches
   */
  private rankAndDeduplicate(matches: FileMatch[]): FileMatch[] {
    // Deduplicate by path
    const seen = new Set<string>();
    const unique: FileMatch[] = [];
    
    for (const match of matches) {
      if (!seen.has(match.path)) {
        seen.add(match.path);
        unique.push(match);
      }
    }
    
    // Sort by confidence
    return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 30); // Top 30 files
  }
}

