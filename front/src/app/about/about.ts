import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface GlossaryItem {
  term: string;
  badge: string;
  definition: string;
  practicalExample: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  mapUrl: SafeResourceUrl;

  // Interruptor visual: Modo Comunitario (activo por defecto) vs Modo Técnico
  mode = signal<'comunitario' | 'tecnico'>('comunitario');

  // Acordeón del Glosario Ciudadano
  activeGlossaryIndex = signal<number | null>(0);

  readonly glossaryItems: GlossaryItem[] = [
    {
      term: 'Estándar NI 43-101',
      badge: 'Normativa & Transparencia',
      definition: 'Es el estándar internacional canadiense más riguroso del mundo para reportar información científica sobre recursos minerales. Exige que todos los cálculos sean certificados por ingenieros y geólogos independientes para garantizar total verdad y transparencia técnica.',
      practicalExample: 'Garantiza que lo que Líbero Cobre comunica a la comunidad de Mocoa y a los organismos de control sea científicamente verídico, sin exageraciones ni especulación.'
    },
    {
      term: 'Pórfido de Cobre y Molibdeno',
      badge: 'Geología Básica',
      definition: 'Es un tipo de formación geológica de origen volcánico antiguo donde los minerales no están concentrados en una sola veta angosta, sino dispersos de manera homogénea en pequeñas partículas dentro de grandes masas de roca en el subsuelo.',
      practicalExample: 'A diferencia de la minería de socavón tradicional de oro, aquí se estudia científicamente toda la montaña para planificar una operación subterránea moderna y segura.'
    },
    {
      term: 'Recurso Inferido In-Pit',
      badge: 'Estimación & Viabilidad',
      definition: '"In-Pit" define el contorno conceptual donde la roca con mineral es técnicamente viable de aprovechar según simulaciones de ingeniería. "Inferido" indica que la cantidad y calidad del mineral han sido estimadas con base en muestras directas de perforación y análisis geoquímico.',
      practicalExample: 'Equivale a calcular con precisión científica cuántos árboles maduros hay en una parcela forestal midiendo muestras representativas en campo.'
    },
    {
      term: 'Ley Cobre Equivalente (CuEq*)',
      badge: 'Métricas de Concentración',
      definition: 'Fórmula matemática que combina el porcentaje de cobre con el de molibdeno expresado como si todo fuera cobre, facilitando conocer el valor mineral total de la roca en un solo número.',
      practicalExample: 'Un 0.51% de CuEq* significa una roca rica en mineral que hace altamente viable los procesos industriales con menor impacto ambiental y menor movimiento de tierra.'
    },
    {
      term: 'Perforación Diamantina',
      badge: 'Técnica de Exploración',
      definition: 'Es el uso de taladros de punta hueca recubierta de diamante industrial que extraen columnas cilíndricas delgadas de roca (llamadas testigos) desde cientos de metros de profundidad sin necesidad de explosivos ni excavaciones destructivas.',
      practicalExample: 'Es equivalente a una biopsia médica: permite estudiar con precisión milimétrica la salud y composición de la roca profunda cuidando la vegetación y el suelo de Mocoa.'
    },
    {
      term: 'Protección Hídrica & Piedemonte',
      badge: 'Responsabilidad Ambiental',
      definition: 'En Líbero Cobre el proceso de exploración opera con 0% de cianuro y 0% de mercurio. El agua utilizada en los taladros circula en circuito cerrado y pasa por sedimentadores para no verter fluidos a los ríos ni a las quebradas de la cuenca amazónica.',
      practicalExample: 'El agua de los ríos Mocoa y sus afluentes se monitorea periódicamente junto a veedurías comunitarias y autoridades ambientales.'
    },
    {
      term: 'Transición Energética',
      badge: 'Impacto Global',
      definition: 'El cambio de los combustibles fósiles (carbón, petróleo) hacia fuentes limpias (energía solar, eólica y movilidad eléctrica). Todos los motores eléctricos, baterías y paneles solares requieren entre 4 y 6 veces más cobre que las tecnologías antiguas.',
      practicalExample: 'El cobre de Mocoa es el mineral indispensable para electrificar el transporte público y reducir las emisiones de gases de efecto invernadero en Colombia.'
    }
  ];

  constructor(private sanitizer: DomSanitizer) {
    const mapSrc =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63872.13867!2d-76.6436!3d1.1490!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ef4b2e2d5c5d5%3A0x5ce5c5c5c5c5c5c5!2sMocoa%2C%20Putumayo!5e0!3m2!1ses!2sco!4v1700000000000!5m2!1ses!2sco';
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapSrc);
  }

  setMode(selected: 'comunitario' | 'tecnico'): void {
    this.mode.set(selected);
  }

  toggleGlossary(index: number): void {
    if (this.activeGlossaryIndex() === index) {
      this.activeGlossaryIndex.set(null);
    } else {
      this.activeGlossaryIndex.set(index);
    }
  }
}
