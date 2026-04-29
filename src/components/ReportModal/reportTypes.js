/**
 * Report type constants for the reporting system.
 * Extend this object when adding new reportable targets (e.g., COMMENT, FAN_HUB).
 */
export const REPORT_TYPE = {
  POST: "POST",
  MEMBER: "MEMBER",
  FANHUB: "FANHUB",
};

export const REPORT_TYPE_LABELS = {
  [REPORT_TYPE.POST]: "Post",
  [REPORT_TYPE.MEMBER]: "Member",
  [REPORT_TYPE.FANHUB]: "FanHub",
};

/**
 * Predefined report reasons.
 * The last item is always "Other" which allows free text input.
 */
export const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Hate speech or discrimination",
  "Explicit or inappropriate content",
  "Copyright infringement",
  "False information",
  "Other",
];
