
export const getTopicWeight = (title: string): number => {
    const t = title.toUpperCase();

    // Handle "UNIT I", "UNIT II" etc.
    if (t.startsWith("UNIT")) {
        const parts = t.split(/[:\s-]+/);
        const romMap: { [key: string]: number } = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
            'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
        };
        // Return pure integer (e.g., 1, 2)
        if (parts[1] && romMap[parts[1]]) return romMap[parts[1]];
    }

    // Handle "1.1", "2.1", "10.1" etc.
    const match = t.match(/^(\d+(\.\d+)?)/);
    if (match) {
        return parseFloat(match[1]);
    }

    // Fallback for non-matching titles (put them at the end)
    return 999;
};
