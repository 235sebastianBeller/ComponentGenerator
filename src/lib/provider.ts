import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="relative bg-zinc-950 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/50 border border-white/10 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Get in touch</p>
      <h2 className="text-3xl font-black text-white tracking-tight mb-1">Let's talk.</h2>
      <p className="text-zinc-500 text-sm mb-8">Drop a message and I'll get back within 24 hours.</p>

      {sent ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-white font-bold text-lg">Message sent!</p>
          <p className="text-zinc-500 text-sm mt-1">I'll be in touch soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'name', label: 'Your name', type: 'text' },
            { id: 'email', label: 'Email address', type: 'email' },
          ].map(({ id, label, type }) => (
            <div key={id}>
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 block mb-1.5">{label}</label>
              <input
                type={type} id={id} name={id} value={formData[id]} onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 block mb-1.5">Message</label>
            <textarea
              id="message" name="message" value={formData.message} onChange={handleChange} required rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200 text-sm uppercase tracking-widest"
          >
            Send Message
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React, { useState } from 'react';

const Card = ({
  name = "Alex Rivera",
  role = "Senior Product Designer",
  bio = "Crafting digital experiences that feel inevitable. 5 years at the intersection of design and code.",
  followers = "12.4k",
  projects = 38,
  likes = "2.1k",
}) => {
  const [following, setFollowing] = useState(false);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden w-80 shadow-2xl shadow-violet-900/30 border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-transparent to-indigo-900/30 pointer-events-none" />
      <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-500" />
      <div className="px-6 pb-6">
        <div className="-mt-10 mb-4 flex items-end justify-between">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg ring-4 ring-slate-900">
            {name.charAt(0)}
          </div>
          <button
            onClick={() => setFollowing(f => !f)}
            className={\`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 \${
              following
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-violet-500/40 hover:-translate-y-0.5'
            }\`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">{name}</h2>
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mt-0.5 mb-3">{role}</p>
        <p className="text-sm text-slate-400 leading-relaxed mb-5">{bio}</p>
        <div className="flex gap-6 pt-4 border-t border-white/10">
          {[['Followers', followers], ['Projects', projects], ['Likes', likes]].map(([label, val]) => (
            <div key={label}>
              <p className="text-white font-bold text-lg">{val}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="relative flex flex-col items-center bg-slate-900 rounded-3xl p-10 shadow-2xl shadow-black/40 border border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Counter</p>
      <div className="relative mb-2">
        <span className="text-8xl font-black text-white tabular-nums tracking-tighter">{count}</span>
        <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl -z-10" />
      </div>
      <p className="text-zinc-600 text-xs uppercase tracking-widest mb-10">current value</p>
      <div className="flex gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white text-xl font-bold hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-150"
        >−</button>
        <button
          onClick={() => setCount(0)}
          className="px-6 h-12 rounded-full bg-white/5 border border-white/10 text-zinc-500 text-xs font-semibold uppercase tracking-widest hover:bg-white/10 transition-all duration-150"
        >Reset</button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-150"
        >+</button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "  const [sent, setSent] = useState(false);";
      case "card":
        return "  const [following, setFollowing] = useState(false);";
      default:
        return "  const [count, setCount] = useState(0);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "  const [sent, setSent] = useState(false);\n  const [loading, setLoading] = useState(false);";
      case "card":
        return "  const [following, setFollowing] = useState(false);\n  const [hovered, setHovered] = useState(false);";
      default:
        return "  const [count, setCount] = useState(0);\n  const [history, setHistory] = useState([0]);";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <Card />
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here") {
    console.log(
      "ANTHROPIC_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Claude."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return anthropic(MODEL);
}
