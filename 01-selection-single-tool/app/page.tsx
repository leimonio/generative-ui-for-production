"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MetricTile, MetricTileSkeleton } from "./MetricTile";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role}: </strong>
            {message.parts.map((part, i) => {
              if (part.type === "text") return <span key={i}>{part.text}</span>;

              if (part.type === "tool-showMetricTile") {
                if (part.state === "input-available") {
                  return <MetricTileSkeleton key={i} />;
                }
                if (part.state === "output-available") {
                  const output = part.output as { label: string; value: string; delta: string };
                  return <MetricTile key={i} {...output} />;
                }
              }
              return null;
            })}
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
          placeholder="show me revenue this month"
        />
      </form>
    </div>
  );
}
