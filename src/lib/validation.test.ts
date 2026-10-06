import { describe, expect, it } from "vitest";
import { communityPostSchema, contactSchema, inquiryReplySchema, profileSchema } from "./validation";

describe("server input validation", () => {
  it("accepts bounded profile updates and rejects extra interests", () => {
    expect(profileSchema.safeParse({ first_name: "Rivka", display_name: "Riv", interests: ["Friendship"] }).success).toBe(true);
    expect(profileSchema.safeParse({ first_name: "Rivka", display_name: "Riv", interests: Array.from({ length: 13 }, (_, i) => `Topic ${i}`) }).success).toBe(false);
  });
  it("checks contact details and the spam honeypot", () => {
    expect(contactSchema.safeParse({ name: "A Teen", email: "teen@example.com", subject: "A question", message: "I have a question for the team.", website: "" }).success).toBe(true);
    expect(contactSchema.safeParse({ name: "A Teen", email: "not-an-email", subject: "A question", message: "I have a question for the team.", website: "spam" }).success).toBe(false);
  });
  it("bounds private community posts and inquiry replies", () => {
    expect(communityPostSchema.safeParse({ body: "A thoughtful note." }).success).toBe(true);
    expect(communityPostSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
    expect(inquiryReplySchema.safeParse({ inquiryId: "f77bfe52-3d30-482f-bf2d-a415cb738a0e", body: "Could you help with this?" }).success).toBe(true);
    expect(inquiryReplySchema.safeParse({ inquiryId: "bad-id", body: "Could you help with this?" }).success).toBe(false);
  });
});
