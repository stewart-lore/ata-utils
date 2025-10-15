// Entry point for the application
// Logic will be added here later

import { findAssociatedTokenPda } from "@solana-program/token-2022";
import { address } from "@solana/kit";

document.addEventListener("DOMContentLoaded", () => {
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

  console.log("ATA Utils initialized");

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
