export function OpenAIAvatar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img
      src="/logos/chatgpt.svg"
      alt="ChatGPT"
      className={`${className} shrink-0 rounded-md bg-white object-cover ring-1 ring-zinc-200`}
      draggable={false}
    />
  );
}

export function ClaudeAvatar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img
      src="/logos/claude.svg"
      alt="Claude"
      className={`${className} shrink-0 rounded-full bg-white object-contain p-[2px] ring-1 ring-zinc-200`}
      draggable={false}
    />
  );
}

export function GeminiAvatar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img
      src="/logos/gemini-star.svg"
      alt="Gemini"
      className={`${className} shrink-0 rounded-full bg-white object-contain p-[2px] ring-1 ring-zinc-200`}
      draggable={false}
    />
  );
}
