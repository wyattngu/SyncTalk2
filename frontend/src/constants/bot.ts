export const AI_BOT_SENDER_ID = "ai-bot";

export const AI_BOT_USERNAMES: readonly string[] = ["syncbot", "bot", "ai"];

export function isBotUsername(username: string | undefined | null): boolean {
  if (!username) return false;
  const normalized = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  return AI_BOT_USERNAMES.includes(normalized);
}
