import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

const ChatGPTModel =
  "gpt-3.5-turbo" ||
  "text-davinci-003" ||
  "text-curie-001" ||
  "text-babbage-001" ||
  "text-ada-001";

const ChatGPTAgent = "user" || "system";

const ChatGPTMessage = {
  role: ChatGPTAgent,
  content: "",
};

const OpenAIStreamPayload = {
  model: ChatGPTModel,
  messages: [ChatGPTMessage],
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 50,
  stream: true,
  n: 1,
};

async function OpenAIStream(payload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let counter = 0;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event) {
        if (event.type === "event") {
          const data = event.data;
          
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta?.content || "";
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // maybe parse error
            controller.error(e);
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse);
      
      for await (const chunk of res.body) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
}