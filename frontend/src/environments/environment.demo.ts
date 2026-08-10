export const environment = {
  production: false,
  demo: true,
  demoMode: true,
  blog: {
    useLocalRepository: true,
    seedOnFirstRun: true,
    demoAdminEmail: 'admin@austinsurfacepros.demo',
    demoAdminPassword: 'SurfaceProsDemo!',
    embeddingModelId: 'Xenova/all-MiniLM-L6-v2',
    localModelPath: '/assets/models/',
    embeddingDtype: 'q8' as const
  }
} as const;
