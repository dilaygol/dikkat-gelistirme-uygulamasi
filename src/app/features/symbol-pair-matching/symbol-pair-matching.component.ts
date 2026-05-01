import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivityService } from '../../core/services/activity.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { GameStateService } from '../../core/services/game-state.service';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { SharedFeedbackComponent } from '../../shared/shared-feedback/shared-feedback.component';

interface SymbolCard {
  id: number;
  symbol: string;
  color: string;
  isMatched: boolean;
  isSelected: boolean;
}

const ID = 'symbol-pair-matching';

@Component({
  selector: 'app-symbol-pair-matching',
  standalone: true,
  imports: [CommonModule, ActivityHeaderComponent, ActionButtonsComponent, SharedFeedbackComponent],
  templateUrl: './symbol-pair-matching.component.html',
  styleUrl: './symbol-pair-matching.component.scss'
})
export class SymbolPairMatchingComponent implements OnInit {
  private router = inject(Router);
  private activityService = inject(ActivityService);
  private feedbackService = inject(FeedbackService);
  private gameStateService = inject(GameStateService);

  isCompleted = false;
  checkAlwaysDisabled = true; // Matching is real-time in this logic

  cards: SymbolCard[] = [
    { id: 1, symbol: '■', color: '#10b981', isMatched: false, isSelected: false },
    { id: 2, symbol: '▲', color: '#3b82f6', isMatched: false, isSelected: false },
    { id: 3, symbol: '●', color: '#8b5cf6', isMatched: false, isSelected: false },
    { id: 4, symbol: '▲', color: '#3b82f6', isMatched: false, isSelected: false },
    { id: 5, symbol: '●', color: '#8b5cf6', isMatched: false, isSelected: false },
    { id: 6, symbol: '■', color: '#10b981', isMatched: false, isSelected: false },
  ];

  selectedCardId: number | null = null;

  ngOnInit(): void {
    // Shuffle cards for variety
    this.cards = this.shuffle(this.cards);
    
    const savedData = this.gameStateService.getData<any>(ID);
    if (savedData) {
      this.isCompleted = savedData.isCompleted;
    }
  }

  private shuffle(array: any[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  selectCard(id: number): void {
    if (this.isCompleted) return;
    const card = this.cards.find(c => c.id === id);
    if (!card || card.isMatched) return;

    if (this.selectedCardId === id) {
      card.isSelected = false;
      this.selectedCardId = null;
      return;
    }

    if (this.selectedCardId === null) {
      card.isSelected = true;
      this.selectedCardId = id;
    } else {
      const firstCard = this.cards.find(c => c.id === this.selectedCardId);
      if (firstCard && firstCard.symbol === card.symbol) {
        // Match found
        firstCard.isMatched = true;
        card.isMatched = true;
        firstCard.isSelected = false;
        card.isSelected = false;
        this.selectedCardId = null;
        this.checkAllMatched();
      } else {
        // No match
        card.isSelected = true;
        setTimeout(() => {
          if (firstCard) firstCard.isSelected = false;
          card.isSelected = false;
          this.selectedCardId = null;
        }, 500);
      }
    }
  }

  private checkAllMatched(): void {
    if (this.cards.every(c => c.isMatched)) {
      this.isCompleted = true;
      this.feedbackService.showCorrect();
      this.gameStateService.markCompleted(ID);
    }
  }

  onReset(): void {
    this.isCompleted = false;
    this.cards.forEach(c => {
      c.isMatched = false;
      c.isSelected = false;
    });
    this.selectedCardId = null;
    this.cards = this.shuffle(this.cards);
    this.gameStateService.clear(ID);
  }

  onCheck(): void {
    // Already handled in selectCard logic for this game type
    if (this.isCompleted) {
       this.feedbackService.showCorrect();
    } else {
       this.feedbackService.showWrong();
    }
  }

  prev(): void { this.activityService.prev(); }
  next(): void { this.activityService.next(); }
}
