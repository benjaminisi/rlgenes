// Auto-generated index of encrypted templates
// Do not edit manually - updated by scripts/encrypt-template.mjs
import type { EncryptedTemplatePayload } from '../../types';

import template_0_breast_cancer from './breast_cancer.enc';
import template_1_example_test from './example_test.enc';

export const encryptedTemplates: Record<string, EncryptedTemplatePayload> = {
  'breast_cancer': template_0_breast_cancer,
  'example_test': template_1_example_test,
};

export function getEncryptedTemplate(id: string): EncryptedTemplatePayload | undefined {
  return encryptedTemplates[id];
}
