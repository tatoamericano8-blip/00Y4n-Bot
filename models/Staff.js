import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  rango: { type: String, default: 'Staff Trainee' },
  strikes: [
    {
      motivo: String,
      fecha: { type: Date, default: Date.now },
      aplicadoPor: String
    }
  ],
  loa: {
    activo: { type: Boolean, default: false },
    inicio: Date,
    fin: Date,
    motivo: String
  },
  cuotas: {
    // Registro de actividad real de la semana
    horasServicio: { type: Number, default: 0 },
    sesionesOrganizadas: { type: Number, default: 0 },
    // Metas semanales exigidas a este usuario
    horasMeta: { type: Number, default: 3 },
    sesionesMeta: { type: Number, default: 2 }
  },
  ingreso: { type: Date, default: Date.now }
});

export default mongoose.model('Staff', staffSchema);
