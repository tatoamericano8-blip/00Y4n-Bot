import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

export default {
    data: {
        name: 'reinvitacion',
        description: 'Envía una reinvitación con los datos dinámicos de la sesión actual (RP o Car Meet).',
        options: [
            { 
                name: 'mensaje_id', 
                description: 'ID del mensaje de lanzamiento (Lanzar RP o Lanzar Meet) de esta sesión.', 
                type: ApplicationCommandOptionType.String, 
                required: true 
            },
            { 
                name: 'imagen', 
                description: 'Link de la foto/banner opcional para la reinvitación.', 
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
        const urlImagen = interaction.options.getString('imagen');

        // Buscamos los datos guardados de la sesión lanzada
        const sesion = global.coleccionSesiones.get(idLanzamiento);

        if (!sesion) {
            return await interaction.reply({
                content: '<:cruz00y4n:1519476959606734998> **Error:** No se encontraron registros de esa sesión. Asegúrate de colocar la ID del mensaje de lanzamiento de la sesión.',
                ephemeral: true
            });
        }

        let infoDescripcion = '';
        let tituloEmbed = '';

        // 🚗 SI LA SESIÓN ES ROLEPLAY
        if (sesion.tipo === 'rp') {
            tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Roleplay__*** <a:confeti:1523026892981145600>';
            infoDescripcion = 
                `> <:punto:1523041306836996156> <@${interaction.user.id}> **¡ha liberado reinvitaciones para la sesión de Roleplay!** Podés unirte utilizando el botón de abajo.\n\n` +
                ` <:flor:1523041315187855470> **Información del Roleplay**\n\n` +
                `> <:uno:1523028217592676464> **Estado de Peacetime:** ${sesion.peacetime || 'No especificado'}\n` +
                `> <:dos:1523027468385128568> **Velocidad de Fail Roleplay:** ${sesion.limite || 'No especificada'}\n` +
                `> <:replica:1523028004983406787> Las velocidades de detención son **+6 MPH** sobre el límite de velocidad establecido.\n\n` +
                `<a:adv:1523027438030946446> *¡Asegúrate de respetar las normas vigentes al ingresar!*`;
        } 
        // 🏎️ SI LA SESIÓN ES CAR MEET
        else if (sesion.tipo === 'meet') {
            tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Car Meet__*** <a:confeti:1523026892981145600>';
            infoDescripcion = 
                `> <:punto:1523041306836996156> <@${interaction.user.id}> **¡ha liberado reinvitaciones para el Car Meet oficial!** Podés unirte utilizando el botón de abajo.\n\n` +
                `**<:caram00y4nmov:1523041315187855470> Información del Car Meet**\n\n` +
                `<:uno:1523028217592676464> **Temática del Meet:** ${sesion.tematica || 'No especificada'}\n` +
                `<:dos:1523027468385128568> **Lugar Actual:** ${sesion.ubicacion || 'No especificado'}\n` +
                `<:tres:1523027610479759561> **Spots / Duración:** ${sesion.spots || 'No especificado'}\n` +
                `<:flechareplica:1523028004983406787> Los vehículos deben ingresar __despacio__ al lugar actual del meet.\n\n` +
                `➴ *¡Ingresá de inmediato y mantené el orden en el evento!*`;
        } 
        // Fallback en caso de que no tenga tipo especificado
        else {
            tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Liberadas__*** <a:confeti:1523026892981145600>';
            infoDescripcion = `> <:punto:1523041306836996156> <@${interaction.user.id}> **¡ha liberado reinvitaciones para la sesión!** Usá el botón de abajo para ingresar.`;
        }

        const embedReinv = new EmbedBuilder()
            .setTitle(tituloEmbed)
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedReinv.setImage(urlImagen);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1529995334883872909')
        );

        await interaction.reply({ content: 'Publicando reinvitaciones...', ephemeral: true });

        // Mencionamos el rol correspondiente según el tipo de sesión
        const rolMencion = sesion.tipo === 'meet' ? '<@&1491458302993891358>' : '<@&1503763201274413056>';

        const msgReinv = await interaction.channel.send({
            content: `@everyone ${rolMencion}`,
            embeds: [embedReinv],
            components: [fila]
        });

        // Guardamos también este nuevo mensaje en memoria para que el botón de verificar voto funcione desde él
        global.coleccionSesiones.set(msgReinv.id, {
            idInicio: sesion.idInicio,
            linkSesion: sesion.linkSesion,
            guildId: interaction.guildId,
            tipo: 'reinvitacion'
        });
    }
};
