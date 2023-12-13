// npm install openai dotenv
// import the required dependencies
require('dotenv').config();
const OpenAI = require('openai');
const prompt = require('prompt-sync')();

// Create a OpenAI connection
const secretKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

// Declare some functions (tools) to be called
const functionsList = [
    {
        "type": "function",
        "function":{
            "name": "chatting",
            "description":
                "Whatsapp bot chats with the user, and returns the response for every message from user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "userMessage": { "type": "string" },
                },
            },
            "required": ["userMessage"],
        },
    },
    {
        "type": "function",
        "function":{
            "name": "createStory",
            "description": 
                "Whatsapp bot will create the user's story based on user message.",
            "parameters": {
                "type": "object",
                "properties": {
                    "userMessage": { "type": "string" },
                },
            },
            "required": ["userMessage"],
        },
    },   
    {
        "type": "function",
        "function":{
            "name": "receiveMedia",
            "description": 
                "User will upload some media files, Whatsapp bot will fetch all of files to cloud.",
            "parameters": {
                "type": "object",
                "properties": {
                    "userMessage": { "type": "string" },
                },
            },
            "required": ["userMessage"],
        },
    }, 
];
function chatting(userMessage) {
    return "Hello";
}  
function createStory(userMessage) {
    return "This is user message";
}
function receiveMedia(userMessage) {
    return "Please share your context";
}
async function main() {
    const assistant = await openai.beta.assistants.create({
        name: "Whatsapp bot as video director",
        instructions:
        "You are a whatsapp bot, who will help users to create their video based on their uploaded media and context",
        tools: functionsList,
        model: "gpt-4-1106-preview",
    });
    // Log a first greeting
    console.log("\nHello there, I'm a director assistant.\n");
    // Create a thread
    const thread = await openai.beta.threads.create();
    let continueConversation = true;
    console.log("====> Start for conversation loop!");
    while (continueConversation) {
        // first ask the question and wait for the answer
        // we'll initiate with a quiz and then we'll keep the conversation going
        const userQuestion = prompt("Your next request to the bot: \n");
        console.log(`userQuestion: ${userQuestion}`);
        console.log("Add message to the thread");
        await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userQuestion,
        });

        console.log("Add request to run assistant")
        const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
        });

        console.log("Get the assistant response after run")
        let runStatus  = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id,
        );
        // Polling for run completion
        while (runStatus.status != 'requires_action') {
            console.log(`Run status: ${runStatus.status}`)
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }
        // Submitting functions outputs
        console.log(runStatus);

        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        console.log(`toolCalls: ${toolCalls}`);
        toolCalls.forEach(element => {
            console.log(element);
        });
        const waitForNext = prompt("Enter to continue...");

        const submitStatus = await openai.beta.threads.runs.submitToolOutputs(
            thread.id,
            run.id,
            {
              tool_outputs: [
                {
                  tool_call_id: toolCalls[0].id,
                  output: receiveMedia(userQuestion),
                },
                // {
                //   tool_call_id: toolCalls[1].id,
                //   output: createStory(userQuestion),
                // },
              ],
            }
          );
        console.log(submitStatus)
    }
}

main();