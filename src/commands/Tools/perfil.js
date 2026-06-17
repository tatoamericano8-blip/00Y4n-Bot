import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// 🔑 CONFIGURACIÓN DE APIS
// Coloca aquí tu token completo tal cual figura en el botón 'See Key' de image_4303e6.png
const BLOXLINK_API_KEY = 'e47f3929-9be2-4179-82b1-e53b4a9a6538';

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

        // 1. CONSULTA A LA API DE BLOXLINK (Estructura idéntica a image_4303e6.png)
        let robloxId = null;
        let robloxUsername = 'No Verificado';

        try {
            const urlBloxlink = `https://api.blox.link/v4/public/guilds/${interaction.guild.id}/discord-to-roblox/${miembro.id}`;
            const respuestaBloxlink = await fetch(urlBloxlink, {
                headers: { 'Authorization': BLOXLINK_API_KEY }
            });

            // Diagnóstico inteligente por consola si la API no responde de forma exitosa
            if (!respuestaBloxlink.ok) {
                console.log(`[DIAGNÓSTICO] Bloxlink devolvió un estado: ${respuestaBloxlink.status}`);
                if (respuestaBloxlink.status === 401) {
                    console.log(`[ALERTA] Error 401: Tu API Key es inválida o está mal copiada. Revísala en el dashboard.`);
                } else if (respuestaBloxlink.status === 404) {
                    console.log(`[ALERTA] Error 404: El usuario no está verificado en este servidor O el bot oficial de Bloxlink no está en el servidor.`);
                }
            } else {
                const datosBloxlink = await respuestaBloxlink.json();
                if (datosBloxlink.robloxID) {
                    robloxId = datosBloxlink.robloxID; // Extraemos el ID numérico exitosamente (Ver image_4303af.png)
                }
            }
        } catch (error) {
            console.error('Error crítico al conectar con Bloxlink:', error);
        }

        // 🛑 CONDICIONAL: Si no se pudo obtener el ID de Roblox, frena y muestra el embed de error
        if (!robloxId) {
            const embedError = new EmbedBuilder()
                .setTitle('❌ CONTROL DE VERIFICACIÓN')
                .setDescription(
                    `> El usuario <@${miembro.id}> no pudo ser validado en el sistema.\n\n` +
                    `**Posibles causas de este error:**\n` +
                    `• No estás verificado con Bloxlink.\n` +
                    `• El bot oficial de **Bloxlink** no se encuentra en este servidor de Discord.\n` +
                    `• La \`BLOXLINK_API_KEY\` configurada en el código expiró o es incorrecta.`
                )
                .setColor('#ff3333')
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embedError] });
        }

        // 2. RESOLVER NOMBRE DE USUARIO (Consulta directa a la API oficial de Roblox)
        try {
            const respuestaRobloxUser = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
            if (respuestaRobloxUser.ok) {
                const datosRobloxUser = await respuestaRobloxUser.json();
                robloxUsername = datosRobloxUser.name; // Transforma el ID numérico en tu Nick real (Ej: Wolfe_toxicgood)
            }
        } catch (err) {
            console.error('Error al resolver el nombre en Roblox:', err);
            robloxUsername = `ID: ${robloxId}`; // Respaldo si falla la API de Roblox
        }

        // 3. OBTENER MINIATURA DEL AVATAR (Roblox Thumbnail API)
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

        // 4. ARMADO DEL EMBED PRINCIPAL (Fiel a la estética solicitada)
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

        // 5. CREACIÓN DE BOTONES INTERACTIVOS
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

        // 6. RECOLECTOR DE COMPONENTES INTERNO (Respuestas efímeras activas por 10 minutos)
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
