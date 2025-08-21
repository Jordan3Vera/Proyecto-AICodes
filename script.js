const { jsPDF } = window.jspdf;

async function getHash(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link); // necesario para Firefox
  link.click();
  link.remove();
}

document.getElementById('firmarBtn').addEventListener('click', async () => {
  // Cargar el PDF original
  const url = 'Plantilla-recibo-de-sueldo.pdf';
  const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());

  // Calcular hash original
  const hashOriginal = await getHash(existingPdfBytes);
  console.log('Hash PDF original:', hashOriginal);

  // Cargar el PDF con pdf-lib y firmar
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

  // Tomar la página final
  const pages = pdfDoc.getPages();
  const firstPage = pages[1];

  // Agregar texto de firma
  const { degrees, rgb } = PDFLib;
  const timesItalicFont = await pdfDoc.embedFont(
    PDFLib.StandardFonts.TimesRomanItalic
  ); // Cargar fuente cursiva
  firstPage.drawText('Lucho Fernandez', {
    x: 50,
    y: 300, // Ajustar altura
    size: 24, // Tamaño del texto
    font: timesItalicFont,
    color: rgb(0.05, 0.05, 0.05), // color oscuro
    rotate: degrees(-10), // Para inclinar la fuente
  });

  // Guardar PDF firmado
  const signedBytes = await pdfDoc.save();
  const hashFirmado = await getHash(signedBytes);
  console.log('Hash PDF firmado:', hashFirmado);

  // Descargar PDF firmado
  downloadBlob(
    new Blob([signedBytes], { type: 'application/pdf' }),
    'recibo_firmado.pdf'
  );

  // 3️⃣ Crear PDF de hashes
  const hashDoc = await PDFLib.PDFDocument.create();
  const page = hashDoc.addPage([600, 400]);
  const font = await hashDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  // Se crea la información a mostrar hashes del PDF - 1ro el titulo y 2do el hash
  page.drawText('Hash PDF original:', {
    x: 50,
    y: 300,
    size: 14,
    font,
    color: PDFLib.rgb(0, 0, 0),
  });
  page.drawText(hashOriginal, {
    x: 50,
    y: 280,
    size: 12,
    font,
    color: PDFLib.rgb(0, 0, 0),
  });

  page.drawText('Hash PDF firmado:', {
    x: 50,
    y: 240,
    size: 14,
    font,
    color: PDFLib.rgb(0, 0, 0),
  });
  page.drawText(hashFirmado, {
    x: 50,
    y: 220,
    size: 12,
    font,
    color: PDFLib.rgb(0, 0, 0),
  });

  // Descargar los hashes
  const pdfHashBytes = await hashDoc.save();
  downloadBlob(
    new Blob([pdfHashBytes], { type: 'application/pdf' }),
    'hashes.pdf'
  );
});
