export const name = 'messageReactionRemove';

export async function execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) {
        try { await reaction.fetch(); } catch (error) { return; }
    }

    if (reaction.emoji.name === '✅' && global.mapaVotos && global.mapaVotos.has(reaction.message.id)) {
        global.mapaVotos.get(reaction.message.id).delete(user.id);
        console.log(`[00Y4n Votos] Voto removido para ${user.username}`);
    }
}
