import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-end-page',
    standalone: true,
    templateUrl: './end-page.component.html',
    styleUrl: './end-page.component.scss',
})
export class EndPageComponent {
    constructor(private router: Router) { }

    goHome(): void {
        this.router.navigate(['/']);
    }
}
