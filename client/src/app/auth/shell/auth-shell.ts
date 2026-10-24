import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LucideArchive, LucideNotebookPen, LucideTag } from '@lucide/angular';

@Component({
  imports: [LucideArchive, LucideNotebookPen, LucideTag, RouterLink, RouterOutlet],
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
})
export class AuthShell {}
