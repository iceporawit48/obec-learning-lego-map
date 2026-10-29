# กลุ่มวิจัยและพัฒนาองค์กรแห่งการเรียนรู้ (สพฐ.)
## 🇹🇭 Thailand Geospatial Interactive Map & PLC Ecosystem (Cyber HUD Theme)

ระบบแผนที่ประเทศไทยแบบ Interactive แสดงผลข้อมูลโครงสร้าง 4 รูปแบบ Node ของกลุ่มวิจัยและพัฒนาองค์กรแห่งการเรียนรู้ สำนักพัฒนานวัตกรรมการจัดการศึกษา สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)

---

### ✨ ฟีเจอร์หลัก (Core Features)

1. **Interactive 77 Provinces Map**: แผนที่เวกเตอร์ประเทศไทย 77 จังหวัด พร้อมระบบ Pan, Zoom และค้นหา
2. **4-Node Telemetry System**:
   - 🔴 **รูปแบบที่ 1 (Area Node)**: สพท. ที่มีศักยภาพและพร้อมพัฒนา (9 เขต)
   - 🟡 **รูปแบบที่ 2 (School Node)**: โรงเรียนต้นแบบ (6 โรงเรียน: 4 เดิม + 2 ใหม่ 2568)
   - 🟢 **รูปแบบที่ 3 (Co-School Node)**: เครือข่ายโรงเรียนร่วมพัฒนา (2 เครือข่าย รวม 9 โรงเรียน)
   - 🔵 **รูปแบบที่ 4 (Lead Area Node)**: สพท. แกนนำขับเคลื่อนองค์กรแห่งการเรียนรู้ (16 เขต)
3. **Futuristic Cyber HUD Design**: ธีม Dark Holographic คมชัด พร้อมเอฟเฟกต์สะเก็ดไฟพลาสมา (Sparks Ignition)
4. **Direct External Connections**:
   - 📚 คลังคู่มือ: [TLD Teacher Academy](https://tld-teacher-academy.vercel.app/)
   - 📄 เอกสารงานเขต (Google Drive): รร.เตรียมพัฒน์ ขอนแก่น
   - 🌐 เว็บไซต์โรงเรียน: [www.tupkk.ac.th](https://www.tupkk.ac.th/)
5. **หน้ารายงานผลการดำเนินงาน 2569 (`reports.html`)**:
   - 📘 รายงาน IMSO 2026 (24 ผู้แทนนักเรียนไทย)
   - 📗 รายงานโครงการพัฒนานวัตกรรม 2569 (10 นวัตกรรมสถานศึกษา)

---

### 🚀 การรันบน GitHub Pages (Online Free Hosting)

1. สร้าง Repository ใหม่บน GitHub เช่น `obec-learning-map`
2. อัปโหลดไฟล์ทั้งหมดขึ้น Repository
3. ไปที่แท็บ **Settings** > **Pages**
4. ในส่วน **Branch** เลือก `main` หรือ `master` แล้วกด **Save**
5. รอ 1-2 นาที จะได้ลิงก์เว็บไซต์ เช่น `https://<your-username>.github.io/obec-learning-map/`

---

### 💻 การรันบนเครื่อง Local

- **Windows**: ดับเบิลคลิกที่ไฟล์ `start.bat` หรือดับเบิลคลิก `index.html` เพื่อเปิดใช้งานได้ทันที
- **Terminal (Python)**:
  ```bash
  python -m http.server 8080
  ```
  เข้าชมผ่าน `http://localhost:8080/index.html`
