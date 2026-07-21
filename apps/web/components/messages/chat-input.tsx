"use client";

import { useState, useRef, type KeyboardEvent, useLayoutEffect } from "react";
import { PawPrintIcon, PlusIcon, Send } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@repo/ui/input-group";

interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Readonly<ChatInputProps>) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const content = value.trim();

    if (!content || disabled) return;

    await onSend(content);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    await handleSend();
  }

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [value]);

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      <InputGroup className="px-3 space-x-2">
        <InputGroupAddon>
          <InputGroupButton>
            <PlusIcon />
          </InputGroupButton>

          <InputGroupButton>
            <PawPrintIcon />
          </InputGroupButton>
        </InputGroupAddon>

        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          className="min-h-5 max-h-32 p-0 my-3"
          disabled={disabled}
        />

        <InputGroupAddon align={"inline-end"}>
          <InputGroupButton
            type="submit"
            aria-label="Send message"
            disabled={disabled || !value.trim()} 
          >
            <Send />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
