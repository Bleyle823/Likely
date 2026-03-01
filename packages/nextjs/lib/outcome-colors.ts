/**
 * Outcome Color Utilities
 * 
 * Provides consistent color mapping for market outcomes across the application.
 */

const OUTCOME_COLORS = [
  "hsl(142, 76%, 36%)", // Green
  "hsl(0, 84%, 60%)",   // Red
  "hsl(217, 91%, 60%)", // Blue
  "hsl(262, 83%, 58%)", // Purple
  "hsl(25, 95%, 53%)",  // Orange
  "hsl(47, 96%, 53%)",  // Yellow
  "hsl(173, 58%, 39%)", // Teal
  "hsl(339, 82%, 52%)", // Pink
];

/**
 * Get a consistent color for an outcome based on its title and index
 */
export function getOutcomeColor(title: string, index: number): string {
  // Special handling for common binary outcomes
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle === "yes" || lowerTitle === "true") {
    return OUTCOME_COLORS[0]; // Green
  }
  
  if (lowerTitle === "no" || lowerTitle === "false") {
    return OUTCOME_COLORS[1]; // Red
  }
  
  // For other outcomes, use index-based color cycling
  return OUTCOME_COLORS[index % OUTCOME_COLORS.length];
}

/**
 * Get all available outcome colors
 */
export function getAllOutcomeColors(): string[] {
  return [...OUTCOME_COLORS];
}