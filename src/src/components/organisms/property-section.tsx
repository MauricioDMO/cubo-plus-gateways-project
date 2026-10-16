import { properties, SITE_URL } from "@/content/landing";
import { ButtonLink } from "../atoms/button-link";
import { PageContainer } from "../atoms/page-container";
import { SectionHeading } from "../molecules/section-heading";
import { PropertyCard } from "../molecules/property-card";

export function PropertySection() {
  return (
    <section className="py-[90px] max-[850px]:py-[65px] max-[600px]:py-[50px]" id="properties" aria-labelledby="properties-title">
      <PageContainer>
      <SectionHeading eyebrow="MAKE YOURSELF AT HOME" title="Somewhere you’ll want to stay." description="A few handpicked stays. Explore all properties in our full search.">
        <ButtonLink href={`${SITE_URL}/properties/`}>Search all properties</ButtonLink>
      </SectionHeading>
      <h3 id="properties-title" className="sr-only">Featured properties</h3>
      <div className="grid grid-cols-3 items-start gap-[23px] max-[850px]:grid-cols-2 max-[600px]:grid-cols-1 max-[600px]:gap-[22px]" id="property-results">{properties.map((property) => <PropertyCard key={property.name} property={property} />)}</div>
      </PageContainer>
    </section>
  );
}
