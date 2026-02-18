import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appAlphaNumericSpaces]',
  standalone: true
})
export class AlphaNumericSpacesDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const initialValue = this.el.nativeElement.value;
    this.el.nativeElement.value = initialValue.replace(/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\-.]/g, '');

    if (initialValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }

  @HostListener('keypress', ['$event']) onKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    const charStr = String.fromCharCode(charCode);
    const allowedChars = /[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\-.]/;

    if (!allowedChars.test(charStr)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}
