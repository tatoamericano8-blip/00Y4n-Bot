export default {
  id: 'cancelar_reset_economia',
  customId: 'cancelar_reset_economia',
  name: 'cancelar_reset_economia',
  
  async execute(interaction, client) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  }
};
