import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';
import Vehiculo from '../../../models/Vehiculo.js';
import PermisoMatriculaExtra from '../../../models/PermisoMatriculaExtra.js';
import {
    validarRegistroVehiculo,
    marcarRegistroExitoso,
    patenteValida
} from '../../utils/antiAbusoPatentes.js';

const ROL_ALTO_MANDO = '1528870731629465752';
const ROL_PROPIETARIOS = '1528877296977711256';
const LIMITE_BASE = 4;

async function obtenerLimiteUsuario(guildId, userId) {
    const doc = await PermisoMatriculaExtra.findOne({ guildId, userId });
    const extra = Math.max(0, Number(doc?.extraSlots) || 0);
    return LIMITE_BASE + extra;
}

function esPropietario(member) {
    return (
        member.roles.cache.has(ROL_PROPIETARIOS) ||
        member.permissions.has(PermissionFlagsBits.Administrator)
    );
}

export default {
    data: {
        name: 'matricular',
        description: 'Gestiona la matriculación de vehículos para el juego.',
        options: [
            {
                name: 'registrar',
                description: 'Registra un nuevo vehículo en la base de datos oficial.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'marca', description: 'Marca del auto (Ej: Ferrari, Nissan)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'modelo', description: 'Modelo exacto (Ej: 488 Pista, GTR)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'anio', description: 'Año de fabricación del vehículo', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'color', description: 'Color de la carrocería', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'patente', description: 'Texto de la matrícula / placa del auto', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
            {
                name: 'remover',
                description: 'Da de baja un vehículo registrado anteriormente.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'patente', description: 'Escribe la matrícula del auto que deseas remover.', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
            {
                name: 'permiso-extra',
                description: '(Propietarios) Otorga slots extra de matrícula a un usuario.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'usuario', description: 'Usuario que recibirá el permiso extra', type: ApplicationCommandOptionType.User, required: true },
                    { name: 'cantidad', description: 'Cantidad de slots extra (1-10)', type: ApplicationCommandOptionType.Integer, required: true, min_value: 1, max_value: 10 }
                ]
            },
            {
                name: 'quitar-permiso',
                description: '(Propietarios) Quita el permiso extra de matrícula de un usuario.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'usuario', description: 'Usuario al que se le quitará el permiso extra', type: ApplicationCommandOptionType.User, required: true }
                ]
            },
            {
                name: 'forzar-quitar',
                description: '(Propietarios) Fuerza la baja de una matrícula por patente (cualquier dueño).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'patente', description: 'Matrícula a forzar baja', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
            {
                name: 'reiniciar',
                description: '(AC Solo)⚠️ ALTO MANDO: Borra TODAS las matriculaciones del servidor (irreversible).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'confirmacion',
                        description: 'Escribí exactamente: REINICIAR para confirmar.',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            }
        ]
    },

    async execute(interaction) {
        const subcomando = interaction.options.getSubcommand();
        const usuarioId = interaction.user.id;
        const guildId = interaction.guildId;

        // Subcomandos de propietarios: respuesta efímera
        if (['permiso-extra', 'quitar-permiso', 'forzar-quitar'].includes(subcomando)) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (!esPropietario(interaction.member)) {
                return interaction.editReply({
                    content: '<:cruz:1534937767652495360> Solo el **Equipo de Propietarios** puede usar este subcomando.'
                });
            }

            if (subcomando === 'permiso-extra') {
                const target = interaction.options.getUser('usuario');
                const cantidad = interaction.options.getInteger('cantidad');

                await PermisoMatriculaExtra.findOneAndUpdate(
                    { guildId, userId: target.id },
                    {
                        extraSlots: cantidad,
                        otorgadoPor: interaction.user.id,
                        otorgadoEn: new Date()
                    },
                    { upsert: true, new: true }
                );

                const limite = LIMITE_BASE + cantidad;
                return interaction.editReply({
                    content:
                        `<:tilde:1534937809733812286> **Permiso extra otorgado** a <@${target.id}>.\n` +
                        `> Slots extra: **${cantidad}** · Límite total: **${limite}** vehículos (base ${LIMITE_BASE} + extra).`
                });
            }

            if (subcomando === 'quitar-permiso') {
                const target = interaction.options.getUser('usuario');
                const deleted = await PermisoMatriculaExtra.findOneAndDelete({ guildId, userId: target.id });
                if (!deleted) {
                    return interaction.editReply({
                        content: `<:cruz:1534937767652495360> <@${target.id}> no tenía permiso extra activo.`
                    });
                }
                return interaction.editReply({
                    content: `<:tilde:1534937809733812286> Permiso extra **revocado** de <@${target.id}>. Límite vuelve a **${LIMITE_BASE}**.`
                });
            }

            if (subcomando === 'forzar-quitar') {
                const check = patenteValida(interaction.options.getString('patente'));
                if (!check.ok) {
                    return interaction.editReply({
                        content: `<:cruz:1534937767652495360> ${check.motivo}`
                    });
                }
                const patente = check.patente;

                const auto = await Vehiculo.findOneAndDelete({ patente });
                if (!auto) {
                    return interaction.editReply({
                        content: `<:cruz:1534937767652495360> No existe ningún vehículo con la matrícula \`${patente}\`.`
                    });
                }

                // DM al dueño (si es posible)
                try {
                    const owner = await interaction.client.users.fetch(auto.usuario_id).catch(() => null);
                    if (owner) {
                        await owner.send({
                            content:
                                `<:aviso:1534938916057120839> Tu vehículo con matrícula **\`${patente}\`** (${auto.marca} ${auto.modelo}) fue **dado de baja forzadamente** por el equipo de Propietarios.\n` +
                                `Motivo: gestión administrativa.`
                        }).catch(() => null);
                    }
                } catch {}

                return interaction.editReply({
                    content:
                        `<:tilde:1534937809733812286> Matrícula **\`${patente}\`** forzada a baja.\n` +
                        `> Dueño: <@${auto.usuario_id}> · ${auto.marca} ${auto.modelo}`
                });
            }
            return;
        }

        await interaction.deferReply();

        if (subcomando === 'registrar') {
            const marca = interaction.options.getString('marca');
            const modelo = interaction.options.getString('modelo');
            const anio = interaction.options.getString('anio');
            const color = interaction.options.getString('color');
            const patenteRaw = interaction.options.getString('patente');

            const valid = validarRegistroVehiculo(usuarioId, {
                marca, modelo, anio, color, patente: patenteRaw
            });
            if (!valid.ok) {
                return await interaction.editReply({
                    content: `<:cruz:1534937767652495360> ${valid.motivo}`
                });
            }
            const patente = valid.patente;

            try {
                const limite = await obtenerLimiteUsuario(guildId, usuarioId);
                const cantidadAutos = await Vehiculo.countDocuments({ usuario_id: usuarioId });
                if (cantidadAutos >= limite) {
                    return await interaction.editReply({
                        content:
                            `<:cruz:1534937767652495360> **Límite alcanzado:** Ya tenés el máximo de **${limite}** vehículos.\n\n` +
                            `*Dá de baja uno con \`/matricular remover\`.*`
                    });
                }

                const patenteExistente = await Vehiculo.findOne({ patente });
                if (patenteExistente) {
                    return await interaction.editReply({
                        content: `<:cruz:1534937767652495360> La matrícula \`${patente}\` ya está registrada por otro ciudadano.`
                    });
                }

                await Vehiculo.create({
                    usuario_id: usuarioId,
                    marca,
                    modelo,
                    anio,
                    color,
                    patente
                });

                marcarRegistroExitoso(usuarioId);

                const embedRegistro = new EmbedBuilder()
                    .setTitle('<:car:1534938916057120839> SWFL | FORMATO DE MATRICULACIÓN DE VEHÍCULOS <:seguro:1523041347869868253>')
                    .setDescription(
                        `> <:flecha:1534937306191102125> El siguiente vehículo ha sido cargado exitosamente en el sistema de patentes.\n\n` +
                        `<:si:1534938142665084938> **Marca:** \`${marca}\`\n` +
                        `<:si:1534938142665084938> **Modelo:** \`${modelo}\`\n` +
                        `<:si:1534938142665084938> **Año:** \`${anio}\`\n` +
                        `<:si:1534938142665084938> **Color:** \`${color}\`\n` +
                        `<:si:1534938142665084938> **Matrícula:** \`${patente}\`\n` +
                        `<:si:1534938142665084938> **Propietario:** <@${usuarioId}>`
                    )
                    .setColor('#74d4fc')
                    .setFooter({ text: 'Sistema de Tránsito Oficial' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embedRegistro] });
            } catch (error) {
                console.error('Error guardando vehículo:', error);
                return await interaction.editReply({ content: 'Hubo un error interno al registrar el vehículo.' });
            }
        }

        if (subcomando === 'remover') {
            const check = patenteValida(interaction.options.getString('patente'));
            if (!check.ok) {
                return await interaction.editReply({
                    content: `<:cruz:1534937767652495360> ${check.motivo}`
                });
            }
            const patente = check.patente;

            try {
                const autoBorrado = await Vehiculo.findOneAndDelete({
                    usuario_id: usuarioId,
                    patente
                });

                if (!autoBorrado) {
                    return await interaction.editReply({
                        content: `<:cruz:1534937767652495360> No poseés ningún vehículo con la matrícula \`${patente}\`.`
                    });
                }

                const embedRemover = new EmbedBuilder()
                    .setTitle('<:no:1534937767652495360> SWFL | ANULACIÓN DE MATRÍCULA <:no:1534937767652495360>')
                    .setDescription(
                        `> Se revocó el permiso de circulación para:\n\n` +
                        `<:si:1534938142665084938> **Matrícula Removida:** \`${patente}\`\n` +
                        `<:si:1534938142665084938> **Solicitante:** <@${usuarioId}>\n\n` +
                        `*Para registrar otro auto usá \`/matricular registrar\`.*`
                    )
                    .setColor('#74d4fc')
                    .setFooter({ text: 'Bajas del Sistema de Tránsito' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embedRemover] });
            } catch (error) {
                console.error('Error borrando vehículo:', error);
                return await interaction.editReply({ content: 'Hubo un error interno al remover el vehículo.' });
            }
        }

        if (subcomando === 'reiniciar') {
            const esAltoMando =
                interaction.member.roles.cache.has(ROL_ALTO_MANDO) ||
                interaction.member.permissions.has(PermissionFlagsBits.Administrator);

            if (!esAltoMando) {
                return await interaction.editReply({
                    content: '<:cruz:1534937767652495360> **Acceso denegado.** Solo **Alto Mando** puede reiniciar todas las matriculaciones.'
                });
            }

            const confirmacion = interaction.options.getString('confirmacion')?.trim().toUpperCase();
            if (confirmacion !== 'REINICIAR') {
                return await interaction.editReply({
                    content:
                        '<:cruz:1534937767652495360> Para confirmar, en **confirmacion** escribí exactamente: `REINICIAR`\n\n' +
                        '⚠️ Esto borra **todas** las patentes de **todos** los jugadores.'
                });
            }

            const total = await Vehiculo.countDocuments({});
            if (total === 0) {
                return await interaction.editReply({
                    content: '<a:verificacion:1534940142823804969> No hay vehículos registrados. Nada que borrar.'
                });
            }

            const embedConfirm = new EmbedBuilder()
                .setTitle('⚠️ Confirmar reinicio de matriculaciones')
                .setColor('#ed4245')
                .setDescription(
                    `Estás a punto de **borrar permanentemente** todas las matriculaciones.\n\n` +
                    `> **Vehículos a eliminar:** **${total}**\n` +
                    `> **Ejecutado por:** <@${interaction.user.id}>\n\n` +
                    `Tenés **30 segundos** para confirmar.`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('matricular_reiniciar_si')
                    .setLabel('Sí, borrar todo')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('matricular_reiniciar_no')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await interaction.editReply({ embeds: [embedConfirm], components: [row] });

            try {
                const clicked = await msg.awaitMessageComponent({
                    componentType: ComponentType.Button,
                    time: 30_000,
                    filter: i => i.user.id === interaction.user.id
                });

                if (clicked.customId === 'matricular_reiniciar_no') {
                    await clicked.update({
                        content: '<:cruz:1534937767652495360> Reinicio **cancelado**.',
                        embeds: [],
                        components: []
                    });
                    return;
                }

                await clicked.deferUpdate();
                const resultado = await Vehiculo.deleteMany({});
                const borrados = resultado.deletedCount || 0;

                const embedOk = new EmbedBuilder()
                    .setTitle('<:tilde:1534937809733812286> Matriculaciones reiniciadas')
                    .setColor('#57f287')
                    .setDescription(
                        `Se eliminaron **${borrados}** vehículo(s).\n\n` +
                        `> Todos los perfiles quedan **sin vehículos**.\n` +
                        `**Ejecutado por:** <@${interaction.user.id}>`
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embedOk], components: [] });
            } catch {
                await interaction.editReply({
                    content: '⏰ Tiempo agotado. Reinicio **cancelado**.',
                    embeds: [],
                    components: []
                }).catch(() => null);
            }
        }
    }
};
