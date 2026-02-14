import { z } from "zod";

const FEEDBACK_URL_REGEX = /^(\/|https?:\/\/)/i;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_BLOCK_BODY_LENGTH = 512;

const feedbackUrl = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => FEEDBACK_URL_REGEX.test(value), {
    message: "Feedback URL must be a path or an absolute URL.",
  });

const feedbackMessage = z.string().trim().max(MAX_MESSAGE_LENGTH);

export const pageFeedback = z.object({
  url: feedbackUrl,
  opinion: z.enum(["helpful", "not_helpful"]),
  message: feedbackMessage.default(""),
});

export const blockFeedback = z.object({
  url: feedbackUrl,
  blockId: z.string().trim().min(1).max(128),
  blockBody: z.string().trim().max(MAX_BLOCK_BODY_LENGTH).optional(),
  message: feedbackMessage.min(1),
});

export const actionResponse = z.object({
  githubUrl: z.string().url().optional(),
});

export type PageFeedback = z.infer<typeof pageFeedback>;
export type BlockFeedback = z.infer<typeof blockFeedback>;
export type ActionResponse = z.infer<typeof actionResponse>;
export type FeedbackAction<TPayload> = (
  payload: TPayload,
) => Promise<ActionResponse>;
