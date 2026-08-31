"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import {
  avatarExtensionFor,
  saveDoctorAvatar,
} from "@/lib/db/clinic-profile";

export type AvatarUploadState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const MAX_BYTES = 4 * 1024 * 1024;

async function requireAdmin() {
  const store = await cookies();
  return isValidSession(store.get(AUTH_COOKIE)?.value);
}

export async function uploadDoctorAvatar(
  _previous: AvatarUploadState,
  formData: FormData,
): Promise<AvatarUploadState> {
  if (!(await requireAdmin())) {
    return { status: "error", message: "Sign in to update the profile photo." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image to upload." };
  }

  if (!avatarExtensionFor(file.type)) {
    return {
      status: "error",
      message: "Use a JPG, PNG, WEBP, or GIF image.",
    };
  }

  if (file.size > MAX_BYTES) {
    return { status: "error", message: "Keep the photo under 4 MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveDoctorAvatar(buffer, file.type);
  } catch {
    return { status: "error", message: "The photo could not be saved." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");

  return { status: "success", message: "Profile photo updated." };
}
