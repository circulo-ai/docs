import type { ActionResponse } from "./schema";

export type SubmitState = {
  error?: string;
  response?: ActionResponse;
};

export const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to send feedback.";
