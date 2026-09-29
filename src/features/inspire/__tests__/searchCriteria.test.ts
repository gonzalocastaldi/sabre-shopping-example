import { describe, expect, it } from 'vitest';
import { plusDays, today } from '@/api/mappers';
import { criteriaFromSearch } from '@/app/urlState';
import { emptyCriteria, validateCriteria } from '../SearchForm';

describe('buscador: origen y duración del viaje', () => {
  it('arranca sin origen predeterminado y pide elegirlo', () => {
    const c = emptyCriteria();
    expect(c.origins).toEqual([]);
    expect(validateCriteria(c)).toBe('Elegí desde dónde salís.');
  });

  it('la duración va en días, de 1 a 21, un solo valor', () => {
    expect(criteriaFromSearch({ o: 'BUE', los: '8' })?.lengthsOfStay).toEqual([8]);
    // Fuera de rango o inválido: vuelve a 7 días.
    expect(criteriaFromSearch({ o: 'BUE', los: '0,22,abc' })?.lengthsOfStay).toEqual([7]);
    // Links viejos con varios valores siguen funcionando (sin repetidos).
    expect(criteriaFromSearch({ o: 'BUE', los: '3,7,7' })?.lengthsOfStay).toEqual([3, 7]);
  });

  it('con fechas exactas, el viaje no puede pasar de 21 días', () => {
    const dep = plusDays(today(), 30);
    const exact = { ...emptyCriteria(), origins: ['BUE'], dateMode: 'exact' as const, departDate: dep };
    expect(validateCriteria({ ...exact, returnDate: plusDays(dep, 21) })).toBeUndefined();
    expect(validateCriteria({ ...exact, returnDate: plusDays(dep, 22) })).toBe('Flight Search admite viajes de 1 a 21 días.');
    expect(validateCriteria({ ...exact, returnDate: dep })).toBe('La vuelta tiene que ser después de la ida.');
  });
});
