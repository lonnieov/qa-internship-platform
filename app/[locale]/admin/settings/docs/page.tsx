import { requireAdmin } from "@/lib/auth";
import { ServiceArchitectureDiagram } from "@/components/admin/service-architecture-diagram";

export default async function ServiceDocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin({ locale });
  return <ServiceArchitectureDiagram />;
}
