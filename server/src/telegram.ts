/** Telegram notifications — SleepMode PM pings you when a preview is ready to approve. */
import { config } from "./config.js";

const API = (m: string) => `https://api.telegram.org/bot${config.telegram.botToken}/${m}`;

let chatId = process.env.TELEGRAM_CHAT_ID || "";

/** Learn the chat id from anyone who has messaged the bot (so no manual config needed). */
export async function resolveChatId(): Promise<string> {
  if (chatId || !config.telegram.botToken) return chatId;
  try {
    const res = await fetch(API("getUpdates"));
    const data = (await res.json()) as { result?: any[] };
    const last = (data.result ?? []).reverse().find((u) => u.message?.chat?.id);
    if (last) chatId = String(last.message.chat.id);
  } catch {
    /* ignore */
  }
  return chatId;
}

export async function notify(text: string): Promise<boolean> {
  if (!config.telegram.botToken) return false;
  const id = await resolveChatId();
  if (!id) return false;
  try {
    const res = await fetch(API("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: id,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
