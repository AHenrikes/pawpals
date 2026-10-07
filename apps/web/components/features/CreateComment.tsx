import { useState, useRef } from "react";
import { Textarea } from "@repo/ui/textarea";
import { InputGroup } from "@repo/ui/input-group";
import { StickerButton } from "../buttons/StickerButton";
import { SendButton } from "../buttons/SendButton";
import { FileButton } from "../buttons/FileButton";

const MAX_HEIGHT = 200;

export default function CreateComment() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    setValue(textarea.value);

    textarea.style.height = "0px";

    const height = Math.min(textarea.scrollHeight, MAX_HEIGHT);

    textarea.style.height = `${height}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  };

  return (
    <InputGroup className="flex items-end gap-1 rounded-3xl bg-background p-1">
      <StickerButton id="121" size="icon" count={0} />

      <Textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onInput={handleInput}
        placeholder="Write a reply..."
        className="
          min-h-0
          flex-1
          resize-none
          overflow-hidden
          border-none
          px-0
          py-1.5
          text-sm
          leading-5
          focus-visible:ring-0
        "
      />

      {!value && <FileButton id="121" size="icon" count={0} />}

      <SendButton id="121" size="icon" count={0} />
    </InputGroup>
  );
}
