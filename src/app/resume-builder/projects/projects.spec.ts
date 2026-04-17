import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ProjectsComponent } from './projects';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import {
  EMPTY_RESUME_STATE,
  Project
} from '../../shared/models/resume-builder.model';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let storeMock: { state: ReturnType<typeof signal<typeof EMPTY_RESUME_STATE>>; update: jasmine.Spy };

  beforeEach(async () => {
    storeMock = {
      state: signal(EMPTY_RESUME_STATE),
      update: jasmine.createSpy('update')
    };

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [{ provide: ResumeBuilderService, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should treat form as valid without timeline dates when title is set', () => {
    component.showAddForm();
    component.form.patchValue({ title: 'My Project', startDate: '', endDate: '' });
    expect(component.form.valid).toBeTrue();
  });

  it('should save project with empty dates', () => {
    component.showAddForm();
    component.form.patchValue({
      title: 'Side app',
      startDate: '',
      endDate: '',
      isCurrent: false
    });
    component.saveProject();

    expect(storeMock.update).toHaveBeenCalled();
    const payload = storeMock.update.calls.mostRecent().args[0] as { projects: Project[] };
    expect(payload.projects.length).toBe(1);
    expect(payload.projects[0].title).toBe('Side app');
    expect(payload.projects[0].startDate).toBe('');
    expect(payload.projects[0].endDate).toBe('');
  });

  it('should hide timeline section when no dates and not ongoing', () => {
    const p: Project = {
      id: '1',
      title: 'X',
      role: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      techStack: [],
      bullets: []
    };
    expect(component.showProjectTimelineSection(p)).toBeFalse();
    expect(component.projectTimelineCalendarText(p)).toBeNull();
  });

  it('should show timeline section when ongoing even without dates', () => {
    const p: Project = {
      id: '1',
      title: 'X',
      role: '',
      startDate: '',
      endDate: '',
      isCurrent: true,
      techStack: [],
      bullets: []
    };
    expect(component.showProjectTimelineSection(p)).toBeTrue();
    expect(component.projectTimelineCalendarText(p)).toBeNull();
  });
});
