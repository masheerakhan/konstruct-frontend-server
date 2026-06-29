import { detectChecklistFormat } from './formatDetector.js';
import { determineColumnType } from './columnTypeHeuristics.js';

function extractLegend(rawExcelData) {
    let legend = [];
    let found = false;

    // Scan first 15 rows for legend patterns
    const scanLimit = Math.min(rawExcelData.length, 15);
    for (let i = 0; i < scanLimit; i++) {
        const row = rawExcelData[i];
        if (!row || !Array.isArray(row)) continue;
        
        const rowStr = row.join(" ").toUpperCase();
        
        if (rowStr.includes("OK") && rowStr.includes("X") && rowStr.includes("N/A")) {
            legend = ["OK", "X", "N/A"];
            found = true;
            break;
        }
        if (rowStr.includes("YES") && rowStr.includes("NO") && rowStr.includes("N/A")) {
            legend = ["Yes", "No", "N/A"];
            found = true;
            break;
        }
        if (rowStr.includes("SATISFACTORY") && rowStr.includes("DEFECTIVE")) {
            legend = ["OK", "X", "N/A"];
            found = true;
            break;
        }
    }

    if (!found) {
        // We report this fallback outside this function
        return { legend: ["Yes", "No", "N/A"], fallback: true };
    }
    return { legend, fallback: false };
}

export function parseHorizontalExcel(rawExcelData) {
    const format = detectChecklistFormat(rawExcelData);
    
    if (format.type === "VERTICAL" || format.type === "UNSUPPORTED") {
        return {
            success: false,
            type: format.type,
            reason: format.type === "VERTICAL" ? "Vertical templates are not handled by horizontal parser" : format.reason
        };
    }

    const { legend, fallback } = extractLegend(rawExcelData);

    let headers = [];
    
    if (format.type === "HORIZONTAL_TYPE_A") {
        // Find the header row
        let headerRowIdx = -1;
        let headerRowData = [];
        
        const scanLimit = Math.min(rawExcelData.length, 25);
        for (let i = 0; i < scanLimit; i++) {
            const row = rawExcelData[i] || [];
            const rowStrs = row.map(c => String(c || "").trim().toUpperCase());
            
            const strippedSerial = rowStrs.some(s => {
                const stripped = s.replace(/[^A-Z]/g, '');
                return stripped === 'SN' || stripped === 'SLNO' || stripped === 'SRNO' || stripped === 'SNO';
            });
            const hasIdentification = rowStrs.some(s => s.includes("IDENTIFICATION NO"));
            const hasValidEnding = rowStrs.some(s => s.includes("REMARK") || s.includes("ACTION") || s.includes("COMMENTS") || s.includes("STATUS"));
            
            if ((strippedSerial || hasIdentification || hasValidEnding) && rowStrs.filter(s => s.length > 1).length >= 4) {
                // Confirm it's not a Weekly checklist row
                if (!rowStrs.some(s => s.includes("W1") || s.includes("W2") || s.includes("WEEKLY"))) {
                    headerRowIdx = i;
                    headerRowData = row;
                    break;
                }
            }
        }
        
        if (headerRowIdx !== -1) {
            headerRowData.forEach((cellText, idx) => {
                const text = String(cellText || "").trim();
                if (text) {
                    const heuristic = determineColumnType(text);
                    headers.push({
                        text: text,
                        type: heuristic.type,
                        options: heuristic.type === "multiple_choice" ? legend : [],
                        confidence: heuristic.confidence
                    });
                }
            });
        }
    } else if (format.type === "HORIZONTAL_TYPE_B") {
        // Find Check Points
        let mainHeaderRowIdx = -1;
        let mainHeaderRowData = [];
        let subHeaderRowData = [];
        
        const scanLimit = Math.min(rawExcelData.length, 25);
        for (let i = 0; i < scanLimit; i++) {
            const row = rawExcelData[i] || [];
            const rowStrs = row.map(c => String(c || "").trim().toUpperCase());
            
            if (rowStrs.some(s => s.includes("CHECK POINTS") || s.includes("CHECKPOINTS"))) {
                mainHeaderRowIdx = i;
                mainHeaderRowData = row;
                subHeaderRowData = rawExcelData[i + 1] || [];
                break;
            }
        }

        if (mainHeaderRowIdx !== -1) {
            const maxLen = Math.max(mainHeaderRowData.length, subHeaderRowData.length);
            for (let idx = 0; idx < maxLen; idx++) {
                const mainText = String(mainHeaderRowData[idx] || "").trim();
                const subText = String(subHeaderRowData[idx] || "").trim();
                
                if (mainText && mainText.toUpperCase().includes("CHECK POINTS")) {
                    // Start of checkpoints, wait for subText
                    if (subText) {
                        const heuristic = determineColumnType(subText);
                        headers.push({
                            text: subText,
                            type: heuristic.type,
                            options: heuristic.type === "multiple_choice" ? legend : [],
                            confidence: heuristic.confidence
                        });
                    }
                } else if (subText && !mainText) {
                    // Under the checkpoint merge
                    const heuristic = determineColumnType(subText);
                    headers.push({
                        text: subText,
                        type: heuristic.type,
                        options: heuristic.type === "multiple_choice" ? legend : [],
                        confidence: heuristic.confidence
                    });
                } else if (mainText) {
                    // Things like Identification No, Make/Model, Remark
                    const heuristic = determineColumnType(mainText);
                    headers.push({
                        text: mainText,
                        type: heuristic.type,
                        options: heuristic.type === "multiple_choice" ? legend : [],
                        confidence: heuristic.confidence
                    });
                }
            }
        }
    }

    return {
        success: true,
        type: format.type,
        legendDetected: legend,
        fallbackUsed: fallback,
        headers: headers,
        rows: []
    };
}
