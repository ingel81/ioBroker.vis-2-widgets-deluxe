import Mexp from 'math-expression-evaluator';

const X_TOKEN = { type: 3, show: 'x', token: 'x', value: 'x' };

// Simple check for obviously incomplete formulas
const INCOMPLETE_FORMULA_PATTERN = /[+\-*/^(,]\s*$|^\s*[+*/^)]/;

/**
 * Evaluates a mathematical formula with x as the input value.
 *
 * @param formula - The formula to evaluate (e.g., "x / 1000", "x * 1.8 + 32")
 * @param x - The input value (will be substituted for x in the formula)
 * @returns The calculated result, or null if no transformation needed or on error
 */
export function evaluateFormula(formula: string | undefined, x: number): number | null {
    // No formula or just 'x' means no transformation needed
    if (!formula || formula.trim() === '' || formula.trim() === 'x') {
        return null;
    }

    const trimmed = formula.trim();

    // Skip obviously incomplete formulas (user is still typing)
    if (INCOMPLETE_FORMULA_PATTERN.test(trimmed)) {
        return null;
    }

    // Check for unbalanced parentheses
    let parenCount = 0;
    for (const char of trimmed) {
        if (char === '(') {
            parenCount++;
        }
        if (char === ')') {
            parenCount--;
        }
        if (parenCount < 0) {
            return null; // More closing than opening
        }
    }
    if (parenCount !== 0) {
        return null; // Unbalanced
    }

    try {
        const mexp = new Mexp();
        const result = mexp.eval(formula, [X_TOKEN], { x });

        // Validate result is a finite number
        if (typeof result !== 'number' || !isFinite(result)) {
            return null;
        }

        return result;
    } catch {
        // Silently return null for invalid formulas (user may still be typing)
        return null;
    }
}
