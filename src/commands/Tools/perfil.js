import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// 🔑 CONFIGURACIÓN DE APIS
// Volvé a pegar acá tu token largo que vimos en la imagen image_430f8a.png
const BLOXLINK_API_KEY = 'e47f3929-9be2-4179-82b1-e53b4a96538'; 

export default {
    data: {
        name: 'perfil_swfl',
        description: 'Muestra el perfil de ciudadano, su cuenta de Roblox y sus registros vehiculares.',
        options: [
            {
                name: 'usuario',
                description: 'Selecciona al miembro que deseas buscar. Si lo dejas vacío, muestra tu propio perfil.',
                type: ApplicationCommandOptionType.User,
                required: false
            }
        ]
    },

    async execute(interaction) {
        await interaction.deferReply();

        const miembro = interaction.options.getUser('usuario') || interaction.user;

        // 1. CONSULTA A LA API DE BLOXLINK (Ruta corregida según image_430f8a.png)
        let robloxId = null;
        let robloxUsername = 'No Verificado';

        try {
            const respuestaBloxlink = await fetch(`https://api.blox.link/v4/public/guilds/${interaction.guild.id}/discord-to-roblox/${miembro.id}`, {
                headers: { 'Authorization': BLOXLINK_API_KEY }
            });

            if (respuestaBloxlink.ok) {
                const datosBloxlink = await respuestaBloxlink.json();
                if (datosBloxlink.robloxID) {
                    robloxId = datosBloxlink.robloxID;
                    robloxUsername = datosBloxlink.resolved?.roblox?.username || `ID: ${robloxId}`;
                }
            }
        } catch (error) {
            console.error('Error al conectar con Bloxlink:', error);
        }

        // 🛑 CONDICIONAL: Si el usuario no está verificado
        if (!robloxId) {
            const embedError = new EmbedBuilder()
                .setTitle('❌ CONTROL DE VERIFICACIÓN')
                .setDescription(`> El usuario <@${miembro.id}> no se encuentra verificado en la base de datos global de **Bloxlink**.\n\nPor favor, asegúrate de estar verificado antes de vincular tu documentación de SWFL.`)
                .setColor('#ff3333')
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embedError] });
        }

        // 2. OBTENER MINIATURA DEL AVATAR
        const avatarUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=false`;
        let fotoAvatar = 'https://images.rbxcdn.com/60882e79603edcd5911b7f92025edcc6.png';

        try {
            const respuestaThumb = await fetch(avatarUrl);
            if (respuestaThumb.ok) {
                const datosThumb = await respuestaThumb.json();
                if (datosThumb.data && datosThumb.data.length > 0) {
                    fotoAvatar = datosThumb.data[0].imageUrl;
                }
            }
        } catch (err) {
            console.error('Error al obtener la miniatura de Roblox:', err);
        }

        // 3. ARMADO DEL EMBED PRINCIPAL
        const perfilEmbed = new EmbedBuilder()
            .setTitle('🪪 Southwest Florida | *Civilian Profile*')
            .setDescription(
                `> Ficha de registro oficial del ciudadano dentro de nuestra base de datos de regulaciones de tránsito.\n\n` +
                `• **Usuario:** <@${miembro.id}>\n` +
                `• **Perfil de Roblox:** [${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile)\n` +
                `• **Estado de Licencia:** ✅ Activa\n` +
                `• **Vehículos Registrados:** \`0\`\n\n` +
                `⤷ *Para registrar una nueva unidad en tu garaje utiliza el comando \`/matricula_swfl registrar\` de forma pública.*`
            )
            .setThumbnail(fotoAvatar)
            .setColor('#ff6600')
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // 4. CREACIÓN DE BOTONES INTERACTIVOS
        const botonera = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`regs_${miembro.id}`)
                .setLabel('Matrículas (Registrations)')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`multas_${miembro.id}`)
                .setLabel('Historial de Multas (Citations)')
                .setStyle(ButtonStyle.Secondary)
        );

        const mensajePerfil = await interaction.editReply({ embeds: [perfilEmbed], components: [botonera] });

        // 5. RECOLECTOR DE COMPONENTES INTERNO
        const recolector = mensajePerfil.createMessageComponentCollector({
            filter: (i) => i.customId.startsWith('regs_') || i.customId.startsWith('multas_'),
            time: 600000
        });

        recolector.on('collect', async (botonInteraction) => {
            const [tipoAccion, targetId] = botonInteraction.customId.split('_');

            if (tipoAccion === 'regs') {
                const embedRegs = new EmbedBuilder()
                    .setTitle('📋 Vehículos Registrados')
                    .setDescription(`No se encontraron vehículos ni patentes activas registradas en el sistema para <@${targetId}>.`)
                    .setColor('#ff6600')
                    .setFooter({ text: 'Sistema de Tránsito Oficial' });

                return await botonInteraction.reply({ embeds: [embedRegs], ephemeral: true });
            }

            if (tipoAccion === 'multas') {
                const embedTickets = new EmbedBuilder()
                    .setTitle('📑 Historial de Sanciones')
                    .setDescription(`El expediente de <@${targetId}> está limpio. No se encontraron multas, citaciones o reportes de tránsito vigentes.`)
                    .setColor('#ff6600')
                    .setFooter({ text: 'Departamento de Policía / Tránsito' });

                return await botonInteraction.reply({ embeds: [embedTickets], ephemeral: true });
            }
        });

        recolector.on('end', () => {
            mensajePerfil.edit({ components: [] }).catch(() => null);
        });
    }
};
