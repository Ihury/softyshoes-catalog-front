"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { IconStar } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export function ReviewSheet({
  open,
  onClose,
  productName,
  myRating,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  myRating: number;
  onSubmit: (rating: number) => void;
}) {
  const [draft, setDraft] = useState(myRating);
  const [error, setError] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setError(false);
        onClose();
      }}
    >
      <div className="w-9 h-0.5 bg-ink-10 mx-auto mb-5 md:hidden" />
      <div className="text-md font-normal text-ink">{productName}</div>
      <div className="mt-2 text-xs text-ink-50">Registre sua reação de 1 a 5 estrelas.</div>
      <div className="mt-5 flex gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label="Nota"
            onClick={() => {
              setDraft(n);
              setError(false);
            }}
            className="w-10 h-10 flex items-center justify-center transition-transform active:scale-90"
          >
            <IconStar size={28} fillColor={draft >= n ? "#090909" : "rgba(9,9,9,.1)"} />
          </button>
        ))}
      </div>
      {error ? (
        <div className="mt-3 text-xs text-ink" style={{ animation: "sfPop .2s ease both" }}>
          Escolha de 1 a 5 estrelas.
        </div>
      ) : null}
      <div className="mt-5 flex gap-3">
        <Button
          variant="solid"
          fullWidth
          onClick={() => {
            if (!draft) {
              setError(true);
              return;
            }
            onSubmit(draft);
          }}
        >
          Registrar reação
        </Button>
        <Button variant="outline" className="bg-paper" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Sheet>
  );
}
