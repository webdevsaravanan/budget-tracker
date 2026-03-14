import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" [style.width.px]="size" [style.height.px]="size">
      <!-- SVG ring -->
      <svg [attr.width]="size" [attr.height]="size"
           [attr.viewBox]="'0 0 ' + size + ' ' + size"
           style="transform: rotate(-90deg)">
        <!-- Background track -->
        <circle
          fill="none"
          stroke="#2c2c2e"
          [attr.stroke-width]="strokeWidth"
          [attr.cx]="cx" [attr.cy]="cy" [attr.r]="radius"/>

        <!-- Progress arc -->
        <circle
          fill="none"
          [attr.stroke]="isOver ? '#ff5f5f' : '#5e7bff'"
          [attr.stroke-width]="strokeWidth"
          stroke-linecap="round"
          [attr.cx]="cx" [attr.cy]="cy" [attr.r]="radius"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          style="transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1),
                             stroke 0.4s ease;
                 filter: drop-shadow(0 0 8px rgba(94,123,255,0.55))"/>

        <!-- Dot indicator -->
        <circle
          [attr.cx]="dotX" [attr.cy]="dotY" r="7"
          fill="#f5c842"
          style="filter: drop-shadow(0 0 4px #f5c842);
                 transition: all 1.2s cubic-bezier(0.4,0,0.2,1)"/>
      </svg>

      <!-- Center content -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-lg leading-none mb-1"
              [style.color]="isOver ? '#ff5f5f' : '#5e7bff'">↗</span>
        <span class="text-[32px] font-bold leading-none tracking-tight">
          ₹{{ amount | number:'1.0-0' }}
        </span>
        <span class="text-[11px] text-muted mt-1">total spent</span>
      </div>
    </div>
  `,
})
export class CircularProgressComponent implements OnChanges {
  @Input() amount   = 0;
  @Input() budget   = 0;
  @Input() size     = 220;
  @Input() strokeWidth = 14;

  cx = 0; cy = 0; radius = 0;
  circumference = 0;
  dashOffset    = 0;
  dotX = 0; dotY = 0;
  isOver = false;

  ngOnChanges() {
    this.cx = this.size / 2;
    this.cy = this.size / 2;
    this.radius      = (this.size / 2) - (this.strokeWidth / 2) - 2;
    this.circumference = 2 * Math.PI * this.radius;

    const pct = this.budget > 0 ? Math.min(this.amount / this.budget, 1) : 0;
    this.isOver    = this.budget > 0 && this.amount > this.budget;
    this.dashOffset = this.circumference - pct * this.circumference;

    // Dot position (in rotated SVG space)
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    this.dotX = this.cx + this.radius * Math.cos(angle);
    this.dotY = this.cy + this.radius * Math.sin(angle);
  }
}
