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

        // حفظ آخر تسجيل دخول في Firebase
        const lastLoginEntry = {
            name: enteredName || "اسم غير مدخل", 
            timestamp: new Date().toISOString()
        };
        // حفظ البيانات في عقدة 'lastLogin'
        database.ref('lastLogin').set(lastLoginEntry); 
        
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
    document.getElementById('showLastLoginButton').addEventListener('click', showLastLogin); 
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
    let totalHoursSum = 0; // متغير لحساب مجموع الساعات الكلي
    
    // 1. تهيئة مجموع الساعات لجميع الموظفين إلى صفر لضمان ظهورهم
    ALL_EMPLOYEES.forEach(name => {
        totals[name] = 0;
    });

    // 2. تجميع الساعات الفعلية من قاعدة البيانات
    entriesArray.forEach(entry => {
        if (ALL_EMPLOYEES.includes(entry.name)) {
            totals[entry.name] += entry.hours;
            totalHoursSum += entry.hours; // تجميع المجموع الكلي
        }
    });

    // 3. تحويل كائن المجموع إلى مصفوفة للفرز
    const sortedTotals = ALL_EMPLOYEES.map(name => ({
        name: name,
        totalHours: totals[name]
    }));

    // 4. الفرز وتحديد الدور (الأقل ساعات أولاً)
    sortedTotals.sort((a, b) => a.totalHours - b.totalHours);

    // ⬅️ منطق جديد: إذا كان مجموع الساعات الكلي صفرًا، اعرض الرسالة المطلوبة
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
        
        if (index === 0 && data.totalHours > 0) { // التحديد يكون فقط عندما يكون هناك دوام مسجل
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

// وظيفة: عرض آخر من سجل دخوله (بكلمة سر المشرف)
function showLastLogin() {
    const enteredPassword = prompt("الرجاء إدخال كلمة سر المشرف لمعرفة آخر من دخل:");
    const lastLoginInfo = document.getElementById('lastLoginInfo');
    
    // مسح الرسالة السابقة
    lastLoginInfo.textContent = ""; 

    if (enteredPassword === ADMIN_PASSWORD) {
        database.ref('lastLogin').once('value').then(snapshot => {
            const data = snapshot.val();
            if (data) {
                const date = new Date(data.timestamp);
                // تنسيق التاريخ والوقت ليكون سهل القراءة
                const formattedDate = date.toLocaleDateString('ar-EG', { 
                    year: 'numeric', month: 'long', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit', hour12: true 
                });
                
                lastLoginInfo.innerHTML = `آخر من سجل دخول هو: <strong>${data.name}</strong> في ${formattedDate}.`;
                lastLoginInfo.style.color = '#007bff';
            } else {
                lastLoginInfo.textContent = "لا يوجد سجل تسجيل دخول سابق.";
                lastLoginInfo.style.color = 'gray';
            }
        }).catch(error => {
            lastLoginInfo.textContent = "خطأ في قراءة البيانات: " + error.message;
            lastLoginInfo.style.color = 'red';
        });
    } else if (enteredPassword !== null) {
        lastLoginInfo.textContent = "كلمة سر المشرف غير صحيحة.";
        lastLoginInfo.style.color = 'red';
    }
}
