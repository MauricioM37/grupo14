import { AI_CAPABILITY, type ProviderStep } from './types';

export const STT_PROVIDER_CHAIN: ProviderStep[] = [
  { id: 'groq1', provider: 'groq', keyIndex: 0, model: process.env['GROQ_STT_MODEL'] ?? 'whisper-large-v3-turbo', capability: AI_CAPABILITY.STT },
  { id: 'groq2', provider: 'groq', keyIndex: 1, model: process.env['GROQ_STT_MODEL'] ?? 'whisper-large-v3-turbo', capability: AI_CAPABILITY.STT },
];

export const CHAT_PROVIDER_CHAIN: ProviderStep[] = [
  { id: 'groq1', provider: 'groq', keyIndex: 0, model: process.env['GROQ_CHAT_MODEL'] ?? 'llama-3.3-70b-versatile', capability: AI_CAPABILITY.CHAT },
  { id: 'groq2', provider: 'groq', keyIndex: 1, model: process.env['GROQ_CHAT_MODEL'] ?? 'llama-3.3-70b-versatile', capability: AI_CAPABILITY.CHAT },
];

export function availableGroqSteps(chain: ProviderStep[], keys: [string, string?]): ProviderStep[] {
  return chain.filter((step) => Boolean(keys[step.keyIndex]));
}
