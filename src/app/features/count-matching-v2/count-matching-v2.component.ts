import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivityService } from '../../core/services/activity.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { GameStateService } from '../../core/services/game-state.service';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { SharedFeedbackComponent } from '../../shared/shared-feedback/shared-feedback.component';

interface Group {
  id: number;
  count: number;
  emoji: string;
  type: 'left' | 'right';
  isSelected: boolean;
  isMatched: boolean;
}

const ID = 'count-matching-v2';

@Component({
  selector: 'app-count-matching-v2',
  standalone: true,
  imports: [CommonModule, ActivityHeaderComponent, ActionButtonsComponent, SharedFeedbackComponent],
  templateUrl: './count-matching-v2.component.html',
  styleUrl: './count-matching-v2.component.scss'
})
export class CountMatchingV2Component implements OnInit {
  private router = inject(Router);
  private activityService = inject(ActivityService);
  private feedbackService = inject(FeedbackService);
  private gameStateService = inject(GameStateService);

  isCompleted = false;
  checkAlwaysDisabled = false;

  leftGroups: Group[] = [
    { id: 1, count: 2, emoji: '🍉', type: 'left', isSelected: false, isMatched: false },
    { id: 2, count: 5, emoji: '🍉', type: 'left', isSelected: false, isMatched: false },
    { id: 3, count: 7, emoji: '🍉', type: 'left', isSelected: false, isMatched: false },
  ];

  rightGroups: Group[] = [
    { id: 4, count: 5, emoji: '🍓', type: 'right', isSelected: false, isMatched: false },
    { id: 5, count: 2, emoji: '🍓', type: 'right', isSelected: false, isMatched: false },
    { id: 6, count: 7, emoji: '🍓', type: 'right', isSelected: false, isMatched: false },
  ];

  selectedLeftId: number | null = null;
  selectedRightId: number | null = null;

  ngOnInit(): void {
    const savedData = this.gameStateService.getData<any>(ID);
    if (savedData) {
      this.isCompleted = savedData.isCompleted;
    }
  }

  selectLeft(id: number): void {
    if (this.isCompleted) return;
    this.selectedLeftId = this.selectedLeftId === id ? null : id;
    this.checkAutoMatch();
  }

  selectRight(id: number): void {
    if (this.isCompleted) return;
    this.selectedRightId = this.selectedRightId === id ? null : id;
    this.checkAutoMatch();
  }

  private checkAutoMatch(): void {
    if (this.selectedLeftId !== null && this.selectedRightId !== null) {
      const left = this.leftGroups.find(g => g.id === this.selectedLeftId);
      const right = this.rightGroups.find(g => g.id === this.selectedRightId);

      if (left && right) {
        // Just store selection, actual matching happens on "Check" or real-time?
        // Let's do real-time feedback like the previous matching games.
        if (left.count === right.count) {
          left.isMatched = true;
          right.isMatched = true;
          this.selectedLeftId = null;
          this.selectedRightId = null;
          this.checkAllCompleted();
        } else {
          // Visual feedback for mismatch
          setTimeout(() => {
            this.selectedLeftId = null;
            this.selectedRightId = null;
          }, 300);
        }
      }
    }
  }

  private checkAllCompleted(): void {
    if (this.leftGroups.every(g => g.isMatched)) {
      this.isCompleted = true;
      this.feedbackService.showCorrect();
      this.gameStateService.markCompleted(ID);
    }
  }

  onReset(): void {
    this.isCompleted = false;
    this.leftGroups.forEach(g => g.isMatched = false);
    this.rightGroups.forEach(g => g.isMatched = false);
    this.selectedLeftId = null;
    this.selectedRightId = null;
    this.gameStateService.clear(ID);
  }

  onCheck(): void {
    if (this.isCompleted) {
      this.feedbackService.showCorrect();
    } else {
      this.feedbackService.showWrong();
    }
  }

  prev(): void { this.activityService.prev(); }
  next(): void { this.activityService.next(); }

  getArray(count: number): any[] {
    return new Array(count);
  }
}
