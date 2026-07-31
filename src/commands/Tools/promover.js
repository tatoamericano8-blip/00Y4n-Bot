import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

export default {
    data: {
        name: 'promote',
        description: 'Promueve a un miembro del Staff',
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

    async execute(interaction, guildConfig, client) {
        // 1. Verificación de permisos de quien ejecuta el comando
        const permissions = interaction.memberPermissions || interaction.member?.permissions;
        if (!permissions?.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> No tienes permisos suficientes (**Administrar Roles**) para utilizar este comando.',
                flags: MessageFlags.Ephemeral
            });
        }

        const usuario = interaction.options.getUser('user');
        const nuevoRol = interaction.options.getRole('rank');
        const razon = interaction.options.getString('reason') || 'Desempeño destacado y cumplimiento de objetivos.';
        const notas = interaction.options.getString('notes') || 'Ninguna nota adicional.';

        if (!nuevoRol) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> No se pudo obtener la información del rol seleccionado.',
                flags: MessageFlags.Ephemeral
            });
        }

        const miembroTarget = await interaction.guild.members.fetch(usuario.id).catch(() => null);

        if (!miembroTarget) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> No se encontró al usuario en este servidor.',
                flags: MessageFlags.Ephemeral
            });
        }

        // 2. Obtener los datos del Bot en el servidor de forma asíncrona (Evita error null en Render)
        const botMember = await interaction.guild.members.fetchMe().catch(() => null);

        if (!botMember) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> Error al consultar los permisos del bot en el servidor.',
                flags: MessageFlags.Ephemeral
            });
        }

        // 3. Comprobar jerarquía del rol del Bot
        if (nuevoRol.position >= botMember.roles.highest.position) {
            return await interaction.reply({
                content: `<:cruz00y4n:1523041302764191844> No puedo otorgar el rol ${nuevoRol} porque está ubicado por encima o en el mismo nivel que mi rol más alto.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // 4. Comprobar si el usuario ya tiene el rol
        if (miembroTarget.roles.cache.has(nuevoRol.id)) {
            return await interaction.reply({
                content: `<:warn00y4n:1523041352714158240> <@${usuario.id}> ya posee el rol ${nuevoRol}.`,
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Asignar el nuevo rango/rol
            await miembroTarget.roles.add(nuevoRol);

            // 5. Armar el Embed del Registro de Ascenso
            const embedPromote = new EmbedBuilder()
                .setTitle('<a:caram00y4nmov:1523026579662307378> ASCENSO DE STAFF')
                .setDescription(`> Se ha registrado un ascenso oficial dentro del equipo administrativo.`)
                .addFields(
                    { name: '👤 Staff Ascendido', value: `<@${usuario.id}> (\`${usuario.tag}\`)`, inline: true },
                    { name: '🎖️ Nuevo Rango', value: `${nuevoRol}`, inline: true },
                    { name: '🛡️ Responsable', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📋 Razón del Ascenso', value: `\`\`\`${razon}\`\`\``, inline: false },
                    { name: '📝 Notas Adicionales', value: `\`\`\`${notas}\`\`\``, inline: false }
                )
                .setColor('#74d4fc')
                .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `${interaction.guild.name} • Gestión de Staff`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embedPromote] });

            // 6. Notificación por mensaje privado al usuario ascendido
            try {
                const embedDM = new EmbedBuilder()
                    .setTitle('<a:si:1523026892981145600> ¡Felicidades por tu Ascenso!')
                    .setDescription(`Has recibido un nuevo rango en **${interaction.guild.name}**.`)
                    .addFields(
                        { name: 'Rango Otorgado', value: `${nuevoRol.name}`, inline: true },
                        { name: 'Motivo', value: razon, inline: false }
                    )
                    .setColor('#74d4fc')
                    .setTimestamp();

                await usuario.send({ embeds: [embedDM] });
            } catch (dmErr) {
                // Si el usuario tiene los DMs cerrados, se ignora silenciosamente
            }

        } catch (error) {
            console.error('Error al ejecutar /promote:', error);
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> Hubo un error al intentar asignar el rol al miembro.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
