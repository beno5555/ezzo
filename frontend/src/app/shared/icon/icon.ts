import { Component, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import type { IconNode } from 'lucide';

// Renders the SVG nodes from Lucide's per-icon modules on the caller's SVG element.
@Component({
  selector: 'svg[appIcon]',
  template: '',
  host: {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
})
export class Icon {
  readonly appIcon = input.required<IconNode>();

  constructor() {
    const svg = inject<ElementRef<SVGSVGElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);

    effect(() => {
      const nodes = this.appIcon();

      for (const child of Array.from(svg.children)) {
        renderer.removeChild(svg, child);
      }

      for (const [tag, attributes] of nodes) {
        const child: SVGElement = renderer.createElement(tag, 'svg');
        for (const [name, value] of Object.entries(attributes)) {
          renderer.setAttribute(child, name, String(value));
        }
        renderer.appendChild(svg, child);
      }
    });
  }
}
