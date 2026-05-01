import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../core/services/activity.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { GameStateService } from '../../core/services/game-state.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';
import { SharedFeedbackComponent } from '../../shared/shared-feedback/shared-feedback.component';

interface ShapeItem {
  id: number;
  type: string;
  isDashed: boolean;
  correctMatchId: number;
  assignedMatchId: number | null;
  color: string;
}

const ID = 'shape-matching-drawn';

@Component({
  selector: 'app-shape-matching-drawn',
  standalone: true,
  imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent, SharedFeedbackComponent],
  templateUrl: './shape-matching-drawn.component.html',
  styleUrl: './shape-matching-drawn.component.scss'
})
export class ShapeMatchingDrawnComponent implements OnInit {
  private activityService = inject(ActivityService);
  private feedbackService = inject(FeedbackService);
  private gameStateService = inject(GameStateService);

  isCompleted = false;
  checkAlwaysDisabled = false;

  topShapes: ShapeItem[] = [
    { id: 101, type: 'pentagon', isDashed: false, correctMatchId: 203, assignedMatchId: null, color: '#333' },
    { id: 102, type: 'triangle', isDashed: false, correctMatchId: 201, assignedMatchId: null, color: '#333' },
    { id: 103, type: 'circle',   isDashed: false, correctMatchId: 202, assignedMatchId: null, color: '#333' },
    { id: 104, type: 'square',   isDashed: false, correctMatchId: 204, assignedMatchId: null, color: '#333' }
  ];

  bottomShapes: ShapeItem[] = [
    { id: 201, type: 'triangle', isDashed: false, correctMatchId: 102, assignedMatchId: null, color: '#333' },
    { id: 202, type: 'circle',   isDashed: false, correctMatchId: 103, assignedMatchId: null, color: '#333' },
    { id: 203, type: 'pentagon', isDashed: false, correctMatchId: 101, assignedMatchId: null, color: '#333' },
    { id: 204, type: 'square',   isDashed: false, correctMatchId: 104, assignedMatchId: null, color: '#333' }
  ];

  selectedTopId: number | null = null;
  selectedBottomId: number | null = null;

  ngOnInit(): void {
    const saved = this.gameStateService.getData<any>(ID);
    if (saved) {
      this.isCompleted = saved.isCompleted;
      if (saved.matchings) {
        saved.matchings.forEach((m: any) => {
          const top = this.topShapes.find(s => s.id === m.topId);
          const bottom = this.bottomShapes.find(s => s.id === m.bottomId);
          if (top && bottom) {
            top.assignedMatchId = bottom.id;
            bottom.assignedMatchId = top.id;
          }
        });
      }
    }
  }

  selectTop(id: number): void {
    if (this.isCompleted) return;
    this.selectedTopId = this.selectedTopId === id ? null : id;
    this.checkMatch();
  }

  selectBottom(id: number): void {
    if (this.isCompleted) return;
    this.selectedBottomId = this.selectedBottomId === id ? null : id;
    this.checkMatch();
  }

  private checkMatch(): void {
    if (this.selectedTopId !== null && this.selectedBottomId !== null) {
      const top = this.topShapes.find(s => s.id === this.selectedTopId);
      const bottom = this.bottomShapes.find(s => s.id === this.selectedBottomId);

      if (top && bottom) {
        // Clear previous assignments for these items
        this.topShapes.forEach(s => { if (s.assignedMatchId === bottom.id) s.assignedMatchId = null; });
        this.bottomShapes.forEach(s => { if (s.assignedMatchId === top.id) s.assignedMatchId = null; });

        top.assignedMatchId = bottom.id;
        bottom.assignedMatchId = top.id;
      }

      this.selectedTopId = null;
      this.selectedBottomId = null;
      this.persist();
    }
  }

  private persist(): void {
    const matchings = this.topShapes
      .filter(s => s.assignedMatchId !== null)
      .map(s => ({ topId: s.id, bottomId: s.assignedMatchId }));

    this.gameStateService.save(ID, {
      isCompleted: this.isCompleted,
      matchings: matchings
    });
  }

  onReset(): void {
    this.isCompleted = false;
    this.topShapes.forEach(s => s.assignedMatchId = null);
    this.bottomShapes.forEach(s => s.assignedMatchId = null);
    this.selectedTopId = null;
    this.selectedBottomId = null;
    this.gameStateService.clear(ID);
  }

  onCheck(): void {
    const allMatched = this.topShapes.every(s => s.assignedMatchId !== null);
    if (!allMatched) {
      this.feedbackService.showWrong();
      return;
    }

    const allCorrect = this.topShapes.every(s => s.assignedMatchId === s.correctMatchId);

    if (allCorrect) {
      this.isCompleted = true;
      this.feedbackService.showCorrect();
      this.gameStateService.markCompleted(ID);
    } else {
      this.feedbackService.showWrong();
    }
    this.persist();
  }

  prev(): void { this.activityService.prev(); }
  next(): void { this.activityService.next(); }
}
