import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ArrowLeft } from "lucide-react";

export type fursonaType = {
  name: string,
  username: string,
  species?: string,
  pronouns?: string,
  bio?: string
}

type CreateFursonaProps = {
  fursona: fursonaType;
  onFursonaChange: (field: "name" | "username" | "species" | "pronouns" | "bio", value: string) => void;
  onBack: () => void;
  isActive: boolean;
};

export default function CreateFursona({ fursona, onFursonaChange, onBack, isActive }: Readonly<CreateFursonaProps>) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button
          variant={"none"}
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-headline"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>

        <span className="text-sm uppercase tracking-[0.18em] text-text-muted">Create your default fursona</span>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-medium text-headline">Main fursona</h3>

        <div className="space-y-2.5">
          <Label htmlFor="fursona-name" variant={"auth"}>
            Name
          </Label>
          <Input
            id="fursona-name"
            type="text"
            placeholder="Crypto"
            value={fursona.name}
            onChange={(e) => onFursonaChange("name", e.target.value)}
            variant={"auth"}
            autoFocus={isActive}
            required
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="fursona-username" variant={"auth"}>
            Username
          </Label>
          <Input
            id="fursona-username"
            type="text"
            placeholder="crypto_the_superdog"
            value={fursona.username}
            onChange={(e) => onFursonaChange("username", e.target.value)}
            variant={"auth"}
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
          <Label htmlFor="fursona-bio" variant={"auth"}>
            Bio
          </Label>
          <Input
            id="fursona-bio"
            type="text"
            placeholder="A curious explorer from Pawspot"
            value={fursona.bio}
            onChange={(e) => onFursonaChange("bio", e.target.value)}
            variant={"auth"}
          />
        </div>
      </div>
    </div>
  );
}
