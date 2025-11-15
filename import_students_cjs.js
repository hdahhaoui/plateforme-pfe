// import_students.js (version CommonJS, sans "import")
// -----------------------------------------------------
// Prérequis :
//   - Node.js 18+ (fetch disponible globalement)
//   - PocketBase lancé : http://127.0.0.1:8090
//   - Fichier students_all.csv dans le même dossier
//   - Collection "students" existante dans PocketBase
//
// Utilisation :
//   node import_students.js
// -----------------------------------------------------

const fs = require("fs");
const path = require("path");

// À adapter
const BASE_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "dahhaoui.h@gmail.com";
const ADMIN_PASSWORD = "090561-Hic2018"; // <-- à remplacer

const CSV_PATH = path.join(__dirname, "students_all.csv");

// Connexion admin (superuser)
async function adminLogin() {
  console.log("🔐 Connexion admin PocketBase...");
  const res = await fetch(
    BASE_URL + "/api/collections/_superusers/auth-with-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `Échec de connexion admin (${res.status}): ${txt || res.statusText}`
    );
  }

  const data = await res.json();
  console.log("✅ Connexion admin OK.");
  return data.token;
}

// Lecture et parsing simple du CSV
function parseCSV(csvPath) {
  console.log("📄 Lecture du CSV :", csvPath);
  if (!fs.existsSync(csvPath)) {
    throw new Error("Fichier introuvable : " + csvPath);
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV vide ou sans données.");
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const idx = {
    matricule: header.indexOf("matricule"),
    nom: header.indexOf("nom"),
    prenom: header.indexOf("prenom"),
    specialite: header.indexOf("specialite"),
    moyenne: header.indexOf("moyenne"),
  };

  for (const [k, v] of Object.entries(idx)) {
    if (v === -1) {
      throw new Error("Colonne manquante dans le CSV : " + k);
    }
  }

  const records = lines.slice(1).map((line, i) => {
    const cols = line.split(",");
    return {
      matricule: cols[idx.matricule]?.trim(),
      nom: cols[idx.nom]?.trim(),
      prenom: cols[idx.prenom]?.trim(),
      specialite: cols[idx.specialite]?.trim(),
      moyenne: parseFloat((cols[idx.moyenne] || "0").replace(",", ".")),
      _line: i + 2,
    };
  });

  console.log(`➡️  ${records.length} étudiants trouvés.`);
  return records;
}

// Création d'un étudiant
async function createStudent(token, student) {
  const body = {
    matricule: student.matricule,
    nom: student.nom,
    prenom: student.prenom,
    specialite: student.specialite,
    moyenne: student.moyenne,
  };

  const res = await fetch(
    BASE_URL + "/api/collections/students/records",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `Erreur création étudiant (ligne ${student._line}, matricule ${student.matricule}) : ${res.status} ${txt}`
    );
  }
}

// Programme principal
async function main() {
  try {
    const token = await adminLogin();
    const students = parseCSV(CSV_PATH);

    console.log("\n🚀 Début import dans 'students'...\n");

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      console.log(
        `➕ [${i + 1}/${students.length}] ${s.matricule} - ${s.nom} ${s.prenom} (${s.specialite})`
      );
      await createStudent(token, s);
    }

    console.log("\n🎉 Import terminé avec succès.");
  } catch (err) {
    console.error("❌ Erreur pendant l'import :", err.message || err);
  }
}

main();
