import { getEtiquetaUsage, getEtiquetas } from "@/lib/data";
import { EtiquetasView } from "@/components/admin/EtiquetasView";

export const dynamic = "force-dynamic";

export default async function EtiquetasPage() {
  const [etiquetas, usage] = await Promise.all([getEtiquetas(), getEtiquetaUsage()]);

  return (
    <div className="px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,3vw,40px)] md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <EtiquetasView rows={etiquetas} usage={usage} />
    </div>
  );
}
