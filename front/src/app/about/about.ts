import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {

  mapUrl: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
  ) {
    // Mocoa, Putumayo - Coordenadas del área del proyecto
    const mapSrc =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63872.13867!2d-76.6436!3d1.1490!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ef4b2e2d5c5d5%3A0x5ce5c5c5c5c5c5c5!2sMocoa%2C%20Putumayo!5e0!3m2!1ses!2sco!4v1700000000000!5m2!1ses!2sco';
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapSrc);
  }
}
