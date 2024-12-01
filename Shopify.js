var respondRAI = "";

function getSellerNameFromUrl(url) {
  const regex = /inbox\.shopify\.com\/store\/([^/]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function createSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "css-175oi2r r-1kb76zh";
  spinner.innerHTML = `
      <div class="css-175oi2r r-dvx3qi">
          <div class="css-175oi2r" data-testid="tooltipAnchor">
              <div role="button" tabindex="0" class="css-175oi2r r-1loqt21 r-1otgn73 r-1awozwy r-1d1hewc r-z2wwpe r-mabqd8 r-1777fci r-61z16t r-1yvhtrz" id="objectSharingPopoverToolNewItem" data-testid="button" style="opacity: 1;">
                  <svg width="20" height="20" viewBox="0 0 20 20" color="rgba(74, 74, 74, 1)" fill="rgba(74, 74, 74, 1)" style="width:24px;height:24px;shape-rendering:geometricprecision">
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

export function loadShopifyRespondR(aiSession) {
    var respondRLoaded = document.getElementById("respondR");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("Shopify.css");
    document.head.appendChild(link);

  respondRAI = aiSession;

  let sellername = getSellerNameFromUrl(window.location.href);

  async function quickReply(parentElement) {
    var spinner = createSpinner();

    const conversationHistory = extractConversationHistory();
    const textarea = document.querySelectorAll("textarea")[0];
    const seller_message = textarea ? textarea.value : "";
    const item_details = "";
    console.log(conversationHistory)

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
      textarea.value = data;

      textarea.style.height = ""; // Reset height to auto
      textarea.style.height = textarea.scrollHeight + "px";
      const event = new Event("input", {
        isTrusted: true,
        text: data,
        bubbles: true,
        cancelable: false,
      });
      textarea.dispatchEvent(event);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    } finally {
      parentElement.removeChild(spinner);
    }
  }

  async function improveText(parentElement) {
    var spinner = createSpinner();
    var rewriter = "";

    const textarea = document.querySelectorAll("textarea")[0];

    if (textarea.value != "") {
      parentElement.appendChild(spinner);

      try {
        rewriter = await ai.rewriter.create({
          sharedContext: textarea.value,
        });

        const data = await rewriter.rewrite(textarea.value, {
          context:
            "Don't rewrite only fix grammatical mistakes and improve the text for clarity. Don't add any placeholders or subjects and remove if any markdown formatting",
        });
        console.log(data);
        textarea.value = data;

        textarea.style.height = ""; // Reset height to auto
        textarea.style.height = textarea.scrollHeight + "px";
        const event = new Event("input", {
          isTrusted: true,
          text: data,
          bubbles: true,
          cancelable: false,
        });
        textarea.dispatchEvent(event);
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
    // Get the main div containing the conversation
    const messageDivs = document.querySelectorAll("div[index]");

    // Initialize an array to store the conversation
    let conversation = [];

    // Loop through each message div and extract the role, content, and timestamp
    messageDivs.forEach((messageDiv) => {
      let role = "buyer";
      // Extract the content of the message
      let texts_strings = [];
      const walker = document.createTreeWalker(
        messageDiv,
        NodeFilter.SHOW_TEXT // Filter to show only element nodes
      );

      // Walking through each element
      while (walker.nextNode()) {
        texts_strings.push(walker.currentNode.textContent);
      }

      //ignore elements which have more then or less then 2 text nodes ( e.g log messages , product URL etc )
      //TODO : Handle products URL / images / discounts etc messages
      if (texts_strings.length == 2) {
        const content = texts_strings[0];

        // Extract the timestamp
        let timestampElement = texts_strings[1].trim().split("•");

        let timestamp = "";

        if (timestampElement.length > 1)
          (role = "seller"), (timestamp = timestampElement[1]);
        else timestamp = timestampElement[0];

        // Push the extracted data into the conversation array
        conversation.unshift({
          role: role,
          content: content,
          timestamp: timestamp,
        });
      }
    });

    return conversation;
  }


function voiceCommand( buttonContainer) {
 
    const textbox = document.querySelectorAll("textarea")[0];
    
        // Check if Web Speech API is supported
      if (!("webkitSpeechRecognition" in window)) {
        alert("Your browser doesn't support speech recognition.");
        return;
      }
    
      var recognition = new webkitSpeechRecognition();
      recognition.lang = "en-US"; // TODO: get it from user-agent
      recognition.interimResults = false; 
      recognition.maxAlternatives = 1; 
    
      // Select the Voice Input button
      const voiceInputButton = buttonContainer.querySelector(".voice-input-button");

      // Add animation class to the button
      voiceInputButton.classList.add("listening-animation");
    
      recognition.start();
    
      recognition.onstart = function () {
        console.log("Speech recognition started. Please speak...");
      };
    
      recognition.onresult = function (event) {
        var speechResult = event.results[0][0].transcript; // Get the transcript
        console.log("Speech recognized: ", speechResult);
    
        // Insert the recognized text into the eBay textbox
        if (textbox) {
          textbox.value = speechResult; // Replace or append based on requirement
          textbox.focus();
          textbox.style.height = ""; // Reset height to auto
          textbox.style.height = textbox.scrollHeight + "px";
          const event = new Event("input", {
            isTrusted: true,
            text: speechResult,
            bubbles: true,
            cancelable: false,
          });
          textbox.dispatchEvent(event);
          quickReply(buttonContainer)
        }
      };
    
      recognition.onerror = function (event) {
        console.error("Speech recognition error: ", event.error);
        textbox.value = ("Speech recognition error. Please try again.");
      };
    
      recognition.onend = function () {
        console.log("Speech recognition ended.");
        // Remove animation class when recognition ends
        voiceInputButton.classList.remove("listening-animation");
      };
    }

  setTimeout(function () {
    

    if (respondRLoaded == null) {
      var targetDiv = document.querySelector(
        "#objectSharingPopoverToolUploadImage"
      ).parentElement.parentElement.parentElement.parentElement;
      targetDiv.id = "respondR";

      const respondR = document.createElement("div");
      respondR.onclick = function () {
        quickReply(targetDiv);
      };
      respondR.className = "css-175oi2r r-1kb76zh";
      respondR.innerHTML = `
          <div class="css-175oi2r r-dvx3qi">
              <div class="css-175oi2r" data-testid="tooltipAnchor">
                  <div role="button" tabindex="0" class="css-175oi2r r-1loqt21 r-1otgn73 r-1awozwy r-1d1hewc r-z2wwpe r-mabqd8 r-1777fci r-61z16t r-1yvhtrz" id="objectSharingPopoverToolNewItem" data-testid="button" style="opacity: 1;">
                      <svg width="20" height="20" viewBox="0 0 20 20" testID="icon" color="rgba(74, 74, 74, 1)" fill="rgba(74, 74, 74, 1)" style="width: 24px; height: 24px; shape-rendering: geometricprecision;">
                          <path fill-rule="evenodd" d="M15.165 3.893c-.784-.804-2.077-.804-2.862 0l-8.238 8.438c-.759.777-.759 2.018 0 2.795l.725.742c.778.798 2.06.804 2.847.015l4.082-4.092.006-.006 4.208-4.312c.759-.777.759-2.017 0-2.794l-.768-.786Zm-1.788 1.047c.196-.2.519-.2.715 0l.768.787c.19.194.19.504 0 .699l-1.048 1.073-1.484-1.484 1.049-1.075Zm-2.097 2.148-6.142 6.291c-.19.194-.19.505 0 .699l.725.742c.195.2.515.201.712.004l4.079-4.09 2.11-2.162-1.484-1.484Z"/><path d="M14.25 12c.413 0 .75.336.75.75v.75h.75c.413 0 .75.336.75.75 0 .415-.337.75-.75.75h-.75v.75c0 .415-.337.75-.75.75-.415 0-.75-.335-.75-.75v-.75h-.75c-.415 0-.75-.335-.75-.75 0-.414.335-.75.75-.75h.75v-.75c0-.414.335-.75.75-.75Z"/><path d="M5.75 3.5c.413 0 .75.336.75.75v.75h.75c.413 0 .75.336.75.75s-.337.75-.75.75h-.75v.75c0 .414-.337.75-.75.75-.415 0-.75-.336-.75-.75v-.75h-.75c-.415 0-.75-.336-.75-.75s.335-.75.75-.75h.75v-.75c0-.414.335-.75.75-.75Z"/>
                      </svg>
                  </div>
              </div>
          </div>
          `;

      const improve = document.createElement("div");
      improve.onclick = function () {
        improveText(targetDiv);
      };
      improve.className = "css-175oi2r r-1kb76zh";
      improve.innerHTML = `
          <div class="css-175oi2r r-dvx3qi">
              <div class="css-175oi2r" data-testid="tooltipAnchor">
                  <div role="button" tabindex="0" class="css-175oi2r r-1loqt21 r-1otgn73 r-1awozwy r-1d1hewc r-z2wwpe r-mabqd8 r-1777fci r-61z16t r-1yvhtrz" id="objectSharingPopoverToolNewItem" data-testid="button" style="opacity: 1;">
                      <svg width="20" height="20" viewBox="0 0 20 20" testID="icon" color="rgba(74, 74, 74, 1)" fill="rgba(74, 74, 74, 1)" style="width: 24px; height: 24px; shape-rendering: geometricprecision;">
                        <path d="M17 9.25a.75.75 0 0 1-1.5 0 3 3 0 0 0-3-3h-6.566l1.123 1.248a.75.75 0 1 1-1.114 1.004l-2.25-2.5a.75.75 0 0 1 .027-1.032l2.25-2.25a.75.75 0 0 1 1.06 1.06l-.97.97h6.44a4.5 4.5 0 0 1 4.5 4.5Z"/>
                        <path d="M3 10.75a.75.75 0 0 1 1.5 0 3 3 0 0 0 3 3h6.566l-1.123-1.248a.75.75 0 1 1 1.114-1.004l2.25 2.5a.75.75 0 0 1-.027 1.032l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97h-6.44a4.5 4.5 0 0 1-4.5-4.5Z"/>
                      </svg>
                  </div>
              </div>
          </div>
          `;

    //   // Create the tooltip elements
    //   const respondRTooltip = createTooltip("Generate quick reply");
    //   const improveTooltip = createTooltip("Fix grammar issue");

      // Append tooltips to buttons
    //   respondR.appendChild(respondRTooltip);
    //   improve.appendChild(improveTooltip);

    // Add Voice Input button
    var voiceInputButton = document.createElement("div");
    // voiceInputButton.textContent = '';
    voiceInputButton.className = "css-175oi2r r-1kb76zh voice-input-button"; // Add an extra class for styling
    // Add the SVG icon as innerHTML
    voiceInputButton.innerHTML = `
      <div class="css-175oi2r r-dvx3qi">
              <div class="css-175oi2r" data-testid="tooltipAnchor">
                  <div role="button" tabindex="0" class="css-175oi2r r-1loqt21 r-1otgn73 r-1awozwy r-1d1hewc r-z2wwpe r-mabqd8 r-1777fci r-61z16t r-1yvhtrz" id="objectSharingPopoverToolNewItem" data-testid="button" style="opacity: 1;">
                    <svg class="voice-icon" xmlns="http://www.w3.org/2000/svg" fill="rgba(74, 74, 74, 1)" height="25px" width="25px"  viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 3a3.25 3.25 0 0 0-3.25 3.25v2a3.25 3.25 0 0 0 6.5 0v-2a3.25 3.25 0 0 0-3.25-3.25Zm1.75 5.25a1.75 1.75 0 1 1-3.5 0v-2a1.75 1.75 0 1 1 3.5 0v2Z"/><path d="M5.5 8a.75.75 0 0 0-1.5 0v.25c0 3.06 2.29 5.585 5.25 5.954v1.546h-1.25a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-1.25v-1.546a6.001 6.001 0 0 0 5.25-5.954v-.25a.75.75 0 0 0-1.5 0v.25a4.5 4.5 0 1 1-9 0v-.25Z"/></svg>
                 </div>
              </div>
          </div>    
          `;

      voiceInputButton.onclick = function () {
        voiceCommand(targetDiv);
        };


    //   // Add hover events to show/hide tooltips
    //   addTooltipEvents(respondR, respondRTooltip);
    //   addTooltipEvents(improve, improveTooltip);

      targetDiv.appendChild(respondR);
      targetDiv.appendChild(improve);
      targetDiv.appendChild(voiceInputButton);

    }
  }, 2000);
}

function createTooltip(text) {
  const tooltip = document.createElement("div");
  tooltip.className =
    "css-175oi2r r-18u37iz r-yz5agt r-1h8ys4a r-u8s1d r-9rrtl8 r-1jaylin";
  tooltip.setAttribute("data-testid", "tooltipWrapper");
  tooltip.innerHTML = `
      <div class="css-175oi2r" style="opacity: 1;">
          <div class="css-175oi2r r-14lw9ot r-wh77r2 r-1xfd6ze r-rs99b7 r-1a0psd9 r-1pn2ns4 r-oyd9sg" data-testid="smallTooltipContent">
              <div dir="auto" class="css-1rynq56 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-1iln25a r-1084bgj r-otzu27 r-1enofrn r-1shzsj5 r-oxtfae r-1cwl3u0 r-1xnzce8">
                  ${text}
              </div>
              <div class="css-175oi2r r-18u37iz r-1xbve24 r-1777fci r-1wyvozj r-u8s1d r-1m4drjs r-1mcorv5" style="transform: rotate(180deg); margin-left: -7px;">
                  <div class="css-175oi2r r-1awozwy">
                      <div class="css-175oi2r r-u8s1d">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="rgba(227, 227, 227, 1)" viewBox="0 0 24 10" testID="icon" color="rgba(227, 227, 227, 1)" style="width: 14px; height: 6px; shape-rendering: geometricprecision;">
                              <path fill="currentColor" d="M24 0 13.5 9.441c-.828.745-2.172.745-3 0L0 0h24Z"></path>
                          </svg>
                      </div>
                      <div class="css-175oi2r r-u8s1d r-1gn8etr">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="rgba(255, 255, 255, 1)" viewBox="0 0 24 10" testID="icon" color="rgba(255, 255, 255, 1)" style="width: 13px; height: 5px; shape-rendering: geometricprecision;">
                              <path fill="currentColor" d="M24 0 13.5 9.441c-.828.745-2.172.745-3 0L0 0h24Z"></path>
                          </svg>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    `;
  tooltip.style.display = "none";
  return tooltip;
}


function addTooltipEvents(button, tooltip) {
  button.addEventListener("mouseenter", function () {
    tooltip.style.display = "block";
  });
  button.addEventListener("mouseleave", function () {
    tooltip.style.display = "none";
  });
}
