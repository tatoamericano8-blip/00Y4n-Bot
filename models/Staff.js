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
    horasServicio: { type: Number, default: 0 },
    sesionesOrganizadas: { type: Number, default: 0 }
  },
  ingreso: { type: Date, default: Date.now }
});

export default mongoose.model('Staff', staffSchema);
