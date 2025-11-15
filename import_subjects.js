// import_subjects.js (CommonJS)
// ----------------------------------------------
// Importe les sujets de PFE à partir du fichier subjects_all.csv
// dans la collection "subjects" de PocketBase.
//
// Prérequis :
//   - PocketBase lancé sur http://127.0.0.1:8090
//   - Collection "subjects" avec les champs :
//       code (text)
//       titre (text)
//       description (text)
//       encadrant (text)
//       specialite (text)
//       type_sujet (text ou select)
//       disponible (bool)
//   - Fichier subjects_all.csv dans le même dossier que ce script
//
// Utilisation :
//   node import_subjects.js
// ----------------------------------------------

const fs = require("fs");
const path = require("path");

const BASE_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "dahhaoui.h@gmail.com";
const ADMIN_PASSWORD = "090561-Hic2018"; // <-- à modifier

const CSV_PATH = path.join(__dirname, "subjects_all.csv");

// Connexion admin (superuser)
async function adminLogin() {
  console.log("🔐 Connexion admin PocketBase (pour sujets)...");
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

// Lecture CSV simple
function parseCSV(csvPath) {
  console.log("📄 Lecture du CSV sujets :", csvPath);
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
    code: header.indexOf("code"),
    titre: header.indexOf("titre"),
    description: header.indexOf("description"),
    encadrant: header.indexOf("encadrant"),
    specialite: header.indexOf("specialite"),
    type_sujet: header.indexOf("type_sujet"),
    disponible: header.indexOf("disponible"),
  };

  for (const [k, v] of Object.entries(idx)) {
    if (v === -1) {
      throw new Error("Colonne manquante dans le CSV : " + k);
    }
  }

  const records = lines.slice(1).map((line, i) => {
    const cols = line.split(",");
    return {
      code: cols[idx.code]?.trim(),
      titre: cols[idx.titre]?.trim(),
      description: cols[idx.description]?.trim(),
      encadrant: cols[idx.encadrant]?.trim(),
      specialite: cols[idx.specialite]?.trim(),
      type_sujet: cols[idx.type_sujet]?.trim(),
      disponible: (cols[idx.disponible] || "true").trim().toLowerCase() === "true",
      _line: i + 2,
    };
  });

  console.log(`➡️  ${records.length} sujets trouvés.`);
  return records;
}

// Création d'un sujet
async function createSubject(token, s) {
  const body = {
    code: s.code,
    titre: s.titre,
    description: s.description,
    encadrant: s.encadrant,
    specialite: s.specialite,
    type_sujet: s.type_sujet,
    disponible: s.disponible,
  };

  const res = await fetch(
    BASE_URL + "/api/collections/subjects/records",
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
      `Erreur création sujet (ligne ${s._line}, code ${s.code}) : ${res.status} ${txt}`
    );
  }
}

// Programme principal
async function main() {
  try {
    const token = await adminLogin();
    const subjects = parseCSV(CSV_PATH);

    console.log("\n🚀 Début import dans 'subjects'...\n");

    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      console.log(
        `➕ [${i + 1}/${subjects.length}] ${s.code} - ${s.titre} (${s.specialite}, ${s.type_sujet})`
      );
      await createSubject(token, s);
    }

    console.log("\n🎉 Import des sujets terminé avec succès.");
  } catch (err) {
    console.error("❌ Erreur pendant l'import des sujets :", err.message || err);
  }
}

main();
