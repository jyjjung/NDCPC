/** Matches http(s):// and www. URLs in message text. */
export const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export function normalizeChatUrl(raw: string) {
  const trimmed = raw.trim();
  return trimmed.toLowerCase().startsWith('www.') ? `https://${trimmed}` : trimmed;
}
