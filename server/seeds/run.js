const sql = require('mssql');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'clinipay',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

async function seed() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server');

    // Seed admin user
    const adminExists = await pool.request()
      .input('email', sql.NVarChar, 'admin@clinipay.com')
      .query('SELECT id FROM users WHERE email = @email');

    if (adminExists.recordset.length === 0) {
      const passwordHash = await bcrypt.hash('CliniPay2025!', 12);
      await pool.request()
        .input('email', sql.NVarChar, 'admin@clinipay.com')
        .input('password_hash', sql.NVarChar, passwordHash)
        .input('first_name', sql.NVarChar, 'Admin')
        .input('last_name', sql.NVarChar, 'CLINIPAY')
        .input('role', sql.NVarChar, 'admin')
        .input('email_verified', sql.Bit, 1)
        .query(`INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
                VALUES (@email, @password_hash, @first_name, @last_name, @role, @email_verified)`);
      console.log('✓ Admin user created (admin@clinipay.com / CliniPay2025!)');
    } else {
      console.log('→ Admin user already exists, skipping');
    }

    // Seed sample packages
    const packagesExist = await pool.request()
      .query('SELECT COUNT(*) as cnt FROM packages');

    if (packagesExist.recordset[0].cnt === 0) {
      const packages = [
        {
          name_es: 'Chequeo General Completo',
          name_en: 'Complete General Checkup',
          description_es: 'Paquete integral de chequeo médico que incluye evaluación completa de tu estado de salud actual.',
          description_en: 'Comprehensive medical checkup package that includes a complete evaluation of your current health status.',
          price: 150.00,
          currency: 'USD',
          includes_es: JSON.stringify(['Consulta médica general', 'Examen de sangre completo (hemograma)', 'Examen de orina', 'Medición de presión arterial', 'Evaluación de índice de masa corporal', 'Informe médico con resultados']),
          includes_en: JSON.stringify(['General medical consultation', 'Complete blood test (CBC)', 'Urinalysis', 'Blood pressure measurement', 'Body mass index evaluation', 'Medical report with results']),
          display_order: 1,
        },
        {
          name_es: 'Paquete Maternidad Básico',
          name_en: 'Basic Maternity Package',
          description_es: 'Paquete diseñado para el seguimiento prenatal básico durante el embarazo.',
          description_en: 'Package designed for basic prenatal monitoring during pregnancy.',
          price: 350.00,
          currency: 'USD',
          includes_es: JSON.stringify(['Consulta ginecológica', 'Ultrasonido obstétrico', 'Exámenes de laboratorio prenatales', 'Control de presión arterial', 'Monitoreo de peso y talla']),
          includes_en: JSON.stringify(['Gynecological consultation', 'Obstetric ultrasound', 'Prenatal laboratory tests', 'Blood pressure monitoring', 'Weight and height monitoring']),
          display_order: 2,
        },
        {
          name_es: 'Evaluación Cardiológica',
          name_en: 'Cardiology Evaluation',
          description_es: 'Evaluación completa del sistema cardiovascular para detectar factores de riesgo.',
          description_en: 'Complete cardiovascular system evaluation to detect risk factors.',
          price: 275.00,
          currency: 'USD',
          includes_es: JSON.stringify(['Consulta con cardiólogo', 'Electrocardiograma', 'Ecocardiograma', 'Prueba de esfuerzo', 'Perfil lipídico completo', 'Informe cardiológico']),
          includes_en: JSON.stringify(['Cardiologist consultation', 'Electrocardiogram', 'Echocardiogram', 'Stress test', 'Complete lipid profile', 'Cardiology report']),
          display_order: 3,
        },
        {
          name_es: 'Paquete Dental Premium',
          name_en: 'Premium Dental Package',
          description_es: 'Atención dental completa que incluye limpieza profunda y evaluación integral.',
          description_en: 'Complete dental care including deep cleaning and comprehensive evaluation.',
          price: 120.00,
          currency: 'USD',
          includes_es: JSON.stringify(['Consulta odontológica', 'Limpieza dental profunda', 'Radiografía panorámica', 'Aplicación de flúor', 'Plan de tratamiento personalizado']),
          includes_en: JSON.stringify(['Dental consultation', 'Deep dental cleaning', 'Panoramic X-ray', 'Fluoride application', 'Personalized treatment plan']),
          display_order: 4,
        },
      ];

      for (const pkg of packages) {
        await pool.request()
          .input('name_es', sql.NVarChar, pkg.name_es)
          .input('name_en', sql.NVarChar, pkg.name_en)
          .input('description_es', sql.NVarChar, pkg.description_es)
          .input('description_en', sql.NVarChar, pkg.description_en)
          .input('price', sql.Decimal(10, 2), pkg.price)
          .input('currency', sql.NVarChar, pkg.currency)
          .input('includes_es', sql.NVarChar, pkg.includes_es)
          .input('includes_en', sql.NVarChar, pkg.includes_en)
          .input('display_order', sql.Int, pkg.display_order)
          .query(`INSERT INTO packages (name_es, name_en, description_es, description_en, price, currency, includes_es, includes_en, display_order)
                  VALUES (@name_es, @name_en, @description_es, @description_en, @price, @currency, @includes_es, @includes_en, @display_order)`);
      }
      console.log('✓ Sample packages created (4 packages)');
    } else {
      console.log('→ Packages already exist, skipping');
    }

    console.log('\nSeed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

seed();
