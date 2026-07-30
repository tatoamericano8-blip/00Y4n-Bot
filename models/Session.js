import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  hostId: { type: String, required: true },
  coHostIds: [{ type: String }],
  supervisorId: { type: String, default: null },
  
  estado: { 
    type: String, 
    enum: ['ANUNCIADA', 'EARLY_ACCESS', 'LIBERADA', 'REINVITE', 'FINALIZADA', 'CANCELADA'], 
    default: 'ANUNCIADA' 
  },
  
  codigoServidor: { type: String, default: '' },
  linkServidor: { type: String, default: '' },
  
  inicio: { type: Date, default: Date.now },
  fin: { type: Date, default: null },
  duracionMinutos: { type: Number, default: 0 },
  
  blacklistSesion: [{ type: String }] // IDs de usuarios vetados de esta sesión
});

export default mongoose.model('Session', sessionSchema);
