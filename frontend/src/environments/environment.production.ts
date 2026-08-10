export const environment = {
  production: true,
  demo: false,
  demoMode: false,
  gallery: {
    useLocalRepository: false,
    seedOnFirstRun: false
  },
  blog: {
    useLocalRepository: false,
    seedOnFirstRun: false,
    demoAdminEmail: '',
    demoAdminPassword: '',
    embeddingModelId: 'Xenova/all-MiniLM-L6-v2',
    localModelPath: '/assets/models/',
    embeddingDtype: 'q8' as const
  }
};
