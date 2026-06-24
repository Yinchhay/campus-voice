import { getSession } from "next-auth/react";

type TicketMessage = {
  id: number;
  created_at: string;
};

type TicketMessageSocketOptions<TMessage extends TicketMessage> = {
  ticketId: string;
  onMessage: (message: TMessage) => void;
  onError?: (message: string) => void;
};

function toWebSocketOrigin(origin: string) {
  return origin.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

function resolveTicketWebSocketUrl(ticketId: string, token: string) {
  const explicitUrl = process.env.NEXT_PUBLIC_WS_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  let wsOrigin: string;

  if (explicitUrl) {
    wsOrigin = toWebSocketOrigin(explicitUrl.replace(/\/$/, ""));
  } else if (apiUrl && /^https?:\/\//.test(apiUrl)) {
    wsOrigin = toWebSocketOrigin(new URL(apiUrl).origin);
  } else {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = isLocalhost
      ? `${window.location.hostname}:8000`
      : window.location.host;

    wsOrigin = `${protocol}//${host}`;
  }

  return `${wsOrigin}/ws/tickets/${encodeURIComponent(ticketId)}/?token=${encodeURIComponent(token)}`;
}

function isTicketMessage(value: unknown): value is TicketMessage {
  if (!value || typeof value !== "object") return false;

  const maybeMessage = value as Partial<TicketMessage>;
  return (
    typeof maybeMessage.id === "number" &&
    typeof maybeMessage.created_at === "string"
  );
}

export function appendUniqueTicketMessage<TMessage extends TicketMessage>(
  messages: TMessage[],
  message: TMessage,
) {
  if (messages.some((current) => current.id === message.id)) return messages;

  return [...messages, message].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export async function connectTicketMessageSocket<TMessage extends TicketMessage>({
  ticketId,
  onMessage,
  onError,
}: TicketMessageSocketOptions<TMessage>) {
  if (typeof window === "undefined") return null;

  const session = await getSession();
  const token = session?.accessToken;

  if (!token) {
    onError?.("Live updates are unavailable because the session has expired.");
    return null;
  }

  const socket = new WebSocket(resolveTicketWebSocketUrl(ticketId, token));

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as unknown;
      if (isTicketMessage(payload)) onMessage(payload as TMessage);
    } catch {
      onError?.("A live message update could not be read.");
    }
  };

  socket.onerror = () => {
    onError?.("Live message updates are currently unavailable.");
  };

  return socket;
}
