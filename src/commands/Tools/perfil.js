import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import Vehiculo from '../../../models/Vehiculo.js'; 
import Licencia from '../../../models/Licencia.js'; 
import { obtenerSaldo } from '../../utils/gestorEconomia.js';
import { obtenerTodasLasMultas } from '../../utils/gestorMultas.js';

const BLOXLINK_API_KEY = 'e47f3929-9be2-4179-82b1-e53b4a9a6538'; 

async function obtenerVehiculosUsuario(usuarioId) {
    try {
        const vehiculos = await Vehiculo.find({ usuario_id: usuarioId });
        return vehiculos;
    } catch (error) {
        console.error("Error consultando vehículos en MongoDB:", error);
        return [];
    }
}

export default {
    data: {
        name: 'perfil_swfl',
        description: 'Muestra el perfil de ciudadano, su balance bancario, cuenta de Roblox, vehículos y multas.',
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

        // Si el usuario no está verificado
        if (!robloxId) {
            const embedError = new EmbedBuilder()
                .setTitle('<:cruz:1534937767652495360> CONTROL DE VERIFICACIÓN')
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

        const autosRegistrados = await obtenerVehiculosUsuario(miembro.id);
        const saldoActual = await obtenerSaldo(miembro.id);
        
        let datosLicencia = await Licencia.findOne({ usuario_id: miembro.id });
        let estadoLicencia = datosLicencia ? datosLicencia.estado : 'Activa';

        let textoLicenciaVisual = '<:tilde:1534937809733812286> Activa';
        if (estadoLicencia === 'Suspendida') {
            textoLicenciaVisual = '🟡 Suspendida';
        } else if (estadoLicencia === 'Revocada') {
            textoLicenciaVisual = '🔴 Revocada';
        }

        const multasData = await obtenerTodasLasMultas();
        const arrayMultas = Array.isArray(multasData) ? multasData : Object.values(multasData || {});
        const multasUsuario = arrayMultas.filter(m => String(m.usuarioId || m.usuario_id) === String(miembro.id));
        const multasPendientes = multasUsuario.filter(m => m.estado === 'PENDIENTE');
        const deudaTotal = multasPendientes.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

        // 4. EMBED PRINCIPAL
        const perfilEmbed = new EmbedBuilder()
            .setTitle('<:id:1534937551092187136> Southwest Florida | *Perfil de Ciudadano*')
            .setDescription(
                `> Ficha de registro oficial del ciudadano dentro de nuestra base de datos de regulaciones de tránsito y economía.\n\n` +
                `<:dot:1534938142665084938> **Usuario:** <@${miembro.id}>\n` +
                `<:dot:1534938142665084938> **Perfil de Roblox:** [${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile)\n` +
                `<:dot:1534938142665084938> **Estado de Licencia:** ${textoLicenciaVisual}\n` +
                `<:dot:1534938142665084938> **Balance Bancario:** **$${saldoActual.toLocaleString()}**\n` +
                `<:dot:1534938142665084938> **Vehículos Registrados:** \`${autosRegistrados.length}\`\n` +
                `<:dot:1534938142665084938> **Multas Pendientes:** \`${multasPendientes.length}\` ${deudaTotal > 0 ? `*(Deuda: $${deudaTotal.toLocaleString()})*` : '*(Al día)*'}\n\n` +
                `⤷ *Para registrar una nueva unidad en tu garaje utiliza el comando \`/matricula registrar\` de forma pública.*`
            )
            .setThumbnail(fotoAvatar)
            .setColor('#74d4fc')
            .setFooter({ text: `${interaction.guild.name} • Registro Civil`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // 5. BOTONERA
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

        // 6. RECOLECTOR INTERNO (24 Horas)
        const recolector = mensajePerfil.createMessageComponentCollector({
            filter: (i) => i.customId.startsWith('regs_') || i.customId.startsWith('multas_'),
            time: 86400000 
        });

        recolector.on('collect', async (botonInteraction) => {
            const [tipo, targetId] = botonInteraction.customId.split('_');

            // 🚗 BOTÓN DE MATRÍCULAS
            if (tipo === 'regs') {
                const listaAutosActuales = await obtenerVehiculosUsuario(targetId);

                if (listaAutosActuales.length === 0) {
                    const embedVacio = new EmbedBuilder()
                        .setTitle('<:form:1523041319046479964> Vehículos Registrados')
                        .setDescription(`No se encontraron vehículos ni patentes activas registradas en el sistema para <@${targetId}>.`)
                        .setColor('#74d4fc')
                        .setFooter({ text: 'Sistema de Tránsito Oficial' });

                    return await botonInteraction.reply({ embeds: [embedVacio], flags: MessageFlags.Ephemeral });
                }

                const stringAutos = listaAutosActuales.map((auto, index) => 
                    `**${index + 1}. ${auto.marca} ${auto.modelo} (${auto.ano || auto.anio || auto.año})**\n` +
                    `> • Color: ${auto.color}\n` +
                    `> • Matrícula: \`${auto.patente}\``
                ).join('\n\n');

                const embedConAutos = new EmbedBuilder()
                    .setTitle('<:form:1534938422202994755> Vehículos Registrados')
                    .setDescription(`Lista de vehículos activos en el sistema para <@${targetId}>:\n\n${stringAutos}`)
                    .setColor('#74d4fc')
                    .setFooter({ text: 'Sistema de Tránsito Oficial' });

                return await botonInteraction.reply({ embeds: [embedConAutos], flags: MessageFlags.Ephemeral });
            }

            // 🚨 BOTÓN DE MULTAS
            if (tipo === 'multas') {
                const multasNuevas = await obtenerTodasLasMultas();
                const arrayMultasActuales = Array.isArray(multasNuevas) ? multasNuevas : Object.values(multasNuevas || {});
                const multasUsuarioActuales = arrayMultasActuales.filter(multa => String(multa.usuarioId || multa.usuario_id) === String(targetId));

                if (multasUsuarioActuales.length === 0) {
                    const embedSinMultas = new EmbedBuilder()
                        .setTitle('<:folder:1534938334650962115> Historial de Multas')
                        .setDescription(`<:tilde:1534937809733812286> El usuario <@${targetId}> **no tiene ningún tipo de multa.**`)
                        .setColor('#74d4fc')
                        .setFooter({ text: 'Departamento de Policía' })
                        .setTimestamp();

                    return await botonInteraction.reply({ embeds: [embedSinMultas], flags: MessageFlags.Ephemeral });
                }

                const stringMultas = multasUsuarioActuales.map((multa) => {
                    const estadoTexto = multa.estado === 'PAGADA' ? '🟢 **PAGADA**' : '🔴 **PENDIENTE**';
                    return `**Multa #${multa.id}** — Estado: ${estadoTexto}\n` +
                           `> • **Razón:** ${multa.razon}\n` +
                           `> • **Monto:** $${Number(multa.monto).toLocaleString()}\n` +
                           `> • **Oficial Emisor:** <@${multa.oficialId || multa.oficial_id}>`;
                }).join('\n\n');

                const embedConMultas = new EmbedBuilder()
                    .setTitle('<:folder:1534938334650962115> Historial de Multas')
                    .setDescription(`<:dot:1534938142665084938> Multas de tránsito aplicadas a <@${targetId}>:\n\n${stringMultas}`)
                    .setColor('#ff3333')
                    .setFooter({ text: 'Departamento de Policía' })
                    .setTimestamp();

                return await botonInteraction.reply({ embeds: [embedConMultas], flags: MessageFlags.Ephemeral });
            }
        });
    }
};
