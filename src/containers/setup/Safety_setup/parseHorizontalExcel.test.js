import { parseHorizontalExcel } from './parseHorizontalExcel';

describe('parseHorizontalExcel', () => {

    test('returns success: false for VERTICAL', () => {
        const verticalData = [
            ["Format No", "ADL-01"],
            [],
            ["SN", "INSPECTION POINTS", "YES", "NO", "N/A", "REMARK"],
            [1, "Ladder ok?", "", "", "", ""]
        ];

        const result = parseHorizontalExcel(verticalData);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VERTICAL");
        expect(result.reason).toContain("not handled by horizontal parser");
    });

    test('returns success: false for UNSUPPORTED', () => {
        const calendarData = [
            ["Sl.No", "Points to be Checked", "Date"],
            [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        ];

        const result = parseHorizontalExcel(calendarData);
        expect(result.success).toBe(false);
        expect(result.type).toBe("UNSUPPORTED");
    });

    test('parses HORIZONTAL_TYPE_A correctly', () => {
        const typeAData = [
            ["Format No", "ADL-02"],
            [],
            ["SN", "Serial No. of EDB", "Location", "Condition", "Earth Connected", "Remark"],
            [1, "", "", "", "", ""]
        ];

        const result = parseHorizontalExcel(typeAData);
        expect(result.success).toBe(true);
        expect(result.type).toBe("HORIZONTAL_TYPE_A");
        expect(result.headers.length).toBe(6);
        expect(result.headers[0].text).toBe("SN");
        expect(result.headers[0].type).toBe("short_answer");
        
        // "Condition" might be short_answer or multiple_choice based on heuristics
        const conditionHeader = result.headers.find(h => h.text === "Condition");
        expect(conditionHeader.type).toBe("multiple_choice");
        expect(conditionHeader.options).toEqual(["Yes", "No", "N/A"]); // fallback
        
        const remarkHeader = result.headers.find(h => h.text === "Remark");
        expect(remarkHeader.type).toBe("paragraph");
    });

    test('parses HORIZONTAL_TYPE_B correctly', () => {
        const typeBData = [
            ["Format No", "ADL-04"],
            [],
            ["Identification No.:", "Make/Model:", "Check Points", null, null, "Remark"],
            [null, null, "1) Crack damage", "2) Guard presence", "3) Locking system", null]
        ];

        const result = parseHorizontalExcel(typeBData);
        expect(result.success).toBe(true);
        expect(result.type).toBe("HORIZONTAL_TYPE_B");
        expect(result.headers.length).toBe(6);
        
        expect(result.headers[0].text).toBe("Identification No.:");
        expect(result.headers[2].text).toBe("1) Crack damage");
        expect(result.headers[2].type).toBe("multiple_choice"); // Starts with number heuristic
        expect(result.headers[5].text).toBe("Remark");
    });

    test('extracts explicit legend when present', () => {
        const data = [
            ["Instructions: Ok - Satisfactory   X - Defective   N/A - Not Applicable"],
            ["Identification Number", "Safety Clip/Pin", "Gauge Pressure", "Remark"]
        ];

        const result = parseHorizontalExcel(data);
        expect(result.success).toBe(true);
        expect(result.fallbackUsed).toBe(false);
        expect(result.legendDetected).toEqual(["OK", "X", "N/A"]);
        
        const pinHeader = result.headers.find(h => h.text === "Safety Clip/Pin");
        expect(pinHeader.type).toBe("multiple_choice");
        expect(pinHeader.options).toEqual(["OK", "X", "N/A"]);
    });

});
