import { getMediaSource } from "@/lib/utils";
import { useReducer } from "react";

export type SourceDeviceStateProps = {
  displays?: {
    appIcons: null;
    display: null;
    displayId: string;
    id: string;
    name: string;
    thumbnail: unknown[];
  }[];
  audioInput?: {
    deviceId: string;
    kind: string;
    label: string;
    groupId: string;
  }[];
  error?: string | null;
  isPending: boolean;
};

type DisplayDeviceActionProp = {
  type: "GET_DEVICES";
  payload: SourceDeviceStateProps;
};

export const useMediaSource = () => {
  const [state, dispatch] = useReducer(
    (state: SourceDeviceStateProps, action: DisplayDeviceActionProp) => {
      switch (action.type) {
        case "GET_DEVICES":
          return { ...state, ...action.payload };

        default:
          return state;
      }
    },
    {
      displays: [],
      audioInput: [],
      error: null,
      isPending: false,
    }
  );

  const fetchMediaResource = () => {
    dispatch({ type: "GET_DEVICES", payload: { isPending: true } });
    getMediaSource().then((source) => {
      dispatch({
        type: "GET_DEVICES",
        payload: {
          isPending: false,
          displays: source.display,
          audioInput: source.audio,
        },
      });
    }).catch((error) => {
        console.log("failed to fetch media source ", error)
        dispatch({ type: "GET_DEVICES", payload: { error: error.message, isPending: false } });
    })
  };

  return { state, fetchMediaResource };
};
