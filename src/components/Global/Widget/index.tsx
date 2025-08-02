import { useMediaSource } from "@/hooks/useMediaSource";
import { fetchUserProfile } from "@/lib/utils";
import { ClerkLoading, SignedIn, useUser } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import MediaConfiguration from "../MediaConfiguration";

type Props = {};

const Widget = (props: Props) => {
  const [profile, setProfile] = useState<{
    status: number;
    user:
      | ({
          subscription: {
            plan: "PRO" | "FREE";
          } | null;
          studio: {
            id: string;
            screen: string | null;
            mic: string | null;
            preset: "HD" | "SD";
            camera: string | null;
            userId: string;
            plan: "PRO" | "FREE";
          } | null;
        } & {
          id: string;
          email: string;
          firstName: string | null;
          lastName: string | null;
          createdAt: Date;
          clerkId: string;
        })
      | null;
  } | null>(null);
  const user = useUser();
  const hasFetched = useRef(false);

  const { state, fetchMediaResource } = useMediaSource();

  useEffect(() => {
    if (user.user?.id && !hasFetched.current) {
      hasFetched.current = true;

      fetchUserProfile(user.user.id).then((profile) => {
        setProfile(profile);
      });

      fetchMediaResource();
    }
  }, [user?.user?.id]);
  return (
    <div className="p-3 max-h-fit">
      <ClerkLoading>
        <div className="h-full flex justify-center items-center">
          <Loader />
        </div>
      </ClerkLoading>
      <SignedIn>
        {profile ? (
          <MediaConfiguration state={state} user={profile?.user} />
        ) : (
          <div className="w-full h-full justify-center items-center">
            <Loader color="#fff" />
          </div>
        )}
      </SignedIn>
    </div>
  );
};

export default Widget;
