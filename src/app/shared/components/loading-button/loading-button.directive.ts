import { Directive, ElementRef, HostListener, inject, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * HU-20 / BUG-03 — patrón reutilizable para botones de acción (crear,
 * confirmar, enviar, pagar, etc.): evita pedidos u operaciones duplicadas
 * por clics repetidos, deshabilitando el botón desde el primer clic.
 *
 * Uso:
 * ```html
 * <button appLoadingButton [loading]="isSubmitting" (click)="onSubmit()">
 *   {{ isSubmitting ? 'Enviando...' : 'Enviar' }}
 * </button>
 * ```
 *
 * - Reemplaza al binding manual `[disabled]="isSubmitting"`: cuando
 *   `[loading]` es true, el botón queda deshabilitado.
 * - Además, deshabilita el botón de forma SÍNCRONA en el primer clic (antes
 *   de esperar a que Angular vuelva a renderizar tras actualizar el estado
 *   de carga), por lo que sigue protegiendo aunque el handler del (click)
 *   tarde en marcar `loading` como true, o aunque haya validaciones previas
 *   antes de fijar ese estado.
 * - Se rehabilita automáticamente cuando `[loading]` vuelve a false (por
 *   ejemplo, tras un error), para permitir reintentar.
 */
@Directive({
  selector: '[appLoadingButton]',
  standalone: true,
})
export class LoadingButtonDirective implements OnChanges {
  private readonly elementRef = inject(ElementRef<HTMLButtonElement>);

  @Input('appLoadingButton') loading: boolean | null | undefined = false;

  private clickedOnce = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ('loading' in changes) {
      // Si el estado de carga vuelve a false (operación terminada, con éxito
      // o con error), se libera el candado de "ya se hizo clic" para poder
      // reintentar.
      if (!this.loading) {
        this.clickedOnce = false;
      }
      this.applyDisabledState();
    }
  }

  @HostListener('click')
  onHostClick(): void {
    this.clickedOnce = true;
    this.applyDisabledState();
  }

  private applyDisabledState(): void {
    this.elementRef.nativeElement.disabled = this.clickedOnce || !!this.loading;
  }
}
