import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private apiUrl = 'http://localhost:5000/api/resumes'; // your backend URL

  constructor(private http: HttpClient) {}

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}
