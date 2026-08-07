import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';


export const routes: Routes = [


  {
    path: '',

    component: PublicLayoutComponent,

    children: [

      {
        path: '',

        loadComponent: () =>
          import('./pages/home/home.component')
            .then(m => m.HomeComponent)

      },
      {
        path:'services/:slug',
        
        loadComponent:()=> 
        import('./pages/service-detail/service-detail.component')
        .then(m=>m.ServiceDetailComponent)
        
        },

      {
        path: 'about',

        loadComponent: () =>
          import('./pages/about/about.component')
            .then(m => m.AboutComponent)

      },


      {
        path: 'services',

        loadComponent: () =>
          import('./pages/services/services.component')
            .then(m => m.ServicesComponent)

      },


      {
        path: 'gallery',

        loadComponent: () =>
          import('./pages/gallery/gallery.component')
            .then(m => m.GalleryComponent)

      },


      {
        path: 'resources',

        loadComponent: () =>
          import('./pages/resources/resources.component')
            .then(m => m.ResourcesComponent)

      },


      {
        path: 'contact',

        loadComponent: () =>
          import('./pages/contact/contact.component')
            .then(m => m.ContactComponent)

      },


      {
        path: 'privacy-policy',

        loadComponent: () =>
          import('./pages/privacy-policy/privacy-policy.component')
            .then(m => m.PrivacyPolicyComponent)

      },


      {
        path: 'terms',

        loadComponent: () =>
          import('./pages/terms/terms.component')
            .then(m => m.TermsComponent)

      },
      {
        path: '**',
        loadComponent: () =>
        import('./pages/not-found/not-found.component')
        .then(
        component => component.NotFoundComponent
        )
       }
    ]

  },


  {
    path: '**',

    redirectTo: ''

  }


];