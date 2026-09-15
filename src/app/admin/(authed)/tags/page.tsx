import { redirect } from "next/navigation";

/** The old "Tags" screen became two: Filtros (the tabs) and Etiquetas (the
 *  labels on a photo). A bookmark lands on the tabs, which is what this screen
 *  used to edit. */
export default function TagsPage() {
  redirect("/admin/filtros");
}
