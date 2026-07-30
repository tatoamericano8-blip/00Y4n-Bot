export default {
  id: 'confirmar_reset_economia',
  customId: 'confirmar_reset_economia',
  name: 'confirmar_reset_economia',
  
  async execute(interaction, client) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  }
};
