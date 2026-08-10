export const OPENF1_ERROR_CODES = {
  RATE_LIMIT: "OPENF1_RATE_LIMIT",
  UNAVAILABLE: "OPENF1_UNAVAILABLE",
} as const;

export type OpenF1ErrorCode =
  (typeof OPENF1_ERROR_CODES)[keyof typeof OPENF1_ERROR_CODES];

export const OPENF1_USER_MESSAGES = {
  rateLimit: {
    title: "Rate limit reached",
    message:
      "This app uses OpenF1's free API, which limits how many requests we can make. Wait a few seconds and try again.",
  },
  unavailable: {
    title: "OpenF1 unavailable",
    message:
      "We couldn't reach OpenF1 right now. The free API can be slow or briefly offline — try again in a moment.",
  },
} as const;

export function titleForOpenF1Code(
  code: OpenF1ErrorCode | undefined,
): string | undefined {
  if (code === OPENF1_ERROR_CODES.RATE_LIMIT) {
    return OPENF1_USER_MESSAGES.rateLimit.title;
  }

  if (code === OPENF1_ERROR_CODES.UNAVAILABLE) {
    return OPENF1_USER_MESSAGES.unavailable.title;
  }

  return undefined;
}
