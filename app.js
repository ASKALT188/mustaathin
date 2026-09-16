// ===== تحميل المحدد (PDF داخل ZIP) =====
async function downloadSelectedQr() {
    if (selectedDownloadIds.size === 0) {
        showToast('اختر طالباً واحداً على الأقل', 'error');
        return;
    }

    const selected = allStudents.filter(s => selectedDownloadIds.has(s.id));

    showToast(`جاري تجهيز الملف... (0/${selected.length})`, 'success');

    const zip = new JSZip();
    const { jsPDF } = window.jspdf;

    // إعدادات A4
    const pageWidth = 210;
    const pageHeight = 297;
    const cols = 3;
    const rows = 4;
    const qrPerPage = cols * rows;

    const marginX = 10;
    const marginY = 15;
    const cellWidth = (pageWidth - (marginX * 2)) / cols;
    const cellHeight = (pageHeight - (marginY * 2)) / rows;
    const qrSize = Math.min(cellWidth, cellHeight) * 0.7;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let itemIndexOnPage = 0;

    for (let i = 0; i < selected.length; i++) {
        const student = selected[i];

        if (itemIndexOnPage === 0 && i > 0) {
            pdf.addPage();
        }

        const col = itemIndexOnPage % cols;
        const row = Math.floor(itemIndexOnPage / cols);

        const x = marginX + (col * cellWidth);
        const y = marginY + (row * cellHeight);

        const qrDataUrl = await generateQrDataUrl(student.name, 400);

        if (qrDataUrl) {
            const qrX = x + (cellWidth - qrSize) / 2;
            const qrY = y + (cellHeight - qrSize) / 2 - 3;

            pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

            pdf.setFontSize(10);
            pdf.setTextColor(76, 29, 149);
            pdf.setFont('helvetica', 'bold');
            pdf.text(student.name, x + cellWidth / 2, qrY + qrSize + 5, { align: 'center' });
        }

        itemIndexOnPage++;
        if (itemIndexOnPage >= qrPerPage) {
            itemIndexOnPage = 0;
        }

        if (i % 2 === 0 || i === selected.length - 1) {
            showToast(`جاري تجهيز الملف... (${i + 1}/${selected.length})`, 'success');
        }
    }

    const pdfBlob = pdf.output('blob');
    zip.file('باركودات_الطلاب.pdf', pdfBlob);

    const folder = zip.folder('صور_منفصلة');
    for (const student of selected) {
        const imgDataUrl = await generateQrDataUrlWithName(student.name, 400);
        if (imgDataUrl) {
            const base64 = imgDataUrl.split(',')[1];
            folder.file(`QR_${student.name}.png`, base64, { base64: true });
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `باركودات_${selected.length}_طالب.zip`;
    link.click();

    showToast(`✅ تم تحميل ${selected.length} باركود`, 'success');
}
