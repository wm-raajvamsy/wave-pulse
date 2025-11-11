/**
 * Test Executor
 * 
 * Executes tests to validate suggested solutions in the actual running application.
 * This prevents suggesting solutions that don't actually work.
 * 
 * Test types:
 * - Navigation: Test navigation code in the app
 * - Data binding: Verify variables and data access work
 * - Function calls: Try calling suggested functions
 * - Style application: Verify style changes are possible
 */

import { executeTool } from '../../tools';
import { TestResult } from './session-logger';

export class TestExecutor {
  /**
   * Test a navigation solution
   */
  async testNavigationSolution(
    solution: string,
    channelId?: string
  ): Promise<TestResult> {
    console.log('[TestExecutor] Testing navigation solution...');
    const startTime = Date.now();
    
    try {
      // Extract navigation code from solution
      const navCode = this.extractNavigationCode(solution);
      if (!navCode) {
        return {
          testType: 'navigation',
          testCode: solution,
          success: false,
          error: 'Could not extract navigation code from solution',
          duration: (Date.now() - startTime) / 1000,
        };
      }
      
      console.log('[TestExecutor] Testing navigation code:', navCode);
      
      // Execute the navigation code in the app context
      const testCode = `
        try {
          // Store current page for restoration
          const currentPage = App.activePage?.name;
          
          // Execute navigation code
          ${navCode}
          
          // Give it a moment to execute
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get result
          const newPage = App.activePage?.name;
          
          // Return result
          return {
            success: true,
            currentPage: currentPage,
            newPage: newPage,
            navigationExecuted: true
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      `;
      
      const result = await executeTool('eval_expression', {
        expression: testCode,
        channelId,
      });
      
      const duration = (Date.now() - startTime) / 1000;
      
      if (!result.success) {
        return {
          testType: 'navigation',
          testCode: navCode,
          success: false,
          error: result.error || 'Navigation test failed',
          duration,
        };
      }
      
      const testResult = result.data;
      
      return {
        testType: 'navigation',
        testCode: navCode,
        success: testResult?.success || false,
        actualResult: testResult,
        error: testResult?.error,
        duration,
      };
      
    } catch (error) {
      return {
        testType: 'navigation',
        testCode: solution,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: (Date.now() - startTime) / 1000,
      };
    }
  }

  /**
   * Test a data binding solution
   */
  async testDataBindingSolution(
    solution: string,
    channelId?: string
  ): Promise<TestResult> {
    console.log('[TestExecutor] Testing data binding solution...');
    const startTime = Date.now();
    
    try {
      // Extract variable references from solution
      const variables = this.extractVariableReferences(solution);
      if (variables.length === 0) {
        return {
          testType: 'data_binding',
          testCode: solution,
          success: false,
          error: 'No variable references found in solution',
          duration: (Date.now() - startTime) / 1000,
        };
      }
      
      console.log('[TestExecutor] Testing variables:', variables);
      
      // Test each variable
      const testCode = `
        try {
          const results = {};
          ${variables.map(v => `
            try {
              results['${v}'] = {
                exists: typeof ${v} !== 'undefined',
                value: typeof ${v} !== 'undefined' ? ${v} : undefined
              };
            } catch (e) {
              results['${v}'] = { exists: false, error: e.message };
            }
          `).join('\n')}
          
          return {
            success: true,
            variables: results
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      `;
      
      const result = await executeTool('eval_expression', {
        expression: testCode,
        channelId,
      });
      
      const duration = (Date.now() - startTime) / 1000;
      
      if (!result.success) {
        return {
          testType: 'data_binding',
          testCode: variables.join(', '),
          success: false,
          error: result.error || 'Data binding test failed',
          duration,
        };
      }
      
      const testResult = result.data;
      const allVariablesExist = variables.every(
        v => testResult?.variables?.[v]?.exists
      );
      
      return {
        testType: 'data_binding',
        testCode: variables.join(', '),
        success: allVariablesExist,
        actualResult: testResult,
        error: allVariablesExist ? undefined : 'Some variables do not exist',
        duration,
      };
      
    } catch (error) {
      return {
        testType: 'data_binding',
        testCode: solution,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: (Date.now() - startTime) / 1000,
      };
    }
  }

  /**
   * Test a function call solution
   */
  async testFunctionCall(
    solution: string,
    channelId?: string
  ): Promise<TestResult> {
    console.log('[TestExecutor] Testing function call solution...');
    const startTime = Date.now();
    
    try {
      // Extract function calls from solution
      const functionCalls = this.extractFunctionCalls(solution);
      if (functionCalls.length === 0) {
        return {
          testType: 'function_call',
          testCode: solution,
          success: false,
          error: 'No function calls found in solution',
          duration: (Date.now() - startTime) / 1000,
        };
      }
      
      console.log('[TestExecutor] Testing function calls:', functionCalls);
      
      // Test if functions exist (don't actually call them - could have side effects)
      const testCode = `
        try {
          const results = {};
          ${functionCalls.map(fn => `
            try {
              const fnParts = '${fn}'.split('.');
              let obj = window;
              for (let i = 0; i < fnParts.length - 1; i++) {
                obj = obj[fnParts[i]];
                if (!obj) break;
              }
              const fnName = fnParts[fnParts.length - 1];
              results['${fn}'] = {
                exists: obj && typeof obj[fnName] === 'function',
                type: obj ? typeof obj[fnName] : 'undefined'
              };
            } catch (e) {
              results['${fn}'] = { exists: false, error: e.message };
            }
          `).join('\n')}
          
          return {
            success: true,
            functions: results
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      `;
      
      const result = await executeTool('eval_expression', {
        expression: testCode,
        channelId,
      });
      
      const duration = (Date.now() - startTime) / 1000;
      
      if (!result.success) {
        return {
          testType: 'function_call',
          testCode: functionCalls.join(', '),
          success: false,
          error: result.error || 'Function call test failed',
          duration,
        };
      }
      
      const testResult = result.data;
      const allFunctionsExist = functionCalls.every(
        fn => testResult?.functions?.[fn]?.exists
      );
      
      return {
        testType: 'function_call',
        testCode: functionCalls.join(', '),
        success: allFunctionsExist,
        actualResult: testResult,
        error: allFunctionsExist ? undefined : 'Some functions do not exist',
        duration,
      };
      
    } catch (error) {
      return {
        testType: 'function_call',
        testCode: solution,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: (Date.now() - startTime) / 1000,
      };
    }
  }

  /**
   * Test a style application solution
   */
  async testStyleApplication(
    solution: string,
    channelId?: string
  ): Promise<TestResult> {
    console.log('[TestExecutor] Testing style application solution...');
    const startTime = Date.now();
    
    try {
      // Extract style properties from solution
      const styleProps = this.extractStyleProperties(solution);
      if (styleProps.length === 0) {
        return {
          testType: 'style_application',
          testCode: solution,
          success: false,
          error: 'No style properties found in solution',
          duration: (Date.now() - startTime) / 1000,
        };
      }
      
      console.log('[TestExecutor] Testing style properties:', styleProps);
      
      // For WaveMaker, styles are typically managed in style.js files
      // We can't really test style application dynamically
      // So we'll just verify the style properties are valid React Native styles
      const testCode = `
        try {
          const validRNStyles = [
            'color', 'backgroundColor', 'fontSize', 'fontWeight', 'margin', 'padding',
            'borderRadius', 'borderWidth', 'borderColor', 'width', 'height', 'flex',
            'flexDirection', 'justifyContent', 'alignItems', 'position', 'top', 'bottom',
            'left', 'right', 'opacity', 'zIndex'
          ];
          
          const styleProps = ${JSON.stringify(styleProps)};
          const results = {};
          
          for (const prop of styleProps) {
            results[prop] = {
              valid: validRNStyles.includes(prop),
              isRNStyle: true
            };
          }
          
          return {
            success: true,
            styles: results
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      `;
      
      const result = await executeTool('eval_expression', {
        expression: testCode,
        channelId,
      });
      
      const duration = (Date.now() - startTime) / 1000;
      
      if (!result.success) {
        return {
          testType: 'style_application',
          testCode: styleProps.join(', '),
          success: false,
          error: result.error || 'Style application test failed',
          duration,
        };
      }
      
      const testResult = result.data;
      const allStylesValid = styleProps.every(
        prop => testResult?.styles?.[prop]?.valid
      );
      
      return {
        testType: 'style_application',
        testCode: styleProps.join(', '),
        success: allStylesValid,
        actualResult: testResult,
        error: allStylesValid ? undefined : 'Some style properties are invalid',
        duration,
      };
      
    } catch (error) {
      return {
        testType: 'style_application',
        testCode: solution,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: (Date.now() - startTime) / 1000,
      };
    }
  }

  /**
   * Extract navigation code from solution
   */
  private extractNavigationCode(solution: string): string | null {
    // Look for common navigation patterns
    const patterns = [
      /Actions\.goToPage\([^)]+\)/,
      /navigateToPage\([^)]+\)/,
      /navigation\.navigate\([^)]+\)/,
      /App\.navigate\([^)]+\)/,
    ];
    
    for (const pattern of patterns) {
      const match = solution.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Extract variable references from solution
   */
  private extractVariableReferences(solution: string): string[] {
    const variables: string[] = [];
    
    // Look for Variables.xxx or Widgets.xxx patterns
    const variablePattern = /(Variables|Widgets)\.\w+(\.\w+)*/g;
    const matches = solution.match(variablePattern);
    
    if (matches) {
      variables.push(...matches);
    }
    
    return [...new Set(variables)]; // Remove duplicates
  }

  /**
   * Extract function calls from solution
   */
  private extractFunctionCalls(solution: string): string[] {
    const functions: string[] = [];
    
    // Look for function call patterns: word.word.word()
    const functionPattern = /\b[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+(?=\s*\()/g;
    const matches = solution.match(functionPattern);
    
    if (matches) {
      functions.push(...matches);
    }
    
    return [...new Set(functions)]; // Remove duplicates
  }

  /**
   * Extract style properties from solution
   */
  private extractStyleProperties(solution: string): string[] {
    const properties: string[] = [];
    
    // Look for style property names in CSS-like syntax or JS object notation
    const patterns = [
      /\b([a-z][a-zA-Z]+):/g, // camelCase properties
      /['"]([a-z-]+)['"]/g,    // quoted properties
    ];
    
    for (const pattern of patterns) {
      const matches = [...solution.matchAll(pattern)];
      for (const match of matches) {
        const prop = match[1];
        if (prop && prop.length > 2) {
          // Convert kebab-case to camelCase
          const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          properties.push(camelProp);
        }
      }
    }
    
    return [...new Set(properties)]; // Remove duplicates
  }
}

