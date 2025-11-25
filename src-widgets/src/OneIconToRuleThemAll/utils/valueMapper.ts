/**
 * Maps a value to a string based on mapping object
 *
 * @param value - The value to map
 * @param mapping - Mapping object { "key": "value" }
 * @param fallback - Fallback string when no mapping found
 * @returns Mapped string or fallback
 */
export function mapValue(
    value: unknown,
    mapping: Record<string, string> | undefined,
    fallback: string,
): string {
    // No mapping defined
    if (!mapping || Object.keys(mapping).length === 0) {
        return fallback;
    }

    // Convert value to string
    const valueStr = String(value);

    // Mapping exists?
    if (valueStr in mapping) {
        return mapping[valueStr];
    }

    // No mapping found -> fallback
    return fallback;
}

/**
 * Parses JSON string to mapping object
 *
 * @param jsonString - JSON string from config
 * @returns Mapping object or undefined on error
 */
export function parseValueMapping(jsonString: string | undefined): Record<string, string> | undefined {
    if (!jsonString || jsonString.trim() === '') {
        return undefined;
    }

    try {
        const parsed = JSON.parse(jsonString) as unknown;

        // Validation: Must be object
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
            console.warn('Value mapping must be an object:', jsonString);
            return undefined;
        }

        // Validation: All values must be strings
        const mapping: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof value !== 'string') {
                console.warn(`Value mapping for key "${key}" must be a string:`, value);
                continue;
            }
            mapping[key] = value;
        }

        return Object.keys(mapping).length > 0 ? mapping : undefined;
    } catch (error) {
        console.error('Failed to parse value mapping:', jsonString, error);
        return undefined;
    }
}
