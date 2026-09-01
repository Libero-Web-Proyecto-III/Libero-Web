import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Publication } from './publication.model';
import { NavbarComponent } from '../home/navbar/navbar.component';
import { FooterComponent } from '../home/footer/footer.component';

@Component({
  selector: 'app-notice',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.scss'
})
export class NoticeComponent {
  featured: Publication = {
    uuid: '1',
    title: 'Título de la noticia destacada',
    content: 'Resumen breve de la noticia principal que se muestra en el sitio.',
    media: 'assets/mock/noticia-1.jpg',
    author: 'Redacción',
    createdAt: new Date()
  };

  news: Publication[] = [
    { uuid: '2', title: 'Segunda noticia', content: 'Resumen corto de la noticia.', media: 'assets/mock/noticia-2.jpg', author: 'Redacción', createdAt: new Date() },
    { uuid: '3', title: 'Tercera noticia', content: 'Resumen corto de la noticia.', media: 'assets/mock/noticia-3.jpg', author: 'Redacción', createdAt: new Date() },
    { uuid: '4', title: 'Cuarta noticia', content: 'Resumen corto de la noticia.', media: 'assets/mock/noticia-4.jpg', author: 'Redacción', createdAt: new Date() }
  ];

  videos: Publication[] = [
    { uuid: '5', title: 'Video institucional 1', content: '', media: 'assets/mock/video-1.jpg', author: 'Comunicaciones', createdAt: new Date(), isVideo: true },
    { uuid: '6', title: 'Video institucional 2', content: '', media: 'assets/mock/video-2.jpg', author: 'Comunicaciones', createdAt: new Date(), isVideo: true }
  ];
}