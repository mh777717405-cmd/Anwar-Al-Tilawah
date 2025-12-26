let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = null;
let currentHalaqa = "";

// إظهار/إخفاء كلمة المرور
function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
}

// إظهار شاشة التسجيل
function showRegister() {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "block";
}

// العودة لتسجيل الدخول
function showLogin() {
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("registerBox").style.display = "none";
}

// تسجيل حساب جديد
function register() {
    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    if (!username || !password) return document.getElementById("registerError").innerText = "أدخل اسم المستخدم وكلمة المرور";
    if (users.find(u => u.username === username)) return document.getElementById("registerError").innerText = "اسم المستخدم موجود مسبقًا";

    const user = { username, password, halaqat: {}, lastDate: null };
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));

    alert("تم تسجيل الحساب بنجاح! الآن يمكنك تسجيل الدخول.");
    showLogin();
}

// تسجيل الدخول
function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return document.getElementById("error").innerText = "❌ اسم المستخدم أو كلمة المرور غير صحيحة";

    currentUser = user;
    currentUser.halaqat = currentUser.halaqat || {};
    const today = new Date().toLocaleDateString("ar-EG");
    if (!currentUser.lastDate || currentUser.lastDate !== today) {
        resetAttendance();
        currentUser.lastDate = today;
        save();
    }

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("system").style.display = "block";

    loadHalaqat();
}

// تسجيل الخروج
function logout() {
    currentUser = null;
    currentHalaqa = "";
    document.getElementById("system").style.display = "none";
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

// حذف الحساب
function deleteAccount() {
    if (!currentUser) return;
    if (confirm("هل أنت متأكد من حذف حسابك نهائيًا؟ سيتم حذف جميع الحلقات والطلاب أيضًا.")) {
        users = users.filter(u => u.username !== currentUser.username);
        localStorage.setItem("users", JSON.stringify(users));
        currentUser = null;
        currentHalaqa = "";
        document.getElementById("system").style.display = "none";
        document.getElementById("loginBox").style.display = "block";
        alert("تم حذف الحساب بنجاح.");
    }
}

// إعادة ضبط الحضور اليومي
function resetAttendance() {
    for (let h in currentUser.halaqat) {
        currentUser.halaqat[h].forEach(student => {
            student.status = "—";
            student.date = "—";
            student.absenceLog = student.absenceLog || []; // سجل الغياب
        });
    }
}

// حفظ بيانات المستخدم
function save() {
    if (!currentUser) return;
    users = users.map(u => u.username === currentUser.username ? currentUser : u);
    localStorage.setItem("users", JSON.stringify(users));
}

// إدارة الحلقات
function addHalaqa() {
    let name = document.getElementById("halaqaName").value.trim();
    if (!name) return alert("اكتب اسم الحلقة");
    if (!currentUser.halaqat[name]) {
        currentUser.halaqat[name] = [];
        save();
        loadHalaqat();
        document.getElementById("halaqaName").value = "";
        alert("تم إنشاء الحلقة بنجاح");
    } else alert("الحلقة موجودة مسبقًا");
}

function loadHalaqat() {
    let select = document.getElementById("halaqaSelect");
    select.innerHTML = `<option value="">-- اختر الحلقة --</option>`;
    for (let h in currentUser.halaqat) select.innerHTML += `<option value="${h}">${h}</option>`;
}

function changeHalaqa() { 
    currentHalaqa = document.getElementById("halaqaSelect").value; 
    render(); 
}

// إضافة طالب والتحقق من رقم يمني
function addStudent() {
    if (!currentHalaqa) return alert("اختر الحلقة أولًا");
    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();

    if (!name || !phone) return alert("أدخل اسم الطالب ورقم ولي الأمر");

    // التحقق من أن الرقم اليمني يحتوي على 9 أرقام فقط
    if (!/^\d{9}$/.test(phone)) return alert("أدخل رقم يمني صحيح مكون من 9 أرقام");

    currentUser.halaqat[currentHalaqa].push({ 
        name, 
        phone, 
        status: "—", 
        date: "—", 
        absenceLog: [] 
    });

    save(); 
    render();

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
}



// تسجيل الحضور
function markPresent(i) {
    let s = currentUser.halaqat[currentHalaqa][i]; 
    s.status = "حاضر"; 
    s.date = new Date().toLocaleDateString("ar-EG"); 
    save(); 
    render(); 
}

// تسجيل الغياب وإضافة للسجل
function markAbsent(i) {
    let s = currentUser.halaqat[currentHalaqa][i]; 
    let date = new Date().toLocaleDateString("ar-EG");
    s.status = "غائب"; 
    s.date = date;
    s.absenceLog.push(date); // إضافة تاريخ الغياب للسجل

    let msg = `السلام عليكم،\nنود إشعاركم بغياب الطالب ${s.name}\nعن حلقة أنوار التلاوة\nبتاريخ ${date}.\nجزاكم الله خيرًا.`;
    window.open(`https://wa.me/${s.phone}?text=${encodeURIComponent(msg)}`, "_blank");

    save(); render();
}

// حذف طالب
function deleteStudent(i){
    if(confirm("هل أنت متأكد من حذف الطالب؟")) {
        currentUser.halaqat[currentHalaqa].splice(i,1); 
        save(); 
        render(); 
    }
}

// عرض جدول الطلاب
function render() {
    let table=document.getElementById("table");
    table.innerHTML="";
    if(!currentHalaqa) return;

    currentUser.halaqat[currentHalaqa].forEach((s,i)=>{
        table.innerHTML+=`<tr>
            <td>${s.name}</td>
            <td class="${s.status==='غائب'?'absent':s.status==='حاضر'?'present':''}">${s.status}</td>
            <td>${s.date}</td>
            <td>
                <button onclick="markPresent(${i})">✔ حاضر</button>
                <button onclick="markAbsent(${i})">✖ غائب</button>
                <button onclick="deleteStudent(${i})">🗑 حذف</button>
                <button class="actionsBtn" onclick="showStudentReport(${i})">…</button>
            </td>
        </tr>`;
    });
}

// عرض تقرير الطالب الأسبوعي
function showStudentReport(index){
    const student = currentUser.halaqat[currentHalaqa][index];
    document.getElementById("system").style.display = "none";
    document.getElementById("studentReport").style.display = "block";
    document.getElementById("reportStudentName").innerText = "الطالب: " + student.name;

    let tbody = document.getElementById("reportTable");
    tbody.innerHTML = "";
    student.absenceLog.forEach(date => {
        tbody.innerHTML += `<tr><td>${date}</td><td>غائب</td></tr>`;
    });
}

// العودة للصفحة الرئيسية
function backToMain(){
    document.getElementById("studentReport").style.display = "none";
    document.getElementById("weeklyReport").style.display = "none";
    document.getElementById("system").style.display = "block";
    render();
}

// عرض تقرير الحلقة الأسبوعي
function showWeeklyReport(){
    if(!currentHalaqa) return alert("اختر الحلقة أولًا");
    document.getElementById("system").style.display = "none";
    document.getElementById("weeklyReport").style.display = "block";
    document.getElementById("reportCircleName").innerText = "الحلقة: " + currentHalaqa;

    let tbody = document.getElementById("weeklyReportTable");
    tbody.innerHTML = "";
    currentUser.halaqat[currentHalaqa].forEach(student => {
        tbody.innerHTML += `<tr>
            <td>${student.name}</td>
            <td>${student.absenceLog.length}</td>
            <td>${student.absenceLog.join(", ")}</td>
        </tr>`;
    });
}







