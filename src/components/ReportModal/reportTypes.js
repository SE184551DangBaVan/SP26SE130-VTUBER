/**
 * Report type constants for the reporting system.
 * Extend this object when adding new reportable targets (e.g., COMMENT, FAN_HUB).
 */
export const REPORT_TYPE = {
  POST: "POST",
  MEMBER: "MEMBER",
};

export const REPORT_TYPE_LABELS = {
  [REPORT_TYPE.POST]: "Post",
  [REPORT_TYPE.MEMBER]: "Member",
};
