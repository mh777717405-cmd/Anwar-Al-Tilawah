let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = null;
let currentHalaqa = "";

// إظهار/إخفاء كلمة المرور
function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
}

// إظهار نموذج التسجيل
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
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        alert("تم حذف الحساب بنجاح.");
    }
}

// إعادة ضبط الحضور كل يوم
function resetAttendance() {
    for (let h in currentUser.halaqat) {
        currentUser.halaqat[h].forEach(student => {
            student.status = "—";
            student.date = "—";
        });
    }
}

// حفظ بيانات المستخدم الحالي
function save() {
    if (!currentUser) return;
    users = users.map(u => u.username === currentUser.username ? currentUser : u);
    localStorage.setItem("users", JSON.stringify(users));
}

/* إدارة الحلقات والطلاب */
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

function changeHalaqa() { currentHalaqa = document.getElementById("halaqaSelect").value; render(); }

function addStudent() {
    if (!currentHalaqa) return alert("اختر الحلقة أولًا");
    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    if (!name || !phone) return alert("أدخل اسم الطالب ورقم ولي الأمر");

    currentUser.halaqat[currentHalaqa].push({ name, phone, status: "—", date: "—" });
    save(); render();
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
}

function markPresent(i) { let s = currentUser.halaqat[currentHalaqa][i]; s.status="حاضر"; s.date=new Date().toLocaleDateString("ar-EG"); save(); render(); }

function markAbsent(i) {
    let s=currentUser.halaqat[currentHalaqa][i]; let date=new Date().toLocaleDateString("ar-EG");
    s.status="غائب"; s.date=date;
    let msg=`السلام عليكم،\nنود إشعاركم بغياب الطالب ${s.name}\nعن حلقة أنوار القرآن\nبتاريخ ${date}.\nجزاكم الله خيرًا.`;
    window.open(`https://wa.me/${s.phone}?text=${encodeURIComponent(msg)}`, "_blank");
    save(); render();
}

function deleteStudent(i){ if(confirm("هل أنت متأكد من حذف الطالب؟")) { currentUser.halaqat[currentHalaqa].splice(i,1); save(); render(); } }

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
            </td>
        </tr>`;
    });
}






