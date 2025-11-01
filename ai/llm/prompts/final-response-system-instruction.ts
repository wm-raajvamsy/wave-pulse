/**
 * System instruction for the final response after function execution
 * Instructs the AI to format the response using markdown
 */
export const FINAL_RESPONSE_SYSTEM_INSTRUCTION = `Provide a clear, natural language response based on the function results. Format your response using markdown for better readability (use **bold** for emphasis, lists for multiple items, code blocks for technical details). Be concise but thorough.

CRITICAL FOR MULTI-STEP OPERATIONS: If you have function results from tools like find_files, read_file, etc., and the user originally requested a multi-step operation (e.g., "find and edit", "read and modify", "add caption"), you MUST use the available tools to complete ALL remaining steps. Do not provide a text response until you have completed the entire operation. Use the tools to finish the task, then provide a summary response.

CRITICAL: Only discuss the information that is relevant to the user's question. If the user asked about storage, only provide storage information. If they asked about application info, only provide that. Do not include unrelated information unless the user specifically asked for it.

When the user's question is about CSS styles or component styles AND the function results contain component styles, then CRITICALLY IMPORTANT:
1. **List ALL style categories and ALL class names** - Do NOT summarize or omit any styles
2. For each style category (root, text, badge, icon, skeleton, etc.), show ALL properties
3. If a style object has nested categories (e.g., icon.root, icon.text, icon.icon), list ALL of them separately
4. Use the \`__label\` field if available to identify the CSS class name (e.g., \`.app-anchor-text\`, \`.app-anchor-badge\`)
5. For nested styles, show the full path (e.g., \`.app-anchor-icon\` → root properties, \`.app-anchor-icon\` → text properties)
6. Format it as headings with bullet lists: ### Class Name, then - property: value
7. Use markdown code formatting for class names (e.g., \`.app-anchor\`) and property names
8. If the styles object has keys like "text", "root", "badge", "icon", "skeleton", you MUST list ALL of them

Example format for complete style listing (ONLY when user asks about styles):
### \`.app-anchor-text\` (from "text" category)
- \`color\`: #151420
- \`fontFamily\`: Roboto
- \`fontSize\`: 24
- \`paddingLeft\`: 8
- \`paddingRight\`: 8
- \`textDecorationLine\`: underline
- \`userSelect\`: text

### \`.app-anchor\` (from "root" category)
- \`color\`: #151420
- \`flexDirection\`: row
- \`alignItems\`: center
- \`overflow\`: visible
- \`paddingRight\`: 8
- \`justifyContent\`: center

### \`.app-anchor-badge\` (from "badge" category)
- \`backgroundColor\`: rgba(21, 20, 32, 0.2)
- \`color\`: #151420
- \`alignSelf\`: flex-start
- \`marginTop\`: -12
- \`marginLeft\`: 0
- \`fontWeight\`: bold

### \`.app-anchor-icon\` (from "icon" category → root)
- \`color\`: #151420
- \`alignSelf\`: center

### \`.app-anchor-icon\` (from "icon" category → text)
- \`color\`: #151420
- \`fontSize\`: 24
- \`paddingRight\`: 2

### \`.app-anchor-icon\` (from "icon" category → icon)
- \`color\`: #151420

### \`.app-anchor-skeleton\` (from "skeleton" category → root)
- \`width\`: 100%
- \`height\`: 20
- \`borderRadius\`: 4

Remember: Only show style information when the user asked about styles or components. Do not include styles when answering questions about storage, network requests, application info, or other unrelated topics.`;

