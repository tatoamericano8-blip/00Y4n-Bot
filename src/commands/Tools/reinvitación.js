import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

export default {
    data: {
        name: 'reinvitacion',
        description: 'Abre una votación para liberar reinvitaciones y publica automáticamente el embed con el link al llegar a la meta.',
        options: [
            { 
                name: 'mensaje_id', 
                description: 'ID del mensaje de lanzamiento (Lanzar RP o Lanzar Meet) de esta sesión.', 
                type: ApplicationCommandOptionType.String, 
                required: true 
            },
            { 
                name: 'votos', 
                description: 'Cantidad de votos/reacciones necesarias para abrir las reinvitaciones.', 
                type: ApplicationCommandOptionType.Integer, 
                required: true 
            },
            { 
                name: 'emoji', 
                description: 'El emoji que los usuarios usarán para votar (ej: ✅, 🔥, <:mi_emoji:123456789>).', 
                type: ApplicationCommandOptionType.String, 
                required: true 
            },
            { 
                name: 'imagen', 
                description: 'Link de la foto/banner opcional para el anuncio.', 
                type: ApplicationCommandOptionType.String, 
                required: false 
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo de Staff
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1519476959606734998> **No tienes permisos:** Solo el Staff puede lanzar reinvitaciones.',
                ephemeral: true
            });
        }

        const idLanzamiento = interaction.options.getString('mensaje_id');
        const votosRequeridos = interaction.options.getInteger('votos');
        const emojiVoto = interaction.options.getString('emoji');
        const urlImagen = interaction.options.getString('imagen');

        // Buscamos la sesión guardada previamente con /lanzar_rp o /lanzar_meet_swfl
        const sesion = global.coleccionSesiones.get(idLanzamiento);

        if (!sesion) {
            return await interaction.reply({
                content: '<:cruz00y4n:1519476959606734998> **Error:** No se encontraron registros de esa sesión. Asegúrate de colocar la ID del mensaje de lanzamiento de la sesión (`/lanzar_rp` o `/lanzar_meet_swfl`).',
                ephemeral: true
            });
        }

        await interaction.reply({ content: 'Iniciando votación de reinvitaciones...', ephemeral: true });

        // Mención de rol según el tipo de sesión
        const rolMencion = sesion.tipo === 'meet' ? '<@&1491458302993891358>' : '<@&1503763201274413056>';

        // 1️⃣ Mensaje Embed de Votación / Meta
        const embedVotacion = new EmbedBuilder()
            .setTitle('<a:confeti:1523026892981145600> Southwest Florida – ***__Votación de Reinvitaciones__*** <a:confeti:1523026892981145600>')
            .setDescription(
                `> <:punto:1523041306836996156> <@${interaction.user.id}> **¡ha abierto una votación para liberar reinvitaciones!**\n\n` +
                `> <:star00y4n:1519474745320669194> **Meta de Votos:** **${votosRequeridos}** reacciones\n` +
                `> <:Flecha_00Y4n:1519473149845045400> **Reacciona con ${emojiVoto} a este mensaje para llegar a la meta y liberar los accesos.**`
            )
            .setColor('#74d4fc');

        if (urlImagen) {
            embedVotacion.setImage(urlImagen);
        }

        const msgVotacion = await interaction.channel.send({
            content: `@everyone ${rolMencion}`,
            embeds: [embedVotacion]
        });

        // Reacción inicial con el emoji provisto por ti
        try {
            await msgVotacion.react(emojiVoto);
        } catch (error) {
            // Si el emoji no se puede reaccionar directamente (formato custom), continúa sin romper
        }

        // 2️⃣ Collector para monitorear las reacciones de la meta
        const filter = (reaction, user) => {
            if (user.bot) return false;
            return (
                reaction.emoji.name === emojiVoto ||
                reaction.emoji.id === emojiVoto ||
                reaction.emoji.toString() === emojiVoto ||
                `<:${reaction.emoji.name}:${reaction.emoji.id}>` === emojiVoto ||
                `<a:${reaction.emoji.name}:${reaction.emoji.id}>` === emojiVoto
            );
        };

        const collector = msgVotacion.createReactionCollector({
            filter,
            dispose: true
        });

        collector.on('collect', async (reaction) => {
            // Descontamos la reacción del bot si existe
            const botReacted = reaction.users.cache.has(interaction.client.user.id);
            const totalVotos = reaction.count - (botReacted ? 1 : 0);

            if (totalVotos >= votosRequeridos) {
                collector.stop('meta_alcanzada');
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'meta_alcanzada') {
                // 🗑️ ELIMINAR EL MENSAJE DE VOTACIÓN AL LLEGAR A LA META
                await msgVotacion.delete().catch(() => {});

                // 3️⃣ Construcción del Embed con datos dinámicos
                let infoDescripcion = '';
                let tituloEmbed = '';

                if (sesion.tipo === 'rp') {
                    tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Roleplay Liberadas__*** <a:confeti:1523026892981145600>';
                    infoDescripcion = 
                        `> <:punto:1523041306836996156> **¡Se ha alcanzado la meta de votos!** Reinvitaciones liberadas por <@${interaction.user.id}>. Eres bienvenido a unirte utilizando el botón de abajo.\n\n` +
                        ` <:flor:1523041315187855470> **Información del Roleplay**\n\n` +
                        `> <:uno:1523028217592676464> **Estado de Peacetime:** ${sesion.peacetime || 'No especificado'}\n` +
                        `> <:dos:1523027468385128568> **Velocidad de Fail Roleplay:** ${sesion.limite || 'No especificada'}\n` +
                        `> <:replica:1523028004983406787> Las velocidades de detención son **+6 MPH** sobre el límite de velocidad establecido.\n\n` +
                        `<a:adv:1523027438030946446> *¡Cualquier miembro descubierto haciendo Fail Roleplay de forma excesiva será expulsado inmediatamente!*`;
                } else if (sesion.tipo === 'meet') {
                    tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Car Meet Liberadas__*** <a:confeti:1523026892981145600>';
                    infoDescripcion = 
                        `> <:punto:1523041306836996156> **¡Se ha alcanzado la meta de votos!** Reinvitaciones liberadas por <@${interaction.user.id}>. Eres bienvenido a unirte utilizando el botón de abajo.\n\n` +
                        `**<:caram00y4nmov:1523041315187855470> Información del Car Meet**\n\n` +
                        `<:uno:1523028217592676464> **Temática del Meet:** ${sesion.tematica || 'No especificada'}\n` +
                        `<:dos:1523027468385128568> **Lugar Actual:** ${sesion.ubicacion || 'No especificado'}\n` +
                        `<:tres:1523027610479759561> **Spots / Duración:** ${sesion.spots || 'No especificado'}\n` +
                        `<:flechareplica:1523028004983406787> Los vehículos deben ingresar __despacio__ al lugar actual del meet.\n\n` +
                        `➴ *¡Ingresá de inmediato y mantené el orden en el evento!*`;
                } else {
                    tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Liberadas__*** <a:confeti:1523026892981145600>';
                    infoDescripcion = `> <:punto:1523041306836996156> **¡Se ha alcanzado la meta de votos!** Usá el botón de abajo para ingresar.`;
                }

                const embedRelease = new EmbedBuilder()
                    .setTitle(tituloEmbed)
                    .setDescription(infoDescripcion)
                    .setColor('#74d4fc');

                if (urlImagen) {
                    embedRelease.setImage(urlImagen);
                }

                const fila = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verificar_voto_swfl')
                        .setLabel('Link de la Sesión')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('1529995334883872909')
                );

                const msgRelease = await interaction.channel.send({
                    content: `@everyone ${rolMencion}`,
                    embeds: [embedRelease],
                    components: [fila]
                });

                // Vinculamos la reinvitación en memoria con la ID del startup/inicio original
                global.coleccionSesiones.set(msgRelease.id, {
                    idInicio: sesion.idInicio,
                    linkSesion: sesion.linkSesion,
                    guildId: interaction.guildId,
                    tipo: 'reinvitacion'
                });
            }
        });
    }
};
