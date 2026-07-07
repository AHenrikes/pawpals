"use client";

import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useEffect, useState } from "react";
import { Textarea } from "@repo/ui/textarea";
import { useDebouncedCallback } from "use-debounce";
import { AtSign, Check, X, Loader2 } from "lucide-react";
import { useUsernameManager } from "@/hooks/core/fursonas/useUsernameManager";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field";
import { type FursonaCreate } from "@/types/fursona";

type CreateFursonaProps = {
  fursona: FursonaCreate;
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
  const { checkAvailability, loading } = useUsernameManager();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

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
    onUsernameAvailability?.(false);

    const res = await checkAvailability(username);
    setIsAvailable(res.available);
    onUsernameAvailability?.(res.available);
  }, 500);

  useEffect(() => {
    checkUsername(fursona.username);
  }, [checkUsername, fursona.username]);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fursona-name">Displayname</FieldLabel>

        <Input
          id="fursona-name"
          type="text"
          placeholder="Crypto"
          value={fursona.display_name}
          onChange={(e) => onFursonaChange("display_name", e.target.value)}
          onClick={() => onFursonaChange("username", "")}
          variant={"popover"}
          className="h-12"
          autoFocus={isActive}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="fursona-username">Username</FieldLabel>

        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            id="fursona-username"
            type="text"
            placeholder={usernameSuggestion}
            value={fursona.username}
            onChange={(e) => onFursonaChange("username", e.target.value)}
            onFocus={seedUsernameSuggestion}
            variant={"popover"}
            className="h-12 pl-8 pr-8"
            error={isAvailable === false}
            required
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!loading && isAvailable === true && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {!loading && isAvailable === false && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="fursona-species">Species</FieldLabel>

          <Input
            id="fursona-species"
            type="text"
            placeholder="Wolf"
            value={fursona.species ?? ""}
            onChange={(e) => onFursonaChange("species", e.target.value)}
            variant={"popover"}
            className="h-12"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="fursona-pronouns">Pronouns</FieldLabel>

          <Input
            id="fursona-pronouns"
            type="text"
            placeholder="he/him"
            value={fursona.pronouns ?? ""}
            onChange={(e) => onFursonaChange("pronouns", e.target.value)}
            variant={"popover"}
            className="h-12"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="fursona-bio">Bio</FieldLabel>

        <Textarea
          id="fursona-bio"
          placeholder="Tell us about yourself..."
          value={fursona.bio ?? ""}
          onChange={(e) => onFursonaChange("bio", e.target.value)}
          rows={4}
          className="h-12"
        />
      </Field>
    </FieldGroup>
  );
}
