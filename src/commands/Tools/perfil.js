import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import { obtenerSaldo } from '../../utils/gestorEconomia.js'; // 👈 Solo el saldo
import { multasDB } from '../../utils/gestorMultas.js';     // 👈 IMPORTANTE: Traemos las multas de gestorMultas

// 📂 Conexión con la base de datos persistente
const ARCHIVO_DB = './vehiculos_db.json';
const BLOXLINK_API_KEY = 'e47f3929-9be2-4179-82b1-e53b4a9a6538'; 

// Función para leer los datos guardados
function leerBaseDatos() {
    if (!fs.existsSync(ARCHIVO_DB)) {
        fs.writeFileSync(ARCHIVO_DB, JSON.stringify({}));
    }
    const data = JSON.parse(fs.readFileSync(ARCHIVO_DB, 'utf-8'));
    return new Map(Object.entries(data));
}

export default {
    data: {
        name: 'perfil_swfl',
        description: 'Muestra el perfil de ciudadano, su balance bancario, cuenta de Roblox y vehículos.',
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

        // Leemos la base de datos física de vehículos
        const baseDatosVehiculos = leerBaseDatos();
        const autosRegistrados = baseDatosVehiculos.get(miembro.id) || [];

        // 💰 OBTENER BALANCE BANCARIO DEL JUGADOR
        const saldoActual = obtenerSaldo(miembro.id);

        // 4. ARMADO DEL EMBED PRINCIPAL
        const perfilEmbed = new EmbedBuilder()
            .setTitle('<:seguro:1523041347869868253> Southwest Florida | *Perfil de Civil*')
            .setDescription(
                `> Ficha de registro oficial del ciudadano dentro de nuestra base de datos de regulaciones de tránsito y economía.\n\n` +
                `• **Usuario:** <@${miembro.id}>\n` +
                `• **Perfil de Roblox:** [${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile)\n` +
                `• **Estado de Licencia:** <:tilde:1524936452574806076> Activa\n` +
                `• **Balance Bancario:** **$${saldoActual.toLocaleString()}**\n` +
                `• **Vehículos Registrados:** \`${autosRegistrados.length}\`\n\n` +
                `⤷ *Para registrar una nueva unidad en tu garaje utiliza el comando \`/matricula_swfl registrar\` de forma pública.*`
            )
            .setThumbnail(fotoAvatar)
            .setColor('#74d4fc')
            .setFooter({ text: `${interaction.guild.name} • Registro Civil`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // 5. CREACIÓN DE BOTONERA
        const botonera = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`regs_${miembro.id}`)
                .setLabel('Matrículas')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`multas_${miembro.id}`)
                .setLabel('Multas')
                .setStyle(ButtonStyle.Danger)
        );

        const mensajePerfil = await interaction.editReply({ embeds: [perfilEmbed], components: [botonera] });

        // 6. RECOLECTOR DE COMPONENTES INTERNO
        const recolector = mensajePerfil.createMessageComponentCollector({
            filter: (i) => i.customId.startsWith('regs_') || i.customId.startsWith('multas_'),
            time: 600000
        });

        recolector.on('collect', async (botonInteraction) => {
            const [tipo, targetId] = botonInteraction.customId.split('_');

            // 🚗 BOTÓN DE MATRÍCULAS
            if (tipo === 'regs') {
                const baseActualizada = leerBaseDatos();
                const listaAutosActuales = baseActualizada.get(targetId) || [];

                if (listaAutosActuales.length === 0) {
                    const embedVacio = new EmbedBuilder()
                        .setTitle('<:form:1523041319046479964> Vehículos Registrados')
                        .setDescription(`No se encontraron vehículos ni patentes activas registradas en el sistema para <@${targetId}>.`)
                        .setColor('#74d4fc')
                        .setFooter({ text: 'Sistema de Tránsito Oficial' });

                    return await botonInteraction.reply({ embeds: [embedVacio], ephemeral: true });
                }

                const stringAutos = listaAutosActuales.map((auto, index) => 
                    `**${index + 1}. ${auto.marca} ${auto.modelo} (${auto.año})**\n` +
                    `> • Color: ${auto.color}\n` +
                    `> • Matrícula: \`${auto.patente}\``
                ).join('\n\n');

                const embedConAutos = new EmbedBuilder()
                    .setTitle('<:form:1523041319046479964> Vehículos Registrados')
                    .setDescription(`Lista de vehículos activos en el sistema para <@${targetId}>:\n\n${stringAutos}`)
                    .setColor('#74d4fc')
                    .setFooter({ text: 'Sistema de Tránsito Oficial' });

                return await botonInteraction.reply({ embeds: [embedConAutos], ephemeral: true });
            }

            // 🚨 BOTÓN DE MULTAS
            if (tipo === 'multas') {
                // Adaptamos la lectura para Map o Array según cómo esté en gestorMultas.js
                let todasLasMultas = [];
                if (multasDB instanceof Map) {
                    todasLasMultas = Array.from(multasDB.values());
                } else if (Array.isArray(multasDB)) {
                    todasLasMultas = multasDB;
                } else if (typeof multasDB === 'object' && multasDB !== null) {
                    todasLasMultas = Object.values(multasDB);
                }

                // Filtramos por la ID del usuario objetivo
                const multasUsuario = todasLasMultas.filter(multa => String(multa.usuarioId) === String(targetId));

                // Si no tiene multas registradas
                if (multasUsuario.length === 0) {
                    const embedSinMultas = new EmbedBuilder()
                        .setTitle('🚨 Historial de Multas')
                        .setDescription(`✅ El usuario <@${targetId}> **no tiene ningún tipo de multa.**`)
                        .setColor('#74d4fc')
                        .setFooter({ text: 'Departamento de Policía' })
                        .setTimestamp();

                    return await botonInteraction.reply({ embeds: [embedSinMultas], ephemeral: true });
                }

                // Si tiene multas, construimos la lista exacta con los nombres de propiedades de /multar
                const stringMultas = multasUsuario.map((multa) => {
                    const estadoTexto = multa.estado === 'PAGADA' ? '🟢 **PAGADA**' : '🔴 **PENDIENTE**';
                    return `**Multa #${multa.id}** — Estado: ${estadoTexto}\n` +
                           `> • **Razón:** ${multa.razon}\n` +
                           `> • **Monto:** $${multa.monto.toLocaleString()}\n` +
                           `> • **Oficial Emisor:** <@${multa.oficialId}>`;
                }).join('\n\n');

                const embedConMultas = new EmbedBuilder()
                    .setTitle('🚨 Historial de Multas')
                    .setDescription(`Multas de tránsito aplicadas a <@${targetId}>:\n\n${stringMultas}`)
                    .setColor('#ff3333')
                    .setFooter({ text: 'Departamento de Policía' })
                    .setTimestamp();

                return await botonInteraction.reply({ embeds: [embedConMultas], ephemeral: true });
            }
        });

        recolector.on('end', () => {
            mensajePerfil.edit({ components: [] }).catch(() => null);
        });
    }
};
