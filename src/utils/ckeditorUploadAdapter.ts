/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from "src/api/axiosClient";

export function MyUploadAdapter(loader: any) {
  return {
    upload: async () => {
      const file = await loader.file;

      const formData = new FormData();
      formData.append("upload", file); // ⚠️ CKEditor yêu cầu field name = upload

      const res = await axiosClient.post("/upload/ckeditor-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        default: res.data.url, // ⚠️ BẮT BUỘC key = default
      };
    },
  };
}

export function MyUploadAdapterPlugin(editor: any) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
    return MyUploadAdapter(loader);
  };
}

export const hasContent = (html: string) => {
  if (!html) return false;

  // có ảnh
  if (/<img\s+[^>]*src=/.test(html)) return true;

  // có chữ thật
  const textOnly = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();

  return textOnly.length > 0;
};
