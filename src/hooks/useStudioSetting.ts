import { updateStudioSettingSchema } from "@/schema/updateStudioSettingSchema";
import { useEffect, useState } from "react";
import { useZodForm } from "./useZodForm";
import { useMutation } from "@tanstack/react-query";
import { updateStudioSetting } from "@/lib/utils";
import { toast } from "sonner";

export const useStudioSetting = (
  id: string,
  screen?: string | null,
  audio?: string | null,
  preset?: "HD" | "SD",
  plan?: "PRO" | "FREE",
  workspaceId?: string | null,
  workspaceFolderId?: string| null,
) => {
  const [onPreset, setOnPreset] = useState<"HD" | "SD" | undefined>();
  
  const { mutate, isPending } = useMutation({
    mutationKey: ["update-studio"],
    mutationFn: (data: {
      screen: string;
      id: string;
      audio: string;
      preset: "HD" | "SD";
    }) => updateStudioSetting(data.id, data.screen, data.audio, data.preset),
    onSuccess: (data) => {
      toast(data.status === 200 ? "success" : "error", {
        description: data.message,
      });
    },
  });

  const { register, watch } = useZodForm(updateStudioSettingSchema, mutate, {
    screen: screen!,
    audio: audio!,
    preset: preset!,
  });

  useEffect(() => {
    if (screen && audio) {
      window.ipcRenderer.send("media-source", {
        screen,
        id: id,
        audio,
        preset,
      });
    }
  }, [screen, audio]);

  useEffect(() => {
    const subscribe = watch((value) => {
      setOnPreset(value.preset);
      mutate({
        screen: value.screen!,
        id: id,
        audio: value.audio!,
        preset: value.preset!
      });
      window.ipcRenderer.send("media-source", {
        screen: value.screen,
        id,
        audio: value.audio,
        preset: value.preset,
        plan
      });
    });

    return () => subscribe.unsubscribe()
  }, [watch]);

  return { register, onPreset, isPending };
};
