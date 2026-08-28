# 🌐 Módulo Web: Taller de Sonidos y Mudras de los Órganos Internos (Nov 2026)

Este módulo contiene el sistema web completo para la promoción, pre-registro, captura de leads y formalización de inscripciones para el Taller Presencial de Zhineng Qigong con el **Teacher Yuan (Yuantong Liu / Maestro Yuan Ming)** en el Convento de San Joaquín.

---

## 📂 Archivos del Sistema Web

| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| [`index2.html`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/index2.html) | Landing Page Principal | Versión de alta conversión con Tailwind CSS, tema oscuro (`#0a1929`), tipografía Montserrat + Playfair Display, selector dinámico de paquetes, reloj regresivo, agenda, testimonios y preguntas frecuentes. |
| [`index.html`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/index.html) | Landing Page Base | Versión inicial de la página informativa del taller. |
| [`formulario-taller-yuan-2026.html`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/formulario-taller-yuan-2026.html) | Formulario General | Formulario completo de pre-registro unificado con selección de modalidad, tallas, experiencia y método de pago. |
| [`formulario-opcion-1.html`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/formulario-opcion-1.html) | Formulario Paquete 1 | Formulario enfocado para participantes **Sin Hospedaje** (Entrada + Comidas de mediodía). |
| [`formulario-opcion-2.html`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/formulario-opcion-2.html) | Formulario Paquete 2 | Formulario enfocado para participantes **Con Hospedaje y Alimentación Completa** en el Convento. |
| [`terminos-y-condiciones.html`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/terminos-y-condiciones.html) | Legal | Políticas de cancelación, reembolsos, código de conducta y deslinde de responsabilidad. |
| [`google-apps-script.gs`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/google-apps-script.gs) | Backend Webhook | Script para Google Apps Script que recibe las solicitudes POST y las registra ordenadas en Google Sheets. |
| [`registros-template.csv`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/registros-template.csv) | Estructura de Datos | Encabezados oficiales requeridos para la hoja de Google Sheets. |
| [`Disclaimer.docx`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/Disclaimer.docx) | Documento Legal | Texto oficial del deslinde médico y legal. |

---

## ⚙️ Conexión con Google Sheets (Webhook)

1. En tu Google Sheets de registros, abre `Extensiones` -> `Apps Script`.
2. Pega el código de [`google-apps-script.gs`](file:///d:/Dropbox/Ai/DisenoAgentico/RetiroNov26/Web/google-apps-script.gs).
3. Haz clic en `Implementar` -> `Nueva implementación` -> Tipo: `Aplicación web`.
4. Acceso: `Cualquiera`.
5. Copia la URL generada (`.../exec`) y colócala en los formularios HTML.

---

## 🔗 Repositorio Git Remoto

- **Repositorio**: `https://github.com/beltranet/Web.git`
- **Rama activa**: `master`
