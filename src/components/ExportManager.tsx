"use client";

import { Id } from "../../convex/_generated/dataModel";

interface ExportManagerProps {
  projectId: Id<"projects">;
  selectedImages: Id<"images">[];
}

export function ExportManager(props: ExportManagerProps) {
  void props;
  return null;
}
