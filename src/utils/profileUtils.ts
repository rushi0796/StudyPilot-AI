/**
 * StudyPilot AI - Single Source of Truth for Student Profile Identity & Avatar Initials
 */

/**
 * Generate avatar initials dynamically from the saved student name.
 * 
 * Rules:
 * - Empty, null, or whitespace-only name -> "ST" (neutral fallback for Student)
 * - Single word -> First character in uppercase (e.g., "Rushikesh" -> "R")
 * - Multiple words -> First character of first word + first character of second word in uppercase
 *   (e.g., "Imam Hussain" -> "IH", "Aken Rushikesh Gopal" -> "AR")
 * - Handles extra spaces, tabs, numbers, or symbols safely.
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'ST';
  const clean = name.trim();
  if (!clean) return 'ST';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';

  if (parts.length === 1) {
    const firstChar = parts[0].charAt(0).toUpperCase();
    return firstChar || 'ST';
  }

  // Consistent two-initial rule: first word initial + second word initial
  const first = parts[0].charAt(0).toUpperCase();
  const second = parts[1].charAt(0).toUpperCase();
  return (first + second) || 'ST';
}

/**
 * Format student name for compact UI surfaces (e.g. navigation header bar).
 * 
 * Rules:
 * - Empty or missing -> "Student"
 * - Single word -> The full word (e.g., "Rushikesh")
 * - Multiple words -> "FirstName L." (e.g., "Imam H.", "Aken R.")
 */
export function formatDisplayName(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'Student';
  const clean = name.trim();
  if (!clean) return 'Student';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Student';
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const secondInitial = parts[1].charAt(0).toUpperCase();
  return `${first} ${secondInitial}.`;
}

/**
 * Check whether a stored student profile is valid and has completed onboarding.
 */
export function isProfileValid(profile: any): boolean {
  if (!profile || typeof profile !== 'object') return false;
  if (!profile.name || typeof profile.name !== 'string' || !profile.name.trim()) return false;
  return profile.onboardingCompleted === true;
}
