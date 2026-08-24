// ===== تكوين Supabase =====
const SUPABASE_URL = 'https://qnxiyrfdvqskwfcmnptw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NV8m1fyVZq29VKBD6hQnsw_euvyzRsH';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== المتغيرات العامة =====
let selectedStudent = 'Haider';
let isProcessing = false;
const currentTeacher = 'Ms. Fatima';
let allStudents = [];

// DOM refs
const studentListEl = document.getElementById('studentList');
const historyContainer = document.getElementById('historyLogContainer');
const qrContainer = document.getElementById('qrcode-container');
const qrStudentName = document.getElementById('qrStudentName');
const verifyName = document.getElementById('verifyName');
const verifyStatusBadge = document.getElementById('verifyStatusBadge');
const searchInput = document.getElementById('searchInput');
const toastContainer = document.getElementById('toastContainer');

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
        console.log('🔍 Fetching students from Supabase...');
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('name');

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Students loaded:', data);
        allStudents = data;
        return data;
    } catch (error) {
        console.error('❌ Fetch error:', error);
        showToast('Error loading students: ' + error.message, 'error');
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
            .limit(50);

        if (error) throw error;
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
            .select('name, permitted')
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
        const { error: updateError } = await supabaseClient
            .from('students')
            .update({ permitted: status })
            .eq('name', name);

        if (updateError) throw updateError;

        const statusText = status ? 'Permitted' : 'Not Permitted';
        const timestamp = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const { error: historyError } = await supabaseClient
            .from('history')
            .insert([{
                student_name: name,
                status: statusText,
                timestamp: timestamp,
                teacher: currentTeacher
            }]);

        if (historyError) throw historyError;

        showToast(`${name} ${status ? 'Permitted ✓' : 'Cancelled ✗'}`, status ? 'success' : 'error');
        
        await loadAllData();
        
        if (selectedStudent === name) {
            const studentData = await fetchStudentStatus(name);
            if (studentData) {
                updateQrAndVerification(name, studentData.permitted);
            }
        }

    } catch (error) {
        showToast('Error updating status: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            isProcessing = false;
        }, 300);
    }
}

// ===== تحميل جميع البيانات =====
async function loadAllData() {
    const students = await fetchStudents();
    const history = await fetchHistory();
    
    renderStudents(students, searchInput.value);
    renderHistory(history);
}

// ===== عرض الطلاب =====
function renderStudents(students, filter = '') {
    if (!students || students.length === 0) {
        studentListEl.innerHTML = `<div class="loading-message">No students found. Please check database.</div>`;
        return;
    }

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0 && students.length > 0) {
        studentListEl.innerHTML = `<div class="loading-message">No students match "${filter}"</div>`;
        return;
    }

    let html = '';
    filtered.forEach(s => {
        const status = s.permitted === true;
        const statusText = status ? 'Permitted' : 'Not Permitted';
        const statusClass = status ? 'permitted' : 'not-permitted';
        const statusIcon = status ? '🟢' : '🔴';
        
        html += `
            <div class="student-item" data-student="${s.name}">
                <span class="student-name"><i class="fas fa-user-graduate"></i> ${s.name}</span>
                <span class="status-badge ${statusClass}">${statusIcon} ${statusText}</span>
                <div class="actions">
                    <button class="btn btn-permit btn-sm" data-action="permit" data-student="${s.name}" ${status ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> Permit
                    </button>
                    <button class="btn btn-cancel btn-sm" data-action="cancel" data-student="${s.name}" ${!status ? 'disabled' : ''}>
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="btn btn-qr btn-sm" data-action="viewqr" data-student="${s.name}">
                        <i class="fas fa-qrcode"></i>
                    </button>
                </div>
            </div>
        `;
    });
    studentListEl.innerHTML = html;

    document.querySelectorAll('.student-item .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isProcessing) return;
            const action = this.dataset.action;
            const student = this.dataset.student;
            if (!student) return;
            if (action === 'permit') {
                updateStudentStatus(student, true);
            } else if (action === 'cancel') {
                updateStudentStatus(student, false);
            } else if (action === 'viewqr') {
                selectStudent(student);
            }
        });
    });

    document.querySelectorAll('.student-item').forEach(el => {
        if (el.dataset.student === selectedStudent) {
            el.style.background = '#e6f0fa';
        } else {
            el.style.background = '';
        }
    });
}

// ===== عرض السجل =====
function renderHistory(history) {
    if (!history || history.length === 0) {
        historyContainer.innerHTML = `<div class="empty-history"><i class="fas fa-info-circle"></i> No actions yet</div>`;
        return;
    }
    
    let html = '';
    history.slice(0, 10).forEach(entry => {
        const icon = entry.status === 'Permitted' ? '🟢' : '🔴';
        html += `
            <div class="log-entry">
                <span><strong>${entry.student_name}</strong> ${icon} ${entry.status}</span>
                <span class="log-time">${entry.timestamp} · <span class="teacher-tag">${entry.teacher}</span></span>
            </div>
        `;
    });
    historyContainer.innerHTML = html;
}

// ===== اختيار طالب =====
function selectStudent(student) {
    if (isProcessing) return;
    selectedStudent = student;
    const studentData = allStudents.find(s => s.name === student);
    if (studentData) {
        updateQrAndVerification(student, studentData.permitted);
    } else {
        fetchStudentStatus(student).then(data => {
            if (data) {
                updateQrAndVerification(student, data.permitted);
            }
        });
    }
    renderStudents(allStudents, searchInput.value);
}

// ===== تحديث QR =====
function updateQrAndVerification(student, status) {
    qrStudentName.textContent = student;
    verifyName.textContent = student;

    qrContainer.innerHTML = '';
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const qrData = `${baseUrl}verify.html?student=${encodeURIComponent(student)}`;
    
    new QRCode(qrContainer, {
        text: qrData,
        width: 140,
        height: 140,
        colorDark: '#0b2b4a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    if (status) {
        verifyStatusBadge.className = 'verify-status permitted';
        verifyStatusBadge.innerHTML = '🟢 Permitted';
    } else {
        verifyStatusBadge.className = 'verify-status not-permitted';
        verifyStatusBadge.innerHTML = '🔴 Not Permitted';
    }
}

// ===== فلترة الطلاب =====
window.filterStudents = function() {
    renderStudents(allStudents, searchInput.value);
};

// ===== الإشتراك في التغييرات =====
function subscribeToChanges() {
    supabaseClient
        .channel('students_changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'students'
            },
            async (payload) => {
                const updatedStudent = payload.new;
                const index = allStudents.findIndex(s => s.name === updatedStudent.name);
                if (index !== -1) {
                    allStudents[index] = updatedStudent;
                }
                renderStudents(allStudents, searchInput.value);
                if (selectedStudent === updatedStudent.name) {
                    updateQrAndVerification(updatedStudent.name, updatedStudent.permitted);
                }
            }
        )
        .subscribe();

    supabaseClient
        .channel('history_changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'history'
            },
            async () => {
                const history = await fetchHistory();
                renderHistory(history);
            }
        )
        .subscribe();
}

// ===== التهيئة =====
async function init() {
    console.log('🚀 Musta\'athin initializing...');
    console.log('🔑 Using Supabase URL:', SUPABASE_URL);
    
    await loadAllData();
    
    if (allStudents.length > 0) {
        const firstStudent = allStudents[0];
        selectStudent(firstStudent.name);
    }
    
    subscribeToChanges();
    
    console.log('✅ Musta\'athin initialized');
    console.log('📊 Students:', allStudents.length);
}

// بدء التطبيق
init();
