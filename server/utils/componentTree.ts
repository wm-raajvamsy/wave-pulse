import { WidgetNode } from '@/types';

/**
 * Recursively find a widget node by ID in the component tree
 * @param node - The root node of the component tree
 * @param targetId - The id of the widget to find
 * @returns The found widget node or null
 */
export function findWidgetById(node: WidgetNode | null, targetId: string | null): WidgetNode | null {
  if (!node || !targetId) {
    return null;
  }

  const nodeId = String(node.id);
  const searchId = String(targetId);

  if (nodeId === searchId) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findWidgetById(child, targetId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Recursively mark the selected element in the component tree and attach properties/styles
 * Unmarks all other elements and marks the one with matching id
 * @param node - The root node of the component tree
 * @param selectedId - The id of the selected element (null to unmark all)
 * @param properties - Optional properties to attach to the selected widget
 * @param styles - Optional styles to attach to the selected widget
 * @returns A new tree with selection marked, or null if node is null
 */
export function markSelectedElement(
  node: WidgetNode | null, 
  selectedId: string | null,
  properties?: Record<string, any>,
  styles?: WidgetNode['styles']
): WidgetNode | null {
  if (!node) {
    return null;
  }

  // Ensure ID comparison works with string conversion (in case of type mismatch)
  const nodeId = String(node.id);
  const targetId = selectedId ? String(selectedId) : null;

  // Create a deep copy to avoid mutating the original
  const newNode: WidgetNode = {
    ...node,
    selected: nodeId === targetId,
    // Attach properties and styles if this is the selected node
    ...(nodeId === targetId && properties ? { properties } : {}),
    ...(nodeId === targetId && styles ? { styles } : {}),
    children: node.children 
      ? node.children
          .map(child => markSelectedElement(child, selectedId, properties, styles))
          .filter((child): child is WidgetNode => child !== null)
      : [],
  };

  return newNode;
}

