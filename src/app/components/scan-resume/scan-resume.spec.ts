import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanResume } from './scan-resume';

describe('ScanResume', () => {
  let component: ScanResume;
  let fixture: ComponentFixture<ScanResume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanResume]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanResume);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
