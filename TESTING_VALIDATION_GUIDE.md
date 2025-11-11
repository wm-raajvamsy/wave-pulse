# Enterprise Session Logging - Testing & Validation Guide

## Overview

This document provides comprehensive testing scenarios to validate that the Enterprise Session Logging system improves answer accuracy from 60-80% to 90%+.

---

## Test Scenarios

### Scenario 1: Navigation Query (Original Problem)

**Query**: "How can I navigate to t1 page and pass this number of male and female users on tap of selected widget?"

**Expected Behavior**:
1. ✅ Query analysis identifies: navigation + data passing + widget tap
2. ✅ Orchestrator uses `get_ui_layer_data('components')` to find selected widget
3. ✅ Orchestrator reads `component.js` and `script.js` to find tap handler
4. ✅ Orchestrator uses `eval_expression` to get actual male/female counts
5. ✅ Evidence collected:
   - Widget tap handler code (REQUIRED)
   - Navigation API usage (REQUIRED)
   - Data variables for counts (REQUIRED)
6. ✅ Verification validates all claims have evidence
7. ✅ Final answer includes:
   - Actual widget name
   - Actual tap handler code
   - Actual navigation method used
   - Actual data variable references
8. ✅ Session log shows HIGH quality, 90%+ confidence

**Validation Criteria**:
- ❌ NO assumptions about navigation API without evidence
- ❌ NO generic "you can use Actions.goToPage" without verification
- ✅ All claims backed by actual code
- ✅ Confidence >= 85%
- ✅ Answer quality: HIGH

**Test Steps**:
```bash
# 1. Run the query through the system
# 2. Check session log at: logs/agent-sessions/{sessionId}.md
# 3. Verify evidence was collected
# 4. Confirm no assumptions were made
```

---

### Scenario 2: Data Display Query

**Query**: "How many users are currently displayed in the list?"

**Expected Behavior**:
1. ✅ Identified as runtime data query
2. ✅ Uses `get_ui_layer_data('components')` first
3. ✅ Uses `get_ui_layer_data('network')` to get actual data
4. ✅ Evidence: Runtime data from network responses
5. ✅ Answer includes actual count and user details
6. ✅ NO assumptions about data structure

**Validation Criteria**:
- ✅ Actual count extracted from runtime data
- ✅ No guessing about list structure
- ✅ Confidence >= 80%

---

### Scenario 3: Style Query

**Query**: "What is the default button color in the theme?"

**Expected Behavior**:
1. ✅ Identified as style/theme query
2. ✅ Routes to codebase agent for theme information
3. ✅ Evidence: Theme definition files or style.js
4. ✅ Actual color value provided (not "typically blue")

**Validation Criteria**:
- ✅ Specific color value from actual theme
- ✅ No generic "usually" statements
- ✅ Evidence from style files

---

### Scenario 4: Error Investigation

**Query**: "Why is my API call failing?"

**Expected Behavior**:
1. ✅ Uses `get_ui_layer_data('console')` for errors
2. ✅ Uses `get_ui_layer_data('network')` for failed requests
3. ✅ Evidence: Actual error messages
4. ✅ Specific failure reason, not generic troubleshooting

**Validation Criteria**:
- ✅ Actual error message cited
- ✅ Specific network status code
- ✅ No generic "check your API key" without evidence

---

### Scenario 5: Code Structure Query

**Query**: "What happens when I tap the submit button?"

**Expected Behavior**:
1. ✅ Find submit button in component tree
2. ✅ Read component.js to find tap handler
3. ✅ Read script.js to find function implementation
4. ✅ Evidence: Actual code from files
5. ✅ Detailed explanation of flow

**Validation Criteria**:
- ✅ Actual function names from code
- ✅ Step-by-step flow from actual implementation
- ✅ No assumptions about what "probably happens"

---

## Verification Checklist

For each test scenario, verify:

### Evidence Collection
- [ ] At least 3 pieces of evidence collected
- [ ] Evidence matches query type (code/runtime/file)
- [ ] Evidence is from actual execution, not assumed
- [ ] Evidence is verified (marked as verified in session log)

### Issue Detection
- [ ] Low confidence detected and logged
- [ ] Missing evidence identified
- [ ] Recommendations generated
- [ ] Loops detected and prevented

### Answer Quality
- [ ] Confidence score >= 85% for HIGH quality
- [ ] All claims have supporting evidence
- [ ] No "you can probably" or "typically" phrases
- [ ] Specific references to actual code/data

### Session Logging
- [ ] Session ID generated
- [ ] All steps logged with timing
- [ ] Issues detected and logged
- [ ] Markdown report generated
- [ ] Pattern learning triggered

---

## Testing Procedure

### Manual Testing

```bash
# 1. Start the application
cd server
npm run dev

# 2. Send test query
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I navigate to t1 page and pass this number of male and female users on tap of selected widget?",
    "channelId": "test-channel",
    "history": []
  }'

# 3. Check session log
ls -la logs/agent-sessions/

# 4. Review session markdown
cat logs/agent-sessions/session_*.md

# 5. Verify metrics
# - Answer Quality: should be HIGH
# - Confidence: should be >= 85%
# - Issues Detected: should be 0-1 low severity
# - Evidence Collected: should be >= 3
```

### Automated Testing

Create a test script `test-session-logging.ts`:

```typescript
import { executeWithOrchestration } from './ai/llm/agents/execution-engine';

async function runTest(query: string, expectedQuality: string) {
  console.log(`\n=== Testing: ${query} ===`);
  
  const result = await executeWithOrchestration({
    userQuery: query,
    channelId: 'test-channel',
  });
  
  console.log('Result:', {
    sessionId: result.sessionId,
    answerQuality: result.answerQuality,
    confidence: result.confidence,
    issuesCount: result.issuesDetected.length,
  });
  
  // Assertions
  if (result.answerQuality !== expectedQuality) {
    console.error(`❌ FAIL: Expected ${expectedQuality}, got ${result.answerQuality}`);
    return false;
  }
  
  if (result.confidence < 85 && expectedQuality === 'HIGH') {
    console.error(`❌ FAIL: Confidence too low: ${result.confidence}%`);
    return false;
  }
  
  console.log('✅ PASS');
  return true;
}

async function runAllTests() {
  const tests = [
    {
      query: "How can I navigate to t1 page and pass this number of male and female users on tap of selected widget?",
      expected: "HIGH"
    },
    {
      query: "How many users are currently displayed?",
      expected: "HIGH"
    },
    {
      query: "What is the default button color?",
      expected: "HIGH"
    },
  ];
  
  let passed = 0;
  for (const test of tests) {
    const success = await runTest(test.query, test.expected);
    if (success) passed++;
  }
  
  console.log(`\n=== Results: ${passed}/${tests.length} passed ===`);
}

runAllTests().catch(console.error);
```

---

## Success Metrics

The implementation is successful when:

### Accuracy Improvement
- ✅ Answer accuracy: >= 90% (up from 60-80%)
- ✅ Average confidence: >= 85%
- ✅ HIGH quality answers: >= 70% of queries
- ✅ LOW quality answers: <= 10% of queries

### Evidence Requirements
- ✅ All answers have supporting evidence
- ✅ Evidence collected: >= 3 pieces per query
- ✅ Evidence verified: >= 80% verified
- ✅ Missing evidence identified: 100% coverage

### Issue Detection
- ✅ Low confidence detected: 100%
- ✅ Missing evidence detected: 100%
- ✅ Loops prevented: 100%
- ✅ Recommendations generated: >= 80%

### Pattern Learning
- ✅ Successful patterns stored: >= 5
- ✅ Pattern matching: >= 50% queries
- ✅ Pattern reuse improves performance: >= 20% faster

### Debugging Visibility
- ✅ Session logs generated: 100%
- ✅ Markdown reports readable: 100%
- ✅ Frontend displays session info: 100%
- ✅ Issues visible to developers: 100%

---

## Regression Testing

For each code change, run:

1. **Evidence Collection Test**
   ```
   Query: "Show me the tap handler for button1"
   Expected: Code evidence from component.js
   ```

2. **Verification Test**
   ```
   Query: "Navigate to page X" (without actual page)
   Expected: LOW quality, missing evidence error
   ```

3. **Pattern Learning Test**
   ```
   Run same query twice
   Expected: Second execution uses pattern, faster
   ```

4. **Issue Detection Test**
   ```
   Force low confidence scenario
   Expected: Issues logged, recommendations given
   ```

---

## Comparison: Before vs After

### Before (60-80% Accuracy)
```
Query: "How do I navigate to t1 page?"
Answer: "You can probably use Actions.goToPage('t1') to navigate..."
Evidence: NONE
Confidence: 60%
Quality: LOW
Issues: Assumed navigation API, no verification
```

### After (90%+ Accuracy)
```
Query: "How do I navigate to t1 page?"
Answer: "In your application, navigation is handled by NavigationService.goToPage('t1'). 
        I found this in Main.script.js line 45 where the button tap handler calls this method."
Evidence: 
  - Code from Main.script.js
  - Component.js tap handler
  - NavigationService documentation
Confidence: 92%
Quality: HIGH
Issues: None
```

---

## Troubleshooting

### If answers are still assumption-based:

1. Check execution history in session log
2. Verify evidence collection is working
3. Check if verification is enabled
4. Ensure confidence threshold is enforced

### If confidence is too low:

1. Check if enough evidence is collected
2. Verify tools are being called correctly
3. Check for errors in execution steps
4. Review pattern matching

### If pattern learning isn't working:

1. Check logs/patterns/ directory exists
2. Verify patterns are being stored
3. Check pattern matching scores
4. Review pattern update logic

---

## Conclusion

This testing guide ensures the Enterprise Session Logging system delivers:

- ✅ No assumption-based responses
- ✅ 90%+ accuracy
- ✅ Complete audit trail
- ✅ Self-correction capability
- ✅ Pattern learning
- ✅ Full debugging visibility

**The system is enterprise-ready when all test scenarios pass and success metrics are met.**

