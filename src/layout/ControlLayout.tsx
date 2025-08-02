import { Button } from "@/components/ui/button";
import { cn, onCloseApp } from "@/lib/utils";
import { UserButton } from "@clerk/clerk-react";
import { X } from "lucide-react";
import React, { useState } from "react";
import OpalLogo from '../assets/opal-logo.svg'

type Props = {
  children: React.ReactNode;
  className?: string;
};

const ControlLayout = ({ children, className }: Props) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  window.ipcRenderer.on('hide-plugin', (event, payload) => {
    setIsVisible(payload.state)
  })
  return (
    <div
      className={cn(
        className,
        isVisible && "invisible",
        "flex flex-col h-full bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-lg overflow-hidden"
      )}
    >
      <div className="flex justify-between items-center p-2 bg-neutral-800 draggable">
        <div className="flex items-center gap-2 non-draggable">
          <img src={OpalLogo} alt="Opal logo" className="size-6" />
          <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Opal
          </p>
        </div>
        <div className="flex items-center gap-2 non-draggable">
          <UserButton />
          <Button
            onClick={onCloseApp}
            className="p-1 outline-none border-none bg-transparent rounded-xl h-fit w-fit hover:bg-red-600 transition-colors duration-200"
            aria-label="Close"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
};

export default ControlLayout;
