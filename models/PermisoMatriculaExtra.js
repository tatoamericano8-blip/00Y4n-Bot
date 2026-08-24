import mongoose from 'mongoose';

const permisoMatriculaExtraSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    extraSlots: { type: Number, required: true, min: 0, default: 0 },
    otorgadoPor: { type: String, default: null },
    otorgadoEn: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

permisoMatriculaExtraSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.model('PermisoMatriculaExtra', permisoMatriculaExtraSchema);
