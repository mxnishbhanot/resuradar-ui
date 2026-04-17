import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartResumeComponent } from './start-resume';

describe('StartResumeComponent', () => {
  let component: StartResumeComponent;
  let fixture: ComponentFixture<StartResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartResumeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
