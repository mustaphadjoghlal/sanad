import { FileText, Video, Music, Image as ImageIcon } from "lucide-react";
import type { WorkType } from "../../lib/types";

/** Lives apart from WorkCard so that file exports only its component. */
export const WORK_ICON: Record<WorkType, typeof FileText> = {
  article: FileText,
  video: Video,
  audio: Music,
  image: ImageIcon,
};
