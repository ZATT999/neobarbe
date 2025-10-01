# Configuración de Notificaciones por Email - NEA BARBER

## Variables de Entorno Requeridas

Para que las notificaciones por email funcionen correctamente, necesitas configurar las siguientes variables de entorno en tu proyecto de Vercel:

### Variables de Email
\`\`\`
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail
EMAIL_FROM=noreply@neabarber.com
\`\`\`

## Configuración de Gmail

### 1. Habilitar Autenticación de 2 Factores
- Ve a tu cuenta de Google
- Habilita la autenticación de 2 factores

### 2. Generar Contraseña de Aplicación
- Ve a "Gestionar tu cuenta de Google"
- Seguridad → Contraseñas de aplicaciones
- Genera una nueva contraseña para "Correo"
- Usa esta contraseña en `EMAIL_PASSWORD`

### 3. Configurar Variables en Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las variables:
   - `EMAIL_USER`: tu email de Gmail
   - `EMAIL_PASSWORD`: la contraseña de aplicación generada
   - `EMAIL_FROM`: el email que aparecerá como remitente

## Funcionamiento

### Notificaciones Automáticas
El sistema enviará emails automáticamente a `neabarber@gmail.com` cuando:

1. **Nueva Cita**: Se agenda una nueva cita
   - Incluye todos los detalles de la reserva
   - Información del cliente y servicio
   - Fecha, hora y precio

2. **Cita Cancelada**: Se cancela una cita existente
   - Detalles de la cita cancelada
   - Motivo de cancelación (si se proporciona)

### Formato de Emails
- **HTML**: Emails con formato profesional y colores de marca
- **Texto plano**: Versión alternativa para clientes de email básicos
- **Responsive**: Se ven bien en móviles y escritorio

## Solución de Problemas

### Email no se envía
1. Verifica que las variables de entorno estén configuradas
2. Confirma que la contraseña de aplicación sea correcta
3. Revisa los logs de la aplicación para errores específicos

### Gmail bloquea el envío
1. Asegúrate de usar contraseña de aplicación (no la contraseña normal)
2. Verifica que la autenticación de 2 factores esté habilitada
3. Revisa la configuración de seguridad de Gmail

## Personalización

Puedes personalizar los emails editando el archivo `lib/email-notifications.ts`:
- Cambiar el diseño HTML
- Modificar los colores y estilos
- Agregar más información a las notificaciones
- Cambiar el email de destino

## Seguridad

- Las credenciales se almacenan como variables de entorno
- Se usa autenticación segura con contraseñas de aplicación
- Los emails se envían a través de conexión cifrada
