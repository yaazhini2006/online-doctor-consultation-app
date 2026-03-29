const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function seedData() {
  const patientPassword = await bcrypt.hash('password123', 10);
  const doctorPassword = await bcrypt.hash('password123', 10);

  db.serialize(() => {
    // Insert Patient
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role, speciality) VALUES (?, ?, ?, ?, ?)`,
      ['John Doe', 'patient@example.com', patientPassword, 'patient', null],
      (err) => {
        if (err) console.error("Error inserting patient:", err.message);
        else console.log("Patient created.");
      }
    );

    // Insert Doctor
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role, speciality) VALUES (?, ?, ?, ?, ?)`,
      ['Dr. Smith', 'doctor@example.com', doctorPassword, 'doctor', 'Cardiologist'],
      (err) => {
        if (err) console.error("Error inserting doctor:", err.message);
        else console.log("Doctor created.");
      }
    );
  });
}

seedData();
