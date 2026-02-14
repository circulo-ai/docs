"use server";

import { createDiscussionThread } from "@/lib/github";

import {
  actionResponse,
  blockFeedback,
  pageFeedback,
  type ActionResponse,
  type BlockFeedback,
  type PageFeedback,
} from "./schema";

const FORWARDED_SUFFIX = "\n\n> Forwarded from docs feedback.";

const normalizePageId = (value: string) => {
  const normalized = value.trim();
  return normalized || "/";
};

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
};

const opinionLabel: Record<PageFeedback["opinion"], string> = {
  helpful: "Helpful",
  not_helpful: "Not Helpful",
};

export const onPageFeedbackAction = async (
  rawFeedback: PageFeedback,
): Promise<ActionResponse> => {
  const feedback = pageFeedback.parse(rawFeedback);
  const summary = feedback.message || "No additional message.";
  const response = await createDiscussionThread(
    normalizePageId(feedback.url),
    `[${opinionLabel[feedback.opinion]}] ${summary}${FORWARDED_SUFFIX}`,
  );
  return actionResponse.parse(response);
};

export const onBlockFeedbackAction = async (
  rawFeedback: BlockFeedback,
): Promise<ActionResponse> => {
  const feedback = blockFeedback.parse(rawFeedback);
  const blockSummary = feedback.blockBody
    ? truncate(feedback.blockBody, 240)
    : feedback.blockId;

  const response = await createDiscussionThread(
    normalizePageId(feedback.url),
    `> ${blockSummary}\n\n${feedback.message}${FORWARDED_SUFFIX}`,
  );

  return actionResponse.parse(response);
};
