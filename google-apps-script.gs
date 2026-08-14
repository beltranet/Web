/**
 * Script de Google Apps Script para conectar el formulario web del Taller 2026 a Google Sheets.
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre tu hoja de cálculo en Google Sheets (ej: "Registros Taller Mudras y Sonidos 2026").
 * 2. En el menú superior de la hoja de cálculo, ve a: Extensiones -> Apps Script.
 * 3. Borra cualquier código existente en el editor de Apps Script y pega TODO el contenido de este archivo.
 * 4. Guarda el proyecto haciendo clic en el icono del disco (o presiona Ctrl+S).
 * 5. Haz clic en "Implementar" (botón azul arriba a la derecha) -> "Nueva implementación".
 * 6. Configura la implementación:
 *    - Tipo de implementación: selecciona "Aplicación web" (icono de engranaje).
 *    - Descripción: puedes poner "Webhook de Registro Oficial 2026".
 *    - Ejecutar como: "Tú" (tu cuenta de correo de Google).
 *    - Quién tiene acceso: "Cualquiera" (esto es indispensable para recibir las respuestas).
 * 7. Haz clic en "Implementar".
 * 8. Si te solicita autorizar acceso, haz clic en "Autorizar acceso", selecciona tu cuenta de correo, presiona "Configuración avanzada" (abajo a la izquierda) y luego haz clic en "Ir a Proyecto sin nombre (no seguro)" para otorgar los permisos.
 * 9. Copia la "URL de la aplicación web" que se genera (debe terminar en "/exec").
 * 10. Para vincularla al formulario:
 *     - Abre la página web del formulario.
 *     - Haz clic en el botón de abajo "Configuración de Desarrollador".
 *     - Pega la URL en el campo y haz clic en "Guardar URL".
 *     - O bien, puedes editar directamente la constante DEFAULT_WEBHOOK_URL en el código HTML de formulario-taller-yuan-2026.html.
 */

function doPost(e) {
  try {
    // 1. Obtener la hoja de cálculo activa y la hoja de "Registro" (se creará si no existe)
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Registro");
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Registro");
    }
    
    // Si la hoja está vacía, insertar los encabezados oficiales
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Nombre Completo",
        "Correo Electrónico",
        "WhatsApp",
        "Ciudad y Estado",
        "País",
        "Edad",
        "Género",
        "Práctica Previa Zhineng QiGong",
        "Cómo se enteró / Quién invitó",
        "Talla de Playera",
        "Limitación Física o Movilidad",
        "Detalle de Limitación",
        "Alergias Alimenticias",
        "Modalidad Deseada",
        "Método de Pago",
        "Taller"
      ];
      sheet.appendRow(headers);
      // Aplicar estilo elegante a los encabezados
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackgroundColor("#132f4c");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    // 2. Extraer y procesar los datos del formulario (soporta JSON y URL-encoded)
    var data = {};
    if (e.postData && e.postData.contents && e.postData.contents.trim().indexOf("{") === 0) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // Ignorar error de parseo JSON y continuar
      }
    }
    
    // Si data sigue vacío, recopilar desde e.parameter (parámetros URL-encoded)
    if (Object.keys(data).length === 0 && e.parameter) {
      for (var key in e.parameter) {
        data[key] = e.parameter[key];
      }
    }
    
    // 3. Mapear los datos de acuerdo a los campos enviados por el formulario HTML
    var timestamp = data.timestamp || new Date().toISOString();
    var nombre = data.nombre || "";
    var email = data.email || "";
    var whatsapp = data.whatsapp || "";
    var ciudad_estado = data.residencia || data.ciudad_estado || "";
    
    // Inferir país automáticamente basado en el prefijo telefónico de WhatsApp
    var pais = data.pais || "";
    if (!pais && whatsapp) {
      var wClean = whatsapp.trim();
      if (wClean.indexOf("+52") === 0) pais = "México";
      else if (wClean.indexOf("+34") === 0) pais = "España";
      else if (wClean.indexOf("+1") === 0) pais = "EE.UU. / Canadá";
      else if (wClean.indexOf("+57") === 0) pais = "Colombia";
      else if (wClean.indexOf("+51") === 0) pais = "Perú";
      else if (wClean.indexOf("+54") === 0) pais = "Argentina";
      else if (wClean.indexOf("+55") === 0) pais = "Brasil";
      else if (wClean.indexOf("+56") === 0) pais = "Chile";
      else if (wClean.indexOf("+58") === 0) pais = "Venezuela";
      else if (wClean.indexOf("+593") === 0) pais = "Ecuador";
      else if (wClean.indexOf("+502") === 0) pais = "Guatemala";
      else if (wClean.indexOf("+506") === 0) pais = "Costa Rica";
      else if (wClean.indexOf("+598") === 0) pais = "Uruguay";
      else if (wClean.indexOf("+41") === 0) pais = "Suiza";
      else if (wClean.indexOf("+49") === 0) pais = "Alemania";
      else if (wClean.indexOf("+33") === 0) pais = "Francia";
      else if (wClean.indexOf("+351") === 0) pais = "Portugal";
      else if (wClean.indexOf("+61") === 0) pais = "Australia";
      else if (wClean.indexOf("+974") === 0) pais = "Qatar";
      else pais = "Otro";
    }

    // Evitar que Google Sheets interprete el prefijo "+" como una fórmula (lo que causa #ERROR!)
    if (whatsapp && whatsapp.indexOf("+") === 0) {
      whatsapp = "'" + whatsapp;
    }
    
    var edad = data.edad || "";
    var genero = data.genero || "";
    var historial = data.historial || "";
    var referencia = data.referencia || "";
    var talla_playera = data.talla_playera || "";
    var movilidad = data.movilidad || "";
    var movilidad_detalle = data.movilidad_detalle || "";
    var alergias = data.alergias || "";
    var modalidad = data.modalidad || "";
    var metodo_pago = data.metodo_pago || "";
    var taller = data.taller || "Mudras y Sonidos Noviembre 2026";
    
    // 4. Agregar la fila a la hoja de cálculo
    sheet.appendRow([
      timestamp,
      nombre,
      email,
      whatsapp,
      ciudad_estado,
      pais,
      edad,
      genero,
      historial,
      referencia,
      talla_playera,
      movilidad,
      movilidad_detalle,
      alergias,
      modalidad,
      metodo_pago,
      taller
    ]);
    
    // 5. Enviar notificación por correo electrónico
    try {
      var destinatarios = "beltranet@gmail.com, sandra.laura.ramos@gmail.com";
      var asunto = "🔔 Nuevo Pre-Registro: " + nombre + " - Taller Mudras y Sonidos 2026";
      
      var waDisplay = whatsapp ? whatsapp.replace("'", "") : "";
      var waCleanNum = waDisplay ? waDisplay.replace(/[^0-9]/g, "") : "";
      var messageText = "Hola " + nombre + ", gracias por registrarte al Taller de Mudras y Sonidos 2026. ¿Tienes alguna duda con tu pago o necesitas soporte técnico para efectuarlo?";
      var encodedText = encodeURIComponent(messageText);
      var waLinkHtml = waCleanNum ? "<a href='https://wa.me/" + waCleanNum + "?text=" + encodedText + "' style='color: #009ee3; text-decoration: underline; font-weight: bold;'>" + waDisplay + " 💬 (Abrir Chat)</a>" : waDisplay;

      var cuerpoHtml = 
        "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f9f9f9;'>" +
          "<h2 style='color: #132f4c; border-bottom: 2px solid #FFD700; padding-bottom: 10px; margin-top: 0;'>¡Nuevo Pre-Registro Recibido!</h2>" +
          "<p style='font-size: 14px; color: #555;'>Se ha registrado una nueva participación para el taller desde el formulario web. A continuación los detalles:</p>" +
          
          "<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%; color: #333;'>Nombre Completo:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + nombre + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Correo Electrónico:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'><a href='mailto:" + email + "'>" + email + "</a></td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>WhatsApp:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + waLinkHtml + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Residencia:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + ciudad_estado + ", " + pais + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Edad:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + edad + " años</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Género:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + genero + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Experiencia previa:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + historial + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>¿Cómo se enteró / Quién invitó?:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + referencia + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Talla de Playera:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + talla_playera + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Limitación de Movilidad:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + movilidad + (movilidad_detalle ? " (" + movilidad_detalle + ")" : "") + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Alergias Alimenticias:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + alergias + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Opción / Modalidad:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555; font-weight: bold;'>" + modalidad + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Canal de Pago:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555; font-weight: bold;'>" + metodo_pago + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Taller:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555;'>" + taller + "</td></tr>" +
            "<tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;'>Registrado el:</td><td style='padding: 8px; border-bottom: 1px solid #eee; color: #555; font-size: 11px;'>" + timestamp + "</td></tr>" +
          "</table>" +
          
          "<div style='margin-top: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px;'>" +
            "Este es un mensaje automático enviado por el sistema de pre-registro de Sembradores de Qi." +
          "</div>" +
        "</div>";

      MailApp.sendEmail({
        to: destinatarios,
        subject: asunto,
        htmlBody: cuerpoHtml
      });
    } catch (e) {
      console.error("Error al enviar correo de notificación: " + e.toString());
    }

    // 6. Retornar respuesta de éxito (CORS se maneja nativamente en Apps Script)
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Registro recibido exitosamente."
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
