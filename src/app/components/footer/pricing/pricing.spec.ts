import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';

import { Pricing } from './pricing';

describe('Pricing', () => {
  let component: Pricing;
  let fixture: ComponentFixture<Pricing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pricing, HttpClientTestingModule, MatDialogModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pricing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
