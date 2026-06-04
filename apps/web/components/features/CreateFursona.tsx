import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import type { FursonaTypes } from "@/types/fursona";
import { AtSign, Check, X, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState } from "react";

type CreateFursonaProps = {
  fursona: FursonaTypes;
  onFursonaChange: (
    field: "display_name" | "username" | "species" | "pronouns" | "bio",
    value: string,
  ) => void;
  isActive: boolean;
  onUsernameAvailability?: (available: boolean) => void;
};

export default function CreateFursona({
  fursona,
  onFursonaChange,
  isActive,
  onUsernameAvailability,
}: Readonly<CreateFursonaProps>) {
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  const display_name = fursona.display_name.trim();
  const species = (fursona.species ?? "").trim();
  const placeholder1 = `${display_name}_${Math.random().toString(36).substring(2, 5)}`;
  const placeholder2 = `${display_name}_${species}`;
  const hasSpecies = species.length > 0;
  const usernameSuggestion = hasSpecies ? placeholder2 : placeholder1;

  const seedUsernameSuggestion = () => {
    if (!fursona.username.trim()) {
      onFursonaChange("username", usernameSuggestion);
    }
  };

  const checkUsername = useDebouncedCallback(async (username: string) => {
    if (!username || username.trim().length < 3) {
      setUsernameAvailable(null);
      onUsernameAvailability?.(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/search/username/${username.trim()}`);
      const available = res.status === 404;
      setUsernameAvailable(available);
      onUsernameAvailability?.(available);
    } catch {
      setUsernameAvailable(null);
      onUsernameAvailability?.(false);
    } finally {
      setCheckingUsername(false);
    }
  }, 500);

  useEffect(() => {
    checkUsername(fursona.username);
  }, [checkUsername, fursona.username]);

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor="fursona-name" variant={"auth"}>
          Displayname
        </Label>

        <Input
          id="fursona-name"
          type="text"
          placeholder="Crypto"
          value={fursona.display_name}
          onChange={(e) => onFursonaChange("display_name", e.target.value)}
          onClick={() => onFursonaChange("username", "")}
          variant={"auth"}
          autoFocus={isActive}
          required
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="fursona-username" variant={"auth"}>
          Username
        </Label>

        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            id="fursona-username"
            type="text"
            placeholder={usernameSuggestion}
            value={fursona.username}
            onChange={(e) => onFursonaChange("username", e.target.value)}
            onFocus={seedUsernameSuggestion}
            variant={"auth"}
            className="pl-8 pr-8"
            error={!checkingUsername && usernameAvailable === false}
            required
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkingUsername && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!checkingUsername && usernameAvailable === true && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {!checkingUsername && usernameAvailable === false && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label htmlFor="fursona-species" variant={"auth"}>
            Species
          </Label>

          <Input
            id="fursona-species"
            type="text"
            placeholder="Wolf"
            value={fursona.species ?? ""}
            onChange={(e) => onFursonaChange("species", e.target.value)}
            variant={"auth"}
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="fursona-pronouns" variant={"auth"}>
            Pronouns
          </Label>

          <Input
            id="fursona-pronouns"
            type="text"
            placeholder="he/him"
            value={fursona.pronouns ?? ""}
            onChange={(e) => onFursonaChange("pronouns", e.target.value)}
            variant={"auth"}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="fursona-bio" variant={"auth"}>
          Bio
        </Label>

        <Textarea
          id="fursona-bio"
          placeholder="Tell us about yourself..."
          value={fursona.bio ?? ""}
          onChange={(e) => onFursonaChange("bio", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
