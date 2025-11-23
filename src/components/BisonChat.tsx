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
  "What programs does Howard University offer?",
  "How do I apply to Howard Law School?",
  "What research opportunities are available?",
  "Tell me about Howard's medical school",
];

export function BisonChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m0", role: "assistant", content: "Hi! I'm BisonChat, powered by Howard University's knowledge base. Ask me about academic programs, admissions, research, and campus resources." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages(prev => [...prev, userMsg]);

    setLoading(true);
    try {
      // Call RAG server
      const response = await fetch('https://essayistic-roberto-nonionizing.ngrok-free.dev/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: content }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      let reply = data.answer || "I couldn't find information about that. Please try rephrasing your question.";
      
      // Always add top 2 sources as clickable links for transparency
      if (data.sources && data.sources.length > 0) {
        reply += "\n\nSources:";
        data.sources.slice(0, 2).forEach((source: { url: string }, idx: number) => {
          reply += `\n• [${new URL(source.url).hostname}](${source.url})`;
        });
      }

      const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: reply };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('RAG server error:', error);
      const errorMsg: ChatMessage = { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting to the knowledge base. Please make sure the RAG server is running on localhost:8000." 
      };
      setMessages(prev => [...prev, errorMsg]);
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