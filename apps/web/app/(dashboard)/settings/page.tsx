import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@repo/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTable,
  TypographyXSmall,
} from "@repo/ui/typography";
import { AtomIcon, InfoIcon, PlayCircleIcon } from "lucide-react";
import { ButtonGroup } from "@repo/ui/button-group";

export default function Settings() {
  const countries = [
    { label: "United States", value: "us" },
    { label: "United Kingdom", value: "uk" },
    { label: "Canada", value: "ca" },
  ];

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
              <TypographyH2 className="text-text-foreground">
                Foreground
              </TypographyH2>
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
              <TypographyH2 className="text-text-foreground">
                Primary dim
              </TypographyH2>
            </div>

            <div className="h-64 w-64 bg-primary-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">
                Primary foreground
              </TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-secondary p-4 border rounded-md">
              <TypographyH2>Secondary</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-secondary-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">
                Secondary Foreground
              </TypographyH2>
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
              <TypographyH2 className="text-text-foreground">
                Card foreground (foreground)
              </TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-popover p-4 border rounded-md">
              <TypographyH2>Popover (surface container highest)</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-popover-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">
                Popover Foreground (foreground)
              </TypographyH2>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="h-64 w-64 bg-muted p-4 border rounded-md">
              <TypographyH2>Muted</TypographyH2>
            </div>

            <div className="h-64 w-64 bg-muted-foreground p-4 border rounded-md">
              <TypographyH2 className="text-text-foreground">
                Muted Foreground
              </TypographyH2>
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
            <TypographyH2>
              Pawpals primary (primary dim + primary foreground)
            </TypographyH2>
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
            <TypographyH2>
              Ambient (primary dim + primary foreground)
            </TypographyH2>
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
          <TypographyTable>
            <caption className="text-start">TABLE</caption>
          </TypographyTable>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">INPUT</TypographyH1>

        <div className="flex pl-10 gap-5">
          <Input className="w-96" placeholder="Default" variant={"default"} />
          <Input
            className="w-96"
            placeholder="Secondary"
            variant={"secondary"}
          />
          <Input className="w-96" placeholder="Surface" variant={"input"} />
          <Input className="w-96" placeholder="Popover" variant={"popover"} />
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">INPUT FIELDS</TypographyH1>

        <div className="flex flex-wrap pl-10 gap-5">
          <Field className="w-96 bg-surface rounded-base p-4">
            <FieldLabel htmlFor="input-field-username">Username</FieldLabel>
            <Input
              id="input-field-username"
              type="text"
              placeholder="Enter your username"
            />
            <FieldDescription>
              Choose a unique username for your account.
            </FieldDescription>
          </Field>

          <Field className="w-96 bg-surface rounded-base p-4" data-disabled>
            <FieldLabel htmlFor="input-demo-disabled">Email</FieldLabel>
            <Input
              id="input-demo-disabled"
              type="email"
              placeholder="Email"
              disabled
            />
            <FieldDescription>
              This field is currently disabled.
            </FieldDescription>
          </Field>

          <Field className="w-96 bg-surface rounded-base p-4" data-invalid>
            <FieldLabel htmlFor="input-invalid">Invalid Input</FieldLabel>
            <Input id="input-invalid" placeholder="Error" aria-invalid />
            <FieldDescription>
              This field contains validation errors.
            </FieldDescription>
          </Field>

          <Field className="w-96 bg-surface rounded-base p-4">
            <FieldLabel htmlFor="picture">Picture</FieldLabel>
            <Input id="picture" type="file" />
            <FieldDescription>Select a picture to upload.</FieldDescription>
          </Field>

          <Field
            className="w-96 bg-surface rounded-base p-4"
            orientation="horizontal"
          >
            <Input type="search" placeholder="Search..." />
            <Button>Search</Button>
          </Field>

          <Field className="w-96 bg-surface rounded-base p-4">
            <FieldLabel htmlFor="input-required">
              Required Field <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="input-required"
              placeholder="This field is required"
              required
            />
            <FieldDescription>This field must be filled out.</FieldDescription>
          </Field>

          <Field className="w-96 bg-surface rounded-base p-4">
            <FieldLabel htmlFor="input-badge">
              Webhook URL{" "}
              <Badge variant="secondary" className="ml-auto">
                Beta
              </Badge>
            </FieldLabel>
            <Input
              id="input-badge"
              type="url"
              placeholder="https://api.example.com/webhook"
            />
          </Field>

          <Field className="w-96 bg-surface rounded-base p-4">
            <FieldLabel htmlFor="input-group-url">Website URL</FieldLabel>
            <InputGroup>
              <InputGroupInput id="input-group-url" placeholder="example.com" />
              <InputGroupAddon>
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InfoIcon />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field className="flex w-96 bg-surface rounded-base p-4">
            <FieldLabel htmlFor="input-button-group">Search</FieldLabel>
            <ButtonGroup className="flex gap-2">
              <Input id="input-button-group" placeholder="Type to search..." />
              <Button variant="outline">Search</Button>
            </ButtonGroup>
          </Field>
        </div>

        <div className="flex pl-10 gap-5">
          <FieldGroup className="w-96 bg-surface rounded-base p-4">
            <Field>
              <FieldLabel htmlFor="first-name">First Name</FieldLabel>
              <Input id="first-name" placeholder="Jordan" />
            </Field>

            <Field>
              <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
              <Input id="last-name" placeholder="Lee" />
            </Field>
          </FieldGroup>

          <FieldGroup className="w-96 bg-surface rounded-base p-4">
            <Field>
              <FieldLabel htmlFor="fieldgroup-name">Name</FieldLabel>
              <Input id="fieldgroup-name" placeholder="Jordan Lee" />
            </Field>

            <Field>
              <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
              <Input
                id="fieldgroup-email"
                type="email"
                placeholder="name@example.com"
              />
              <FieldDescription>
                We&apos;ll send updates to this address.
              </FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <Button type="reset" variant="outline">
                Reset
              </Button>
              <Button type="submit">Submit</Button>
            </Field>
          </FieldGroup>

          <form className="w-96 bg-surface rounded-base p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="form-name">Name</FieldLabel>
                <Input
                  id="form-name"
                  type="text"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="form-email">Email</FieldLabel>
                <Input
                  id="form-email"
                  type="email"
                  placeholder="john@example.com"
                />
                <FieldDescription>
                  We&apos;ll never share your email with anyone.
                </FieldDescription>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
                  <Input
                    id="form-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="form-country">Country</FieldLabel>
                  <Select items={countries} defaultValue="us">
                    <SelectTrigger id="form-country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="form-address">Address</FieldLabel>
                <Input
                  id="form-address"
                  type="text"
                  placeholder="123 Main St"
                />
              </Field>

              <Field orientation="horizontal">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">TYPOGRAPH COLORS</TypographyH1>

        <div className="flex flex-col pl-10 gap-5">
          <TypographyP className="text-headline">HEADLINE</TypographyP>
          <TypographyP className="text-text">TEXT</TypographyP>
          <TypographyP className="text-text-foreground">
            TEXT FOREGROUND
          </TypographyP>
          <TypographyP className="text-text-primary">TEXT PRIMARY</TypographyP>
          <TypographyP className="text-text-secondary">
            TEXT SECONDARY
          </TypographyP>
          <TypographyP className="text-text-destructive">
            TEXT DESTRUCTIVE
          </TypographyP>
          <TypographyP className="text-text-muted">TEXT MUTED</TypographyP>
        </div>
      </div>

      <div className="space-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">RADIUS</TypographyH1>

        <div className="flex pl-10 gap-5">
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-sm">
            SMALL
          </div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-md">
            MD
          </div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-base">
            BASE
          </div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-lg">
            LG
          </div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-xl">
            XL
          </div>
          <div className="grid place-content-center bg-primary h-20 w-40 rounded-full">
            FULL
          </div>
        </div>
      </div>

      <div className="spce-y-5 border-l rounded-t-md">
        <TypographyH1 className="p-4">BUTTONS</TypographyH1>

        <div className="space-y-5">
          <div className="flex pl-10 gap-5">
            <Button size={"lg"}>LG SIZE</Button>
            <Button size={"default"}>DEFAULT SIZE</Button>
            <Button size={"sm"}>SM SIZE</Button>
            <Button size={"icon"}>
              <AtomIcon />
            </Button>
            <Button size={"iconPair"}>
              <PlayCircleIcon /> Pair
            </Button>
          </div>

          <div className="flex pl-10 gap-5">
            <Button variant={"default"}>DEFAULT VARIANT</Button>
            <Button variant={"secondary"} className="text-text-foreground">
              SECONDARY VARIANT
            </Button>
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
