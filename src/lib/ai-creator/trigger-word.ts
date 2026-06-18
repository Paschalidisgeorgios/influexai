/** Suggest a LoRA trigger word from creator name */

export function suggestTriggerWord(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);

  return slug ? `inflx_${slug}` : "inflx_creator_01";
}
