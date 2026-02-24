import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SharedFeedbackComponent } from './shared/shared-feedback/shared-feedback.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SharedFeedbackComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App { }
