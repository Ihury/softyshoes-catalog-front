import { signIn } from "@/lib/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper text-ink px-6">
      <form action={signIn} className="w-full max-w-[360px] flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? ""} />
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-xl leading-none font-normal">SOFTY</span>
          <span className="text-xs text-ink-50">Admin</span>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Email</span>
          <input
            name="email"
            type="email"
            required
            autoFocus
            placeholder="voce@softy.com"
            className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Senha</span>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
        </label>

        {error ? <div className="text-xs text-ink">Não foi possível entrar. Verifique email e senha.</div> : null}

        <button
          type="submit"
          className="mt-2 h-10 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-[.86] active:scale-[.98]"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
