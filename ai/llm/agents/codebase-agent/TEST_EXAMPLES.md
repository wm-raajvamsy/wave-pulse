# Codebase Agent - Test Examples

## Test Queries

Here are example queries that should route to the Codebase Agent:

### Example 1: BaseComponent Lifecycle
**Query**: "How does BaseComponent handle lifecycle?"
**Expected**: Routes to Codebase Agent → BaseAgent
**Expected Response**: Explains BaseComponent lifecycle methods (componentDidMount, componentWillUnmount, etc.)

### Example 2: Button Styles
**Query**: "What are the default button styles?"
**Expected**: Routes to Codebase Agent → StyleAgent + ComponentAgent
**Expected Response**: Lists default button styles from theme system

### Example 3: Icon Styling
**Query**: "How do I style icon inside a button? What is the class name?"
**Expected**: Routes to Codebase Agent → StyleDefinitionAgent + ComponentAgent
**Expected Response**: 
- Class name: `.app-button-icon` for container
- Nested classes: `.app-button-icon .app-icon` for root, `.app-button-icon .app-icon-shape` for text color

### Example 4: Two-Way Binding
**Query**: "How does two-way data binding work?"
**Expected**: Routes to Codebase Agent → BindingAgent + VariableAgent
**Expected Response**: Explains binding mechanism, watcher system, data flow

### Example 5: Service Navigation
**Query**: "How does NavigationService work?"
**Expected**: Routes to Codebase Agent → ServiceAgent
**Expected Response**: Explains NavigationService API, implementation, usage

### Example 6: Transpilation
**Query**: "How does the transpiler convert HTML to JSX?"
**Expected**: Routes to Codebase Agent → TranspilerAgent + TransformerAgent
**Expected Response**: Explains transpilation pipeline, widget transformers

### Example 7: Style Definition
**Query**: "What is the class name for styling button text?"
**Expected**: Routes to Codebase Agent → StyleDefinitionAgent
**Expected Response**: `.app-button-text` with rnStyleSelector mapping

### Example 8: Variable System
**Query**: "What is the difference between LiveVariable and ServiceVariable?"
**Expected**: Routes to Codebase Agent → VariableAgent
**Expected Response**: Explains differences, use cases, implementations

## Testing Commands

```bash
# Test via API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How does BaseComponent handle lifecycle?",
    "channelId": "test-channel-id"
  }'

# Test streaming
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the default button styles?",
    "channelId": "test-channel-id"
  }'
```

## Expected Agent Routing

The agent router should automatically select 'codebase' for queries about:
- How things work ("how does X work?")
- Why things are designed that way ("why does X use Y?")
- What something is ("what is X?")
- Where something is located ("where is X implemented?")
- Style definitions and class names
- Codebase architecture

The router should select 'information-retrieval' for queries about:
- Current application UI/widget behavior
- Widget properties/styles in the current app
- Component tree and page structure

The router should select 'file-operations' for queries about:
- File manipulation tasks
- Code modifications
- File system operations

