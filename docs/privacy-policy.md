# LeadMate Privacy Policy

**Last updated: 18 November 2026**

LeadMate ("the app", "we") is a mobile app that helps you train your dog to walk calmly on the lead. This policy explains what information the app handles, why, who it is shared with, and the choices you have.

This document contains both the English and Spanish versions of our privacy policy.
*Para la versión en español, consulte la sección [Política de Privacidad de LeadMate (Español)](#política-de-privacidad-de-leadmate-español) más abajo.*

**Controller / contact:** Javier Garcia (ndsrf) · hi@ndsrf.com

---

## 1. Summary

- You can use LeadMate **without an account**. Your dog's profile and progress then stay on your device.
- If you create an account, a copy of your training progress is stored on our server so you can restore it on another device.
- We show ads (Google AdMob) and sell an optional subscription, LeadMate Plus (handled by Google Play and RevenueCat).
- We collect anonymous product usage analytics (PostHog EU) to understand which training features work and improve the app. This never includes your dog's name, email, or account ID, client IP addresses are discarded, and you can turn it off at any time in Settings.
- The microphone is used only if you choose to record your own training cue. The recording **stays on your device**.
- You can delete your account and its data from inside the app at any time.
- LeadMate is not directed at children under 13.

## 2. Information we handle

### 2.1 Information you give us

| Information | When | Where it lives |
|---|---|---|
| Dog's name, breed, coat colour, age band, sex, equipment, concerns and training answers | When you set up and use the app | On your device; also on our server if you have an account |
| Training progress: lessons and nodes completed, stars, streak, walk diary entries, daily stage scores, learning state, settings and language | While you use the app | On your device; also on our server if you have an account |
| Email address and password | If you create an account | Our authentication provider (Supabase). Passwords are stored hashed, and we cannot read them. |
| Custom cue recording (a short voice clip) | Only if you tap record in Settings and grant microphone permission | **On your device only.** It is never uploaded. You can delete it in Settings, and uninstalling the app removes it. |

### 2.2 Information collected automatically by third-party services

- **Advertising (Google AdMob).** To serve and measure ads, Google may collect your device's advertising ID, IP address, device and app information, and ad interaction data. In the EU/EEA, UK and other regions where required, we ask for your consent through Google's consent form before showing personalised ads. Without consent, only non-personalised ads are requested. See [Google's policy](https://policies.google.com/privacy) and [how Google uses data from partner apps](https://policies.google.com/technologies/partner-sites).
- **Subscriptions (Google Play Billing and RevenueCat).** If you view or buy LeadMate Plus, Google Play processes your payment (we never see your card details). RevenueCat receives an anonymous or account-linked app user ID, purchase and entitlement status, and device/IP information so we can unlock Plus and let you restore purchases. See [RevenueCat's privacy policy](https://www.revenuecat.com/privacy).
- **Content delivery (Supabase Storage).** The app downloads lesson content from our server. As with any web request, the server sees your IP address and basic request details. We do not use this to profile you.
- **Anonymous product analytics (PostHog EU).** To understand how features are used, identify where learners get stuck, and improve dog training efficacy, the app collects anonymous product analytics via PostHog Inc., processed in the European Union (Germany).
  - **What is sent:** Events carry a random device installation UUID (`installId`) generated locally, along with app version, content version and channel (stable or beta), language preference, and elapsed time since install. Events fall into these strict categories:
    1. **Funnel steps** (`funnel_step_viewed`): Progress through setup and onboarding (welcome, language selection, dog profile parts, initial walk/simulation, registration prompt, account creation, paywall, map).
    2. **App sessions** (`session_started`): App opens and returns from background after 30+ minutes, including days since install, first session flag, and whether the install was upgraded from an earlier version.
    3. **Stages** (`stage_started`, `stage_ended`): Simulation walk and close-exercise runs started, finished, skipped, or left, including unpaused foreground duration and handling score (when finished).
    4. **Minigames** (`minigame_started`, `minigame_ended`): Interactive drills (such as Barkdoku, Doorbell Mat, Read the Dog) started, finished, or left, including duration and handling score.
    5. **Lessons** (`lesson_opened`, `lesson_done`): Theory lessons opened from the map, library, or video unlock, and completed or closed, with foreground duration and reading scroll percentage.
    6. **Checkpoints** (`checkpoint_answered`): Responses to Checkpoint questions in Stage Node primers (result correct, wrong, or missed, node ID, question index, response time).
    7. **Trail stops** (`stop_completed`): Trail Stops completed for the first time across Worlds (world ID, stop ID, stop kind: lesson, node, or mission, and 0-based trail index).
  - **Privacy guarantees:**
    - **No personal details:** Events never include your dog's name, your email address, or any account or user ID.
    - **No IP addresses or GeoIP:** PostHog is configured to discard client IP addresses immediately upon arrival; IP addresses are never recorded or stored, and no location tracking or GeoIP lookups are performed.
    - **No session recording or personal profiles:** Autocapture, session recording/replay, and user profiling are disabled.
    - **Not linked to your account:** Analytics data is associated solely with the random installation ID, not with your registered account. Because analytics data cannot be linked to your account or identity, account deletion does not affect anonymous historical usage metrics.
    - **Opt-out at any time:** Analytics is enabled by default to help improve the game. You can turn it off at any time in **Settings → Preferences → Anonymous usage data**. Turning it off stops all tracking immediately and clears any queued events on your device.
    - **Retention period:** Anonymous analytics events are retained in PostHog for **12 months**, after which they are permanently deleted.

We do not use analytics or crash-reporting SDKs that track you across other apps, and we never sell your personal information.

## 3. How we use information

- To provide the app: personalise lessons and the training plan for your dog, track progress, and sync it between devices.
- To run your account: sign-in, email verification, password reset.
- To unlock and restore LeadMate Plus.
- To fund the free version through advertising.
- To improve app quality, curriculum pacing, and dog training outcomes through anonymous product analytics.
- To keep the service secure and fix problems.

**Legal bases (GDPR):** performance of our contract with you (account, sync, subscription); consent (personalised ads, microphone); legitimate interests (security, basic service operation, anonymous product improvement subject to user opt-out).

## 4. Who we share information with

We share information only with service providers who process it on our behalf:

- **Supabase**: account authentication, database and file storage.
- **Google (AdMob and Google Play)**: ads and payments.
- **RevenueCat**: subscription management.
- **PostHog**: privacy-first product usage analytics (EU cloud hosted in Germany, client IP discarded).

We may also disclose information if required by law. These providers may process data outside your country under safeguards such as standard contractual clauses.

## 5. Retention and deletion

- Data on your device stays until you reset progress in Settings or uninstall the app.
- Account data is kept until you delete your account.
- **To delete your account and the data we hold on our server:** open the app, go to the account screen, and choose **Delete account**. This removes your account and synced dog data. You can also email us at hi@ndsrf.com and we will do it for you.
- Purchase records may be kept by Google and RevenueCat as required for accounting and legal obligations.
- Ad-related data collected by Google is governed by Google's policy. You can reset or delete your advertising ID in Android Settings → Privacy → Ads.
- Anonymous product analytics data is retained in PostHog for 12 months. Because analytics events are not linked to your account, account deletion does not alter historical anonymous metrics.

## 6. Your rights

Depending on where you live (for example the EU/EEA, UK or California), you may have the right to access, correct, delete or export your data, object to or restrict processing, and withdraw consent at any time. You can opt out of anonymous analytics at any time in Settings → Preferences. Contact us at hi@ndsrf.com to exercise your rights. You may also complain to your local data protection authority.

## 7. Permissions

| Permission | Why |
|---|---|
| Microphone (`RECORD_AUDIO`) | Only to record an optional custom cue. Requested when you tap record. |
| Modify audio settings | So cues and lesson sounds play correctly. |
| Internet / network state | To load lesson content, sync an account, show ads, process anonymous analytics and handle purchases. |
| Advertising ID | Used by AdMob for ads. You can opt out in Android Settings. |

## 8. Security

Data is sent over HTTPS. Access to server data is restricted per user. No method of storage or transmission is completely secure, so we cannot guarantee absolute security.

## 9. Children

LeadMate is not directed at children under 13 (or the minimum age in your country), and we do not knowingly collect their personal information. If you believe a child has given us personal information, contact us and we will delete it.

## 10. Changes to this policy

We may update this policy. We will change the date at the top and, for material changes, tell you in the app.

## 11. Contact

Javier Garcia (ndsrf) · hi@ndsrf.com

---

# Política de Privacidad de LeadMate (Español)

**Última actualización: 18 de noviembre de 2026**

LeadMate ("la aplicación", "nosotros") es una aplicación móvil que te ayuda a educar a tu perro para pasear con calma de la correa. Esta política explica qué información gestiona la app, por qué, con quién se comparte y qué opciones tienes.

**Responsable del tratamiento / contacto:** Javier García (ndsrf) · hi@ndsrf.com

## 1. Resumen

- Puedes utilizar LeadMate **sin una cuenta**. El perfil de tu perro y su progreso permanecen en tu dispositivo.
- Si creas una cuenta, se almacena una copia de tu progreso de entrenamiento en nuestro servidor para que puedas restaurarlo en otro dispositivo.
- Mostramos anuncios (Google AdMob) y ofrecemos una suscripción opcional, LeadMate Plus (gestionada por Google Play y RevenueCat).
- Recopilamos datos analíticos anónimos de uso del producto (PostHog UE) para comprender qué ejercicios funcionan y mejorar la aplicación. Nunca incluye el nombre de tu perro, correo electrónico o identificador de cuenta; las direcciones IP se descartan inmediatamente y puedes desactivarlo en cualquier momento en Ajustes.
- El micrófono se utiliza únicamente si decides grabar tu propia señal de entrenamiento personalizada. La grabación **permanece exclusivamente en tu dispositivo**.
- Puedes eliminar tu cuenta y sus datos desde el interior de la app en cualquier momento.
- LeadMate no está dirigida a menores de 13 años.

## 2. Información que tratamos

### 2.1 Información que nos proporcionas

| Información | Cuándo | Dónde reside |
|---|---|---|
| Nombre del perro, raza, color de manto, grupo de edad, sexo, equipamiento, preocupaciones y respuestas de entrenamiento | Al configurar y utilizar la aplicación | En tu dispositivo; también en nuestro servidor si tienes una cuenta |
| Progreso de entrenamiento: lecciones y nodos completados, estrellas, racha, diario de paseos, puntuaciones de etapas diarias, estado de aprendizaje, ajustes e idioma | Mientras utilizas la aplicación | En tu dispositivo; también en nuestro servidor si tienes una cuenta |
| Dirección de correo electrónico y contraseña | Si creas una cuenta | Nuestro proveedor de autenticación (Supabase). Las contraseñas se almacenan mediante hash criptográfico y no podemos leerlas. |
| Grabación de señal personalizada (un breve clip de voz) | Solo si pulsas grabar en Ajustes y concedes permiso de micrófono | **Solo en tu dispositivo.** Nunca se sube a internet. Puedes eliminarla en Ajustes, y desinstalar la app la borra por completo. |

### 2.2 Información recopilada automáticamente por servicios de terceros

- **Publicidad (Google AdMob).** Para servir y medir anuncios, Google puede recopilar el identificador de publicidad de tu dispositivo, dirección IP, información del dispositivo y de la app, y datos de interacción con los anuncios. En la UE/EEE, Reino Unido y otras regiones donde sea obligatorio, solicitamos tu consentimiento a través del formulario de consentimiento de Google antes de mostrar anuncios personalizados. Sin consentimiento, solo se solicitan anuncios no personalizados. Consulta la [política de Google](https://policies.google.com/privacy) y [cómo utiliza Google los datos de apps colaboradoras](https://policies.google.com/technologies/partner-sites).
- **Suscripciones (Google Play Billing y RevenueCat).** Si consultas o adquieres LeadMate Plus, Google Play procesa tu pago (nunca tenemos acceso a los datos de tu tarjeta). RevenueCat recibe un ID de usuario de app anónimo o vinculado a la cuenta, el estado de compra y suscripción, e información básica del dispositivo/IP para desbloquear Plus y permitirte restaurar compras. Consulta la [política de privacidad de RevenueCat](https://www.revenuecat.com/privacy).
- **Descarga de contenidos (Supabase Storage).** La app descarga contenidos de lecciones desde nuestro servidor. Como en cualquier petición web, el servidor recibe tu dirección IP y datos técnicos básicos de la solicitud. No utilizamos esto para elaborar perfiles.
- **Analítica anónima de producto (PostHog UE).** Para comprender cómo se utilizan las funciones, identificar dónde se atascan los usuarios y mejorar la eficacia del entrenamiento canino, la app recopila métricas anónimas de uso a través de PostHog Inc., alojado en la Unión Europea (Alemania).
  - **Qué se envía:** Los eventos incluyen un identificador de instalación aleatorio generado en tu dispositivo (`installId`), junto con la versión de la app, versión y canal del contenido (estable o beta), idioma de la app y segundos transcurridos desde la instalación. Los eventos pertenecen estrictamente a las siguientes categorías del contrato:
    1. **Pasos del embudo de bienvenida** (`funnel_step_viewed`): Progreso a través de la configuración inicial y onboarding (pantalla de bienvenida, selección de idioma, pasos de configuración del perro, primer paseo interactivo, aviso de registro, creación de cuenta, muro de pago y mapa).
    2. **Sesiones de la aplicación** (`session_started`): Apertura de la aplicación o regreso tras más de 30 minutos en segundo plano, registrando días desde la instalación, si es la primera sesión o si es una instalación actualizada.
    3. **Etapas de simulación** (`stage_started`, `stage_ended`): Paseos interactivos y ejercicios de cercanía iniciados, finalizados, saltados o abandonados, con duración en primer plano (sin pausas) y puntuación de manejo (al finalizar).
    4. **Minijuegos** (`minigame_started`, `minigame_ended`): Minijuegos interactivos (como Barkdoku, Alfombrilla o Leer al perro) iniciados, finalizados o abandonados, con duración y puntuación de manejo.
    5. **Lecciones de teoría** (`lesson_opened`, `lesson_done`): Lecciones abiertas desde el sendero, la biblioteca o desbloqueo por vídeo, y completadas o cerradas, con tiempo de lectura en primer plano y porcentaje de desplazamiento vertical.
    6. **Puntos de control** (`checkpoint_answered`): Respuestas a preguntas de control en los preparatorios de nodos (resultado correcto, incorrecto o tiempo agotado, ID del nodo, índice de la pregunta y segundos de respuesta).
    7. **Hitos del sendero completados** (`stop_completed`): Paradas del sendero completadas por primera vez en cualquier Mundo (ID del mundo, ID de la parada, tipo de parada: lección, nodo o misión, e índice de sendero base cero).
  - **Garantías de privacidad:**
    - **Sin datos personales:** Los eventos nunca contienen el nombre de tu perro, tu correo electrónico ni ningún ID de cuenta o usuario.
    - **Sin direcciones IP ni geolocalización:** PostHog está configurado para descartar de inmediato las direcciones IP de los clientes al recibirlas; las direcciones IP nunca se registran ni almacenan, y no se realiza seguimiento de ubicación ni GeoIP.
    - **Sin grabación de sesiones ni perfiles personales:** La autocaptura, la grabación/reproducción de sesiones y el perfilado de usuarios están completamente desactivados.
    - **No vinculado a tu cuenta:** Los datos de analítica están asociados exclusivamente al identificador aleatorio de instalación, no a tu cuenta de LeadMate. Como no están vinculados a tu cuenta, eliminar tu cuenta no altera los datos agregados anónimos de instalación.
    - **Desactivación en cualquier momento:** La analítica está activada por defecto para ayudarnos a mejorar el juego. Puedes desactivarla en cualquier momento en **Ajustes → Preferencias → Datos anónimos de uso**. Al desactivarla, se detiene el envío de forma inmediata y se borra cualquier evento en cola en tu dispositivo.
    - **Período de conservación:** Los eventos anónimos de analítica se conservan en PostHog durante un máximo de **12 meses**, tras los cuales se eliminan de forma permanente.

No utilizamos herramientas analíticas de seguimiento entre distintas aplicaciones ni vendemos tu información personal.

## 3. Finalidad del tratamiento

- Prestar el servicio de la app: personalizar las lecciones y el plan de entrenamiento para tu perro, registrar el progreso y sincronizarlo entre tus dispositivos.
- Gestionar tu cuenta: inicio de sesión, verificación de correo y restablecimiento de contraseña.
- Desbloquear y restaurar LeadMate Plus.
- Financiar la versión gratuita mediante publicidad.
- Mejorar la calidad de la app y la eficacia del entrenamiento canino mediante analítica anónima de producto.
- Mantener la seguridad del servicio y corregir incidencias técnicas.

**Bases jurídicas (RGPD):** ejecución del contrato (cuenta, sincronización, suscripción); consentimiento (anuncios personalizados, micrófono); interés legítimo (seguridad, funcionamiento del servicio y mejora anónima del producto sujeta a derecho de oposición/opt-out).

## 4. Destinatarios de los datos

Compartimos información únicamente con proveedores de servicios que la tratan en nuestro nombre:

- **Supabase**: autenticación de cuentas, base de datos y almacenamiento de archivos.
- **Google (AdMob y Google Play)**: publicidad y pagos.
- **RevenueCat**: gestión de suscripciones.
- **PostHog**: analítica anónima de uso de producto (servidores en la UE, Alemania, con descarte inmediato de IP).

Asimismo, podemos comunicar información si así lo exige la ley. Estos proveedores pueden procesar datos fuera de tu país al amparo de garantías adecuadas, tales como cláusulas contractuales tipo.

## 5. Conservación y supresión de datos

- Los datos en tu dispositivo se conservan hasta que restablezcas el progreso en Ajustes o desinstales la aplicación.
- Los datos de tu cuenta se conservan hasta que la elimines.
- **Para eliminar tu cuenta y los datos asociados en nuestro servidor:** abre la app, accede a la pantalla de cuenta y pulsa **Eliminar cuenta**. Esto borra tu cuenta y los datos sincronizados de tu perro. También puedes escribirnos a hi@ndsrf.com y lo gestionaremos por ti.
- Los registros de compras pueden ser conservados por Google y RevenueCat durante los plazos exigidos por obligaciones legales y contables.
- Los datos publicitarios recopilados por Google se rigen por la política de Google. Puedes restablecer o eliminar tu ID de publicidad en los Ajustes de Android → Privacidad → Anuncios.
- Los datos de analítica anónima de producto se conservan en PostHog durante 12 meses. Al no estar vinculados a tu cuenta de usuario, la eliminación de la cuenta no altera las métricas anónimas históricas de instalación.

## 6. Tus derechos

En virtud de la normativa aplicable (como el RGPD en la UE/EEE), tienes derecho a acceder a tus datos, rectificarlos, solicitar su supresión o portabilidad, oponerte a su tratamiento o limitarlo, y retirar tu consentimiento en cualquier momento. Puedes oponerte a la analítica anónima en cualquier momento desde Ajustes → Preferencias. Escríbenos a hi@ndsrf.com para ejercer estos derechos. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) o la autoridad de control de tu país.

## 7. Permisos solicitados

| Permiso | Finalidad |
|---|---|
| Micrófono (`RECORD_AUDIO`) | Únicamente para grabar una señal personalizada opcional. Se solicita al pulsar grabar. |
| Modificar ajustes de audio | Para que las señales y sonidos de las lecciones se reproduzcan correctamente. |
| Internet / estado de red | Para descargar contenidos de lecciones, sincronizar tu cuenta, mostrar anuncios, procesar analítica anónima y gestionar compras. |
| ID de publicidad | Utilizado por AdMob para anuncios. Puedes inhabilitarlo en los Ajustes de Android. |

## 8. Seguridad

Las comunicaciones se realizan cifradas mediante HTTPS. El acceso a los datos del servidor está restringido por usuario. Ningún sistema de transmisión o almacenamiento es infalible, por lo que no podemos garantizar una seguridad absoluta.

## 9. Menores de edad

LeadMate no está dirigida a menores de 13 años (o la edad mínima legal en tu país) ni recopilamos deliberadamente sus datos personales. Si consideras que un menor nos ha facilitado información personal, contáctanos y la eliminaremos de inmediato.

## 10. Modificaciones de esta política

Podemos actualizar esta política de privacidad periódicamente. Actualizaremos la fecha en la parte superior y, ante cambios sustanciales, te avisaremos a través de la aplicación.

## 11. Contacto

Javier García (ndsrf) · hi@ndsrf.com
