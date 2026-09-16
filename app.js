// ===== رقم الإصدار الحالي =====
const APP_VERSION = 'v1.1.0';

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
let liveTimerInterval = null;
let editCurrentStatus = false;

// DOM refs
const studentListEl = document.getElementById('studentList');
const qrContainer = document.getElementById('qrcode-container');
const qrStudentName = document.getElementById('qrStudentName');
const verifyName = document.getElementById('verifyName');
const verifyStatusBadge = document.getElementById('verifyStatusBadge');
const searchInput = document.getElementById('searchInput');
const toastContainer = document.getElementById('toastContainer');
const modalHistoryContainer = document.getElementById('modalHistoryContainer');

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

// ===== نافذة سجل العمليات =====
window.openHistoryModal = function() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.add('active');
        loadHistory();
    }
};

window.closeHistoryModal = function() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// ============================================
// ===== نافذة تعديل بيانات وحالة الطالب =====
// ============================================

window.openEditStudentModal = function(studentName) {
    const student = allStudents.find(s => s.name === studentName);
    if (!student) return;

    selectStudent(studentName);

    document.getElementById('editOriginalName').value = student.name;
    document.getElementById('editStudentName').value = student.name;
    editCurrentStatus = student.permitted === true;

    updateEditModalStatusUI();
    document.getElementById('editStudentModal').classList.add('active');
};

window.closeEditModal = function() {
    document.getElementById('editStudentModal').classList.remove('active');
};

function updateEditModalStatusUI() {
    const toggleBtn = document.getElementById('editStatusToggle');
    const statusLabel = document.getElementById('editStatusLabel');
    if (!toggleBtn || !statusLabel) return;

    if (editCurrentStatus) {
        toggleBtn.classList.add('on');
        statusLabel.textContent = 'مسموح';
        statusLabel.className = 'status-text on';
    } else {
        toggleBtn.classList.remove('on');
        statusLabel.textContent = 'غير مسموح';
        statusLabel.className = 'status-text off';
    }
}

document.getElementById('editStatusToggle').addEventListener('click', () => {
    editCurrentStatus = !editCurrentStatus;
    updateEditModalStatusUI();
});

// حفظ تعديل الطالب (الاسم وحالة السماح)
window.saveStudentEdit = async function() {
    if (isProcessing) return;

    const originalName = document.getElementById('editOriginalName').value.trim();
    const newName = document.getElementById('editStudentName').value.trim();

    if (!newName) {
        showToast('يرجى إدخال اسم الطالب', 'error');
        return;
    }

    if (newName.toLowerCase() !== originalName.toLowerCase()) {
        if (allStudents.some(s => s.name.toLowerCase() === newName.toLowerCase())) {
            showToast('اسم الطالب الجديد موجود بالفعل لطالب آخر', 'error');
            return;
        }
    }

    isProcessing = true;
    try {
        const student = allStudents.find(s => s.name === originalName);
        const hasStatusChanged = student ? (student.permitted !== editCurrentStatus) : false;
        const now = new Date();

        const updatePayload = {
            name: newName,
            permitted: editCurrentStatus
        };

        if (editCurrentStatus && (!student || !student.permitted)) {
            updatePayload.last_permitted_at = now.toISOString();
        }

        const { error: updateError } = await supabaseClient
            .from('students')
            .update(updatePayload)
            .eq('name', originalName);

        if (updateError) throw updateError;

        // إذا تغير الاسم، نحدث سجل العمليات الخاص بالطالب
        if (originalName !== newName) {
            await supabaseClient
                .from('history')
                .update({ student_name: newName })
                .eq('student_name', originalName);
        }

        // إذا تغيرت الحالة، نسجل عملية جديدة في السجل
        if (hasStatusChanged) {
            const displayTimestamp = now.toLocaleString('ar-SA', {
                timeZone: 'Asia/Riyadh',
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true
            });

            await supabaseClient
                .from('history')
                .insert([{
                    student_name: newName,
                    status: editCurrentStatus ? 'Permitted' : 'Not Permitted',
                    timestamp: displayTimestamp,
                    teacher: currentTeacher
                }]);
        }

        closeEditModal();
        showToast(`✅ تم تحديث بيانات ${newName}`, 'success');

        await loadAllData();
        selectStudent(newName);

    } catch (err) {
        console.error(err);
        showToast('خطأ أثناء حفظ التعديل: ' + err.message, 'error');
    } finally {
        setTimeout(() => { isProcessing = false; }, 300);
    }
};

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
    if (!confirm(`هل أنت متأكد من حذف الطالب "${name}" نهائياً؟\n\nسيتم حذف الطالب وسجله بالكامل.`)) return;

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
            if (liveTimerInterval) clearInterval(liveTimerInterval);
        }

        await loadAllData();
        loadHistory();

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

// ===== جلب السجل داخل المودال =====
async function loadHistory() {
    const container = document.getElementById('modalHistoryContainer');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient
            .from('history')
            .select('*')
            .order('id', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="empty-history"><i class="fas fa-info-circle"></i> لا توجد عمليات مسجلة بعد</div>`;
            return;
        }

        let html = '';
        data.forEach(entry => {
            const isPermitted = entry.status === 'Permitted';
            const statusBadgeClass = isPermitted ? 'permitted' : 'not-permitted';
            const statusText = isPermitted ? 'مسموح' : 'غير مسموح';
            const statusIcon = isPermitted ? '🟢' : '🔴';

            html += `
                <div class="log-entry-popup">
                    <div class="st-info">
                        <i class="fas fa-user-graduate" style="color:#7c3aed;"></i>
                        <span>${entry.student_name}</span>
                        <span class="status-badge ${statusBadgeClass}">${statusIcon} ${statusText}</span>
                    </div>
                    <div class="meta-info">
                        <span><i class="fas fa-clock"></i> ${entry.timestamp}</span>
                        <span class="teacher-tag">${entry.teacher}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div class="loading-message" style="color:#b13e3e;">تعذر جلب السجل</div>`;
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

// ===== تحميل البيانات =====
async function loadAllData() {
    const students = await fetchStudents();
    renderStudents(searchInput.value ? allStudents.filter(s => s.name.toLowerCase().includes(searchInput.value.toLowerCase())) : students);
}

// ===== عرض قائمة الطلاب مع الضغط على الاسم للتعديل وزر الحذف الموسع =====
function renderStudents(students) {
    if (!students || students.length === 0) {
        studentListEl.innerHTML = `<div class="loading-message">لا يوجد طلاب.</div>`;
        return;
    }

    let html = '';
    students.forEach(s => {
        const status = s.permitted === true;
        const pillText = status ? 'مسموح' : 'غير مسموح';
        const pillClass = status ? 'permitted' : 'not-permitted';

        html += `
            <div class="student-item" data-student="${s.name}">
                <div class="student-name-clickable" data-student="${s.name}" title="اضغط لتعديل بيانات وحالة الطالب">
                    <i class="fas fa-user-graduate"></i>
                    <span>${s.name}</span>
                    <span class="student-pill ${pillClass}">${pillText}</span>
                    <i class="fas fa-pen-to-square edit-indicator"></i>
                </div>

                <div class="actions">
                    <button class="btn btn-delete-wide" data-action="delete" data-student="${s.name}" title="حذف الطالب">
                        <i class="fas fa-trash"></i> <span>حذف</span>
                    </button>
                </div>
            </div>
        `;
    });
    studentListEl.innerHTML = html;

    // ربط الضغط على اسم الطالب لفتح التعديل والمعاينة
    document.querySelectorAll('.student-name-clickable').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const student = this.dataset.student;
            if (student) window.openEditStudentModal(student);
        });
    });

    // ربط زر الحذف الموسع
    document.querySelectorAll('.btn-delete-wide').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isProcessing) return;
            const student = this.dataset.student;
            if (student) deleteStudent(student);
        });
    });

    document.querySelectorAll('.student-item').forEach(el => {
        el.style.background = (el.dataset.student === selectedStudent) ? '#f3ecff' : '';
    });
}

// ===== اختيار طالب للمعاينة =====
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
    renderStudents(searchInput.value ? allStudents.filter(s => s.name.toLowerCase().includes(searchInput.value.toLowerCase())) : allStudents);
}

// ===== حساب المدة بوحدة واحدة =====
function getTimeSince(lastPermittedAt) {
    if (!lastPermittedAt) return null;

    const thenTime = new Date(lastPermittedAt).getTime();
    if (isNaN(thenTime)) return null;

    const nowTime = Date.now();
    let diffMs = nowTime - thenTime;

    if (diffMs < 0) {
        if (diffMs > -10800000) {
            diffMs = Math.abs(diffMs + 10800000);
        } else {
            diffMs = 0;
        }
    }

    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor(totalSec / 60);

    if (days > 0) {
        if (days === 1) return 'يوم واحد';
        if (days === 2) return 'يومين';
        if (days >= 3 && days <= 10) return `${days} أيام`;
        return `${days} يوماً`;
    }
    if (hours > 0) {
        if (hours === 1) return 'ساعة واحدة';
        if (hours === 2) return 'ساعتين';
        if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
        return `${hours} ساعة`;
    }
    if (minutes > 0) {
        if (minutes === 1) return 'دقيقة واحدة';
        if (minutes === 2) return 'دقيقتين';
        if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
        return `${minutes} دقيقة`;
    }
    
    if (totalSec === 1) return 'ثانية واحدة';
    if (totalSec === 2) return 'ثانيتين';
    if (totalSec >= 3 && totalSec <= 10) return `${totalSec} ثوانٍ`;
    return `${totalSec} ثانية`;
}

// ===== رابط صفحة التحقق =====
function getStudentVerifyUrl(studentName) {
    const base = window.location.href.split('?')[0].split('#')[0].replace(/[^/]*$/, '');
    return `${base}verify.html?student=${encodeURIComponent(studentName)}`;
}

// ===== تحديث QR والتحقق =====
function updateQrAndVerification(student, status, lastPermittedAt) {
    qrStudentName.textContent = student;
    verifyName.textContent = student;

    qrContainer.innerHTML = '';
    const qrData = getStudentVerifyUrl(student);

    new QRCode(qrContainer, {
        text: qrData,
        width: 140,
        height: 140,
        colorDark: '#4c1d95',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    if (liveTimerInterval) clearInterval(liveTimerInterval);

    if (status) {
        verifyStatusBadge.className = 'verify-status permitted';
        const renderBadgeTime = () => {
            const timeSince = getTimeSince(lastPermittedAt);
            verifyStatusBadge.innerHTML = `🟢 مسموح · ${timeSince || 'الآن'}`;
        };
        renderBadgeTime();
        liveTimerInterval = setInterval(renderBadgeTime, 1000);
    } else {
        verifyStatusBadge.className = 'verify-status not-permitted';
        verifyStatusBadge.innerHTML = '🔴 غير مسموح';
    }
}

// ===== فلترة الطلاب =====
window.filterStudents = function() {
    const val = searchInput.value.toLowerCase();
    const filtered = allStudents.filter(s => s.name.toLowerCase().includes(val));
    renderStudents(filtered);
};

// ============================================
// ===== وظائف بناء وتوليد ملفات الـ PDF =====
// ============================================

function createSingleStudentCard(studentName) {
    return new Promise((resolve) => {
        const qrUrl = getStudentVerifyUrl(studentName);
        const tempHolder = document.createElement('div');
        tempHolder.style.cssText = 'position:fixed; left:-9999px; top:-9999px;';
        document.body.appendChild(tempHolder);

        new QRCode(tempHolder, {
            text: qrUrl,
            width: 260,
            height: 260,
            colorDark: '#4c1d95',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            const canvasSource = tempHolder.querySelector('canvas');
            const imgSource = tempHolder.querySelector('img');

            const drawCanvasToData = (sourceEl) => {
                const cardCanvas = document.createElement('canvas');
                cardCanvas.width = 600;
                cardCanvas.height = 760;
                const ctx = cardCanvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

                ctx.strokeStyle = '#ede4ff';
                ctx.lineWidth = 6;
                ctx.strokeRect(8, 8, cardCanvas.width - 16, cardCanvas.height - 16);

                ctx.font = 'bold 22px "Tajawal", Arial, sans-serif';
                ctx.fillStyle = '#7c3aed';
                ctx.textAlign = 'center';
                ctx.fillText('ثانوية هوازن · Hawazen High School', 300, 65);

                ctx.fillStyle = '#fbf9ff';
                ctx.fillRect(160, 105, 280, 280);
                ctx.strokeStyle = '#f3ecff';
                ctx.lineWidth = 2;
                ctx.strokeRect(160, 105, 280, 280);

                ctx.drawImage(sourceEl, 170, 115, 260, 260);

                ctx.font = 'bold 34px "Tajawal", Arial, sans-serif';
                ctx.fillStyle = '#4c1d95';
                ctx.fillText(studentName, 300, 465);

                ctx.font = '20px "Tajawal", Arial, sans-serif';
                ctx.fillStyle = '#8b7db8';
                ctx.fillText('امسح للتحقق من الحالة', 300, 520);

                ctx.strokeStyle = '#ede4ff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(100, 580);
                ctx.lineTo(500, 580);
                ctx.stroke();

                ctx.font = '16px "Tajawal", Arial, sans-serif';
                ctx.fillStyle = '#a78bfa';
                ctx.fillText('نظام إدارة إحضار الأجهزة الذكية', 300, 630);

                const data = cardCanvas.toDataURL('image/png');
                tempHolder.remove();
                resolve(data);
            };

            if (canvasSource) {
                drawCanvasToData(canvasSource);
            } else if (imgSource && imgSource.src) {
                const img = new Image();
                img.onload = () => drawCanvasToData(img);
                img.src = imgSource.src;
            } else {
                tempHolder.remove();
                resolve(null);
            }
        }, 120);
    });
}

// تحميل باركود الطالب المعروض حالياً
async function downloadSingleQRPdf() {
    if (!selectedStudent) {
        showToast('يرجى اختيار طالب أولاً', 'error');
        return;
    }

    try {
        showToast(`جاري إنشاء PDF لباركود ${selectedStudent}...`, 'success');
        const cardImg = await createSingleStudentCard(selectedStudent);
        if (!cardImg) throw new Error('تعذر توليد الباركود');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        pdf.addImage(cardImg, 'PNG', 45, 40, 120, 152);
        pdf.save(`باركود_${selectedStudent}.pdf`);
        showToast(`✅ تم تحميل باركود ${selectedStudent}`, 'success');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء تحميل الـ PDF', 'error');
    }
}

// تحميل كافة باركودات الطلاب المسجلين
async function downloadAllStudentsQRPdf() {
    if (!allStudents || allStudents.length === 0) {
        showToast('لا يوجد طلاب مسجلين للتحميل', 'error');
        return;
    }

    try {
        showToast('جاري تجميع كافة الباركودات في ملف PDF...', 'success');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const colPositions = [15, 110];
        const rowPositions = [15, 150];
        const cardW = 85;
        const cardH = 108;

        for (let i = 0; i < allStudents.length; i++) {
            const student = allStudents[i];
            const slot = i % 4;

            if (i > 0 && slot === 0) {
                pdf.addPage();
            }

            const col = slot % 2;
            const row = Math.floor(slot / 2);
            const x = colPositions[col];
            const y = rowPositions[row];

            const cardImg = await createSingleStudentCard(student.name);
            if (cardImg) {
                pdf.addImage(cardImg, 'PNG', x, y, cardW, cardH);
            }
        }

        pdf.save('باركودات_جميع_الطلاب.pdf');
        showToast('✅ تم تحميل جميع الباركودات بنجاح', 'success');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء تجميع الملف', 'error');
    }
}

// ربط الأزرار
function attachEvents() {
    const singleBtn = document.getElementById('btnDownloadSingle');
    const allBtn = document.getElementById('btnDownloadAll');
    const historyBtn = document.getElementById('btnOpenHistory');
    const closeHistoryBtn = document.getElementById('btnCloseHistoryModal');

    if (singleBtn) {
        singleBtn.onclick = (e) => {
            e.preventDefault();
            downloadSingleQRPdf();
        };
    }

    if (allBtn) {
        allBtn.onclick = (e) => {
            e.preventDefault();
            downloadAllStudentsQRPdf();
        };
    }

    if (historyBtn) {
        historyBtn.onclick = (e) => {
            e.preventDefault();
            window.openHistoryModal();
        };
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.onclick = (e) => {
            e.preventDefault();
            window.closeHistoryModal();
        };
    }
}

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
                        renderStudents(searchInput.value ? allStudents.filter(s => s.name.toLowerCase().includes(searchInput.value.toLowerCase())) : allStudents);
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
                renderStudents(searchInput.value ? allStudents.filter(s => s.name.toLowerCase().includes(searchInput.value.toLowerCase())) : allStudents);
                if (selectedStudent === updatedStudent.name) {
                    updateQrAndVerification(updatedStudent.name, updatedStudent.permitted, updatedStudent.last_permitted_at);
                }
            }
        )
        .subscribe();

    supabaseClient
        .channel('history_realtime')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'history' },
            () => {
                loadHistory();
            }
        )
        .subscribe();
}

// ===== التهيئة =====
async function init() {
    console.log('🚀 Musta\'athin initializing... Version:', APP_VERSION);
    const verEl = document.getElementById('appVersion');
    if (verEl) verEl.textContent = APP_VERSION;

    attachEvents();
    await loadAllData();

    if (allStudents.length > 0) {
        selectStudent(allStudents[0].name);
    } else {
        qrContainer.innerHTML = '';
        qrStudentName.textContent = 'اختر طالباً';
        verifyName.textContent = 'اختر طالباً';
        verifyStatusBadge.className = 'verify-status';
        verifyStatusBadge.innerHTML = '—';
        if (liveTimerInterval) clearInterval(liveTimerInterval);
    }

    subscribeToChanges();
    console.log('✅ Ready. Students:', allStudents.length);
}

attachEvents();

// ===== بدء التطبيق =====
if (sessionStorage.getItem('mustaathin_auth') === 'true') {
    document.getElementById('loginOverlay').style.display = 'none';
    init();
}
