import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

/**
 * Storage answers every rules rejection with the same opaque
 * "does not have permission" line, whatever the real reason was — a path the
 * rules do not cover, a file over the size ceiling, a type they do not
 * accept. Showing that to a member tells them nothing they can act on, so
 * translate it into the two cases they can actually fix.
 */
function describeStorageError(error: unknown, file?: File): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code === "storage/unauthorized") {
    if (file && file.size > 5 * 1024 * 1024) {
      return `الصورة كبيرة جداً (${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت). الحد الأقصى 5 ميغابايت.`;
    }
    return "الرفع مرفوض. تأكد أنك مسجّل الدخول وأن الملف صورة بحجم أقل من 5 ميغابايت.";
  }
  if (code === "storage/canceled") return "أُلغي الرفع.";
  if (code === "storage/retry-limit-exceeded") return "تعذّر الرفع بسبب ضعف الاتصال. أعد المحاولة.";
  return (error as Error)?.message ?? "خطأ غير معروف";
}

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
      (error) => { reject(new Error("فشل رفع الصورة: " + describeStorageError(error, file))); },
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
 * Names a file after the part it plays, so the stored object says which of the
 * two it is. `uploadImage` adds the timestamp and the name; handing it a path
 * that already ended in a file name buried the object one folder too deep,
 * where no rule matched it.
 */
function renamed(file: File, role: string): File {
  const extension = file.name.match(/\.[^.]+$/)?.[0] ?? ".jpg";
  return new File([file], `${role}${extension}`, { type: file.type });
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
  const full = await compressImage(file, 1600, 0.82);
  const thumb = await compressImage(file, 600, 0.7);

  const url = await uploadImage(`works/${uid}`, renamed(full, "full"), (p) =>
    onProgress?.(Math.round(p * 0.8))
  );
  const cover = await uploadImage(`works/${uid}`, renamed(thumb, "cover"), (p) =>
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
      (error) => { reject(new Error("فشل رفع الملف الصوتي: " + describeStorageError(error, file))); },
      async () => { resolve(await getDownloadURL(uploadTask.snapshot.ref)); }
    );
  });
}

/**
 * A profile picture is shown at a hundred pixels or so; a phone photo is
 * three to six megabytes. Shrinking it first keeps it under the rules' five
 * megabyte ceiling — which a raw photo quietly trips, and the rejection that
 * comes back says only "unauthorized".
 */
export async function uploadProfilePhoto(
  uid: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const photo = await compressImage(file, 800, 0.85);
  return uploadImage(`profile-photos/${uid}`, photo, onProgress);
}
