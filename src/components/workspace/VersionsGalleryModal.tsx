"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { ImageVersion } from "@/types/convex";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Star, Lock, Download, Loader2 } from "lucide-react";

interface VersionsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: Id<"images">;
  currentVersionId?: Id<"imageVersions">;
  onVersionChange?: (versionId: Id<"imageVersions">) => void;
}

type VersionCardProps = {
  version: ImageVersion;
  isActive: boolean;
  isOriginal: boolean;
  onActivate: () => Promise<void>;
  onTogglePin: () => Promise<void>;
  onDownload: () => Promise<void>;
  isActivating: boolean;
  isDownloading: boolean;
};

function VersionCard({
  version,
  isActive,
  isOriginal,
  onActivate,
  onTogglePin,
  onDownload,
  isActivating,
  isDownloading,
}: VersionCardProps) {
  const [thumbError, setThumbError] = useState(false);

  const styleName = version.stylePreset || "Unknown";
  const createdAtLabel = useMemo(() => {
    const date = new Date(version.createdAt);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [version.createdAt]);

  const badges = [
    isOriginal && {
      label: "Original",
      tone: "bg-white/90 text-gray-700",
      icon: Lock,
    },
    isActive && {
      label: "Active",
      tone: "bg-emerald-100 text-emerald-700",
      icon: Check,
    },
  ].filter(Boolean) as Array<{ label: string; tone: string; icon: typeof Check }>;

  const decorBadge = (version.customPrompt?.toLowerCase().includes("decor") || version.customPrompt?.toLowerCase().includes("décor"))
    ? "decor on"
    : "decor off";

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_32px_rgba(15,23,42,0.08)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_48px_rgba(15,23,42,0.12)]",
        isActive && "ring-indigo-200 shadow-[0_28px_52px_rgba(79,70,229,0.16)]"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {version.stagedUrl && !thumbError ? (
          <Image
            src={version.stagedUrl}
            alt={`${styleName} preview`}
            fill
            className="object-cover"
            unoptimized
            onError={() => setThumbError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xs uppercase tracking-wide text-gray-500">
            Preview
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur",
                badge.tone
              )}
            >
              <badge.icon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-4 right-4 h-8 gap-2 rounded-full border border-slate-200 bg-white/80 px-3 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:bg-white",
            version.pinned && "border-amber-200 bg-amber-50 text-amber-600"
          )}
          onClick={onTogglePin}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              version.pinned ? "fill-current" : "stroke-[1.75]"
            )}
          />
          {version.pinned ? "Pinned" : "Pin"}
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900 capitalize">{styleName}</div>
            <div className="text-xs text-slate-500">{createdAtLabel}</div>
          </div>

          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Active
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-600">
            {styleName.toLowerCase()}
          </Badge>
          <Badge variant="secondary" className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-600">
            {decorBadge}
          </Badge>
        </div>

        {version.customPrompt && (
          <p className="line-clamp-2 text-sm italic text-slate-600">“{version.customPrompt}”</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{version.aiModel}</div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                  onClick={onDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Button
              onClick={onActivate}
              disabled={isActive || isActivating}
              variant="default"
              size="sm"
              className={cn(
                "h-9 rounded-full px-5 text-sm font-semibold shadow-sm transition",
                isActive
                  ? "cursor-default bg-slate-200 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {isActivating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isActive ? (
                "Active"
              ) : (
                "Use Version"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VersionsGalleryModal({
  isOpen,
  onClose,
  imageId,
  currentVersionId,
  onVersionChange,
}: VersionsGalleryModalProps) {
  const versions = useQuery(api.images.listImageVersions, { imageId });
  const setCurrentVersion = useMutation(api.images.setCurrentImageVersion);
  const setPinned = useMutation(api.images.setImageVersionPinned);
  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);

  const [activatingId, setActivatingId] = useState<Id<"imageVersions"> | null>(null);
  const [downloadingId, setDownloadingId] = useState<Id<"imageVersions"> | null>(null);
  const [localCurrentId, setLocalCurrentId] = useState(currentVersionId);

  useEffect(() => {
    setLocalCurrentId(currentVersionId);
  }, [currentVersionId]);

  const sorted = useMemo(() => {
    if (!versions || versions.length === 0) return [] as ImageVersion[];
    const original = versions.reduce((earliest, candidate) =>
      candidate.createdAt < earliest.createdAt ? candidate : earliest
    );
    const originalId = original._id;

    return versions
      .slice()
      .sort((a, b) => {
        if (a._id === originalId) return -1;
        if (b._id === originalId) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [versions]);

  if (!sorted.length) {
    return null;
  }

  const handleActivate = async (versionId: Id<"imageVersions">) => {
    if (activatingId) return;
    try {
      setActivatingId(versionId);
      await setCurrentVersion({ imageId, versionId });
      setLocalCurrentId(versionId);
      onVersionChange?.(versionId);
    } finally {
      setActivatingId(null);
    }
  };

  const handleTogglePin = async (version: ImageVersion) => {
    await setPinned({ versionId: version._id, pinned: !version.pinned });
  };

  const downloadVersion = async (filename: string) => {
    const downloadUrl = await getImageDownloadUrl({ imageId, isStaged: true });
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filenameFor = (version: ImageVersion) => {
    const style = version.stylePreset.toLowerCase().replace(/\s+/g, "-");
    const timestamp = new Date(version.createdAt).toISOString().split("T")[0];
    return `${style}-${timestamp}.jpg`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[32px] border border-black/5 bg-[#f4f2ee] px-0 pb-0 shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
        <DialogHeader className="border-b border-black/5 px-10 pb-4 pt-8">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            All Versions ({sorted.length})
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-10 pb-10 pt-8">
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {sorted.map((version) => {
              const isOriginal = version.createdAt === sorted[0].createdAt;
              const isActive = version._id === localCurrentId;
              return (
                <VersionCard
                  key={version._id}
                  version={version}
                  isOriginal={isOriginal}
                  isActive={isActive}
                  isActivating={activatingId === version._id}
                  isDownloading={downloadingId === version._id}
                  onActivate={() => handleActivate(version._id)}
                  onTogglePin={async () => handleTogglePin(version)}
                  onDownload={async () => {
                    const filename = filenameFor(version);
                    setDownloadingId(version._id);
                    try {
                      await downloadVersion(filename);
                    } finally {
                      setDownloadingId(null);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="border-t border-black/5 bg-white px-10 py-4 text-sm text-slate-500">
          {sorted.length} version{sorted.length !== 1 ? "s" : ""} available
        </div>
      </DialogContent>
    </Dialog>
  );
}
