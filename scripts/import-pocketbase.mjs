#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const subjectsCsvPath = path.join(rootDir, 'data', 'subjects.csv');
const studentsCsvPath = path.join(rootDir, 'data', 'students.csv');

const requiredEnv = ['POCKETBASE_URL', 'POCKETBASE_ADMIN_EMAIL', 'POCKETBASE_ADMIN_PASSWORD'];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`✖️  Variable ${key} manquante dans .env`);
    process.exit(1);
  }
});

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function authAdmin() {
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD,
  );
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

async function clearCollection(name) {
  const records = await pb.collection(name).getFullList({ batch: 200 });
  for (const record of records) {
    await pb.collection(name).delete(record.id);
  }
}

async function seedSubjects(rows) {
  for (const row of rows) {
    await pb.collection('subjects').create({
      code: row.code,
      titre: row.titre,
      specialite: row.specialite,
      type_sujet: row.type_sujet,
      encadrant: row.encadrant,
      disponible: String(row.disponible ?? 'true').toLowerCase() !== 'false',
      description: row.description,
    });
  }
}

async function seedStudents(rows) {
  for (const row of rows) {
    await pb.collection('students').create({
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      specialite: row.specialite,
      moyenne: Number(row.moyenne || 0),
      email: row.email,
      phone: row.phone,
      active: true,
    });
  }
}

async function main() {
  console.log('🔐 Authentification admin PocketBase…');
  await authAdmin();

  console.log('🧹 Réinitialisation des collections subjects/students…');
  await Promise.all([clearCollection('subjects'), clearCollection('students')]);

  console.log('📥 Lecture CSV…');
  const subjectsRows = readCsv(subjectsCsvPath);
  const studentsRows = readCsv(studentsCsvPath);

  console.log(`➕ Insertion ${subjectsRows.length} sujets`);
  await seedSubjects(subjectsRows);

  console.log(`➕ Insertion ${studentsRows.length} étudiants`);
  await seedStudents(studentsRows);

  console.log('✅ Import terminé.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Import échoué', err);
  process.exit(1);
});
