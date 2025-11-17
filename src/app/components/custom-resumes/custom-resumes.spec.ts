import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomResumesComponent } from './custom-resumes';


describe('CustomResume', () => {
  let component: CustomResumesComponent;
  let fixture: ComponentFixture<CustomResumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomResumesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomResumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
