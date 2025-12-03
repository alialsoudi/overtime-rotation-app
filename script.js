// اسم المفتاح لحفظ البيانات في LocalStorage
const STORAGE_KEY = 'overtimeLog';

// استرجاع البيانات المحفوظة أو بدء مصفوفة فارغة
let overtimeEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// الأيام لملء عمود "اليوم"
const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

document.addEventListener('DOMContentLoaded', () => {
    // عرض البيانات المحفوظة عند تحميل الصفحة
    renderTables();

    // إضافة مستمع لحدث إرسال النموذج
    document.getElementById('overtime-form').addEventListener('submit', handleFormSubmit);
});

// 1. معالجة إرسال النموذج وحفظ البيانات
function handleFormSubmit(event) {
    event.preventDefault();

    const entry = {
        name: document.getElementById('employeeName').value,
        shift: document.getElementById('shiftType').value,
        date: document.getElementById('dateWorked').value,
        hours: parseFloat(document.getElementById('hoursWorked').value),
        supervisor: document.getElementById('supervisorName').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString() // لحفظ وقت الإدخال
    };

    // إضافة الإدخال الجديد للمصفوفة
    overtimeEntries.push(entry);

    // حفظ المصفوفة المحدثة في LocalStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overtimeEntries));

    // تحديث الجداول
    renderTables();

    // مسح النموذج بعد الإدخال
    event.target.reset();
}

// 2. حساب إجمالي الساعات لكل موظف وتحديد الدور
function calculateTotals() {
    const totals = {};
    const employees = new Set();

    // حلقة لجمع الساعات لكل موظف
    overtimeEntries.forEach(entry => {
        employees.add(entry.name);
        totals[entry.name] = (totals[entry.name] || 0) + entry.hours;
    });

    // تحويل الكائن إلى مصفوفة لسهولة الفرز
    const sortedTotals = Array.from(employees).map(name => ({
        name: name,
        totalHours: totals[name]
    }));

    // الفرز: الأقل ساعات أولاً (ترتيب الدور)
    sortedTotals.sort((a, b) => a.totalHours - b.totalHours);

    // تحديد الموظف التالي في الدور
    const nextInLine = sortedTotals.length > 0 ? sortedTotals[0].name : "لا يوجد بيانات بعد";

    return { sortedTotals, nextInLine };
}

// 3. عرض الجداول
function renderTables() {
    const { sortedTotals, nextInLine } = calculateTotals();

    // تحديث خانة "من عليه الدور الآن؟"
    const nextInLineElement = document.getElementById('next-in-line');
    nextInLineElement.textContent = nextInLine;

    // عرض جدول ملخص الساعات (الدور)
    const totalsBody = document.querySelector('#totals-table tbody');
    totalsBody.innerHTML = '';
    
    sortedTotals.forEach((data, index) => {
        const row = totalsBody.insertRow();
        
        // تمييز الصف لمن عليه الدور
        if (index === 0) {
            row.classList.add('next-person');
        }

        row.insertCell().textContent = data.name;
        row.insertCell().textContent = data.totalHours;
        row.insertCell().textContent = index + 1; // ترتيب الدور
    });

    // عرض سجل الدوام الإضافي الكامل
    const logBody = document.querySelector('#log-table tbody');
    logBody.innerHTML = '';

    // فرز السجل حسب التاريخ الأحدث أولاً
    const sortedLog = [...overtimeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedLog.forEach(entry => {
        const row = logBody.insertRow();
        const dateObj = new Date(entry.date);

        row.insertCell().textContent = entry.date;
        row.insertCell().textContent = days[dateObj.getDay()]; // اسم اليوم
        row.insertCell().textContent = entry.name;
        row.insertCell().textContent = entry.shift;
        row.insertCell().textContent = entry.hours;
        row.insertCell().textContent = entry.supervisor;
        row.insertCell().textContent = entry.notes;
    });
}