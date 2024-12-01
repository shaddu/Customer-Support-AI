var sellername = "";
var respondRAI = "";

let cannedResponseDB;

const request = indexedDB.open("cannedResponseDB", 1);

request.onupgradeneeded = function(event) {
    cannedResponseDB = event.target.result;
    if (!cannedResponseDB.objectStoreNames.contains("cannedResponses")) {
        // Create a new object store
        const store = cannedResponseDB.createObjectStore("cannedResponses", { keyPath: "id", autoIncrement: true });
        store.createIndex("text", "text", { unique: false });
    }
};

request.onsuccess = function(event) {
    cannedResponseDB = event.target.result;
    console.log("Database opened successfully");
};



export function loadRespondRforeBay(aiSession) {
  console.log("RespondRforeBay is getting loaded");
  const pageContent = document.documentElement.outerHTML;
  respondRAI = aiSession;

  // Extract sellername
  const regex = /"userId"\s*:\s*"([^"]+)"/;
  const sellernameMatch = pageContent.match(regex);
  if (sellernameMatch) {
    sellername = sellernameMatch[1];
    console.log(sellername);
  }

  setTimeout(function () {
    AddeBayButtons();
  }, 1300);
}

function AddeBayButtons() {
  // Step 1: Find the target div
  var targetDiv = document.getElementsByClassName("msg-content-view");

  //eBay textbox to type message
  var textbox = document.querySelector("#imageupload__sendmessage--textbox");

  // Step 2: Check if the div with id 'eBayRespondR' exists
  var eBayRespondR = document.getElementById("eBayRespondR");

  // If the div doesn't exist, create a new one
  if (eBayRespondR == null && targetDiv && textbox) {
    textbox.placeholder =
      "Please enter your intent using as few words as possible.";

    eBayRespondR = document.createElement("div");
    eBayRespondR.id = "eBayRespondR";

    // console.log(targetDiv)
    // Step 3: Create a Shadow DOM for the new div
    var shadowRoot = eBayRespondR.attachShadow({
      mode: "open",
    });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("eBay.css");
    shadowRoot.appendChild(link);

    // Step 4: Add buttons to the Shadow DOM
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    // Add Voice Input button
    var voiceInputButton = document.createElement("button");
    // voiceInputButton.textContent = '';
    voiceInputButton.className = "ebay-button voice-input-button"; // Add an extra class for styling
    // Add the SVG icon as innerHTML
    voiceInputButton.innerHTML = `
         <svg fill="#3565f3" height="16px" width="16px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
             <g>
                 <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z"></path>
                 <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z"></path>
             </g>
         </svg>
          <span class="voice-text">Speak</span>
          `;

    voiceInputButton.onclick = function () {
      voiceCommand(textbox, shadowRoot, buttonContainer);
    };
    buttonContainer.appendChild(voiceInputButton);

    // Create Quick Reply button
    var quickReplyButton = document.createElement("button");
    quickReplyButton.type = "button";
    quickReplyButton.textContent = "Quick Reply";
    quickReplyButton.className = "ebay-button";
    quickReplyButton.onclick = function () {
      quickReply(buttonContainer, shadowRoot);
    };
    buttonContainer.appendChild(quickReplyButton);

    // Create the Improve text button
    var improveMessageButton = document.createElement("button");
    improveMessageButton.textContent = "Improve it";
    improveMessageButton.className = "ebay-button";
    improveMessageButton.onclick = function () {
      improveText(buttonContainer, shadowRoot);
    };
    buttonContainer.appendChild(improveMessageButton);

    // Create the Canned Response button
    var cannedResponseButton = document.createElement("button");
    cannedResponseButton.textContent = "Canned Response";
    cannedResponseButton.className = "ebay-button";
    cannedResponseButton.onclick = function () {
      var tooltip = shadowRoot.querySelector(".ebaytooltip");
      (tooltip.style.display =
        tooltip.style.display === "block" ? "none" : "block"),
        fetchCannedResponse(shadowRoot);
    };
    buttonContainer.appendChild(cannedResponseButton);

    // Append the button container to the Shadow DOM
    shadowRoot.appendChild(buttonContainer);

    // Create the tooltip div
    var tooltip = document.createElement("div");
    tooltip.className = "ebaytooltip";
    tooltip.style.display = "none"; // Hide by default

    // Add drag handle
    var dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";

    // Create a span for the text and append it to the drag-handle div
    var dragHandleText = document.createElement("span");
    dragHandleText.textContent = "Canned Responses (draggable)";
    dragHandle.appendChild(dragHandleText);

    // Create the plus icon button and append it to the drag-handle div
    var plusIconButton = document.createElement("button");
    plusIconButton.className = "plus-icon-button";
    plusIconButton.innerHTML = "+";
    plusIconButton.onclick = function () {
      openCannedResponseModal();
    };
    dragHandle.appendChild(plusIconButton);
    tooltip.appendChild(dragHandle);

    var cannedResponseModal = document.createElement("div");
    cannedResponseModal.id = "cannedResponseModal";
    cannedResponseModal.className = "cannedResponseModal";
    cannedResponseModal.style.display = "none";
    cannedResponseModal.innerHTML = `
            <div class="cannedResponseModal-content">
                <span class="close" id="cannedresponsemodalclose" onclick="closeCannedResponseModal()">&times;</span>
                <h2>Add Canned Response</h2>
                <form id="cannedResponseForm">
                        <input type="text" id="inputField1" placeholder="Title" required>
                        <textarea rows="4" id="inputField2" placeholder="Response" required ></textarea>
                        <button type="submit" id="addButton">Add</button>
                </form>
            </div>
        `;

    document.body.appendChild(cannedResponseModal);
    // Attach event listeners to the buttons
    document
      .getElementById("cannedresponsemodalclose")
      .addEventListener("click", closeCannedResponseModal);
    document
      .getElementById("cannedResponseForm")
      .addEventListener("submit", (event) =>
        saveCannedResponse(event, shadowRoot)
      );

    // Create the search input
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search...";
    searchInput.className = "search-input";
    tooltip.appendChild(searchInput);

    // Add some example list items to the tooltip
    var list = document.createElement("ul");
    tooltip.appendChild(list);
    fetchCannedResponse(shadowRoot);

    shadowRoot.appendChild(tooltip);

    targetDiv[0].appendChild(eBayRespondR);

    // Make the tooltip draggable
    dragElement(tooltip, dragHandle);

    // Add search functionality
    searchInput.addEventListener("input", function () {
      var filter = searchInput.value.toLowerCase();
      var listItems = list.getElementsByTagName("li");
      for (var i = 0; i < listItems.length; i++) {
        var item = listItems[i];
        var text = item.textContent || item.innerText;
        item.style.display =
          text.toLowerCase().indexOf(filter) > -1 ? "" : "none";
      }
    });
  }

  if (targetDiv == null) {
    textbox.addEventListener("click", AddeBayButtons);
  }
}

function voiceCommand(textbox, shadowRoot, buttonContainer) {
 
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
  const voiceInputButton = shadowRoot.querySelector(".voice-input-button");

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
      quickReply(buttonContainer,shadowRoot)
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

export function extractMessages() {
  const messageBubbles = document.querySelectorAll(
    ".app-conversation__message-bubble"
  );
  const messages = { buyerMessages: [], sellerMessages: [], conversation: [] };
  messageBubbles.forEach((bubble) => {
    const role = bubble.classList.contains(
      "app-conversation__message-bubble__grey"
    )
      ? "buyer"
      : "seller";
    const content =
      bubble
        .querySelector(".app-conversation__message-bubble__message__content")
        ?.innerText.trim() ?? "";
    // const timestamp = bubble.querySelector('.app-conversation__message-bubble__posted-time').innerText.trim();

    if (content == "") {
      // Extract image URLs and join them as a comma-separated string
      var attachements = Array.from(bubble?.querySelectorAll("img") || [])
        .map((img) => img.src)
        .join(", ");

      // TODO: adding this to conversation returns blank as LLM expects query ( content ) from buyer in first element
      //messages.conversation.splice(messages.conversation.length, 0, { role, content, attachements, timestamp });
    } else {
      // messages[role + 'Messages'].push({ content, timestamp });
      // messages.conversation.push({ role, content, timestamp });
      messages[role + "Messages"].unshift({ content });
      messages.conversation.unshift({ role, content });
    }
  });
  return messages;
}

function createSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  return spinner;
}

async function quickReply(btn, shadowRoot) {
  // Create spinner element
  const spinner = createSpinner();

  const { buyerMessages, sellerMessages, conversation } = extractMessages();
  console.log("conversation :", conversation);

  //eBay textbox to type message
  var textbox = document.querySelector("#imageupload__sendmessage--textbox");

  let anchorElement = document.querySelector(
    ".app-base-item-card__item-title h1 a"
  );
  var itemId = null;
  var item_details = "";

  // Check if the message was sent on any existing item
  if (anchorElement) {
    let url = anchorElement.getAttribute("href");

    // Regular expression pattern to match the item ID
    var pattern = /\/(\d+)$/;

    var match = url.match(pattern);

    //TODO: get item details using itemid of ebay item using small scraping or ebay API
    itemId = match ? match[1] : null;

    item_details = anchorElement.innerText;

    console.log(anchorElement.innerText);
  }

  try {
    // Add spinner to button
    btn.appendChild(spinner);

    var quickReplyPrompt =
      "conversation history : " + JSON.stringify(conversation);

    if (textbox.value != "")
      quickReplyPrompt +=
        " The seller has provided either the intent or a partially written response to address the buyer's queries. Seller message: " +
        textbox.value;

    if (item_details != "")
      quickReplyPrompt +=
        "The seller has provided either the intent or a partially written response to address the buyer's queries. Item details : " +
        item_details;

    const data = await respondRAI.prompt(quickReplyPrompt);

    // textbox.value = data.response;
    textbox.value = "";
    textbox.setRangeText(data);

    textbox.style.height = ""; // Reset height to auto
    textbox.style.height = textbox.scrollHeight + "px";
    // textbox.dispatchEvent(new Event('input', {"bubbles": true, "inputType": 'insertText'}));
    const inputEvent = new Event("input", { bubbles: true });
    textbox.dispatchEvent(inputEvent);
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  } finally {
    btn.removeChild(spinner);
  }
}

function dragElement(elmnt, handle) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (handle) {
    handle.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Function to fetch data from API
async function fetchCannedResponse(shadowRoot) {
  try {
    
    const transaction = cannedResponseDB.transaction("cannedResponses", "readonly");
    const store = transaction.objectStore("cannedResponses");
    const allEntries = store.getAll();

    allEntries.onsuccess = function(event) {
        const entries = event.target.result;
        populateList(entries, shadowRoot); // Adjust to match the structure of your API response
    };

    allEntries.onerror = function() {
        console.error("Error retrieving entries.");
    };

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Function to populate the list with fetched data
function populateList(items, shadowRoot) {
  var list = shadowRoot.querySelector("ul");
  if (list) list.innerHTML = ""; // Clear existing items

  items.forEach((item) => {
    var listItem = document.createElement("li");
    // listItem.textContent = item.value;
    listItem.innerHTML = `
                <span class="title"><strong>${item.RowKey}</strong></span>
                <span class="title-value">${item.value}</span>
            `;
    listItem.onclick = function (event) {
      cannedResponseListItemClick(event, shadowRoot);
    };
    list.appendChild(listItem);
  });
}

// Function to handle click on list item
function cannedResponseListItemClick(event, shadowRoot) {
  var clickedItem = event.target.closest("li");
  if (!clickedItem) return; // Exit if clicked outside list item

  // Example action: Log the title and value to console
  var title = clickedItem.querySelector(".title").textContent;
  var value = clickedItem.querySelector(".title-value").textContent;
  console.log("Clicked:", title, value);

  var textbox = document.querySelector("#imageupload__sendmessage--textbox");
  textbox.value = value;
  textbox.style.height = "";
  textbox.style.height = textbox.scrollHeight + "px";
  textbox.dispatchEvent(new Event("input"));

  var tooltip = shadowRoot.querySelector(".ebaytooltip");
  tooltip.style.display = "none";
}

async function improveText(btn, shadowRoot) {
  // Create spinner element
  const spinner = createSpinner();

  var textbox = document.querySelector("#imageupload__sendmessage--textbox");
  const originalText = textbox.value;
  var rewriter = "";

  if (textbox.value != "") {
    // Add spinner to button
    btn.appendChild(spinner);

    try {
      rewriter = await ai.rewriter.create({
        sharedContext: originalText,
      });

      const data = await rewriter.rewrite(textbox.value, {
        context:
          "Don't rewrite only fix grammatical mistakes and improve the text for clarity. Don't add any placeholders or subjects and remove if any markdown formatting",
      });

      textbox.value = "";
      textbox.setRangeText(data);

      textbox.style.height = "";
      textbox.style.height = textbox.scrollHeight + "px";
      const inputEvent = new Event("input", { bubbles: true });
      textbox.dispatchEvent(inputEvent);
    } catch (error) {
      console.error("Error improving text:", error);
    } finally {
      btn.removeChild(spinner);
      rewriter.destroy();
    }
  }
}

function openCannedResponseModal() {
  var modal = document.getElementById("cannedResponseModal");
  modal.style.display = "block";
}

function closeCannedResponseModal() {
  var modal = document.getElementById("cannedResponseModal");
  modal.style.display = "none";
}

// Close the modal when clicking outside of it
window.onclick = function (event) {
  var modal = document.getElementById("cannedResponseModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

async function saveCannedResponse(event, shadowRoot) {
  event.preventDefault();
  var modal = document.getElementById("cannedResponseModal");

  // Get the form element from the event object
  const form = event.target;

  // Get the input values using the form element
  const key = form.querySelector("#inputField1").value;
  const value = form.querySelector("#inputField2").value;


  try {
    //TODO save in indexdb
    const transaction = cannedResponseDB.transaction("cannedResponses", "readwrite");
    const store = transaction.objectStore("cannedResponses");

    const newEntry = {
        RowKey: key,
        value: value
    };

    store.add(newEntry);

    transaction.oncomplete = function() {
        console.log("New entry added!");
    };

    transaction.onerror = function() {
        console.error("Error adding entry.");
    };

    form.reset();
    fetchCannedResponse(shadowRoot);
    modal.style.display = "none";

  } catch (error) {
    console.error("Network error:", error);
    alert("Network error");
  }
}
