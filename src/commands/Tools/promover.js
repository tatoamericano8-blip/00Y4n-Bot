import { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { programarRefreshClasificacion } from '../../utils/clasificacionStaffLive.js';

const ROLES_STAFF = {
    staff_aprendiz: {
        id: '1525910197934100510',
        nombre: 'Staff Aprendiz',
        extras: ['1512120103771050005', '1528870664612614184'] // 00Y4n Staff + Bajo Comando
    },
    junior_staff: {
        id: '1511139104912441434',
        nombre: 'Junior Staff',
        extras: []
    },
    server_staff: {
        id: '1498822180920889436',
        nombre: 'Server Staff',
        extras: []
    },
    senior_staff: {
        id: '1523834523077447811',
        nombre: 'Senior Staff',
        extras: []
    },
    lider_staff: {
        id: '1528871575581884477',
        nombre: 'Líder de Staff',
        extras: []
    }
};

export default {
    data: {
        name: 'promover',
        description: 'Ascender a un miembro del Staff',
        options: [
            {
                name: 'usuario',
                description: 'Selecciona al miembro del staff que deseas ascender.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'rango',
                description: 'Selecciona el nuevo rol/rango de staff.',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Staff Aprendiz', value: 'staff_aprendiz' },
                    { name: 'Junior Staff', value: 'junior_staff' },
                    { name: 'Server Staff', value: 'server_staff' },
                    { name: 'Senior Staff', value: 'senior_staff' },
                    { name: 'Líder de Staff', value: 'lider_staff' }
                ]
            },
            {
                name: 'razon',
                description: 'Razón o motivo del ascenso.',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'notas',
                description: 'Notas adicionales sobre el desempeño o registro.',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },

    async execute(interaction) {
        const ROL_ALTO_COMANDO = '1528870731629465752';
        if (!interaction.member.roles.cache.has(ROL_ALTO_COMANDO)) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> Solo **Alto Comando** puede usar `/promover`.',
                flags: MessageFlags.Ephemeral
            });
        }

        const usuario = interaction.options.getUser('usuario');
        const rangoKey = interaction.options.getString('rango');
        const configRango = ROLES_STAFF[rangoKey];

        const razon =
            interaction.options.getString('razon') ||
            'Desempeño destacado y cumplimiento de objetivos.';
        const notas =
            interaction.options.getString('notas') || 'Ninguna nota adicional.';

        if (!usuario) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> No se pudo obtener el usuario seleccionado. Intentá de nuevo.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (!configRango) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> Rango de staff inválido. Seleccioná una de las opciones disponibles.',
                flags: MessageFlags.Ephemeral
            });
        }

        const miembroTarget = await interaction.guild.members.fetch(usuario.id).catch(() => null);
        if (!miembroTarget) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> No se encontró a ese miembro en el servidor.',
                flags: MessageFlags.Ephemeral
            });
        }

        const idsAAsignar = [configRango.id, ...configRango.extras];
        const rolesAAsignar = [];

        for (const roleId of idsAAsignar) {
            const rol = await interaction.guild.roles.fetch(roleId).catch(() => null);
            if (!rol) {
                return interaction.reply({
                    content: `<:cruz00y4n:1534937767652495360> No se encontró el rol configurado (\`${roleId}\`). Revisá que exista en el servidor.`,
                    flags: MessageFlags.Ephemeral
                });
            }
            if (rol.managed) {
                return interaction.reply({
                    content:
                        '<:cruz00y4n:1534937767652495360> Ese rol es gestionado por una integración y no se puede asignar manualmente.',
                    flags: MessageFlags.Ephemeral
                });
            }
            rolesAAsignar.push(rol);
        }

        const nuevoRol = rolesAAsignar[0];
        const botMember = interaction.guild.members.me;

        for (const rol of rolesAAsignar) {
            if (botMember && rol.position >= botMember.roles.highest.position) {
                return interaction.reply({
                    content:
                        '<:cruz00y4n:1534937767652495360> No puedo asignar ese rol: está al mismo nivel o por encima del rol más alto del bot. Subí el rol del bot en la lista de roles.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const esOwner = interaction.guild.ownerId === interaction.user.id;
            if (!esOwner && interaction.member.roles.highest.position <= rol.position) {
                return interaction.reply({
                    content:
                        '<:cruz00y4n:1534937767652495360> No podés asignar un rol igual o superior al tuyo en la jerarquía.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (miembroTarget.roles.cache.has(nuevoRol.id)) {
            return interaction.reply({
                content: `<:cruz00y4n:1534937767652495360> <@${usuario.id}> ya tiene el rol **${nuevoRol.name}**.`,
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const rolesPendientes = rolesAAsignar.filter(
                (r) => !miembroTarget.roles.cache.has(r.id)
            );

            if (rolesPendientes.length > 0) {
                await miembroTarget.roles.add(
                    rolesPendientes,
                    `Ascenso por ${interaction.user.tag}: ${razon}`
                );
            }

            try {
                await Staff.findOneAndUpdate(
                    { guildId: interaction.guildId, userId: usuario.id },
                    {
                        $set: {
                            rango: configRango.nombre,
                            estado: 'ACTIVO',
                            'loa.activo': false
                        },
                        $setOnInsert: {
                            guildId: interaction.guildId,
                            userId: usuario.id,
                            cuotas: {
                                horasServicio: 0,
                                sesionesOrganizadas: 0,
                                sesionesSupervisadas: 0,
                                ticketsCerrados: 0
                            },
                            estadisticasHistoricas: {
                                horasTotales: 0,
                                sesionesHosteadasTotales: 0,
                                sesionesSupervisadasTotales: 0,
                                ticketsCerradosTotales: 0
                            },
                            rachaActual: 0,
                            rachaMaxima: 0
                        }
                    },
                    { upsert: true, new: true }
                );
                programarRefreshClasificacion(interaction.client, interaction.guildId);
            } catch (e) {
                console.error('[promover] Staff DB / clasificacion:', e?.message || e);
            }

            const extrasTexto =
                configRango.extras.length > 0
                    ? `\n+ roles adicionales: ${rolesAAsignar
                          .slice(1)
                          .map((r) => r.toString())
                          .join(', ')}`
                    : '';

            const embedPromote = new EmbedBuilder()
                .setTitle('<a:caram00y4nmov:1534954409145008269> ASCENSO DE STAFF')
                .setDescription(
                    '> Se ha registrado un ascenso oficial dentro del equipo administrativo.'
                )
                .addFields(
                    {
                        name: '👤 Staff Ascendido',
                        value: `<@${usuario.id}> (\`${usuario.tag}\`)`,
                        inline: true
                    },
                    {
                        name: '🎖️ Nuevo Rango',
                        value: `${nuevoRol}${extrasTexto}`,
                        inline: true
                    },
                    {
                        name: '🛡️ Responsable',
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    },
                    {
                        name: '📋 Razón del Ascenso',
                        value: `\`\`\`${razon}\`\`\``,
                        inline: false
                    },
                    {
                        name: '📝 Notas Adicionales',
                        value: `\`\`\`${notas}\`\`\``,
                        inline: false
                    }
                )
                .setColor('#FB8B66')
                .setThumbnail(usuario.displayAvatarURL({ size: 256 }))
                .setTimestamp();

            await interaction.reply({
                content: '<:tilde:1534937809733812286> Ascenso registrado.',
                flags: MessageFlags.Ephemeral
            });
            await interaction.channel.send({ embeds: [embedPromote] });

            try {
                const embedDM = new EmbedBuilder()
                    .setTitle('<a:confeti:1534940499759206512> ¡Felicidades por tu Ascenso!')
                    .setDescription(
                        `Has recibido un nuevo rango en **${interaction.guild.name}**.`
                    )
                    .addFields(
                        {
                            name: 'Rango Otorgado',
                            value: nuevoRol.name,
                            inline: true
                        },
                        { name: 'Motivo', value: razon, inline: false }
                    )
                    .setColor('#FB8B66')
                    .setTimestamp();

                await usuario.send({ embeds: [embedDM] });
            } catch (_) {}
        } catch (error) {
            console.error('Error al ejecutar /promover:', error);
            const msg =
                interaction.replied || interaction.deferred
                    ? interaction.followUp.bind(interaction)
                    : interaction.reply.bind(interaction);
            return msg({
                content:
                    '<:cruz00y4n:1534937767652495360> Hubo un error al intentar asignar el rol al miembro. Revisá la jerarquía de roles del bot.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
