import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import {
  CustomResumesComponent,
  buildBuilderCardTitle,
  formatResumeUpdatedAt
} from './custom-resumes';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ResumeService } from '../../core/services/resume';
import { ToastService } from '../../core/services/toast';
import { UserService } from '../../core/services/user';
import { BuilderResume } from '../../shared/models/resume.model';

describe('buildBuilderCardTitle', () => {
  it('prefers trimmed headline', () => {
    expect(
      buildBuilderCardTitle({
        headline: '  Staff Engineer  ',
        firstName: 'Jane',
        lastName: 'Doe'
      })
    ).toBe('Staff Engineer');
  });

  it('uses first and last name when headline empty', () => {
    expect(
      buildBuilderCardTitle({ firstName: 'Jane', lastName: 'Doe' })
    ).toBe('Jane Doe');
  });

  it('uses single name when only one present', () => {
    expect(buildBuilderCardTitle({ firstName: 'Madonna' })).toBe('Madonna');
    expect(buildBuilderCardTitle({ lastName: 'Cher' })).toBe('Cher');
  });

  it('falls back to Untitled Resume', () => {
    expect(buildBuilderCardTitle(undefined)).toBe('Untitled Resume');
    expect(buildBuilderCardTitle({})).toBe('Untitled Resume');
  });
});

describe('formatResumeUpdatedAt', () => {
  it('returns em dash for empty or invalid', () => {
    expect(formatResumeUpdatedAt('')).toBe('—');
    expect(formatResumeUpdatedAt('   ')).toBe('—');
    expect(formatResumeUpdatedAt('not-a-date')).toBe('—');
  });

  it('shows Today with time when same calendar day as now', () => {
    const now = new Date(2026, 3, 17, 14, 30, 0);
    const sameDay = new Date(2026, 3, 17, 9, 0, 0).toISOString();
    const out = formatResumeUpdatedAt(sameDay, now);
    expect(out.startsWith('Today,')).toBe(true);
  });

  it('shows date and time when not same day', () => {
    const now = new Date(2026, 3, 17, 14, 0, 0);
    const prev = new Date(2026, 3, 10, 10, 0, 0).toISOString();
    const out = formatResumeUpdatedAt(prev, now);
    expect(out).toContain('2026');
    expect(out).toContain(',');
  });
});

class MockResumeBuilderService {
  getAllResumes() {
    const resume: BuilderResume = {
      _id: 'abc',
      updatedAt: '2026-04-17T12:00:00.000Z',
      isDraft: true,
      completionPercentage: 10,
      personal: { firstName: 'Ada', lastName: 'Lovelace', headline: '' }
    };
    return of({ resumes: [resume] });
  }
}

class MockResumeService {
  getResumeHistory() {
    return of({ data: [] });
  }

  deleteResumeHistory() {
    return of({ success: true });
  }

  patchResumeDisplayName() {
    return of({ success: true });
  }
}

class MockUserService {
  fetchCurrentUser() {
    return of(null);
  }
}

class MockToastService {
  show() {}
}

const matDialogStub = {
  open: () => ({
    afterClosed: () => of(undefined)
  })
};

describe('CustomResumesComponent', () => {
  let component: CustomResumesComponent;
  let fixture: ComponentFixture<CustomResumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomResumesComponent],
      providers: [
        { provide: ResumeBuilderService, useClass: MockResumeBuilderService },
        { provide: ResumeService, useClass: MockResumeService },
        { provide: UserService, useClass: MockUserService },
        { provide: ToastService, useClass: MockToastService },
        { provide: MatDialog, useValue: matDialogStub },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomResumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('maps builder card title from name when headline empty', () => {
    const builders = component.builderResumes();
    expect(builders.length).toBe(1);
    expect(builders[0].title).toBe('Ada Lovelace');
  });
});
