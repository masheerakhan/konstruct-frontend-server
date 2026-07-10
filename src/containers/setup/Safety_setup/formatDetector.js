export function detectChecklistFormat(rawExcelData) {
  if (!rawExcelData || !Array.isArray(rawExcelData)) {
    return {
      type: "UNSUPPORTED",
      confidence: 0,
      reason: "Invalid data format",
    };
  }

  let verticalScore = 0;
  let typeAScore = 0;
  let typeBScore = 0;
  let matrixDailyScore = 0;
  let matrixWeeklyScore = 0;

  let reasons = {
    VERTICAL: "Detected YES/NO/N/A question structure",
    HORIZONTAL_TYPE_A: "Detected flat asset register structure",
    HORIZONTAL_TYPE_B: "Detected merged Check Points matrix structure",
    MATRIX_DAILY: "Detected daily matrix structure",
    MATRIX_WEEKLY: "Detected weekly matrix structure",
    UNSUPPORTED: "Header pattern ambiguous",
  };

  const scanLimit = Math.min(rawExcelData.length, 25);

  for (let i = 0; i < scanLimit; i++) {
    const row = rawExcelData[i];
    if (!row || !Array.isArray(row)) continue;

    const rowStrs = row.map((cell) =>
      String(cell || "")
        .trim()
        .toUpperCase(),
    );
    const rowJoined = rowStrs.join(" ");

    // VERTICAL Check
    const hasYes = rowStrs.includes("YES") || rowStrs.includes("Y");
    const hasNo = rowStrs.includes("NO") || rowStrs.includes("N");
    const hasNA =
      rowStrs.includes("N/A") ||
      rowStrs.includes("NA") ||
      rowStrs.includes("NOT APPLICABLE");

    if (hasYes && hasNo && hasNA) {
      verticalScore = 0.99;
      break;
    }

    // MATRIX DAILY Check
    const numbersFound = rowStrs.filter(
      (s) => !isNaN(parseInt(s)) && parseInt(s) >= 1 && parseInt(s) <= 31,
    );
    if (numbersFound.length >= 15) {
      matrixDailyScore = 0.99;
      break;
    }

    if (
      rowStrs.includes("DATE") ||
      rowStrs.includes("DATES") ||
      rowStrs.includes("SL.NO") ||
      rowStrs.includes("SN")
    ) {
      const nextRow = rawExcelData[i + 1] || [];
      const nextRowStrs = nextRow.map((cell) => String(cell || "").trim());
      if (nextRowStrs.includes("1") && nextRowStrs.includes("15")) {
        matrixDailyScore = 0.99;
        break;
      }
    }

    if (
      rowStrs.includes("1") &&
      rowStrs.includes("15") &&
      (rowStrs.includes("DATE") ||
        rowStrs.includes("DATES") ||
        rowStrs.includes("SL.NO"))
    ) {
      matrixDailyScore = 0.99;
      break;
    }

    // MATRIX WEEKLY Check
    if (rowStrs.some((s) => s === "W1" || s === "W2" || s.includes("WEEKLY"))) {
      matrixWeeklyScore = 0.99;
      break;
    }

    // TYPE B Check
    const hasIdentification = rowStrs.some((s) =>
      s.includes("IDENTIFICATION NO"),
    );
    const hasCheckPoints = rowStrs.some(
      (s) => s.includes("CHECK POINTS") || s.includes("CHECKPOINTS"),
    );

    if (hasIdentification && hasCheckPoints) {
      typeBScore = 0.93;
      continue; // Keep scanning just in case we find YES/NO later
    }

    // TYPE A Check
    const strippedSerial = rowStrs.some((s) => {
      const stripped = s.replace(/[^A-Z]/g, "");
      return (
        stripped === "SN" ||
        stripped === "SLNO" ||
        stripped === "SRNO" ||
        stripped === "SNO"
      );
    });

    const hasValidEnding =
      rowStrs.includes("REMARK") ||
      rowStrs.includes("REMARKS") ||
      rowStrs.includes("ACTION") ||
      rowStrs.includes("COMMENTS") ||
      rowStrs.includes("STATUS");
    const validHeadersCount = rowStrs.filter((s) => s.length > 1).length;

    // If it looks like a flat register
    if (
      (strippedSerial || hasIdentification || hasValidEnding) &&
      validHeadersCount >= 4 &&
      !hasCheckPoints &&
      !hasYes
    ) {
      typeAScore = Math.max(typeAScore, 0.94);
    }
  }

  if (matrixDailyScore > 0.8)
    return {
      type: "MATRIX_DAILY",
      confidence: matrixDailyScore,
      reason: reasons.MATRIX_DAILY,
    };
  if (matrixWeeklyScore > 0.8)
    return {
      type: "MATRIX_WEEKLY",
      confidence: matrixWeeklyScore,
      reason: reasons.MATRIX_WEEKLY,
    };
  if (
    verticalScore > typeAScore &&
    verticalScore > typeBScore &&
    verticalScore > 0.8
  )
    return {
      type: "VERTICAL",
      confidence: verticalScore,
      reason: reasons.VERTICAL,
    };
  if (typeBScore > typeAScore && typeBScore > verticalScore && typeBScore > 0.8)
    return {
      type: "HORIZONTAL_TYPE_B",
      confidence: typeBScore,
      reason: reasons.HORIZONTAL_TYPE_B,
    };
  if (typeAScore > verticalScore && typeAScore > typeBScore && typeAScore > 0.8)
    return {
      type: "HORIZONTAL_TYPE_A",
      confidence: typeAScore,
      reason: reasons.HORIZONTAL_TYPE_A,
    };

  return {
    type: "UNSUPPORTED",
    confidence: 0.43,
    reason: "Header pattern ambiguous",
  };
}
