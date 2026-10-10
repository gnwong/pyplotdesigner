import { gunzipSync } from 'node:zlib';

export function decodeLayoutString(serialized: string) {
  const compressed = serialized.startsWith('ppd1:');
  const bytes = Buffer.from(compressed ? serialized.slice(5) : serialized, 'base64');
  return JSON.parse((compressed ? gunzipSync(bytes) : bytes).toString('utf8'));
}
