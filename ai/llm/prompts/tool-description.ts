/**
 * Description for the get_ui_layer_data tool
 * Used in the tool schema to help the AI understand when to use this tool
 */
export const UI_LAYER_DATA_TOOL_DESCRIPTION = `Get UI Layer data including console logs, network requests, component tree properties, and timeline events. Use this to monitor application state, debug issues, analyze UI component structure, or determine application load times. Timeline events include APP_STARTUP which directly shows application load time (in milliseconds). Network requests can also be used to calculate load times by examining request timestamps and durations. Always use available tools to answer questions about console errors, network activity, performance metrics, load times, or component structure. For questions about application load time, use dataType "timeline" to get APP_STARTUP events.`;

