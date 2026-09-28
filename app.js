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

// المتغيرات الخاصة بالسلوك
let currentBehaviorType = 'positive';
let currentPenaltyDuration = null;
let currentStudentBehaviors = [];
let currentStudentPenalties = [];

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

// ===== التنقل =====
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

// ===== سماح/غير سماح للكل =====
function setAllDevicesStatus(status) {
    if (isProcessing) return;

    if (allStudents.length === 0) {
        showToast('لا يوجد طلاب', 'error');
        return;
    }

    const statusText = status ? 'سماح' : 'غير سماح';
    const actionText = status ? 'السماح' : 'منع';

    showConfirm(
        `هل أنت متأكد من ${actionText} إحضار الأجهزة لجميع الطلاب (${allStudents.length} طالب)؟`,
        `تأكيد ${statusText} للكل`,
        async () => {
            await updateAllDevicesStatus(status);
        }
    );
}

async function updateAllDevicesStatus(status) {
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
                await supabaseClient
                    .from('history')
                    .insert([{
                        student_name: student.name,
                        status: statusText,
                        timestamp: timestamp,
                        teacher: currentTeacher
                    }]);

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
        console.error('Set all devices status error:', error);
        showToast('خطأ: ' + error.message, 'error');
    } finally {
        isProcessing = false;
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

// ===== سويتش الأجهزة =====
async function onDevicesToggleChange(checked) {
    if (!openedStudent) return;

    const statusText = document.getElementById('devicesStatusText');
    statusText.textContent = checked ? 'مسموح' : 'غير مسموح';
    statusText.className = checked ? 'toggle-status-text on' : 'toggle-status-text off';

    await updateStudentStatus(openedStudent, checked);
}

// ===== عرض الباركود =====
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
        statusEl.innerHTML = '🟢 مسموح بالأجهزة';
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

// ===== تعديل الاسم =====
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
        await supabaseClient
            .from('students')
            .update({ name: newName })
            .eq('name', oldName);

        await supabaseClient
            .from('history')
            .update({ student_name: newName })
            .eq('student_name', oldName);

        await supabaseClient
            .from('behaviors')
            .update({ student_name: newName })
            .eq('student_name', oldName);

        await supabaseClient
            .from('penalties')
            .update({ student_name: newName })
            .eq('student_name', oldName);

        closeEditNameModal();
        showToast(`✅ تم تغيير الاسم إلى ${newName}`, 'success');
        await loadAllData();

    } catch (error) {
        showToast('خطأ في التعديل: ' + error.message, 'error');
    }
}

// ===== بيانات الطالب =====
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
        await supabaseClient
            .from('students')
            .update({
                full_name: fullName || null,
                student_id: studentId || null,
                hijri_birth_date: hijriBirthDate || null
            })
            .eq('name', name);

        closeStudentInfoModal();
        showToast(`✅ تم حفظ بيانات ${name}`, 'success');
        await loadAllData();

    } catch (error) {
        showToast('خطأ في الحفظ: ' + error.message, 'error');
    }
}

// ===== الملاحظات =====
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
        await supabaseClient
            .from('students')
            .update({ notes: notes || null })
            .eq('name', name);

        closeNotesModal();
        showToast(`✅ تم حفظ الملاحظات`, 'success');
        await loadAllData();

    } catch (error) {
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
                await supabaseClient.from('students').delete().eq('name', name);
                await supabaseClient.from('history').delete().eq('student_name', name);
                await supabaseClient.from('behaviors').delete().eq('student_name', name);
                await supabaseClient.from('penalties').delete().eq('student_name', name);

                showToast(`🗑️ تم حذف ${name}`, 'error');
                await loadAllData();

            } catch (error) {
                showToast('خطأ في الحذف: ' + error.message, 'error');
            }
        }
    );
}

// ============================================
// ===== نظام المشاركات والمخالفات والعقوبات =====
// ============================================

async function openBehaviorsModal() {
    if (!openedStudent) return;

    document.getElementById('behaviorsStudentName').textContent = openedStudent;

    currentBehaviorType = 'positive';
    currentPenaltyDuration = null;

    document.getElementById('behaviorCategory').value = '';
    document.getElementById('behaviorDetails').value = '';
    document.getElementById('penaltyReason').value = '';

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === 'positive');
    });

    document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));

    switchBehaviorTab('add');

    document.getElementById('studentOptionsModal').classList.remove('active');
    document.getElementById('behaviorsModal').classList.add('active');

    await loadStudentBehaviors();
}

function closeBehaviorsModal() {
    document.getElementById('behaviorsModal').classList.remove('active');
    openedStudent = '';
    currentBehaviorType = 'positive';
    currentPenaltyDuration = null;
}

function switchBehaviorTab(tab) {
    document.querySelectorAll('.behavior-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.behavior-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tab === 'add') document.getElementById('behaviorTabAdd').classList.add('active');
    if (tab === 'log') document.getElementById('behaviorTabLog').classList.add('active');
    if (tab === 'penalty') document.getElementById('behaviorTabPenalty').classList.add('active');
}

function selectBehaviorType(type) {
    currentBehaviorType = type;
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
}

async function saveBehavior() {
    const category = document.getElementById('behaviorCategory').value.trim();
    const details = document.getElementById('behaviorDetails').value.trim();

    if (!details) {
        showToast('الرجاء إدخال التفاصيل', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('behaviors')
            .insert([{
                student_name: openedStudent,
                type: currentBehaviorType,
                category: category || null,
                details: details,
                teacher: currentTeacher
            }]);

        if (error) throw error;

        showToast(`✅ تم حفظ ${currentBehaviorType === 'positive' ? 'المشاركة' : 'المخالفة'}`, 'success');

        document.getElementById('behaviorCategory').value = '';
        document.getElementById('behaviorDetails').value = '';

        await loadStudentBehaviors();
        switchBehaviorTab('log');

    } catch (error) {
        showToast('خطأ في الحفظ: ' + error.message, 'error');
    }
}

function selectPenaltyDuration(duration) {
    currentPenaltyDuration = duration;
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.duration === duration);
    });
}

function savePenalty() {
    if (!currentPenaltyDuration) {
        showToast('الرجاء اختيار مدة العقوبة', 'error');
        return;
    }

    const reason = document.getElementById('penaltyReason').value.trim();

    if (!reason) {
        showToast('الرجاء إدخال سبب العقوبة', 'error');
        return;
    }

    showConfirm(
        `سيتم فرض عقوبة على "${openedStudent}" لمدة ${getDurationText(currentPenaltyDuration)}، وسيتم منع إحضار الجهاز تلقائياً. هل أنت متأكد؟`,
        'تأكيد فرض العقوبة',
        async () => {
            await applyPenalty(reason, currentPenaltyDuration);
        }
    );
}

async function applyPenalty(reason, durationType) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const now = new Date();
        const localTime = new Date(now.getTime() + (3 * 3600000));

        let durationMs = 0;
        if (durationType === '2days') durationMs = 2 * 24 * 60 * 60 * 1000;
        else if (durationType === 'week') durationMs = 7 * 24 * 60 * 60 * 1000;
        else if (durationType === 'month') durationMs = 30 * 24 * 60 * 60 * 1000;
        else if (durationType === '4months') durationMs = 120 * 24 * 60 * 60 * 1000;

        const endsAt = new Date(localTime.getTime() + durationMs);

        // إلغاء أي عقوبة سابقة
        await supabaseClient
            .from('penalties')
            .update({
                status: 'cancelled',
                cancelled_at: localTime.toISOString()
            })
            .eq('student_name', openedStudent)
            .eq('status', 'active');

        // إضافة عقوبة جديدة
        const { error: penaltyError } = await supabaseClient
            .from('penalties')
            .insert([{
                student_name: openedStudent,
                reason: reason,
                duration_type: durationType,
                started_at: localTime.toISOString(),
                ends_at: endsAt.toISOString(),
                status: 'active',
                teacher: currentTeacher
            }]);

        if (penaltyError) throw penaltyError;

        // منع إحضار الجهاز
        await supabaseClient
            .from('students')
            .update({
                permitted: false,
                last_permitted_at: localTime.toISOString()
            })
            .eq('name', openedStudent);

        // سجل
        const timestamp = localTime.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });

        await supabaseClient
            .from('history')
            .insert([{
                student_name: openedStudent,
                status: 'Penalty Applied',
                timestamp: timestamp,
                teacher: currentTeacher
            }]);

        showToast(`⚖️ تم فرض العقوبة لمدة ${getDurationText(durationType)}`, 'success');

        await loadStudentBehaviors();
        await loadAllData();
        switchBehaviorTab('penalty');

    } catch (error) {
        showToast('خطأ: ' + error.message, 'error');
    } finally {
        isProcessing = false;
    }
}

function cancelPenalty(penaltyId) {
    showConfirm(
        'هل تريد فك العقوبة وإعادة السماح بإحضار الجهاز؟',
        'تأكيد فك العقوبة',
        async () => {
            try {
                const now = new Date();
                const localTime = new Date(now.getTime() + (3 * 3600000));

                await supabaseClient
                    .from('penalties')
                    .update({
                        status: 'cancelled',
                        cancelled_at: localTime.toISOString()
                    })
                    .eq('id', penaltyId);

                await supabaseClient
                    .from('students')
                    .update({
                        permitted: true,
                        last_permitted_at: localTime.toISOString()
                    })
                    .eq('name', openedStudent);

                const timestamp = localTime.toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: false
                });

                await supabaseClient
                    .from('history')
                    .insert([{
                        student_name: openedStudent,
                        status: 'Penalty Cancelled',
                        timestamp: timestamp,
                        teacher: currentTeacher
                    }]);

                showToast('✅ تم فك العقوبة', 'success');

                await loadStudentBehaviors();
                await loadAllData();

            } catch (error) {
                showToast('خطأ: ' + error.message, 'error');
            }
        }
    );
}

function getDurationText(durationType) {
    if (durationType === '2days') return 'يومين';
    if (durationType === 'week') return 'أسبوع';
    if (durationType === 'month') return 'شهر';
    if (durationType === '4months') return '4 أشهر';
    return '';
}

async function loadStudentBehaviors() {
    if (!openedStudent) return;

    try {
        const { data: behaviors } = await supabaseClient
            .from('behaviors')
            .select('*')
            .eq('student_name', openedStudent)
            .order('created_at', { ascending: false });

        currentStudentBehaviors = behaviors || [];

        const { data: penalties } = await supabaseClient
            .from('penalties')
            .select('*')
            .eq('student_name', openedStudent)
            .order('started_at', { ascending: false });

        currentStudentPenalties = penalties || [];

        await checkAndExpirePenalties();

        renderBehaviorsLog();
        renderBehaviorStats();
        renderCurrentPenalty();

    } catch (error) {
        console.error('Load behaviors error:', error);
    }
}

async function checkAndExpirePenalties() {
    const now = new Date();
    const localNow = new Date(now.getTime() + (3 * 3600000));

    const activePenalties = currentStudentPenalties.filter(p => p.status === 'active');

    for (const penalty of activePenalties) {
        const endsAt = new Date(penalty.ends_at);

        if (endsAt <= localNow) {
            try {
                await supabaseClient
                    .from('penalties')
                    .update({ status: 'expired' })
                    .eq('id', penalty.id);

                await supabaseClient
                    .from('students')
                    .update({
                        permitted: true,
                        last_permitted_at: localNow.toISOString()
                    })
                    .eq('name', openedStudent);

                const timestamp = localNow.toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: false
                });

                await supabaseClient
                    .from('history')
                    .insert([{
                        student_name: openedStudent,
                        status: 'Penalty Expired',
                        timestamp: timestamp,
                        teacher: 'النظام (تلقائي)'
                    }]);

                penalty.status = 'expired';

            } catch (e) {
                console.error('Auto expire error:', e);
            }
        }
    }

    const { data: refreshed } = await supabaseClient
        .from('penalties')
        .select('*')
        .eq('student_name', openedStudent)
        .order('started_at', { ascending: false });

    currentStudentPenalties = refreshed || [];
}

function escapeHtmlBehavior(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}

// ===== عرض السجل — مع زر الحذف =====
function renderBehaviorsLog() {
    const list = document.getElementById('behaviorLogList');

    if (!currentStudentBehaviors || currentStudentBehaviors.length === 0) {
        list.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-info-circle"></i>
                لا يوجد سجل بعد
            </div>
        `;
        return;
    }

    let html = '';
    currentStudentBehaviors.forEach(item => {
        const isPositive = item.type === 'positive';
        const icon = isPositive ? '⭐' : '⚠️';
        const label = isPositive ? 'مشاركة' : 'مخالفة';
        const cls = isPositive ? 'positive' : 'negative';

        const dateStr = new Date(item.created_at).toLocaleString('ar-SA', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        html += `
            <div class="behavior-log-item ${cls}">
                <div class="behavior-log-icon">
                    <i class="fas ${isPositive ? 'fa-star' : 'fa-exclamation-triangle'}"></i>
                </div>
                <div class="behavior-log-content">
                    <div class="behavior-log-header">
                        <span class="behavior-log-type">${icon} ${label}</span>
                        <div class="behavior-log-header-actions">
                            <span class="behavior-log-date">${dateStr}</span>
                            <button class="behavior-delete-btn" onclick="deleteBehavior(${item.id})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${item.category ? `<div class="behavior-log-category"><i class="fas fa-tag"></i> ${escapeHtmlBehavior(item.category)}</div>` : ''}
                    <div class="behavior-log-details">${escapeHtmlBehavior(item.details)}</div>
                    <div class="behavior-log-teacher">
                        <i class="fas fa-chalkboard-teacher"></i> ${escapeHtmlBehavior(item.teacher || '')}
                    </div>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
}

// ===== حذف سلوك (مشاركة/مخالفة) =====
function deleteBehavior(behaviorId) {
    showConfirm(
        'هل أنت متأكد من حذف هذه المشاركة/المخالفة نهائياً؟',
        'تأكيد الحذف',
        async () => {
            try {
                const { error } = await supabaseClient
                    .from('behaviors')
                    .delete()
                    .eq('id', behaviorId);

                if (error) throw error;

                showToast('🗑️ تم حذف السجل', 'success');

                await loadStudentBehaviors();
                switchBehaviorTab('log');

            } catch (error) {
                console.error('Delete behavior error:', error);
                showToast('خطأ في الحذف: ' + error.message, 'error');
            }
        }
    );
}

function renderBehaviorStats() {
    const statsBox = document.getElementById('behaviorStats');
    if (!statsBox) return;

    const positiveCount = currentStudentBehaviors.filter(b => b.type === 'positive').length;
    const negativeCount = currentStudentBehaviors.filter(b => b.type === 'negative').length;

    statsBox.innerHTML = `
        <div class="behavior-stat-box positive">
            <div class="behavior-stat-value">${positiveCount}</div>
            <div class="behavior-stat-label">⭐ مشاركات</div>
        </div>
        <div class="behavior-stat-box negative">
            <div class="behavior-stat-value">${negativeCount}</div>
            <div class="behavior-stat-label">⚠️ مخالفات</div>
        </div>
    `;
}

function renderCurrentPenalty() {
    const box = document.getElementById('currentPenaltyBox');

    const activePenalty = currentStudentPenalties.find(p => p.status === 'active');

    if (!activePenalty) {
        box.innerHTML = `
            <div class="no-penalty-box">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>لا توجد عقوبة سارية</strong>
                    <span>الطالب غير معاقب حالياً</span>
                </div>
            </div>
        `;
        return;
    }

    const endsAt = new Date(activePenalty.ends_at);
    const now = new Date();
    const localNow = new Date(now.getTime() + (3 * 3600000));
    const remainingMs = endsAt.getTime() - localNow.getTime();

    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    let remainingText = '';
    if (days > 0) remainingText = `${days} يوم و ${hours} ساعة`;
    else if (hours > 0) remainingText = `${hours} ساعة و ${minutes} دقيقة`;
    else remainingText = `${minutes} دقيقة`;

    const endDate = endsAt.toLocaleString('ar-SA', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    box.innerHTML = `
        <div class="active-penalty-box">
            <div class="penalty-header">
                <i class="fas fa-gavel"></i>
                <div>
                    <strong>عقوبة سارية</strong>
                    <span>مدة: ${getDurationText(activePenalty.duration_type)}</span>
                </div>
            </div>
            <div class="penalty-info">
                <div class="penalty-row">
                    <span class="penalty-label"><i class="fas fa-info-circle"></i> السبب</span>
                    <span class="penalty-value">${escapeHtmlBehavior(activePenalty.reason)}</span>
                </div>
                <div class="penalty-row">
                    <span class="penalty-label"><i class="fas fa-hourglass-half"></i> المتبقي</span>
                    <span class="penalty-value highlight">${remainingText}</span>
                </div>
                <div class="penalty-row">
                    <span class="penalty-label"><i class="fas fa-calendar-times"></i> ينتهي في</span>
                    <span class="penalty-value">${endDate}</span>
                </div>
            </div>
            <button class="cancel-penalty-btn" onclick="cancelPenalty(${activePenalty.id})">
                <i class="fas fa-unlock"></i> فك العقوبة يدوياً
            </button>
        </div>
    `;
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

        await supabaseClient
            .from('students')
            .update(updateData)
            .eq('name', name);

        const statusText = status ? 'Permitted' : 'Not Permitted';

        await supabaseClient
            .from('history')
            .insert([{
                student_name: name,
                status: statusText,
                timestamp: timestamp,
                teacher: currentTeacher
            }]);

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
        const num = index + 1;
        const safeName = s.name.replace(/'/g, "\\'");
        const hasInfo = s.full_name || s.hijri_birth_date || s.student_id;
        const hasNotes = s.notes && s.notes.trim();
        const devicesStatus = s.permitted === true;

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
            statusText = 'مسموح';
            icon = '📱';
        } else if (status === 'Not Permitted') {
            isPermitted = false;
            statusText = 'غير مسموح';
            icon = '📱';
        } else if (status === 'Penalty Applied') {
            isPermitted = false;
            statusText = 'فرض عقوبة';
            icon = '⚖️';
        } else if (status === 'Penalty Cancelled') {
            isPermitted = true;
            statusText = 'فك عقوبة';
            icon = '🔓';
        } else if (status === 'Penalty Expired') {
            isPermitted = true;
            statusText = 'انتهت العقوبة';
            icon = '⏰';
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
        const student = entry.student_name.replace(/,/g, ' ');
        const teacher = entry.teacher.replace(/,/g, ' ');
        csv += `${student},${entry.status},${entry.timestamp},${teacher}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجل_العمليات_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    showToast('✅ تم تحميل السجل', 'success');
}

// ===== قائمة التحميل =====
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
                    if (tempDiv.parentNode) document.body.removeChild(tempDiv);
                    resolve(null);
                }
            }, 250);

        } catch (err) {
            resolve(null);
        }
    });
}

// ===== تحميل PDF داخل ZIP =====
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
