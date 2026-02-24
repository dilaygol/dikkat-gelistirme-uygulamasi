import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ActionButtonsComponent – Tüm etkinlik sayfalarında ortak kullanılan
 * "Baştan Başla" ve "Kontrol Et" butonları.
 *
 * @Input  isCompleted         – true ise Kontrol Et disabled olur
 * @Input  checkAlwaysDisabled – shade-sorting gibi otomatik kontrollü
 *                               sayfalarda Kontrol Et daima disabled
 * @Output reset               – Baştan Başla tıklandığında yayılır
 * @Output check               – Kontrol Et tıklandığında yayılır
 */
@Component({
    selector: 'app-action-buttons',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="action-buttons">
            <button class="btn btn-clear" (click)="reset.emit()">
                <span class="material-icons btn-icon">refresh</span> Baştan Başla
            </button>
            <button
                class="btn btn-check"
                (click)="check.emit()"
                [disabled]="isCompleted || checkAlwaysDisabled"
            >
                <span class="material-icons btn-icon">check_circle</span> Kontrol Et
            </button>
        </div>
    `,
})
export class ActionButtonsComponent {
    /** Oyun tamamlandığında Kontrol Et kilitlenir */
    @Input() isCompleted = false;

    /** Otomatik-kontrollü sayfalarda (shade-sorting) Kontrol Et daima kapalı */
    @Input() checkAlwaysDisabled = false;

    /** Baştan Başla tıklandı */
    @Output() reset = new EventEmitter<void>();

    /** Kontrol Et tıklandı */
    @Output() check = new EventEmitter<void>();
}
