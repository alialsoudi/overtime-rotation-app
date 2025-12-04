// كلمة سر الدخول للموقع 
const LOGIN_PASSWORD = 'APC123'; 
// كلمة السر المطلوبة لحذف البيانات 
const ADMIN_PASSWORD = 'APC2025'; 

// الأيام لملء عمود "اليوم"
const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// قائمة بجميع الموظفين لضمان ظهورهم في جدول الدور
const ALL_EMPLOYEES = [
    "علي السعودي", 
    "احمد الصقور", 
    "قصي النعيمات", 
    "عمار الغرابلي", 
    "أحمد حامد", 
    "عاصم القواسمة", 
    "محمد العسيلي", 
    "صهيب الرواشدة"
];

document.addEventListener('DOMContentLoaded', () => {
    // ربط نموذج تسجيل الدخول عند تحميل الصفحة
    document.getElementById('login-form').addEventListener('submit', handleLogin);
});

// =======================================================
// وظيفة: معالجة تسجيل الدخول وفتح التطبيق
// =======================================================
function handleLogin(event) {
    event.preventDefault();
    const enteredPassword = document.getElementById('loginPassword').value;
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    const message = document.getElementById('login-message');

    if (enteredPassword === LOGIN_PASSWORD) {
        // كلمة السر صحيحة
        loginScreen.style.display = 'none';
        appContent.style.display = 'block';
        
        // بعد الدخول، يتم تحميل البيانات وربط باقي مستمعات الأحداث
        initializeAppListeners();
        
    } else {
        // كلمة السر غير صحيحة
        message.textContent = 'كلمة السر غير صحيحة.';
        message.style.display = 'block';
        document.getElementById('loginPassword').value = ''; 
    }
}

// =======================================================
// وظيفة: تهيئة مستمعات التطبيق بعد تسجيل الدخول
// =======================================================
function initializeAppListeners() {
    loadDataFromFirebase();
    document.getElementById('overtime-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('clearDataButton').addEventListener('click', clearAllData);
}


// وظيفة تحميل البيانات من Firebase
function loadDataFromFirebase() {
    database.ref('log').on('value', (snapshot) => {
        const data = snapshot.val();
        
        const entriesArray = [];
        if (data) {
            Object.keys(data).forEach(key => {
                entriesArray.push(data[key]);
            });
        }
        
        renderTables(entriesArray);
    });
}


// 1. معالجة إرسال النموذج (الحفظ في Firebase)
function handleFormSubmit(event) {
    event.preventDefault();

    const entry = {
        name: document.getElementById('employeeName').value,
        shift: document.getElementById('shiftType').value,
        date: document.getElementById('dateWorked').value,
        hours: parseFloat(document.getElementById('hoursWorked').value),
        supervisor: document.getElementById('supervisorName').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };

    database.ref('log').push(entry);
    event.target.reset();
}


// 2. حساب إجمالي الساعات وتحديد الدور
function calculateTotals(entriesArray) {
    const totals = {};
    
    // 1. تهيئة مجموع الساعات لجميع الموظفين إلى صفر لضمان ظهورهم
    ALL_EMPLOYEES.forEach(name => {
        totals[name] = 0;
    });

    // 2. تجميع الساعات الفعلية من قاعدة البيانات
    entriesArray.forEach(entry => {
        if (ALL_EMPLOYEES.includes(entry.name)) {
            totals[entry.name] += entry.hours;
        }
    });

    // 3. تحويل كائن المجموع إلى مصفوفة للفرز
    const sortedTotals = ALL_EMPLOYEES.map(name => ({
        name: name,
        totalHours: totals[name]
    }));

    // 4. الفرز وتحديد الدور (الأقل ساعات أولاً)
    sortedTotals.sort((a, b) => a.totalHours - b.totalHours);

    const nextInLine = sortedTotals.length > 0 ? sortedTotals[0].name : "لا يوجد موظفين مسجلين";

    return { sortedTotals, nextInLine };
}

// 3. عرض الجداول
function renderTables(overtimeEntries) {
    const { sortedTotals, nextInLine } = calculateTotals(overtimeEntries);

    const nextInLineElement = document.getElementById('next-in-line');
    nextInLineElement.textContent = nextInLine;

    const totalsBody = document.querySelector('#totals-table tbody');
    totalsBody.innerHTML = '';
    
    sortedTotals.forEach((data, index) => {
        const row = totalsBody.insertRow();
        
        if (index === 0) {
            row.classList.add('next-person');
        }

        row.insertCell().textContent = data.name;
        row.insertCell().textContent = data.totalHours;
        row.insertCell().textContent = index + 1; 
    });

    const logBody = document.querySelector('#log-table tbody');
    logBody.innerHTML = '';

    const sortedLog = [...overtimeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedLog.forEach(entry => {
        const row = logBody.insertRow();
        const dateObj = new Date(entry.date);

        row.insertCell().textContent = entry.date;
        row.insertCell().textContent = days[dateObj.getDay()]; 
        row.insertCell().textContent = entry.name;
        row.insertCell().textContent = entry.shift;
        row.insertCell().textContent = entry.hours;
        row.insertCell().textContent = entry.supervisor;
        row.insertCell().textContent = entry.notes;
    });
}

// 4. دالة مسح البيانات (الحذف من Firebase)
function clearAllData() {
    if (!confirm("هل أنت متأكد من أنك تريد حذف جميع بيانات الدوام الإضافي؟ لا يمكن التراجع عن هذا الإجراء.")) {
        return; 
    }
    
    const enteredPassword = prompt("الرجاء إدخال كلمة سر المشرف للمتابعة:");
    
    if (enteredPassword === ADMIN_PASSWORD) {
        database.ref('log').set(null)
            .then(() => {
                alert("تم مسح جميع البيانات بنجاح من قاعدة البيانات السحابية!");
            })
            .catch((error) => {
                alert("حدث خطأ أثناء مسح البيانات: " + error.message);
            });
    } else if (enteredPassword !== null) {
        alert("كلمة سر المشرف غير صحيحة. لا يمكن مسح البيانات.");
    }
}
