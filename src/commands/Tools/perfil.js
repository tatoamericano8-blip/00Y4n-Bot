import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Conexión con la base de datos en memoria
global.baseDatosVehiculos = global.baseDatosVehiculos || new Map();
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

        // 1. CONSULTA A LA API DE BLOXLINK
        let robloxId = null;
        let robloxUsername = 'No Verificado';

        try {
            const urlBloxlink = `https://api.blox.link/v4/public/guilds/${interaction.guild.id}/discord-to-roblox/${miembro.id}`;
            const respuestaBloxlink = await fetch(urlBloxlink, {
                headers: { 'Authorization': BLOXLINK_API_KEY }
            });

            if (respuestaBloxlink.ok) {
                const datosBloxlink = await respuestaBloxlink.json();
                if (datosBloxlink.robloxID) {
                    robloxId = datosBloxlink.robloxID;
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

        // 2. RESOLVER NOMBRE DE USUARIO EN ROBLOX
        try {
            const respuestaRobloxUser = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
            if (respuestaRobloxUser.ok) {
                const datosRobloxUser = await respuestaRobloxUser.json();
                robloxUsername = datosRobloxUser.name;
            }
        } catch (err) {
            robloxUsername = `ID: ${robloxId}`;
        }

        // 3. OBTENER MINIATURA DEL AVATAR
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
        } catch (err) {}

        // Obtener la cantidad real de autos registrados para el perfil visual
        const autosRegistrados = global.baseDatosVehiculos.get(miembro.id) || [];

        // 4. ARMADO DEL EMBED PRINCIPAL (Corregido a: Perfil de Civil)
        const perfilEmbed = new EmbedBuilder()
            .setTitle('🪪 Southwest Florida | *Perfil de Civil*')
            .setDescription(
                `> Ficha de registro oficial del ciudadano dentro de nuestra base de datos de regulaciones de tránsito.\n\n` +
                `• **Usuario:** <@${miembro.id}>\n` +
                `• **Perfil de Roblox:** [${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile)\n` +
                `• **Estado de Licencia:** ✅ Activa\n` +
                `• **Vehículos Registrados:** \`${autosRegistrados.length}\`\n\n` +
                `⤷ *Para registrar una nueva unidad en tu garaje utiliza el comando \`/matricula_swfl registrar\` de forma pública.*`
            )
            .setThumbnail(fotoAvatar)
            .setColor('#ff6600')
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // 5. CREACIÓN DE BOTONERA (Se removió por completo el botón de multas)
        const botonera = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`regs_${miembro.id}`)
                .setLabel('Matrículas (Registrations)')
                .setStyle(ButtonStyle.Primary)
        );

        const mensajePerfil = await interaction.editReply({ embeds: [perfilEmbed], components: [botonera] });

        // 6. RECOLECTOR DE COMPONENTES INTERNO (EFÍMERO)
        const recolector = mensajePerfil.createMessageComponentCollector({
            filter: (i) => i.customId.startsWith('regs_'),
            time: 600000
        });

        recolector.on('collect', async (botonInteraction) => {
            const targetId = botonInteraction.customId.split('_')[1];
            const listaAutosActuales = global.baseDatosVehiculos.get(targetId) || [];

            // Si no tiene autos registrados
            if (listaAutosActuales.length === 0) {
                const embedVacio = new EmbedBuilder()
                    .setTitle('📋 Vehículos Registrados')
                    .setDescription(`No se encontraron vehículos ni patentes activas registradas en el sistema para <@${targetId}>.`)
                    .setColor('#ff6600')
                    .setFooter({ text: 'Sistema de Tránsito Oficial' });

                return await botonInteraction.reply({ embeds: [embedVacio], ephemeral: true });
            }

            // Si tiene autos, los mapeamos de forma ultra estética en bloque de cita
            const stringAutos = listaAutosActuales.map((auto, index) => 
                `**${index + 1}. ${auto.marca} ${auto.modelo} (${auto.año})**\n` +
                `> • Color: ${auto.color}\n` +
                `> • Matrícula: \`${auto.patente}\``
            ).join('\n\n');

            const embedConAutos = new EmbedBuilder()
                .setTitle('📋 Vehículos Registrados')
                .setDescription(`Lista de vehículos activos en el sistema para <@${targetId}>:\n\n${stringAutos}`)
                .setColor('#ff6600')
                .setFooter({ text: 'Sistema de Tránsito Oficial' });

            return await botonInteraction.reply({ embeds: [embedConAutos], ephemeral: true });
        });

        recolector.on('end', () => {
            mensajePerfil.edit({ components: [] }).catch(() => null);
        });
    }
};
