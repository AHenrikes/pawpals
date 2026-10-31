import PageState from "@/components/pages/PageState";
import ReturnHeader from "@/components/navigations/ReturnHeader";

export default function ProfileNotFound() {
  return (
    <>
      <ReturnHeader />
      <PageState
        title="Profile not found"
        description="We couldn't find a profile for this username. Check the link or head back home."
      />
    </>
  );
}
