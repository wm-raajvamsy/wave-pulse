/**
 * User prompt sent after function results to request a natural language response
 */
export const FINAL_RESPONSE_PROMPT = `Please provide a natural language response based on the function results above. 

IMPORTANT: Only include information that is directly relevant to the user's question. If the user asked about storage data, only discuss storage. If they asked about application info, only discuss that. Do not include unrelated information like component styles unless the user specifically asked about them.

IMPORTANT: When the function results contain component styles AND the user asked about styles or component properties, you MUST list ALL style categories (text, root, badge, icon, skeleton, etc.) and ALL properties for each category. Do not summarize or omit any styles. Include nested styles (like icon.root, icon.text, icon.icon) as separate sections. Use the __label field to identify CSS class names.

IMPORTANT: When the function results contain component properties (the "properties" object on the selected element) AND the user asked about component properties, you MUST look up and report the specific property values that the user asks about. The properties object is a simple key-value dictionary/object where property names map directly to their values. For example, if asked about "scrollable", access it as properties["scrollable"] or properties.scrollable. Common properties include: scrollable, disabled, show, name, classname, caption, etc. Always check the properties object when users ask about widget property values.`;

