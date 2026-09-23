"use client";

import { useState } from "react";
import { EtiquetaChip } from "@/components/ui/Chip";
import {
  AdminScreen,
  MoveColumn,
  PillGroup,
  RemoveButton,
  useAction,
} from "@/components/admin/parts";
import { IconPlus } from "@/components/icons";
import {
  createBanner,
  deleteBanner,
  moveBanner,
  saveSiteSettings,
  updateBanner,
} from "@/lib/actions";
import { uploadPhoto } from "@/lib/upload";
import { ETIQUETA_STYLE_LABELS, ETIQUETA_STYLES } from "@/lib/types";
import type { Banner, Etiqueta, EtiquetaStyle, HeroMode, SiteSettings } from "@/lib/types";

const HERO_OPTIONS = [
  { value: "replace", label: "Substituir destaque" },
  { value: "both", label: "Mostrar os dois" },
];

const CARD_OPTIONS = ETIQUETA_STYLES.map((v) => ({ value: v, label: ETIQUETA_STYLE_LABELS[v] }));

const VISIBLE_OPTIONS = [
  { value: "on", label: "Visível" },
  { value: "off", label: "Oculto" },
];

/**
 * The home's top slot, and the icon in the browser tab.
 *
 * Banners take the highlight's place: with none, the slot falls back to the
 * model marked as the home highlight, so it is never empty.
 */
export function SiteView({
  settings,
  banners,
  etiquetas,
}: {
  settings: SiteSettings;
  banners: Banner[];
  etiquetas: Etiqueta[];
}) {
  const [favicon, setFavicon] = useState(settings.favicon_url);
  const [heroMode, setHeroMode] = useState<HeroMode>(settings.hero_mode);
  const [cardStyle, setCardStyle] = useState<EtiquetaStyle>(settings.hero_card_style);
  const [uploading, setUploading] = useState<string | null>(null);
  const { error, setError, pending, run } = useAction();

  function save(nextFavicon = favicon, nextMode = heroMode, nextCard = cardStyle) {
    run(() => saveSiteSettings(nextFavicon, nextMode, nextCard));
  }

  async function onFile(file: File | undefined, onUrl: (url: string) => void, key: string) {
    if (!file) return;
    setUploading(key);
    const { url, error: err } = await uploadPhoto(file, "site-media");
    setUploading(null);
    if (err || !url) {
      setError(err ?? "Não foi possível enviar a imagem.");
      return;
    }
    onUrl(url);
  }

  const tagOptions = [
    { value: "", label: "Sem etiqueta" },
    ...etiquetas.map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <AdminScreen title="Site e banners" error={error}>
      <div className="flex flex-col gap-3">
        <div className="text-xs text-ink-50">Ícone do site</div>
        <div className="text-xs text-ink-25">
          Aparece na aba do navegador. Vazio usa o ícone padrão.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex-none h-10 px-3 rounded-ui border border-ink-10 bg-paper text-sm text-ink-50 flex items-center justify-center cursor-pointer transition-[border-color,opacity] hover:border-ink-25">
            {uploading === "favicon" ? "Enviando…" : "Enviar"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void onFile(file, (url) => {
                  setFavicon(url);
                  save(url);
                }, "favicon");
              }}
            />
          </label>
          <input
            value={favicon}
            onChange={(e) => setFavicon(e.target.value)}
            onBlur={() => save()}
            placeholder="https://"
            aria-label="Endereço do ícone do site"
            className="flex-1 min-w-[180px] h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              className="flex-none w-10 h-10 rounded-ui object-cover bg-ink-10"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="text-xs text-ink-50">Banners</div>
        <div className="text-xs text-ink-25 max-w-[520px]">
          Ocupam a vaga do destaque na home e deslizam para o lado. Arte recomendada: 1080 × 340 px.
        </div>

        <div className="flex flex-col">
          {banners.map((b, i) => (
            <div
              key={b.id}
              className="py-4 border-b border-ink-03 flex flex-col gap-3"
              style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <MoveColumn
                  name={b.title || "banner"}
                  first={i === 0}
                  last={i === banners.length - 1}
                  disabled={pending}
                  onUp={() => run(() => moveBanner(b.id, "up"))}
                  onDown={() => run(() => moveBanner(b.id, "down"))}
                />

                <label className="flex-none relative w-[96px] h-[60px] rounded-ui overflow-hidden bg-ink-10 flex items-center justify-center cursor-pointer text-ink-50 transition-opacity hover:opacity-60">
                  {b.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : uploading === b.id ? (
                    <span className="text-xs">Enviando…</span>
                  ) : (
                    <IconPlus />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void onFile(
                        file,
                        (url) => run(() => updateBanner(b.id, { image_url: url })),
                        b.id
                      );
                    }}
                  />
                </label>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <input
                    defaultValue={b.title}
                    onBlur={(e) =>
                      e.target.value !== b.title &&
                      run(() => updateBanner(b.id, { title: e.target.value }))
                    }
                    placeholder="Título"
                    aria-label="Título do banner"
                    className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
                  />
                  <input
                    defaultValue={b.subtitle}
                    onBlur={(e) =>
                      e.target.value !== b.subtitle &&
                      run(() => updateBanner(b.id, { subtitle: e.target.value }))
                    }
                    placeholder="Linha de apoio"
                    aria-label="Subtítulo do banner"
                    className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
                  />
                </div>

                <RemoveButton
                  label="Remover banner"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Remover o banner "${b.title || "sem título"}"?`)) {
                      run(() => deleteBanner(b.id));
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <PillGroup
                  size="xs"
                  options={tagOptions}
                  value={b.tag_id ?? ""}
                  disabled={pending}
                  onChange={(v) => run(() => updateBanner(b.id, { tag_id: v || null }))}
                />
                {b.tag ? (
                  <div className="rounded-ui bg-ink-10 p-2">
                    <EtiquetaChip name={b.tag.name} style={b.tag.style} />
                  </div>
                ) : null}
                <PillGroup
                  size="xs"
                  options={VISIBLE_OPTIONS}
                  value={b.visible ? "on" : "off"}
                  disabled={pending}
                  onChange={(v) => run(() => updateBanner(b.id, { visible: v === "on" }))}
                />
              </div>
            </div>
          ))}
          {banners.length === 0 ? (
            <div className="py-14 text-center text-sm text-ink-50">Nenhum banner cadastrado.</div>
          ) : null}
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <div className="text-xs text-ink-50">Cor da tarja do destaque</div>
          <div className="text-xs text-ink-25 max-w-[520px]">
            É a tarja com o nome e o preço sobre a foto do modelo em destaque.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PillGroup
              size="xs"
              options={CARD_OPTIONS}
              value={cardStyle}
              disabled={pending}
              onChange={(v) => {
                const next = v as EtiquetaStyle;
                setCardStyle(next);
                save(favicon, heroMode, next);
              }}
            />
            {/* The chip uses the same four finishes, so previewing with one
                shows the seller exactly the surface the tarja will take. */}
            <div className="rounded-ui bg-ink-10 p-2">
              <EtiquetaChip name="Nome e preço" style={cardStyle} />
            </div>
          </div>

          <div className="mt-3 text-xs text-ink-50">Quando houver banner</div>
          <PillGroup
            options={HERO_OPTIONS}
            value={heroMode}
            disabled={pending}
            onChange={(v) => {
              const mode = v as HeroMode;
              setHeroMode(mode);
              save(favicon, mode);
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => createBanner())}
            className="self-start h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.97] disabled:opacity-40"
          >
            Adicionar banner
          </button>
        </div>
      </div>
    </AdminScreen>
  );
}
