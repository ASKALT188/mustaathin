// ===== تكوين Supabase =====
const SUPABASE_URL = 'https://qnxiyrfdvqskwfcmnptw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NV8m1fyVZq29VKBD6hQnsw_euvyzRsH';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== كلمة المرور =====
const DASHBOARD_PASSWORD = 'HA20ZN30';

// ===== المتغيرات =====
let openedStudent = '';
let isProcessing = false;
const currentTeacher = 'محمد ماهر او عبدالله العوض';
let allStudents = [];
let allHistory = [];
let selectedDownloadIds = new Set();
let currentSection = 'students';

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
    currentSection = section;

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
                last_permitted_at: null,
                istiathan_permitted: false,
                last_istiathan_at: null
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

    // ضبط سويتش الأجهزة
    const devicesToggle = document.getElementById('devicesToggle');
    const devicesStatusText = document.getElementById('devicesStatusText');
    devicesToggle.checked = student.permitted === true;
    if (student.permitted) {
        devicesStatusText.textContent = 'مسموح';
        devicesStatusText.className = 'toggle-status-text on';
    } else {
        devicesStatusText.textContent = 'غير مسموح';
        devicesStatusText.className = 'toggle-status-text off';
    }

    // ضبط سويتش الاستئذان
    const istiathanToggle = document.getElementById('istiathanToggle');
    const istiathanStatusText = document.getElementById('istiathanStatusText');
    istiathanToggle.checked = student.istiathan_permitted === true;
    if (student.istiathan_permitted) {
        istiathanStatusText.textContent = 'مسموح';
        istiathanStatusText.className = 'toggle-status-text on';
    } else {
        istiathanStatusText.textContent = 'غير مسموح';
        istiathanStatusText.className = 'toggle-status-text off';
    }

    // مؤشرات وجود بيانات/ملاحظات
    const infoBtn = document.querySelector('.info-option');
    const notesBtn = document.querySelector('.notes-option');

    if (infoBtn) {
        if (student.full_name || student.hijri_birth_date || student.student_id) {
            infoBtn.classList.add('has-info');
        } else {
            infoBtn.classList.remove('has-info');
        }
    }

    if (notesBtn) {
        if (student.notes && student.notes.trim()) {
            notesBtn.classList.add('has-notes');
        } else {
            notesBtn.classList.remove('has-notes');
        }
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

// ===== عند تبديل سويتش الأجهزة =====
async function onDevicesToggleChange(checked) {
    if (!openedStudent) return;

    const statusText = document.getElementById('devicesStatusText');
    statusText.textContent = checked ? 'مسموح' : 'غير مسموح';
    statusText.className = checked ? 'toggle-status-text on' : 'toggle-status-text off';

    await updateStudentStatus(openedStudent, checked);
}

// ===== عند تبديل سويتش الاستئذان =====
async function onIstiathanToggleChange(checked) {
    if (!openedStudent) return;

    const statusText = document.getElementById('istiathanStatusText');
    statusText.textContent = checked ? 'مسموح' : 'غير مسموح';
    statusText.className = checked ? 'toggle-status-text on' : 'toggle-status-text off';

    await updateIstiathanStatus(openedStudent, checked);
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
    statusEl.className = 'modal-qr-status';
    statusEl.innerHTML = '';

    const statuses = [];
    if (student.permitted) statuses.push('📱 مسموح بالأجهزة');
    if (student.istiathan_permitted) statuses.push('🕐 مسموح بالاستئذان');

    if (statuses.length > 0) {
        statusEl.className = 'modal-qr-status permitted';
        statusEl.innerHTML = statuses.join(' · ');
    } else {
        statusEl.className = 'modal-qr-status not-permitted';
        statusEl.innerHTML = '🔴 غير مسموح';
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

// ===== نافذة بيانات الطالب =====
function openStudentInfoModal() {
    if (!openedStudent) return;

    const student = allStudents.find(s => s.name === openedStudent);
    if (!student) return;

    document.getElementById('fullNameInput').value = student.full_name || '';
    document.getElementById('studentIdInput').value = student.student_id || '';
    document.getElementById('hijriBirthDate').value = student.hijri_birth_date || '';

    document.getElementById('studentOptionsModal').classList.remove('active');
    document.getElementById('studentInfoModal').classList.add('active');
}

function closeStudentInfoModal() {
    document.getElementById('studentInfoModal').classList.remove('active');
    openedStudent = '';
}

async function saveStudentInfo() {
    const fullName = document.getElementById('fullNameInput').value.trim();
    const studentId = document.getElementById('studentIdInput').value.trim();
    const hijriBirthDate = document.getElementById('hijriBirthDate').value.trim();
    const name = openedStudent;

    if (!name) return;

    try {
        const { error } = await supabaseClient
            .from('students')
            .update({
                full_name: fullName || null,
                student_id: studentId || null,
                hijri_birth_date: hijriBirthDate || null
            })
            .eq('name', name);

        if (error) throw error;

        closeStudentInfoModal();
        showToast(`✅ تم حفظ بيانات ${name}`, 'success');
        await loadAllData();

    } catch (error) {
        console.error('Save info error:', error);
        showToast('خطأ في الحفظ: ' + error.message, 'error');
    }
}

// ===== نافذة الملاحظات =====
function openNotesModal() {
    if (!openedStudent) return;

    const student = allStudents.find(s => s.name === openedStudent);
    if (!student) return;

    document.getElementById('studentNotes').value = student.notes || '';

    document.getElementById('studentOptionsModal').classList.remove('active');
    document.getElementById('notesModal').classList.add('active');
}

function closeNotesModal() {
    document.getElementById('notesModal').classList.remove('active');
    openedStudent = '';
}

async function saveStudentNotes() {
    const notes = document.getElementById('studentNotes').value.trim();
    const name = openedStudent;

    if (!name) return;

    try {
        const { error } = await supabaseClient
            .from('students')
            .update({ notes: notes || null })
            .eq('name', name);

        if (error) throw error;

        closeNotesModal();
        showToast(`✅ تم حفظ الملاحظات`, 'success');
        await loadAllData();

    } catch (error) {
        console.error('Save notes error:', error);
        showToast('خطأ في الحفظ: ' + error.message, 'error');
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

// ===== تحديث حالة طالب — الأجهزة =====
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

        showToast(`${name} ${status ? 'مسموح ✓' : 'غير مسموح ✗'} (الأجهزة)`, status ? 'success' : 'error');

        await loadAllData();

    } catch (error) {
        showToast('خطأ في التحديث: ' + error.message, 'error');
    } finally {
        setTimeout(() => { isProcessing = false; }, 300);
    }
}

// ===== تحديث حالة طالب — الاستئذان =====
async function updateIstiathanStatus(name, status) {
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

        const updateData = { istiathan_permitted: status };
        if (status === true) {
            updateData.last_istiathan_at = localTime.toISOString();
        }

        const { error: updateError } = await supabaseClient
            .from('students')
            .update(updateData)
            .eq('name', name);

        if (updateError) throw updateError;

        const statusText = status ? 'Istiathan Permitted' : 'Istiathan Not Permitted';

        const { error: historyError } = await supabaseClient
            .from('history')
            .insert([{
                student_name: name,
                status: statusText,
                timestamp: timestamp,
                teacher: currentTeacher
            }]);

        if (historyError) throw historyError;

        showToast(`${name} ${status ? 'مسموح ✓' : 'غير مسموح ✗'} (الاستئذان)`, status ? 'success' : 'error');

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
        const num = index + 1;
        const safeName = s.name.replace(/'/g, "\\'");
        const hasInfo = s.full_name || s.hijri_birth_date || s.student_id;
        const hasNotes = s.notes && s.notes.trim();

        const devicesStatus = s.permitted === true;
        const istiathanStatus = s.istiathan_permitted === true;

        html += `
            <div class="student-item">
                <span class="student-number">${num}</span>

                <button class="student-name-btn" onclick="openStudentOptions('${safeName}')">
                    <i class="fas fa-user-graduate"></i>
                    <span>${s.name}</span>
                    ${hasInfo ? '<span class="mini-badge info-badge" title="فيه بيانات"><i class="fas fa-id-card"></i></span>' : ''}
                    ${hasNotes ? '<span class="mini-badge notes-badge" title="فيه ملاحظات"><i class="fas fa-sticky-note"></i></span>' : ''}
                </button>

                <div class="student-status-icons">
                    <span class="mini-status ${devicesStatus ? 'on' : 'off'}" title="إحضار الأجهزة">
                        <i class="fas fa-mobile-alt"></i>
                    </span>
                    <span class="mini-status ${istiathanStatus ? 'on' : 'off'}" title="الاستئذان">
                        <i class="fas fa-user-clock"></i>
                    </span>
                </div>
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
        const status = entry.status;
        let isPermitted = false;
        let statusText = '';
        let icon = '';

        if (status === 'Permitted') {
            isPermitted = true;
            statusText = 'مسموح (أجهزة)';
            icon = '📱';
        } else if (status === 'Not Permitted') {
            isPermitted = false;
            statusText = 'غير مسموح (أجهزة)';
            icon = '📱';
        } else if (status === 'Istiathan Permitted') {
            isPermitted = true;
            statusText = 'مسموح (استئذان)';
            icon = '🕐';
        } else if (status === 'Istiathan Not Permitted') {
            isPermitted = false;
            statusText = 'غير مسموح (استئذان)';
            icon = '🕐';
        } else {
            statusText = status;
            icon = '📋';
        }

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
        let status = entry.status;
        if (status === 'Permitted') status = 'مسموح (أجهزة)';
        else if (status === 'Not Permitted') status = 'غير مسموح (أجهزة)';
        else if (status === 'Istiathan Permitted') status = 'مسموح (استئذان)';
        else if (status === 'Istiathan Not Permitted') status = 'غير مسموح (استئذان)';

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

// ===== توليد بطاقة الباركود =====
function generateQrCardImage(studentName, qrPixelSize = 500) {
    return new Promise((resolve) => {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            document.body.appendChild(tempDiv);

            new QRCode(tempDiv, {
                text: `${window.location.origin + window.location.pathname.replace(/[^/]*$/, '')}verify.html?student=${encodeURIComponent(studentName)}`,
                width: qrPixelSize,
                height: qrPixelSize,
                colorDark: '#4c1d95',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            setTimeout(() => {
                try {
                    const qrCanvas = tempDiv.querySelector('canvas');
                    if (!qrCanvas) {
                        if (tempDiv.parentNode) document.body.removeChild(tempDiv);
                        resolve(null);
                        return;
                    }

                    const padding = Math.floor(qrPixelSize * 0.06);
                    const nameHeight = Math.floor(qrPixelSize * 0.16);
                    const finalWidth = qrPixelSize + (padding * 2);
                    const finalHeight = qrPixelSize + (padding * 2) + nameHeight;

                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = finalWidth;
                    finalCanvas.height = finalHeight;

                    const ctx = finalCanvas.getContext('2d');

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, finalWidth, finalHeight);

                    ctx.strokeStyle = '#ede4ff';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(2, 2, finalWidth - 4, finalHeight - 4);

                    ctx.drawImage(qrCanvas, padding, padding, qrPixelSize, qrPixelSize);

                    ctx.strokeStyle = '#ede4ff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(padding, qrPixelSize + padding + 4);
                    ctx.lineTo(finalWidth - padding, qrPixelSize + padding + 4);
                    ctx.stroke();

                    ctx.fillStyle = '#4c1d95';
                    ctx.font = `bold ${Math.floor(qrPixelSize * 0.1)}px 'Tajawal', 'Inter', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.direction = 'rtl';

                    const nameY = qrPixelSize + padding + (nameHeight / 2) + 8;
                    ctx.fillText(studentName, finalWidth / 2, nameY);

                    const dataUrl = finalCanvas.toDataURL('image/png');
                    if (tempDiv.parentNode) document.body.removeChild(tempDiv);
                    resolve(dataUrl);

                } catch (err) {
                    console.error('Canvas draw error:', err);
                    if (tempDiv.parentNode) document.body.removeChild(tempDiv);
                    resolve(null);
                }
            }, 250);

        } catch (err) {
            console.error('QR generation error:', err);
            resolve(null);
        }
    });
}

// ===== تحميل المحدد: PDF داخل ZIP =====
async function downloadSelectedQr() {
    if (selectedDownloadIds.size === 0) {
        showToast('اختر طالباً واحداً على الأقل', 'error');
        return;
    }

    const selected = allStudents.filter(s => selectedDownloadIds.has(s.id));

    showToast(`جاري التجهيز... (0/${selected.length})`, 'success');

    const zip = new JSZip();
    const { jsPDF } = window.jspdf;

    const pageWidth = 210;
    const pageHeight = 297;
    const cols = 3;
    const rows = 4;
    const qrPerPage = cols * rows;

    const marginX = 10;
    const marginY = 15;
    const cellWidth = (pageWidth - (marginX * 2)) / cols;
    const cellHeight = (pageHeight - (marginY * 2)) / rows;

    const cardWidth = cellWidth * 0.9;
    const cardHeight = cardWidth;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let itemIndexOnPage = 0;

    for (let i = 0; i < selected.length; i++) {
        const student = selected[i];

        try {
            if (itemIndexOnPage === 0 && i > 0) {
                pdf.addPage();
            }

            const col = itemIndexOnPage % cols;
            const row = Math.floor(itemIndexOnPage / cols);

            const cellX = marginX + (col * cellWidth);
            const cellY = marginY + (row * cellHeight);

            const cardDataUrl = await generateQrCardImage(student.name, 500);

            if (cardDataUrl) {
                const cardX = cellX + (cellWidth - cardWidth) / 2;
                const cardY = cellY + (cellHeight - cardHeight) / 2;

                pdf.addImage(cardDataUrl, 'PNG', cardX, cardY, cardWidth, cardHeight);
            }

            itemIndexOnPage++;
            if (itemIndexOnPage >= qrPerPage) {
                itemIndexOnPage = 0;
            }

            showToast(`جاري التجهيز... (${i + 1}/${selected.length})`, 'success');

        } catch (err) {
            console.error(`Error for ${student.name}:`, err);
        }
    }

    const pdfBlob = pdf.output('blob');
    zip.file('باركودات_الطلاب.pdf', pdfBlob);

    const folder = zip.folder('صور_منفصلة');
    for (const student of selected) {
        const imgDataUrl = await generateQrCardImage(student.name, 600);
        if (imgDataUrl) {
            const base64 = imgDataUrl.split(',')[1];
            folder.file(`QR_${student.name}.png`, base64, { base64: true });
        }
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipContent);
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
