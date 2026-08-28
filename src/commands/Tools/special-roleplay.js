import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

const ROL_STAFF = '1512120103771050005';

const ROLEPLAYS = {
  realista: {
    name: 'Roleplay realista',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1543016291760210040/Roleplay_Realista_1.png'
  },
  reino_unido: {
    name: 'Reino Unido Roleplay',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1543015950570229870/Reino_unido_Roleplay.png'
  },
  funeral: {
    name: 'Funeral Roleplay',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1543015949249286144/Funeral_Roleplay.png'
  },
  cars_coffee: {
    name: "Cars & Coffee",
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1543015948590518282/Cars__Coffe.png'
  },
  ano_2000s: {
    name: "Roleplay Año 2000's",
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1543015946707542036/Roleplay_Ano_200s.png'
  },
  area_centro: {
    name: 'Area RP Centro',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1543015947814576209/Area_RP_Centro.png'
  }
};

export default {
  data: {
    name: 'special-roleplay',
    description: 'Anuncia un roleplay especial con su imagen correspondiente.',
    options: [
      {
        name: 'roleplay',
        description: 'Tipo de roleplay especial a anunciar.',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'Roleplay realista', value: 'realista' },
          { name: 'Reino Unido Roleplay', value: 'reino_unido' },
          { name: 'Funeral Roleplay', value: 'funeral' },
          { name: 'Cars & Coffee', value: 'cars_coffee' },
          { name: "Roleplay Año 2000's", value: 'ano_2000s' },
          { name: 'Area RP Centro', value: 'area_centro' }
        ]
      }
    ]
  },

  async execute(interaction) {
    const puede =
      interaction.member.roles.cache.has(ROL_STAFF) ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!puede) {
      return interaction.reply({
        content: 'Solo el **Staff 00Y4n** puede anunciar roleplays especiales.',
        flags: MessageFlags.Ephemeral
      });
    }

    const key = interaction.options.getString('roleplay');
    const rp = ROLEPLAYS[key];
    if (!rp) {
      return interaction.reply({
        content: 'Opción de roleplay inválida.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder().setColor('#74d4fc').setImage(rp.image);

    await interaction.reply({
      content: `Anuncio de **${rp.name}** publicado.`,
      flags: MessageFlags.Ephemeral
    });

    await interaction.channel.send({
      content: '@everyone',
      embeds: [embed],
      allowedMentions: { parse: ['everyone'] }
    });
  }
};
