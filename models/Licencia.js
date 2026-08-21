import mongoose from 'mongoose';

const LicenciaSchema = new mongoose.Schema({
  usuario_id: { type: String, required: true, unique: true },
  estado: {
    type: String,
    enum: ['Activa', 'Suspendida', 'Revocada', 'Sin licencia'],
    default: 'Sin licencia'
  },
  /** Como obtuvo la licencia: examen (tramitó tras aprobar) | compra (tienda express) | policial */
  metodo: {
    type: String,
    enum: ['examen', 'compra', 'policial', null],
    default: null
  },
  oficial_id: { type: String },
  motivo: { type: String, default: 'Sin motivo especificado' },
  fecha: { type: Date, default: Date.now },
  fechaEmision: { type: Date },
  /** Timestamp hasta el cual vale el examen aprobado (para tramitar) */
  examenAprobadoHasta: { type: Date },
  /** Puntos de la última aprobación (0-100) */
  examenPuntaje: { type: Number },
  /** Cooldown próximo intento de examen */
  examenCooldownHasta: { type: Date },
  puntos: { type: Number, default: 12 }
});

export default mongoose.models.Licencia || mongoose.model('Licencia', LicenciaSchema);
