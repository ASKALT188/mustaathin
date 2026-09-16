// ===== تكوين Supabase =====
const SUPABASE_URL = 'https://qnxiyrfdvqskwfcmnptw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NV8m1fyVZq29VKBD6hQnsw_euvyzRsH';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== كلمة المرور =====
const DASHBOARD_PASSWORD = 'nigga1234';

// ===== المتغيرات =====
let openedStudent = '';
let isProcessing = false;
const currentTeacher = 'محمد ماهر او عبدالله العوض';
let allStudents = [];
let allHistory = [];
let selectedDownloadIds = new Set();

// ===== نافذة التأكيد =====
let confirmCallback = null;

function showConfirm(message, title = 'تأكيد', onConfirm = null) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = onConfirm;
    document.getElementById('confirmModal').classList.add('active');
}

function confirmYes() {
    document.getElementById('confirmModal').classList.remove('active');
    const cb = confirmCallback;
    confirmCallback = null;
    if (typeof cb === 'function') cb();
}

function confirmNo() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

// DOM refs
const studentListEl = document.getElementById('studentList');
const logsListEl = document.getElementById('logsList');
const downloadListEl = document.getElementById('downloadList');
const searchInput = document.getElementById('searchInput');
const toastContainer = document.getElementById('toastContainer');

// ===== التنقل بين الأقسام =====
function switchSection(section) {
    document.getElementById('navStudents').classList.toggle('active', section === 'students');
    document.getElementById('navLogs').classList.toggle('active', section === 'logs');
    document.getElementById('navDownload').classList.toggle('active', section === 'download');

    document.getElementById('pageStudents').classList.toggle('active', section === 'students');
    document.getElementById('pageLogs').classList.toggle('active', section === 'logs');
    document.getElementById('pageDownload').classList.toggle('active', section === 'download');

    if (section === 'logs') renderLogs();
    if (section === 'download') renderDownloadList();

    sessionStorage.setItem('currentSection', section);
    closeSidebarOnMobile();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarBackdrop').classList.toggle('open');
}

function closeSidebarOnMobile() {
    if (window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarBackdrop').classList.remove('open');
    }
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarBackdrop').classList.remove('open');
    }
});

// ===== كلمة المرور =====
function checkPassword() {
    const input = document.getElementById('passwordInput');
    const errorEl = document.getElementById('loginError');
    const overlay = document.getElementById('loginOverlay');

    if (input.value === DASHBOARD_PASSWORD) {
        sessionStorage.setItem('mustaathin_auth', 'true');
        overlay.style.display = 'none';
        errorEl.textContent = '';
        input.value = '';
        init();
    } else {
        errorEl.textContent = '❌ كلمة المرور غير صحيحة';
        input.value = '';
        input.focus();
        input.style.borderColor = '#b13e3e';
        setTimeout(() => input.style.borderColor = '#ede4ff', 800);
    }
}

document.getElementById('passwordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});

// ===== تسجيل الخروج =====
function logout() {
    showConfirm(
        'هل تريد تسجيل الخروج من الحساب؟',
        'تأكيد الخروج',
        () => {
            sessionStorage.removeItem('mustaathin_auth');
            sessionStorage.removeItem('currentSection');
            location.reload();
        }
    );
}

// ===== نافذة إضافة طالب =====
function openAddModal() {
    document.getElementById('addStudentModal').classList.add('active');
    document.getElementById('newStudentName').value = '';
    setTimeout(() => document.getElementById('newStudentName').focus(), 100);
}

function closeAddModal() {
    document.getElementById('addStudentModal').classList.remove('active');
}

document.getElementById('newStudentName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewStudent();
});

// ===== إضافة طالب =====
async function addNewStudent() {
    const nameInput = document.getElementById('newStudentName');
    const name = nameInput.value.trim();

    if (!name) {
        showToast('الرجاء إدخال اسم الطالب', 'error');
        return;
    }

    if (allStudents.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        showToast('هذا الطالب موجود مسبقاً', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('students')
            .insert([{
                name: name,
                permitted: false,
                last_permitted_at: null
            }]);

        if (error) throw error;

        closeAddModal();
        showToast(`✅ تم إضافة ${name}`, 'success');
        await loadAllData();
    } catch (error) {
        console.error('Add student error:', error);
        showToast('خطأ في الإضافة: ' + error.message, 'error');
    }
}

// ===== فتح نافذة خيارات الطالب =====
function openStudentOptions(name) {
    if (isProcessing) return;
    openedStudent = name;

    const student = allStudents.find(s => s.name === name);
    if (!student) return;

    document.getElementById('optionsStudentName').textContent = name;

    document.getElementById('optionsMainView').style.display = 'block';
    document.getElementById('optionsQrView').style.display = 'none';

    const permitBtn = document.getElementById('permitOptionBtn');
    const cancelBtn = document.getElementById('cancelOptionBtn');

    if (student.permitted) {
        permitBtn.classList.add('current');
        cancelBtn.classList.remove('current');
    } else {
        permitBtn.classList.remove('current');
        cancelBtn.classList.add('current');
    }

    document.getElementById('studentOptionsModal').classList.add('active');
}

function closeStudentOptions() {
    document.getElementById('studentOptionsModal').classList.remove('active');
    document.getElementById('optionsMainView').style.display = 'block';
    document.getElementById('optionsQrView').style.display = 'none';
    document.getElementById('modalQrContainer').innerHTML = '';
    openedStudent = '';
}

// ===== تغيير حالة الطالب =====
async function setStudentStatus(status) {
    if (!openedStudent) return;
    const name = openedStudent;
    closeStudentOptions();
    await updateStudentStatus(name, status);
}

// ===== عرض الباركود داخل النافذة =====
function showQrInsideModal() {
    if (!openedStudent) return;

    const student = allStudents.find(s => s.name === openedStudent);
    if (!student) return;

    document.getElementById('optionsMainView').style.display = 'none';
    document.getElementById('optionsQrView').style.display = 'block';

    const container = document.getElementById('modalQrContainer');
    container.innerHTML = '';

    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const qrData = `${baseUrl}verify.html?student=${encodeURIComponent(openedStudent)}`;

    new QRCode(container, {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: '#4c1d95',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('modalQrName').textContent = openedStudent;

    const statusEl = document.getElementById('modalQrStatus');
    if (student.permitted) {
        statusEl.className = 'modal-qr-status permitted';
        statusEl.innerHTML = `🟢 مسموح`;
    } else {
        statusEl.className = 'modal-qr-status not-permitted';
        statusEl.innerHTML = `🔴 غير مسموح`;
    }
}

function backToOptions() {
    document.getElementById('optionsQrView').style.display = 'none';
    document.getElementById('optionsMainView').style.display = 'block';
    document.getElementById('modalQrContainer').innerHTML = '';
}

function downloadQrFromModal() {
    if (!openedStudent) return;

    const container = document.getElementById('modalQrContainer');
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');

    if (!canvas && !img) {
        showToast('لا يوجد باركود للتحميل', 'error');
        return;
    }

    const link = document.createElement('a');
    link.download = `QR_${openedStudent}.png`;

    if (canvas) {
        link.href = canvas.toDataURL('image/png');
    } else {
        link.href = img.src;
    }

    link.click();
    showToast(`✅ تم تحميل باركود ${openedStudent}`, 'success');
}

function deleteStudentFromModal() {
    if (!openedStudent) return;
    const name = openedStudent;
    closeStudentOptions();
    deleteStudent(name);
}

// ===== فتح نافذة تعديل الاسم =====
function openEditNameModal() {
    if (!openedStudent) return;
    const name = openedStudent;

    document.getElementById('editStudentName').value = name;
    document.getElementById('studentOptionsModal').classList.remove('active');
    document.getElementById('optionsMainView').style.display = 'block';
    document.getElementById('optionsQrView').style.display = 'none';
    document.getElementById('editNameModal').classList.add('active');

    setTimeout(() => {
        const input = document.getElementById('editStudentName');
        input.focus();
        input.select();
    }, 100);
}

function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('active');
    openedStudent = '';
}

document.getElementById('editStudentName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEditName();
});

async function saveEditName() {
    const input = document.getElementById('editStudentName');
    const newName = input.value.trim();
    const oldName = openedStudent;

    if (!newName) {
        showToast('الرجاء إدخال الاسم', 'error');
        return;
    }

    if (newName === oldName) {
        closeEditNameModal();
        return;
    }

    if (allStudents.some(s => s.name.toLowerCase() === newName.toLowerCase())) {
        showToast('هذا الاسم موجود مسبقاً', 'error');
        return;
    }

    try {
        const { error: updateError } = await supabaseClient
            .from('students')
            .update({ name: newName })
            .eq('name', oldName);

        if (updateError) throw updateError;

        await supabaseClient
            .from('history')
            .update({ student_name: newName })
            .eq('student_name', oldName);

        closeEditNameModal();
        showToast(`✅ تم تغيير الاسم إلى ${newName}`, 'success');
        await loadAllData();

    } catch (error) {
        console.error('Edit name error:', error);
        showToast('خطأ في التعديل: ' + error.message, 'error');
    }
}

// ===== حذف طالب =====
function deleteStudent(name) {
    showConfirm(
        `هل أنت متأكد من حذف "${name}"؟ سيتم حذف الطالب وسجله نهائياً.`,
        'تأكيد حذف الطالب',
        async () => {
            try {
                const { error: deleteError } = await supabaseClient
                    .from('students')
                    .delete()
                    .eq('name', name);

                if (deleteError) throw deleteError;

                await supabaseClient
                    .from('history')
                    .delete()
                    .eq('student_name', name);

                showToast(`🗑️ تم حذف ${name}`, 'error');
                await loadAllData();

            } catch (error) {
                console.error('Delete error:', error);
                showToast('خطأ في الحذف: ' + error.message, 'error');
            }
        }
    );
}

// ===== سماح / غير سماح للكل =====
function setAllStatus(status) {
    if (isProcessing) return;

    if (allStudents.length === 0) {
        showToast('لا يوجد طلاب', 'error');
        return;
    }

    const statusText = status ? 'سماح' : 'غير سماح';
    const actionText = status ? 'السماح' : 'منع';

    showConfirm(
        `هل أنت متأكد من ${actionText} لجميع الطلاب (${allStudents.length} طالب)؟`,
        `تأكيد ${statusText} للكل`,
        async () => {
            await updateAllStudentsStatus(status);
        }
    );
}

async function updateAllStudentsStatus(status) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const now = new Date();
        const localTime = new Date(now.getTime() + (3 * 3600000));

        const timestamp = localTime.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });

        let successCount = 0;
        let failCount = 0;

        for (const student of allStudents) {
            try {
                const updateData = { permitted: status };
                if (status === true) {
                    updateData.last_permitted_at = localTime.toISOString();
                }

                const { error: updateError } = await supabaseClient
                    .from('students')
                    .update(updateData)
                    .eq('id', student.id);

                if (updateError) throw updateError;

                const statusText = status ? 'Permitted' : 'Not Permitted';
                const { error: historyError } = await supabaseClient
                    .from('history')
                    .insert([{
                        student_name: student.name,
                        status: statusText,
                        timestamp: timestamp,
                        teacher: currentTeacher
                    }]);

                if (historyError) {
                    console.warn('History insert error:', historyError);
                }

                successCount++;

            } catch (e) {
                console.error(`Failed to update ${student.name}:`, e);
                failCount++;
            }
        }

        if (successCount > 0) {
            showToast(
                `✅ تم ${status ? 'السماح' : 'المنع'} لـ ${successCount} طالب${failCount > 0 ? ` (${failCount} فشل)` : ''}`,
                status ? 'success' : 'error'
            );
        } else {
            showToast('❌ فشل تحديث الطلاب', 'error');
        }

        await loadAllData();

    } catch (error) {
        console.error('Set all status error:', error);
        showToast('خطأ: ' + error.message, 'error');
    } finally {
        isProcessing = false;
    }
}

// ===== Toast =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 2200);
}

// ===== جلب الطلاب =====
async function fetchStudents() {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('name');

        if (error) throw error;
        allStudents = data;
        return data;
    } catch (error) {
        showToast('خطأ في تحميل الطلاب: ' + error.message, 'error');
        return [];
    }
}

// ===== جلب السجل =====
async function fetchHistory() {
    try {
        const { data, error } = await supabaseClient
            .from('history')
            .select('*')
            .order('id', { ascending: false })
            .limit(500);

        if (error) throw error;
        allHistory = data;
        return data;
    } catch (error) {
        return [];
    }
}

// ===== تحديث حالة طالب =====
async function updateStudentStatus(name, status) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const now = new Date();
        const localTime = new Date(now.getTime() + (3 * 3600000));

        const timestamp = localTime.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });

        const updateData = { permitted: status };
        if (status === true) {
            updateData.last_permitted_at = localTime.toISOString();
        }

        const { error: updateError } = await supabaseClient
            .from('students')
            .update(updateData)
            .eq('name', name);

        if (updateError) throw updateError;

        const statusText = status ? 'Permitted' : 'Not Permitted';

        const { error: historyError } = await supabaseClient
            .from('history')
            .insert([{
                student_name: name,
                status: statusText,
                timestamp: timestamp,
                teacher: currentTeacher
            }]);

        if (historyError) throw historyError;

        showToast(`${name} ${status ? 'مسموح ✓' : 'غير مسموح ✗'}`, status ? 'success' : 'error');

        await loadAllData();

    } catch (error) {
        showToast('خطأ في التحديث: ' + error.message, 'error');
    } finally {
        setTimeout(() => { isProcessing = false; }, 300);
    }
}

// ===== تحميل البيانات =====
async function loadAllData() {
    const students = await fetchStudents();
    await fetchHistory();
    renderStudents(students, searchInput.value);
    renderLogs();
    renderDownloadList();
}

// ===== عرض الطلاب =====
function renderStudents(students, filter = '') {
    if (!students || students.length === 0) {
        studentListEl.innerHTML = `<div class="loading-message">لا يوجد طلاب. أضف طالباً جديداً.</div>`;
        return;
    }

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0 && students.length > 0) {
        studentListEl.innerHTML = `<div class="loading-message">لا يوجد نتائج لـ "${filter}"</div>`;
        return;
    }

    let html = '';
    filtered.forEach((s, index) => {
        const status = s.permitted === true;
        const num = index + 1;
        const safeName = s.name.replace(/'/g, "\\'");
        const statusClass = status ? 'permitted' : 'not-permitted';
        const statusText = status ? 'مسموح' : 'غير مسموح';

        html += `
            <div class="student-item">
                <span class="student-number">${num}</span>

                <button class="student-name-btn" onclick="openStudentOptions('${safeName}')">
                    <i class="fas fa-user-graduate"></i>
                    <span>${s.name}</span>
                </button>

                <span class="status-badge ${statusClass}">
                    ${status ? '🟢' : '🔴'} ${statusText}
                </span>
            </div>
        `;
    });
    studentListEl.innerHTML = html;
}

// ===== عرض السجلات =====
function renderLogs() {
    if (!allHistory || allHistory.length === 0) {
        logsListEl.innerHTML = `<div class="empty-history"><i class="fas fa-info-circle"></i> لا توجد عمليات بعد</div>`;
        return;
    }

    let html = '';
    allHistory.forEach(entry => {
        const isPermitted = entry.status === 'Permitted';
        const icon = isPermitted ? '🟢' : '🔴';
        const statusText = isPermitted ? 'مسموح' : 'غير مسموح';
        const statusClass = isPermitted ? 'permitted' : 'not-permitted';

        html += `
            <div class="log-item">
                <div class="log-item-right">
                    <div class="log-icon ${statusClass}">
                        <i class="fas ${isPermitted ? 'fa-check' : 'fa-times'}"></i>
                    </div>
                    <div class="log-info">
                        <div class="log-student">
                            <i class="fas fa-user-graduate"></i> ${entry.student_name}
                        </div>
                        <div class="log-teacher">
                            <i class="fas fa-chalkboard-teacher"></i> ${entry.teacher}
                        </div>
                    </div>
                </div>
                <div class="log-item-left">
                    <span class="status-badge ${statusClass}">${icon} ${statusText}</span>
                    <span class="log-time-big">
                        <i class="fas fa-clock"></i> ${entry.timestamp}
                    </span>
                </div>
            </div>
        `;
    });
    logsListEl.innerHTML = html;
}

// ===== تحميل CSV =====
function downloadLogs() {
    if (!allHistory || allHistory.length === 0) {
        showToast('لا توجد سجلات للتحميل', 'error');
        return;
    }

    let csv = '\uFEFF';
    csv += 'الطالب,الحالة,التاريخ والوقت,المعلم\n';

    allHistory.forEach(entry => {
        const status = entry.status === 'Permitted' ? 'مسموح' : 'غير مسموح';
        const student = entry.student_name.replace(/,/g, ' ');
        const teacher = entry.teacher.replace(/,/g, ' ');
        csv += `${student},${status},${entry.timestamp},${teacher}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجل_العمليات_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    showToast('✅ تم تحميل السجل', 'success');
}

// ===== عرض قائمة التحميل =====
function renderDownloadList() {
    if (!allStudents || allStudents.length === 0) {
        downloadListEl.innerHTML = `<div class="loading-message">لا يوجد طلاب.</div>`;
        return;
    }

    let html = '';
    allStudents.forEach((s, index) => {
        const checked = selectedDownloadIds.has(s.id);
        html += `
            <label class="download-item ${checked ? 'checked' : ''}" data-id="${s.id}">
                <input type="checkbox" ${checked ? 'checked' : ''}
                       onchange="toggleDownloadSelection(${s.id}, this.checked)">
                <span class="download-check">
                    <i class="fas fa-check"></i>
                </span>
                <span class="download-number">${index + 1}</span>
                <span class="download-name">
                    <i class="fas fa-user-graduate"></i> ${s.name}
                </span>
            </label>
        `;
    });
    downloadListEl.innerHTML = html;
    updateSelectedCount();
}

function toggleDownloadSelection(id, checked) {
    if (checked) selectedDownloadIds.add(id);
    else selectedDownloadIds.delete(id);

    const item = document.querySelector(`.download-item[data-id="${id}"]`);
    if (item) item.classList.toggle('checked', checked);

    updateSelectedCount();
}

function selectAllStudents() {
    allStudents.forEach(s => selectedDownloadIds.add(s.id));
    renderDownloadList();
}

function deselectAllStudents() {
    selectedDownloadIds.clear();
    renderDownloadList();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedDownloadIds.size;
}

// ===== توليد الباركود كـ DataURL =====
function generateQrDataUrl(studentName, size = 400) {
    return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        new QRCode(tempDiv, {
            text: `${window.location.origin + window.location.pathname.replace(/[^/]*$/, '')}verify.html?student=${encodeURIComponent(studentName)}`,
            width: size,
            height: size,
            colorDark: '#4c1d95',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            const canvas = tempDiv.querySelector('canvas');
            if (!canvas) {
                resolve(null);
                return;
            }
            resolve(canvas.toDataURL('image/png'));
        }, 150);
    });
}

function generateQrDataUrlWithName(studentName, size = 400) {
    return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        new QRCode(tempDiv, {
            text: `${window.location.origin + window.location.pathname.replace(/[^/]*$/, '')}verify.html?student=${encodeURIComponent(studentName)}`,
            width: size,
            height: size,
            colorDark: '#4c1d95',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            const qrCanvas = tempDiv.querySelector('canvas');
            if (!qrCanvas) {
                resolve(null);
                return;
            }

            const padding = Math.floor(size * 0.08);
            const nameHeight = Math.floor(size * 0.18);
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = size + (padding * 2);
            finalCanvas.height = size + (padding * 2) + nameHeight;

            const ctx = finalCanvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            ctx.strokeStyle = '#ede4ff';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, finalCanvas.width - 4, finalCanvas.height - 4);

            ctx.drawImage(qrCanvas, padding, padding, size, size);

            ctx.strokeStyle = '#ede4ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding, size + padding + 6);
            ctx.lineTo(finalCanvas.width - padding, size + padding + 6);
            ctx.stroke();

            ctx.fillStyle = '#4c1d95';
            ctx.font = `bold ${Math.floor(size * 0.09)}px 'Tajawal', 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(studentName, finalCanvas.width / 2, size + padding + (nameHeight / 2) + 10);

            resolve(finalCanvas.toDataURL('image/png'));
        }, 150);
    });
}

// ===== تحميل المحدد: PDF داخل ZIP =====
async function downloadSelectedQr() {
    if (selectedDownloadIds.size === 0) {
        showToast('اختر طالباً واحداً على الأقل', 'error');
        return;
    }

    const selected = allStudents.filter(s => selectedDownloadIds.has(s.id));

    showToast(`جاري تجهيز الملف... (0/${selected.length})`, 'success');

    const zip = new JSZip();
    const { jsPDF } = window.jspdf;

    // إعدادات A4: 3 أعمدة × 4 صفوف = 12 باركود في الصفحة
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

    // حفظ PDF في ZIP
    const pdfBlob = pdf.output('blob');
    zip.file('باركودات_الطلاب.pdf', pdfBlob);

    // إضافة مجلد الصور المنفصلة
    const folder = zip.folder('صور_منفصلة');
    for (const student of selected) {
        const imgDataUrl = await generateQrDataUrlWithName(student.name, 400);
        if (imgDataUrl) {
            const base64 = imgDataUrl.split(',')[1];
            folder.file(`QR_${student.name}.png`, base64, { base64: true });
        }
    }

    // توليد ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `باركودات_${selected.length}_طالب.zip`;
    link.click();

    showToast(`✅ تم تحميل ${selected.length} باركود`, 'success');
}

// ===== فلترة الطلاب =====
window.filterStudents = function() {
    renderStudents(allStudents, searchInput.value);
};

// ===== Realtime =====
function subscribeToChanges() {
    supabaseClient
        .channel('students_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'students' },
            async (payload) => {
                if (payload.eventType === 'DELETE') {
                    const deletedName = payload.old?.name;
                    if (deletedName) {
                        allStudents = allStudents.filter(s => s.name !== deletedName);
                        renderStudents(allStudents, searchInput.value);
                        renderDownloadList();
                    }
                    return;
                }

                const updatedStudent = payload.new;
                if (!updatedStudent) return;
                const index = allStudents.findIndex(s => s.name === updatedStudent.name);
                if (index !== -1) {
                    allStudents[index] = updatedStudent;
                } else if (payload.eventType === 'INSERT') {
                    allStudents.push(updatedStudent);
                }
                renderStudents(allStudents, searchInput.value);
                renderDownloadList();
            }
        )
        .subscribe();

    supabaseClient
        .channel('history_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'history' },
            async () => {
                await fetchHistory();
                renderLogs();
            }
        )
        .subscribe();
}

// ===== التهيئة =====
async function init() {
    console.log('🚀 ثانوية هوزان');
    await loadAllData();

    const savedSection = sessionStorage.getItem('currentSection') || 'students';
    switchSection(savedSection);

    subscribeToChanges();
    console.log('✅ جاهز');
}

// ===== بدء التطبيق =====
if (sessionStorage.getItem('mustaathin_auth') === 'true') {
    document.getElementById('loginOverlay').style.display = 'none';
    init();
}
