/**
 * Script de Google Apps Script para conectar los formularios web del Taller 2026 a Google Sheets y enviar correos de confirmación.
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre tu hoja de cálculo en Google Sheets (ej: "Registros Taller Mudras y Sonidos 2026").
 * 2. En el menú superior de la hoja de cálculo, ve a: Extensiones -> Apps Script.
 * 3. Borra cualquier código existente en el editor de Apps Script y pega TODO el contenido de este archivo.
 * 4. Guarda el proyecto haciendo clic en el icono del disco (o presiona Ctrl+S).
 * 5. Haz clic en "Implementar" (botón azul arriba a la derecha) -> "Nueva implementación".
 * 6. Configura la implementación:
 *    - Tipo de implementación: selecciona "Aplicación web" (icono de engranaje).
 *    - Descripción: puedes poner "Webhook de Registro Oficial 2026 con Confirmación al Usuario".
 *    - Ejecutar como: "Tú" (tu cuenta de correo de Google).
 *    - Quién tiene acceso: "Cualquiera" (indispensable para recibir respuestas públicas).
 * 7. Haz clic en "Implementar".
 * 8. Si te solicita autorizar permisos (Google Sheets y MailApp para enviar correos), haz clic en "Autorizar acceso", selecciona tu cuenta, presiona "Configuración avanzada" y luego "Ir a Proyecto sin nombre (no seguro)".
 * 9. Copia la "URL de la aplicación web" que se genera (termina en "/exec").
 * 10. Pega la URL en la constante DEFAULT_WEBHOOK_URL en formulario-opcion-1.html y formulario-opcion-2.html.
 */

// Constantes globales de configuración
var CONFIG = {
  ORGANIZADORES_EMAIL: "beltranet@gmail.com, sandra.laura.ramos@gmail.com",
  REPLY_TO_EMAIL: "beltranet@gmail.com",
  WHATSAPP_PHONE_CLEAN: "525533106161",
  WHATSAPP_DISPLAY: "+52 55 3310 6161 (Felipe)",
  EVENTO_NOMBRE: "Taller de Mudras y Sonidos de los Órganos Internos 2026",
  EVENTO_FECHAS: "20 al 22 de Noviembre, 2026 (Horario: 9:00 AM a 6:00 PM)",
  EVENTO_SEDE: "Convento de San Joaquín, Ciudad de México",
  FECHA_LIMITE_LIQUIDACION: "15 de Noviembre de 2026",
  
  // Datos bancarios oficiales para transferencias
  BANCO_NOMBRE: "Mercado Pago W",
  BANCO_TITULAR: "Felipe de Jesus Beltran Chin",
  BANCO_CLABE: "722969010920226920",
  
  // Enlaces de Mercado Pago
  MP_PAQUETE1_TOTAL: "https://mpago.li/2zMcZ3N",
  MP_PAQUETE1_APARTADO: "https://mpago.li/1fFzgkP",
  MP_PAQUETE2_TOTAL: "https://mpago.li/1GZpA3W",
  MP_PAQUETE2_APARTADO: "https://mpago.li/1fFzgkP"
};

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "El Webhook del Taller de Mudras y Sonidos 2026 está activo y funcionando correctamente.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Si se ejecuta manualmente desde el editor sin parámetros
    if (!e || (!e.postData && !e.parameter)) {
      Logger.log("⚠️ doPost fue ejecutado directamente desde el editor de Apps Script sin datos de formulario. Para probar el script directamente, selecciona y ejecuta la función 'probarEnvioRegistroPrueba'.");
      return ContentService.createTextOutput(JSON.stringify({
        status: "info",
        message: "doPost debe ser llamado mediante una petición web POST. Para pruebas internas usa la función probarEnvioRegistroPrueba()."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Obtener o crear la hoja "Registro" en Google Sheets
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Registro");
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Registro");
    }
    
    // Encabezados oficiales si la hoja está vacía
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
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackgroundColor("#132f4c");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    // 2. Extraer y procesar datos (JSON o URL-encoded)
    var data = {};
    if (e.postData && e.postData.contents) {
      var contents = e.postData.contents.trim();
      if (contents.indexOf("{") === 0) {
        try {
          data = JSON.parse(contents);
        } catch (err) {
          Logger.log("Aviso: no se pudo parsear como JSON: " + err);
        }
      }
    }
    
    if (Object.keys(data).length === 0 && e.parameter) {
      for (var key in e.parameter) {
        data[key] = e.parameter[key];
      }
    }
    
    // 3. Mapear datos
    var timestamp = data.timestamp || new Date().toISOString();
    var nombre = (data.nombre || "").trim();
    var email = (data.email || "").trim();
    var whatsapp = (data.whatsapp || "").trim();
    var ciudad_estado = (data.residencia || data.ciudad_estado || "").trim();
    var pais = (data.pais || "").trim();
    
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

    var whatsappForSheet = whatsapp;
    if (whatsappForSheet && whatsappForSheet.indexOf("+") === 0) {
      whatsappForSheet = "'" + whatsappForSheet;
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
    var taller = data.taller || CONFIG.EVENTO_NOMBRE;
    var idioma = (data.idioma || "es").toLowerCase();
    
    // 4. Agregar la fila en Google Sheets
    sheet.appendRow([
      timestamp,
      nombre,
      email,
      whatsappForSheet,
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
    
    // 5. Enviar Correo de Confirmación al Usuario
    if (email) {
      try {
        enviarCorreoConfirmacionUsuario(data, idioma);
      } catch (errUserMail) {
        console.error("Error al enviar correo al usuario: " + errUserMail.toString());
      }
    }
    
    // 6. Enviar Notificación por Correo a los Organizadores
    try {
      enviarNotificacionOrganizadores(data, nombre, email, whatsapp, ciudad_estado, pais, edad, genero, historial, referencia, talla_playera, movilidad, movilidad_detalle, alergias, modalidad, metodo_pago, taller, timestamp);
    } catch (errOrgMail) {
      console.error("Error al enviar correo a organizadores: " + errOrgMail.toString());
    }

    // 7. Retornar respuesta exitosa en formato JSON
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Registro recibido y correo de confirmación enviado exitosamente."
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("Error general en doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Genera y envía el correo de confirmación personalizado y elegante al usuario.
 */
function enviarCorreoConfirmacionUsuario(data, idioma) {
  var isEn = (idioma === "en");
  var nombre = data.nombre || (isEn ? "Participant" : "Participante");
  var email = data.email;
  var modalidad = data.modalidad || "";
  var metodo_pago = data.metodo_pago || "";
  var paquete = data.paquete || "";
  
  // Detección de paquete y apartado
  var isPaquete2 = (modalidad.indexOf("Paquete 2") !== -1 || paquete.indexOf("Paquete 2") !== -1 || (data.pago_opcion && data.pago_opcion.indexOf("opt2") === 0));
  var isApartado = (modalidad.toLowerCase().indexOf("apartado") !== -1 || (data.pago_opcion && data.pago_opcion.indexOf("apartado") !== -1));
  
  var paqueteNombre = isPaquete2 
    ? (isEn ? "Package 2 — With Lodging & Full Meals" : "Paquete 2 — Con Hospedaje y Alimentación Completa")
    : (isEn ? "Package 1 — Course & Daily Lunch (No Lodging)" : "Paquete 1 — Sin Hospedaje (Entrada + Comidas de mediodía)");
    
  var costoTotal = isPaquete2 ? "$10,000.00 MXN" : "$7,000.00 MXN";
  var montoPagarAhora = isApartado ? "$1,000.00 MXN" : costoTotal;
  
  var esquemaTexto = "";
  if (isApartado) {
    var mensualidadMonto = isPaquete2 ? "$3,000.00 MXN" : "$2,000.00 MXN";
    esquemaTexto = isEn 
      ? "Deposit Plan: $1,000.00 MXN deposit + 3 monthly installments of " + mensualidadMonto + " (Total: " + costoTotal + ")"
      : "Plan de Apartado: $1,000.00 MXN de apartado + 3 pagos mensuales de " + mensualidadMonto + " (Total: " + costoTotal + ")";
  } else {
    esquemaTexto = isEn 
      ? "Full Single Payment of " + costoTotal
      : "Pago Único de Contado de " + costoTotal;
  }
  
  // Enlace de Mercado Pago correspondiente
  var linkMercadoPago = "";
  if (isPaquete2) {
    linkMercadoPago = isApartado ? CONFIG.MP_PAQUETE2_APARTADO : CONFIG.MP_PAQUETE2_TOTAL;
  } else {
    linkMercadoPago = isApartado ? CONFIG.MP_PAQUETE1_APARTADO : CONFIG.MP_PAQUETE1_TOTAL;
  }
  
  // Mensaje precargado para WhatsApp
  var waMessage = isEn
    ? "Hello Felipe, I completed my registration for the Mudras & Sounds Workshop 2026 (" + (isPaquete2 ? "Package 2" : "Package 1") + " - " + (isApartado ? "Deposit $1,000 MXN" : "Full Payment " + costoTotal) + "). Here is my payment receipt. My name is " + nombre + "."
    : "Hola Felipe, completé mi registro al Taller de Mudras y Sonidos 2026 (" + (isPaquete2 ? "Paquete 2" : "Paquete 1") + " - " + (isApartado ? "Apartado $1,000 MXN" : "Pago Total " + costoTotal) + "). Aquí te comparto mi comprobante de pago. Mi nombre es " + nombre + ".";
  
  var waUrl = "https://wa.me/" + CONFIG.WHATSAPP_PHONE_CLEAN + "?text=" + encodeURIComponent(waMessage);

  // Asunto del correo
  var asunto = isEn
    ? "✨ Registration Confirmation: " + CONFIG.EVENTO_NOMBRE + " — " + nombre
    : "✨ Confirmación de Pre-Registro: " + CONFIG.EVENTO_NOMBRE + " — " + nombre;

  // Bloque de Instrucciones de Pago
  var bloquePagoHtml = "";
  if (metodo_pago === "Transferencia" || metodo_pago === "Wire Transfer") {
    bloquePagoHtml = 
      "<div style='background-color: #0a1929; border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin-top: 20px; color: #ffffff;'>" +
        "<h3 style='color: #FFD700; margin-top: 0; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 8px;'>" +
          (isEn ? "🏦 Official Wire Transfer / Deposit Details" : "🏦 Datos Oficiales para Transferencia o Depósito") +
        "</h3>" +
        "<p style='font-size: 13px; color: #d1d5db; margin-top: 0;'>" +
          (isEn 
            ? "Please complete your payment for <strong>" + montoPagarAhora + "</strong> using the following account details:" 
            : "Por favor realiza tu pago por <strong>" + montoPagarAhora + "</strong> a la siguiente cuenta bancaria:") +
        "</p>" +
        "<table style='width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0;'>" +
          "<tr><td style='padding: 6px 0; color: #9ca3af; width: 35%; font-weight: bold;'>" + (isEn ? "Bank / Institution:" : "Banco / Institución:") + "</td><td style='padding: 6px 0; color: #ffffff; font-weight: bold;'>" + CONFIG.BANCO_NOMBRE + "</td></tr>" +
          "<tr><td style='padding: 6px 0; color: #9ca3af; font-weight: bold;'>" + (isEn ? "Beneficiary:" : "Beneficiario:") + "</td><td style='padding: 6px 0; color: #ffffff; font-weight: bold;'>" + CONFIG.BANCO_TITULAR + "</td></tr>" +
          "<tr><td style='padding: 6px 0; color: #9ca3af; font-weight: bold;'>CLABE:</td><td style='padding: 6px 0; color: #FFD700; font-weight: 800; font-size: 15px; letter-spacing: 1px;'>" + CONFIG.BANCO_CLABE + "</td></tr>" +
          "<tr><td style='padding: 6px 0; color: #9ca3af; font-weight: bold;'>" + (isEn ? "Concept / Reference:" : "Concepto / Motivo:") + "</td><td style='padding: 6px 0; color: #ffffff;'>" + (isEn ? "Workshop - " : "Taller - ") + nombre + "</td></tr>" +
          "<tr><td style='padding: 6px 0; color: #9ca3af; font-weight: bold;'>" + (isEn ? "Amount to Pay Now:" : "Monto a Pagar Ahora:") + "</td><td style='padding: 6px 0; color: #34d399; font-weight: 800; font-size: 16px;'>" + montoPagarAhora + "</td></tr>" +
        "</table>" +
      "</div>";
  } else {
    // Pago con Tarjeta (Mercado Pago)
    bloquePagoHtml = 
      "<div style='background-color: #0a1929; border: 2px solid #009ee3; border-radius: 12px; padding: 20px; margin-top: 20px; color: #ffffff; text-align: center;'>" +
        "<h3 style='color: #009ee3; margin-top: 0; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid rgba(0,158,227,0.3); padding-bottom: 8px;'>" +
          (isEn ? "💳 Secure Online Card Payment" : "💳 Pago Seguro en Línea con Tarjeta") +
        "</h3>" +
        "<p style='font-size: 13px; color: #d1d5db; margin-top: 0;'>" +
          (isEn 
            ? "If you have not yet completed your payment of <strong>" + montoPagarAhora + "</strong> with credit or debit card, you can do so through this secure link:" 
            : "Si aún no has completado tu pago de <strong>" + montoPagarAhora + "</strong> con tarjeta de crédito o débito, puedes realizarlo directamente en este enlace seguro:") +
        "</p>" +
        "<div style='margin: 18px 0;'>" +
          "<a href='" + linkMercadoPago + "' target='_blank' style='background-color: #009ee3; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(0,158,227,0.4);'>" +
            (isEn ? "Pay with Mercado Pago (" + montoPagarAhora + ") 👉" : "Pagar con Mercado Pago (" + montoPagarAhora + ") 👉") +
          "</a>" +
        "</div>" +
      "</div>";
  }

  // Bloque para usuarios con Apartado (Aviso de Recordatorios de Mensualidades)
  var bloqueApartadoHtml = "";
  if (isApartado) {
    bloqueApartadoHtml = 
      "<div style='background-color: #1e1b10; border-left: 4px solid #FFD700; padding: 15px 18px; border-radius: 8px; margin-top: 20px;'>" +
        "<h4 style='color: #FFD700; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;'>" +
          (isEn ? "📅 Installment Plan & Payment Reminders" : "📅 Plan de Apartado y Recordatorios de Pago") +
        "</h4>" +
        "<p style='font-size: 13px; color: #fef08a; margin: 0 0 8px 0; line-height: 1.5;'>" +
          (isEn
            ? "Your spot has been reserved with an initial deposit of <strong>$1,000.00 MXN</strong>. The remaining balance consists of <strong>3 monthly payments of " + (isPaquete2 ? "$3,000.00 MXN" : "$2,000.00 MXN") + "</strong>. The final balance deadline is <strong>" + CONFIG.FECHA_LIMITE_LIQUIDACION + "</strong>."
            : "Tu lugar queda apartado con un anticipo de <strong>$1,000.00 MXN</strong>. El saldo restante consiste en <strong>3 mensualidades de " + (isPaquete2 ? "$3,000.00 MXN" : "$2,000.00 MXN") + "</strong>. La fecha límite de liquidación total es el <strong>" + CONFIG.FECHA_LIMITE_LIQUIDACION + "</strong>.") +
        "</p>" +
        "<p style='font-size: 13px; color: #ffffff; margin: 0; font-weight: bold; line-height: 1.5;'>" +
          (isEn
            ? "🔔 <strong>Important notice:</strong> We will send you timely email reminders for your upcoming monthly payment dates directly to this email address."
            : "🔔 <strong>Aviso importante:</strong> Te estaremos enviando oportunamente recordatorios de tus fechas y pagos mensuales directamente a este correo electrónico.") +
        "</p>" +
      "</div>";
  }

  // Construcción del HTML completo del correo
  var emailHtml = 
    "<!DOCTYPE html>" +
    "<html>" +
    "<head><meta charset='UTF-8'></head>" +
    "<body style='font-family: Arial, Helvetica, sans-serif; background-color: #050d18; margin: 0; padding: 20px; color: #ffffff;'>" +
      "<div style='max-width: 620px; margin: 0 auto; background-color: #0a1929; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 215, 0, 0.25); box-shadow: 0 8px 30px rgba(0,0,0,0.6);'>" +
        
        // Cabecera elegante
        "<div style='background: linear-gradient(135deg, #132f4c 0%, #0a1929 100%); padding: 30px 20px; text-align: center; border-bottom: 2px solid #FFD700;'>" +
          "<img src='http://sembradoresdeqi.com/wp-content/uploads/2026/01/logo-sembradores-de-qi-zhineng-qigong.jpg' alt='Sembradores de Qi' style='height: 55px; border-radius: 8px; margin-bottom: 12px;'>" +
          "<h1 style='color: #ffffff; font-size: 20px; margin: 0; font-weight: 800; letter-spacing: 0.5px;'>" +
            (isEn ? "Mudras & Sounds of Internal Organs Workshop 2026" : "Taller de Mudras y Sonidos de los Órganos Internos 2026") +
          "</h1>" +
          "<p style='color: #FFD700; font-size: 13px; margin: 6px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;'>" +
            (isEn ? "Official Pre-Registration Received" : "Pre-Registro Oficial Recibido") +
          "</p>" +
        "</div>" +

        // Contenido Principal
        "<div style='padding: 24px 20px; background-color: #0a1929;'>" +
          
          "<p style='font-size: 15px; color: #ffffff; margin-top: 0; line-height: 1.5;'>" +
            (isEn 
              ? "Hello <strong>" + nombre + "</strong>,<br><br>Thank you for registering for the <strong>" + CONFIG.EVENTO_NOMBRE + "</strong> with Teacher Yuan Ming (Yuantong Liu)."
              : "¡Hola <strong>" + nombre + "</strong>!<br><br>Muchas gracias por registrarte para el <strong>" + CONFIG.EVENTO_NOMBRE + "</strong> con el Maestro Yuan Ming (Yuantong Liu).") +
          "</p>" +

          // Tarjeta de resumen de registro
          "<div style='background-color: #132f4c; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1);'>" +
            "<h3 style='color: #FFD700; margin-top: 0; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;'>" +
              (isEn ? "📋 Registration Summary" : "📋 Resumen de tu Registro") +
            "</h3>" +
            "<table style='width: 100%; border-collapse: collapse; font-size: 13px;'>" +
              "<tr><td style='padding: 6px 0; color: #9ca3af; width: 38%;'>" + (isEn ? "Selected Option:" : "Opción:") + "</td><td style='padding: 6px 0; color: #ffffff; font-weight: bold;'>" + paqueteNombre + "</td></tr>" +
              "<tr><td style='padding: 6px 0; color: #9ca3af;'>" + (isEn ? "Payment Plan:" : "Modalidad:") + "</td><td style='padding: 6px 0; color: #FFD700; font-weight: bold;'>" + esquemaTexto + "</td></tr>" +
              "<tr><td style='padding: 6px 0; color: #9ca3af;'>" + (isEn ? "Payment Method:" : "Método de Pago:") + "</td><td style='padding: 6px 0; color: #ffffff;'>" + metodo_pago + "</td></tr>" +
              "<tr><td style='padding: 6px 0; color: #9ca3af;'>" + (isEn ? "Shirt Size:" : "Talla de Playera:") + "</td><td style='padding: 6px 0; color: #ffffff;'>" + (data.talla_playera || "-") + "</td></tr>" +
              "<tr><td style='padding: 6px 0; color: #9ca3af;'>" + (isEn ? "Dates & Venue:" : "Fechas y Sede:") + "</td><td style='padding: 6px 0; color: #d1d5db; font-size: 12px;'>" + CONFIG.EVENTO_FECHAS + " | " + CONFIG.EVENTO_SEDE + "</td></tr>" +
            "</table>" +
          "</div>" +

          // Bloque de Pago
          bloquePagoHtml +

          // Bloque de Apartado (si aplica)
          bloqueApartadoHtml +

          // LLAMADO A LA ACCIÓN: ENVIAR COMPROBANTE DE PAGO
          "<div style='background-color: #132f4c; border: 2px solid #34d399; border-radius: 14px; padding: 22px 18px; margin-top: 24px; text-align: center;'>" +
            "<h3 style='color: #34d399; margin: 0 0 10px 0; font-size: 16px; font-weight: 800; text-transform: uppercase;'>" +
              (isEn ? "📤 Step to Secure Your Spot: Send Payment Receipt" : "📤 Paso para Confirmar tu Lugar: Envío de Comprobante") +
            "</h3>" +
            "<p style='font-size: 13px; color: #e5e7eb; margin: 0 0 16px 0; line-height: 1.5;'>" +
              (isEn
                ? "Once your payment or deposit is made, please send your payment receipt to <strong>Felipe</strong> by clicking the WhatsApp button below or by replying directly to this email."
                : "Una vez realizado tu pago o apartado, es indispensable enviar tu comprobante a <strong>Felipe</strong> haciendo clic en el botón de WhatsApp abajo o respondiendo a este correo electrónico.") +
            "</p>" +
            "<a href='" + waUrl + "' target='_blank' style='background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(37,211,102,0.4); text-transform: uppercase; letter-spacing: 0.5px;'>" +
              (isEn ? "📱 Send Receipt via WhatsApp 👉" : "📱 Enviar Comprobante por WhatsApp 👉") +
            "</a>" +
            "<p style='font-size: 11px; color: #9ca3af; margin: 12px 0 0 0;'>" +
              (isEn 
                ? "Direct WhatsApp: " + CONFIG.WHATSAPP_DISPLAY + " | Email: " + CONFIG.REPLY_TO_EMAIL 
                : "WhatsApp directo: " + CONFIG.WHATSAPP_DISPLAY + " | Correo: " + CONFIG.REPLY_TO_EMAIL) +
            "</p>" +
          "</div>" +

          // Nota de Políticas / Reembolsos
          "<div style='margin-top: 24px; padding: 14px; background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 8px; font-size: 12px; color: #fda4af; text-align: left; line-height: 1.4;'>" +
            "⚠️ <strong>" + (isEn ? "Important Policy:" : "Nota importante:") + "</strong> " +
            (isEn
              ? "If you are unable to attend, your payment will be credited toward the next Sembradores de Qi event; for this reason, no refunds are issued."
              : "En caso de no poder asistir, tu pago se tomará en cuenta para el siguiente evento de Sembradores de Qi; por esta razón, no se realizan devoluciones.") +
          "</div>" +

        "</div>" +

        // Pie de página
        "<div style='background-color: #050d18; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #6b7280;'>" +
          "<p style='margin: 0 0 6px 0; font-weight: bold; color: #9ca3af;'>Sembradores de Qi — Zhineng Qigong México</p>" +
          "<p style='margin: 0;'><a href='https://sembradoresdeqi.com' target='_blank' style='color: #FFD700; text-decoration: none;'>sembradoresdeqi.com</a> | <a href='https://sembradoresdeqi.com/terminos-y-condiciones/' target='_blank' style='color: #9ca3af; text-decoration: underline;'>" + (isEn ? "Terms & Conditions" : "Términos y Condiciones") + "</a></p>" +
        "</div>" +

      "</div>" +
    "</body>" +
    "</html>";

  // Envío efectivo del correo
  MailApp.sendEmail({
    to: email,
    replyTo: CONFIG.REPLY_TO_EMAIL,
    name: "Sembradores de Qi - Zhineng Qigong",
    subject: asunto,
    htmlBody: emailHtml
  });
}

/**
 * Envía la notificación interna a los organizadores.
 */
function enviarNotificacionOrganizadores(data, nombre, email, whatsapp, ciudad_estado, pais, edad, genero, historial, referencia, talla_playera, movilidad, movilidad_detalle, alergias, modalidad, metodo_pago, taller, timestamp) {
  var asunto = "🔔 Nuevo Pre-Registro: " + nombre + " - Taller Mudras y Sonidos 2026";
  
  var waDisplay = whatsapp ? whatsapp.replace("'", "") : "";
  var waCleanNum = waDisplay ? waDisplay.replace(/[^0-9]/g, "") : "";
  var messageText = "Hola " + nombre + ", gracias por registrarte al Taller de Mudras y Sonidos 2026. ¿Tienes alguna duda con tu pago o necesitas soporte técnico para efectuarlo?";
  var encodedText = encodeURIComponent(messageText);
  var waLinkHtml = waCleanNum ? "<a href='https://wa.me/" + waCleanNum + "?text=" + encodedText + "' style='color: #009ee3; text-decoration: underline; font-weight: bold;'>" + waDisplay + " 💬 (Abrir Chat)</a>" : waDisplay;

  var cuerpoHtml = 
    "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f9f9f9;'>" +
      "<h2 style='color: #132f4c; border-bottom: 2px solid #FFD700; padding-bottom: 10px; margin-top: 0;'>¡Nuevo Pre-Registro Recibido!</h2>" +
      "<p style='font-size: 14px; color: #555;'>Se ha registrado una nueva participación desde el formulario web. A continuación los detalles:</p>" +
      
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
        "Mensaje automático del sistema de pre-registro de Sembradores de Qi." +
      "</div>" +
    "</div>";

  MailApp.sendEmail({
    to: CONFIG.ORGANIZADORES_EMAIL,
    subject: asunto,
    htmlBody: cuerpoHtml
  });
}

/**
 * Función de prueba para ejecutar directamente desde el editor de Apps Script con el botón "▶ Ejecutar".
 * Inserta un registro simulado en la hoja "Registro" y envía los correos de prueba a tu email.
 */
function probarEnvioRegistroPrueba() {
  Logger.log("🧪 Iniciando prueba simulada de registro...");
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        nombre: "Felipe Beltrán (Prueba)",
        email: "beltranet@gmail.com", // Tu correo para recibir la prueba
        whatsapp: "+52 55 3310 6161",
        pais: "México",
        residencia: "Ciudad de México, CDMX",
        edad: "38",
        genero: "Masculino",
        historial: "Sí, anteriormente he tomado cursos",
        referencia: "Recomendación de un amigo",
        referencia_detalle: "Sandra Ramos",
        modalidad: "Paquete 1 ($1,000.00 apartado)",
        metodo_pago: "Transferencia",
        movilidad: "No, no presento ninguna limitación",
        movilidad_detalle: "",
        alergias: "Ninguna",
        talla_playera: "M",
        acepto_terminos: "Sí",
        paquete: "Paquete 1",
        idioma: "es"
      })
    }
  };
  
  var salida = doPost(mockEvent);
  Logger.log("✅ Resultado: " + salida.getContent());
  Logger.log("Revisa tu hoja de cálculo y tu bandeja de correo (beltranet@gmail.com).");
}
