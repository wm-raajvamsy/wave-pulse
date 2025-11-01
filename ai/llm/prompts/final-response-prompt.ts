/**
 * User prompt sent after function results to request a natural language response
 */
export const FINAL_RESPONSE_PROMPT = `Please provide a natural language response based on the function results above. 

CRITICAL FOR MULTI-STEP OPERATIONS: If the user requested a multi-step operation (like "find a file and edit it", "read a file and change text", "add caption to a widget", "find and modify", etc.), you MUST complete ALL remaining steps using the available tools BEFORE providing your response. Do not just say you will do something - actually execute the tools to complete the task. 

For example:
- If find_files returned file paths and the user asked to edit that file, you MUST first call read_file to read the file contents, understand the structure, then call edit_file with the exact file path from the results to make the requested changes.
- If the user asked to add a caption to a widget in a file, you MUST: (1) read_file to see the file contents, (2) identify the widget structure and find if caption attribute already exists, (3) if caption exists, search for the EXISTING caption attribute (e.g., caption="") and replace its value, (4) if caption doesn't exist, then add it. NEVER add a new caption attribute if one already exists - this creates duplicates.
- If the user asked to read and then modify a file, call read_file first, then use edit_file or write_file to make changes.
- NEVER provide a text response saying "I found the file" or "I will edit it" - actually complete the entire operation before responding.

Always complete all requested operations before providing the final text response.

IMPORTANT: Only include information that is directly relevant to the user's question. If the user asked about storage data, only discuss storage. If they asked about application info, only discuss that. Do not include unrelated information like component styles unless the user specifically asked about them.

IMPORTANT: When the function results contain component styles AND the user asked about styles or component properties, you MUST list ALL style categories (text, root, badge, icon, skeleton, etc.) and ALL properties for each category. Do not summarize or omit any styles. Include nested styles (like icon.root, icon.text, icon.icon) as separate sections. Use the __label field to identify CSS class names.

IMPORTANT: When the function results contain component properties (the "properties" object on the selected element) AND the user asked about component properties, you MUST look up and report the specific property values that the user asks about. The properties object is a simple key-value dictionary/object where property names map directly to their values. For example, if asked about "scrollable", access it as properties["scrollable"] or properties.scrollable. Common properties include: scrollable, disabled, show, name, classname, caption, etc. Always check the properties object when users ask about widget property values.

CRITICAL: If edit_file returns an error about duplicate attributes, you MUST fix it by: (1) read_file again to see the current state, (2) find the existing attribute pattern (e.g., if duplicate caption, search for the first caption="..." and replace only that one with the correct value, or remove duplicates), (3) call edit_file again with the correct search pattern that targets the existing attribute, not adding a new one.`;

