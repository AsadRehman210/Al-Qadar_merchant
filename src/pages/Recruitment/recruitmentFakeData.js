export const STAGE_PIPELINE = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

export const STAGE_PIPELINE_OPTS = STAGE_PIPELINE.map((s) => ({ id: s, title: s }));

export const JOB_STATUS_OPTS = [
  { id: "Open", title: "Open" },
  { id: "On Hold", title: "On Hold" },
  { id: "Closed", title: "Closed" },
];
