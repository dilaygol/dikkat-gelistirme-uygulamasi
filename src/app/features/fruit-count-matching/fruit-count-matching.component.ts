import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';

export interface FruitGroup {
  id: number;
  count: number;
  type: 'apple' | 'orange';
  isSelected: boolean;
  isMatched: boolean;
  isWrong: boolean;
}

interface FruitMatchingState {
  leftGroups: FruitGroup[];
  rightGroups: FruitGroup[];
  isCompleted: boolean;
}

const ID = 'fruit-count-matching';

@Component({
  selector: 'app-fruit-count-matching',
  standalone: true,
  imports: [CommonModule, ActionButtonsComponent],
  templateUrl: './fruit-count-matching.component.html',
  styleUrl: './fruit-count-matching.component.scss'
})
export class FruitCountMatchingComponent implements OnInit {
  leftGroups: FruitGroup[] = [
    { id: 1, count: 3, type: 'apple', isSelected: false, isMatched: false, isWrong: false },
    { id: 2, count: 2, type: 'apple', isSelected: false, isMatched: false, isWrong: false },
    { id: 3, count: 4, type: 'apple', isSelected: false, isMatched: false, isWrong: false },
    { id: 4, count: 5, type: 'apple', isSelected: false, isMatched: false, isWrong: false }
  ];

  rightGroups: FruitGroup[] = [
    { id: 5, count: 4, type: 'orange', isSelected: false, isMatched: false, isWrong: false },
    { id: 6, count: 3, type: 'orange', isSelected: false, isMatched: false, isWrong: false },
    { id: 7, count: 5, type: 'orange', isSelected: false, isMatched: false, isWrong: false },
    { id: 8, count: 2, type: 'orange', isSelected: false, isMatched: false, isWrong: false }
  ];

  isChecking = false;

  constructor(
    private router: Router,
    private gs: GameStateService,
    private fb: FeedbackService,
    private hintService: HintService
  ) { }

  get showHint(): boolean {
    return this.hintService.shouldShowHint(ID);
  }

  get hintTargetCount(): number | null {
    if (!this.showHint) return null;

    const selectedLeft = this.leftGroups.find(g => g.isSelected);
    if (selectedLeft) return selectedLeft.count;

    const selectedRight = this.rightGroups.find(g => g.isSelected);
    if (selectedRight) return selectedRight.count;

    const firstUnmatchedLeft = this.leftGroups.find(g => !g.isMatched);
    return firstUnmatchedLeft ? firstUnmatchedLeft.count : null;
  }

  get isNextUnlocked(): boolean {
    return this.leftGroups.every(g => g.isMatched) || this.gs.isCompleted(ID);
  }

  ngOnInit(): void {
    const saved = this.gs.getData<FruitMatchingState>(ID);
    if (saved) {
      this.leftGroups = saved.leftGroups || this.leftGroups;
      this.rightGroups = saved.rightGroups || this.rightGroups;
    }
  }

  persist(): void {
    this.gs.save(ID, {
      leftGroups: this.leftGroups,
      rightGroups: this.rightGroups,
      isCompleted: this.isNextUnlocked
    });
  }

  selectGroup(group: FruitGroup): void {
    if (this.isChecking || group.isMatched || this.isNextUnlocked) return;

    // Her sütundan sadece biri seçilebilir
    if (group.type === 'apple') {
      this.leftGroups.forEach(g => g.isSelected = false);
      group.isSelected = true;
    } else {
      this.rightGroups.forEach(g => g.isSelected = false);
      group.isSelected = true;
    }

    this.checkMatch();
  }

  checkMatch(): void {
    const selectedLeft = this.leftGroups.find(g => g.isSelected);
    const selectedRight = this.rightGroups.find(g => g.isSelected);

    if (selectedLeft && selectedRight) {
      if (selectedLeft.count === selectedRight.count) {
        // Correct match
        selectedLeft.isMatched = true;
        selectedRight.isMatched = true;
        selectedLeft.isSelected = false;
        selectedRight.isSelected = false;

        if (this.isNextUnlocked) {
          this.gs.markCompleted(ID);
          this.hintService.resetErrors(ID);
          this.fb.showFeedback('success', 'Harika! Tüm meyveleri doğru eşleştirdin.');
        }

        this.persist();
      } else {
        // Wrong match
        this.isChecking = true;
        this.hintService.registerError(ID);
        selectedLeft.isWrong = true;
        selectedRight.isWrong = true;
        selectedLeft.isSelected = false;
        selectedRight.isSelected = false;
        this.fb.showFeedback('error', 'Bu gruplardaki meyve sayıları eşit değil. Tekrar dene!');

        setTimeout(() => {
          selectedLeft.isWrong = false;
          selectedRight.isWrong = false;
          this.isChecking = false;
        }, 500);
      }
    }
  }

  clearSelection(): void {
    this.leftGroups.forEach(g => {
      g.isSelected = false;
      g.isMatched = false;
      g.isWrong = false;
    });
    this.rightGroups.forEach(g => {
      g.isSelected = false;
      g.isMatched = false;
      g.isWrong = false;
    });
    this.gs.clear(ID);
    this.hintService.resetErrors(ID);
  }

  getArray(count: number): any[] {
    return new Array(count);
  }

  goPrev(): void {
    this.router.navigate(['/dot-pattern-drawing']);
  }

  goNext(): void {
    if (!this.isNextUnlocked) return;
    this.router.navigate(['/find-most-balls']);
  }
}
