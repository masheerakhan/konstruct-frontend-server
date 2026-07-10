export function parseMatrixExcel(rawExcelData, formatType) {
    if (!rawExcelData || !Array.isArray(rawExcelData)) {
        return { success: false, reason: "Invalid data format" };
    }

    let headers = [];
    let matrixColumns = 0;

    if (formatType === "MATRIX_DAILY") {
        matrixColumns = 31;
    } else if (formatType === "MATRIX_WEEKLY") {
        matrixColumns = 5;
    } else {
        return { success: false, reason: "Unsupported matrix type" };
    }

    // Heuristic to find the rows containing questions
    // We look for a column that has mostly string text length > 5
    const scanLimit = Math.min(rawExcelData.length, 50);
    
    let bestColIdx = -1;
    let maxStrCount = 0;

    for (let c = 0; c < 10; c++) {
        let strCount = 0;
        for (let r = 0; r < scanLimit; r++) {
            const cell = String(rawExcelData[r]?.[c] || "").trim();
            if (cell.length > 5 && isNaN(cell)) {
                strCount++;
            }
        }
        if (strCount > maxStrCount) {
            maxStrCount = strCount;
            bestColIdx = c;
        }
    }

    if (bestColIdx === -1) {
        return { success: false, reason: "Could not identify question column" };
    }

    let started = false;
    let quantityColIdx = -1;
    for (let r = 0; r < scanLimit; r++) {
        const rowStrs = (rawExcelData[r] || []).map(cell => String(cell || "").trim().toUpperCase());
        
        // Check if we hit the header row
        if (rowStrs.includes("DATE") || rowStrs.includes("W1") || rowStrs.some(s => s.includes("CHECK POINTS") || s.includes("DESCRIPTION") || s.includes("POINTS TO BE CHECKED"))) {
            started = true;
            quantityColIdx = rowStrs.findIndex(s => s.includes("QUANTITY"));
            continue;
        }

        const cellText = String(rawExcelData[r]?.[bestColIdx] || "").trim();
        
        if (started && cellText.length > 2 && isNaN(cellText)) {
            const quantityText = quantityColIdx !== -1 ? String(rawExcelData[r]?.[quantityColIdx] || "").trim() : "";
            // It's a question!
            headers.push({
                text: cellText,
                description: quantityText,
                type: "multiple_choice",
                options: ["OK", "X", "N/A"],
                confidence: 0.9
            });
        }
    }

    // Fallback if 'started' flag logic missed it
    if (headers.length === 0) {
        for (let r = 0; r < scanLimit; r++) {
            const cellText = String(rawExcelData[r]?.[bestColIdx] || "").trim();
            const upper = cellText.toUpperCase();
            if (cellText.length > 5 && isNaN(cellText) && !upper.includes("CHECK POINTS") && !upper.includes("DESCRIPTION")) {
                headers.push({
                    text: cellText,
                    type: "multiple_choice",
                    options: ["OK", "X", "N/A"],
                    confidence: 0.9
                });
            }
        }
    }

    if (headers.length === 0) {
        return { success: false, reason: "Failed to extract matrix questions" };
    }

    return {
        success: true,
        headers: headers,
        matrixColumns: matrixColumns
    };
}
