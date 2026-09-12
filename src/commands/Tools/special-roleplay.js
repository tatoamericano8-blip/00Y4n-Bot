import { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } from 'discord.js';

const ROL_ALTO_COMANDO = '1528870731629465752';

const ROLEPLAYS = {
  realista: {
    name: 'Roleplay realista',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1548141457414684692/Roleplay_Realista.png?ex=6aa5fa96&is=6aa4a916&hm=893c7b16cb993439cb29a604c6fdfb8ca222be3701596e36b9f2f94c7a4ee83d&'
  },
  reino_unido: {
    name: 'Reino Unido Roleplay',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1548141459583008788/Reino_unido_Roleplay.jpg?ex=6aa5fa97&is=6aa4a917&hm=8b3eac31d1b4d04fb5003c61dff02647cd9544590c05fd24b72144a43bdfa2fd&'
  },
  funeral: {
    name: 'Funeral Roleplay',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1548141459239338094/Funeral_Roleplay.jpg?ex=6aa5fa96&is=6aa4a916&hm=4c96abf056c2772d315cd5f3dff61f41721911cd70f4d09f9c7af6dfea38b6f7&'
  },
  cars_coffee: {
    name: "Cars & Coffee",
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1548141458731573321/Cars__Coffe.jpg?ex=6aa5fa96&is=6aa4a916&hm=ae0b66774826c38db1a15bb999dd2919ecda254eed616fc303663e7a1cb109f4&'
  },
  ano_2000s: {
    name: "Roleplay Año 2000's",
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1548141459868360776/ROLEPLAY_ANO_2000s.jpg?ex=6aa5fa97&is=6aa4a917&hm=c3e220e669974dcffb0657379b67f3b12e587990eb3bfdaf23ca4cefa41fd50e&'
  },
  area_centro: {
    name: 'Area RP Centro',
    image:
      'https://cdn.discordapp.com/attachments/1505017301089652898/1548141458261807104/AREA_RP_Centro.jpg?ex=6aa5fa96&is=6aa4a916&hm=29110bd474f00d81ef14cba692decc9a67f239fbc442833ec913d12756ab05a8&'
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
    if (!interaction.member.roles.cache.has(ROL_ALTO_COMANDO)) {
      return interaction.reply({
        content: 'Solo **Alto Comando** puede anunciar roleplays especiales.',
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
