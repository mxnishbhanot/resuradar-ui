import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradePro } from './upgrade-pro';

describe('UpgradePro', () => {
  let component: UpgradePro;
  let fixture: ComponentFixture<UpgradePro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradePro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpgradePro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
