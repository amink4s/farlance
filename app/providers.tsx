"use client";

import { type ReactNode } from "react";
// import { base } from "wagmi/chains/index.js"; // or just "wagmi/chains.js" if that doesn't work. Start with index.js
// import { MiniKitProvider } from "@coinbase/onchainkit/minikit/index.js"; // Adding /index.js

import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

export function Providers(props: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
  );
}
