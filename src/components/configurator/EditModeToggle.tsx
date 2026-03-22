"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function EditModeToggle() {
  const { editMode, setEditMode, viewMode, productType } =
    useConfiguratorStore();

  // Only show for worktops in 3D view
  if (productType !== "worktop" || viewMode !== "3d") return null;

  return (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      className={`flex items-center gap-1.5 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.06] backdrop-blur-md transition-all duration-200 ${
        editMode
          ? "bg-ht-dark text-white ring-ht-gold/30"
          : "bg-white/80 text-ht-dark/50 hover:text-ht-dark/70"
      }`}
      title={editMode ? "Exit dimension editing" : "Edit dimensions on canvas"}
    >
      {/* Resize / dimension-edit icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M10 2h4v4" />
        <path d="M6 14H2v-4" />
        <path d="M14 2L9.5 6.5" />
        <path d="M2 14l4.5-4.5" />
      </svg>
      <span className="hidden sm:inline">
        {editMode ? "Editing" : "Edit"}
      </span>
    </button>
  );
}
