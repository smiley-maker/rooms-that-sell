"use client";

import { CheckSquare, ChevronDown, Layers, Square } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Image } from "@/types/convex";
import { ImageDisplay } from "@/components/ImageDisplay";

type LeftRailProps = {
  organizedImages: {
    staged: Image[];
    approved: Image[];
    uploaded: Image[];
  };
  activeImageId: Id<"images"> | null;
  setActiveImageId: (id: Id<"images">) => void;
  selectedImageIds: Id<"images">[];
  pendingImageIds: Id<"images">[];
  onToggleSelect: (id: Id<"images">) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  stagedCollapsed: boolean;
  setStagedCollapsed: (collapsed: boolean) => void;
  approvedCollapsed: boolean;
  setApprovedCollapsed: (collapsed: boolean) => void;
  uploadedCollapsed: boolean;
  setUploadedCollapsed: (collapsed: boolean) => void;
  onAddImages: () => void;
};

export function LeftRail({
  organizedImages,
  activeImageId,
  setActiveImageId,
  selectedImageIds,
  pendingImageIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  stagedCollapsed,
  setStagedCollapsed,
  approvedCollapsed,
  setApprovedCollapsed,
  uploadedCollapsed,
  setUploadedCollapsed,
  onAddImages,
}: LeftRailProps) {
  const renderSection = (
    label: string,
    images: Image[],
    collapsed: boolean,
    toggleCollapsed: () => void,
  ) => (
    <div key={label}>
      <div
        className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
          <span className="text-xl font-bold text-gray-800">{label}</span>
        </div>
        <span className="text-sm font-medium text-gray-500">{images.length}</span>
      </div>
      {!collapsed && (
        <div className="pt-2 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => {
              const isActive = activeImageId === image._id;
              const isSelected = selectedImageIds.includes(image._id);
              const isPending = pendingImageIds.includes(image._id);
              const previewIsStaged = Boolean(image.stagedUrl) && image.status !== "uploaded";

              return (
                <div
                  key={image._id}
                  className={`relative aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden group transition-all ${
                    isActive
                      ? "ring-2 ring-indigo-500"
                      : isSelected
                        ? "ring-2 ring-indigo-300"
                        : "hover:ring-1 hover:ring-gray-300"
                  }`}
                  onClick={() => setActiveImageId(image._id)}
                >
                  <button
                    type="button"
                    className={`absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-gray-600 shadow-sm transition-colors ${
                      isSelected ? "border-indigo-500 text-indigo-600" : "border-gray-200"
                    }`}
                    title={isSelected ? "Remove from batch" : "Add to batch"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleSelect(image._id);
                    }}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>

                  <ImageDisplay
                    key={`${image._id}-${image.updatedAt}`}
                    imageId={image._id}
                    isStaged={previewIsStaged}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    alt={image.filename}
                  />
                  {isPending && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-xs text-white truncate">
                    {image.filename}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="xl:col-span-3 bg-white rounded-xl shadow-sm p-4 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">images</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
            onClick={onSelectAll}
            title="Select all images"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onClearSelection}
            disabled={selectedImageIds.length === 0}
            title="Clear selection"
          >
            <Square className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-2 -mr-2 pb-4">
        {renderSection("staged", organizedImages.staged, stagedCollapsed, () => setStagedCollapsed(!stagedCollapsed))}
        {renderSection("approved", organizedImages.approved, approvedCollapsed, () => setApprovedCollapsed(!approvedCollapsed))}
        {renderSection("uploaded", organizedImages.uploaded, uploadedCollapsed, () => setUploadedCollapsed(!uploadedCollapsed))}
      </div>

      <div className="pt-4 mt-auto">
        <button
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          onClick={onAddImages}
        >
          add images
        </button>
      </div>
    </div>
  );
}
