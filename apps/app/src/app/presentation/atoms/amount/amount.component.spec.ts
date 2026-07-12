import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AmountComponent } from './amount.component';

describe('AmountComponent', () => {
  let fixture: ComponentFixture<AmountComponent>;

  function render(value: number, sign: '' | '+' | '−' = ''): HTMLElement {
    fixture.componentRef.setInput('value', value);
    if (sign) {
      fixture.componentRef.setInput('sign', sign);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AmountComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
    });
    fixture = TestBed.createComponent(AmountComponent);
  });

  it('P2 — affiche le signe « − » pour une valeur négative (solde débiteur)', () => {
    const host = render(-42.5);
    const sign = host.querySelector('.sign');
    expect(sign?.textContent?.trim()).toBe('−');
  });

  it('n’affiche aucun signe pour une valeur positive par défaut', () => {
    const host = render(42.5);
    expect(host.querySelector('.sign')).toBeNull();
  });

  it('affiche un « + » explicite quand demandé (revenu dans une liste mixte)', () => {
    const host = render(100, '+');
    expect(host.querySelector('.sign')?.textContent?.trim()).toBe('+');
  });

  it('sépare partie entière, décimales et devise', () => {
    const host = render(1234.5);
    expect(host.querySelector('.int')?.textContent).toContain('234');
    expect(host.querySelector('.frac')?.textContent).toContain('50');
    expect(host.querySelector('.cur')?.textContent).toContain('€');
  });
});
