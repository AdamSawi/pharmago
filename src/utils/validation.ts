export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Ce champ est obligatoire';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Email invalide';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Ce champ est obligatoire';
  if (value.length < 6) return 'Mot de passe trop court (6 caractères minimum)';
  return null;
}

export function validateRequired(value: string, label = 'Ce champ'): string | null {
  if (!value.trim()) return 'Ce champ est obligatoire';
  return null;
}
