import { Button } from "@repo/ui/button";
import { TypographyBlockquote, TypographyH1, TypographyH2, TypographyH3, TypographyH4, TypographyInlineCode, TypographyLarge, TypographyLead, TypographyList, TypographyMuted, TypographyP, TypographySmall, TypographyTable, TypographyXSmall } from "@repo/ui/typography";
import { AtomIcon, PlayCircleIcon } from "lucide-react";

export default function Settings() {
  return (
    <main className="space-y-10 bg-background p-5">
      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4 rounded-l-md">Backgrounds</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <div className="flex gap-5">
            <div className="h-64 w-64 bg-background p-4 border rounded-md">
              <TypographyH2 className="text-text">Background</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Foreground</TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-surface p-4 border rounded-md">
              <TypographyH2>Surface</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-surface-low p-4 border rounded-md">
              <TypographyH2>Surface-low</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-surface-highest p-4 border rounded-md">
              <TypographyH2>Surface-high</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-surface-variant p-4 border rounded-md">
              <TypographyH2>Surface-variant</TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-primary p-4 border rounded-md">
              <TypographyH2>Primary</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-primary-dim p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Primary dim</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-primary-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Primary foreground</TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-secondary p-4 border rounded-md">
              <TypographyH2>Secondary</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-secondary-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Secondary Foreground</TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-accent p-4 border rounded-md">
              <TypographyH2>Accent</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-accent-foreground p-4 border rounded-md">
              <TypographyH2>Accent foreground</TypographyH2>
            </div>
          </div>

          <div className="h-64 w-64 bg-destructive p-4 border rounded-md">
            <TypographyH2>Destructive</TypographyH2>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-card p-4 border rounded-md">
              <TypographyH2>Card (surface)</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-card-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Card foreground (foreground)</TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-popover p-4 border rounded-md">
              <TypographyH2>Popover (surface container highest)</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-popover-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Popover Foreground (foreground)</TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-muted p-4 border rounded-md">
              <TypographyH2>Muted</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-muted-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">Muted Foreground</TypographyH2>
            </div>
          </div>

          <div className="h-64 w-64 bg-input p-4 border rounded-md">
            <TypographyH2>Input</TypographyH2>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">Borders</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <div className="h-64 w-64 border-border p-4 border rounded-md">
            <TypographyH2>Border + XSmall</TypographyH2>
          </div>

          <div className="h-64 w-64 border-ring p-4 border rounded-md">
            <TypographyH2>Ring + Table</TypographyH2>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">Gradients</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <div className="h-64 w-64 bg-pawpals-primary p-4 border rounded-md">
            <TypographyH2>Pawpals primary (primary dim + primary foreground)</TypographyH2>
          </div>

          <div className="h-64 w-64 bg-fur-gradient p-4 border rounded-md">
            <TypographyH2>Fur Gradient</TypographyH2>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">BOX SHADOWS</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <div className="h-64 w-64 shadow-ambient p-4 border rounded-md">
            <TypographyH2>Ambient (primary dim + primary foreground)</TypographyH2>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">HEADERS</TypographyH1>
        
          <div className="flex flex-col pl-10 gap-5">
            <TypographyH1>H1</TypographyH1>
            <TypographyH2>H2</TypographyH2>
            <TypographyH3>H3</TypographyH3>
            <TypographyH4>H4</TypographyH4>
          </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">PARAGRAPH</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <TypographyP>PARAGRAPH</TypographyP>
          <TypographyLead>LEAD</TypographyLead>
          <TypographyMuted>MUTED</TypographyMuted>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">SMALL</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <TypographySmall>SMALL</TypographySmall>
          <TypographyXSmall>XSMALL</TypographyXSmall>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">REST</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <TypographyBlockquote>BLOCKQUOTE</TypographyBlockquote>
          <TypographyList>LIST</TypographyList>
          <TypographyInlineCode>CODE</TypographyInlineCode>
          <TypographyLarge>LARGE</TypographyLarge>
          <TypographyTable><caption className="text-start">TABLE</caption></TypographyTable>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">TYPOGRAPH COLORS</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <TypographyP className="text-headline">HEADLINE</TypographyP>
          <TypographyP className="text-text">TEXT</TypographyP>
          <TypographyP className="text-text-foreground">TEXT FOREGROUND</TypographyP>
          <TypographyP className="text-text-primary">TEXT PRIMARY</TypographyP>
          <TypographyP className="text-text-secondary">TEXT SECONDARY</TypographyP>
          <TypographyP className="text-text-destructive">TEXT DESTRUCTIVE</TypographyP>
          <TypographyP className="text-text-muted">TEXT MUTED</TypographyP>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">RADIUS</TypographyH1>

        <div className="flex pl-10 gap-5">
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-sm">SMALL</div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-md">MD</div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-base">BASE</div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-lg">LG</div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-xl">XL</div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-full">FULL</div>
        </div>
      </div>

      <div className="spce-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">BUTTONS</TypographyH1>
        
        <div className="space-y-5">
          <div className="flex pl-10 gap-5">
            <Button size={"lg"}>LG SIZE</Button>
            <Button size={"default"}>DEFAULT SIZE</Button>
            <Button size={"sm"}>SM SIZE</Button>
            <Button size={"icon"}><AtomIcon /></Button>
            <Button size={"iconPair"}><PlayCircleIcon /> Pair</Button>
          </div>

          <div className="flex pl-10 gap-5">
            <Button variant={"default"}>DEFAULT VARIANT</Button>
            <Button variant={"secondary"} className="text-text-foreground">SECONDARY VARIANT</Button>
            <Button variant={"destructive"}>DESTRUCTIVE VARIANT</Button>
            <Button variant={"outline"}>OUTLINE VARIANT</Button>
            <Button variant={"link"}>LINK VARIANT</Button>
            <Button variant={"ghost"}>GHOST VARIANT</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
