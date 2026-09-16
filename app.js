// ===== تكوين Supabase =====
const SUPABASE_URL = 'https://qnxiyrfdvqskwfcmnptw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NV8m1fyVZq29VKBD6hQnsw_euvyzRsH';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== كلمة المرور =====
const DASHBOARD_PASSWORD = 'nigga1234';

// ===== المتغيرات العامة =====
let selectedStudent = '';
let isProcessing = false;
const currentTeacher = 'محمد ماهر او عبدالله العوض';
let allStudents = [];
let allHistory = [];
let logsFilter = 'all';

// DOM refs
const studentListEl = document.getElementById('studentList');
const logsListEl = document.getElementById('logsList');
const qrContainer = document.getElementById('qrcode-container');
const qrStudentName = document.getElementById('qrStudentName');
const verifyName = document.getElementById('verifyName');
const verifyStatusBadge = document.getElementById('verifyStatusBadge');
const searchInput = document.getElementById('searchInput');
const toastContainer = document.getElementById('toastContainer');

// ===== التبويبات =====
function switchTab(tabName) {
    // الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    // المحتوى
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tabName);
    });

    // تحميل السجلات عند فتح التبويب
    if (tabName === 'logs') {
        renderLogs();
    }
}

// ===== التحقق من كلمة المرور =====
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
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    sessionStorage.removeItem('mustaathin_auth');
    location.reload();
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

// ===== إضافة طالب جديد =====
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
        selectStudent(name);
    } catch (error) {
        console.error('Add student error:', error);
        showToast('خطأ في الإضافة: ' + error.message, 'error');
    }
}

// ===== حذف طالب =====
async function deleteStudent(name) {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟\n\nسيتم حذف الطالب وسجله نهائياً.`)) return;

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

        if (selectedStudent === name) {
            selectedStudent = '';
            qrContainer.innerHTML = '';
            qrStudentName.textContent = 'اختر طالباً';
            verifyName.textContent = 'اختر طالباً';
            verifyStatusBadge.className = 'verify-status';
            verifyStatusBadge.innerHTML = '—';
        }

        await loadAllData();

    } catch (error) {
        console.error('Delete error:', error);
        showToast('خطأ في الحذف: ' + error.message, 'error');
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

// ===== جلب حالة طالب =====
async function fetchStudentStatus(name) {
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .select('name, permitted, last_permitted_at')
            .eq('name', name)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        return null;
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

        if (selectedStudent === name) {
            const studentData = await fetchStudentStatus(name);
            if (studentData) {
                updateQrAndVerification(name, studentData.permitted, studentData.last_permitted_at);
            }
        }

    } catch (error) {
        showToast('خطأ في التحديث: ' + error.message, 'error');
    } finally {
        setTimeout(() => { isProcessing = false; }, 300);
    }
}

// ===== تحميل جميع البيانات =====
async function loadAllData() {
    const students = await fetchStudents();
    await fetchHistory();
    renderStudents(students, searchInput.value);
    renderLogs();
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
    filtered.forEach(s => {
        const status = s.permitted === true;

        html += `
            <div class="student-item" data-student="${s.name}">
                <span class="student-name"><i class="fas fa-user-graduate"></i> ${s.name}</span>

                <div class="status-cell">
                    <span class="status-text ${status ? 'on' : 'off'}">
                        ${status ? 'مسموح' : 'غير مسموح'}
                    </span>
                    <button class="ios-toggle ${status ? 'on' : ''}" 
                            data-action="toggle" 
                            data-student="${s.name}"
                            data-status="${status}"
                            aria-label="Toggle status">
                        <span class="ios-toggle-thumb"></span>
                    </button>
                </div>

                <div class="actions">
                    <button class="btn btn-qr btn-sm" data-action="viewqr" data-student="${s.name}">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    <button class="btn btn-delete btn-sm" data-action="delete" data-student="${s.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    studentListEl.innerHTML = html;

    // ربط أزرار QR والحذف
    document.querySelectorAll('.student-item .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isProcessing) return;
            const action = this.dataset.action;
            const student = this.dataset.student;
            if (!student) return;

            if (action === 'viewqr') selectStudent(student);
            else if (action === 'delete') deleteStudent(student);
        });
    });

    // ربط السويتش
    document.querySelectorAll('.ios-toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isProcessing) return;
            const student = this.dataset.student;
            const currentStatus = this.dataset.status === 'true';
            updateStudentStatus(student, !currentStatus);
        });
    });

    // تمييز الطالب المحدد
    document.querySelectorAll('.student-item').forEach(el => {
        el.style.background = (el.dataset.student === selectedStudent) ? '#f3ecff' : '';
    });
}

// ===== عرض السجلات =====
function renderLogs() {
    if (!allHistory || allHistory.length === 0) {
        logsListEl.innerHTML = `<div class="empty-history"><i class="fas fa-info-circle"></i> لا توجد عمليات بعد</div>`;
        return;
    }

    // فلترة
    let filtered = allHistory;
    if (logsFilter === 'permitted') {
        filtered = allHistory.filter(h => h.status === 'Permitted');
    } else if (logsFilter === 'not-permitted') {
        filtered = allHistory.filter(h => h.status === 'Not Permitted');
    }

    if (filtered.length === 0) {
        logsListEl.innerHTML = `<div class="empty-history"><i class="fas fa-filter"></i> لا توجد نتائج لهذا الفلتر</div>`;
        return;
    }

    let html = '';
    filtered.forEach(entry => {
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
                            <i class="fas fa-user-graduate"></i>
                            ${entry.student_name}
                        </div>
                        <div class="log-teacher">
                            <i class="fas fa-chalkboard-teacher"></i>
                            ${entry.teacher}
                        </div>
                    </div>
                </div>
                <div class="log-item-left">
                    <span class="status-badge ${statusClass}">${icon} ${statusText}</span>
                    <span class="log-time-big">
                        <i class="fas fa-clock"></i>
                        ${entry.timestamp}
                    </span>
                </div>
            </div>
        `;
    });
    logsListEl.innerHTML = html;
}

// ===== فلترة السجلات =====
function filterLogs(type) {
    logsFilter = type;

    // تحديث حالة الأزرار
    document.getElementById('filterAll').classList.toggle('active', type === 'all');
    document.getElementById('filterPermitted').classList.toggle('active', type === 'permitted');
    document.getElementById('filterNotPermitted').classList.toggle('active', type === 'not-permitted');

    renderLogs();
}

// ===== تحميل السجل كـ CSV =====
function downloadLogs() {
    if (!allHistory || allHistory.length === 0) {
        showToast('لا توجد سجلات للتحميل', 'error');
        return;
    }

    // BOM للعربي
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

// ===== اختيار طالب =====
function selectStudent(student) {
    if (isProcessing) return;
    selectedStudent = student;
    const studentData = allStudents.find(s => s.name === student);
    if (studentData) {
        updateQrAndVerification(student, studentData.permitted, studentData.last_permitted_at);
    } else {
        fetchStudentStatus(student).then(data => {
            if (data) updateQrAndVerification(student, data.permitted, data.last_permitted_at);
        });
    }
    renderStudents(allStudents, searchInput.value);
}

// ===== حساب المدة =====
function getTimeSince(lastPermittedAt) {
    if (!lastPermittedAt) return null;

    const now = new Date();
    const localNow = new Date(now.getTime() + (3 * 3600000));
    const then = new Date(lastPermittedAt);
    const localThen = new Date(then.getTime() + (3 * 3600000));

    const diffMs = localNow - localThen;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} يوم ${diffHours % 24} ساعة`;
    if (diffHours > 0) return `${diffHours} ساعة ${diffMin % 60} دقيقة`;
    if (diffMin > 0) return `${diffMin} دقيقة ${diffSec % 60} ثانية`;
    return `${diffSec} ثانية`;
}

// ===== تحديث QR =====
function updateQrAndVerification(student, status, lastPermittedAt) {
    qrStudentName.textContent = student;
    verifyName.textContent = student;

    qrContainer.innerHTML = '';
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const qrData = `${baseUrl}verify.html?student=${encodeURIComponent(student)}`;

    new QRCode(qrContainer, {
        text: qrData,
        width: 140,
        height: 140,
        colorDark: '#4c1d95',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    if (status) {
        verifyStatusBadge.className = 'verify-status permitted';
        const timeSince = getTimeSince(lastPermittedAt);
        verifyStatusBadge.innerHTML = `🟢 مسموح · ${timeSince || 'الآن'}`;
    } else {
        verifyStatusBadge.className = 'verify-status not-permitted';
        verifyStatusBadge.innerHTML = '🔴 غير مسموح';
    }
}

// ===== تحميل باركود طالب واحد =====
function downloadQr() {
    if (!selectedStudent) {
        showToast('اختر طالباً أولاً', 'error');
        return;
    }

    const canvas = qrContainer.querySelector('canvas');
    const img = qrContainer.querySelector('img');

    if (!canvas && !img) {
        showToast('لا يوجد باركود للتحميل', 'error');
        return;
    }

    const link = document.createElement('a');
    link.download = `QR_${selectedStudent}.png`;

    if (canvas) {
        link.href = canvas.toDataURL('image/png');
    } else {
        link.href = img.src;
    }

    link.click();
    showToast(`✅ تم تحميل باركود ${selectedStudent}`, 'success');
}

// ===== تحميل كل الباركودات =====
async function downloadAllQr() {
    if (allStudents.length === 0) {
        showToast('لا يوجد طلاب', 'error');
        return;
    }

    showToast('جاري تجهيز الملف...', 'success');

    const zip = new JSZip();
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

    for (const student of allStudents) {
        const tempDiv = document.createElement('div');
        new QRCode(tempDiv, {
            text: `${baseUrl}verify.html?student=${encodeURIComponent(student.name)}`,
            width: 300,
            height: 300,
            colorDark: '#4c1d95',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        await new Promise(r => setTimeout(r, 100));

        const canvas = tempDiv.querySelector('canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            zip.file(`QR_${student.name}.png`, base64, { base64: true });
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `باركودات_الطلاب.zip`;
    link.click();

    showToast('✅ تم تحميل كل الباركودات', 'success');
}

// ===== فلترة الطلاب =====
window.filterStudents = function() {
    renderStudents(allStudents, searchInput.value);
};

// ===== الإشتراك في التغييرات =====
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
                if (selectedStudent === updatedStudent.name) {
                    updateQrAndVerification(updatedStudent.name, updatedStudent.permitted, updatedStudent.last_permitted_at);
                }
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
    console.log('🚀 ثانوية هوزان - جاري التحميل...');
    await loadAllData();

    if (allStudents.length > 0) {
        selectStudent(allStudents[0].name);
    } else {
        qrContainer.innerHTML = '';
        qrStudentName.textContent = 'اختر طالباً';
        verifyName.textContent = 'اختر طالباً';
        verifyStatusBadge.className = 'verify-status';
        verifyStatusBadge.innerHTML = '—';
    }

    subscribeToChanges();
    console.log('✅ جاهز. عدد الطلاب:', allStudents.length);
}

// ===== بدء التطبيق =====
if (sessionStorage.getItem('mustaathin_auth') === 'true') {
    document.getElementById('loginOverlay').style.display = 'none';
    init();
}
