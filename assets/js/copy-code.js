// Function to add copy buttons to code blocks
document.addEventListener("DOMContentLoaded", function () {
  // Find all pre elements that contain code blocks
  const codeBlocks = document.querySelectorAll("pre");

  codeBlocks.forEach((codeBlock) => {
    // Create the copy button
    const copyButton = document.createElement("button");
    copyButton.className = "copy-code-button";
    copyButton.type = "button";
    copyButton.innerHTML = "Copy";

    // Add the button to the code block
    codeBlock.appendChild(copyButton);

    // Add position relative to the pre element for absolute positioning of the button
    codeBlock.style.position = "relative";

    // Add click event listener to the button
    copyButton.addEventListener("click", function () {
      // Get the text content from the code block
      const code = codeBlock.querySelector("code") || codeBlock;
      const text = code.textContent;

      // Copy the text to clipboard
      navigator.clipboard.writeText(text).then(
        function () {
          // Visual feedback - change button text temporarily
          copyButton.innerHTML = "Copied!";
          setTimeout(function () {
            copyButton.innerHTML = "Copy";
          }, 2000);
        },
        function (err) {
          console.error("Could not copy text: ", err);
          copyButton.innerHTML = "Error";
          setTimeout(function () {
            copyButton.innerHTML = "Copy";
          }, 2000);
        }
      );
    });
  });
});
