/**
 * Answer Verification Node
 * 
 * Verifies that the proposed answer has sufficient evidence backing.
 * If verification fails (confidence < 70%), triggers reinvestigation.
 * 
 * This is a critical quality gate that prevents assumption-based responses.
 */

import { EvidenceValidator, ExecutionHistoryItem } from './utils/evidence-validator';
import { SessionLogger, VerificationResult } from './utils/session-logger';
import { InformationRetrievalAgentState } from './utils/types';

/**
 * Verify answer node for LangGraph
 */
export async function verifyAnswerNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  console.log('[VerifyAnswer] Starting answer verification...');
  
  const { userQuery, finalAnswer, researchSteps, sessionLogger } = state;
  
  if (!finalAnswer) {
    console.log('[VerifyAnswer] No answer to verify yet');
    return {};
  }
  
  // Convert research steps to execution history format for validator
  const executionHistory: ExecutionHistoryItem[] = (researchSteps || []).map(step => ({
    step: parseInt(step.id.split('-').pop() || '0'),
    name: step.description || step.id,
    type: step.id.includes('agent') ? 'agent' : 'tool',
    result: undefined, // TODO: Store actual results in research steps
    whatWeKnow: [],
  }));
  
  // For orchestrator-based execution, we need to get execution history differently
  // Check if we have orchestrator execution in subagent results
  const orchestratorHistory = (state as any).executionHistory;
  if (orchestratorHistory && Array.isArray(orchestratorHistory)) {
    console.log(`[VerifyAnswer] Using orchestrator execution history: ${orchestratorHistory.length} steps`);
    const validator = new EvidenceValidator();
    
    try {
      const validation = await validator.validate(
        userQuery,
        orchestratorHistory,
        finalAnswer
      );
      
      console.log(`[VerifyAnswer] Verification complete: ${validation.confidence}% confidence, ${validation.claimsVerified}/${validation.claims.length} claims verified`);
      
      // Convert to VerificationResult format for session logger
      const verificationResult: VerificationResult = {
        verified: validation.verified,
        confidence: validation.confidence,
        evidenceGaps: validation.evidenceGaps,
        claims: validation.claims,
        claimsVerified: validation.claimsVerified,
        claimsUnverified: validation.claimsUnverified,
      };
      
      // Log to session logger if available
      if (sessionLogger) {
        sessionLogger.logVerification(verificationResult);
        
        // Add issues if verification failed
        if (!validation.verified) {
          sessionLogger.detectIssue(
            `Answer verification failed: ${validation.confidence}% confidence`,
            validation.confidence < 50 ? 'high' : 'medium'
          );
          
          for (const gap of validation.evidenceGaps) {
            sessionLogger.detectIssue(`Evidence gap: ${gap}`, 'medium');
          }
          
          sessionLogger.addRecommendation(
            'Reinvestigate to gather missing evidence before finalizing answer.'
          );
        }
      }
      
      // Determine if reinvestigation is needed
      const requiresReinvestigation = validation.confidence < 70;
      
      if (requiresReinvestigation) {
        console.log('[VerifyAnswer] Verification confidence too low, reinvestigation needed');
      }
      
      return {
        verificationResult,
        requiresReinvestigation,
        verificationIssues: validation.evidenceGaps,
      };
      
    } catch (error) {
      console.error('[VerifyAnswer] Verification error:', error);
      
      if (sessionLogger) {
        sessionLogger.detectIssue(
          `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'high'
        );
      }
      
      // On error, don't block the answer but mark as unverified
      return {
        verificationResult: {
          verified: false,
          confidence: 0,
          evidenceGaps: ['Verification process failed'],
          claims: [],
          claimsVerified: 0,
          claimsUnverified: 0,
        },
        requiresReinvestigation: false, // Don't retry on verification error
      };
    }
  }
  
  // Fallback: If no execution history available, skip verification
  console.log('[VerifyAnswer] No execution history available for verification');
  return {};
}

/**
 * Routing function for verification results
 */
export function routeAfterVerification(state: InformationRetrievalAgentState): string {
  // Check if we've already retried once
  const verificationAttempts = (state as any).verificationAttempts || 0;
  
  // If verification failed and we haven't retried yet
  if (state.requiresReinvestigation && verificationAttempts === 0) {
    console.log('[VerifyAnswer] Routing back to orchestrator for reinvestigation');
    return 'reinvestigate';
  }
  
  // If verification passed or we've already retried once
  console.log('[VerifyAnswer] Verification complete, proceeding to end');
  return 'complete';
}

/**
 * Extract claims from answer (helper function)
 */
export function extractClaims(answer: string): string[] {
  const claims: string[] = [];
  
  // Split by sentences
  const sentences = answer.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  for (const sentence of sentences) {
    // Skip questions and suggestions
    if (sentence.includes('?')) continue;
    if (sentence.toLowerCase().startsWith('you can') || sentence.toLowerCase().startsWith('you should')) continue;
    
    // Include sentences with specific references
    if (
      sentence.includes('(') || // Code references
      sentence.match(/\d+/) || // Numbers
      sentence.includes('function') ||
      sentence.includes('variable') ||
      sentence.includes('handler') ||
      sentence.includes('method') ||
      /[A-Z]\w+\.\w+/.test(sentence) // Property access
    ) {
      claims.push(sentence);
    }
  }
  
  return claims;
}

/**
 * Validate claims against execution history (helper function)
 */
export async function validateClaims(
  claims: string[],
  state: InformationRetrievalAgentState
): Promise<VerificationResult> {
  const executionHistory = (state as any).executionHistory || [];
  const validator = new EvidenceValidator();
  
  try {
    const validation = await validator.validate(
      state.userQuery,
      executionHistory,
      state.finalAnswer || ''
    );
    
    return {
      verified: validation.verified,
      confidence: validation.confidence,
      evidenceGaps: validation.evidenceGaps,
      claims: validation.claims,
      claimsVerified: validation.claimsVerified,
      claimsUnverified: validation.claimsUnverified,
    };
  } catch (error) {
    console.error('[VerifyAnswer] Validation error:', error);
    return {
      verified: false,
      confidence: 0,
      evidenceGaps: ['Validation failed'],
      claims,
      claimsVerified: 0,
      claimsUnverified: claims.length,
    };
  }
}

