import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeComponent } from './qrcode.component';
import { provideQRCode, withAllowEmptyString } from './qrcode.provider';

describe('dfx-qrcode', () => {
  let component: QRCodeComponent;
  let fixture: ComponentFixture<QRCodeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QRCodeComponent],
      providers: [provideQRCode(withAllowEmptyString(true))],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QRCodeComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
