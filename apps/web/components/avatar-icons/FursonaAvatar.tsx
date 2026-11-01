import { getInitials } from "@/lib/helpers/getInitials";
import { avatarImageSrc } from "@/lib/uploads/avatarImageSrc";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import type { ComponentProps } from "react";

type FursonaAvatarProps = {
  name?: string;
  alt?: string;
  src?: string | null;
  imageWidth?: number;
  size?: ComponentProps<typeof Avatar>["size"];
  className?: string;
};

export default function FursonaAvatar({
  name,
  alt,
  src,
  imageWidth = 96,
  size,
  className,
}: Readonly<FursonaAvatarProps>) {
  return (
    <Avatar size={size} className={className}>
      <AvatarImage
        src={avatarImageSrc(src, imageWidth)}
        alt={alt ?? name ?? ""}
      />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
