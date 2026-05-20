import { useEffect } from "react";

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} - سند | منصة إعلامية جزائرية` : "سند | منصة إعلامية جزائرية";

    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = metaDesc?.content;
    if (description && metaDesc) {
      metaDesc.content = description;
    } else if (description) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.content = description;
      document.head.appendChild(metaDesc);
    }

    return () => {
      document.title = prevTitle;
      const m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (m && prevDesc !== undefined) m.content = prevDesc;
    };
  }, [title, description]);
}
