* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Tajawal', 'Inter', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
}

body {
    background: #ffffff;
    min-height: 100vh;
    color: #2a1e4a;
    -webkit-tap-highlight-color: transparent;
}

/* ============================================
   ===== القائمة الجانبية =====
   ============================================ */
.sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 260px;
    height: 100vh;
    background: white;
    border-left: 2px solid #ede4ff;
    box-shadow: -4px 0 20px rgba(124, 58, 237, 0.06);
    display: flex;
    flex-direction: column;
    z-index: 200;
    transition: transform 0.3s ease;
}

.sidebar-header {
    padding: 1.5rem 1.2rem;
    border-bottom: 2px solid #f3ecff;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: #4c1d95;
}
.sidebar-header i { color: #7c3aed; font-size: 1.3rem; }

.sidebar-nav {
    flex: 1;
    padding: 1rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    overflow-y: auto;
}

.sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.85rem 1rem;
    background: transparent;
    border: none;
    border-radius: 14px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #6b5b95;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    text-align: right;
    width: 100%;
}
.sidebar-item i {
    font-size: 1rem;
    width: 20px;
    text-align: center;
    color: #a78bfa;
    transition: color 0.2s;
}
.sidebar-item:hover { background: #f7f3ff; color: #5b21b6; }
.sidebar-item:hover i { color: #7c3aed; }
.sidebar-item.active {
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
}
.sidebar-item.active i { color: white; }

.sidebar-footer {
    padding: 0.7rem;
    border-top: 2px solid #f3ecff;
}

.sidebar-logout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: #fce8e8;
    color: #b13e3e;
    border: 2px solid #f5d0d0;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
}
.sidebar-logout:hover { background: #f5d6d6; }

/* ============================================
   ===== المحتوى الرئيسي =====
   ============================================ */
.main-content {
    margin-right: 260px;
    min-height: 100vh;
    padding: 1.2rem;
}

.app-container { max-width: 1320px; width: 100%; }

.page-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 1.2rem;
}
.page-title h1 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #4c1d95;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.page-title h1 i { color: #7c3aed; }

.title-actions { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }

.page-actions {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
}

/* ============================================
   ===== Pages =====
   ============================================ */
.page-section { display: none; animation: fadeIn 0.3s ease; }
.page-section.active { display: block; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ============================================
   ===== Card =====
   ============================================ */
.card {
    background: white;
    border-radius: 24px;
    padding: 1.2rem 1rem;
    border: 2px solid #ede4ff;
    box-shadow: 0 8px 26px rgba(124, 58, 237, 0.05);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
.card-header h2 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #4c1d95;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}
.card-header h2 i { color: #7c3aed; }
.card-hint { font-size: 0.7rem; color: #8b7db8; }

/* ============================================
   ===== Search Box =====
   ============================================ */
.search-box {
    display: flex;
    align-items: center;
    background: #f7f3ff;
    border-radius: 60px;
    padding: 0.1rem 0.1rem 0.1rem 0.9rem;
    border: 2px solid #ede4ff;
    transition: border 0.15s;
    flex: 1;
    min-width: 130px;
    max-width: 200px;
}
.search-box:focus-within { border-color: #a78bfa; }
.search-box input {
    border: none;
    background: transparent;
    padding: 0.4rem 0.2rem;
    font-size: 0.85rem;
    width: 100%;
    outline: none;
    color: #2a1e4a;
    font-family: inherit;
}
.search-box input::placeholder { color: #a78bfa; }
.search-box button {
    background: white;
    border: none;
    border-radius: 40px;
    padding: 0.3rem 0.8rem;
    font-weight: 600;
    color: #7c3aed;
    cursor: default;
    font-size: 0.8rem;
}

/* ============================================
   ===== Student List =====
   ============================================ */
.student-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 0.2rem;
    -webkit-overflow-scrolling: touch;
}

.student-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fbf9ff;
    padding: 0.6rem 0.9rem;
    border-radius: 50px;
    border: 2px solid #f3ecff;
    transition: all 0.15s;
}
.student-item:hover { background: #f7f3ff; border-color: #d8c7ff; }

.student-number {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.25);
}

.student-name-btn {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.5rem 0.6rem;
    text-align: right;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    color: #3b1e6b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 30px;
    transition: all 0.15s;
    min-width: 0;
}
.student-name-btn:hover {
    background: rgba(124, 58, 237, 0.08);
    color: #5b21b6;
}
.student-name-btn i { color: #a78bfa; font-size: 0.85rem; flex-shrink: 0; }
.student-name-btn span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ============================================
   ===== Status Badge =====
   ============================================ */
.status-badge {
    padding: 0.25rem 0.8rem;
    border-radius: 40px;
    font-size: 0.7rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
    flex-shrink: 0;
}
.status-badge.permitted { background: #d3f0e5; color: #006b4e; }
.status-badge.not-permitted { background: #fce8e8; color: #b13e3e; }

/* ============================================
   ===== Buttons =====
   ============================================ */
.btn {
    border: none;
    background: transparent;
    padding: 0.4rem 0.9rem;
    border-radius: 40px;
    font-weight: 600;
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    transition: all 0.12s;
    border: 1px solid transparent;
    white-space: nowrap;
    min-height: 2.2rem;
    font-family: inherit;
    text-decoration: none;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-qr {
    background: #ede4ff;
    color: #5b21b6;
    border-color: #d8c7ff;
    font-size: 0.75rem;
    padding: 0.35rem 0.7rem;
}
.btn-qr:hover { background: #d8c7ff; }

.add-btn {
    background: #7c3aed !important;
    color: white !important;
    border-color: #7c3aed !important;
    padding: 0.45rem 1.2rem !important;
    font-size: 0.8rem !important;
}
.add-btn:hover { background: #6d28d9 !important; }

.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.7rem; }

/* أزرار السماح للكل */
.btn-permit-all {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    color: white;
    border: none;
    padding: 0.45rem 1.2rem;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 40px;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    font-family: inherit;
}
.btn-permit-all:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(34, 197, 94, 0.4);
}

.btn-cancel-all {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    color: white;
    border: none;
    padding: 0.45rem 1.2rem;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 40px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    font-family: inherit;
}
.btn-cancel-all:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(239, 68, 68, 0.4);
}

/* ============================================
   ===== Logs =====
   ============================================ */
.logs-card { padding: 1.2rem 1rem; }

.logs-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 75vh;
    overflow-y: auto;
    padding-right: 0.2rem;
    -webkit-overflow-scrolling: touch;
}

.log-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fbf9ff;
    padding: 0.75rem 1rem;
    border-radius: 20px;
    border: 2px solid #f3ecff;
    gap: 0.8rem;
    flex-wrap: wrap;
    transition: all 0.15s;
}
.log-item:hover { background: #f7f3ff; border-color: #d8c7ff; }

.log-item-right {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex: 1;
    min-width: 150px;
}

.log-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}
.log-icon.permitted { background: #d3f0e5; color: #006b4e; }
.log-icon.not-permitted { background: #fce8e8; color: #b13e3e; }

.log-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.log-student {
    font-weight: 700;
    font-size: 0.9rem;
    color: #3b1e6b;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}
.log-student i { color: #a78bfa; font-size: 0.75rem; }
.log-teacher {
    font-size: 0.72rem;
    color: #8b7db8;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}
.log-teacher i { color: #a78bfa; font-size: 0.7rem; }

.log-item-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.log-time-big {
    font-size: 0.72rem;
    color: #6b5b95;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #f7f3ff;
    padding: 0.25rem 0.7rem;
    border-radius: 40px;
    border: 1px solid #ede4ff;
    white-space: nowrap;
}
.log-time-big i { color: #a78bfa; font-size: 0.7rem; }

.empty-history {
    color: #a78bfa;
    font-style: italic;
    font-size: 0.9rem;
    padding: 1.5rem;
    text-align: center;
}
.loading-message {
    color: #a78bfa;
    font-size: 0.9rem;
    padding: 0.5rem 0;
    text-align: center;
}

/* ============================================
   ===== Download List =====
   ============================================ */
.download-info {
    background: #f7f3ff;
    border: 2px solid #ede4ff;
    border-radius: 16px;
    padding: 0.8rem 1rem;
    font-size: 0.82rem;
    color: #5b21b6;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
.download-info i { color: #7c3aed; }

.download-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 65vh;
    overflow-y: auto;
    padding-right: 0.2rem;
    -webkit-overflow-scrolling: touch;
}

.download-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.65rem 0.9rem;
    background: #fbf9ff;
    border: 2px solid #f3ecff;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
}
.download-item:hover { background: #f7f3ff; border-color: #d8c7ff; }
.download-item.checked {
    background: linear-gradient(135deg, #f3ecff 0%, #e9dfff 100%);
    border-color: #a78bfa;
}

.download-item input[type="checkbox"] { display: none; }

.download-check {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 2px solid #d8c7ff;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    color: white;
    font-size: 0.75rem;
}
.download-check i {
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s;
}
.download-item.checked .download-check {
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    border-color: #7c3aed;
}
.download-item.checked .download-check i { opacity: 1; transform: scale(1); }

.download-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
}

.download-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #3b1e6b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}
.download-name i { color: #a78bfa; font-size: 0.8rem; }

/* ============================================
   ===== Student Options Modal =====
   ============================================ */
.student-options-box {
    max-width: 480px;
    padding: 2rem 1.5rem 1.5rem;
}

.student-options {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1rem;
}

.option-btn {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.85rem 1rem;
    background: #fbf9ff;
    border: 2px solid #f3ecff;
    border-radius: 18px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    text-align: right;
    width: 100%;
}
.option-btn:hover {
    background: #f7f3ff;
    border-color: #d8c7ff;
    transform: translateX(-4px);
}

.option-btn.current {
    background: linear-gradient(135deg, #f3ecff 0%, #e9dfff 100%);
    border-color: #a78bfa;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.15);
}
.option-btn.current::after {
    content: '\f00c';
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    color: #7c3aed;
    margin-right: auto;
    font-size: 1rem;
}

.option-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
    color: white;
}
.option-icon.permit { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); }
.option-icon.cancel { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }
.option-icon.qr { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); }
.option-icon.edit { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
.option-icon.delete { background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%); }

.option-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
    text-align: right;
}
.option-text strong { font-size: 0.9rem; font-weight: 700; color: #3b1e6b; }
.option-text span { font-size: 0.7rem; color: #8b7db8; }

.modal-close-btn {
    width: 100%;
    padding: 0.75rem;
    background: #f7f3ff;
    color: #5b21b6;
    border: 2px solid #ede4ff;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
}
.modal-close-btn:hover { background: #ede4ff; }

/* ============================================
   ===== QR داخل النافذة =====
   ============================================ */
.modal-back-btn {
    background: #f7f3ff;
    color: #5b21b6;
    border: 2px solid #ede4ff;
    border-radius: 12px;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 1rem;
    transition: all 0.15s;
}
.modal-back-btn:hover {
    background: #ede4ff;
    transform: translateX(3px);
}

.modal-qr-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fbf9ff;
    border-radius: 24px;
    padding: 1.5rem 1rem 1.2rem;
    border: 2px solid #f3ecff;
    margin-bottom: 1rem;
}

#modalQrContainer {
    background: white;
    padding: 0.6rem;
    border-radius: 18px;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.1);
    margin-bottom: 0.8rem;
}

#modalQrContainer img,
#modalQrContainer canvas {
    display: block;
    width: 200px;
    height: 200px;
    object-fit: contain;
}

.modal-qr-name {
    font-size: 1.3rem;
    font-weight: 700;
    color: #4c1d95;
    margin-bottom: 0.5rem;
    text-align: center;
}

.modal-qr-status {
    padding: 0.4rem 1.4rem;
    border-radius: 60px;
    font-size: 0.9rem;
    font-weight: 700;
    display: inline-block;
}
.modal-qr-status.permitted { background: #d3f0e5; color: #006b4e; }
.modal-qr-status.not-permitted { background: #fce8e8; color: #b13e3e; }

.modal-download-btn {
    width: 100%;
    justify-content: center;
    margin-top: 0;
}

.btn-download-qr {
    margin-top: 0.9rem;
    padding: 0.55rem 1.3rem;
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 40px;
    font-size: 0.8rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}
.btn-download-qr:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(124, 58, 237, 0.35);
}

/* ============================================
   ===== نافذة التأكيد =====
   ============================================ */
.confirm-box {
    max-width: 420px;
    text-align: center;
    padding: 2rem 1.8rem 1.5rem;
}

.confirm-icon {
    width: 70px;
    height: 70px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    color: #d97706;
    animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.confirm-title {
    color: #4c1d95 !important;
    font-size: 1.15rem !important;
    font-weight: 700 !important;
    margin-bottom: 0.6rem !important;
    display: block !important;
    text-align: center;
}

.confirm-message {
    color: #6b5b95;
    font-size: 0.88rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    padding: 0 0.3rem;
}

.confirm-actions {
    margin-top: 0 !important;
    gap: 0.6rem !important;
}

.btn-confirm-yes {
    flex: 1;
    padding: 0.85rem;
    border: none;
    border-radius: 16px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}
.btn-confirm-yes:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(220, 38, 38, 0.4);
}

.btn-confirm-no {
    flex: 1;
    padding: 0.85rem;
    border: 2px solid #ede4ff;
    border-radius: 16px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    background: #f7f3ff;
    color: #5b21b6;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}
.btn-confirm-no:hover { background: #ede4ff; }

/* ============================================
   ===== Toast =====
   ============================================ */
.toast-container {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    pointer-events: none;
    width: 90%;
    max-width: 400px;
}
.toast {
    background: #5b21b6;
    color: white;
    padding: 0.7rem 1.4rem;
    border-radius: 60px;
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 8px 26px rgba(124, 58, 237, 0.3);
    pointer-events: auto;
    animation: slideUp 0.25s ease;
    width: 100%;
    text-align: center;
}
.toast.success { background: #006b4e; }
.toast.error { background: #b13e3e; }
@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ============================================
   ===== Login =====
   ============================================ */
.login-overlay {
    position: fixed; inset: 0; background: #ffffff;
    display: flex; justify-content: center; align-items: center;
    z-index: 9999; padding: 1.5rem;
}
.login-box {
    background: white; border-radius: 32px; padding: 2.5rem 2rem;
    max-width: 420px; width: 100%; text-align: center;
    border: 2px solid #ede4ff;
    box-shadow: 0 20px 60px rgba(124, 58, 237, 0.12);
    animation: popIn 0.4s ease;
}
@keyframes popIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}
.login-box .lock-icon { font-size: 3rem; color: #7c3aed; margin-bottom: 1rem; }
.login-box h2 { color: #4c1d95; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.3rem; }
.login-box .subtitle { color: #8b7db8; font-size: 0.85rem; margin-bottom: 1.8rem; }
.login-box input[type="password"] {
    width: 100%; padding: 0.9rem 1.2rem;
    border: 2px solid #ede4ff; border-radius: 16px;
    font-size: 1rem; outline: none; text-align: center;
    letter-spacing: 2px; transition: border 0.2s;
    font-family: inherit; color: #2a1e4a;
}
.login-box input[type="password"]:focus { border-color: #7c3aed; }
.login-box button {
    width: 100%; margin-top: 1rem; padding: 0.9rem;
    background: #7c3aed; color: white; border: none;
    border-radius: 16px; font-size: 1rem; font-weight: 700;
    cursor: pointer; transition: background 0.2s; font-family: inherit;
}
.login-box button:hover { background: #6d28d9; }
.login-error { color: #b13e3e; font-size: 0.85rem; margin-top: 0.8rem; min-height: 1.2rem; }

/* ============================================
   ===== Modal =====
   ============================================ */
.modal-overlay {
    position: fixed; inset: 0; background: rgba(76, 29, 149, 0.35);
    display: none; justify-content: center; align-items: center;
    z-index: 1000; padding: 1.5rem; backdrop-filter: blur(6px);
}
.modal-overlay.active { display: flex; }
.modal-box {
    background: white; border-radius: 28px; padding: 2rem 1.8rem;
    max-width: 440px; width: 100%; border: 2px solid #ede4ff;
    box-shadow: 0 20px 60px rgba(124, 58, 237, 0.2);
    animation: popIn 0.3s ease;
}
.modal-box h3 {
    color: #4c1d95; font-size: 1.2rem; font-weight: 700;
    margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;
}
.modal-box h3 i { color: #7c3aed; }
.modal-box .modal-sub { color: #8b7db8; font-size: 0.8rem; margin-bottom: 1.5rem; }
.modal-box input[type="text"] {
    width: 100%; padding: 0.85rem 1.2rem;
    border: 2px solid #ede4ff; border-radius: 16px;
    font-size: 1rem; outline: none; transition: border 0.2s;
    font-family: inherit; color: #2a1e4a;
}
.modal-box input[type="text"]:focus { border-color: #7c3aed; }
.modal-actions { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
.modal-actions button {
    flex: 1; padding: 0.8rem; border: none; border-radius: 16px;
    font-size: 0.9rem; font-weight: 700; cursor: pointer;
    font-family: inherit; transition: all 0.15s;
}
.modal-actions .btn-save { background: #7c3aed; color: white; }
.modal-actions .btn-save:hover { background: #6d28d9; }
.modal-actions .btn-cancel-modal {
    background: #f7f3ff; color: #5b21b6; border: 2px solid #ede4ff;
}
.modal-actions .btn-cancel-modal:hover { background: #ede4ff; }

/* ============================================
   ===== Menu Toggle =====
   ============================================ */
.menu-toggle {
    display: none;
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    z-index: 300;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
    align-items: center;
    justify-content: center;
    transition: transform 0.15s;
}
.menu-toggle:hover { transform: scale(1.05); }

.sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(76, 29, 149, 0.4);
    backdrop-filter: blur(3px);
    z-index: 150;
}
.sidebar-backdrop.open { display: block; }

/* ============================================
   ===== Responsive =====
   ============================================ */
@media (max-width: 900px) {
    .sidebar {
        transform: translateX(100%);
        width: 280px;
        box-shadow: -8px 0 30px rgba(124, 58, 237, 0.15);
    }
    .sidebar.open { transform: translateX(0); }

    .main-content {
        margin-right: 0;
        padding: 1rem;
        padding-top: 4.5rem;
    }

    .menu-toggle { display: flex; }

    .page-title h1 { font-size: 1.1rem; }
}

@media (max-width: 600px) {
    .student-item { padding: 0.5rem 0.75rem; gap: 0.4rem; }
    .student-number { width: 30px; height: 30px; font-size: 0.72rem; }
    .student-name-btn { font-size: 0.85rem; padding: 0.4rem 0.5rem; }
    .status-badge { font-size: 0.62rem; padding: 0.2rem 0.6rem; }

    .title-actions .btn-text { display: none; }
    .page-actions .btn-text { display: none; }
    .page-actions { gap: 0.3rem; }
    .btn-permit-all,
    .btn-cancel-all {
        padding: 0.45rem 0.7rem;
        font-size: 0.75rem;
    }

    .log-item { padding: 0.65rem 0.8rem; }
    .log-icon { width: 34px; height: 34px; font-size: 0.85rem; }
    .log-student { font-size: 0.82rem; }
    .log-teacher { font-size: 0.68rem; }
    .log-time-big { font-size: 0.65rem; }

    .sidebar { width: 260px; }

    .modal-qr-name { font-size: 1.1rem; }
    #modalQrContainer img,
    #modalQrContainer canvas {
        width: 180px;
        height: 180px;
    }

    .confirm-box { padding: 1.8rem 1.4rem 1.3rem; }
    .confirm-icon { width: 60px; height: 60px; font-size: 1.5rem; }
    .confirm-title { font-size: 1rem !important; }
    .confirm-message { font-size: 0.82rem; }
    .btn-confirm-yes,
    .btn-confirm-no { padding: 0.75rem; font-size: 0.85rem; }
}

@media (max-width: 380px) {
    .student-name-btn { font-size: 0.8rem; }
    .student-number { width: 28px; height: 28px; font-size: 0.68rem; }
    .status-badge { display: none; }
}
