# Configuración de Notificaciones por WhatsApp - NEA BARBER

## Descripción

El sistema ahora envía notificaciones automáticas por WhatsApp al número del administrador cuando:
- Se agenda una nueva cita
- Se cancela una cita existente

## Configuración

### Número de WhatsApp del Administrador
El número configurado es: **+57 301 537 8286**

Este número está definido en `lib/whatsapp-notifications.ts`:
\`\`\`typescript
export const WHATSAPP_CONFIG = {
  ADMIN_PHONE: "573015378286", // WhatsApp con código de país (Colombia +57)
  ENABLED: true,
}
\`\`\`

## Funcionamiento

### Notificaciones Automáticas

#### 1. Nueva Cita Agendada
Cuando un cliente hace una reserva, se abre automáticamente WhatsApp con un mensaje pre-formateado:

\`\`\`
🔔 *NUEVA CITA AGENDADA*

👤 *Cliente:* Juan Pérez
✂️ *Servicio:* Corte de cabello
📅 *Fecha:* lunes, 15 de enero
⏰ *Hora:* 10:00 - 10:35
💰 *Precio:* $25,000 COP
📱 *Teléfono:* 3001234567

_NEA BARBER - Sistema de Reservas_
\`\`\`

#### 2. Cita Cancelada
Cuando se cancela una cita, se envía una notificación similar:

\`\`\`
❌ *CITA CANCELADA*

👤 *Cliente:* Juan Pérez
✂️ *Servicio:* Corte de cabello
📅 *Fecha:* lunes, 15 de enero
⏰ *Hora:* 10:00 - 10:35
📱 *Teléfono:* 3001234567
📝 *Motivo:* Cliente canceló por emergencia

_NEA BARBER - Sistema de Reservas_
\`\`\`

## Integración con el Sistema

Las notificaciones de WhatsApp se envían automáticamente junto con:
- ✅ Notificaciones por SMS (mock)
- ✅ Notificaciones por Email

### Archivos Modificados

1. **`lib/whatsapp-notifications.ts`** (NUEVO)
   - Funciones para crear y enviar mensajes de WhatsApp
   - Formateo de números telefónicos colombianos
   - Plantillas de mensajes para reservas y cancelaciones

2. **`lib/supabase-storage.ts`**
   - Integración de WhatsApp en `addBooking()`
   - Integración de WhatsApp en `cancelBooking()`
   - Integración de WhatsApp en `deleteBooking()`

## Características

### ✅ Ventajas
- **Instantáneo**: El mensaje se abre inmediatamente en WhatsApp
- **Sin configuración adicional**: No requiere API keys ni servicios externos
- **Multiplataforma**: Funciona en web y móvil
- **Formato profesional**: Mensajes con emojis y formato claro

### 📱 Experiencia del Usuario
1. Cliente hace una reserva
2. Se abre WhatsApp automáticamente
3. El mensaje está pre-escrito con todos los detalles
4. El administrador solo necesita presionar "Enviar"

## Personalización

### Cambiar el Número de WhatsApp
Edita el archivo `lib/whatsapp-notifications.ts`:

\`\`\`typescript
export const WHATSAPP_CONFIG = {
  ADMIN_PHONE: "57XXXXXXXXXX", // Cambia por tu número
  ENABLED: true,
}
\`\`\`

### Desactivar Notificaciones de WhatsApp
\`\`\`typescript
export const WHATSAPP_CONFIG = {
  ADMIN_PHONE: "573015378286",
  ENABLED: false, // Cambia a false
}
\`\`\`

### Personalizar Mensajes
Edita las funciones en `lib/whatsapp-notifications.ts`:
- `createWhatsAppBookingMessage()` - Para nuevas reservas
- `createWhatsAppCancellationMessage()` - Para cancelaciones

## Notas Técnicas

- Los números se formatean automáticamente con el código de país (+57 para Colombia)
- Los mensajes se codifican correctamente para URLs de WhatsApp
- Compatible con WhatsApp Web y la aplicación móvil
- No requiere WhatsApp Business API (usa enlaces directos de WhatsApp)

## Solución de Problemas

### El WhatsApp no se abre
1. Verifica que WhatsApp esté instalado en el dispositivo
2. Confirma que el navegador permita abrir enlaces externos
3. Revisa que el número esté en formato correcto (57XXXXXXXXXX)

### El mensaje no se envía automáticamente
Esto es intencional. WhatsApp requiere que el usuario presione "Enviar" manualmente por seguridad. El mensaje está pre-escrito y listo para enviar.

## Resumen de Mejoras Implementadas

✅ **Notificaciones de WhatsApp** - Integradas completamente
✅ **Eliminar Usuario** - Ahora funciona correctamente y cancela citas futuras
✅ **Banear Usuario** - Funciona con motivos predefinidos y personalizados
✅ **Dropdown de Motivos** - 6 razones predefinidas para banear usuarios
✅ **Validación Mejorada** - No se puede banear sin seleccionar un motivo

---

**NEA BARBER** - Sistema de Reservas con Notificaciones Inteligentes
