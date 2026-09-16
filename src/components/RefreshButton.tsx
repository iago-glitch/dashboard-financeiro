"use client";

interface RefreshButtonProps {
  onRefresh: () => void;
  loading: boolean;
}

export function RefreshButton({ onRefresh, loading }: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="text-sm font-medium rounded-md px-3 py-2 transition-opacity disabled:opacity-60"
      style={{ background: "var(--series-1)", color: "#ffffff" }}
    >
      {loading ? "Atualizando..." : "Atualizar dados"}
    </button>
  );
}
