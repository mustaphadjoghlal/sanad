import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export async function uploadImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      (error) => { reject(new Error("فشل رفع الصورة: " + error.message)); },
      async () => { resolve(await getDownloadURL(uploadTask.snapshot.ref)); }
    );
  });
}

/**
 * Shrinks a picture before it is uploaded.
 *
 * A photo straight off a phone is three to six megabytes. Stored that is
 * merely wasteful; served, it is the thing that actually costs — a gallery of
 * thirty covers at five megabytes each is a hundred and fifty megabytes for
 * one page view, and a free Storage plan's daily transfer is gone after a
 * handful of visitors. Resized and re-encoded, the same picture is usually
 * under three hundred kilobytes and looks no different on a screen.
 *
 * Returns the original untouched if anything fails, or if it is already
 * small — a slightly large upload beats a lost one.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    // Already small enough, and re-encoding would only lose quality.
    if (scale === 1 && file.size < 400 * 1024) { bitmap.close(); return file; }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Uploads a gallery image twice: the picture itself, and a small cover for
 * the grid. The grid is what every visitor loads, so it gets the cheap one.
 */
export async function uploadWorkImage(
  uid: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; cover: string }> {
  const stamp = Date.now();
  const full = await compressImage(file, 1600, 0.82);
  const thumb = await compressImage(file, 600, 0.7);

  const url = await uploadImage(`works/${uid}/${stamp}_full.jpg`, full, (p) =>
    onProgress?.(Math.round(p * 0.8))
  );
  const cover = await uploadImage(`works/${uid}/${stamp}_cover.jpg`, thumb, (p) =>
    onProgress?.(80 + Math.round(p * 0.2))
  );
  return { url, cover };
}

export async function uploadAudioSample(
  uid: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, `audio-samples/${uid}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      (error) => { reject(new Error("فشل رفع الملف الصوتي: " + error.message)); },
      async () => { resolve(await getDownloadURL(uploadTask.snapshot.ref)); }
    );
  });
}

export async function uploadProfilePhoto(
  uid: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, `profile-photos/${uid}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      (error) => {
        reject(new Error("فشل رفع الصورة: " + error.message));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
