async function initializeAI() {
    console.log("Loaded: The complete website is fully loaded");

// const session = await ai.languageModel.create();

// Prompt the model and wait for the whole result to come back.
// const result = await session.prompt("Write me a short poem on india.");
// console.log(result);
// alert(result)

// Prompt the model and stream the result:
// const stream = await session.promptStreaming("Write me an extra-long poem.");
// for await (const chunk of stream) {
//   console.log(chunk);
// }

const multiUserSession = await ai.languageModel.create({
    systemPrompt: "You are a mediator in a discussion between two departments."
  });
  
  const result = await multiUserSession.prompt([
    { role: "user", content: "Marketing: We need more budget for advertising campaigns." },
    { role: "user", content: "Finance: We need to cut costs and advertising is on the list." },
    { role: "assistant", content: "Let's explore a compromise that satisfies both departments." }
  ]);
  
  alert(result);
  // `result` will contain a compromise proposal from the assistant.
}

initializeAI();