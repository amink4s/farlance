// app/page.tsx

// Professional comment: This directive marks the component as a Client Component.
"use client";

// Professional comment: Standard React hooks.
import { useEffect, useState, useCallback, useMemo } from "react";

// PROFESSIONAL COMMENT: Corrected imports for OnchainKit/MiniKit components
// using direct named imports as per documentation, now that tsconfig allows it.
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";

// Professional comment: Main application component for the root route.
export default function App() {
  // Professional comment: Access MiniKit context to interact with Farcaster.
  const { setFrameReady, isFrameReady, context } = useMiniKit(); // Direct hook call

  // Professional comment: State to track if the Mini App has been "saved".
  const [frameAdded, setFrameAdded] = useState(false);

  // Professional comment: Call useAddFrame and useOpenUrl hooks directly.
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  // Professional comment: Effect to signal Mini App readiness to Farcaster.
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Professional comment: Handler for the "Save Frame" action.
  const handleAddFrame = useCallback(async () => {
    const frameAddedStatus = await addFrame();
    setFrameAdded(Boolean(frameAddedStatus));
  }, [addFrame]);

  // Professional comment: Memoized button for saving the Mini App.
  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <button
          onClick={handleAddFrame}
          style={{
            background: 'none', border: '1px solid var(--app-accent)', color: 'var(--app-accent)',
            padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500',
          }}
        >
          Save Farlance
        </button>
      );
    }

    if (frameAdded) {
      return (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', color: '#0052FF',
            fontSize: '0.875rem', fontWeight: '500', opacity: 0, animation: 'fadeIn 0.5s forwards',
          }}
        >
          <span>✅ Saved</span>
        </div>
      );
    }
    return null;
  }, [context, frameAdded, handleAddFrame]);


  return (
    <div
      style={{
        display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "sans-serif",
        color: "var(--app-foreground, #333)", backgroundColor: "var(--app-background, #f0f2f5)",
        backgroundImage: "linear-gradient(to bottom, var(--app-background, #f0f2f5), var(--app-gray, #e0e2e5))",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: "480px", margin: "0 auto", padding: "16px",
        }}
      >
        <header
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "12px", height: "44px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex", alignItems: "center", gap: "8px",
              }}
            >
              <Wallet> {/* Directly using Wallet */}
                <ConnectWallet> {/* Directly using ConnectWallet */}
                  <Name style={{ color: "inherit" }} /> {/* Directly using Name */}
                </ConnectWallet>
                <WalletDropdown> {/* Directly using WalletDropdown */}
                  <Identity hasCopyAddressOnClick> {/* Directly using Identity */}
                    <Avatar /> {/* Directly using Avatar */}
                    <Name />
                    <Address /> {/* Directly using Address */}
                    <EthBalance /> {/* Directly using EthBalance */}
                  </Identity>
                  <WalletDropdownDisconnect /> {/* Directly using WalletDropdownDisconnect */}
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main style={{ flex: 1 }}>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h1 style={{ color: "var(--app-foreground, #2c3e50)", marginBottom: "20px", fontSize: "1.8em" }}>
              Farlance - Your Job & Skills Hub
            </h1>
            <p style={{ fontSize: "1.1em", lineHeight: "1.5", color: "var(--ock-text-foreground-muted, #555)" }}>
              Welcome to Farlance! Connect with talent and find opportunities directly on Farcaster.
            </p>
            <p style={{ fontSize: "1.1em", lineHeight: "1.5", color: "var(--ock-text-foreground-muted, #555)", marginTop: "10px" }}>
              List your skills or post a job today. More features coming soon!
            </p>
          </div>
        </main>

        <footer
          style={{
            marginTop: "8px", paddingTop: "16px", display: "flex", justifyContent: "center",
          }}
        >
          <button
            onClick={() => openUrl("https://base.org/builderkits/minikit")}
            style={{
              background: 'none', border: 'none', color: 'var(--ock-text-foreground-muted, #777)',
              fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: '4px 8px',
            }}
          >
            Built on Base with MiniKit
          </button>
        </footer>
      </div>
    </div>
  );
}