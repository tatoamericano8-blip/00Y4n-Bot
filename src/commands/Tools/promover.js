import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

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
                description: 'Selecciona el nuevo rol/rango que se le asignará.',
                type: ApplicationCommandOptionType.Role,
                required: true
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
        let nuevoRol = interaction.options.getRole('rango');

        if (!nuevoRol) {
            const rankOpt = interaction.options.get('rango');
            if (rankOpt?.value) {
                nuevoRol = await interaction.guild.roles.fetch(String(rankOpt.value)).catch(() => null);
            }
        }

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

        if (!nuevoRol) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> No se pudo obtener la información del rol seleccionado. Intentá seleccionarlo de nuevo.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (nuevoRol.managed) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> Ese rol es gestionado por una integración y no se puede asignar manualmente.',
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

        const botMember = interaction.guild.members.me;
        if (botMember && nuevoRol.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> No puedo asignar ese rol: está al mismo nivel o por encima del rol más alto del bot. Subí el rol del bot en la lista de roles.',
                flags: MessageFlags.Ephemeral
            });
        }

        const esOwner = interaction.guild.ownerId === interaction.user.id;
        if (
            !esOwner &&
            interaction.member.roles.highest.position <= nuevoRol.position
        ) {
            return interaction.reply({
                content:
                    '<:cruz00y4n:1534937767652495360> No podés asignar un rol igual o superior al tuyo en la jerarquía.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (miembroTarget.roles.cache.has(nuevoRol.id)) {
            return interaction.reply({
                content: `<:cruz00y4n:1534937767652495360> <@${usuario.id}> ya tiene el rol **${nuevoRol.name}**.`,
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await miembroTarget.roles.add(nuevoRol, `Ascenso por ${interaction.user.tag}: ${razon}`);

            const embedPromote = new EmbedBuilder()
                .setTitle('<a:caram00y4nmov:1534954409145008269> ASCENSO DE STAFF')
                .setDescription('> Se ha registrado un ascenso oficial dentro del equipo administrativo.')
                .addFields(
                    {
                        name: '👤 Staff Ascendido',
                        value: `<@${usuario.id}> (\`${usuario.tag}\`)`,
                        inline: true
                    },
                    { name: '🎖️ Nuevo Rango', value: `${nuevoRol}`, inline: true },
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
                    .setDescription(`Has recibido un nuevo rango en **${interaction.guild.name}**.`)
                    .addFields(
                        { name: 'Rango Otorgado', value: `${nuevoRol.name}`, inline: true },
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
