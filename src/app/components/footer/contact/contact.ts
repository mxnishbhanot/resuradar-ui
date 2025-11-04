import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class Contact {
  name = '';
  email = '';
  message = '';
  submitted = false;

  constructor(private userService: UserService, private toast: ToastService) { }

  onSubmit() {
    if (!this.name || !this.email || !this.message) return this.toast.error('Please fill all fields.');

    this.userService.sendContact({
      name: this.name,
      email: this.email,
      message: this.message
    }).subscribe({
      next: (res) => {
        this.submitted = true;
      },
      error: (err) => {
        // console.error('Error submitting contact form:', err);
        this.toast.error('Something went wrong, please try again later.');
      }
    });
  }
}
