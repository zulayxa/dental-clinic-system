"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Camera } from "lucide-react";

import {
  uploadDoctorAvatar,
  type AvatarUploadState,
} from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

const initialState: AvatarUploadState = { status: "idle" };

export function DoctorAvatarUpload({
  src,
  name,
}: {
  src: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(
    uploadDoctorAvatar,
    initialState,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (state.status === "success" && preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [state.status, preview]);

  const displaySrc = preview ?? src;

  return (
    <form ref={formRef} action={formAction} className="shrink-0">
      <input
        ref={fileRef}
        id="doctor-avatar-file"
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          if (preview) URL.revokeObjectURL(preview);
          setPreview(URL.createObjectURL(file));
          formRef.current?.requestSubmit();
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "group relative block size-14 overflow-hidden rounded-xl border border-cyan-300/45 bg-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] sm:size-[4.25rem] sm:rounded-2xl",
          "focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:outline-none",
          pending && "opacity-70",
        )}
        aria-label="Upload profile photo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displaySrc}
          alt={name}
          className="absolute inset-0 size-full object-cover object-[center_18%]"
        />
        <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[#01113a]/80 via-transparent to-transparent pb-1 opacity-100 transition-opacity sm:pb-1.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
          <Camera className="size-3.5 text-cyan-100" />
        </span>
      </button>
      {state.status === "error" ? (
        <p className="mt-1.5 max-w-24 text-[10px] leading-tight break-words text-rose-300 sm:max-w-[6.5rem]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
