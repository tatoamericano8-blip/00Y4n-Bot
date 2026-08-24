import mongoose from 'mongoose';

const ticketBlacklistSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    motivo: { type: String, required: true },
    aplicadoPor: { type: String, required: true },
    permanente: { type: Boolean, default: true },
    expiraEn: { type: Date, default: null },
    aplicadoEn: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ticketBlacklistSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.model('TicketBlacklist', ticketBlacklistSchema);
