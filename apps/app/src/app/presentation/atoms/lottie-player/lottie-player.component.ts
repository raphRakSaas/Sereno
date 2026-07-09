import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
} from '@angular/core';
import { DotLottie } from '@lottiefiles/dotlottie-web';

/* Lecteur d'animations .lottie (canvas). Autonome : charge et détruit
   l'instance avec le cycle de vie du composant, pas d'API impérative à
   gérer côté appelant. */
@Component({
  selector: 'app-lottie-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host {
      display: block;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class LottiePlayerComponent implements AfterViewInit, OnDestroy {
  readonly src = input.required<string>();
  readonly loop = input(true);
  readonly autoplay = input(true);

  @ViewChild('canvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  private player?: DotLottie;

  ngAfterViewInit(): void {
    this.player = new DotLottie({
      canvas: this.canvasRef.nativeElement,
      src: this.src(),
      loop: this.loop(),
      autoplay: this.autoplay(),
      renderConfig: { autoResize: true },
    });
  }

  ngOnDestroy(): void {
    this.player?.destroy();
  }
}
