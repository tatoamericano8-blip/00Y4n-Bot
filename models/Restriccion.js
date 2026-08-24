import mongoose from 'mongoose';

const restriccionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    motivo: { type: String, required: true },
    aplicadoPor: { type: String, required: true },
    rolesGuardados: { type: [String], default: [] },
    permanente: { type: Boolean, default: false },
    expiraEn: { type: Date, default: null },
    activa: { type: Boolean, default: true },
    aplicadoEn: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

restriccionSchema.index({ guildId: 1, userId: 1, activa: 1 });

export default mongoose.model('Restriccion', restriccionSchema);
