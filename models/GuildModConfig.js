import mongoose from 'mongoose';

/** Config de moderación por guild (rol restringido, etc.) */
const guildModConfigSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true },
    rolRestringidoId: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('GuildModConfig', guildModConfigSchema);
