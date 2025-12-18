
/**
 * Handles the logic for applying markdown formatting to text.
 * Returns the new content string.
 */
export const handleFormattingLogic = (type: string, beforeText: string, selectedText: string, afterText: string): string => {
    switch (type) {
        case 'bold':
            return `${beforeText}**${selectedText || 'text'}**${afterText}`
        case 'italic':
            return `${beforeText}*${selectedText || 'text'}*${afterText}`
        case 'h1':
            return `${beforeText}\n# ${selectedText || 'Heading 1'}\n${afterText}`
        case 'h2':
            return `${beforeText}\n## ${selectedText || 'Heading 2'}\n${afterText}`
        case 'list':
            if (selectedText) {
                const lines = selectedText.split('\n')
                const formattedLines = lines.map(line => {
                    // Remove existing markers (1. or - or *)
                    const cleanLine = line.replace(/^\s*(\d+\.|-|\*)\s+/, '')
                    return `- ${cleanLine}`
                })
                return `${beforeText}\n${formattedLines.join('\n')}\n${afterText}`
            }
            return `${beforeText}\n- item\n${afterText}`
        case 'ordered-list':
            if (selectedText) {
                const lines = selectedText.split('\n')
                const formattedLines = lines.map((line, index) => {
                    const cleanLine = line.replace(/^\s*(\d+\.|-|\*)\s+/, '')
                    return `${index + 1}. ${cleanLine}`
                })
                return `${beforeText}\n${formattedLines.join('\n')}\n${afterText}`
            }
            return `${beforeText}\n1. item\n${afterText}`
        case 'code':
            return `${beforeText}\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n${afterText}`
        case 'link':
            return `${beforeText}[${selectedText || 'link text'}](https://example.com)${afterText}`
        case 'table':
            if (selectedText) {
                let lines = selectedText.trim().split('\n')
                // Filter out existing markdown separator lines (| --- | or --- ---)
                const dataLines = lines.filter(line => {
                    const trimmed = line.trim()
                    // If it's just dashes, colons, and pipes/spaces, it's a separator
                    return !(/^[ \-|:]+$/.test(trimmed) && trimmed.includes('-'))
                })

                if (dataLines.length > 0) {
                    const rows = dataLines.map(line => {
                        const cells = line.split(/[,\t|]/).map(c => c.trim()).filter(c => c.length > 0)
                        return `| ${cells.join(' | ')} |`
                    })

                    // Use first line as header
                    const header = rows[0]
                    const colCount = header.split('|').length - 2
                    const underline = `| ${Array(colCount).fill('---').join(' | ')} |`

                    if (rows.length === 1) {
                        return `${beforeText}\n\n${header}\n${underline}\n|  |  |\n\n${afterText}`
                    }
                    return `${beforeText}\n\n${header}\n${underline}\n${rows.slice(1).join('\n')}\n\n${afterText}`
                }
            }
            // Default template
            return `${beforeText}\n\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n| Cell 3 | Cell 4 |\n\n${afterText}`
        default:
            return beforeText + selectedText + afterText
    }
}

/**
 * Calculates the new selection range (cursor position) after formatting.
 */
export const calculateNewSelection = (
    type: string,
    start: number,
    end: number,
    newContentLength: number,
    oldContentLength: number,
    hasSelection: boolean
): { start: number, end: number } => {
    const lengthDiff = newContentLength - oldContentLength

    if (hasSelection) {
        // Keep the entire formatted block selected
        return { start: start, end: end + lengthDiff }
    } else {
        // Place cursor inside the tags for empty placeholder
        let offset = 0
        if (type === 'bold') offset = 2
        else if (type === 'italic') offset = 1
        else if (type === 'code') offset = 4 // ```\n
        else if (type === 'link') offset = 1 // [

        // For tables, headings, lists - move to end
        if (['h1', 'h2', 'list', 'ordered-list', 'table'].includes(type) && !hasSelection) {
            offset = lengthDiff
        }

        return { start: start + offset, end: start + offset }
    }
}
