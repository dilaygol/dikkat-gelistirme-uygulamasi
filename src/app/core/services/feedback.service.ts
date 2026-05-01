import { Injectable, signal } from '@angular/core';

export type FeedbackStatus = 'success' | 'error';
export interface FeedbackState {
    status: FeedbackStatus;
    message: string;
    visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
    readonly state = signal<FeedbackState>({ status: 'success', message: '', visible: false });
    private timer: any;

    showFeedback(status: FeedbackStatus, message: string): void {
        this.state.set({ status, message, visible: true });
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.state.update(s => ({ ...s, visible: false }));
        }, 2500);
    }

    showCorrect(): void {
        this.showFeedback('success', 'Harika! Doğru cevap! 🎨');
    }

    showWrong(): void {
        this.showFeedback('error', 'Tekrar Denemelisin 🧐');
    }

    hideFeedback(): void {
        this.state.update(s => ({ ...s, visible: false }));
        if (this.timer) clearTimeout(this.timer);
    }
}
