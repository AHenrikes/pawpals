import { FursonaProfile } from "@/types/fursona";
import { getInitials } from "@/utils/getInitials";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import {
  TypographyH1,
  TypographyP,
} from "@repo/ui/typography";
import { Skeleton } from "@repo/ui/skeleton";

interface ProfileInfoProps {
  fursona: FursonaProfile;
  loading: boolean;
}

export default function ProfileName({
  fursona,
  loading,
}: Readonly<ProfileInfoProps>) {
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="avatar-skeleton"
          exit={{ opacity: 0 }}
          className="flex flex-col gap-2 md:flex-row md:items-center"
        >
          <Skeleton className="animate-none rounded-full h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44 border-4 border-background shadow-lg shrink-0" />
          <div className="space-y-1 md:mt-10">
            <Skeleton className="h-9 w-52 animate-none border-2 border-background" />
            <Skeleton className="h-6 w-40 animate-none border-2 border-background" />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="avatar-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-2 md:flex-row md:items-center"
        >
          <Avatar
            size="lg"
            className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44 border-4 border-background shadow-lg shrink-0"
          >
            <AvatarImage
              src={fursona.avatar_url ?? undefined}
              alt={fursona.display_name}
            />
            <AvatarFallback>{getInitials(fursona.display_name)}</AvatarFallback>
          </Avatar>

          <div className="space-y-1 px-2 md:mt-10">
            <div>
              <TypographyH1 className="truncate text-xl sm:text-2xl">
                {fursona.display_name}
              </TypographyH1>

              <TypographyP className="text-text-muted truncate">
                @{fursona.username}
              </TypographyP>
            </div>
          </div>

          <div></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
