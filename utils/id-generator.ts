import cuid from 'cuid';

/**
 * Generates a unique ID using cuid
 * This should be used for all database IDs except auth user IDs
 * @returns A cuid string
 */
export function generateId(): string {
  return cuid();
}
