import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Category } from '../../../domain/models/category.model';
import { CategoryPickerComponent } from './category-picker.component';

function category(id: string, order: number): Category {
  return {
    id,
    name: `Catégorie ${id}`,
    type: 'income',
    parentId: null,
    icon: 'dots',
    color: '#018472',
    isDefault: true,
    displayOrder: order,
    isArchived: false,
  };
}

const ALL_CATEGORIES = Array.from({ length: 10 }, (_, index) => category(`cat-${index}`, index));
const PRIMARY_IDS = ['cat-0', 'cat-1', 'cat-2'];

describe('CategoryPickerComponent (P5 — révélation progressive)', () => {
  let fixture: ComponentFixture<CategoryPickerComponent>;
  let host: HTMLElement;

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(host.querySelectorAll('button[role="option"]'));
  }

  function moreButton(): HTMLButtonElement | null {
    return host.querySelector('button.more');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CategoryPickerComponent] });
    fixture = TestBed.createComponent(CategoryPickerComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('affiche toutes les catégories quand le picker n’est pas repliable', () => {
    fixture.componentRef.setInput('categories', ALL_CATEGORIES);
    fixture.detectChanges();
    expect(optionButtons()).toHaveLength(10);
    expect(moreButton()).toBeNull();
  });

  it('ne montre que les catégories prioritaires + un bouton « Plus » quand replié', () => {
    fixture.componentRef.setInput('categories', ALL_CATEGORIES);
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('primaryIds', PRIMARY_IDS);
    fixture.detectChanges();

    expect(optionButtons()).toHaveLength(3);
    expect(moreButton()?.textContent).toContain('Plus de catégories');
  });

  it('déplie toutes les catégories au clic sur « Plus de catégories »', () => {
    fixture.componentRef.setInput('categories', ALL_CATEGORIES);
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('primaryIds', PRIMARY_IDS);
    fixture.detectChanges();

    moreButton()!.click();
    fixture.detectChanges();

    expect(optionButtons()).toHaveLength(10);
    expect(moreButton()?.textContent).toContain('Moins de catégories');
  });

  it('garde visible une catégorie sélectionnée même si elle n’est pas prioritaire', () => {
    fixture.componentRef.setInput('categories', ALL_CATEGORIES);
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('primaryIds', PRIMARY_IDS);
    fixture.componentRef.setInput('selectedId', 'cat-9');
    fixture.detectChanges();

    const visibleIds = optionButtons().map((button) =>
      button.querySelector('.label')?.textContent?.trim(),
    );
    expect(optionButtons()).toHaveLength(4); // 3 prioritaires + la sélection
    expect(visibleIds).toContain('Catégorie cat-9');
  });

  it('émet l’identifiant de la catégorie choisie au clic', () => {
    fixture.componentRef.setInput('categories', ALL_CATEGORIES);
    fixture.detectChanges();

    let emitted: string | null = null;
    fixture.componentInstance.select.subscribe((id) => (emitted = id));

    optionButtons()[4].click();
    fixture.detectChanges();

    expect(emitted).toBe('cat-4');
  });
});
