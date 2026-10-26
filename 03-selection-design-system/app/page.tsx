"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import type { tools } from "@/lib/tools";
import { ApprovalsQueue, MetricTile, OrdersTable, RegionBreakdown, Skeleton } from "./components";

// Typing the message by the server's tools makes every part.output typed.
type DashboardMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>;

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat<DashboardMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role}: </strong>
            <div>
              {message.parts.map((part, i) => {
                if (part.type === "text") return <span key={i}>{part.text}</span>;

                // Same switch as 01, once per tool. The model has to route; the
                // client only maps a tool name to a component.
                if (part.type === "tool-showMetricTile") {
                  if (part.state === "input-available") return <Skeleton key={i} label="Loading metric…" />;
                  if (part.state === "output-available") return <MetricTile key={i} {...part.output} />;
                }
                if (part.type === "tool-showOrdersTable") {
                  if (part.state === "input-available") return <Skeleton key={i} label="Loading orders…" />;
                  if (part.state === "output-available") return <OrdersTable key={i} {...part.output} />;
                }
                if (part.type === "tool-showApprovalsQueue") {
                  if (part.state === "input-available") return <Skeleton key={i} label="Loading approvals…" />;
                  if (part.state === "output-available") return <ApprovalsQueue key={i} {...part.output} />;
                }
                if (part.type === "tool-showRegionBreakdown") {
                  if (part.state === "input-available") return <Skeleton key={i} label="Loading regions…" />;
                  if (part.state === "output-available") return <RegionBreakdown key={i} {...part.output} />;
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="what needs my attention?"
        />
      </form>
    </div>
  );
}
