import { Component, signal } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { firstValueFrom } from 'rxjs';

import { UserService } from '../../../core/services/user';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    CdkTextareaAutosize
],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class Contact {

  /** Signals for form fields */
  name = signal<string>('');
  email = signal<string>('');
  message = signal<string>('');

  /** UI state */
  submitted = signal(false);

  constructor(
    private userService: UserService,
    private toast: ToastService
  ) {}

  async onSubmit() {
    if (!this.name() || !this.email() || !this.message()) {
      this.toast.show(
        'error',
        'Validation Error',
        'Please fill all fields.',
        5000
      );
      return;
    }

    try {
      await firstValueFrom(
        this.userService.sendContact({
          name: this.name(),
          email: this.email(),
          message: this.message()
        })
      );

      this.submitted.set(true);

    } catch (err) {
      this.toast.show(
        'error',
        'Error',
        'Something went wrong, please try again later.',
        5000
      );
    }
  }
}
