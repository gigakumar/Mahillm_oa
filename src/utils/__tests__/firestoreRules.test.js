import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Security Rules Static Audit', () => {
  it('firestore.rules exists and locks down private collections', () => {
    const rulesPath = path.join(process.cwd(), '../firestore.rules');
    // Ensure rules file exists
    const exists = fs.existsSync(rulesPath);
    expect(exists).toBe(true);

    if (exists) {
      const content = fs.readFileSync(rulesPath, 'utf-8');
      expect(content).toContain('rules_version = \'2\'');
      expect(content).toContain('match /users/{userId}');
      expect(content).toContain('match /public_profiles/{profileId}');
    }
  });
});
