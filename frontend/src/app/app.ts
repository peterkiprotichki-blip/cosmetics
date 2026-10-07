import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconSpriteComponent } from './shared/icon-sprite.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IconSpriteComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
