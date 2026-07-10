import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';

// --- DICCIONARIO DE EMOJIS (00Y4n) ---
const EMOJIS = {
    mov: '<a:mov:1520905604720496843>',
    espe: '<a:espe:1520905696697389227>'
};

export default {
    data: {
        name: 'regenerar_meet_swfl',
        description: 'Anuncia que el link del Car Meet ha sido modificado o regenerado.',
        options: [
            {
                name: 'contador',
                description: '¿Cuántas veces se regeneró el link en este meet? (Ej: 1, 2, 3...)',
                type: ApplicationCommandOptionType.Integer,
                required: true
            },
            {
                name: 'usuario',
                description: 'Selecciona al Host que regeneró el link (si lo dejas vacío, te pondrá a ti).',
                type: ApplicationCommandOptionType.User,
                required: false
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de Link Regenerado para el Meet (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Solo el Staff puede usar este comando
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede anunciar la regeneración de links.', 
                ephemeral: true 
            });
        }

        const contador = interaction.options.getInteger('contador');
        const usuarioStaff = interaction.options.getUser('usuario') || interaction.user;
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        // 🔒 LÓGICA ANTI-LEAKS: Buscamos el último lanzamiento de Meet y bloqueamos su botón
        const ultimoMsgId = global.ultimaSesionMeet;
        if (ultimoMsgId) {
            try {
                const antiguoMsg = await interaction.channel.messages.fetch(ultimoMsgId);
                if (antiguoMsg) {
                    const componentesModificados = antiguoMsg.components.map(row => {
                        const nuevaFila = ActionRowBuilder.from(row);
                        nuevaFila.components.forEach(componente => {
                            // Deshabilitamos el botón y cambiamos el texto a bloqueado
                            componente.setDisabled(true);
                            componente.setLabel('🔒 Link Regenerated');
                        });
                        return nuevaFila;
                    });

                    // Editamos el mensaje antiguo borrando el acceso
                    await antiguoMsg.edit({ components: componentesModificados });
                }
            } catch (error) {
                console.log('No se pudo editar el mensaje anterior (puede que haya pasado mucho tiempo o fue eliminado).');
            }
        }

        // Armamos el Embed del nuevo aviso
        const textoDescripcion = `${EMOJIS.mov} <@${usuarioStaff.id}> ha **regenerado el link del Car Meet (x${contador})**! Por favor, sean pacientes mientras se acomodan los cupos en el servidor. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;

        const embedRegenMeet = new EmbedBuilder()
            .setTitle(`${EMOJIS.espe} SWFL Car Meet | Link Regenerado ${EMOJIS.espe}`)
            .setDescription(textoDescripcion)
            .setColor('#ff6600');

        if (fotoAdjunta) embedRegenMeet.setImage(fotoAdjunta.url);

        await interaction.reply({ content: 'Modificando el botón anterior y enviando nuevo aviso...', ephemeral: true });

        // Enviamos el aviso limpio al canal
        await interaction.channel.send({ embeds: [embedRegenMeet] });
    }
};
