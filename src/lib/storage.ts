export async function uploadProfilePhoto(
  uid: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "إعدادات Cloudinary غير مكتملة. يرجى التحقق من متغيرات البيئة VITE_CLOUDINARY_CLOUD_NAME و VITE_CLOUDINARY_UPLOAD_PRESET"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `profile-photos/${uid}`);
  formData.append("public_id", `profile_${uid}_${Date.now()}`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url as string);
      } else {
        let message = "فشل رفع الصورة";
        try {
          const errData = JSON.parse(xhr.responseText || "{}");
          if (xhr.status === 401) {
            message =
              "فشل التوثيق مع Cloudinary. تأكد من أن upload_preset مضبوط على 'Unsigned' في لوحة تحكم Cloudinary";
          } else if (errData?.error?.message) {
            message = errData.error.message;
          }
        } catch {
          // keep default message
        }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error("فشل الاتصال بالخادم"));
    xhr.send(formData);
  });
}
