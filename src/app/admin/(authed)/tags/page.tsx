import { getTagUsage, getTags } from "@/lib/data";
import { TagsView } from "@/components/admin/TagsView";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const [tags, usage] = await Promise.all([getTags(), getTagUsage()]);

  return (
    <div className="px-6 md:px-10 md:pt-8 pb-[82px] md:pb-14 max-w-[720px] md:max-w-[800px]">
      <TagsView rows={tags.map((t) => ({ ...t, total: usage[t.id] ?? 0 }))} />
    </div>
  );
}
