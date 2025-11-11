/**
 * Evidence Validator
 * 
 * Validates that answers are backed by concrete evidence from execution history.
 * Prevents assumption-based responses by requiring proof for each claim.
 * 
 * Key features:
 * - Extract claims from proposed answers
 * - Verify each claim has supporting evidence
 * - Calculate confidence based on evidence quality
 * - Identify evidence gaps
 */

import { createGeminiClient } from '../../gemini';
import { getAISeed } from '../../config';
import { Evidence } from './session-logger';

export interface EvidenceValidation {
  hasCodeEvidence: boolean;
  hasRuntimeData: boolean;
  hasFileContent: boolean;
  missingEvidence: string[];
  confidence: number;
  canAnswer: boolean;
  verified: boolean;
  claims: string[];
  claimsVerified: number;
  claimsUnverified: number;
  evidenceGaps: string[];
}

export interface ExecutionHistoryItem {
  step: number;
  name: string;
  type: string;
  result?: string;
  evidenceFound?: Evidence[];
  whatWeKnow?: string[];
}

export class EvidenceValidator {
  /**
   * Validate that proposed answer has sufficient evidence
   */
  async validate(
    query: string,
    executionHistory: ExecutionHistoryItem[],
    proposedAnswer: string
  ): Promise<EvidenceValidation> {
    console.log('[EvidenceValidator] Validating answer against evidence...');
    
    // Extract claims from answer
    const claims = await this.extractClaimsFromAnswer(proposedAnswer, query);
    console.log(`[EvidenceValidator] Extracted ${claims.length} claims from answer`);
    
    // Collect all evidence from execution history
    const allEvidence = this.collectEvidence(executionHistory);
    console.log(`[EvidenceValidator] Found ${allEvidence.code.length} code evidence, ${allEvidence.runtime.length} runtime data, ${allEvidence.files.length} files`);
    
    // Verify each claim
    const verificationResults: Array<{ claim: string; verified: boolean; reason: string }> = [];
    for (const claim of claims) {
      const verification = await this.verifyClaimHasEvidence(claim, allEvidence, executionHistory);
      verificationResults.push(verification);
    }
    
    const claimsVerified = verificationResults.filter(v => v.verified).length;
    const claimsUnverified = verificationResults.filter(v => !v.verified).length;
    
    // Identify evidence gaps
    const evidenceGaps = verificationResults
      .filter(v => !v.verified)
      .map(v => v.reason);
    
    // Calculate confidence based on verification rate and evidence quality
    const verificationRate = claims.length > 0 ? (claimsVerified / claims.length) * 100 : 0;
    const evidenceQuality = this.assessEvidenceQuality(allEvidence);
    const confidence = Math.round((verificationRate * 0.7) + (evidenceQuality * 0.3));
    
    const validation: EvidenceValidation = {
      hasCodeEvidence: allEvidence.code.length > 0,
      hasRuntimeData: allEvidence.runtime.length > 0,
      hasFileContent: allEvidence.files.length > 0,
      missingEvidence: this.identifyMissingEvidence(query, allEvidence),
      confidence,
      canAnswer: confidence >= 70,
      verified: confidence >= 80,
      claims,
      claimsVerified,
      claimsUnverified,
      evidenceGaps,
    };
    
    console.log(`[EvidenceValidator] Validation complete: ${confidence}% confidence, ${claimsVerified}/${claims.length} claims verified`);
    
    return validation;
  }

  /**
   * Extract claims from proposed answer using AI
   */
  private async extractClaimsFromAnswer(answer: string, query: string): Promise<string[]> {
    try {
      const ai = createGeminiClient();
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
      
      const prompt = `Extract factual claims from this answer that need evidence verification.

Query: "${query}"

Answer:
${answer}

Extract all specific, verifiable claims. Focus on:
- Code references (functions, files, properties)
- Data values (counts, names, items)
- Behavior descriptions (what happens when X)
- API/mechanism references (how to do X)

Return a JSON array of claim strings:
["claim 1", "claim 2", ...]

Be specific and extract only verifiable facts, not opinions or general statements.`;

      const response = await ai.models.generateContent({
        model: modelName,
        config: {
          temperature: 0.1,
          seed: getAISeed(),
          responseMimeType: 'application/json',
        },
        contents: [{
          role: 'user',
          parts: [{ text: prompt }],
        }],
      });
      
      let responseText = '';
      if (response.candidates && response.candidates[0]?.content?.parts) {
        responseText = response.candidates[0].content.parts
          .map(part => part.text || '')
          .join('');
      }
      
      const claims = JSON.parse(responseText);
      return Array.isArray(claims) ? claims : [];
    } catch (error) {
      console.error('[EvidenceValidator] Failed to extract claims:', error);
      // Fallback: simple extraction
      return this.fallbackExtractClaims(answer);
    }
  }

  /**
   * Fallback claim extraction (simple heuristics)
   */
  private fallbackExtractClaims(answer: string): string[] {
    const claims: string[] = [];
    
    // Split by sentences
    const sentences = answer.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    
    // Extract sentences that look like claims
    for (const sentence of sentences) {
      // Skip questions and general statements
      if (sentence.includes('?')) continue;
      if (sentence.toLowerCase().includes('you can') || sentence.toLowerCase().includes('you should')) continue;
      
      // Include sentences with specific references
      if (
        sentence.includes('(') || // Code references
        sentence.match(/\d+/) || // Numbers
        sentence.includes('function') ||
        sentence.includes('variable') ||
        sentence.includes('handler') ||
        sentence.includes('method') ||
        sentence.includes('.') && sentence.match(/[A-Z]\w+\.\w+/) // Property access
      ) {
        claims.push(sentence);
      }
    }
    
    return claims.slice(0, 10); // Limit to 10 claims
  }

  /**
   * Verify if a claim has supporting evidence
   */
  private async verifyClaimHasEvidence(
    claim: string,
    evidence: { code: Evidence[]; runtime: Evidence[]; files: Evidence[] },
    executionHistory: ExecutionHistoryItem[]
  ): Promise<{ claim: string; verified: boolean; reason: string }> {
    // Check for code references in claim
    const hasCodeReference = /[A-Z]\w+|function|method|handler|\.\w+\(/.test(claim);
    if (hasCodeReference && evidence.code.length === 0) {
      return {
        claim,
        verified: false,
        reason: `Claim mentions code but no code evidence was collected: "${claim}"`,
      };
    }
    
    // Check for data values in claim
    const hasDataValue = /\d+|items?|users?|data|count/.test(claim);
    if (hasDataValue && evidence.runtime.length === 0) {
      return {
        claim,
        verified: false,
        reason: `Claim mentions data but no runtime data was collected: "${claim}"`,
      };
    }
    
    // Check if claim references specific files
    const fileReference = claim.match(/(\w+\.(?:component|script|style|variables)\.js)/);
    if (fileReference && evidence.files.length === 0) {
      return {
        claim,
        verified: false,
        reason: `Claim references file ${fileReference[1]} but no files were read`,
      };
    }
    
    // Check if execution history supports this claim
    const historySupport = executionHistory.some(item => {
      const resultStr = item.result?.toLowerCase() || '';
      const claimLower = claim.toLowerCase();
      
      // Check if result contains key terms from claim
      const claimTerms = claimLower.split(/\s+/).filter(t => t.length > 4);
      const matchCount = claimTerms.filter(term => resultStr.includes(term)).length;
      
      return matchCount >= Math.min(3, claimTerms.length * 0.5);
    });
    
    if (!historySupport) {
      return {
        claim,
        verified: false,
        reason: `No execution history supports this claim: "${claim}"`,
      };
    }
    
    // If we got here, claim appears to be supported
    return {
      claim,
      verified: true,
      reason: 'Claim has supporting evidence',
    };
  }

  /**
   * Collect all evidence from execution history
   */
  private collectEvidence(executionHistory: ExecutionHistoryItem[]): {
    code: Evidence[];
    runtime: Evidence[];
    files: Evidence[];
  } {
    const collected = {
      code: [] as Evidence[],
      runtime: [] as Evidence[],
      files: [] as Evidence[],
    };
    
    for (const item of executionHistory) {
      if (item.evidenceFound) {
        for (const evidence of item.evidenceFound) {
          if (evidence.type === 'code') {
            collected.code.push(evidence);
          } else if (evidence.type === 'runtime_data') {
            collected.runtime.push(evidence);
          } else if (evidence.type === 'file_content') {
            collected.files.push(evidence);
          }
        }
      }
      
      // Also infer evidence from tool/agent types
      if (item.name === 'get_ui_layer_data' && item.result) {
        collected.runtime.push({
          type: 'runtime_data',
          source: item.name,
          content: item.result,
          verified: true,
        });
      } else if (item.name === 'read_file' && item.result) {
        collected.files.push({
          type: 'file_content',
          source: item.name,
          content: item.result,
          verified: true,
        });
      } else if (item.name === 'grep_files' && item.result) {
        collected.code.push({
          type: 'code',
          source: item.name,
          content: item.result,
          verified: true,
        });
      } else if (item.name === 'eval_expression' && item.result) {
        collected.runtime.push({
          type: 'runtime_data',
          source: item.name,
          content: item.result,
          verified: true,
        });
      }
    }
    
    return collected;
  }

  /**
   * Assess overall evidence quality
   */
  private assessEvidenceQuality(evidence: {
    code: Evidence[];
    runtime: Evidence[];
    files: Evidence[];
  }): number {
    let quality = 0;
    
    // Having all three types of evidence is best
    if (evidence.code.length > 0) quality += 33;
    if (evidence.runtime.length > 0) quality += 33;
    if (evidence.files.length > 0) quality += 34;
    
    // Adjust for quantity and verification
    const totalEvidence = evidence.code.length + evidence.runtime.length + evidence.files.length;
    if (totalEvidence >= 5) quality = Math.min(100, quality + 10);
    if (totalEvidence >= 10) quality = Math.min(100, quality + 10);
    
    const verifiedCount = [
      ...evidence.code,
      ...evidence.runtime,
      ...evidence.files,
    ].filter(e => e.verified).length;
    
    if (verifiedCount === totalEvidence && totalEvidence > 0) {
      quality = Math.min(100, quality + 10);
    }
    
    return quality;
  }

  /**
   * Identify what evidence is missing for a query
   */
  private identifyMissingEvidence(
    query: string,
    evidence: { code: Evidence[]; runtime: Evidence[]; files: Evidence[] }
  ): string[] {
    const missing: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Check what the query is asking about
    const needsCode = /tap|click|handler|function|method|code|script/.test(queryLower);
    const needsData = /how many|count|list|show|display|data|items|users/.test(queryLower);
    const needsFiles = /page|component|widget|style/.test(queryLower);
    const needsNavigation = /navigate|go to|open|route/.test(queryLower);
    const needsProperties = /property|properties|attribute|style|value/.test(queryLower);
    
    if (needsCode && evidence.code.length === 0) {
      missing.push('Code evidence (event handlers, functions, scripts)');
    }
    
    if (needsData && evidence.runtime.length === 0) {
      missing.push('Runtime data (actual data values, counts, items)');
    }
    
    if (needsFiles && evidence.files.length === 0) {
      missing.push('File content (component.js, script.js, variables.js)');
    }
    
    if (needsNavigation && !evidence.files.some(e => e.source.includes('script'))) {
      missing.push('Navigation code (script.js or component.js with navigation logic)');
    }
    
    if (needsProperties && evidence.runtime.length === 0) {
      missing.push('Widget properties or styles (get_widget_properties_styles)');
    }
    
    return missing;
  }
}

