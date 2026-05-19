import { requireAdmin } from "@/lib/auth";
import { ServiceArchitectureDiagram } from "@/components/admin/service-architecture-diagram";

export default async function ServiceDocsPage() {
  await requireAdmin();
  return <ServiceArchitectureDiagram />;
}
