import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ManifestSchema,
  TopicSchema,
  SyntaxConstructSchema,
  MistakeSchema,
  PatternSchema,
  ExerciseSchema,
  QuizSchema,
  ConceptNodeSchema,
} from '../../packages/schemas/src/content.ts';

export interface ValidationReport {
  pass: boolean;
  filesChecked: number;
  errors: string[];
}

export function getSchemaForFile(filePath: string): any {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.endsWith('manifest.json')) return ManifestSchema;
  if (normalized.includes('/topics/')) return TopicSchema;
  if (normalized.includes('/syntax/')) return SyntaxConstructSchema;
  if (normalized.includes('/mistakes/')) return MistakeSchema;
  if (normalized.includes('/patterns/')) return PatternSchema;
  if (normalized.includes('/exercises/')) return ExerciseSchema;
  if (normalized.includes('/quizzes/')) return QuizSchema;
  if (normalized.includes('/concepts/')) return ConceptNodeSchema;
  return null;
}

export function validateContentFile(filePath: string): { pass: boolean; errors: string[] } {
  const schema = getSchemaForFile(filePath);
  if (!schema) {
    return { pass: true, errors: [] }; // Not a recognized schema target
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const result = schema.safeParse(data);
    if (!result.success) {
      const msgs = result.issues.map((i: any) => `[${i.path.join('.') || 'root'}]: ${i.message}`);
      return { pass: false, errors: msgs };
    }
    return { pass: true, errors: [] };
  } catch (err: any) {
    return { pass: false, errors: [`JSON Parse Error in ${filePath}: ${err.message}`] };
  }
}

export function validateContentDirectory(dirPath: string): ValidationReport {
  const errors: string[] = [];
  let filesChecked = 0;

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        filesChecked++;
        const res = validateContentFile(full);
        if (!res.pass) {
          errors.push(`File ${full} failed validation:\n${res.errors.map(e => `  - ${e}`).join('\n')}`);
        }
      }
    }
  }

  walk(dirPath);
  return {
    pass: errors.length === 0,
    filesChecked,
    errors,
  };
}
