import mongoose from 'mongoose';

const investigacionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    motivo: { type: String, required: true },
    iniciadoPor: { type: String, required: true },
    finalizadoPor: { type: String, default: null },
    rolesGuardados: { type: [String], default: [] },
    activa: { type: Boolean, default: true, index: true },
    iniciadoEn: { type: Date, default: Date.now },
    finalizadoEn: { type: Date, default: null }
  },
  { timestamps: true }
);

investigacionSchema.index({ guildId: 1, userId: 1, activa: 1 });

export default mongoose.models.Investigacion ||
  mongoose.model('Investigacion', investigacionSchema);
