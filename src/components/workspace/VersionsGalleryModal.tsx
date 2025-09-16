"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { ImageVersion } from "@/types/convex";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Star, Download, Loader2, X } from "lucide-react";

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
  onActivate: () => Promise<void>;
  onTogglePin: () => Promise<void>;
  onDownload: () => Promise<void>;
  isActivating: boolean;
  isDownloading: boolean;
  imageUrl?: string | null;
};

function VersionCard({
  version,
  isActive,
  onActivate,
  onTogglePin,
  onDownload,
  isActivating,
  isDownloading,
  imageUrl,
}: VersionCardProps) {
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    setThumbError(false);
  }, [imageUrl, version.stagedUrl]);

  const styleName = version.stylePreset || "Unknown";
  const createdAtLabel = useMemo(() => {
    const date = new Date(version.createdAt);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [version.createdAt]);

  const decorBadge = (version.customPrompt?.toLowerCase().includes("decor") || version.customPrompt?.toLowerCase().includes("décor"))
    ? "decor on"
    : "decor off";

  // Extract room type from context or default to "room"
  const roomType = "living room"; // This would come from your image context

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 w-full min-w-0",
        isActive && "border-blue-500 ring-1 ring-blue-200 shadow-md"
      )}
      style={{ minHeight: '320px' }}
    >
      {/* Image Container */}
      <div className="relative w-full bg-gray-100 flex-shrink-0" style={{ aspectRatio: '4/3' }}>
        {imageUrl && !thumbError ? (
          <Image
            src={imageUrl}
            alt={`${styleName} preview`}
            fill
            className="object-cover"
            unoptimized
            onError={() => setThumbError(true)}
          />
        ) : version.stagedUrl && !thumbError ? (
          <Image
            src={version.stagedUrl}
            alt={`${styleName} preview`}
            fill
            className="object-cover"
            unoptimized
            onError={() => setThumbError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
            Preview unavailable
          </div>
        )}

        {/* Pin Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 p-0 shadow-sm backdrop-blur-sm hover:bg-white",
            version.pinned && "bg-amber-50 text-amber-600 hover:bg-amber-100"
          )}
          onClick={onTogglePin}
        >
          <Star
            className={cn(
              "h-4 w-4",
              version.pinned ? "fill-current" : "stroke-2"
            )}
          />
        </Button>

        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              <Check className="h-3 w-3" />
              Active
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{roomType}</h3>
          <p className="text-sm text-gray-600">{createdAtLabel}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700 border-0">
            {styleName.toLowerCase()}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700 border-0">
            {decorBadge}
          </Badge>
        </div>

        {/* Custom Prompt */}
        {version.customPrompt && (
          <div className="mb-4 flex-1">
            <p className="text-sm text-gray-600 italic line-clamp-2">
              &ldquo;{version.customPrompt}&rdquo;
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                onClick={onDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Button
            onClick={onActivate}
            disabled={isActive || isActivating}
            variant={isActive ? "secondary" : "default"}
            size="sm"
            className={cn(
              "rounded-full px-4 font-medium",
              isActive
                ? "bg-gray-100 text-gray-600 cursor-default hover:bg-gray-100"
                : "bg-gray-900 text-white hover:bg-gray-800"
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
  const getVersionDownloadUrl = useAction(api.images.getImageVersionDownloadUrl);

  const [activatingId, setActivatingId] = useState<Id<"imageVersions"> | null>(null);
  const [downloadingId, setDownloadingId] = useState<Id<"imageVersions"> | null>(null);
  const [localCurrentId, setLocalCurrentId] = useState(currentVersionId);
  const [versionUrls, setVersionUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setVersionUrls({});
  }, [imageId]);

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

  useEffect(() => {
    if (!sorted.length) return;
    const missing = sorted.filter((version) => {
      const id = version._id as string;
      return !(id in versionUrls);
    });
    if (!missing.length) return;

    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        missing.map(async (version) => {
          const id = version._id as string;
          try {
            const url = await getVersionDownloadUrl({ versionId: version._id });
            return [id, url] as const;
          } catch (error) {
            console.error("Failed to load version preview", version._id, error);
            return [id, version.stagedUrl ?? null] as const;
          }
        })
      );

      if (cancelled) return;

      setVersionUrls((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) {
          next[id] = url;
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [sorted, versionUrls, getVersionDownloadUrl]);

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

  const downloadVersion = async (version: ImageVersion, filename: string) => {
    const versionId = version._id as string;
    let downloadUrl = versionUrls[versionId] ?? null;

    if (!downloadUrl) {
      downloadUrl = await getVersionDownloadUrl({ versionId: version._id });
      setVersionUrls((prev) => ({ ...prev, [versionId]: downloadUrl }));
    }

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
      <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[90vh] !h-[90vh] p-0 gap-0 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">All Versions</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className="grid gap-4 min-h-0"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}
          >
            {sorted.map((version) => {
              const versionId = version._id as string;
              const isActive = version._id === localCurrentId;
              return (
                <VersionCard
                  key={version._id}
                  version={version}
                  isActive={isActive}
                  isActivating={activatingId === version._id}
                  isDownloading={downloadingId === version._id}
                  imageUrl={versionUrls[versionId] ?? null}
                  onActivate={() => handleActivate(version._id)}
                  onTogglePin={async () => handleTogglePin(version)}
                  onDownload={async () => {
                    const filename = filenameFor(version);
                    setDownloadingId(version._id);
                    try {
                      await downloadVersion(version, filename);
                    } finally {
                      setDownloadingId(null);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
