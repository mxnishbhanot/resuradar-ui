import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../../core/services/user';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
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
    if (!this.name || !this.email || !this.message) {
      this.toast.error('Please fill all fields.');
      return;
    }

    this.userService.sendContact({
      name: this.name,
      email: this.email,
      message: this.message
    }).subscribe({
      next: (res) => {
        this.submitted = true;
      },
      error: (err) => {
        this.toast.error('Something went wrong, please try again later.');
      }
    });
  }
}
