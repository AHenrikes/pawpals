import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Skeleton } from "@repo/ui/skeleton";
import { Button } from "@repo/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { type FursonaProfile } from "@/types/fursona";
import Image from "next/image";
import { Searchbar } from "../dialogs/search/Searchbar";

interface ProfileBannerProps {
  fursona: FursonaProfile;
  loading: boolean;
}

export default function Banner({
  fursona,
  loading,
}: Readonly<ProfileBannerProps>) {
  const router = useRouter();

  return (
    <>
      {/* Profile Banner */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.section
            key="banner-skeleton"
            exit={{ opacity: 0 }}
            className="relative w-full h-52 md:h-100 xl:h-135"
          >
            <Skeleton className="h-full" />
          </motion.section>
        ) : (
          <motion.section
            key="banner-content"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full h-52 md:h-100 xl:h-135"
          >
            <div className="absolute top-0 left-0 flex justify-between items-center w-full h-16 px-2 bg-linear-to-t from-transparent via-transparent to-background backdrop-blur-blur z-30 md:px-6">
              <Button
                size={"icon-lg"}
                variant={"outline"}
                onClick={() => router.back()}
                className="p-1 text-primary"
              >
                <ArrowLeftIcon size={24} />
              </Button>

              <Searchbar />
            </div>

            {fursona.banner_url && (
              <Image
                src={fursona.banner_url}
                alt={`${fursona.display_name}'s banner`}
                fill
                quality={85}
                loading="lazy"
                className="object-cover pointer-events-none z-10"
              />
            )}

            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none z-20" />
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
