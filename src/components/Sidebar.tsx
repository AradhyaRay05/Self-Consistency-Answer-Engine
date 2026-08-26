"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/types";
import {
  LogoIcon,
  NewChatIcon,
  SearchIcon,
  ImageIcon,
  ExpertsIcon,
  FolderIcon,
  PanelIcon,
  ChatBubbleIcon,
  ChevronUpIcon,
} from "./icons";

interface SidebarProps {
  history: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onCollapse: () => void;
  onInfo?: (msg: string) => void;
}

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  if (new Date(now.getTime() - 86400000).toDateString() === d.toDateString())
    return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function Sidebar({
  history,
  activeId,
  onSelect,
  onNewChat,
  mobileOpen,
  onMobileClose,
  onCollapse,
  onInfo,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query
    ? history.filter((c) => c.question.toLowerCase().includes(query.toLowerCase()))
    : history;
  const groups: [string, Conversation[]][] = [];
  for (const c of filtered) {
    const label = dateLabel(c.createdAt);
    const g = groups.find(([l]) => l === label);
    if (g) g[1].push(c);
    else groups.push([label, [c]]);
  }
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/20 md:hidden" onClick={onMobileClose} aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col bg-[#fbfbfa] transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:border-r md:border-zinc-200/70`}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <LogoIcon />
          <button
            onClick={onCollapse}
            className="hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 md:block"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelIcon />
          </button>
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="mt-4 space-y-0.5 px-2">
          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60"
          >
            <NewChatIcon /> New Chat
          </button>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60"
          >
            <SearchIcon /> Search Chats
          </button>
          <button
            onClick={() => onInfo?.("Image Studio — coming soon")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60"
          >
            <ImageIcon /> Image Studio
          </button>
          <button
            onClick={() => onInfo?.("Experts — coming soon")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60"
          >
            <ExpertsIcon /> Experts
          </button>
          <button
            onClick={() => onInfo?.("Projects — coming soon")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60"
          >
            <FolderIcon /> Projects
          </button>
          {searchOpen && (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your chats…"
              className="ml-8 w-[calc(100%-2.5rem)] rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-zinc-400"
            />
          )}
        </nav>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 && (
            <p className="px-3 pt-1 text-xs text-zinc-400">
              {history.length === 0 ? "No chats yet — ask something!" : "No matching chats."}
            </p>
          )}
          {groups.map(([label, convs]) => (
            <div key={label}>
              <p className="px-3 pb-1 text-xs text-zinc-400">{label}</p>
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                    c.id === activeId
                      ? "bg-zinc-200/70 font-medium text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-200/50"
                  }`}
                >
                  <span className="shrink-0 text-zinc-400">
                    <ChatBubbleIcon />
                  </span>
                  <span className="truncate">{c.question}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200/70 p-3">
          <button
            onClick={() => onInfo?.("Profile — Aradhya Ray (Free plan)")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-zinc-200/50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              A
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-zinc-800">Aradhya Ray</span>
              <span className="block text-xs text-zinc-400">Free</span>
            </span>
            <span className="text-zinc-400">
              <ChevronUpIcon />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
