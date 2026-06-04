export function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (password.length < 6) return 0;
  if (password.length < 8) return 1;
  let score = 2;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9!@#$%^&*]/.test(password)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

export const strengthBarColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-[#B4FF00]",
] as const;
