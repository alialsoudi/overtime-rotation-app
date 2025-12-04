// كلمة سر الدخول للموقع 
const LOGIN_PASSWORD = 'APC123'; 
// كلمة السر المطلوبة لحذف البيانات أو استعراض سجل المشرف
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
// وظيفة: معالجة تسجيل الدخول وحفظ اسم المستخدم
// =======================================================
function handleLogin(event) {
    event.preventDefault();
    const enteredName = document.getElementById('loginName').value; // جلب الاسم
    const enteredPassword = document.getElementById('loginPassword').value;
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    const message = document.getElementById('login-message');

    if (enteredPassword === LOGIN_PASSWORD) {
        // كلمة السر صحيحة
        loginScreen.style.display = 'none';
        appContent.style.display = 'block';

        // حفظ كل تسجيل دخول في سجل 'loginLog' باستخدام push()
        const loginEntry = {
            name: enteredName || "اسم غير مدخل", 
            timestamp: new Date().toISOString()
        };
        database.ref('loginLog').push(loginEntry); 
        
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
    document.getElementById('showLastLoginButton').addEventListener('click', showLoginLog); 
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
    let totalHoursSum = 0; 
    
    // 1. تهيئة مجموع الساعات لجميع الموظفين إلى صفر لضمان ظهورهم
    ALL_EMPLOYEES.forEach(name => {
        totals[name] = 0;
    });

    // 2. تجميع الساعات الفعلية من قاعدة البيانات
    entriesArray.forEach(entry => {
        if (ALL_EMPLOYEES.includes(entry.name)) {
            totals[entry.name] += entry.hours;
            totalHoursSum += entry.hours; 
        }
    });

    // 3. تحويل كائن المجموع إلى مصفوفة للفرز
    const sortedTotals = ALL_EMPLOYEES.map(name => ({
        name: name,
        totalHours: totals[name]
    }));

    // 4. الفرز وتحديد الدور (الأقل ساعات أولاً)
    sortedTotals.sort((a, b) => a.totalHours - b.totalHours);

    // منطق عرض الرسالة: إذا كان مجموع الساعات الكلي صفرًا
    let nextInLine;
    if (totalHoursSum === 0) {
        nextInLine = "لا يوجد دوام مسجل"; 
    } else {
        nextInLine = sortedTotals.length > 0 ? sortedTotals[0].name : "لا يوجد موظفين مسجلين";
    }

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
        
        // ضمان عدم تمييز أي شخص إذا كان مجموع الساعات صفر
        if (index === 0 && data.totalHours > 0) { 
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

// ⬅️ وظيفة عرض سجل الدخول (مع تعديل العرض لآخر 100 ومدخلات)
function showLoginLog() {
    const lastLoginInfo = document.getElementById('lastLoginInfo');
    
    // منطق إخفاء/إظهار المنطقة عند الضغط على الزر مرة أخرى
    if (lastLoginInfo.style.display === 'block') {
        lastLoginInfo.style.display = 'none';
        lastLoginInfo.innerHTML = "";
        return;
    }

    const enteredPassword = prompt("الرجاء إدخال كلمة سر المشرف لعرض سجل الدخول:");
    
    lastLoginInfo.innerHTML = ""; 

    if (enteredPassword === ADMIN_PASSWORD) {
        database.ref('loginLog').once('value').then(snapshot => {
            const data = snapshot.val();
            
            // إظهار المنطقة عند نجاح تسجيل الدخول
            lastLoginInfo.style.display = 'block'; 
            
            if (data) {
                const logArray = [];
                Object.keys(data).forEach(key => {
                    logArray.push(data[key]);
                });

                logArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                // ⬅️ إزالة العنوان وعرض آخر 100
                let html = '<ol style="list-style-type: decimal; margin-right: 20px; text-align: right; padding-right: 0;">';
                
                // عرض آخر 100 سجل فقط
                logArray.slice(0, 100).forEach(entry => {
                    const date = new Date(entry.timestamp);
                    const formattedDate = date.toLocaleDateString('ar-EG', { 
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit', hour12: true 
                    });
                    // عرض الاسم والوقت
                    html += `<li style="margin-bottom: 5px;"> قام <strong>${entry.name}</strong> بالدخول في: ${formattedDate}</li>`;
                });
                html += '</ol>';
                
                lastLoginInfo.innerHTML = html;
                lastLoginInfo.style.color = '#333';
            } else {
                lastLoginInfo.textContent = "لا يوجد سجل تسجيل دخول سابق.";
                lastLoginInfo.style.color = 'gray';
            }
        }).catch(error => {
            lastLoginInfo.textContent = "خطأ في قراءة البيانات: " + error.message;
            lastLoginInfo.style.color = 'red';
            lastLoginInfo.style.display = 'block';
        });
    } else if (enteredPassword !== null) {
        lastLoginInfo.textContent = "كلمة سر المشرف غير صحيحة.";
        lastLoginInfo.style.color = 'red';
        lastLoginInfo.style.display = 'block';
    }
}
