import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@repo/ui/message";
import {
  TypographyP,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { DropdownMenu, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";
import { ThumbsUpButton } from "../buttons/ThumbsUpButton";
import { Separator } from "@repo/ui/separator";
import Link from "next/link";
import PostDropdown from "../dropdowns/Post";
import AvatarIcon from "../avatar-icons/AvatarIcon";

export default function Comments({ content }: Readonly<{ content: any }>) {
  return (
    <>
      {new Array(0, 1, 2, 3, 4, 5).map((idx) => (
        <Collapsible key={idx}>
          <Message className="p-2">
            <AvatarIcon id={content.fursona_id} />

            <MessageContent className="flex-1">
              <MessageHeader className="flex justify-between items-center">
                <Link href={`/@Krypto`} className="flex items-center gap-1">
                  <TypographyP className="text-foreground/80">
                    DisplayName
                  </TypographyP>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size={"icon"} variant={"ghost"} className="p-2">
                      <EllipsisVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <PostDropdown
                    contentId={content.id}
                    userId={content.fursona_id}
                  />
                </DropdownMenu>
              </MessageHeader>

              <TypographyP>Yo Chat bro!</TypographyP>

              <MessageFooter className="flex justify-between">
                <span className="space-x-2">
                  <TypographyXSmall className="text-foreground/40">
                    1d
                  </TypographyXSmall>

                  <CollapsibleTrigger>
                    <TypographySmall className="text-foreground/60">
                      reply
                    </TypographySmall>
                  </CollapsibleTrigger>
                </span>

                <ThumbsUpButton id={`${idx}`} size="icon-sm" count={0} />
              </MessageFooter>

              <CollapsibleContent>
                <h1>Hi</h1>
              </CollapsibleContent>
            </MessageContent>
          </Message>
          <Separator className="h-0.5" />
        </Collapsible>
      ))}
    </>
  );
}
