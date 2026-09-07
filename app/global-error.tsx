"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-PT">
      <body className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md rounded-[12px] border bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">Algo correu mal</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ocorreu um erro inesperado. Tente novamente; se persistir, contacte a equipa SPO.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 h-10 rounded-[12px] bg-blue-800 px-4 text-sm font-medium text-white hover:bg-blue-900"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
