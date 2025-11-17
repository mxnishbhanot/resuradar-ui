import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartResume } from './start-resume';

describe('StartResume', () => {
  let component: StartResume;
  let fixture: ComponentFixture<StartResume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartResume]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartResume);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
