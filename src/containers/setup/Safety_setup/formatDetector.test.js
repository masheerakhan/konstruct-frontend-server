import { detectChecklistFormat } from './formatDetector';

describe('formatDetector', () => {

    test('returns UNSUPPORTED for invalid or null input', () => {
        expect(detectChecklistFormat(null)).toEqual({
            type: "UNSUPPORTED",
            confidence: 0,
            reason: "Invalid data format"
        });
        expect(detectChecklistFormat("Not an array")).toEqual({
            type: "UNSUPPORTED",
            confidence: 0,
            reason: "Invalid data format"
        });
    });

    test('detects VERTICAL checklists correctly', () => {
        const verticalData = [
            ["Format No", "ADL-01"],
            ["Project:", "Site A"],
            [],
            ["SN", "INSPECTION POINTS", "YES", "NO", "N/A", "REMARK"],
            [1, "Is the ladder secure?", "", "", "", ""],
            [2, "Is the trench supported?", "", "", "", ""]
        ];

        const result = detectChecklistFormat(verticalData);
        expect(result.type).toBe("VERTICAL");
        expect(result.confidence).toBeGreaterThan(0.9);
        expect(result.reason).toContain("YES/NO/N/A");
    });

    test('detects HORIZONTAL_TYPE_A checklists correctly (Flat Asset Register)', () => {
        const typeAData = [
            ["Format No", "ADL-02"],
            ["Project:", "Site A"],
            [],
            ["SN", "Serial No. of EDB", "Location", "Condition", "Earth Connected", "Remark"],
            [1, "", "", "", "", ""],
            [2, "", "", "", "", ""]
        ];

        const result = detectChecklistFormat(typeAData);
        expect(result.type).toBe("HORIZONTAL_TYPE_A");
        expect(result.confidence).toBeGreaterThan(0.9);
        expect(result.reason).toContain("flat asset register");
    });

    test('detects HORIZONTAL_TYPE_A checklists correctly (Without SN but with Identification)', () => {
        const typeADataNoSN = [
            ["Format No", "ADL-03"],
            [],
            ["Identification Number", "Manufacturer", "Location", "Harness Webbing", "Status"],
            ["", "", "", "", ""]
        ];

        const result = detectChecklistFormat(typeADataNoSN);
        expect(result.type).toBe("HORIZONTAL_TYPE_A");
        expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('detects HORIZONTAL_TYPE_B checklists correctly (Matrix Check Points)', () => {
        const typeBData = [
            ["Format No", "ADL-04"],
            [],
            ["Identification No.:", "Make/Model:", "Check Points", null, null, "Remark"],
            [null, null, "1) Crack damage", "2) Guard presence", "3) Locking system", null]
        ];

        const result = detectChecklistFormat(typeBData);
        expect(result.type).toBe("HORIZONTAL_TYPE_B");
        expect(result.confidence).toBeGreaterThan(0.9);
        expect(result.reason).toContain("merged Check Points");
    });

    test('detects UNSUPPORTED for Calendar Matrix', () => {
        const calendarData = [
            ["Format No", "ADL-05"],
            ["Sl.No", "Points to be Checked", "Date"],
            [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        ];

        const result = detectChecklistFormat(calendarData);
        expect(result.type).toBe("UNSUPPORTED");
        expect(result.confidence).toBeLessThan(0.5);
        expect(result.reason).toContain("Calendar matrix");
    });

    test('detects UNSUPPORTED for Ambiguous structures', () => {
        const ambiguousData = [
            ["Format No", "ADL-06"],
            ["Just", "some", "random", "headers"],
            ["Without", "any", "identifying", "marks"]
        ];

        const result = detectChecklistFormat(ambiguousData);
        expect(result.type).toBe("UNSUPPORTED");
        expect(result.confidence).toBeLessThan(0.5);
        expect(result.reason).toContain("ambiguous");
    });

});
