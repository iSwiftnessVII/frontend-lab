const fs = require('fs');
const path = require('path');

// Rutas
const srcProd = path.join(__dirname, '..', 'public', 'env.prod.js');
const destEnv = path.join(__dirname, '..', 'dist', 'frontend-lab', 'browser', 'env.js');

console.log('Copiando configuración de producción...');
console.log('Origen:', srcProd);
console.log('Destino:', destEnv);

try {
  if (fs.existsSync(srcProd)) {
    fs.copyFileSync(srcProd, destEnv);
    console.log('✓ Configuración de producción copiada exitosamente');
  } else {
    console.warn('⚠ Archivo env.prod.js no encontrado, usando env.js por defecto');
  }
} catch (error) {
  console.error('✗ Error al copiar configuración:', error.message);
  process.exit(1);
}
