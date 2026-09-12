import { EMOJI_DEF } from '../config/emojis.js';
export default {
    name: 'messageReactionRemove',
    async execute(reaction, user) {
        if (user.bot) return;
        if (reaction.partial) {
            try { await reaction.fetch(); } catch (error) { return; }
        }

        const esTildeVoto = reaction.emoji.id === EMOJI_DEF.tilde.id || reaction.emoji.name === '✅' || reaction.emoji.name === 'tilde' || reaction.emoji.name === 'nara_tilde' || reaction.emoji.name === 'cielo_tilde';
        if (esTildeVoto && global.mapaVotos && global.mapaVotos.has(reaction.message.id)) {
            global.mapaVotos.get(reaction.message.id).delete(user.id);
            console.log(`[00Y4n Votos] Voto removido para ${user.username}`);
        }
    }
};
