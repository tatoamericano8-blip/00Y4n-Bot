import TicketBlacklist from '../../models/TicketBlacklist.js';

export async function estaEnListaNegraTickets(guildId, userId) {
  const doc = await TicketBlacklist.findOne({ guildId, userId });
  if (!doc) return null;
  if (!doc.permanente && doc.expiraEn && doc.expiraEn.getTime() <= Date.now()) {
    await TicketBlacklist.deleteOne({ _id: doc._id });
    return null;
  }
  return doc;
}
