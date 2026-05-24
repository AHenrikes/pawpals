import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import type { FursonaTypes } from "@/types/fursona";
import { AtSign } from "lucide-react";

type CreateFursonaProps = {
  fursona: FursonaTypes;
  onFursonaChange: (
    field: "display_name" | "username" | "species" | "pronouns" | "bio",
    value: string,
  ) => void;
  isActive: boolean;
};

export default function CreateFursona({
  fursona,
  onFursonaChange,
  isActive,
}: Readonly<CreateFursonaProps>) {
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
          <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            id="fursona-username"
            type="text"
            placeholder={usernameSuggestion}
            value={fursona.username}
            onChange={(e) => onFursonaChange("username", e.target.value)}
            onFocus={seedUsernameSuggestion}
            variant={"auth"}
            className="pl-8"
            required
          />
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
