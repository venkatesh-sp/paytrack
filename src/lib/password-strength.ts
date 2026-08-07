export type PasswordStrength = {
  score: number; // 0-4
  label: string;
  colorClass: string;
};

const LEVELS: Omit<PasswordStrength, "score">[] = [
  { label: "Weak", colorClass: "bg-destructive" },
  { label: "Fair", colorClass: "bg-warning" },
  { label: "Good", colorClass: "bg-warning" },
  { label: "Strong", colorClass: "bg-success" },
];

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", colorClass: "bg-muted" };

  let checks = 0;
  if (password.length >= 8) checks++;
  if (password.length >= 12) checks++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) checks++;
  if (/[0-9]/.test(password)) checks++;
  if (/[^A-Za-z0-9]/.test(password)) checks++;

  const score = Math.max(1, Math.min(4, checks));
  return { score, ...LEVELS[score - 1] };
}
