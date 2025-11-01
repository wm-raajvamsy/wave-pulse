/**
 * User prompt sent after function results to request a natural language response
 */
export const FINAL_RESPONSE_PROMPT = `Please provide a natural language response based on the function results above. 

IMPORTANT: When the function results contain component styles, you MUST list ALL style categories (text, root, badge, icon, skeleton, etc.) and ALL properties for each category. Do not summarize or omit any styles. Include nested styles (like icon.root, icon.text, icon.icon) as separate sections. Use the __label field to identify CSS class names.`;

