// ===== تكوين Supabase =====
const SUPABASE_URL = 'https://qnxiyrfdvqskwfcmnptw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NV8m1fyVZq29VKBD6hQnsw_euvyzRsH';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== كلمة المرور =====
const DASHBOARD_PASSWORD = 'nigga1234';

// ===== المتغيرات =====
let selectedStudent = '';
let openedStudent = ''; // الطالب اللي فتحنا خياراته
let isProcessing = false;
const currentTeacher = 'محمد ماهر او عبدالله العوض';
let allStudents = [];
let allHistory = [];
let selectedDownloadIds = new Set();

// DOM refs
const studentListEl = document.getElementById('studentList');
const logsListEl = document.getElementById('logsList');
const downloadListEl = document.getElementById('downloadList');
const qrContainer = document.getElementById('qrcode-container');
const qrStudentName = document.getElementById('qrStudentName');
const qrSub = document.getElementById('qrSub');
const verifyName = document.getElementById('verifyName');
const verifyStatusBadge = document.getElementById('verifyStatusBadge');
const searchInput = document.getElementById('searchInput');
const toastContainer = document.getElementById('toastContainer');
const downloadQrBtn = document.getElementById('downloadQrBtn');

// ============================================
// ===== التنقل بين الأقسام =====
// ============================================
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

// ===== فتح/إغلاق القائمة =====
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
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    sessionStorage.removeItem('mustaathin_auth');
    sessionStorage.removeItem('currentSection');
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

    // تحديث الأزرار حسب الحالة الحالية
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
    openedStudent = '';
}

// ===== تغيير حالة الطالب من النافذة =====
async function setStudentStatus(status) {
    if (!openedStudent) return;
    const name = openedStudent;
    closeStudentOptions();
    await updateStudentStatus(name, status);
}

// ===== عرض الباركود من النافذة =====
function showQrFromModal() {
    if (!openedStudent) return;
    const name = openedStudent;
    closeStudentOptions();
    selectStudent(name);
}

// ===== حذف الطالب من النافذة =====
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

// ===== حفظ الاسم الجديد =====
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
        // تحديث في students
        const { error: updateError } = await supabaseClient
            .from('students')
            .update({ name: newName })
            .eq('name', oldName);

        if (updateError) throw updateError;

        // تحديث في history
        await supabaseClient
            .from('history')
            .update({ student_name: newName })
            .eq('student_name', oldName);

        // إذا كان الطالب المحدد هو نفسه، حدّث المتغير
        if (selectedStudent === oldName) {
            selectedStudent = newName;
            clearQrDisplay();
        }

        closeEditNameModal();
        showToast(`✅ تم تغيير الاسم إلى ${newName}`, 'success');
        await loadAllData();

    } catch (error) {
        console.error('Edit name error:', error);
        showToast('خطأ في التعديل: ' + error.message, 'error');
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
            clearQrDisplay();
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

// ===== تحميل البيانات =====
async function loadAllData() {
    const students = await fetchStudents();
    await fetchHistory();
    renderStudents(students, searchInput.value);
    renderLogs();
    renderDownloadList();
}

// ===== عرض الطلاب (الاسم فقط - بدون أزرار) =====
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
        const isSelected = selectedStudent === s.name;
        const safeName = s.name.replace(/'/g, "\\'");
        const statusClass = status ? 'permitted' : 'not-permitted';
        const statusText = status ? 'مسموح' : 'غير مسموح';

        html += `
            <div class="student-item ${isSelected ? 'selected' : ''}">
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

// ===== اختيار طالب (لعرض الباركود) =====
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

// ===== مسح عرض QR =====
function clearQrDisplay() {
    selectedStudent = '';
    qrContainer.innerHTML = `
        <div class="qr-empty">
            <i class="fas fa-hand-pointer"></i>
            <p>اضغط على اسم الطالب</p>
        </div>
    `;
    qrStudentName.textContent = 'لم يتم اخت
