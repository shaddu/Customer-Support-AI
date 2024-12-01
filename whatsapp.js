var respondRAI = "";

function createSpinner() {
  const spinner = document.createElement("div");
  spinner.innerHTML = `
      <div class="x123j3cw xs9asl8 x9f619 x78zum5 x6s0dn4 xl56j7k x1ofbdpd x100vrsf x1fns5xo">
      <div class="" data-testid="tooltipAnchor">
          <div role="button" tabindex="0" 
               class="x1c4vz4f x2lah0s xdl72j9 xfect85 x1iy03kw x1lfpgzf" 
               id="objectSharingPopoverToolNewItem" 
               data-testid="button" 
               aria-label="Spinner" 
               style="opacity: 1;">
               <svg width="24" height="24" viewBox="0 1 19 19" fill="currentColor" style="width:24px;height:24px;shape-rendering:geometricprecision">
                    <path d="M7.229 1.173a9.25 9.25 0 1 0 11.655 11.412 1.25 1.25 0 1 0-2.4-.698 6.75 6.75 0 1 1-8.506-8.329 1.25 1.25 0 1 0-.75-2.385z">
                       <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite"/>
                    </path>
              </svg>
          </div>
      </div>
  </div>
  
      `;

  return spinner;
}

export function loadWhatsappRespondR(aiSession) {
  console.log("loadWhatsappRespondR");
  respondRAI = aiSession;

  // let sellername = getSellerNameFromUrl(window.location.href)
  let sellername = Date.now().toString();

  async function quickReply(parentElement) {
    var spinner = createSpinner();

    const conversationHistory = extractConversationHistory();
    const textarea = document.querySelector(
      'div[aria-placeholder="Type a message"]'
    );
    const spanText = textarea.querySelector("span");
    const seller_message = spanText ? spanText.innerText : "";
    const item_details = "";

    try {
      // Add spinner to button
      parentElement.appendChild(spinner);

      var quickReplyPrompt =
        "conversation history : " + JSON.stringify(conversationHistory);

      if (seller_message != "")
        quickReplyPrompt +=
          " The seller has provided either the intent or a partially written response to address the buyer's queries. Seller message: " +
          seller_message;

      if (item_details != "")
        quickReplyPrompt +=
          "The seller has provided either the intent or a partially written response to address the buyer's queries. Item details : " +
          item_details;

      const data = await respondRAI.prompt(quickReplyPrompt);

      console.log(data);

      if (spanText) {
        const walker = document.createTreeWalker(
          spanText,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
          textNodes.push(node);
        }

        // Remove each text node
        textNodes[0].textContent = data;
      } else {
        textarea.focus();

        navigator.clipboard.writeText(data);

        const pasteEvent = new ClipboardEvent("paste", {
          clipboardData: new DataTransfer(),
          bubbles: true,
        });

        // Add the desired text to clipboard data
        pasteEvent.clipboardData.setData("text/plain", data);

        // Dispatch the paste event on the editable element
        textarea.dispatchEvent(pasteEvent);
      }
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    } finally {
      parentElement.removeChild(spinner);
    }
  }

  async function improveText(parentElement) {
    var spinner = createSpinner();
    var rewriter = "";

    const textarea = document.querySelector(
      'div[aria-placeholder="Type a message"]'
    );
    const spanText = textarea.querySelector("span");

    console.log(spanText.innerText);

    if (spanText) {
      parentElement.appendChild(spinner);

      try {
        rewriter = await ai.rewriter.create({
          sharedContext: spanText.innerText,
        });

        const data = await rewriter.rewrite(spanText.innerText, {
          context:
            "Don't rewrite only fix grammatical mistakes and improve the text for clarity. Don't add any placeholders or subjects and remove if any markdown formatting",
        });

        console.log(data);
        if (spanText) {
          const walker = document.createTreeWalker(
            spanText,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          const textNodes = [];
          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }

          // Remove each text node
          textNodes[0].textContent = data;
        } else {
          textarea.focus();

          navigator.clipboard.writeText(data);

          const pasteEvent = new ClipboardEvent("paste", {
            clipboardData: new DataTransfer(),
            bubbles: true,
          });

          // Add the desired text to clipboard data
          pasteEvent.clipboardData.setData("text/plain", data);

          // Dispatch the paste event on the editable element
          textarea.dispatchEvent(pasteEvent);
        }
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      } finally {
        parentElement.removeChild(spinner);
        rewriter.destroy();
      }
    }
  }

  // Function to extract conversation history
  function extractConversationHistory() {
    // Get the main div containing the conversation messages
    const messageDivs = document.querySelectorAll("div[data-id]");

    // Initialize an array to store the conversation
    let conversation = [];

    // Loop through each message div and extract the role, content, and timestamp
    messageDivs.forEach((messageDiv) => {
      // Determine the role based on the presence of specific classes
      let role = messageDiv.querySelector('[aria-label="You:"]')
        ? "seller"
        : "buyer";

      // Extract the content of the message
      const contentElement = messageDiv.querySelector(
        "._ao3e.selectable-text.copyable-text"
      );
      const content = contentElement ? contentElement.textContent.trim() : "";

      // Extract the content of the message
      const repliedToElement = messageDiv.querySelector(
        ".quoted-mention._ao3e"
      );
      const repliedToText = repliedToElement
        ? repliedToElement.textContent.trim()
        : "";

      // Extract the timestamp from the 'data-pre-plain-text' attribute
      const timestampElement = messageDiv.querySelector(".copyable-text");
      let timestamp = "";
      if (timestampElement) {
        const prePlainText = timestampElement.getAttribute(
          "data-pre-plain-text"
        );
        if (prePlainText) {
          const timeData = prePlainText.match(
            /\[\d{1,2}:\d{2}(?: (AM|PM))?, \d{2}\/\d{2}\/\d{4}\]/
          );
          timestamp = timeData ? timeData[0].slice(1, -1) : ""; // Remove the square brackets
        }
      }

      // Push the extracted data into the conversation array
      if (content && timestamp) {
        conversation.unshift({
          role: role,
          content: content,
          repliedTo: repliedToText,
          timestamp: timestamp,
        });
      }
    });

    return conversation;
  }

  setTimeout(function () {
    var respondRLoaded = document.getElementById("respondR");

    if (respondRLoaded == null) {
      var targetDiv = document.querySelector(
        '[aria-placeholder="Type a message"]'
      ).parentElement.parentElement.parentElement;
      targetDiv.id = "respondR";

      const respondR = document.createElement("div");

      // Create the main div element
      respondR.className =
        "x123j3cw xs9asl8 x9f619 x78zum5 x6s0dn4 xl56j7k x1ofbdpd x100vrsf x1fns5xo";

      // Create the button element
      let button = document.createElement("button");
      button.setAttribute("data-tab", "11");
      button.setAttribute("aria-label", "Send");
      button.className = "x1c4vz4f x2lah0s xdl72j9 xfect85 x1iy03kw x1lfpgzf";

      // Create the span element
      let span = document.createElement("span");
      span.setAttribute("aria-hidden", "true");
      span.setAttribute("data-icon", "wand");

      // Create the svg element
      let svg = `
                  <svg width="24" height="24" viewBox="2 1 16 16" preserveAspectRatio="xMidYMid meet" testID="icon" style="width: 24px; height: 24px; shape-rendering: geometricprecision;">
                    <path fill="currentColor" fill-rule="evenodd" d="M15.165 3.893c-.784-.804-2.077-.804-2.862 0l-8.238 8.438c-.759.777-.759 2.018 0 2.795l.725.742c.778.798 2.06.804 2.847.015l4.082-4.092.006-.006 4.208-4.312c.759-.777.759-2.017 0-2.794l-.768-.786Zm-1.788 1.047c.196-.2.519-.2.715 0l.768.787c.19.194.19.504 0 .699l-1.048 1.073-1.484-1.484 1.049-1.075Zm-2.097 2.148-6.142 6.291c-.19.194-.19.505 0 .699l.725.742c.195.2.515.201.712.004l4.079-4.09 2.11-2.162-1.484-1.484Z"/>
                    <path fill="currentColor" d="M14.25 12c.413 0 .75.336.75.75v.75h.75c.413 0 .75.336.75.75 0 .415-.337.75-.75.75h-.75v.75c0 .415-.337.75-.75.75-.415 0-.75-.335-.75-.75v-.75h-.75c-.415 0-.75-.335-.75-.75 0-.414.335-.75.75-.75h.75v-.75c0-.414.335-.75.75-.75Z"/>
                    <path fill="currentColor" d="M5.75 3.5c.413 0 .75.336.75.75v.75h.75c.413 0 .75.336.75.75s-.337.75-.75.75h-.75v.75c0 .414-.337.75-.75.75-.415 0-.75-.336-.75-.75v-.75h-.75c-.415 0-.75-.336-.75-.75s.335-.75.75-.75h.75v-.75c0-.414.335-.75.75-.75Z"/>
                  </svg>
                  `;

      span.innerHTML = svg;
      button.appendChild(span);
      respondR.appendChild(button);

      respondR.onclick = function () {
        quickReply(targetDiv);
      };

      const improve = document.createElement("div");

      // Create the main div element
      improve.className =
        "x123j3cw xs9asl8 x9f619 x78zum5 x6s0dn4 xl56j7k x1ofbdpd x100vrsf x1fns5xo";

      // Create the button element
      button = document.createElement("button");
      button.setAttribute("data-tab", "11");
      button.setAttribute("aria-label", "Improve");
      button.className = "x1c4vz4f x2lah0s xdl72j9 xfect85 x1iy03kw x1lfpgzf";

      // Create the span element
      span = document.createElement("span");
      span.setAttribute("aria-hidden", "true");
      span.setAttribute("data-icon", "wand");

      // Create the svg element
      svg = ` <svg width="24" height="24" viewBox="2 1 16 16" preserveAspectRatio="xMidYMid meet" testID="icon" style="width: 24px; height: 24px; shape-rendering: geometricprecision;">
                    <path fill="currentColor" d="M17 9.25a.75.75 0 0 1-1.5 0 3 3 0 0 0-3-3h-6.566l1.123 1.248a.75.75 0 1 1-1.114 1.004l-2.25-2.5a.75.75 0 0 1 .027-1.032l2.25-2.25a.75.75 0 0 1 1.06 1.06l-.97.97h6.44a4.5 4.5 0 0 1 4.5 4.5Z"/>
                    <path fill="currentColor" d="M3 10.75a.75.75 0 0 1 1.5 0 3 3 0 0 0 3 3h6.566l-1.123-1.248a.75.75 0 1 1 1.114-1.004l2.25 2.5a.75.75 0 0 1-.027 1.032l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97h-6.44a4.5 4.5 0 0 1-4.5-4.5Z"/>
                  </svg>
             `;

      span.innerHTML = svg;
      button.appendChild(span);
      improve.appendChild(button);

      improve.onclick = function () {
        improveText(targetDiv);
      };

      targetDiv.appendChild(respondR);
      targetDiv.appendChild(improve);
    }
  }, 1000);
}
