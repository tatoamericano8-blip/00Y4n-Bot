import mongoose from 'mongoose';

const staffLogSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  tipo: {
    type: String,
    enum: [
      'STRIKE_ADD',
      'STRIKE_REMOVE',
      'DESPIDO',
      'RENUNCIA',
      'LOA_INICIO',
      'LOA_FIN',
      'LOA_APROBADA',
      'LOA_RECHAZADA',
      'HANDPICK',
      'PREMIO',
      'SESION_LOG',
      'CUOTA_RESET',
      'CUOTA_REMOVIDA',
      'CUOTA_SUMADA',
      'TICKET_CERRADO'
    ],
    required: true
  },
  targetUserId: { type: String, required: true },
  executorId: { type: String, required: true },
  detalles: { type: mongoose.Schema.Types.Mixed },
  fecha: { type: Date, default: Date.now }
});

export default mongoose.models.StaffLog || mongoose.model('StaffLog', staffLogSchema);
