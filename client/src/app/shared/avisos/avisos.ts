import { Component, inject } from '@angular/core';
import { LucideCheck, LucideTriangleAlert, LucideX } from '@lucide/angular';

import { AvisosService } from './avisos.service';

@Component({
  imports: [LucideCheck, LucideTriangleAlert, LucideX],
  selector: 'app-avisos',
  templateUrl: './avisos.html',
})
export class Avisos {
  protected readonly avisosService = inject(AvisosService);
}
