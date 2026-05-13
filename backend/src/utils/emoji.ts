export function extractEmojis(input: string): string[] {
  const regex = /\p{Extended_Pictographic}/gu;
  const matches = input.match(regex);
  return matches ? matches : [];
}
