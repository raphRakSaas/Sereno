import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SavingsGoalsStore } from '../../../application/stores/savings-goals.store';
import { ToastService } from '../../../application/services/toast.service';

@Component({
  selector: 'app-savings-goal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './savings-goal.page.html',
  styleUrl: './savings-goal.page.scss',
})
export class SavingsGoalPage {
  protected readonly goals = inject(SavingsGoalsStore);
  private readonly toast = inject(ToastService);

  private readonly current = computed(() => this.goals.items()[0] ?? null);

  protected readonly name = signal('');
  protected readonly targetText = signal('');
  protected readonly currentText = signal('');
  protected readonly hint = signal('');

  constructor() {
    if (!this.goals.loaded()) {
      void this.goals.load();
    }
    // Pré-remplit le formulaire une fois l'objectif existant chargé.
    effect(() => {
      const goal = this.current();
      if (goal) {
        this.name.set(goal.name);
        this.targetText.set(goal.targetAmount.toString().replace('.', ','));
        this.currentText.set(goal.currentAmount.toString().replace('.', ','));
      }
    });
  }

  protected async save(): Promise<void> {
    const name = this.name().trim();
    if (!name) {
      this.hint.set('Donne un nom à ton objectif — par exemple "Vacances".');
      return;
    }
    const targetAmount = Number.parseFloat(this.targetText().replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      this.hint.set('Indique un montant cible supérieur à zéro.');
      return;
    }
    const currentAmount = Number.parseFloat(this.currentText().replace(/\s/g, '').replace(',', '.')) || 0;
    this.hint.set('');

    const goal = this.current();
    const success = goal
      ? await this.goals.update(goal.id, { name, targetAmount, currentAmount })
      : await this.goals.add({ name, targetAmount, currentAmount });
    if (success) {
      this.toast.show('Objectif enregistré.');
    }
  }

  protected async remove(): Promise<void> {
    const goal = this.current();
    if (!goal) return;
    await this.goals.remove(goal.id);
    this.name.set('');
    this.targetText.set('');
    this.currentText.set('');
    this.toast.show('Objectif supprimé.');
  }
}
