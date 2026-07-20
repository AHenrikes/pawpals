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
    setValue("");
    await onSend(content);
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
3
  return (
    <form
      onSubmit={handleSubmit}
      className="px-4"
    >
      <InputGroup className="px-3 space-x-2">
        <InputGroupAddon>
          <InputGroupButton>
            <PlusIcon size={20} />
          </InputGroupButton>

          <InputGroupButton>
            <PawPrintIcon size={20} />
          </InputGroupButton>
        </InputGroupAddon>

        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          className="min-h-5 max-h-32 p-0 my-1 border-none rounded-none resize-none focus-visible:ring-0"
          disabled={disabled}
        />

        <InputGroupAddon align={"inline-end"}>
          <InputGroupButton
            type="submit" disabled={disabled || !value.trim()} 
            aria-label="Send message">
            <Send size={20} />
          </InputGroupButton>
        </InputGroupAddon>

      </InputGroup>
    </form>
  );
}
