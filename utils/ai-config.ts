import { createVertex } from "@ai-sdk/google-vertex";
import { createOpenAI } from "@ai-sdk/openai";

const credentials = {
  client_email: process.env.GCP_CLIENT_EMAIL,
  private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  project_id: process.env.GCP_PROJECT_ID,
}

// AI SDK Vertex AI
export const vertex = createVertex({
  baseURL: process.env.CLOUDFLARE_GATEWAY === 'true' 
    ? `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${process.env.CLOUDFLARE_GATEWAY_ID}/google-vertex-ai/v1/projects/${process.env.GCP_PROJECT_ID}/location/us-central1/publishers/google`
    : undefined,
  project: process.env.GCP_PROJECT_ID,
  googleAuthOptions: {
    credentials
  },
  location: process.env.CLOUDFLARE_GATEWAY ? 'us-central1' : 'global'
});

// AI SDK OpenAI
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: "strict",
  ...(process.env.CLOUDFLARE_GATEWAY === 'true' && {
    baseURL: `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${process.env.CLOUDFLARE_GATEWAY_ID}/openai`
  })
});
