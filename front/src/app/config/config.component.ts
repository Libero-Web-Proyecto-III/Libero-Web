import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss',
})
export class ConfigComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // Usuario autenticado reactivo
  readonly currentUser = this.authService.currentUser;

  // Estados editables de datos personales
  name = signal<string>('');
  avatar = signal<string>('');

  // Valores originales para comparación
  private initialName = '';
  private initialAvatar = '';

  // Estados de contraseña
  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isCurrentPasswordVerified = signal<boolean>(false);
  isVerifyingPassword = signal<boolean>(false);

  // Modales de confirmación
  showPasswordModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  // Estados de carga y alertas
  isSavingInfo = signal<boolean>(false);
  isSavingPassword = signal<boolean>(false);
  isDeletingAccount = signal<boolean>(false);

  infoMessage = signal<string | null>(null);
  infoMessageType = signal<'success' | 'warning' | 'error' | null>(null);

  passwordMessage = signal<string | null>(null);
  passwordMessageType = signal<'success' | 'error' | null>(null);

  deleteError = signal<string | null>(null);

  // Inicial de respaldo
  readonly userInitial = computed(() => {
    const n = this.name() || this.currentUser()?.username || 'U';
    return n.charAt(0).toUpperCase();
  });

  // Rol formateado
  readonly roleDisplayName = computed(() => {
    const role = this.currentUser()?.role?.toLowerCase()?.trim();
    if (role === 'admin' || role === 'administrador') return 'ADMINISTRADOR';
    if (role === 'mod' || role === 'moderador') return 'MODERADOR';
    return 'USUARIO';
  });

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    this.initialName = user.username || '';
    this.initialAvatar = user.avatar || '';

    this.name.set(this.initialName);
    this.avatar.set(this.initialAvatar);

    // Refrescar perfil desde backend para asegurar datos frescos
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.initialName = profile.username || '';
        this.initialAvatar = profile.avatar || '';
        this.name.set(this.initialName);
        this.avatar.set(this.initialAvatar);
      },
      error: () => {},
    });
  }

  // Comprobar si hay cambios pendientes
  hasInfoChanges(): boolean {
    return (
      this.name().trim() !== this.initialName.trim() ||
      this.avatar().trim() !== this.initialAvatar.trim()
    );
  }

  // Guardar datos personales (Nombre y Foto)
  savePersonalInfo(): void {
    this.infoMessage.set(null);
    this.infoMessageType.set(null);

    // Validación: Si no ha realizado ningún cambio, el botón no hace nada y emite mensaje
    if (!this.hasInfoChanges()) {
      this.infoMessageType.set('warning');
      this.infoMessage.set('No se ha realizado ningún cambio.');
      return;
    }

    const trimmedName = this.name().trim();
    if (!trimmedName) {
      this.infoMessageType.set('error');
      this.infoMessage.set('El nombre de usuario no puede estar vacío.');
      return;
    }

    this.isSavingInfo.set(true);

    this.authService
      .updateProfile({
        name: trimmedName,
        avatar: this.avatar().trim(),
      })
      .subscribe({
        next: (res) => {
          this.isSavingInfo.set(false);
          this.initialName = res.data?.username || trimmedName;
          this.initialAvatar = res.data?.avatar || this.avatar().trim();
          this.name.set(this.initialName);
          this.avatar.set(this.initialAvatar);

          this.infoMessageType.set('success');
          this.infoMessage.set('¡Información y foto de perfil actualizadas con éxito!');
        },
        error: (err) => {
          this.isSavingInfo.set(false);
          this.infoMessageType.set('error');
          const msg =
            err.error?.message ||
            'Error al guardar la información. Comprueba que el nombre no esté en uso.';
          this.infoMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }

  // Quitar foto y volver al avatar con inicial
  removeAvatar(): void {
    this.avatar.set('');
  }

  // Selección de archivo local del sistema operativo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.infoMessageType.set('error');
      this.infoMessage.set('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Tamaño máximo: 5 MB antes de compresión
    if (file.size > 5 * 1024 * 1024) {
      this.infoMessageType.set('error');
      this.infoMessage.set('La imagen seleccionada no debe superar los 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Optimizar/redimensionar la imagen a max 400x400 para almacenamiento ligero y veloz
      this.compressImage(result, 400, 400, (compressedBase64) => {
        this.avatar.set(compressedBase64);
        this.infoMessage.set(null);
        this.infoMessageType.set(null);
      });
    };
    reader.readAsDataURL(file);

    // Resetear el input para permitir volver a elegir el mismo archivo si se desea
    input.value = '';
  }

  // Redimensionar imagen en memoria para un base64 ultra eficiente
  private compressImage(
    src: string,
    maxWidth: number,
    maxHeight: number,
    callback: (base64: string) => void
  ): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        callback(src);
      }
    };
    img.onerror = () => callback(src);
    img.src = src;
  }

  // Alternar visibilidad de contraseñas (botón del ojo)
  toggleShowCurrentPassword(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.showCurrentPassword.update((v) => !v);
  }

  toggleShowNewPassword(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.showNewPassword.update((v) => !v);
  }

  toggleShowConfirmPassword(event?: MouseEvent): void {
    if (event) event.preventDefault();
    this.showConfirmPassword.update((v) => !v);
  }

  // Manejo de cambio en el input de contraseña actual
  onCurrentPasswordInput(value: string): void {
    this.currentPassword.set(value);
    if (this.isCurrentPasswordVerified()) {
      this.isCurrentPasswordVerified.set(false);
      this.passwordMessage.set(null);
      this.passwordMessageType.set(null);
    }
  }

  // Verificar la contraseña actual antes de permitir ingresar la nueva
  verifyCurrentPassword(): void {
    this.passwordMessage.set(null);
    this.passwordMessageType.set(null);

    const curr = this.currentPassword().trim();
    if (!curr) {
      this.passwordMessageType.set('error');
      this.passwordMessage.set('Por favor ingresa tu contraseña actual para verificarla.');
      return;
    }

    this.isVerifyingPassword.set(true);

    this.authService.verifyPassword(curr).subscribe({
      next: () => {
        this.isVerifyingPassword.set(false);
        this.isCurrentPasswordVerified.set(true);
        this.passwordMessageType.set('success');
        this.passwordMessage.set('✓ Contraseña actual verificada correctamente. Ya puedes ingresar tu nueva contraseña.');
      },
      error: (err) => {
        this.isVerifyingPassword.set(false);
        this.isCurrentPasswordVerified.set(false);
        this.passwordMessageType.set('error');
        const msg = err.error?.message || 'La contraseña actual ingresada es incorrecta.';
        this.passwordMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  // Abrir modal de confirmación de cambio de contraseña
  openPasswordModal(): void {
    this.passwordMessage.set(null);
    this.passwordMessageType.set(null);

    if (!this.isCurrentPasswordVerified()) {
      this.passwordMessageType.set('error');
      this.passwordMessage.set('Primero debes verificar tu contraseña actual antes de poder cambiarla.');
      return;
    }

    const newPass = this.newPassword().trim();
    const confPass = this.confirmPassword().trim();
    const curr = this.currentPassword().trim();

    if (!newPass) {
      this.passwordMessageType.set('error');
      this.passwordMessage.set('Por favor ingresa tu nueva contraseña.');
      return;
    }

    if (newPass.length < 6) {
      this.passwordMessageType.set('error');
      this.passwordMessage.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPass === curr) {
      this.passwordMessageType.set('error');
      this.passwordMessage.set('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    if (newPass !== confPass) {
      this.passwordMessageType.set('error');
      this.passwordMessage.set('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    // Desplegar el modal de confirmación
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  // Confirmar cambio de contraseña
  confirmPasswordChange(): void {
    this.isSavingPassword.set(true);

    this.authService
      .changePassword({
        currentPassword: this.currentPassword().trim(),
        newPassword: this.newPassword().trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingPassword.set(false);
          this.closePasswordModal();
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
          this.isCurrentPasswordVerified.set(false);
          this.passwordMessageType.set('success');
          this.passwordMessage.set('¡Tu contraseña ha sido actualizada correctamente!');
        },
        error: (err) => {
          this.isSavingPassword.set(false);
          this.closePasswordModal();
          this.passwordMessageType.set('error');
          const msg = err.error?.message || 'No fue posible cambiar la contraseña.';
          this.passwordMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }

  // Abrir modal de confirmación de eliminación de cuenta
  openDeleteModal(): void {
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteError.set(null);
  }

  // Confirmar eliminación de cuenta definitiva
  confirmDeleteAccount(): void {
    this.isDeletingAccount.set(true);
    this.deleteError.set(null);

    this.authService.deleteAccount().subscribe({
      next: () => {
        this.isDeletingAccount.set(false);
        this.closeDeleteModal();
        void this.router.navigate(['/']);
      },
      error: (err) => {
        this.isDeletingAccount.set(false);
        const msg = err.error?.message || 'Error al intentar eliminar la cuenta.';
        this.deleteError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }
}
