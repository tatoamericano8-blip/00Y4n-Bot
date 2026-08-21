import mongoose from 'mongoose';

const LicenciaSchema = new mongoose.Schema({
  usuario_id: { type: String, required: true, unique: true },
  estado: {
    type: String,
    enum: ['Activa', 'Suspendida', 'Revocada', 'Sin licencia'],
    default: 'Sin licencia'
  },
  /** Como obtuvo la licencia: examen | compra | policial | recuperacion */
  metodo: {
    type: String,
    enum: ['examen', 'compra', 'policial', 'recuperacion', null],
    default: null
  },
  oficial_id: { type: String },
  motivo: { type: String, default: 'Sin motivo especificado' },
  fecha: { type: Date, default: Date.now },
  fechaEmision: { type: Date },
  examenAprobadoHasta: { type: Date },
  examenPuntaje: { type: Number },
  examenCooldownHasta: { type: Date },
  puntos: { type: Number, default: 12 }
});

export default mongoose.models.Licencia || mongoose.model('Licencia', LicenciaSchema);
