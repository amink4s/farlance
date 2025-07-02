// app/page.tsx

// Professional comment: This directive marks the component as a Client Component.
// Client Components run on the client (browser) and can use React Hooks (like useState, useEffect).
"use client";

// Professional comment: Import necessary hooks and components from React and MiniKit/OnchainKit.
// useMiniKit provides context about the Farcaster Mini App environment.
// useAddFrame and useOpenUrl are separate hooks for Farcaster interactions.
// ConnectWallet, Wallet, Name, Address, Avatar, EthBalance are for wallet and identity display.
import {
  useMiniKit,
  useAddFrame, // Import useAddFrame hook
  useOpenUrl,   // Import useOpenUrl hook
} from "@coinbase/onchainkit/minikit";
import { Name, Identity, Address, Avatar, EthBalance } from "@coinbase/onchainkit/identity";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet";
import { useEffect, useState, useCallback, useMemo } from "react";

// Professional comment: Main application component for the root route.
// This component renders the primary UI of the Farlance Mini App.
export default function App() {
  // Professional comment: Access MiniKit context to interact with Farcaster.
  // setFrameReady tells the Farcaster client that the Mini App is loaded and ready.
  // context provides details about the Farcaster user and client.
  const { setFrameReady, isFrameReady, context } = useMiniKit();

  // Professional comment: State to track if the Mini App has been "saved" (added to Farcaster account).
  const [frameAdded, setFrameAdded] = useState(false);

  // Professional comment: Call useAddFrame and useOpenUrl as separate hooks.
  const addFrame = useAddFrame(); // Correctly call useAddFrame
  const openUrl = useOpenUrl();   // Correctly call useOpenUrl

  // Professional comment: Effect to signal to Farcaster that the Mini App is ready to be displayed.
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Professional comment: Callback function to handle the "Save Frame" action.
  // Attempts to add the Mini App to the user's Farcaster account.
  const handleAddFrame = useCallback(async () => {
    const frameAddedStatus = await addFrame();
    setFrameAdded(Boolean(frameAddedStatus)); // Update state based on success/failure
  }, [addFrame]);

  // Professional comment: Memoized button component for saving the Mini App.
  // Dynamically displays "Save Frame", "Saved", or nothing based on context and state.
  const saveFrameButton = useMemo(() => {
    // If context is available and the client hasn't added the app yet
    if (context && !context.client.added) {
      return (
        // Using a basic button (will need styling) since DemoComponents.Button is removed
        <button
          onClick={handleAddFrame}
          // Placeholder styles for a simple button; replace with Tailwind or custom CSS later
          style={{
            background: 'none',
            border: '1px solid var(--app-accent)',
            color: 'var(--app-accent)',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Save Farlance
        </button>
      );
    }

    // If the app has been successfully added in the current session
    if (frameAdded) {
      return (
        <div
          // Placeholder styles for "Saved" message
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#0052FF',
            fontSize: '0.875rem',
            fontWeight: '500',
            opacity: 0, // Initial state for fade-out animation
            animation: 'fadeIn 0.5s forwards', // Example of a simple fade-in
            // Note: @keyframes should ideally be in CSS file, simplified for inline demo.
            // A more robust solution for animations would use global CSS.
          }}
        >
          {/* You would add a checkmark icon here if you have one */}
          <span>✅ Saved</span>
        </div>
      );
    }

    // If the app is already added or not in a state to be saved
    return null;
  }, [context, frameAdded, handleAddFrame]);


  return (
    // Professional comment: Main container for the Mini App, defining overall layout and theme.
    // Using inline styles for now as Tailwind classes might need adjustment without original setup.
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        color: "var(--app-foreground, #333)", // Fallback color
        backgroundColor: "var(--app-background, #f0f2f5)", // Fallback color
        backgroundImage: "linear-gradient(to bottom, var(--app-background, #f0f2f5), var(--app-gray, #e0e2e5))", // Gradient fallback
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px", // Equivalent to max-w-md if 16rem = 256px, adjust as needed. Often 480px or 768px.
          margin: "0 auto",
          padding: "16px", // px-4 py-3 equivalent, roughly
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px", // mb-3 equivalent
            height: "44px", // h-11 equivalent
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px", // space-x-2 equivalent
              }}
            >
              <Wallet> {/* Equivalent to z-10 */}
                <ConnectWallet>
                  {/* Professional comment: Displays the connected wallet's name. */}
                  <Name style={{ color: "inherit" }} /> {/* Equivalent to text-inherit */}
                </ConnectWallet>
                <WalletDropdown>
                  {/* Professional comment: Wallet details in a dropdown. */}
                  <Identity  hasCopyAddressOnClick> {/* Equivalent to px-4 pt-3 pb-2 */}
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          <div>{saveFrameButton}</div> {/* Render the dynamically generated save button */}
        </header>

        <main style={{ flex: 1 }}> {/* flex-1 equivalent */}
          {/* Professional comment: This is where your Farlance app's main content will go. */}
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
            marginTop: "8px", // mt-2 equivalent
            paddingTop: "16px", // pt-4 equivalent
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* Professional comment: Link to MiniKit documentation, using a simple button or anchor tag. */}
          <button
            onClick={() => openUrl("https://base.org/builderkits/minikit")}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ock-text-foreground-muted, #777)', // Fallback muted text color
              fontSize: '0.75rem', // text-xs equivalent
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Built on Base with MiniKit
          </button>
        </footer>
      </div>
    </div>
  );
}