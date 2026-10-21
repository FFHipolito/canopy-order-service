import { describe, expect, it } from 'vitest';
import { IS_PUBLIC_KEY, Public } from './public.decorator.js';

describe('PublicDecorator', () => {
  it('deve definir a constante IS_PUBLIC_KEY e retornar um decorator customizado', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });
});
