export default {
  id: 'reclamar_oportunidad',
  customId: 'reclamar_oportunidad',
  name: 'reclamar_oportunidad',
  
  async execute(interaction, client) {
    // La lógica de la economía y la edición del embed la maneja el Collector en gestorOportunidades.js.
    // Este bloque asegura que si la interacción no fue respondida, no quede "pensando".
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  },

  async run(client, interaction) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  }
};
