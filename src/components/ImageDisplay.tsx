"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageDisplayProps {
  imageId: Id<"images">;
  isStaged?: boolean;
  className?: string;
  alt?: string;
}

export function ImageDisplay({ 
  imageId, 
  isStaged = false, 
  className = "", 
  alt = "Image" 
}: ImageDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = await getImageDownloadUrl({ 
          imageId, 
          isStaged 
        });
        
        if (mounted) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error("Failed to load image:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load image");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [imageId, isStaged, getImageDownloadUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            {error || "Failed to load"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      onError={() => {
        setError("Image failed to load");
        setImageUrl(null);
      }}
    />
  );
}