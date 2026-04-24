import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Suspense } from "react";

async function ErrorContent({ searchParams } : Readonly<{ searchParams: Promise<{ error: string }> }>) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Code error: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({ searchParams } : Readonly<{ searchParams: Promise<{ error: string }> }>) {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Sorry, something went wrong.
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
