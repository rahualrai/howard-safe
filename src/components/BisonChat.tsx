import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal, MessageSquare } from "lucide-react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "What events are happening today?",
  "How do I report a Title IX concern?",
  "When does the library close?",
];

export function BisonChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m0", role: "assistant", content: "Hi! I'm BisonChat. Ask me about campus events, services, and resources." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages(prev => [...prev, userMsg]);

    // TODO: Replace with real campus-knowledge chatbot (e.g., OpenAI + HU knowledge base)
    setLoading(true);
    try {
      // simple mock: pattern match for demo
      let reply = "I'm not sure yet. Try asking about events, dining, or Title IX.";
      const lower = content.toLowerCase();
      if (lower.includes("event")) reply = "Today's highlights: Career Fair at Blackburn Ballroom 2-5pm; Cultural Night at Cramton 7pm.";
      else if (lower.includes("library") || lower.includes("founders")) reply = "Founders Library is open 8:00 AM – 10:00 PM today.";
      else if (lower.includes("title ix")) reply = "You can file a confidential Title IX report at https://www2.howard.edu/title-ix/report.";

      const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: reply };
      await new Promise(r => setTimeout(r, 500));
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare size={18} /> BisonChat
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="h-48 overflow-y-auto rounded-md border p-3 bg-card/50 text-sm space-y-2">
          {messages.map(m => (
            <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
              <div className={
                "inline-block rounded-md px-2 py-1 " +
                (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
              }>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground">BisonChat is thinking…</div>}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ask about events, dining, services…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <Button onClick={() => handleSend()} disabled={loading || input.trim().length === 0}>
            <SendHorizonal size={16} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {SUGGESTIONS.map(s => (
            <Button key={s} size="sm" variant="outline" onClick={() => handleSend(s)}>
              {s}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
