import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadResume } from './upload-resume';

describe('UploadResume', () => {
  let component: UploadResume;
  let fixture: ComponentFixture<UploadResume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadResume]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadResume);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
