"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import type { Image as ProjectImage } from "@/types/convex";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Download, AlertTriangle } from "lucide-react";

interface MLSExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  selectedImages: Id<"images">[];
}

export function MLSExportDialog({
  isOpen,
  onClose,
  projectId,
  selectedImages,
}: MLSExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const projectImages = useQuery(api.images.getProjectImages, { projectId });
  const createExport = useAction(api.mlsCompliance.createMLSExport);

  const stagedCounts = useMemo(() => {
    if (!projectImages) return { staged: 0, missing: 0 };
    const selected = projectImages.filter((image: ProjectImage) => selectedImages.includes(image._id));
    const staged = selected.filter((image) => Boolean(image.stagedUrl)).length;
    return {
      staged,
      missing: selected.length - staged,
    };
  }, [projectImages, selectedImages]);

  const handleExport = async () => {
    if (selectedImages.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      const payload = await createExport({
        projectId,
        imageIds: selectedImages,
      });

      const zip = new JSZip();

      for (const item of payload.downloads) {
        const [originalBlob, stagedBlob] = await Promise.all([
          renderMLSImage(item.originalUrl, { watermark: false }),
          renderMLSImage(item.stagedUrl, { watermark: true }),
        ]);

        zip.file(`${item.baseName}_original_mls.jpg`, originalBlob);
        zip.file(`${item.baseName}_staged_mls.jpg`, stagedBlob);
      }

      const archive = await zip.generateAsync({ type: "blob" });
      const filename = buildArchiveFilename(payload.projectName, selectedImages.length);

      triggerDownload(archive, filename);
      onClose();
    } catch (error) {
      console.error("Failed to export MLS package", error);
      alert("We couldn't generate the MLS export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const disabled = selectedImages.length === 0 || stagedCounts.missing > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            MLS Download
          </DialogTitle>
          <DialogDescription>
            Export staged photos with built-in MLS compliance safeguards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {stagedCounts.missing > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {stagedCounts.missing} selected image{stagedCounts.missing === 1 ? " is" : "s are"} still waiting for staging.
                Remove them or finish staging before downloading.
              </AlertDescription>
            </Alert>
          )}

          <section className="space-y-3 text-sm text-muted-foreground">
            <div>
              <h3 className="text-sm font-semibold text-foreground">What you&apos;ll get</h3>
              <ul className="mt-2 space-y-2">
                <li className="flex items-center justify-between">
                  <span>Original photo</span>
                  <Badge variant="outline">1024 × 768 JPG</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>Virtually staged photo</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1024 × 768 JPG</Badge>
                    <Badge variant="secondary">Watermarked</Badge>
                  </div>
                </li>
              </ul>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Format</h3>
              <p>We bundle both versions for each staged image into a single ZIP ready for MLS uploads.</p>
            </div>
          </section>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {selectedImages.length} image{selectedImages.length === 1 ? "" : "s"} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={disabled}>
              {isExporting ? "Preparing…" : "Download ZIP"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MLS_WIDTH = 1024;
const MLS_HEIGHT = 768;

interface RenderImageOptions {
  watermark: boolean;
}

async function renderMLSImage(url: string, options: RenderImageOptions): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  const source = await loadImageSource(blob);
  const { width: imageWidth, height: imageHeight } = getSourceDimensions(source);

  const canvas = document.createElement("canvas");
  canvas.width = MLS_WIDTH;
  canvas.height = MLS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, MLS_WIDTH, MLS_HEIGHT);

  const imageAspect = imageWidth / imageHeight;
  const targetAspect = MLS_WIDTH / MLS_HEIGHT;

  let drawWidth: number;
  let drawHeight: number;

  if (imageAspect > targetAspect) {
    drawWidth = MLS_WIDTH;
    drawHeight = MLS_WIDTH / imageAspect;
  } else {
    drawHeight = MLS_HEIGHT;
    drawWidth = MLS_HEIGHT * imageAspect;
  }

  const offsetX = (MLS_WIDTH - drawWidth) / 2;
  const offsetY = (MLS_HEIGHT - drawHeight) / 2;

  ctx.drawImage(source as CanvasImageSource, offsetX, offsetY, drawWidth, drawHeight);

  if (options.watermark) {
    applyWatermark(ctx);
  }

  const processedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Failed to encode image"));
      }
    }, "image/jpeg", 0.92);
  });

  if (source instanceof ImageBitmap) {
    source.close();
  }

  return processedBlob;
}

function applyWatermark(ctx: CanvasRenderingContext2D) {
  const text = "Virtually Staged";
  const padding = 28;

  ctx.save();
  ctx.font = "32px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.globalAlpha = 0.85;
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  const metrics = ctx.measureText(text);
  const x = Math.max(MLS_WIDTH - metrics.width - padding, padding);
  const y = MLS_HEIGHT - padding;

  ctx.fillText(text, x, y);
  ctx.restore();
}

async function loadImageSource(blob: Blob): Promise<CanvasImageSource> {
  if ("createImageBitmap" in window) {
    return await createImageBitmap(blob);
  }

  return await blobToImage(blob);
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image"));
    };
    img.src = url;
  });
}

function getSourceDimensions(source: CanvasImageSource) {
  if (source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }
  if (source instanceof HTMLImageElement) {
    return {
      width: source.naturalWidth || source.width,
      height: source.naturalHeight || source.height,
    };
  }
  return { width: MLS_WIDTH, height: MLS_HEIGHT };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildArchiveFilename(projectName: string, count: number) {
  const safeProject = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "project";

  const timestamp = new Date().toISOString().split("T")[0];
  return `${safeProject}-mls-export-${count}-images-${timestamp}.zip`;
}
