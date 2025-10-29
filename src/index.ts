// Entry point for the application
// Logic will be added here later

import { findAssociatedTokenPda } from "@solana-program/token-2022";
import { address } from "@solana/kit";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

// Declare Phantom wallet types
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (transaction: {
        serialize: () => Uint8Array;
      }) => Promise<{ signature: string }>;
      publicKey?: { toString: () => string };
      request: (p: {
        method: "signAndSendTransaction";
        params: {
          message: string;
        };
      }) => Promise<{ signature: string }>;
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ATA Calculator elements
  const ownerAddressInput = document.getElementById(
    "ownerAddress"
  ) as HTMLInputElement;
  const mintIdInput = document.getElementById("mintId") as HTMLInputElement;
  const resultsDiv = document.getElementById("results") as HTMLDivElement;
  const errorDiv = document.getElementById("error") as HTMLDivElement;
  const tokenAtaDiv = document.getElementById("tokenAta") as HTMLDivElement;
  const token2022AtaDiv = document.getElementById(
    "token2022Ata"
  ) as HTMLDivElement;
  const container = document.querySelector(".container") as HTMLDivElement;

  // Wallet Transaction Signer elements
  const connectWalletButton = document.getElementById(
    "connectWalletButton"
  ) as HTMLButtonElement;
  const disconnectButton = document.getElementById(
    "disconnectButton"
  ) as HTMLButtonElement;
  const signTxButton = document.getElementById(
    "signTxButton"
  ) as HTMLButtonElement;
  const walletConnected = document.getElementById(
    "walletConnected"
  ) as HTMLDivElement;
  const walletNotConnected = document.getElementById(
    "walletNotConnected"
  ) as HTMLDivElement;
  const walletAddress = document.getElementById(
    "walletAddress"
  ) as HTMLDivElement;
  const transactionBase64Input = document.getElementById(
    "transactionBase64"
  ) as HTMLTextAreaElement;
  const txSuccess = document.getElementById("txSuccess") as HTMLDivElement;
  const txError = document.getElementById("txError") as HTMLDivElement;
  const walletError = document.getElementById("walletError") as HTMLDivElement;

  console.log("Solana Developer Utils initialized");

  // Wallet functionality
  let connectedWallet: any = null;

  const updateWalletUI = (connected: boolean) => {
    if (connected) {
      walletConnected.style.display = "block";
      walletNotConnected.style.display = "none";
      if (connectedWallet && connectedWallet.publicKey) {
        walletAddress.textContent = connectedWallet.publicKey.toString();
      }
    } else {
      walletConnected.style.display = "none";
      walletNotConnected.style.display = "block";
      walletAddress.textContent = "";
    }
  };

  connectWalletButton.addEventListener("click", async () => {
    try {
      walletError.style.display = "none";

      if (!window.solana) {
        throw new Error(
          "Phantom wallet not found. Please install Phantom wallet extension."
        );
      }

      const response = await window.solana.connect();
      connectedWallet = window.solana;
      console.log("Wallet connected:", response.publicKey.toString());
      updateWalletUI(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      walletError.textContent = `Error: ${
        error instanceof Error ? error.message : String(error)
      }`;
      walletError.style.display = "block";
    }
  });

  disconnectButton.addEventListener("click", async () => {
    try {
      if (connectedWallet) {
        await connectedWallet.disconnect();
        connectedWallet = null;
      }
      updateWalletUI(false);
      transactionBase64Input.value = "";
      txSuccess.style.display = "none";
      txError.style.display = "none";
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  });

  signTxButton.addEventListener("click", async () => {
    try {
      txSuccess.style.display = "none";
      txError.style.display = "none";

      if (!connectedWallet) {
        throw new Error("Wallet not connected");
      }
      debugger;
      const base64Tx = transactionBase64Input.value.trim();
      if (!base64Tx) {
        throw new Error("Please enter a base64 encoded transaction");
      }

      signTxButton.disabled = true;
      signTxButton.textContent = "Signing & Sending...";

      // Decode the base64 transaction
      const txBuffer = Uint8Array.from(atob(base64Tx), (c) => c.charCodeAt(0));

      // Create a transaction object that Phantom can sign
      // Note: This is a simplified version. In production, you'd want to use
      // @solana/web3.js to properly deserialize and handle the transaction
      const transaction = {
        serialize: () => base64Tx,
      };
      const transactionParsed = await VersionedTransaction.deserialize(
        txBuffer
      );
      // debugger;
      //i need to parse this transaction with solana/web3.js
      // const transaction = await Transaction.from(txBuffer);
      // const result = await connectedWallet.request({
      //   method: "signAndSendTransaction",
      //   params: {
      //     message: transactionParsed,
      //   },
      // });
      const result = await connectedWallet.signAndSendTransaction(
        transactionParsed
      );

      console.log("Transaction signature:", result.signature);

      txSuccess.textContent = `Transaction successful! Signature: ${result.signature}`;
      txSuccess.style.display = "block";
      transactionBase64Input.value = "";
    } catch (error) {
      console.error("Error signing transaction:", error);
      txError.textContent = `Error: ${
        error instanceof Error ? error.message : String(error)
      }`;
      txError.style.display = "block";
    } finally {
      signTxButton.disabled = false;
      signTxButton.textContent = "Sign & Execute Transaction";
    }
  });

  // Check if wallet is already connected
  if (window.solana && window.solana.publicKey) {
    connectedWallet = window.solana;
    updateWalletUI(true);
  }

  // ATA Calculator functionality

  // Function to compute and display results
  const updateResults = async () => {
    const ownerAddress = ownerAddressInput.value.trim();
    const mintId = mintIdInput.value.trim();

    // Hide results and errors
    resultsDiv.style.display = "none";
    errorDiv.style.display = "none";

    // Only proceed if both fields are filled
    if (!ownerAddress || !mintId) {
      return;
    }

    try {
      // Add loading state
      container.classList.add("loading");

      // Compute ATAs
      const result = await computeAllAta(ownerAddress, mintId);

      // Display results (handling Promise.allSettled results)
      if (result.associatedTokenAddress?.status === "fulfilled") {
        tokenAtaDiv.textContent = result.associatedTokenAddress.value[0];
      } else {
        tokenAtaDiv.textContent = `Error: ${result.associatedTokenAddress?.reason}`;
      }

      if (result.associatedTokenAddress2022?.status === "fulfilled") {
        token2022AtaDiv.textContent =
          result.associatedTokenAddress2022.value[0];
      } else {
        token2022AtaDiv.textContent = `Error: ${result.associatedTokenAddress2022?.reason}`;
      }

      resultsDiv.style.display = "block";

      console.log("Results:", result);
    } catch (error) {
      // Display error
      errorDiv.textContent = `Error: ${
        error instanceof Error ? error.message : String(error)
      }`;
      errorDiv.style.display = "block";
      console.error("Error computing ATAs:", error);
    } finally {
      // Remove loading state
      container.classList.remove("loading");
    }
  };

  // Add event listeners for both inputs
  ownerAddressInput.addEventListener("input", updateResults);
  mintIdInput.addEventListener("input", updateResults);
});

const computeAllAta = async (ownerAddress: string, mintId: string) => {
  try {
    const [associatedTokenAddress, associatedTokenAddress2022] =
      await Promise.allSettled([
        findAssociatedTokenPda({
          mint: address(mintId),
          owner: address(ownerAddress),
          tokenProgram: address(TOKEN_PROGRAM_ID),
        }),
        findAssociatedTokenPda({
          mint: address(mintId),
          owner: address(ownerAddress),
          tokenProgram: address(TOKEN_2022_PROGRAM_ID),
        }),
        // findAssociatedTokenPda({
        //   mint: address(mintId),
        //   owner: address(ownerAddress),
        //   tokenProgram: address(programId),
        // }),
      ]);
    return { associatedTokenAddress, associatedTokenAddress2022 };
  } catch (error) {
    console.error("Error computing ATAs:", error);
    return { associatedTokenAddress: null, associatedTokenAddress2022: null };
  }
};

/** Address of the SPL Token program */
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/** Address of the SPL Token 2022 program */
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
