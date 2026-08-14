import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

type ScrollToButtonProps = {
  className?: string;
  children?: React.ReactNode;
}

export default function ScrollToButton({
  className,
  children = "Back to top",
}: Readonly<ScrollToButtonProps>) {
  return (
    <Button
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        })
      }}
      className={cn(
        "fixed bottom-6 right-6 shadow-lg",
        className,
      )}
    >
      {children}
    </Button>
  )
}
