export const LINEA_ROSSA_ADMIN_EMAIL = 'sdaddino@yahoo.it';

export function isLineaRossaAdmin(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === LINEA_ROSSA_ADMIN_EMAIL;
}
