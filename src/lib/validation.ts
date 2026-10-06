import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(60),
  display_name: z.string().trim().min(1).max(40),
  interests: z.array(z.string().trim().min(1).max(40)).max(12),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional(),
});

export const communityPostSchema = z.object({ body: z.string().trim().min(2).max(2000) });
export const inquirySchema = z.object({ subject: z.string().trim().min(3).max(120), body: z.string().trim().min(2).max(4000) });
export const inquiryReplySchema = z.object({ inquiryId: uuidSchema, body: z.string().trim().min(2).max(4000) });
export const communityReportSchema = z.object({ postId: uuidSchema, reason: z.string().trim().min(3).max(500) });
