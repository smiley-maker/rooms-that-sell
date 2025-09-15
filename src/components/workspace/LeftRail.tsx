"use client";

import { ChevronDown } from "lucide-react";
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
  stagedCollapsed,
  setStagedCollapsed,
  approvedCollapsed,
  setApprovedCollapsed,
  uploadedCollapsed,
  setUploadedCollapsed,
  onAddImages,
}: LeftRailProps) {
  return (
    <div className="xl:col-span-3 bg-white rounded-xl shadow-sm p-4 flex flex-col min-h-0 h-full">
      <div className="space-y-2 overflow-y-auto flex-1 pr-2 -mr-2 pb-4">
        {/* Staged Section */}
        <div>
          <div
            className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => setStagedCollapsed(!stagedCollapsed)}
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  stagedCollapsed ? "-rotate-90" : ""
                }`}
              />
              <span className="text-xl font-bold text-gray-800">staged</span>
            </div>
            <span className="text-sm font-medium text-gray-500">
              {organizedImages.staged.length}
            </span>
          </div>
          {!stagedCollapsed && (
            <div className="pt-2 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {organizedImages.staged.map((image) => (
                  <div
                    key={image._id}
                    className={`aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden relative ${
                      activeImageId === image._id
                        ? "ring-2 ring-indigo-500"
                        : "hover:ring-1 hover:ring-gray-300"
                    }`}
                    onClick={() => setActiveImageId(image._id)}
                  >
                    <ImageDisplay
                      imageId={image._id}
                      isStaged={true}
                      className="w-full h-full object-cover"
                      alt={image.filename}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Approved Section */}
        <div>
          <div
            className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => setApprovedCollapsed(!approvedCollapsed)}
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  approvedCollapsed ? "-rotate-90" : ""
                }`}
              />
              <span className="text-xl font-bold text-gray-800">approved</span>
            </div>
            <span className="text-sm font-medium text-gray-500">
              {organizedImages.approved.length}
            </span>
          </div>
          {!approvedCollapsed && (
            <div className="pt-2 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-2">
                {organizedImages.approved.map((image) => (
                  <div
                    key={image._id}
                    className={`aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden relative ${
                      activeImageId === image._id
                        ? "ring-2 ring-indigo-500"
                        : "hover:ring-1 hover:ring-gray-300"
                    }`}
                    onClick={() => setActiveImageId(image._id)}
                  >
                    <ImageDisplay
                      imageId={image._id}
                      isStaged={true}
                      className="w-full h-full object-cover"
                      alt={image.filename}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Section */}
        <div>
          <div
            className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => setUploadedCollapsed(!uploadedCollapsed)}
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  uploadedCollapsed ? "-rotate-90" : ""
                }`}
              />
              <span className="text-xl font-bold text-gray-800">uploaded</span>
            </div>
            <span className="text-sm font-medium text-gray-500">
              {organizedImages.uploaded.length}
            </span>
          </div>
          {!uploadedCollapsed && (
            <div className="pt-2 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-2">
                {organizedImages.uploaded.map((image) => (
                  <div
                    key={image._id}
                    className={`aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden relative ${
                      activeImageId === image._id
                        ? "ring-2 ring-indigo-500"
                        : "hover:ring-1 hover:ring-gray-300"
                    }`}
                    onClick={() => setActiveImageId(image._id)}
                  >
                    <ImageDisplay
                      imageId={image._id}
                      isStaged={false}
                      className="w-full h-full object-cover"
                      alt={image.filename}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Images Button */}
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
