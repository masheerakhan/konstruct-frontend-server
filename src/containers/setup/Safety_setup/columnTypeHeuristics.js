export const TEXT_FIELD_KEYWORDS = [
    "LOCATION", "IDENTIFICATION", "SERIAL", "MANUFACTURER", 
    "MODEL", "TYPE", "DATE", "EXPIRY", "NUMBER", "RATING", 
    "CAPACITY", "MAKE", "MONTH", "YEAR", "EQUIPMENT", "SN", "S/N", "SR NO"
];

export const CHECKPOINT_KEYWORDS = [
    "CONDITION", "PRESSURE", "PIN", "CLIP", "DAMAGE", 
    "STITCHING", "LATCH", "HOOK", "GUARD", "WEBBING", 
    "BUCKLE", "RIVET", "EYELET", "CABLE", "CLAMP", 
    "CRACK", "PRESENCE", "WIRE", "BODY PAD", "LANYARD", "OK/NOT OK", "EXCESS", "PHYSICAL"
];

export const PARAGRAPH_KEYWORDS = [
    "REMARK", "REMARKS", "COMMENT", "COMMENTS", "ACTION"
];

export function determineColumnType(headerText) {
    if (!headerText) return { type: "short_answer", confidence: 0 };
    
    const upperText = String(headerText).toUpperCase();
    
    // Check paragraphs first
    for (const keyword of PARAGRAPH_KEYWORDS) {
        if (upperText.includes(keyword)) {
            return { type: "paragraph", confidence: 0.95 };
        }
    }

    // Check Checkpoints
    for (const keyword of CHECKPOINT_KEYWORDS) {
        if (upperText.includes(keyword)) {
            return { type: "multiple_choice", confidence: 0.85 };
        }
    }
    
    // Check Text Fields
    for (const keyword of TEXT_FIELD_KEYWORDS) {
        if (upperText.includes(keyword)) {
            return { type: "short_answer", confidence: 0.90 };
        }
    }

    // Heuristics for numbered checkpoints (e.g. "1) Crack & damage")
    if (/^\d+\)/.test(headerText.trim())) {
        return { type: "multiple_choice", confidence: 0.80 };
    }

    // Fallback: Ambiguous columns MUST default to short_answer
    return { type: "short_answer", confidence: 0.50 };
}
