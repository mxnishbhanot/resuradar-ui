import { coerceBuilderTemplateId } from './resume-builder.model';

describe('coerceBuilderTemplateId', () => {
  it('always returns modern', () => {
    expect(coerceBuilderTemplateId(undefined)).toBe('modern');
    expect(coerceBuilderTemplateId('corporate')).toBe('modern');
    expect(coerceBuilderTemplateId('modern')).toBe('modern');
  });
});
