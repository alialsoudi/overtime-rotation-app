// كلمة السر المطلوبة لحذف البيانات
const ADMIN_PASSWORD = 'APC2025'; 

// الأيام لملء عمود "اليوم"
const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

document.addEventListener('DOMContentLoaded', () => {
    // تبدأ بتحميل البيانات من Firebase
    loadDataFromFirebase();

    // إضافة مستمع لحدث إرسال النموذج
    document.getElementById('overtime-form').addEventListener('submit', handleFormSubmit);
    
    // إضافة مستمع لزر مسح البيانات الجديد
    document.getElementById('clearDataButton').addEventListener('click', clearAllData);
});

// وظيفة جديدة: تحميل البيانات من Firebase
function loadDataFromFirebase() {
    // الاستماع لأي تغييرات تحدث في عقدة 'log' في قاعدة البيانات
    database.ref('log').on('value', (snapshot) => {
        const data = snapshot.val();
        
        // تحويل البيانات من كائن Firebase إلى مصفوفة
        // استخدام Object.keys ثم map للحصول على مفاتيح Firebase للمستقبل إذا لزم الأمر
        const entriesArray = [];
        if (data) {
            Object.keys(data).forEach(key => {
                entriesArray.push(data[key]);
            });
        }
        
        // تحديث وعرض الجداول بالبيانات الجديدة
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

    // الحفظ في Firebase: استخدام push() لإنشاء مفتاح فريد جديد
    database.ref('log').push(entry);

    // مسح النموذج بعد الإدخال
    event.target.reset();
}


// 2. حساب إجمالي الساعات وتحديد الدور
function calculateTotals(entriesArray) {
    const totals = {};
    const employees = new Set();

    entriesArray.forEach(entry => {
        employees.add(entry.name);
        totals[entry.name] = (totals[entry.name] || 0) + entry.hours;
    });

    const sortedTotals = Array.from(employees).map(name => ({
        name: name,
        totalHours: totals[name]
    }));

    sortedTotals.sort((a, b) => a.totalHours - b.totalHours);

    const nextInLine = sortedTotals.length > 0 ? sortedTotals[0].name : "لا يوجد بيانات بعد";

    return { sortedTotals, nextInLine };
}

// 3. عرض الجداول
function renderTables(overtimeEntries) {
    const { sortedTotals, nextInLine } = calculateTotals(overtimeEntries);

    // تحديث خانة "من عليه الدور الآن؟"
    const nextInLineElement = document.getElementById('next-in-line');
    nextInLineElement.textContent = nextInLine;

    // عرض جدول ملخص الساعات (الدور)
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

    // عرض سجل الدوام الإضافي الكامل
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
        // حذف البيانات: تعيين العقدة 'log' إلى قيمة null لحذفها بالكامل من Firebase
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
