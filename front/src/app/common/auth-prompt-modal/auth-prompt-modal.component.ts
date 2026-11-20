import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthPromptService } from '../services/auth-prompt.service';

@Component({
  selector: 'app-auth-prompt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-prompt-modal.component.html',
  styleUrl: './auth-prompt-modal.component.scss'
})
export class AuthPromptModalComponent {
  public readonly authPrompt = inject(AuthPromptService);
}
