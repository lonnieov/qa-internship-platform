import OpenAI from "openai";

export function getGroqModel() {
  return process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
}

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  });
}
