import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotaExhaustedModal } from './quota-exhausted-modal';

describe('QuotaExhaustedModal', () => {
  let component: QuotaExhaustedModal;
  let fixture: ComponentFixture<QuotaExhaustedModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotaExhaustedModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotaExhaustedModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
