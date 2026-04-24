import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import type { FursonaDraft } from "@/types/fursona";
import { AtSign } from "lucide-react";

type CreateFursonaProps = {
  fursona: FursonaDraft;
  onFursonaChange: (field: "name" | "username" | "species" | "pronouns" | "bio", value: string) => void;
  isActive: boolean;
};

export default function CreateFursona({ fursona, onFursonaChange, isActive }: Readonly<CreateFursonaProps>) {
  const firstName = fursona.name.trim();
  const species = (fursona.species ?? "").trim();
  const placeholder1 = `${firstName}_${Math.random().toString(36).substring(2, 5)}`;
  const placeholder3 = `${firstName}_${species}`;
  const hasSpecies = species.length > 0;

  const usernameSuggestion = hasSpecies ? placeholder3 : placeholder1;

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
          value={fursona.name}
          onChange={(e) => onFursonaChange("name", e.target.value)}
          onClick={() => onFursonaChange("username", "")}
          variant={"auth"}
          autoFocus={isActive}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="fursona-species" variant={"auth"}>
            Species
          </Label>
          <Input
            id="fursona-species"
            type="text"
            placeholder="Dog"
            value={fursona.species}
            onChange={(e) => onFursonaChange("species", e.target.value)}
            onClick={() => onFursonaChange("username", "")}
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
            placeholder="they/them"
            value={fursona.pronouns}
            onChange={(e) => onFursonaChange("pronouns", e.target.value)}
            variant={"auth"}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="fursona-username" variant={"auth"}>
          Username
        </Label>
        <div className="relative">
          <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            id="fursona-username"
            type="text"
            placeholder={usernameSuggestion}
            value={fursona.username}
            onFocus={seedUsernameSuggestion}
            onChange={(e) => onFursonaChange("username", e.target.value)}
            variant={"auth"}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2.5 pb-4">
        <Label htmlFor="fursona-bio" variant={"auth"}>
          Bio
        </Label>
        <Textarea
          id="fursona-bio"
          placeholder="A curious explorer from Pawspot"
          value={fursona.bio}
          onChange={(e) => onFursonaChange("bio", e.target.value)}
          rows={4}
          className="min-h-[112px] rounded-3xl border-surface bg-popover px-5 py-3 text-base text-headline shadow-ambient resize-none placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-secondary"
        />
      </div>
    </div>
  );
}
