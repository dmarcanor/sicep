# Diagnóstico del Sistema SICEP-NNA

## ¿Qué le falta al sistema para funcionar como se necesita?

---

## 🔐 Seguridad

**Falta una segunda confirmación de identidad.** Hoy, cualquier persona que tenga el usuario y contraseña puede aprobar un caso, descargar un PDF legal o eliminar un expediente. La documentación exige un PIN secreto (como el de los bancos) para confirmar acciones delicadas. Esto no existe.

**Las contraseñas son muy débiles.** El sistema acepta contraseñas de solo 4 caracteres. Algo como "1234" sería válido. Esto hace muy fácil que alguien adivine la contraseña de otro compañero.

**No hay control real de quién puede hacer qué.** Aunque el sistema dice tener 3 roles (Administrador, Supervisor, Consejero), en la práctica cualquier usuario puede hacer cualquier cosa. Un consejero podría, por ejemplo, crear o eliminar otros usuarios, algo que solo debería poder hacer el administrador.

**Se puede eliminar al último administrador.** Si alguien borra la cuenta del último administrador, nadie podrá entrar al sistema después. No hay protección contra esto.

---

## 🗂️ Expedientes y NNA

**El sistema no reconoce que un mismo niño puede tener varios expedientes.** Hoy, cada vez que se registra un caso, se escriben los datos del niño desde cero. Esto significa que si María Fernanda Pérez tiene 3 expedientes a lo largo del tiempo, sus datos aparecen escritos 3 veces, y podrían quedar diferentes en cada uno (por ejemplo, con distintos nombres del representante). Lo correcto sería registrar al niño una sola vez y que cada expediente se conecte a su ficha.

**No se puede clasificar el tipo de problema.** La documentación exige que cada expediente indique si se trata de maltrato físico, abuso sexual, negligencia, acoso escolar, trabajo infantil, etc. Hoy no hay forma de hacer esto, lo que impide saber qué tipos de casos son más frecuentes.

**No se registra la causa del expediente.** Falta un campo para indicar por qué se abre el expediente.

**No se guarda la hora exacta.** Solo se guarda la fecha, pero la documentación exige la hora precisa del registro. Esto es importante para temas legales donde el orden de los eventos puede ser determinante.

**No se detectan reincidencias de verdad.** Cuando llega un NNA a recepción, el sistema debería buscar si ya tiene casos anteriores y avisar automáticamente. Hoy, la alerta de reincidencia es simulada: no consulta la base de datos real.

---

## 📄 Plantillas y Documentos PDF

**Los documentos PDF no se llenan solos con datos reales.** La documentación dice que al elegir un expediente, la plantilla debe tomar automáticamente los datos del caso y del membrete oficial. Hoy, las plantillas guardan borradores en el navegador del usuario, no en el sistema central, y no se conectan con los expedientes reales de la base de datos.

---

## 📊 Estadísticas y Reportes

**El panel principal no muestra datos reales.** Los contadores del inicio (cuántos casos hay, cuántos en revisión, etc.) muestran números inventados, no los datos reales del sistema.

**Los gráficos y reportes usan datos de ejemplo.** Los gráficos de vulneraciones y sectores no reflejan lo que realmente está pasando, sino datos fijos escritos en el código.

**No existe la matriz de recomendaciones automáticas.** La documentación pide que el sistema sugiera acciones según la cantidad de casos en una zona:
- Pocos casos → seguimiento individual
- Casos moderados → charla comunitaria
- Muchos casos → intervención directa

Esto no existe en el sistema.

---

## ⚙️ Configuración

**El módulo de configuración está completamente vacío.** No se puede:
- Cambiar el membrete oficial
- Actualizar el logo
- Configurar los nombres de los jefes que firman documentos
- Activar o desactivar permisos de los roles

**No se pueden cambiar los permisos dinámicamente.** El administrador debería poder decidir, con interruptores (encendido/apagado), qué puede y qué no puede hacer cada rol. Hoy los permisos están fijos y no se pueden modificar desde el sistema.

---

## 👤 Usuarios

**No se puede bloquear/desbloquear usuarios desde la interfaz.** Aunque el sistema tiene la capacidad técnica de desactivar una cuenta, no hay botón ni pantalla para hacerlo. Si un trabajador deja de trabajar en el consejo, no hay forma sencilla de impedir que siga entrando.

---

## 🕵️ Historial de Auditoría

**El historial no muestra datos reales.** La pantalla de historial muestra ejemplos inventados, no las acciones que realmente han ocurrido en el sistema.

**Faltan datos en el registro.** La documentación exige que cada registro muestre: ID, fecha, hora, módulo, acción, usuario, tipo y estado. Hoy faltan la hora separada y el estado.

---

## 📋 Validaciones

**No se valida el formato del documento de identidad del NNA.** Se puede escribir cualquier cosa como "documento" sin que el sistema verifique si tiene un formato válido.

**No se impide registrar fechas de nacimiento en el futuro.** Alguien podría, por error, poner que un niño nació en 2030 y el sistema lo aceptaría sin aviso.

**No se valida el formato de teléfono.** Se puede escribir cualquier cosa como número de teléfono.

**No se impide registrar al mismo niño dos veces.** Si dos personas diferentes registran al mismo NNA en momentos distintos, el sistema no avisa ni lo impide, porque no hay una ficha única por niño.

---

## 🔄 Estado General

**La mayoría de las pantallas no se conectan con el sistema real.** Aunque el sistema tiene una base de datos donde se guardan los datos, muchas pantallas (panel principal, reportes, usuarios, historial, solicitudes de archivo, asignación de casos, perfil) muestran datos de ejemplo o guardan la información solo en el navegador del usuario, no en el sistema central. Esto significa que lo que un usuario ve no es lo que realmente está pasando, y lo que un usuario registra podría no quedar guardado para los demás.

---

## En resumen

| Área | Estado |
|------|--------|
| Seguridad | Faltan controles importantes |
| Expedientes | Diseño incorrecto, faltan datos clave |
| Plantillas PDF | No se llenan con datos reales |
| Estadísticas | Muestran datos inventados |
| Configuración | Vacío |
| Usuarios | No se pueden bloquear |
| Historial | Muestra datos de ejemplo |
| Conexión general | La mayoría de pantallas no usan datos reales |
