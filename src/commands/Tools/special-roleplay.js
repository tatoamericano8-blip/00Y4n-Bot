import { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } from 'discord.js';

const ROL_ALTO_COMANDO = '1528870731629465752';

const ROLEPLAYS = {
  realista: {
    name: 'Roleplay realista',
    image:
      'https://media.discordapp.net/attachments/1505017301089652898/1561892745369362474/Gemini_Generated_Image_z6snbmz6snbmz6sn.jfif?ex=6ad80179&is=6ad6aff9&hm=f683a94d958f024345b87c4c4d8a0b330513921ba20195eb727ff73da0454705&=&format=webp'
  },
  reino_unido: {
    name: 'Reino Unido Roleplay',
    image:
      'https://media.discordapp.net/attachments/1505017301089652898/1561892744316584026/Gemini_Generated_Image_ezckd0ezckd0ezck.jfif?ex=6ad80178&is=6ad6aff8&hm=f82687604352a6ce29355222755d87a59cb07b700d40cb72d62f0d9851e395ab&=&format=webp'
  },
  funeral: {
    name: 'Funeral Roleplay',
    image:
      'https://media.discordapp.net/attachments/1505017301089652898/1561884673162874890/hgatU.jpg?ex=6ad7f9f4&is=6ad6a874&hm=a254da83906db5b760429776433b603475c07175ef9a552106ab4a31f5733988&=&format=webp'
  },
  cars_coffee: {
    name: "Cars & Coffee",
    image:
      'https://media.discordapp.net/attachments/1505017301089652898/1561892744836812860/Gemini_Generated_Image_nscwyonscwyonscw.jfif?ex=6ad80178&is=6ad6aff8&hm=5595fdcf2c66fccfed1744c6dec3ece026ce7c82c5ae07a7ad988f41ce79890e&=&format=webp'
  },
  ano_2000s: {
    name: "Roleplay Año 2000's",
    image:
      'https://media.discordapp.net/attachments/1505017301089652898/1561884702795898910/19zs8.jpg?ex=6ad7f9fb&is=6ad6a87b&hm=888c2f9f13377f707e6e3fb5f9305478670c6cd6606c3cbcfb2f17da0a2ad50c&=&format=webp'
  },
  area_centro: {
    name: 'Area RP Centro',
    image:
      'https://media.discordapp.net/attachments/1505017301089652898/1561892745369362474/Gemini_Generated_Image_z6snbmz6snbmz6sn.jfif?ex=6ad80179&is=6ad6aff9&hm=f683a94d958f024345b87c4c4d8a0b330513921ba20195eb727ff73da0454705&=&format=webp'
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
