var multiUserSession = "";
var rewriterAI = "";
async function initializeAI() {
  console.log("Loaded: The complete website is fully loaded");

  var response_guideline = `Guidelines for generated response:
  - If seller has provided intent or half-written message, then generate a response based on that.
  - Use a greeting at the start of a new conversation or when engaging for the first time.
  - Don’t use a greeting if the conversation is ongoing or if it's an immediate reply.
  - When generating responses, always use "we" instead of "I" to represent the company or team.
  - Either add actual details of the seller or avoid putting placeholders in greetings and closings.
  - Response should not include any markdown formatting.`;

  multiUserSession = await ai.languageModel.create({
    systemPrompt:
      "Generate a response to address any pending queries from buyers that have not yet been answered in the provided conversation history. Based on provided guidelines : " +
      response_guideline,
  });
}

initializeAI();

function loadQuickAssist() {
  let currentUrl = window.location.href;
  if (currentUrl.includes("ebay.")) {
    console.log("Loading module for eBay...");

    // Dynamically import the module
    import(chrome.runtime.getURL("eBay.js"))
      .then((module) => {
        // Access exported functions from eBay.js
        const loadRespondRforeBay = module.loadRespondRforeBay;

        // Wait for the DOM to load
        // document.addEventListener("DOMContentLoaded", () => {
        console.log("RespondR loading for eBay");

        const chatlistDiv = document.querySelector(
          ".app-infinite-scroll__outer-container"
        );
        if (chatlistDiv) {
          chatlistDiv.addEventListener("click", (event) => {
            loadRespondRforeBay(multiUserSession);
          });
          loadRespondRforeBay(multiUserSession);
          console.log("Module loaded for eBay");
        } else {
          console.error("Chat list container not found.");
        }
        // });
      })
      .catch((err) => console.error("Failed to load eBay module:", err));
  }

  if (currentUrl.includes("web.whatsapp")) {
    console.log("Loading module for whatsapp...");

    // Dynamically import the module
    import(chrome.runtime.getURL("whatsapp.js"))
      .then((module) => {
        // Access exported functions from eBay.js
        const loadWhatsappRespondR = module.loadWhatsappRespondR;

        console.log("RespondR loading for Whatsapp");

        setTimeout(function () {
          const sidePane = document.getElementById("pane-side");

          if (sidePane)
            sidePane.addEventListener("click", (event) => {
              loadWhatsappRespondR(multiUserSession);
            });
        }, 7000);
      })
      .catch((err) => console.error("Failed to load Whatsapp module:", err));
  }

  if (currentUrl.includes("inbox.shopify")) {
    import(chrome.runtime.getURL("Shopify.js"))
      .then((module) => {
        // Access exported functions from eBay.js
        const loadShopifyRespondR = module.loadShopifyRespondR;

        console.log("RespondR loading for Shopify");

        loadShopifyRespondR(multiUserSession);

        const chatlistDiv = document.querySelector(
          "div.css-175oi2r > div > div.css-175oi2r.r-13awgt0.r-18u37iz > div.css-175oi2r.r-13awgt0.r-18u37iz.r-1udh08x > div.css-175oi2r.r-13awgt0.r-7mdpej.r-y54riw"
        );
        const chatlistDivBackup = document.querySelector(
          ".css-175oi2r.r-150rngu.r-eqz5dr.r-16y2uox.r-1wbh5a2.r-11yh6sk.r-1rnoaur.r-1sncvnh"
        );

        if (chatlistDiv)
          chatlistDiv.addEventListener("click", (event) => {
            loadShopifyRespondR(multiUserSession);
          });
      })
      .catch((err) => console.error("Failed to load Shopify module:", err));
  }
}

loadQuickAssist();
